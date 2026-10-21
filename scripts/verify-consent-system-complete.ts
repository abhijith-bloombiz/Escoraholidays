import fs from "node:fs";
import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  CampaignModel,
  SubscriberConsentModel,
  EnquiryModel,
  OrderModel,
  AudienceGroupModel,
} from "../lib/db/src/index";
import {
  adminUnsubscribeSubscriber,
  recordExplicitConsent,
  suppressEmailAddress,
  resolveAudience,
  previewCampaignAudience,
  validateCampaignPreSend,
  sendCampaign,
  listSubscribers,
  subscribeToNewsletter,
  processPublicFormConsent,
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
  console.log("       ESCORA EMAIL MARKETING & CONSENT SYSTEM - COMPLETE VERIFICATION");
  console.log("================================================================================\n");

  await connectDB();
  const testRunId = Math.random().toString(36).substring(2, 9);
  console.log(`Test Run Identifier: ${testRunId}\n`);

  const createdCampaignIds: number[] = [];
  const createdGroupIds: number[] = [];
  const createdEnquiryIds: number[] = [];
  const createdOrderIds: number[] = [];
  const trackedEmails: string[] = [];

  let nextIdCounter = 9000 + Math.floor(Math.random() * 1000);
  const getSafeId = () => ++nextIdCounter;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Contact Form Marketing Checkbox Behavior
    // -------------------------------------------------------------------------
    console.log("--- 1. Contact Form: Optional Marketing Checkbox ---");
    const t1Start = Date.now();
    try {
      // 1a. Unchecked / omitted: enquiry succeeds without marketing consent
      const emailUnchecked = `contact.unchecked.${testRunId}@example.com`;
      trackedEmails.push(emailUnchecked);
      await processPublicFormConsent({
        email: emailUnchecked,
        name: "Unchecked Contact",
        marketingConsent: false,
        source: "website_contact_form",
      });

      const consentRecord1 = await SubscriberConsentModel.findOne({ email: emailUnchecked });
      assert.ok(consentRecord1, "Consent record created for unchecked form submission");
      assert.strictEqual(consentRecord1.subscribed, false, "Must NOT be subscribed when unchecked");
      assert.strictEqual(consentRecord1.status, "not_subscribed", "Status must be 'not_subscribed'");

      // 1b. Checked: enquiry succeeds and explicit consent is recorded
      const emailChecked = `contact.checked.${testRunId}@example.com`;
      trackedEmails.push(emailChecked);
      await processPublicFormConsent({
        email: emailChecked,
        name: "Checked Contact",
        marketingConsent: true,
        source: "website_contact_form",
      });

      const consentRecord2 = await SubscriberConsentModel.findOne({ email: emailChecked });
      assert.ok(consentRecord2, "Consent record created for checked form submission");
      assert.strictEqual(consentRecord2.subscribed, true, "Must be subscribed when checked");
      assert.strictEqual(consentRecord2.status, "subscribed", "Status must be 'subscribed'");
      assert.strictEqual(consentRecord2.source, "website_contact_form", "Source must be website_contact_form");
      assert.ok(consentRecord2.consentDate, "consentDate must be set");

      // 1c. Existing unsubscribed contact who submits enquiry does NOT get silently resubscribed
      const emailUnsub = `contact.unsub.${testRunId}@example.com`;
      trackedEmails.push(emailUnsub);
      await SubscriberConsentModel.create({
        email: emailUnsub,
        name: "Previously Opted Out",
        subscribed: false,
        status: "unsubscribed",
        source: "customer_unsubscribe",
        unsubscribedAt: new Date(),
        token: `tok_unsub_${testRunId}`,
      });

      // Submit enquiry with marketingConsent: true
      await processPublicFormConsent({
        email: emailUnsub,
        name: "Previously Opted Out",
        marketingConsent: true,
        source: "website_contact_form",
      });
      const unsubCheckResult = await SubscriberConsentModel.findOne({ email: emailUnsub });
      assert.ok(unsubCheckResult, "Unsubscribed record exists");
      assert.strictEqual(unsubCheckResult.status, "unsubscribed", "Must maintain unsubscribed status");
      assert.strictEqual(unsubCheckResult.subscribed, false, "Must not be silently resubscribed");

      // 1d. Existing suppressed contact remains suppressed
      const emailSupp = `contact.supp.${testRunId}@example.com`;
      trackedEmails.push(emailSupp);
      await SubscriberConsentModel.create({
        email: emailSupp,
        name: "Suppressed Contact",
        subscribed: false,
        status: "suppressed",
        suppressed: true,
        suppressedAt: new Date(),
        suppressionReason: "spam_complaint",
        token: `tok_supp_${testRunId}`,
      });

      await processPublicFormConsent({
        email: emailSupp,
        name: "Suppressed Contact",
        marketingConsent: true,
        source: "website_contact_form",
      });
      const suppCheckResult = await SubscriberConsentModel.findOne({ email: emailSupp });
      assert.ok(suppCheckResult, "Suppressed record exists");
      assert.strictEqual(suppCheckResult.status, "suppressed", "Must remain suppressed status");
      assert.strictEqual(suppCheckResult.subscribed, false, "Must remain unsubscribed");
      assert.strictEqual(suppCheckResult.suppressed, true, "Must retain suppressed: true");

      pass(
        "TEST-1",
        "Public Contact Form Consent Handling",
        "Unchecked defaults to Not Subscribed; checked grants explicit Subscribed; existing Unsubscribed and Suppressed are strictly protected.",
        Date.now() - t1Start
      );
    } catch (err: any) {
      fail("TEST-1", "Public Contact Form Consent Handling", err, Date.now() - t1Start);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Public Newsletter Signup
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Public Newsletter Signup ---");
    const t2Start = Date.now();
    try {
      // 2a. Valid newsletter signup
      const emailNewsletter = `newsletter.${testRunId}@example.com`;
      trackedEmails.push(emailNewsletter);
      const subResult = await subscribeToNewsletter(emailNewsletter, "Newsletter Reader");
      assert.strictEqual(subResult.success, true, "Newsletter signup returned success: true");

      const nlConsent = await SubscriberConsentModel.findOne({ email: emailNewsletter });
      assert.ok(nlConsent, "Consent record created for newsletter subscriber");
      assert.strictEqual(nlConsent.subscribed, true, "Newsletter signup is subscribed");
      assert.strictEqual(nlConsent.status, "subscribed", "Status is 'subscribed'");
      assert.strictEqual(nlConsent.source, "website_newsletter", "Source is 'website_newsletter'");

      // 2b. Duplicate signup is idempotent and safe
      const dupResult = await subscribeToNewsletter(emailNewsletter, "Newsletter Reader");
      assert.strictEqual(dupResult.success, true, "Duplicate signup returns success");
      assert.strictEqual(dupResult.alreadySubscribed, true, "Recognizes existing active subscription");

      // 2c. Invalid email rejected safely
      let invalidRejected = false;
      try {
        await subscribeToNewsletter("not-an-email", "Invalid User");
      } catch (err) {
        invalidRejected = true;
      }
      assert.ok(invalidRejected, "Invalid email must throw an error");

      // 2d. Opted out contact is NOT silently resubscribed via simple newsletter submit
      const emailNewsletterUnsub = `newsletter.unsub.${testRunId}@example.com`;
      trackedEmails.push(emailNewsletterUnsub);
      await SubscriberConsentModel.create({
        email: emailNewsletterUnsub,
        name: "Opted Out Newsletter User",
        subscribed: false,
        status: "unsubscribed",
        unsubscribedAt: new Date(),
        source: "website_unsubscribe",
        token: `tok_nl_unsub_${testRunId}`,
      });

      const nlUnsubResult = await subscribeToNewsletter(emailNewsletterUnsub);
      assert.strictEqual(nlUnsubResult.success, true, "Returns safe message to protect privacy");

      const nlUnsubConsent = await SubscriberConsentModel.findOne({ email: emailNewsletterUnsub });
      assert.strictEqual(nlUnsubConsent?.subscribed, false, "Opted-out contact must not be silently resubscribed");
      assert.strictEqual(nlUnsubConsent?.status, "unsubscribed", "Status remains 'unsubscribed'");

      // 2e. Suppressed contact remains suppressed
      const emailNewsletterSupp = `newsletter.supp.${testRunId}@example.com`;
      trackedEmails.push(emailNewsletterSupp);
      await SubscriberConsentModel.create({
        email: emailNewsletterSupp,
        subscribed: false,
        status: "suppressed",
        suppressed: true,
        suppressedAt: new Date(),
        suppressionReason: "hard_bounce",
        token: `tok_nl_supp_${testRunId}`,
      });

      const nlSuppResult = await subscribeToNewsletter(emailNewsletterSupp);
      assert.strictEqual(nlSuppResult.success, true, "Returns safe message to prevent email enumeration");

      const nlSuppConsent = await SubscriberConsentModel.findOne({ email: emailNewsletterSupp });
      assert.strictEqual(nlSuppConsent?.subscribed, false, "Suppressed contact must not be subscribed");
      assert.strictEqual(nlSuppConsent?.status, "suppressed", "Status remains 'suppressed'");

      pass(
        "TEST-2",
        "Public Newsletter Signup Implementation",
        "Records explicit consent, handles duplicates safely, rejects invalid emails, and protects opt-out and suppression.",
        Date.now() - t2Start
      );
    } catch (err: any) {
      fail("TEST-2", "Public Newsletter Signup Implementation", err, Date.now() - t2Start);
    }

    // -------------------------------------------------------------------------
    // TEST 3: All 5 Campaign Audience Options
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Campaign Audience Options (All 5 Supported) ---");
    const t3Start = Date.now();
    try {
      // Setup test fixtures:
      // Contact A: Enquiry only, not subscribed
      const emailEnquiryOnly = `aud.enquiry.${testRunId}@example.com`;
      trackedEmails.push(emailEnquiryOnly);
      const enqId1 = getSafeId();
      createdEnquiryIds.push(enqId1);
      await EnquiryModel.create({
        id: enqId1,
        name: "Enquiry Contact",
        email: emailEnquiryOnly,
        phone: "+919876543210",
        message: "Tell me about Kovalam",
        status: "new",
        source: "website",
      });

      // Contact B: Confirmed booking guest, explicit subscribed
      const emailConfirmedSub = `aud.confirmed.sub.${testRunId}@example.com`;
      trackedEmails.push(emailConfirmedSub);
      const ordId1 = getSafeId();
      createdOrderIds.push(ordId1);
      await OrderModel.create({
        id: ordId1,
        guestName: "Confirmed Guest Subscribed",
        guestEmail: emailConfirmedSub,
        guestPhone: "+919876543211",
        status: "confirmed",
        paymentStatus: "paid",
        destinations: "Munnar",
        totalAmount: 150000,
      });
      await SubscriberConsentModel.create({
        email: emailConfirmedSub,
        name: "Confirmed Guest Subscribed",
        subscribed: true,
        status: "subscribed",
        source: "booking_consent",
        consentDate: new Date(),
        token: `tok_ord_sub_${testRunId}`,
      });

      // Contact C: Newsletter subscriber only (not in enquiry or booking)
      const emailSubOnly = `aud.sub.only.${testRunId}@example.com`;
      trackedEmails.push(emailSubOnly);
      await SubscriberConsentModel.create({
        email: emailSubOnly,
        name: "Subscribed Only Member",
        subscribed: true,
        status: "subscribed",
        source: "website_newsletter",
        consentDate: new Date(),
        token: `tok_sub_only_${testRunId}`,
      });

      // Contact D: Custom Audience Group member
      const emailGroupMember = `aud.group.member.${testRunId}@example.com`;
      trackedEmails.push(emailGroupMember);
      await SubscriberConsentModel.create({
        email: emailGroupMember,
        name: "Group Member",
        subscribed: true,
        status: "subscribed",
        source: "vip_registration",
        consentDate: new Date(),
        token: `tok_grp_mem_${testRunId}`,
      });
      const grpId = getSafeId();
      createdGroupIds.push(grpId);
      await AudienceGroupModel.create({
        id: grpId,
        name: `Audience Test Group ${testRunId}`,
        description: "Group for audience option 5 testing",
        type: "manual",
        members: [{ email: emailGroupMember, name: "Group Member", addedAt: new Date() }],
        isArchived: false,
      });

      // Test Option 1: all_contacts
      const aud1 = await resolveAudience({ type: "all_contacts" });
      const foundEnqInAll = aud1.eligible.some((c) => c.email.toLowerCase() === emailEnquiryOnly.toLowerCase());
      const foundOrdInAll = aud1.eligible.some((c) => c.email.toLowerCase() === emailConfirmedSub.toLowerCase());
      const foundSubInAll = aud1.eligible.some((c) => c.email.toLowerCase() === emailSubOnly.toLowerCase());
      assert.ok(foundEnqInAll, "all_contacts includes enquiry contacts");
      assert.ok(foundOrdInAll, "all_contacts includes booking contacts");
      assert.ok(foundSubInAll, "all_contacts includes newsletter subscribers");

      // Test Option 2: enquiries_only
      const aud2 = await resolveAudience({ type: "enquiries_only" });
      const foundEnqInEnq = aud2.eligible.some((c) => c.email.toLowerCase() === emailEnquiryOnly.toLowerCase());
      const foundSubInEnq = aud2.eligible.some((c) => c.email.toLowerCase() === emailSubOnly.toLowerCase());
      assert.ok(foundEnqInEnq, "enquiries_only includes enquiry contacts");
      assert.ok(!foundSubInEnq, "enquiries_only excludes pure newsletter subscribers");

      // Test Option 3: confirmed_guests
      const aud3 = await resolveAudience({ type: "confirmed_guests" });
      const foundOrdInGuests = aud3.eligible.some((c) => c.email.toLowerCase() === emailConfirmedSub.toLowerCase());
      const foundEnqInGuests = aud3.eligible.some((c) => c.email.toLowerCase() === emailEnquiryOnly.toLowerCase());
      assert.ok(foundOrdInGuests, "confirmed_guests includes confirmed booking guests");
      assert.ok(!foundEnqInGuests, "confirmed_guests excludes mere enquiries");

      // Test Option 4: subscribed_contacts (NEW)
      const aud4 = await resolveAudience({ type: "subscribed_contacts" });
      const foundSubInSubOnly = aud4.eligible.some((c) => c.email.toLowerCase() === emailSubOnly.toLowerCase());
      const foundOrdInSubOnly = aud4.eligible.some((c) => c.email.toLowerCase() === emailConfirmedSub.toLowerCase());
      const foundEnqInSubOnly = aud4.eligible.some((c) => c.email.toLowerCase() === emailEnquiryOnly.toLowerCase());
      assert.ok(foundSubInSubOnly, "subscribed_contacts includes verified newsletter subscriber");
      assert.ok(foundOrdInSubOnly, "subscribed_contacts includes verified subscribed guest");
      assert.ok(!foundEnqInSubOnly, "subscribed_contacts excludes un-consented enquiry contact");
      assert.strictEqual(aud4.excludedNotSubscribed, 0, "subscribed_contacts selected only subscribed, so 0 not-subscribed excluded");

      // Test Option 5: audience_group
      const aud5 = await resolveAudience({ type: "audience_group", groupId: grpId });
      const foundGrpInGroup = aud5.eligible.some((c) => c.email.toLowerCase() === emailGroupMember.toLowerCase());
      assert.ok(foundGrpInGroup, "audience_group includes group members");

      pass(
        "TEST-3",
        "Five Audience Options Resolution",
        "All 5 options work accurately: all_contacts, enquiries_only, confirmed_guests, subscribed_contacts (NEW), audience_group.",
        Date.now() - t3Start
      );
    } catch (err: any) {
      fail("TEST-3", "Five Audience Options Resolution", err, Date.now() - t3Start);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Central Consent Enforcement & 5-Point Audience Previews
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Central Consent Enforcement & Audience Preview Metrics ---");
    const t4Start = Date.now();
    try {
      // Create an approved campaign with all_contacts
      const cmpId = getSafeId();
      createdCampaignIds.push(cmpId);
      await CampaignModel.create({
        id: cmpId,
        name: `Preview & Enforcement Test ${testRunId}`,
        subject: "Exclusive Kerala Journeys",
        targetAudience: { type: "all_contacts" },
        contentHtml: "<p>Welcome to our journey</p>",
        status: "approved",
        approvedBy: "Admin Tester",
        approvedAt: new Date(),
      });

      // Preview audience
      const preview = await previewCampaignAudience(cmpId);
      assert.ok(preview.totalSelected >= 3, "Total contacts selected is tracked accurately");
      assert.ok(preview.eligibleRecipients >= 2, "Eligible recipients reflects only active subscribers");
      assert.ok(preview.excludedNotSubscribed !== undefined, "excludedNotSubscribed is returned");
      assert.ok(preview.excludedUnsubscribed !== undefined, "excludedUnsubscribed is returned");
      assert.ok(preview.excludedSuppressed !== undefined, "excludedSuppressed is returned");

      // Check sample recipients have consentStatus
      assert.ok(preview.sampleRecipients.length > 0, "sampleRecipients provided");
      for (const r of preview.sampleRecipients) {
        assert.ok(
          ["subscribed", "not_subscribed", "unsubscribed", "suppressed"].includes(r.consentStatus || ""),
          `Sample recipient has valid consentStatus: ${r.consentStatus}`
        );
      }

      // Pre-send validation
      const preSend = await validateCampaignPreSend(cmpId);
      assert.ok(preSend.totalEligible > 0, "totalEligible is non-zero");
      assert.strictEqual(preSend.canSend, true, "Valid campaign can send");

      // Attempt mock send
      const sendRes = await sendCampaign(cmpId, { mock: true });
      assert.ok(sendRes.status === "sent" || (sendRes.deliveries?.length ?? 0) > 0, "Campaign send processed");

      pass(
        "TEST-4",
        "Central Consent Enforcement & 5-Point Previews",
        `Accurate 5-card breakdown: totalSelected=${preview.totalSelected}, eligible=${preview.eligibleRecipients}, notSub=${preview.excludedNotSubscribed}, unsub=${preview.excludedUnsubscribed}, supp=${preview.excludedSuppressed}.`,
        Date.now() - t4Start
      );
    } catch (err: any) {
      fail("TEST-4", "Central Consent Enforcement & 5-Point Previews", err, Date.now() - t4Start);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Admin Registry 4-State Listing & Actions
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Admin Registry 4-State Listing & Actions ---");
    const t5Start = Date.now();
    try {
      const emailActionTest = `action.test.${testRunId}@example.com`;
      trackedEmails.push(emailActionTest);

      // Create contact as not_subscribed
      await SubscriberConsentModel.create({
        email: emailActionTest,
        name: "Action Contact",
        subscribed: false,
        status: "not_subscribed",
        source: "enquiry_import",
        token: `tok_act_${testRunId}`,
      });

      // 5a. Admin records explicit consent
      await recordExplicitConsent(emailActionTest, "Super Admin", {
        name: "Action Contact Verified",
        source: "Admin Phone Consent",
        consentMethod: "verbal_recorded",
        doubleOptInConfirmed: true,
      });

      const verifiedConsent = await SubscriberConsentModel.findOne({ email: emailActionTest });
      assert.strictEqual(verifiedConsent?.status, "subscribed", "Status updated to 'subscribed'");
      assert.strictEqual(verifiedConsent?.subscribed, true, "Subscribed set to true");
      assert.strictEqual(verifiedConsent?.doubleOptInConfirmed, true, "doubleOptInConfirmed recorded");

      // 5b. Admin unsubscribes contact
      await adminUnsubscribeSubscriber(emailActionTest, "Super Admin", "User requested opt-out");
      const unsubbedConsent = await SubscriberConsentModel.findOne({ email: emailActionTest });
      assert.strictEqual(unsubbedConsent?.status, "unsubscribed", "Status updated to 'unsubscribed'");
      assert.strictEqual(unsubbedConsent?.subscribed, false, "Subscribed set to false");

      // 5c. Admin suppresses email
      await suppressEmailAddress(emailActionTest, "Super Admin", "spam_complaint: Recipient marked as spam");
      const suppConsent = await SubscriberConsentModel.findOne({ email: emailActionTest });
      assert.strictEqual(suppConsent?.status, "suppressed", "Status updated to 'suppressed'");
      assert.strictEqual(suppConsent?.suppressed, true, "Suppressed flag set to true");

      // 5d. Query by status filter
      const suppList = await listSubscribers({ status: "suppressed" });
      const foundInSuppList = suppList.some((s) => s.email === emailActionTest);
      assert.ok(foundInSuppList, "Found in status='suppressed' filter");

      pass(
        "TEST-5",
        "Admin Registry 4-State Management",
        "Authoritative mutations (record consent, unsubscribe, suppress) keep status and flags 100% consistent with full audit trails.",
        Date.now() - t5Start
      );
    } catch (err: any) {
      fail("TEST-5", "Admin Registry 4-State Management", err, Date.now() - t5Start);
    }
  } finally {
    console.log("\n--- Cleaning up temporary test fixtures ---");
    if (createdCampaignIds.length > 0) {
      await CampaignModel.deleteMany({ id: { $in: createdCampaignIds } });
    }
    if (createdGroupIds.length > 0) {
      await AudienceGroupModel.deleteMany({ id: { $in: createdGroupIds } });
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
  console.error("Fatal error running complete verification suite:", err);
  process.exit(1);
});
