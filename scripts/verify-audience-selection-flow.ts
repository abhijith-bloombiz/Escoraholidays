import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  connectDB,
  disconnectDB,
  CampaignModel,
  AudienceGroupModel,
  EnquiryModel,
  OrderModel,
  SubscriberConsentModel,
  getNextSequence,
} from "../lib/db/src/index";
import {
  resolveAudience,
  createCampaign,
  updateCampaign,
  sendCampaign,
  previewCampaignAudience,
} from "../apps/api-server/src/services/campaign-service";
import { setResendClientForTesting } from "../apps/api-server/src/lib/email";
import { config } from "../apps/api-server/src/config/env";
import { CreateCampaignBody, UpdateCampaignBody } from "../lib/api-zod/src/index";

// Load .env
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${config.port || 8080}`;
const ADMIN_USER = process.env.ADMIN_USERNAME || process.env.ADMIN_USER || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";
const RUN_ID = Date.now().toString().slice(-6);

interface TestResult {
  scenario: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function pass(scenario: string, details: string) {
  results.push({ scenario, passed: true, details });
  console.log(`  [PASS] ${scenario}`);
  console.log(`         ↳ ${details}`);
}

function fail(scenario: string, details: string) {
  results.push({ scenario, passed: false, details });
  console.error(`  [FAIL] ${scenario}`);
  console.error(`         ↳ ERROR: ${details}\n`);
}

async function loginAdmin(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Admin login failed with HTTP ${res.status}`);
  }
  const cookie = res.headers.get("set-cookie");
  if (!cookie) {
    throw new Error("No session cookie received from login");
  }
  return cookie;
}

async function run() {
  console.log("\n================================================================================");
  console.log("ESCORA CAMPAIGN AUDIENCE SELECTION — COMPLETE REGRESSION VERIFICATION SUITE");
  console.log("================================================================================\n");

  await connectDB();

  let adminCookie = "";
  try {
    adminCookie = await loginAdmin();
    pass("Admin Login", "Authenticated successfully and acquired session cookie");
  } catch (err: any) {
    fail("Admin Login", err.message);
    process.exit(1);
  }

  // Ensure campaignSendingEnabled is true during test run
  config.campaignSendingEnabled = true;

  // ── Seed Contacts for Audience Resolution ──────────────────────────────────
  const eqConsentEmail = `aud_enq_consent_${RUN_ID}@example.com`;
  const eqNoConsentEmail = `aud_enq_noconsent_${RUN_ID}@example.com`;
  const guestConsentEmail = `aud_guest_consent_${RUN_ID}@example.com`;
  const guestNoConsentEmail = `aud_guest_noconsent_${RUN_ID}@example.com`;
  const subOnlyEmail = `aud_sub_only_${RUN_ID}@example.com`;
  const subSuppressedEmail = `aud_sub_suppressed_${RUN_ID}@example.com`;
  const grpMemberEmail = `aud_grp_member_${RUN_ID}@example.com`;

  // Seed Enquiries
  await EnquiryModel.create({
    id: await getNextSequence("enquiries"),
    name: "Enquiry Guest With Consent",
    email: eqConsentEmail,
    phone: "+91 98765 00001",
    destinations: "Munnar",
    message: "Interested in slow luxury Munnar journey",
    status: "new",
  });
  await EnquiryModel.create({
    id: await getNextSequence("enquiries"),
    name: "Enquiry Guest No Consent",
    email: eqNoConsentEmail,
    phone: "+91 98765 00002",
    destinations: "Alleppey",
    message: "Interested in Alleppey backwaters",
    status: "new",
  });

  // Seed Bookings/Orders
  await OrderModel.create({
    id: await getNextSequence("orders"),
    guestName: "Confirmed Guest With Consent",
    guestEmail: guestConsentEmail,
    guestPhone: "+91 98765 00003",
    status: "confirmed",
    destinations: "Munnar, Thekkady",
    totalAmount: 45000,
  });
  await OrderModel.create({
    id: await getNextSequence("orders"),
    guestName: "Confirmed Guest No Consent",
    guestEmail: guestNoConsentEmail,
    guestPhone: "+91 98765 00004",
    status: "confirmed",
    destinations: "Alleppey Houseboat",
    totalAmount: 35000,
  });

  // Seed Subscriber Consents
  await SubscriberConsentModel.create({
    email: eqConsentEmail,
    name: "Enquiry Guest With Consent",
    subscribed: true,
    status: "subscribed",
    token: crypto.randomBytes(16).toString("hex"),
    source: "website_form",
    consentDate: new Date(),
  });
  await SubscriberConsentModel.create({
    email: guestConsentEmail,
    name: "Confirmed Guest With Consent",
    subscribed: true,
    status: "subscribed",
    token: crypto.randomBytes(16).toString("hex"),
    source: "booking_optin",
    consentDate: new Date(),
  });
  await SubscriberConsentModel.create({
    email: subOnlyEmail,
    name: "Pure Subscriber With Consent",
    subscribed: true,
    status: "subscribed",
    token: crypto.randomBytes(16).toString("hex"),
    source: "newsletter",
    consentDate: new Date(),
  });
  await SubscriberConsentModel.create({
    email: subSuppressedEmail,
    name: "Suppressed Subscriber",
    subscribed: true,
    status: "suppressed",
    suppressed: true,
    suppressionReason: "manual_complaint",
    token: crypto.randomBytes(16).toString("hex"),
    source: "newsletter",
  });
  await SubscriberConsentModel.create({
    email: grpMemberEmail,
    name: "Audience Group Member With Consent",
    subscribed: true,
    status: "subscribed",
    token: crypto.randomBytes(16).toString("hex"),
    source: "vip_consent",
    consentDate: new Date(),
  });

  // Seed Audience Group
  const testGroupId = await getNextSequence("audience_groups");
  const testGroup = await AudienceGroupModel.create({
    id: testGroupId,
    name: `Test VIP Audience Group ${RUN_ID}`,
    type: "manual",
    members: [
      {
        email: grpMemberEmail,
        name: "Audience Group Member With Consent",
        source: "manual",
        addedAt: new Date(),
      },
      {
        email: eqNoConsentEmail,
        name: "Audience Group Member No Consent",
        source: "manual",
        addedAt: new Date(),
      },
    ],
    isArchived: false,
  });

  // Setup Mock Email Client for sendCampaign
  const mockSentEmails: any[] = [];
  const mockClient = {
    emails: {
      send: async (payload: any) => {
        mockSentEmails.push(payload);
        return {
          data: { id: `msg_${crypto.randomUUID()}` },
          error: null,
        };
      },
    },
  };
  setResendClientForTesting(mockClient);

  // ── Test all 5 audience options ─────────────────────────────────────────────
  const audienceOptions = [
    {
      type: "all_contacts",
      label: "All Contacts (Enquiries + Bookings)",
      expectedMinEligible: 3, // eqConsentEmail, guestConsentEmail, subOnlyEmail
      checkEligibleIncludes: [eqConsentEmail, guestConsentEmail, subOnlyEmail],
      checkExcludedIncludes: [eqNoConsentEmail, guestNoConsentEmail, subSuppressedEmail],
    },
    {
      type: "enquiries_only",
      label: "Inquiries Prospects Only",
      expectedMinEligible: 1, // eqConsentEmail
      checkEligibleIncludes: [eqConsentEmail],
      checkExcludedIncludes: [eqNoConsentEmail],
    },
    {
      type: "confirmed_guests",
      label: "Confirmed Journey Guests Only",
      expectedMinEligible: 1, // guestConsentEmail
      checkEligibleIncludes: [guestConsentEmail],
      checkExcludedIncludes: [guestNoConsentEmail],
    },
    {
      type: "subscribed_contacts",
      label: "Subscribed Contacts Only",
      expectedMinEligible: 3, // all explicitly subscribed contacts
      checkEligibleIncludes: [subOnlyEmail, eqConsentEmail, guestConsentEmail],
      checkExcludedIncludes: [],
    },
    {
      type: "audience_group",
      label: "Audience Group (Custom Segment)",
      groupId: testGroupId,
      expectedMinEligible: 1, // grpMemberEmail
      checkEligibleIncludes: [grpMemberEmail],
      checkExcludedIncludes: [eqNoConsentEmail],
    },
  ];

  for (const opt of audienceOptions) {
    console.log(`\n── Testing Option: ${opt.label} (${opt.type}) ──`);

    // 1. Zod schema validation
    const payload: any = {
      name: `Regression Campaign ${opt.type} ${RUN_ID}`,
      subject: `Special Kerala Journey for ${opt.type}`,
      previewText: "Exclusive handcrafted luxury itinerary",
      contentHtml: "<h1>Welcome</h1><p>Enjoy your escape to Munnar and Alleppey.</p>",
      targetAudience: {
        type: opt.type,
        ...(opt.groupId ? { groupId: opt.groupId, groupIds: [opt.groupId] } : {}),
      },
    };

    const zodParsed = CreateCampaignBody.safeParse(payload);
    if (!zodParsed.success) {
      fail(`Zod Validation [${opt.type}]`, JSON.stringify(zodParsed.error.issues));
    } else {
      pass(`Zod Validation [${opt.type}]`, `Successfully parsed payload with targetAudience.type="${opt.type}"`);
    }

    // 2. HTTP POST /api/campaigns creation
    let createdCampaign: any = null;
    try {
      const createRes = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json();
        throw new Error(`HTTP ${createRes.status}: ${errJson.error || JSON.stringify(errJson)}`);
      }

      createdCampaign = await createRes.json();
      assert.strictEqual(createdCampaign.targetAudience.type, opt.type);
      if (opt.groupId) {
        assert.strictEqual(createdCampaign.targetAudience.groupId, opt.groupId);
      }
      pass(
        `API Campaign Creation [${opt.type}]`,
        `HTTP 201 Created — Campaign #${createdCampaign.id} with targetAudience.type="${createdCampaign.targetAudience.type}"`
      );
    } catch (err: any) {
      fail(`API Campaign Creation [${opt.type}]`, err.message);
      continue;
    }

    // 3. Verify database persistence
    try {
      const dbDoc = await CampaignModel.findOne({ id: createdCampaign.id }).lean();
      assert.ok(dbDoc, "Campaign exists in DB");
      assert.strictEqual(dbDoc.targetAudience.type, opt.type);
      if (opt.groupId) {
        assert.strictEqual(dbDoc.targetAudience.groupId, opt.groupId);
      }
      pass(
        `Database Persistence [${opt.type}]`,
        `MongoDB document verified: targetAudience.type="${dbDoc.targetAudience.type}"`
      );
    } catch (err: any) {
      fail(`Database Persistence [${opt.type}]`, err.message);
    }

    // 4. HTTP GET /api/campaigns/:id read-back
    try {
      const getRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaign.id}`, {
        headers: { Cookie: adminCookie },
      });
      if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
      const fetched = await getRes.json();
      assert.strictEqual(fetched.targetAudience.type, opt.type);
      pass(`API Read-back [${opt.type}]`, `Retrieved Campaign #${fetched.id} with correct targetAudience`);
    } catch (err: any) {
      fail(`API Read-back [${opt.type}]`, err.message);
    }

    // 5. HTTP PUT /api/campaigns/:id update
    try {
      const updatePayload = {
        name: `Updated Campaign ${opt.type} ${RUN_ID}`,
        subject: `Updated Subject for ${opt.type}`,
        targetAudience: {
          type: opt.type,
          ...(opt.groupId ? { groupId: opt.groupId, groupIds: [opt.groupId] } : {}),
        },
      };

      const updateRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify(updatePayload),
      });

      if (!updateRes.ok) {
        const errJson = await updateRes.json();
        throw new Error(`HTTP ${updateRes.status}: ${errJson.error || JSON.stringify(errJson)}`);
      }

      const updated = await updateRes.json();
      assert.strictEqual(updated.name, updatePayload.name);
      assert.strictEqual(updated.targetAudience.type, opt.type);
      pass(`API Update [${opt.type}]`, `Successfully updated Campaign #${updated.id} preserving audience type`);
    } catch (err: any) {
      fail(`API Update [${opt.type}]`, err.message);
    }

    // 6. Audience Estimate API (POST /api/campaigns/audience-estimate)
    try {
      const estimateRes = await fetch(`${API_BASE_URL}/api/campaigns/audience-estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          targetAudience: {
            type: opt.type,
            ...(opt.groupId ? { groupId: opt.groupId, groupIds: [opt.groupId] } : {}),
          },
        }),
      });

      if (!estimateRes.ok) {
        const errJson = await estimateRes.json();
        throw new Error(`HTTP ${estimateRes.status}: ${errJson.error}`);
      }

      const estimate = await estimateRes.json();
      assert.ok(estimate.totalSelected >= opt.expectedMinEligible, `totalSelected (${estimate.totalSelected}) >= min`);
      assert.ok(estimate.eligibleRecipients >= opt.expectedMinEligible, `eligibleRecipients >= min`);
      pass(
        `Audience Estimate Endpoint [${opt.type}]`,
        `Resolved ${estimate.totalSelected} total contacts, ${estimate.eligibleRecipients} eligible subscribers`
      );
    } catch (err: any) {
      fail(`Audience Estimate Endpoint [${opt.type}]`, err.message);
    }

    // 7. Audience Preview API (POST /api/campaigns/:id/audience-preview)
    try {
      const previewRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaign.id}/audience-preview`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });

      if (!previewRes.ok) {
        const errJson = await previewRes.json();
        throw new Error(`HTTP ${previewRes.status}: ${errJson.error}`);
      }

      const preview = await previewRes.json();
      assert.ok(preview.totalSelected >= opt.expectedMinEligible);
      assert.ok(preview.eligibleRecipients >= opt.expectedMinEligible);

      const sampleEmails = preview.sampleRecipients.map((r: any) => r.email.toLowerCase());
      for (const reqEmail of opt.checkEligibleIncludes) {
        assert.ok(
          sampleEmails.includes(reqEmail.toLowerCase()),
          `Sample recipients must include eligible contact ${reqEmail}`
        );
      }

      pass(
        `Audience Preview Endpoint [${opt.type}]`,
        `Preview returned ${preview.eligibleRecipients} eligible contacts with correct sample inclusions`
      );
    } catch (err: any) {
      fail(`Audience Preview Endpoint [${opt.type}]`, err.message);
    }

    // 8. Campaign Sending & Consent/Suppression Enforcement
    try {
      mockSentEmails.length = 0; // reset captured calls
      const sendResult = await sendCampaign(createdCampaign.id);

      assert.strictEqual(sendResult.status, "sent");
      assert.ok(sendResult.stats.sentCount >= opt.expectedMinEligible);

      // Verify that no excluded contacts were emailed
      const sentToEmails = mockSentEmails.map((call) => call.to.toLowerCase());
      for (const excludedEmail of opt.checkExcludedIncludes) {
        assert.ok(
          !sentToEmails.includes(excludedEmail.toLowerCase()),
          `Contact ${excludedEmail} without marketing consent was incorrectly emailed!`
        );
      }

      // Verify delivery statuses in the campaign document
      const sentCampDoc = await CampaignModel.findOne({ id: createdCampaign.id }).lean();
      assert.ok(sentCampDoc);
      for (const reqEmail of opt.checkEligibleIncludes) {
        const deliv = sentCampDoc.deliveries.find((d) => d.recipientEmail.toLowerCase() === reqEmail.toLowerCase());
        assert.ok(deliv, `Delivery item must exist for eligible contact ${reqEmail}`);
        assert.ok(
          deliv.status === "accepted" || deliv.status === "sent",
          `Expected status 'accepted' or 'sent', got '${deliv.status}'`
        );
      }

      pass(
        `Campaign Dispatch & Consent Check [${opt.type}]`,
        `Dispatched ${sendResult.stats.sentCount} emails; consent strictly enforced, 0 non-consenting recipients contacted`
      );
    } catch (err: any) {
      fail(`Campaign Dispatch & Consent Check [${opt.type}]`, err.message);
    }
  }

  // ── Test Invalid Audience Values ───────────────────────────────────────────
  console.log("\n── Testing Invalid Audience Values & Safeguards ──");

  // Invalid enum on Campaign Creation
  try {
    const invalidRes = await fetch(`${API_BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Invalid Campaign",
        subject: "Subject",
        contentHtml: "<p>Content</p>",
        targetAudience: { type: "non_existent_audience" },
      }),
    });

    assert.strictEqual(invalidRes.status, 400);
    const errJson = await invalidRes.json();
    assert.ok(
      errJson.error.includes("invalid_enum_value") || errJson.error.includes("Invalid enum value"),
      `Expected invalid_enum_value error, got: ${errJson.error}`
    );
    pass("Invalid Audience on Create", `Rejected with HTTP 400 & clear Zod invalid_enum_value message`);
  } catch (err: any) {
    fail("Invalid Audience on Create", err.message);
  }

  // Invalid enum on Audience Estimate
  try {
    const invalidEstRes = await fetch(`${API_BASE_URL}/api/campaigns/audience-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        targetAudience: { type: "invalid_audience_type" },
      }),
    });

    assert.strictEqual(invalidEstRes.status, 400);
    const errJson = await invalidEstRes.json();
    assert.strictEqual(errJson.code, "INVALID_AUDIENCE_TYPE");
    pass("Invalid Audience on Estimate", `Rejected with HTTP 400 & INVALID_AUDIENCE_TYPE code`);
  } catch (err: any) {
    fail("Invalid Audience on Estimate", err.message);
  }

  // Retired 'custom_segment' on Campaign Creation
  try {
    const retiredRes = await fetch(`${API_BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Retired Segment Campaign",
        subject: "Subject",
        contentHtml: "<p>Content</p>",
        targetAudience: { type: "custom_segment" },
      }),
    });

    assert.strictEqual(retiredRes.status, 400);
    const errJson = await retiredRes.json();
    assert.ok(
      errJson.code === "RETIRED_AUDIENCE_SEGMENT" ||
      errJson.error?.includes("invalid_enum_value") ||
      errJson.error?.includes("Invalid enum value") ||
      errJson.error?.includes("retired"),
      `Expected rejection of retired segment, got: ${JSON.stringify(errJson)}`
    );
    pass("Retired custom_segment on Create", `Rejected with HTTP 400 as disallowed audience value`);
  } catch (err: any) {
    fail("Retired custom_segment on Create", err.message);
  }

  // Cleanup testing mock client
  setResendClientForTesting(null);
  await disconnectDB();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n================================================================================");
  console.log("TEST SUMMARY");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Scenarios: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);

  if (failed > 0) {
    console.error("\nSome test scenarios failed!");
    process.exit(1);
  } else {
    console.log("\nALL AUDIENCE SELECTION & RESOLUTION TESTS PASSED SUCCESSFULLY! ✓\n");
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
