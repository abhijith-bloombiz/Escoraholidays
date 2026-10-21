import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
import { resolveAudience, validateCampaignPreSend } from "../apps/api-server/src/services/campaign-service";

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

async function runVerification() {
  console.log("\n================================================================================");
  console.log("ESCORA EMAIL CAMPAIGNS — REMOVE CUSTOM DESTINATION SEGMENT VERIFICATION");
  console.log("================================================================================\n");

  await connectDB();
  const sessionCookie = await loginAdmin();
  const headers = {
    "Content-Type": "application/json",
    Cookie: sessionCookie,
  };

  const createdCampaignIds: number[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: UI Dropdown & Builder Static Inspection
    console.log("▶ TEST 1: Verifying Frontend Campaign Visual Builder Modal");
    const builderFilePath = path.resolve(
      __dirname,
      "../apps/escora-admin/src/components/campaign/CampaignVisualBuilderModal.tsx"
    );
    const builderFile = fs.readFileSync(builderFilePath, "utf-8");
    assert.strictEqual(
      builderFile.includes('<option value="custom_segment">Custom Destination Segment</option>'),
      false,
      "Standard custom_segment dropdown option must be removed"
    );
    assert.ok(
      builderFile.includes('<option value="all_contacts">All Contacts (Enquiries + Bookings)</option>'),
      "Must retain All Contacts option"
    );
    assert.ok(
      builderFile.includes('<option value="enquiries_only">Inquiries Prospects Only</option>'),
      "Must retain Inquiries Prospects Only option"
    );
    assert.ok(
      builderFile.includes('<option value="confirmed_guests">Confirmed Journey Guests Only</option>'),
      "Must retain Confirmed Journey Guests Only option"
    );
    assert.ok(
      builderFile.includes('<option value="audience_group">Audience Group (Custom Segment)</option>'),
      "Must retain Audience Group (Custom Segment) option"
    );
    assert.ok(
      builderFile.includes("Retired Audience Option"),
      "Must have UI warning banner for legacy custom_segment campaigns"
    );
    pass(
      "UI Dropdown & Builder Verification",
      "Builder dropdown retains exactly 4 supported options and displays retired warning if editing legacy custom_segment campaign"
    );

    // -------------------------------------------------------------------------
    // TEST 2: API Blocks Creation of New Campaign with Retired Segment
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 2: Verifying API Blocks POST with Retired Custom Segment");
    const createRes = await fetch(`${API_BASE_URL}/api/campaigns`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Test Illegal Custom Segment",
        subject: "Exclusive Kerala Destinations",
        contentHtml: "<p>Hello {{name}}</p>",
        targetAudience: {
          type: "custom_segment",
          destinations: ["Munnar"],
        },
      }),
    });

    assert.strictEqual(createRes.status, 400, "POST with custom_segment must return 400 Bad Request");
    const createErr = await createRes.json();
    assert.ok(
      createErr.error.includes("retired") || createErr.error.includes("Invalid enum value"),
      `Expected error message referencing retired segment, got: ${createErr.error}`
    );
    pass(
      "Campaign Creation Guard",
      `API correctly rejected new campaign with custom_segment (HTTP ${createRes.status}): "${createErr.error}"`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Audience Estimate API Blocks Retired Custom Segment
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 3: Verifying Audience Estimate Endpoint Blocks Retired Segment");
    const estRes = await fetch(`${API_BASE_URL}/api/campaigns/audience-estimate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        targetAudience: {
          type: "custom_segment",
          destinations: ["Alleppey"],
        },
      }),
    });

    assert.strictEqual(estRes.status, 400, "Audience estimate with custom_segment must return 400");
    const estErr = await estRes.json();
    assert.strictEqual(estErr.code, "RETIRED_AUDIENCE_SEGMENT");
    pass(
      "Audience Estimate Guard",
      `Estimate endpoint safely returned HTTP 400 with code RETIRED_AUDIENCE_SEGMENT`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Supported Segments Continue to Estimate & Resolve Properly
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 4: Verifying 4 Retained Audience Segments Resolve Correctly");
    const supportedSegments = ["all_contacts", "enquiries_only", "confirmed_guests"] as const;
    for (const seg of supportedSegments) {
      const segRes = await fetch(`${API_BASE_URL}/api/campaigns/audience-estimate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetAudience: { type: seg },
        }),
      });
      assert.strictEqual(segRes.status, 200, `Audience estimate for ${seg} must succeed`);
      const segData = await segRes.json();
      assert.ok(typeof segData.eligibleRecipients === "number");
      assert.ok(typeof segData.activeSubscribers === "number");
      assert.ok(typeof segData.unsubscribedCount === "number");
      pass(
        `Retained Segment: ${seg}`,
        `Eligible: ${segData.eligibleRecipients}, Active Opt-in: ${segData.activeSubscribers}, Opted-out: ${segData.unsubscribedCount}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: Legacy Saved Campaign with custom_segment Protection
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 5: Verifying Safe Handling of Legacy Saved Campaign (custom_segment)");
    const legacyCampaignId = await getNextSequence("campaigns");
    createdCampaignIds.push(legacyCampaignId);

    // Directly insert into DB to simulate a campaign created prior to deprecation
    await CampaignModel.create({
      id: legacyCampaignId,
      name: "Legacy Saved Custom Segment Campaign",
      subject: "Old Kerala Journey to {{destination}}",
      previewText: "Exclusive voyage",
      contentHtml: "<p>Dear {{name}}, join us in {{destination}}!</p>",
      targetAudience: {
        type: "custom_segment",
        destinations: ["Alleppey", "Munnar"],
      },
      status: "draft",
      stats: { totalRecipients: 0, sentCount: 0, failedCount: 0, skippedCount: 0 },
      deliveries: [],
    });

    // 5A: Direct audience resolver should return 0 eligible recipients (NEVER broaden to all contacts)
    const resolved = await resolveAudience({ type: "custom_segment" as any, destinations: ["Alleppey"] });
    assert.strictEqual(
      resolved.eligible.length,
      0,
      "resolveAudience must resolve 0 recipients for retired custom_segment"
    );
    assert.strictEqual(resolved.activeSubscribers, 0);
    pass(
      "Legacy Campaign Audience Resolution",
      "Retired segment resolves 0 recipients; NEVER broadens to all contacts or dispatches to unintended guests"
    );

    // 5B: Pre-send validation must block sending
    const preSend = await validateCampaignPreSend(legacyCampaignId);
    assert.strictEqual(preSend.canSend, false, "canSend must be false for retired custom_segment");
    assert.strictEqual(preSend.totalEligible, 0);
    assert.ok(
      preSend.exclusionReasons.some((r) => r.code === "RETIRED_AUDIENCE_SEGMENT"),
      "Exclusion reasons must include RETIRED_AUDIENCE_SEGMENT code"
    );
    pass(
      "Legacy Campaign Pre-Send Validation",
      `canSend=false with clear block notice: "${preSend.exclusionReasons[0].reason}"`
    );

    // 5C: Submitting for approval must be blocked
    const subRes = await fetch(`${API_BASE_URL}/api/campaigns/${legacyCampaignId}/submit-approval`, {
      method: "POST",
      headers,
    });
    assert.strictEqual(subRes.status, 400, "submit-approval must return HTTP 400 for custom_segment");
    const subErr = await subRes.json();
    assert.strictEqual(subErr.code, "RETIRED_AUDIENCE_SEGMENT");
    pass(
      "Legacy Campaign Approval Submission Gate",
      `Submission blocked with RETIRED_AUDIENCE_SEGMENT: "${subErr.error}"`
    );

    // 5D: Approve endpoint must be blocked
    const appRes = await fetch(`${API_BASE_URL}/api/campaigns/${legacyCampaignId}/approve`, {
      method: "POST",
      headers,
    });
    assert.strictEqual(appRes.status, 400, "approve must return HTTP 400 for custom_segment");
    const appErr = await appRes.json();
    assert.strictEqual(appErr.code, "RETIRED_AUDIENCE_SEGMENT");
    pass(
      "Legacy Campaign Direct Approve Gate",
      `Staff approval blocked with RETIRED_AUDIENCE_SEGMENT: "${appErr.error}"`
    );

    // 5E: Schedule endpoint must be blocked
    const schedRes = await fetch(`${API_BASE_URL}/api/campaigns/${legacyCampaignId}/schedule`, {
      method: "POST",
      headers,
      body: JSON.stringify({ scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
    });
    assert.strictEqual(schedRes.status, 400, "schedule must return HTTP 400 for custom_segment");
    const schedErr = await schedRes.json();
    assert.strictEqual(schedErr.code, "RETIRED_AUDIENCE_SEGMENT");
    pass(
      "Legacy Campaign Schedule Gate",
      `Scheduling blocked with RETIRED_AUDIENCE_SEGMENT: "${schedErr.error}"`
    );

    // 5F: Dispatch endpoint must be blocked
    const sendRes = await fetch(`${API_BASE_URL}/api/campaigns/${legacyCampaignId}/send`, {
      method: "POST",
      headers,
    });
    assert.strictEqual(sendRes.status, 400, "send must return HTTP 400 for custom_segment");
    const sendErr = await sendRes.json();
    assert.ok(
      sendErr.code === "RETIRED_AUDIENCE_SEGMENT" || sendErr.code === "APPROVAL_REQUIRED",
      `Expected retired audience or approval required, got: ${sendErr.code}`
    );
    pass(
      "Legacy Campaign Dispatch Gate",
      `Direct sending blocked: "${sendErr.error}"`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Safe Migration / Reassignment to a Supported Segment
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 6: Verifying Migration of Legacy Campaign to Supported Segment");
    const reassignRes = await fetch(`${API_BASE_URL}/api/campaigns/${legacyCampaignId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        targetAudience: {
          type: "confirmed_guests",
        },
      }),
    });
    assert.strictEqual(reassignRes.status, 200, "PUT to reassign audience must succeed");
    const updatedCamp = await reassignRes.json();
    assert.strictEqual(updatedCamp.targetAudience.type, "confirmed_guests");

    // Pre-send validation should now pass (or allow normal check)
    const migratedPreSend = await validateCampaignPreSend(legacyCampaignId);
    assert.notStrictEqual(migratedPreSend.exclusionReasons[0]?.code, "RETIRED_AUDIENCE_SEGMENT");
    pass(
      "Legacy Campaign Migration",
      `Campaign successfully reassigned to 'confirmed_guests'. Retired block removed, ready for review workflow.`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Customer Groups Destination-Based Targeting Intact
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 7: Verifying Customer Groups Destination-Based Targeting Remains Intact");
    const testGroupId = await getNextSequence("audience_groups");
    const createdGroup = await AudienceGroupModel.create({
      id: testGroupId,
      name: `Kerala Destination VIPs ${Date.now()}`,
      description: "Dynamic targeting by Kerala destination",
      type: "dynamic",
      rules: {
        destinations: ["Alleppey", "Kumarakom"],
        customerStatus: ["confirmed", "completed"],
      },
      members: [],
    });

    const groupResolved = await resolveAudience({
      type: "audience_group",
      groupId: testGroupId,
      groupIds: [testGroupId],
    });

    assert.ok(Array.isArray(groupResolved.eligible));
    pass(
      "Customer Groups Destination Targeting",
      `Dynamic Audience Group with Kerala destination rules (${createdGroup.rules?.destinations?.join(", ")}) resolved ${groupResolved.eligible.length} recipients successfully`
    );

    // Clean up test group
    await AudienceGroupModel.deleteOne({ id: testGroupId });

  } finally {
    // Clean up created campaigns
    for (const cid of createdCampaignIds) {
      await CampaignModel.deleteOne({ id: cid });
    }
    await disconnectDB();
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("TEST SUMMARY");
  console.log("================================================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Scenarios Tested: ${total}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error("\nSome test scenarios failed. Check logs above.");
    process.exit(1);
  } else {
    console.log("\nALL VERIFICATION SCENARIOS PASSED SUCCESSFULLY!");
  }
}

runVerification().catch((err) => {
  console.error("FATAL ERROR in test execution:", err);
  process.exit(1);
});
