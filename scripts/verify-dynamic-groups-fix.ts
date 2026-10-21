import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {
  connectDB,
  disconnectDB,
  AudienceGroupModel,
  EnquiryModel,
  OrderModel,
  SubscriberConsentModel,
  getNextSequence,
} from "../lib/db/src/index";
import {
  listAudienceGroups,
  createAudienceGroup,
  getAudienceGroup,
  updateAudienceGroup,
  previewAudienceGroup,
  resolveAudience,
  addAudienceGroupMember,
  removeAudienceGroupMember,
} from "../apps/api-server/src/services/campaign-service";

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

interface TestResult {
  scenario: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(scenario: string, passed: boolean, details: string) {
  results.push({ scenario, passed, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${scenario}] ${details}`);
}

async function runTests() {
  console.log("\n=======================================================");
  console.log(" ESCORA ADMIN: DYNAMIC CUSTOMER GROUPS REGRESSION SUITE");
  console.log("=======================================================\n");

  await connectDB();

  let testDynamicGroupId: number | null = null;
  let testManualGroupId: number | null = null;

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: Verify existing dynamic groups (e.g. Munnar packages, uyih)
    // -------------------------------------------------------------------------
    console.log("--- Testing Existing Dynamic Groups ---");
    const existingGroups = await listAudienceGroups();
    const dynamicExisting = existingGroups.filter((g) => g.type === "dynamic");
    console.log(`Found ${existingGroups.length} total audience groups (${dynamicExisting.length} dynamic).`);

    assert(dynamicExisting.length > 0, "Expected at least one existing dynamic group");
    record(
      "Scenario 1: List Existing Groups",
      true,
      `Successfully loaded ${existingGroups.length} groups without runtime crash.`
    );

    // Test preview on each existing dynamic group
    for (const dg of dynamicExisting) {
      const preview = await previewAudienceGroup(dg.id);
      assert(typeof preview.eligibleCount === "number", "preview must return eligibleCount");
      assert(typeof preview.unsubscribedExcluded === "number", "preview must return unsubscribedExcluded");
      assert(Array.isArray(preview.sampleRecipients), "preview must return sampleRecipients");
      console.log(
        `  -> Dynamic Group #${dg.id} "${dg.name}": ${preview.eligibleCount} eligible, ${preview.unsubscribedExcluded} unsubscribed excluded, customerStatus:`,
        dg.rules?.customerStatus
      );
    }
    record(
      "Scenario 2: Inspect Existing Dynamic Groups",
      true,
      `All ${dynamicExisting.length} existing dynamic groups previewed cleanly with valid shapes.`
    );

    // -------------------------------------------------------------------------
    // Scenario 3: Create a dynamic group with rules (destinations, customer status, inactivity)
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Dynamic Group Creation ---");
    const createdDynamic = await createAudienceGroup({
      name: "Regression Test: Wayanad Adventurers",
      description: "Automated test group for Wayanad nature lovers",
      type: "dynamic",
      rules: {
        destinations: ["Wayanad"],
        customerStatus: ["lead_only"],
        inactiveDays: 30,
      },
    });

    testDynamicGroupId = createdDynamic.id;
    assert(createdDynamic.id > 0, "Created group must have valid numeric ID");
    assert.strictEqual(createdDynamic.type, "dynamic");
    assert.deepStrictEqual(createdDynamic.rules.destinations, ["Wayanad"]);
    record(
      "Scenario 3: Create Dynamic Group",
      true,
      `Created group #${createdDynamic.id} with destinations=["Wayanad"] and customerStatus=["lead_only"].`
    );

    // -------------------------------------------------------------------------
    // Scenario 4: Preview newly created dynamic group
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Dynamic Audience Resolution ---");
    const previewNew = await previewAudienceGroup(testDynamicGroupId);
    assert(typeof previewNew.eligibleCount === "number");
    assert(Array.isArray(previewNew.sampleRecipients));
    record(
      "Scenario 4: Resolve Dynamic Group Audience",
      true,
      `Resolved dynamic group: ${previewNew.eligibleCount} eligible contacts, sample length: ${previewNew.sampleRecipients.length}.`
    );

    // -------------------------------------------------------------------------
    // Scenario 5: Update dynamic group rules
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Dynamic Group Rule Updates ---");
    const updatedDynamic = await updateAudienceGroup(testDynamicGroupId, {
      name: "Regression Test: Wayanad & Munnar Connoisseurs",
      description: "Updated test group with expanded destinations and repeat bookers",
      rules: {
        destinations: ["Wayanad", "Munnar"],
        customerStatus: ["confirmed_bookers"],
        minBookings: 1,
        inactiveDays: 0,
      },
    });

    assert.strictEqual(updatedDynamic.name, "Regression Test: Wayanad & Munnar Connoisseurs");
    assert.deepStrictEqual(updatedDynamic.rules.destinations, ["Wayanad", "Munnar"]);
    assert.deepStrictEqual(updatedDynamic.rules.customerStatus, ["confirmed_bookers"]);
    record(
      "Scenario 5: Update Dynamic Group Rules",
      true,
      `Updated group #${testDynamicGroupId} rules successfully.`
    );

    // -------------------------------------------------------------------------
    // Scenario 6: Switch Group Type (Dynamic -> Manual -> Dynamic)
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Group Type Switching ---");
    const switchedToManual = await updateAudienceGroup(testDynamicGroupId, {
      type: "manual",
      members: [{ email: "test-switch@example.com", name: "Switch Test" }],
    });
    assert.strictEqual(switchedToManual.type, "manual");
    assert.strictEqual(switchedToManual.members.length, 1);

    const switchedBackToDynamic = await updateAudienceGroup(testDynamicGroupId, {
      type: "dynamic",
      rules: {
        destinations: ["Alleppey"],
        customerStatus: ["repeat_customers"],
      },
    });
    assert.strictEqual(switchedBackToDynamic.type, "dynamic");
    assert.deepStrictEqual(switchedBackToDynamic.rules.destinations, ["Alleppey"]);
    record(
      "Scenario 6: Switch Group Type Seamlessly",
      true,
      "Switched type from dynamic -> manual -> dynamic without schema or state conflict."
    );

    // -------------------------------------------------------------------------
    // Scenario 7: Malformed and empty dynamic rules handling
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Edge Cases & Malformed Rules ---");
    const emptyRulesGroup = await createAudienceGroup({
      name: "Regression Test: Empty Rules Dynamic",
      type: "dynamic",
      rules: {},
    });
    const emptyPreview = await previewAudienceGroup(emptyRulesGroup.id);
    assert(typeof emptyPreview.eligibleCount === "number");
    console.log(`  -> Empty rules resolved to ${emptyPreview.eligibleCount} contacts without error.`);

    // Test with customerStatus as a bare string instead of array
    const stringStatusGroup = await createAudienceGroup({
      name: "Regression Test: String Status Dynamic",
      type: "dynamic",
      rules: {
        customerStatus: "lead_only" as any,
        destinations: "Munnar" as any,
      },
    });
    const stringPreview = await previewAudienceGroup(stringStatusGroup.id);
    assert(typeof stringPreview.eligibleCount === "number");
    console.log(`  -> String status resolved to ${stringPreview.eligibleCount} contacts without error.`);

    // Clean up edge test groups
    await AudienceGroupModel.deleteOne({ id: emptyRulesGroup.id });
    await AudienceGroupModel.deleteOne({ id: stringStatusGroup.id });
    record(
      "Scenario 7: Graceful Malformed / Edge Rule Handling",
      true,
      "Both empty rules and non-array customerStatus handled gracefully without exceptions."
    );

    // -------------------------------------------------------------------------
    // Scenario 8: Verify Manual Group Creation & Member Operations
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Manual Group Compatibility ---");
    const manualGroup = await createAudienceGroup({
      name: "Regression Test: Manual VIP Guests",
      description: "Manual guest list test",
      type: "manual",
      members: [{ email: "vip1@example.com", name: "VIP One" }],
    });
    testManualGroupId = manualGroup.id;
    assert.strictEqual(manualGroup.members.length, 1);

    const addedMember = await addAudienceGroupMember(testManualGroupId, {
      email: "vip2@example.com",
      name: "VIP Two",
    });
    assert.strictEqual(addedMember.members.length, 2);

    const removedMember = await removeAudienceGroupMember(testManualGroupId, "vip1@example.com");
    assert.strictEqual(removedMember.members.length, 1);
    assert.strictEqual(removedMember.members[0].email, "vip2@example.com");

    record(
      "Scenario 8: Static / Manual Groups Compatibility",
      true,
      "Manual group creation, member addition, and removal continue to work seamlessly."
    );

    // -------------------------------------------------------------------------
    // Scenario 9: Dynamic Membership vs Unsubscribe / Consent Safeguards
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Consent Safeguards on Dynamic Groups ---");
    // Insert an enquiry that matches Munnar
    const testEmail = "test-consent-guard@example.com";
    await EnquiryModel.updateOne(
      { email: testEmail },
      {
        $set: {
          email: testEmail,
          name: "Consent Safeguard Tester",
          destination: "Munnar",
          status: "new",
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Ensure testEmail is opted-out in consent registry
    await SubscriberConsentModel.updateOne(
      { email: testEmail },
      {
        $set: {
          email: testEmail,
          subscribed: false,
          token: "test-optout-token-12345",
          unsubscribedAt: new Date(),
          source: "test",
        },
      },
      { upsert: true }
    );

    // Update testDynamicGroupId to target Munnar and leads
    await updateAudienceGroup(testDynamicGroupId, {
      rules: {
        destinations: ["Munnar"],
        customerStatus: ["lead_only"],
      },
    });

    // Resolve audience for a dynamic group targeting Munnar
    const munnarResolved = await resolveAudience({
      type: "audience_group",
      groupId: testDynamicGroupId,
    } as any);

    // In resolveAudience, contact should have isSubscribed=false and be counted in unsubscribedCount
    const contact = munnarResolved.eligible.find((r) => r.email === testEmail);
    assert(contact, "Enquiry must match Munnar dynamic rule");
    assert.strictEqual(contact.isSubscribed, false, "Opted-out contact must have isSubscribed=false");
    assert(munnarResolved.unsubscribedCount >= 1, "Unsubscribed counter must account for opted-out contact");

    // In previewAudienceGroup, eligibleCount must only include active subscribers (excluding unsubscribed)
    const munnarPreview = await previewAudienceGroup(testDynamicGroupId);
    assert(munnarPreview.unsubscribedExcluded >= 1, "Preview must show unsubscribedExcluded >= 1");
    assert.strictEqual(munnarPreview.eligibleCount, munnarResolved.activeSubscribers, "eligibleCount must equal activeSubscribers");

    // Clean up test enquiry and consent record
    await EnquiryModel.deleteOne({ email: testEmail });
    await SubscriberConsentModel.deleteOne({ email: testEmail });

    record(
      "Scenario 9: Unsubscribe & Consent Safeguards",
      true,
      "Opted-out contacts are marked unsubscribed, counted in exclusions, and omitted from active sending reach."
    );

  } finally {
    // Clean up created regression test groups
    if (testDynamicGroupId) {
      await AudienceGroupModel.deleteOne({ id: testDynamicGroupId });
    }
    if (testManualGroupId) {
      await AudienceGroupModel.deleteOne({ id: testManualGroupId });
    }
    await disconnectDB();
  }

  console.log("\n=======================================================");
  console.log(" REGRESSION SUITE SUMMARY");
  console.log("=======================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`Total Scenarios: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.passed).length}`);
  console.log(`Failed: ${results.filter((r) => !r.passed).length}`);
  console.log(`Status: ${allPassed ? "ALL SCENARIOS PASSED" : "FAILURES DETECTED"}\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
