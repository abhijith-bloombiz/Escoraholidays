import assert from "node:assert";
import crypto from "node:crypto";
import "../apps/api-server/src/config/env";
import {
  connectDB,
  disconnectDB,
  EnquiryModel,
  OrderModel,
  SubscriberConsentModel,
  CampaignModel,
  getNextSequence,
} from "../lib/db/src/index";
import {
  resolveAudience,
  previewCampaignAudience,
  validateCampaignPreSend,
  createCampaign,
} from "../apps/api-server/src/services/campaign-service";

let passed = 0;
let failed = 0;

function report(step: string, ok: boolean, details?: string) {
  if (ok) {
    passed++;
    console.log(`  [PASS] ${step}`);
    if (details) console.log(`         ↳ ${details}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${step}`);
    if (details) console.error(`         ↳ ERROR: ${details}\n`);
  }
}

/**
 * Replicates the exact badge evaluation logic from CampaignsPage.tsx
 */
function getContactStatusBadge(
  recipient: {
    consentStatus?: string;
    isSubscribed?: boolean;
    isSuppressed?: boolean;
    isEligible?: boolean;
  },
  _audienceType?: string
): { label: string; variant: "emerald" | "amber" | "red" | "slate"; isEligible: boolean } {
  const isSub =
    recipient.consentStatus === "subscribed" ||
    (recipient.isSubscribed &&
      recipient.consentStatus !== "not_subscribed" &&
      recipient.consentStatus !== "unsubscribed" &&
      recipient.consentStatus !== "suppressed");
  const isUnsub = recipient.consentStatus === "unsubscribed";
  const isSupp = Boolean(recipient.isSuppressed || recipient.consentStatus === "suppressed");
  const isEligible =
    typeof recipient.isEligible === "boolean"
      ? recipient.isEligible
      : Boolean(isSub && !isSupp && !isUnsub);

  if (isSupp) {
    return { label: "Excluded · Suppressed", variant: "red", isEligible: false };
  }
  if (isUnsub) {
    return { label: "Excluded · Unsubscribed", variant: "amber", isEligible: false };
  }
  if (isEligible) {
    return { label: "Eligible · Subscribed", variant: "emerald", isEligible: true };
  }
  return { label: "Excluded · Not Subscribed", variant: "slate", isEligible: false };
}

async function run() {
  console.log("================================================================================");
  console.log("  ESCORA HOLIDAYS — CAMPAIGN AUDIENCE REACH ELIGIBILITY REGRESSION SUITE        ");
  console.log("================================================================================\n");

  await connectDB();

  const runId = Date.now().toString(36);
  const cleanupCampaignIds: number[] = [];
  const cleanupSubscribers: string[] = [];
  const cleanupEnquiries: number[] = [];
  const cleanupOrders: number[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: VERIFIED AUDIENCE BREAKDOWN & ARUN'S STATUS (68 / 21 / 37 / 10 / 0)
    // -------------------------------------------------------------------------
    console.log("--- 1. VERIFYING ALL CONTACTS BREAKDOWN & ARUN'S STATUS ---");

    const campaignAll = await createCampaign({
      name: `Regression All Contacts Campaign ${runId}`,
      subject: "Private Backwater Escapes",
      contentHtml: "<p>Hello {{name}}, welcome to Kerala.</p>",
      targetAudience: { type: "all_contacts" },
    });
    cleanupCampaignIds.push(campaignAll.id);

    const preview = await previewCampaignAudience(campaignAll.id);

    // Verify summary counts match the verified breakdown
    report(
      "1.1 Summary Counts Reconcile (68 selected, 21 eligible, 21 sub, 37 not sub, 10 unsub, 0 supp)",
      preview.totalSelected === 68 &&
        preview.eligibleRecipients === 21 &&
        preview.subscribedCount === 21 &&
        preview.notSubscribedCount === 37 &&
        preview.unsubscribedCount === 10 &&
        preview.suppressedCount === 0,
      `totalSelected: ${preview.totalSelected}, eligible: ${preview.eligibleRecipients}, sub: ${preview.subscribedCount}, notSub: ${preview.notSubscribedCount}, unsub: ${preview.unsubscribedCount}, supp: ${preview.suppressedCount}`
    );

    // Verify Arun (arunopera7@gmail.com) in preview sampleRecipients
    const arun = preview.sampleRecipients.find((r) => r.email === "arunopera7@gmail.com");
    report("1.2 Arun (arunopera7@gmail.com) is present in audience preview", Boolean(arun), `Found: ${arun?.name} (${arun?.email})`);

    assert(arun, "Arun must exist in the audience preview");

    report(
      "1.3 Arun is classified as not_subscribed in consent status",
      arun.consentStatus === "not_subscribed",
      `consentStatus: ${arun.consentStatus}`
    );

    report(
      "1.4 Arun has isEligible === false from backend preview",
      arun.isEligible === false,
      `isEligible: ${arun.isEligible}, reason: ${arun.exclusionReason}`
    );

    // Evaluate Arun's status badge via frontend badge function
    const arunBadge = getContactStatusBadge(arun, "all_contacts");
    report(
      "1.5 Arun is labelled 'Excluded · Not Subscribed' (NOT Eligible)",
      arunBadge.label === "Excluded · Not Subscribed" && arunBadge.variant === "slate" && arunBadge.isEligible === false,
      `Label: "${arunBadge.label}", Variant: "${arunBadge.variant}"`
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 2: 100% AGREEMENT ACROSS SUMMARY COUNTS & ALL SAMPLE CONTACTS
    // -------------------------------------------------------------------------
    console.log("\n--- 2. VERIFYING 100% AGREEMENT BETWEEN SUMMARY & EVERY CONTACT'S BADGE ---");

    let countEligibleBadges = 0;
    let countExcludedBadges = 0;
    let countExcludedNotSubBadges = 0;
    let countExcludedUnsubBadges = 0;
    let countExcludedSuppBadges = 0;

    for (const recipient of preview.sampleRecipients) {
      const badge = getContactStatusBadge(recipient, "all_contacts");

      if (badge.isEligible) {
        countEligibleBadges++;
        assert(
          badge.label.startsWith("Eligible ·"),
          `Eligible recipient ${recipient.email} must have an Eligible label, got: ${badge.label}`
        );
      } else {
        countExcludedBadges++;
        assert(
          badge.label.startsWith("Excluded ·"),
          `Excluded recipient ${recipient.email} must have an Excluded label, got: ${badge.label}`
        );
        if (badge.label === "Excluded · Not Subscribed") countExcludedNotSubBadges++;
        if (badge.label === "Excluded · Unsubscribed") countExcludedUnsubBadges++;
        if (badge.label === "Excluded · Suppressed") countExcludedSuppBadges++;
      }
    }

    report(
      "2.1 Total Eligible Badges Equals Summary Eligible Count (21)",
      countEligibleBadges === preview.eligibleRecipients,
      `Badge eligible count: ${countEligibleBadges}, Summary eligibleRecipients: ${preview.eligibleRecipients}`
    );

    report(
      "2.2 Total Excluded Not Subscribed Badges Equals Summary Not Subscribed (37)",
      countExcludedNotSubBadges === preview.notSubscribedCount,
      `Badge not subscribed count: ${countExcludedNotSubBadges}, Summary notSubscribedCount: ${preview.notSubscribedCount}`
    );

    report(
      "2.3 Total Excluded Unsubscribed Badges Equals Summary Unsubscribed (10)",
      countExcludedUnsubBadges === preview.unsubscribedCount,
      `Badge unsubscribed count: ${countExcludedUnsubBadges}, Summary unsubscribedCount: ${preview.unsubscribedCount}`
    );

    report(
      "2.4 Total Excluded Suppressed Badges Equals Summary Suppressed (0)",
      countExcludedSuppBadges === preview.suppressedCount,
      `Badge suppressed count: ${countExcludedSuppBadges}, Summary suppressedCount: ${preview.suppressedCount}`
    );

    report(
      "2.5 Total Badges (21 eligible + 47 excluded = 68) Equals Total Selected (68)",
      countEligibleBadges + countExcludedBadges === preview.totalSelected,
      `Sum: ${countEligibleBadges + countExcludedBadges}, totalSelected: ${preview.totalSelected}`
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 3: TEST FIXTURES ACROSS ALL FOUR CONSENT STATES + NO RECORD
    // -------------------------------------------------------------------------
    console.log("\n--- 3. TESTING FIXTURES IN ALL FOUR CONSENT STATES ---");

    const emailSub = `test.sub.${runId}@example.com`;
    const emailNotSub = `test.notsub.${runId}@example.com`;
    const emailNoRec = `test.norecord.${runId}@example.com`;
    const emailUnsub = `test.unsub.${runId}@example.com`;
    const emailSupp = `test.supp.${runId}@example.com`;

    // 1. Explicit Subscribed
    const eqSubId = await getNextSequence("enquiries");
    await EnquiryModel.create({ id: eqSubId, name: "Subscribed User", email: emailSub, message: "Hi", status: "new" });
    cleanupEnquiries.push(eqSubId);
    await SubscriberConsentModel.create({
      email: emailSub,
      name: "Subscribed User",
      status: "subscribed",
      subscribed: true,
      token: crypto.randomBytes(24).toString("hex"),
      source: "website_plan_journey",
      consentDate: new Date(),
    });
    cleanupSubscribers.push(emailSub);

    // 2. Explicit Not Subscribed
    const eqNotSubId = await getNextSequence("enquiries");
    await EnquiryModel.create({ id: eqNotSubId, name: "Not Subscribed User", email: emailNotSub, message: "Hi", status: "new" });
    cleanupEnquiries.push(eqNotSubId);
    await SubscriberConsentModel.create({
      email: emailNotSub,
      name: "Not Subscribed User",
      status: "not_subscribed",
      subscribed: false,
      token: crypto.randomBytes(24).toString("hex"),
      source: "website_contact_form",
    });
    cleanupSubscribers.push(emailNotSub);

    // 3. No Consent Record in SubscriberConsentModel
    const ordNoRecId = await getNextSequence("orders");
    await OrderModel.create({
      id: ordNoRecId,
      guestName: "Booking No Consent Record",
      guestEmail: emailNoRec,
      guestPhone: "+91 98765 43210",
      status: "confirmed",
      destinations: "Marari",
    });
    cleanupOrders.push(ordNoRecId);

    // 4. Explicit Unsubscribed (Opt-Out)
    const eqUnsubId = await getNextSequence("enquiries");
    await EnquiryModel.create({ id: eqUnsubId, name: "Opted Out User", email: emailUnsub, message: "Hi", status: "read" });
    cleanupEnquiries.push(eqUnsubId);
    await SubscriberConsentModel.create({
      email: emailUnsub,
      name: "Opted Out User",
      status: "unsubscribed",
      subscribed: false,
      unsubscribedAt: new Date(),
      token: crypto.randomBytes(24).toString("hex"),
      source: "newsletter",
    });
    cleanupSubscribers.push(emailUnsub);

    // 5. Suppressed (Hard bounce / spam complaint)
    const ordSuppId = await getNextSequence("orders");
    await OrderModel.create({
      id: ordSuppId,
      guestName: "Suppressed User",
      guestEmail: emailSupp,
      guestPhone: "+91 98765 43211",
      status: "confirmed",
      destinations: "Munnar",
    });
    cleanupOrders.push(ordSuppId);
    await SubscriberConsentModel.create({
      email: emailSupp,
      name: "Suppressed User",
      status: "suppressed",
      subscribed: false,
      suppressed: true,
      suppressionReason: "Permanent hard bounce",
      token: crypto.randomBytes(24).toString("hex"),
      source: "system",
    });
    cleanupSubscribers.push(emailSupp);

    const testAudienceAll = await resolveAudience({ type: "all_contacts" });

    const itemSub = testAudienceAll.eligible.find((r) => r.email === emailSub);
    const itemNotSub = testAudienceAll.eligible.find((r) => r.email === emailNotSub);
    const itemNoRec = testAudienceAll.eligible.find((r) => r.email === emailNoRec);
    const itemUnsub = testAudienceAll.eligible.find((r) => r.email === emailUnsub);
    const itemSupp = testAudienceAll.eligible.find((r) => r.email === emailSupp);

    // Subscribed
    report(
      "3.1 Subscribed Contact: isEligible=true, label='Eligible · Subscribed'",
      Boolean(itemSub && itemSub.isEligible === true && getContactStatusBadge(itemSub, "all_contacts").label === "Eligible · Subscribed")
    );

    // Not Subscribed (with DB record)
    report(
      "3.2 Not Subscribed Contact: isEligible=false, label='Excluded · Not Subscribed'",
      Boolean(itemNotSub && itemNotSub.isEligible === false && getContactStatusBadge(itemNotSub, "all_contacts").label === "Excluded · Not Subscribed")
    );

    // No DB consent record
    report(
      "3.3 Missing Consent Record: accurately treated as not_subscribed, isEligible=false, label='Excluded · Not Subscribed'",
      Boolean(itemNoRec && itemNoRec.consentStatus === "not_subscribed" && itemNoRec.isEligible === false && getContactStatusBadge(itemNoRec, "all_contacts").label === "Excluded · Not Subscribed")
    );

    // Unsubscribed
    report(
      "3.4 Unsubscribed Contact: isEligible=false, label='Excluded · Unsubscribed'",
      Boolean(itemUnsub && itemUnsub.isEligible === false && getContactStatusBadge(itemUnsub, "all_contacts").label === "Excluded · Unsubscribed")
    );

    // Suppressed
    report(
      "3.5 Suppressed Contact: isEligible=false, label='Excluded · Suppressed'",
      Boolean(itemSupp && itemSupp.isEligible === false && getContactStatusBadge(itemSupp, "all_contacts").label === "Excluded · Suppressed")
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 4: STRICT CONSENT RESTRICTION FOR SUBSCRIBED CONTACTS ONLY
    // -------------------------------------------------------------------------
    console.log("\n--- 4. STRICT CONSENT RESTRICTIONS FOR NON-ALL_CONTACTS ---");

    const testAudienceSub = await resolveAudience({ type: "subscribed_contacts" });

    const itemSubInSubOnly = testAudienceSub.eligible.find((r) => r.email === emailSub);
    const itemNotSubInSubOnly = testAudienceSub.eligible.find((r) => r.email === emailNotSub);

    report(
      "4.1 Subscribed Contacts Only strictly includes verified subscribers",
      Boolean(itemSubInSubOnly && itemSubInSubOnly.isEligible === true && itemSubInSubOnly.consentStatus === "subscribed")
    );

    report(
      "4.2 Not Subscribed Contacts are NOT present in Subscribed Contacts Only",
      !itemNotSubInSubOnly,
      "Unconsented contacts strictly excluded from subscribed_contacts audience"
    );

    // Also test an enquiries_only audience: unconsented contacts have isEligible=false
    const testAudienceEnq = await resolveAudience({ type: "enquiries_only" });
    const itemNotSubInEnq = testAudienceEnq.eligible.find((r) => r.email === emailNotSub);
    report(
      "4.3 In Enquiries Only: unconsented contact is gathered but isEligible=false and labelled 'Excluded · Not Subscribed'",
      Boolean(itemNotSubInEnq && itemNotSubInEnq.isEligible === false && getContactStatusBadge(itemNotSubInEnq, "enquiries_only").label === "Excluded · Not Subscribed"),
      `Badge: ${itemNotSubInEnq ? getContactStatusBadge(itemNotSubInEnq, "enquiries_only").label : "not found"}`
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 5: PRE-SEND VALIDATION ENGINE CONSISTENCY
    // -------------------------------------------------------------------------
    console.log("\n--- 5. PRE-SEND VALIDATION ENGINE RECIPIENT CONSISTENCY ---");

    const preSend = await validateCampaignPreSend(campaignAll.id);
    const arunPreSendExclusion = preSend.exclusionReasons.find((e) => e.email === "arunopera7@gmail.com");
    report(
      "5.1 Arun is excluded by pre-send validation with NOT_SUBSCRIBED for all_contacts",
      Boolean(arunPreSendExclusion && arunPreSendExclusion.code === "NOT_SUBSCRIBED"),
      arunPreSendExclusion ? `Excluded with: ${arunPreSendExclusion.reason}` : "Ready to send"
    );

    const unsubPreSendExclusion = preSend.exclusionReasons.find((e) => e.code === "UNSUBSCRIBED");
    report("5.2 Opted-out recipients are strictly excluded by pre-send validation", Boolean(unsubPreSendExclusion));

  } finally {
    // Clean up temporary fixtures
    if (cleanupCampaignIds.length > 0) {
      await CampaignModel.deleteMany({ id: { $in: cleanupCampaignIds } });
    }
    if (cleanupSubscribers.length > 0) {
      await SubscriberConsentModel.deleteMany({ email: { $in: cleanupSubscribers } });
    }
    if (cleanupEnquiries.length > 0) {
      await EnquiryModel.deleteMany({ id: { $in: cleanupEnquiries } });
    }
    if (cleanupOrders.length > 0) {
      await OrderModel.deleteMany({ id: { $in: cleanupOrders } });
    }
    await disconnectDB();
  }

  console.log("\n================================================================================");
  console.log(`  REGRESSION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
