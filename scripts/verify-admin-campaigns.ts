import fs from "node:fs";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  connectDB,
  disconnectDB,
  CampaignModel,
  SubscriberConsentModel,
  EnquiryModel,
  OrderModel,
  getNextSequence,
} from "../lib/db/src/index";

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

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_USER = process.env.ADMIN_USERNAME || process.env.ADMIN_USER || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";

interface AuditResult {
  id: string;
  name: string;
  category: "AUTH_SECURITY" | "AUDIENCE_CONSENT" | "APPROVAL_WORKFLOW" | "DELIVERY_DISPATCH" | "PUBLIC_OPT_OUT";
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const results: AuditResult[] = [];

function pass(id: string, name: string, category: AuditResult["category"], details?: string, durationMs?: number) {
  results.push({ id, name, category, passed: true, details, durationMs });
  const timeStr = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.log(`  [PASS] [${category}] ${id}: ${name}${timeStr}`);
  if (details) console.log(`         ↳ ${details}`);
}

function fail(id: string, name: string, category: AuditResult["category"], details?: string) {
  results.push({ id, name, category, passed: false, details });
  console.error(`  [FAIL] [${category}] ${id}: ${name}`);
  if (details) console.error(`         ↳ ERROR: ${details}\n`);
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
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie returned from login");
  }
  return setCookie.split(";")[0];
}

async function runCampaignAutomationVerification() {
  console.log("================================================================================");
  console.log("     ESCORA HOLIDAYS — CAMPAIGN AUTOMATION AUDIT SUITE (PHASE 4)                ");
  console.log("================================================================================\n");

  await connectDB();

  const testSuffix = Date.now().toString().slice(-6);
  const testEnquiryEmail = `guest.clara.${testSuffix}@example.com`;
  const testOrderEmail = `guest.marcus.${testSuffix}@example.com`;
  let createdCampaignId: number | null = null;
  let testEnquiryId: number | null = null;
  let testOrderId: number | null = null;

  try {
    // ---------------------------------------------------------------------------
    // STEP 1: Authentication & Access Safeguards
    // ---------------------------------------------------------------------------
    console.log("--------------------------------------------------------------------------------");
    console.log("Step 1: Auth Guardrails & Role Boundaries");
    console.log("--------------------------------------------------------------------------------");

    // 1a. Unauthenticated GET /api/campaigns
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        headers: { "x-test-client": "unauth-campaign" },
      });
      assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
      pass(
        "AUTH-UNAUTH-01",
        "Unauthenticated request to /api/campaigns is strictly blocked",
        "AUTH_SECURITY",
        `HTTP ${res.status} returned without disclosing marketing drafts or subscriber data`
      );
    } catch (err: any) {
      fail("AUTH-UNAUTH-01", "Unauthenticated request check failed", "AUTH_SECURITY", err.message);
    }

    // 1b. Forged session cookie
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        headers: {
          Cookie: "escora.sid=s%3Abogus_campaign_forgery.123456",
          "x-test-client": "forged-campaign",
        },
      });
      assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
      pass(
        "AUTH-FORGED-02",
        "Forged session token rejected with HTTP 401",
        "AUTH_SECURITY",
        "Cryptographic signature check successfully denied access"
      );
    } catch (err: any) {
      fail("AUTH-FORGED-02", "Forged session check failed", "AUTH_SECURITY", err.message);
    }

    // 1c. Valid Admin Login
    let adminCookie = "";
    try {
      adminCookie = await loginAdmin();
      assert.ok(adminCookie.startsWith("escora.sid="), "Valid session cookie obtained");
      pass(
        "AUTH-LOGIN-03",
        "Admin authentication succeeds and issues secure session cookie",
        "AUTH_SECURITY",
        `Authenticated as ${ADMIN_USER}`
      );
    } catch (err: any) {
      fail("AUTH-LOGIN-03", "Admin authentication failed", "AUTH_SECURITY", err.message);
      throw err;
    }

    // ---------------------------------------------------------------------------
    // STEP 2: Campaign Creation & Editorial Draft State
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 2: Campaign Creation & Default Safeguards");
    console.log("--------------------------------------------------------------------------------");

    try {
      const campaignPayload = {
        name: `Monsoon Sanctuary Privileges ${testSuffix}`,
        subject: "An invitation to Kerala's emerald rains",
        previewText: "Exclusive sanctuary privileges for our distinguished guests",
        contentHtml: `
          <h1>Dear {{name}},</h1>
          <p>The monsoon transforms the backwaters into an emerald mirror.</p>
          <p>We are delighted to reserve your suite for our {{destination}} voyage.</p>
          <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        `,
        targetAudience: {
          type: "all_contacts",
          destinations: ["Alleppey", "Munnar"],
        },
      };

      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify(campaignPayload),
      });

      assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
      const body = await res.json();
      assert.ok(typeof body.id === "number", "Campaign ID must be a number");
      assert.strictEqual(body.status, "draft", "Initial campaign status must be 'draft'");
      assert.strictEqual(body.approvedBy, null, "Campaign must not be approved initially");
      assert.strictEqual(body.approvedAt, null, "Campaign must not have approval timestamp");

      createdCampaignId = body.id;
      pass(
        "CAMPAIGN-CREATE-04",
        "Campaign draft created with initial unapproved draft state",
        "APPROVAL_WORKFLOW",
        `Created Campaign #${createdCampaignId} (${body.name})`
      );
    } catch (err: any) {
      fail("CAMPAIGN-CREATE-04", "Campaign draft creation failed", "APPROVAL_WORKFLOW", err.message);
      throw err;
    }

    // ---------------------------------------------------------------------------
    // STEP 3: Audience Segmentation & Deduplication
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 3: Audience Resolution & Cross-Channel Deduplication");
    console.log("--------------------------------------------------------------------------------");

    try {
      // Seed test enquiry
      testEnquiryId = await getNextSequence("enquiries");
      await EnquiryModel.create({
        id: testEnquiryId,
        name: "Clara Dunne",
        email: testEnquiryEmail,
        message: "Interested in Kerala slow backwater retreat",
        status: "new",
      });

      // Seed duplicate enquiry with mixed casing
      const dupEnquiryId = await getNextSequence("enquiries");
      await EnquiryModel.create({
        id: dupEnquiryId,
        name: "Clara Dunne Duplicate",
        email: testEnquiryEmail.toUpperCase(),
        message: "Duplicate enquiry for same guest",
        status: "new",
      });

      // Seed test order (confirmed guest)
      testOrderId = await getNextSequence("orders");
      await OrderModel.create({
        id: testOrderId,
        guestName: "Marcus Vance",
        guestEmail: testOrderEmail,
        guestPhone: "+91 98765 43210",
        destinations: "Alleppey",
        travelStyle: "Slow Luxury",
        status: "confirmed",
      });

      // Query audience preview
      const previewRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/audience-preview`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });

      assert.strictEqual(previewRes.status, 200, `Expected 200, got ${previewRes.status}`);
      const preview = await previewRes.json();
      assert.ok(Array.isArray(preview.sampleRecipients), "Sample recipients must be an array");
      assert.strictEqual(typeof preview.eligibleRecipients, "number", "eligibleRecipients must be a number");
      assert.strictEqual(typeof preview.activeSubscribers, "number", "activeSubscribers must be a number");

      const claraRecipients = preview.sampleRecipients.filter((r: any) => r.email.toLowerCase() === testEnquiryEmail.toLowerCase());
      const marcusRecipients = preview.sampleRecipients.filter((r: any) => r.email.toLowerCase() === testOrderEmail.toLowerCase());

      assert.strictEqual(claraRecipients.length, 1, "Duplicate emails must be deduplicated to exactly one recipient");
      assert.strictEqual(marcusRecipients.length, 1, "Confirmed booking guest must be included in audience");
      assert.ok(preview.activeSubscribers >= 2, "Active subscribers count should include both Clara and Marcus");

      pass(
        "AUDIENCE-DEDUP-05",
        "Audience resolution accurately deduplicates contacts across enquiries and orders",
        "AUDIENCE_CONSENT",
        `Resolved ${preview.eligibleRecipients} unique contacts with case-insensitive email deduplication`
      );
    } catch (err: any) {
      fail("AUDIENCE-DEDUP-05", "Audience resolution and deduplication failed", "AUDIENCE_CONSENT", err.message);
    }

    // ---------------------------------------------------------------------------
    // STEP 4: Consent Safeguards & Unsubscribe Exclusion
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 4: Strict Opt-Out & Unsubscribe Exclusion Safeguards");
    console.log("--------------------------------------------------------------------------------");

    try {
      // Explicitly mark Clara Dunne as unsubscribed in SubscriberConsentModel
      await SubscriberConsentModel.findOneAndUpdate(
        { email: testEnquiryEmail.toLowerCase() },
        {
          $set: {
            subscribed: false,
            unsubscribedAt: new Date(),
            source: "guest_opt_out_test",
          },
        },
        { upsert: true }
      );

      // Re-query audience preview
      const previewRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/audience-preview`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });

      assert.strictEqual(previewRes.status, 200);
      const preview = await previewRes.json();

      const claraItem = preview.sampleRecipients.find((r: any) => r.email.toLowerCase() === testEnquiryEmail.toLowerCase());
      assert.ok(claraItem, "Clara should be listed in audit preview");
      assert.strictEqual(claraItem.isSubscribed, false, "Clara must be flagged as isSubscribed: false");
      assert.ok(preview.unsubscribedCount >= 1, "Unsubscribed count must be at least 1");

      pass(
        "CONSENT-EXCLUDE-06",
        "Unsubscribed guest is strictly detected and excluded from active dispatch counts",
        "AUDIENCE_CONSENT",
        `Unsubscribed recipient recognized: ${testEnquiryEmail} (unsubscribedCount: ${preview.unsubscribedCount})`
      );
    } catch (err: any) {
      fail("CONSENT-EXCLUDE-06", "Consent exclusion check failed", "AUDIENCE_CONSENT", err.message);
    }

    // ---------------------------------------------------------------------------
    // STEP 5: Staff Approval Gate (Blocking unapproved dispatch)
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 5: Mandatory Staff Approval Gate");
    console.log("--------------------------------------------------------------------------------");

    // 5a. Block sending unapproved draft
    try {
      const sendRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ mock: true }),
      });

      assert.strictEqual(sendRes.status, 400, `Expected 400 Bad Request, got ${sendRes.status}`);
      const errBody = await sendRes.json();
      assert.strictEqual(errBody.code, "APPROVAL_REQUIRED", "Error code must be APPROVAL_REQUIRED");

      pass(
        "APPROVAL-SEND-BLOCK-07",
        "Attempt to send unapproved campaign draft is strictly rejected",
        "APPROVAL_WORKFLOW",
        `HTTP 400 rejected with code: ${errBody.code} ("${errBody.error}")`
      );
    } catch (err: any) {
      fail("APPROVAL-SEND-BLOCK-07", "Sending unapproved draft was not blocked", "APPROVAL_WORKFLOW", err.message);
    }

    // 5b. Block scheduling unapproved draft
    try {
      const scheduleRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ scheduledAt: "2026-11-01T12:00:00.000Z" }),
      });

      assert.strictEqual(scheduleRes.status, 400, `Expected 400 Bad Request, got ${scheduleRes.status}`);
      const errBody = await scheduleRes.json();
      assert.strictEqual(errBody.code, "APPROVAL_REQUIRED", "Error code must be APPROVAL_REQUIRED");

      pass(
        "APPROVAL-SCHEDULE-BLOCK-08",
        "Attempt to schedule unapproved campaign draft is strictly rejected",
        "APPROVAL_WORKFLOW",
        `HTTP 400 rejected with code: ${errBody.code}`
      );
    } catch (err: any) {
      fail("APPROVAL-SCHEDULE-BLOCK-08", "Scheduling unapproved draft was not blocked", "APPROVAL_WORKFLOW", err.message);
    }

    // 5c. Explicit Staff Approval
    try {
      const approveRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/approve`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });

      assert.strictEqual(approveRes.status, 200, `Expected 200 OK, got ${approveRes.status}`);
      const approved = await approveRes.json();
      assert.strictEqual(approved.status, "approved", "Status must transition to 'approved'");
      assert.ok(approved.approvedBy, "approvedBy must be recorded");
      assert.ok(approved.approvedAt, "approvedAt timestamp must be recorded");

      pass(
        "APPROVAL-GRANT-09",
        "Staff approval gate transitions campaign to approved state with audit metadata",
        "APPROVAL_WORKFLOW",
        `Approved by: ${approved.approvedBy} at ${approved.approvedAt}`
      );
    } catch (err: any) {
      fail("APPROVAL-GRANT-09", "Staff approval failed", "APPROVAL_WORKFLOW", err.message);
    }

    // ---------------------------------------------------------------------------
    // STEP 6: Scheduling & Cancellation Workflow
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 6: Scheduling & Cancellation Lifecycle");
    console.log("--------------------------------------------------------------------------------");

    try {
      const scheduleDate = "2026-12-15T09:30:00.000Z";
      const scheduleRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ scheduledAt: scheduleDate }),
      });

      assert.strictEqual(scheduleRes.status, 200);
      const scheduled = await scheduleRes.json();
      assert.strictEqual(scheduled.status, "scheduled");
      assert.strictEqual(new Date(scheduled.scheduledAt).toISOString(), new Date(scheduleDate).toISOString());

      // Cancel the scheduled campaign
      const cancelRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/cancel`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });

      assert.strictEqual(cancelRes.status, 200);
      const cancelled = await cancelRes.json();
      assert.strictEqual(cancelled.status, "cancelled");
      assert.strictEqual(cancelled.scheduledAt, null);

      // Re-approve for delivery test
      await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/approve`, {
        method: "POST",
        headers: { Cookie: adminCookie },
      });

      pass(
        "SCHEDULE-CANCEL-10",
        "Approved campaign can be scheduled and subsequently cancelled without leakage",
        "APPROVAL_WORKFLOW",
        "Successfully scheduled for future dispatch and cancelled on demand"
      );
    } catch (err: any) {
      fail("SCHEDULE-CANCEL-10", "Scheduling and cancellation failed", "APPROVAL_WORKFLOW", err.message);
    }

    // ---------------------------------------------------------------------------
    // STEP 7: Controlled Mock Delivery & Tracking Audit
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 7: Controlled Delivery Simulation & Personalization Tracking");
    console.log("--------------------------------------------------------------------------------");

    try {
      const sendRes = await fetch(`${API_BASE_URL}/api/campaigns/${createdCampaignId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ mock: true }),
      });

      assert.strictEqual(sendRes.status, 200, `Expected 200 OK, got ${sendRes.status}`);
      const sentCampaign = await sendRes.json();

      assert.strictEqual(sentCampaign.status, "sent", "Campaign status must transition to 'sent'");
      assert.ok(sentCampaign.sentAt, "sentAt timestamp must be recorded");
      assert.ok(sentCampaign.stats.sentCount >= 1, "At least 1 recipient must be sent to");
      assert.ok(sentCampaign.stats.skippedCount >= 1, "Unsubscribed contact must be counted as skipped");

      // Verify individual delivery items in audit log
      const deliveries = sentCampaign.deliveries;
      assert.ok(Array.isArray(deliveries), "Deliveries must be an array");

      const marcusDelivery = deliveries.find((d: any) => d.recipientEmail.toLowerCase() === testOrderEmail.toLowerCase());
      assert.ok(marcusDelivery, "Marcus delivery record must exist");
      assert.strictEqual(marcusDelivery.status, "sent", "Marcus must be marked as 'sent'");
      assert.ok(marcusDelivery.messageId?.startsWith("mock_"), "MessageId must be generated");

      const claraDelivery = deliveries.find((d: any) => d.recipientEmail.toLowerCase() === testEnquiryEmail.toLowerCase());
      assert.ok(claraDelivery, "Clara delivery record must exist");
      assert.strictEqual(claraDelivery.status, "skipped_unsubscribed", "Unsubscribed recipient must be marked 'skipped_unsubscribed'");

      pass(
        "DELIVERY-SIM-11",
        "Simulation mode executes controlled delivery, respects opt-outs, and records audit stats",
        "DELIVERY_DISPATCH",
        `Sent: ${sentCampaign.stats.sentCount}, Skipped Opt-Outs: ${sentCampaign.stats.skippedCount}, Zero real emails dispatched`
      );
    } catch (err: any) {
      fail("DELIVERY-SIM-11", "Delivery simulation failed", "DELIVERY_DISPATCH", err.message);
    }

    // ---------------------------------------------------------------------------
    // STEP 8: Public One-Click Unsubscribe Endpoint
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 8: Public One-Click Unsubscribe & Cryptographic Token Verification");
    console.log("--------------------------------------------------------------------------------");

    try {
      // Find Marcus's unsubscribe token from database
      const marcusConsent = await SubscriberConsentModel.findOne({ email: testOrderEmail.toLowerCase() });
      assert.ok(marcusConsent, "Consent record must exist for Marcus Vance");
      assert.strictEqual(marcusConsent.subscribed, true, "Marcus was initially subscribed");

      // Test 8a: Invalid token rejected
      const invalidTokenRes = await fetch(
        `${API_BASE_URL}/api/campaigns/unsubscribe?token=forged_invalid_token&email=${encodeURIComponent(testOrderEmail)}`,
        { headers: { Accept: "application/json" } }
      );
      assert.strictEqual(invalidTokenRes.status, 400, `Expected 400 Bad Request for bad token, got ${invalidTokenRes.status}`);

      // Test 8b: Valid GET token unsubscribe
      const validUnsubRes = await fetch(
        `${API_BASE_URL}/api/campaigns/unsubscribe?token=${marcusConsent.token}&email=${encodeURIComponent(testOrderEmail)}`,
        { headers: { Accept: "application/json" } }
      );
      assert.strictEqual(validUnsubRes.status, 200, `Expected 200 OK, got ${validUnsubRes.status}`);
      const unsubJson = await validUnsubRes.json();
      assert.strictEqual(unsubJson.ok, true);

      // Verify DB persistence
      const updatedConsent = await SubscriberConsentModel.findOne({ email: testOrderEmail.toLowerCase() });
      assert.strictEqual(updatedConsent?.subscribed, false, "Marcus must now be marked as unsubscribed in database");
      assert.ok(updatedConsent?.unsubscribedAt, "unsubscribedAt timestamp must be populated");

      pass(
        "PUBLIC-UNSUB-12",
        "Public one-click unsubscribe validates token and permanently records opt-out",
        "PUBLIC_OPT_OUT",
        `Successfully unsubscribed ${testOrderEmail} with valid cryptographic token`
      );
    } catch (err: any) {
      fail("PUBLIC-UNSUB-12", "Public unsubscribe flow failed", "PUBLIC_OPT_OUT", err.message);
    }

  } finally {
    // ---------------------------------------------------------------------------
    // TEARDOWN: Clean up test artifacts
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Teardown: Cleaning up transient test records");
    console.log("--------------------------------------------------------------------------------");

    try {
      if (createdCampaignId !== null) {
        await CampaignModel.deleteOne({ id: createdCampaignId });
      }
      if (testEnquiryId !== null) {
        await EnquiryModel.deleteMany({ email: new RegExp(`guest.clara.${testSuffix}`, "i") });
      }
      if (testOrderId !== null) {
        await OrderModel.deleteOne({ id: testOrderId });
      }
      await SubscriberConsentModel.deleteMany({
        email: { $in: [testEnquiryEmail.toLowerCase(), testOrderEmail.toLowerCase()] },
      });
      console.log("  [CLEANUP] Successfully purged test campaign, test orders, and test consent records.\n");
    } catch (cleanupErr: any) {
      console.warn("  [CLEANUP WARNING] Teardown encountered error:", cleanupErr.message);
    }

    await disconnectDB();
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("    CAMPAIGN AUTOMATION VERIFICATION AUDIT SUMMARY                              ");
  console.log("================================================================================");

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`  Total Tests Run : ${total}`);
  console.log(`  Passed          : ${passed}`);
  console.log(`  Failed          : ${failed}`);

  if (failed === 0) {
    console.log("\n  STATUS: ALL CAMPAIGN AUTOMATION AUDIT CHECKS PASSED PERFECTLY!\n");
  } else {
    console.error(`\n  STATUS: ${failed} TEST(S) FAILED.\n`);
    process.exitCode = 1;
  }
}

runCampaignAutomationVerification().catch((err) => {
  console.error("FATAL: Unhandled error in Campaign Automation verification suite:", err);
  process.exit(1);
});
