import fs from "node:fs";
import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  CampaignModel,
  SubscriberConsentModel,
  EnquiryModel,
  OrderModel,
  InvoiceModel,
  AudienceGroupModel,
} from "../lib/db/src/index";
import {
  adminUnsubscribeSubscriber,
  recordExplicitConsent,
  suppressEmailAddress,
  unsuppressEmailAddress,
  inspectContactRelationships,
  deleteContactRecordSafely,
  auditAndFixConsentInconsistencies,
  resolveAudience,
  sendCampaign,
  listSubscribers,
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
  id: string;
  name: string;
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const results: TestResult[] = [];

function pass(id: string, name: string, details?: string, durationMs?: number) {
  results.push({ id, name, passed: true, details, durationMs });
  const timeStr = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.log(`  [PASS] ${id}: ${name}${timeStr}`);
  if (details) console.log(`         ${details}`);
}

function fail(id: string, name: string, error: any, durationMs?: number) {
  const errStr = error instanceof Error ? error.message : String(error);
  results.push({ id, name, passed: false, details: errStr, durationMs });
  const timeStr = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.error(`  [FAIL] ${id}: ${name}${timeStr}`);
  console.error(`         Error: ${errStr}`);
}

async function main() {
  console.log("\n================================================================================");
  console.log("       ESCORA ADMIN - CONSENT MANAGEMENT VERIFICATION SUITE");
  console.log("================================================================================\n");

  await connectDB();
  const testRunId = Math.random().toString(36).substring(2, 9);
  console.log(`Test Run Identifier: ${testRunId}\n`);

  const createdCampaignIds: number[] = [];
  const createdGroupIds: string[] = [];
  const createdEnquiryIds: number[] = [];
  const createdOrderIds: number[] = [];
  const trackedEmails: string[] = [];

  let nextIdCounter = 8000 + Math.floor(Math.random() * 1000);
  const getSafeId = () => ++nextIdCounter;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Unsubscribe Enforcement & Exclusion Across Customer Groups
    // -------------------------------------------------------------------------
    console.log("--- 1. Testing Unsubscribe Enforcement Across Customer Groups ---");
    const t1Start = Date.now();
    try {
      const email1 = `unsub.test.${testRunId}@example.com`;
      trackedEmails.push(email1);

      // Create an audience group and add this contact
      const grpId1 = getSafeId();
      const group1 = await AudienceGroupModel.create({
        id: grpId1,
        name: `VIP Test Group ${testRunId}`,
        type: "manual",
        description: "Group to test unsubscribe exclusion",
        members: [{ email: email1, name: "Unsub Group Contact", source: "import" }],
      });
      createdGroupIds.push(group1._id.toString());

      // Initial state: consent subscribed: true
      await SubscriberConsentModel.create({
        email: email1,
        name: "Unsub Group Contact",
        subscribed: true,
        source: "website_signup",
        token: `tok_${testRunId}_1`,
      });

      // Admin executes status-aware unsubscribe
      const unsubResult = await adminUnsubscribeSubscriber(
        email1,
        "Admin Tester",
        "Customer requested marketing opt-out via support call",
        "admin_consent_registry"
      );

      assert.strictEqual(unsubResult.subscribed, false, "Subscribed state must be false");
      assert.ok(unsubResult.unsubscribedAt, "unsubscribedAt timestamp must be recorded");
      assert.strictEqual(unsubResult.auditLog?.length, 1, "Audit log must contain unsubscribe event");
      assert.strictEqual(unsubResult.auditLog?.[0]?.action, "unsubscribed");
      assert.strictEqual(unsubResult.auditLog?.[0]?.performedBy, "Admin Tester");

      // Verify audience resolution for custom audience_group: contact MUST NOT be resolved as subscribed
      const { eligible: groupAudience } = await resolveAudience({ type: "audience_group", groupId: group1.id });
      const foundInGroup = groupAudience.find((r) => r.email.toLowerCase() === email1);
      assert.ok(foundInGroup, "Contact still exists in audience group members");
      assert.strictEqual(foundInGroup.isSubscribed, false, "Contact MUST be marked isSubscribed: false despite group membership");

      // Verify audience resolution for all_contacts
      const { eligible: allAudience } = await resolveAudience({ type: "all_contacts" });
      const foundInAll = allAudience.find((r) => r.email.toLowerCase() === email1);
      if (foundInAll) {
        assert.strictEqual(foundInAll.isSubscribed, false, "Contact in all_contacts MUST be marked isSubscribed: false");
      }

      // Test Campaign Dispatch pre-send enforcement in mock mode
      const campId1 = getSafeId();
      await CampaignModel.create({
        id: campId1,
        name: `Test Campaign Unsub ${testRunId}`,
        subject: "Unsub test subject",
        targetAudience: { type: "audience_group", groupId: group1.id },
        status: "approved",
        approvedBy: "Admin Tester",
        approvedAt: new Date(),
        contentHtml: "<p>Hello {{guest_name}} <a href='{{unsubscribe_url}}'>Unsubscribe</a></p>",
      });
      createdCampaignIds.push(campId1);

      const sendResult = await sendCampaign(campId1, { mock: true });
      assert.strictEqual(sendResult.stats.sentCount, 0, "No unsubscribed contacts should be sent email");
      assert.strictEqual(sendResult.stats.skippedCount, 1, "Unsubscribed contact must be counted in skippedCount");

      pass(
        "TEST-1",
        "Unsubscribe Enforcement Across Customer Groups",
        "Contact immediately excluded from marketing; group membership does NOT bypass unsubscribe; skipped safely on send.",
        Date.now() - t1Start
      );
    } catch (err: any) {
      fail("TEST-1", "Unsubscribe Enforcement Across Customer Groups", err, Date.now() - t1Start);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Email Normalization & Duplicate Address Handling
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Testing Email Normalization & Duplicate Address Handling ---");
    const t2Start = Date.now();
    try {
      const baseEmail = `duplicate.${testRunId}@example.com`;
      const mixedCaseEmail = `  DuPliCaTe.${testRunId}@EXAMPLE.COM  `;
      trackedEmails.push(baseEmail);

      // Create canonical consent
      await SubscriberConsentModel.create({
        email: baseEmail,
        name: "Case Test Guest",
        subscribed: true,
        source: "booking",
        token: `tok_${testRunId}_2`,
      });

      // Admin unsubscribes using mixed case with leading/trailing spaces
      await adminUnsubscribeSubscriber(
        mixedCaseEmail,
        "Admin Tester",
        "Duplicate case normalization test",
        "admin_consent_registry"
      );

      // Check canonical record
      const canonical = await SubscriberConsentModel.findOne({ email: baseEmail });
      assert.ok(canonical, "Canonical record must exist under normalized email");
      assert.strictEqual(canonical.subscribed, false, "Canonical record must be unsubscribed");

      // Verify that enquiries with mixed-case do not silently resubscribe
      const enqId1 = getSafeId();
      await EnquiryModel.create({
        id: enqId1,
        name: "Duplicate Guest",
        email: mixedCaseEmail.trim(),
        destination: "Munnar",
        source: "website",
        message: "Interested in Kerala packages",
      });
      createdEnquiryIds.push(enqId1);

      const { eligible: audience } = await resolveAudience({ type: "enquiries_only" });
      const resolved = audience.find((r) => r.email.toLowerCase() === baseEmail);
      assert.ok(resolved, "Enquiry found in enquiries_only audience");
      assert.strictEqual(resolved.isSubscribed, false, "Mixed case enquiry does NOT silently override canonical opt-out");

      pass(
        "TEST-2",
        "Email Normalization & Opt-Out Consistency",
        "Normalized email matching prevents duplicates and protects opt-out across mixed-case enquiries.",
        Date.now() - t2Start
      );
    } catch (err: any) {
      fail("TEST-2", "Email Normalization & Opt-Out Consistency", err, Date.now() - t2Start);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Safe Explicit Consent Recording with Double Opt-In & Audit Trail
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Testing Safe Explicit Consent Recording ---");
    const t3Start = Date.now();
    try {
      const consentEmail = `explicit.consent.${testRunId}@example.com`;
      trackedEmails.push(consentEmail);

      // Enquiry exists for this contact
      const enqId3 = getSafeId();
      await EnquiryModel.create({
        id: enqId3,
        name: "Explicit Consent Guest",
        email: consentEmail,
        destination: "Kochi",
        source: "website",
        message: "Please sign me up for travel updates",
      });
      createdEnquiryIds.push(enqId3);

      // Initially opted-out
      await SubscriberConsentModel.create({
        email: consentEmail,
        name: "Initial Opted Out",
        subscribed: false,
        source: "website_unsubscribe",
        unsubscribedAt: new Date(Date.now() - 86400000),
        token: `tok_${testRunId}_3`,
      });

      // Record explicit fresh consent
      const consentDateStr = new Date().toISOString().split("T")[0];
      const recorded = await recordExplicitConsent(
        consentEmail,
        "Admin Compliance Officer",
        {
          name: "Explicit Consent Guest",
          consentMethod: "written_request",
          source: "Customer Care Desk",
          consentDate: consentDateStr,
          doubleOptInConfirmed: true,
          notes: "Guest emailed signed consent form requesting newsletter re-enrollment.",
        }
      );

      assert.strictEqual(recorded.subscribed, true, "Record must now be subscribed");
      assert.strictEqual(recorded.doubleOptInConfirmed, true, "Double opt-in must be confirmed");
      assert.strictEqual(recorded.consentMethod, "written_request");
      assert.strictEqual(recorded.name, "Explicit Consent Guest");
      assert.strictEqual(recorded.auditLog?.length, 1, "Audit log must contain subscribed action");
      assert.strictEqual(recorded.auditLog?.[0]?.action, "subscribed");
      assert.strictEqual(recorded.auditLog?.[0]?.performedBy, "Admin Compliance Officer");

      // Verify audience resolution recognizes the fresh explicit consent
      const { eligible: allContacts } = await resolveAudience({ type: "all_contacts" });
      const found = allContacts.find((r) => r.email === consentEmail);
      assert.ok(found, "Contact found in all_contacts");
      assert.strictEqual(found.isSubscribed, true, "Contact is now safely subscribed with verified consent");

      pass(
        "TEST-3",
        "Safe Explicit Consent Recording",
        "Explicit consent recorded with method, double opt-in flag, timestamp, and audit trail.",
        Date.now() - t3Start
      );
    } catch (err: any) {
      fail("TEST-3", "Safe Explicit Consent Recording", err, Date.now() - t3Start);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Email Suppression Precedence & Persistence
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Testing Email Suppression Precedence & Persistence ---");
    const t4Start = Date.now();
    try {
      const suppressEmail = `suppressed.${testRunId}@example.com`;
      trackedEmails.push(suppressEmail);

      // Create an audience group with this email
      const grpId2 = getSafeId();
      const group2 = await AudienceGroupModel.create({
        id: grpId2,
        name: `Suppression Test Group ${testRunId}`,
        type: "manual",
        members: [{ email: suppressEmail, name: "Suppressed Recipient", source: "import" }],
      });
      createdGroupIds.push(group2._id.toString());

      // Initial state: subscribed: true
      await SubscriberConsentModel.create({
        email: suppressEmail,
        name: "Active Subscriber",
        subscribed: true,
        source: "website_signup",
        token: `tok_${testRunId}_4`,
      });

      // Admin suppresses this email address
      const suppression = await suppressEmailAddress(
        suppressEmail,
        "Security Officer",
        "spam_complaint: High spam complaint frequency from mailbox provider"
      );

      assert.strictEqual(suppression.suppressed, true, "Suppression must be active");
      assert.strictEqual(suppression.subscribed, false, "Subscribed state must be cleared to false upon suppression");
      assert.ok(suppression.suppressedAt, "Suppressed timestamp must exist");
      assert.ok(suppression.suppressionReason?.includes("spam_complaint"));

      // Verify audience resolution for group: suppression takes absolute precedence
      const { eligible: groupAudience } = await resolveAudience({ type: "audience_group", groupId: group2.id });
      const item = groupAudience.find((r) => r.email === suppressEmail);
      assert.ok(item, "Found in audience list");
      assert.strictEqual(item.isSuppressed, true, "isSuppressed flag must be true");
      assert.strictEqual(item.isSubscribed, false, "isSubscribed flag must be false");

      // Verify campaign dispatch hard block
      const campId2 = getSafeId();
      await CampaignModel.create({
        id: campId2,
        name: `Suppression Campaign ${testRunId}`,
        subject: "Suppression test",
        targetAudience: { type: "audience_group", groupId: group2.id },
        status: "approved",
        approvedBy: "Security Officer",
        approvedAt: new Date(),
        contentHtml: "<p>Suppression test content</p>",
      });
      createdCampaignIds.push(campId2);

      const sendResult = await sendCampaign(campId2, { mock: true });
      assert.strictEqual(sendResult.stats.sentCount, 0, "Suppressed email must not receive campaign");
      assert.strictEqual(sendResult.stats.skippedCount, 1, "Suppressed email counted as skipped");

      // Lift suppression
      const lifted = await unsuppressEmailAddress(
        suppressEmail,
        "Security Officer",
        "Mailbox provider issue cleared after verification"
      );
      assert.strictEqual(lifted.suppressed, false, "Suppression lifted");
      assert.strictEqual(lifted.subscribed, false, "Contact remains unsubscribed until explicit consent is recorded");

      pass(
        "TEST-4",
        "Email Suppression Precedence & Lift Behavior",
        "Suppression overrides group membership; hard-blocks dispatch; retains opt-out on lift.",
        Date.now() - t4Start
      );
    } catch (err: any) {
      fail("TEST-4", "Email Suppression Precedence & Lift Behavior", err, Date.now() - t4Start);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Safe Contact Removal & Relationship Inspection
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Testing Safe Contact Removal & Relationship Inspection ---");
    const t5Start = Date.now();
    try {
      // Case A: Contact with active booking/order
      const financialEmail = `financial.guest.${testRunId}@example.com`;
      trackedEmails.push(financialEmail);

      const orderId1 = getSafeId();
      await OrderModel.create({
        id: orderId1,
        guestName: "Financial Guest",
        guestEmail: financialEmail,
        guestPhone: "+91 9999999999",
        status: "confirmed",
        bookingReference: `BK-${testRunId}`,
      });
      createdOrderIds.push(orderId1);

      const inspectionBlocked = await inspectContactRelationships(financialEmail);
      assert.strictEqual(inspectionBlocked.canDelete, false, "Contact with orders MUST NOT be deletable");
      assert.strictEqual(inspectionBlocked.ordersCount, 1, "Orders count must be 1");
      assert.ok(inspectionBlocked.message?.includes("bookings/orders"), "Message must cite active orders");

      // Attempting to delete should fail safely
      let deleteFailed = false;
      try {
        await deleteContactRecordSafely(financialEmail, "Admin Tester");
      } catch (err: any) {
        deleteFailed = true;
        assert.ok(err.message.includes("Contact cannot be safely deleted"), "Error message explains safety block");
      }
      assert.strictEqual(deleteFailed, true, "deleteContactRecordSafely must reject deletion for active orders");

      // Case B: Contact without financial records (safe to remove)
      const safeDeleteEmail = `safe.delete.${testRunId}@example.com`;
      trackedEmails.push(safeDeleteEmail);

      const grpId3 = getSafeId();
      const group3 = await AudienceGroupModel.create({
        id: grpId3,
        name: `Safe Delete Group ${testRunId}`,
        type: "manual",
        members: [{ email: safeDeleteEmail, name: "Safe Delete Candidate", source: "import" }],
      });
      createdGroupIds.push(group3._id.toString());

      const enqId2 = getSafeId();
      await EnquiryModel.create({
        id: enqId2,
        name: "Safe Delete Candidate",
        email: safeDeleteEmail,
        destination: "Wayanad",
        source: "website",
        message: "Checking packages",
      });
      createdEnquiryIds.push(enqId2);

      await SubscriberConsentModel.create({
        email: safeDeleteEmail,
        name: "Safe Delete Candidate",
        subscribed: false, // opt-out record
        source: "admin_consent_registry",
        unsubscribedAt: new Date(),
        token: `tok_${testRunId}_5`,
      });

      const inspectionSafe = await inspectContactRelationships(safeDeleteEmail);
      assert.strictEqual(inspectionSafe.canDelete, true, "Contact without bookings is safe to delete");
      assert.strictEqual(inspectionSafe.ordersCount, 0);

      const deleteResult = await deleteContactRecordSafely(safeDeleteEmail, "Admin Tester");
      assert.strictEqual(deleteResult.success, true);
      assert.strictEqual(deleteResult.groupsUpdated, 1, "Detached from 1 audience group");
      assert.strictEqual(deleteResult.enquiriesRemoved, 1, "Removed 1 enquiry record");

      // Verify contact was detached from audience group
      const updatedGroup = await AudienceGroupModel.findById(group3._id);
      const inGroup = updatedGroup?.members.some((c) => c.email.toLowerCase() === safeDeleteEmail);
      assert.strictEqual(inGroup, false, "Contact must be detached from audience group");

      // Verify enquiry record removed
      const enqCheck = await EnquiryModel.findOne({ id: enqId2 });
      assert.strictEqual(enqCheck, null, "Enquiry record must be removed");

      // Verify unsubscribe tombstone preserved
      const tombstone = await SubscriberConsentModel.findOne({ email: safeDeleteEmail });
      assert.ok(tombstone, "Canonical consent record retained as tombstone");
      assert.strictEqual(tombstone.subscribed, false, "Unsubscribe protection retained in tombstone");

      pass(
        "TEST-5",
        "Safe Contact Record Removal & Relationship Inspection",
        "Blocks deletion on bookings/invoices; detaches from audience groups; retains unsubscribe protections.",
        Date.now() - t5Start
      );
    } catch (err: any) {
      fail("TEST-5", "Safe Contact Record Removal & Relationship Inspection", err, Date.now() - t5Start);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Fix Incorrect Consent Records ("Opted Out Guest" Reconciliation)
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Testing 'Opted Out Guest' Reconciliation ---");
    const t6Start = Date.now();
    try {
      // Create inconsistent record fixture matching the observed bug
      const buggyEmail = `optout.inconsistent.${testRunId}@example.com`;
      trackedEmails.push(buggyEmail);

      await SubscriberConsentModel.create({
        email: buggyEmail,
        name: "Opted Out Guest",
        subscribed: true, // Inconsistent state!
        source: "audience_resolver_auto_index",
        token: `tok_${testRunId}_6`,
      });

      // Run reconciliation
      const fixResult = await auditAndFixConsentInconsistencies("Admin Automated Auditor");
      assert.ok(fixResult.totalFixed >= 1, "At least 1 inconsistent record fixed");

      const fixedRecord = await SubscriberConsentModel.findOne({ email: buggyEmail });
      assert.ok(fixedRecord, "Fixed record exists");
      assert.strictEqual(fixedRecord.subscribed, false, "Subscribed state must be corrected to false");
      assert.ok(fixedRecord.unsubscribedAt, "unsubscribedAt timestamp recorded");
      const reconAudit = fixedRecord.auditLog?.find((a) => a.action === "reconciled");
      assert.ok(reconAudit, "Audit log contains reconciled event");
      assert.strictEqual(reconAudit?.performedBy, "Admin Automated Auditor");

      // Run reconciliation a second time: should find 0 remaining inconsistencies
      const secondRun = await auditAndFixConsentInconsistencies();
      assert.strictEqual(secondRun.totalFixed, 0, "Zero inconsistencies remain after first reconciliation");

      pass(
        "TEST-6",
        "Reconcile Inconsistent Consent Records",
        `Corrected inconsistent 'Opted Out Guest' records to subscribed: false with canonical audit logging.`,
        Date.now() - t6Start
      );
    } catch (err: any) {
      fail("TEST-6", "Reconcile Inconsistent Consent Records", err, Date.now() - t6Start);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Registry Listing & Filtering (Subscribed, Opted-Out, Suppressed)
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Testing Registry Listing & Filtering ---");
    const t7Start = Date.now();
    try {
      const allList = await listSubscribers();
      assert.ok(Array.isArray(allList), "listSubscribers returns array");

      const suppressedOnly = await listSubscribers({ suppressed: true });
      for (const s of suppressedOnly) {
        assert.strictEqual(s.suppressed, true, "Filtered suppressed list must only have suppressed: true");
      }

      const subscribedOnly = await listSubscribers({ subscribed: true });
      for (const s of subscribedOnly) {
        assert.strictEqual(s.subscribed, true, "Filtered subscribed list must only have subscribed: true");
        assert.ok(!s.suppressed, "Suppressed records must not appear in subscribed only filter");
      }

      pass(
        "TEST-7",
        "Registry Listing & Compliance Filters",
        `Successfully queried ${allList.length} registry entries with subscribed and suppressed filter parameters.`,
        Date.now() - t7Start
      );
    } catch (err: any) {
      fail("TEST-7", "Registry Listing & Compliance Filters", err, Date.now() - t7Start);
    }
  } finally {
    // Clean up created test fixtures
    console.log("\n--- Cleaning up temporary test fixtures ---");
    if (createdCampaignIds.length > 0) {
      await CampaignModel.deleteMany({ id: { $in: createdCampaignIds } });
    }
    if (createdGroupIds.length > 0) {
      await AudienceGroupModel.deleteMany({ _id: { $in: createdGroupIds } });
    }
    if (createdEnquiryIds.length > 0) {
      await EnquiryModel.deleteMany({ id: { $in: createdEnquiryIds } });
    }
    if (createdOrderIds.length > 0) {
      await OrderModel.deleteMany({ id: { $in: createdOrderIds } });
    }
    if (trackedEmails.length > 0) {
      await SubscriberConsentModel.deleteMany({ email: { $in: trackedEmails } });
      await EnquiryModel.deleteMany({ email: { $in: trackedEmails } });
    }
    console.log("Cleanup completed.");
    await disconnectDB();
  }

  // Final Summary
  console.log("\n================================================================================");
  console.log("                           VERIFICATION SUMMARY");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run : ${total}`);
  console.log(`Passed         : ${passed}`);
  console.log(`Failed         : ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running verification suite:", err);
  process.exit(1);
});
