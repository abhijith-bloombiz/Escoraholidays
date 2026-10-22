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
  AudienceGroupModel,
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
function getContactStatusBadge(recipient: {
  consentStatus?: string;
  isSubscribed?: boolean;
  isSuppressed?: boolean;
  isEligible?: boolean;
}): { label: string; variant: "emerald" | "amber" | "red" | "slate"; isEligible: boolean } {
  const isSub =
    recipient.consentStatus === "subscribed" ||
    (recipient.isSubscribed &&
      recipient.consentStatus !== "not_subscribed" &&
      recipient.consentStatus !== "unsubscribed" &&
      recipient.consentStatus !== "suppressed");
  const isUnsub = recipient.consentStatus === "unsubscribed";
  const isSupp = Boolean(recipient.isSuppressed || recipient.consentStatus === "suppressed");
  const isEligible = typeof recipient.isEligible === "boolean" ? recipient.isEligible : Boolean(isSub && !isSupp && !isUnsub);

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
  console.log("  ESCORA HOLIDAYS — CAMPAIGN AUDIENCE & CONSENT AUDIT REGRESSION TEST SUITE     ");
  console.log("================================================================================\n");

  await connectDB();

  const runId = Date.now().toString(36);
  const cleanupCampaignIds: number[] = [];
  const cleanupSubscribers: string[] = [];
  const cleanupEnquiries: number[] = [];
  const cleanupOrders: number[] = [];
  const cleanupGroups: number[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: ALL CONTACTS AUDIENCE AUDIT & RECONCILIATION
    // -------------------------------------------------------------------------
    console.log("--- 1. AUDIT: ALL CONTACTS (ENQUIRIES + BOOKINGS + SUBSCRIBERS) ---");
    const allRes = await resolveAudience({ type: "all_contacts" });

    // 1. Total Selected must equal 68
    report(
      "1.1 All Contacts Total Selected matches database count (68)",
      allRes.totalSelected === 68,
      `totalSelected: ${allRes.totalSelected}`
    );

    // 2. Count reconciliation: Subscribed (21) + Not Subscribed (37) + Unsubscribed (10) + Suppressed (0) === 68
    const sumAll =
      allRes.subscribedCount +
      allRes.notSubscribedCount +
      allRes.unsubscribedCount +
      allRes.suppressedCount;
    report(
      "1.2 Mutually exclusive categories reconcile to Total Selected (21 + 37 + 10 + 0 = 68)",
      sumAll === allRes.totalSelected &&
        allRes.subscribedCount === 21 &&
        allRes.notSubscribedCount === 37 &&
        allRes.unsubscribedCount === 10 &&
        allRes.suppressedCount === 0,
      `Subscribed: ${allRes.subscribedCount}, NotSub: ${allRes.notSubscribedCount}, Unsub: ${allRes.unsubscribedCount}, Supp: ${allRes.suppressedCount}, Sum: ${sumAll}`
    );

    // 3. Delivery eligibility strictly equals Subscribed (21)
    report(
      "1.3 Eligible recipients for campaign delivery strictly equals active verified subscribers (21)",
      allRes.eligibleRecipients === allRes.subscribedCount && allRes.eligibleRecipients === 21,
      `eligibleRecipients: ${allRes.eligibleRecipients}, subscribedCount: ${allRes.subscribedCount}`
    );

    // 4. Arun (arunopera7@gmail.com) verification
    const arun = allRes.eligible.find((r) => r.email === "arunopera7@gmail.com");
    report("1.4 Arun (arunopera7@gmail.com) is selected in audience", Boolean(arun), `Found: ${arun?.name}`);
    assert(arun, "Arun must exist in all_contacts");

    report(
      "1.5 Arun is classified as not_subscribed (no marketing consent)",
      arun.consentStatus === "not_subscribed" && arun.isSubscribed === false,
      `consentStatus: ${arun.consentStatus}, isSubscribed: ${arun.isSubscribed}`
    );

    report(
      "1.6 Arun is not eligible for delivery (isEligible=false)",
      arun.isEligible === false,
      `isEligible: ${arun.isEligible}, exclusionReason: ${arun.exclusionReason}`
    );

    const arunBadge = getContactStatusBadge(arun);
    report(
      "1.7 Arun is labelled 'Excluded · Not Subscribed' and counted in Not Subscribed (37)",
      arunBadge.label === "Excluded · Not Subscribed" && arunBadge.variant === "slate",
      `Badge: "${arunBadge.label}", Summary Not Subscribed: ${allRes.notSubscribedCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: CONFIRMED JOURNEY GUESTS AUDIT (ISSUE 7)
    // -------------------------------------------------------------------------
    console.log("\n--- 2. AUDIT: CONFIRMED JOURNEY GUESTS (13 SELECTED, 5 ELIGIBLE, 8 NOT SUB) ---");
    const guestsRes = await resolveAudience({ type: "confirmed_guests" });

    report(
      "2.1 Confirmed Journey Guests Total Selected matches database (13)",
      guestsRes.totalSelected === 13,
      `totalSelected: ${guestsRes.totalSelected}`
    );

    report(
      "2.2 Confirmed Journey Guests Eligible equals Subscribed (5)",
      guestsRes.eligibleRecipients === 5 && guestsRes.subscribedCount === 5,
      `eligibleRecipients: ${guestsRes.eligibleRecipients}, subscribedCount: ${guestsRes.subscribedCount}`
    );

    report(
      "2.3 Confirmed Journey Guests Not Subscribed equals 8",
      guestsRes.notSubscribedCount === 8 && guestsRes.excludedNotSubscribed === 8,
      `notSubscribedCount: ${guestsRes.notSubscribedCount}`
    );

    const sumGuests =
      guestsRes.subscribedCount +
      guestsRes.notSubscribedCount +
      guestsRes.unsubscribedCount +
      guestsRes.suppressedCount;
    report(
      "2.4 Confirmed Journey Guests categories reconcile to Total Selected (5 + 8 + 0 + 0 = 13)",
      sumGuests === guestsRes.totalSelected,
      `Sum: ${sumGuests}, totalSelected: ${guestsRes.totalSelected}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: ENQUIRIES ONLY AUDIT
    // -------------------------------------------------------------------------
    console.log("\n--- 3. AUDIT: ENQUIRIES ONLY (43 SELECTED, 6 ELIGIBLE, 27 NOT SUB, 10 UNSUB) ---");
    const enqRes = await resolveAudience({ type: "enquiries_only" });

    report(
      "3.1 Enquiries Only Total Selected matches database (43)",
      enqRes.totalSelected === 43,
      `totalSelected: ${enqRes.totalSelected}`
    );

    report(
      "3.2 Enquiries Only Eligible equals Subscribed (6)",
      enqRes.eligibleRecipients === 6 && enqRes.subscribedCount === 6,
      `eligibleRecipients: ${enqRes.eligibleRecipients}`
    );

    report(
      "3.3 Enquiries Only Not Subscribed equals 27",
      enqRes.notSubscribedCount === 27,
      `notSubscribedCount: ${enqRes.notSubscribedCount}`
    );

    report(
      "3.4 Enquiries Only Unsubscribed equals 10",
      enqRes.unsubscribedCount === 10,
      `unsubscribedCount: ${enqRes.unsubscribedCount}`
    );

    const sumEnq =
      enqRes.subscribedCount +
      enqRes.notSubscribedCount +
      enqRes.unsubscribedCount +
      enqRes.suppressedCount;
    report(
      "3.5 Enquiries Only categories reconcile to Total Selected (6 + 27 + 10 + 0 = 43)",
      sumEnq === enqRes.totalSelected,
      `Sum: ${sumEnq}, totalSelected: ${enqRes.totalSelected}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: SUBSCRIBED CONTACTS ONLY AUDIT
    // -------------------------------------------------------------------------
    console.log("\n--- 4. AUDIT: SUBSCRIBED CONTACTS ONLY (21 SELECTED, 21 ELIGIBLE) ---");
    const subsRes = await resolveAudience({ type: "subscribed_contacts" });

    report(
      "4.1 Subscribed Contacts Only Total Selected matches verified opt-ins (21)",
      subsRes.totalSelected === 21,
      `totalSelected: ${subsRes.totalSelected}`
    );

    report(
      "4.2 Subscribed Contacts Only 100% Eligible (21)",
      subsRes.eligibleRecipients === 21 && subsRes.subscribedCount === 21,
      `eligibleRecipients: ${subsRes.eligibleRecipients}`
    );

    report(
      "4.3 Zero unconsented contacts in Subscribed Contacts Only",
      subsRes.notSubscribedCount === 0 && subsRes.unsubscribedCount === 0 && subsRes.suppressedCount === 0,
      `notSub: ${subsRes.notSubscribedCount}, unsub: ${subsRes.unsubscribedCount}, supp: ${subsRes.suppressedCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: AUDIENCE GROUP AUDIT (MANUAL + DYNAMIC)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. AUDIT: AUDIENCE GROUP AUDIT ---");
    const grpId = await getNextSequence("audience_groups");
    const testGroup = await AudienceGroupModel.create({
      id: grpId,
      name: `Audit Group ${runId}`,
      type: "manual",
      members: [
        { email: "sub1.group@example.com", name: "Sub Group Member", addedAt: new Date() },
        { email: "notsub.group@example.com", name: "Unconsented Group Member", addedAt: new Date() },
        { email: "unsub.group@example.com", name: "Opted Out Group Member", addedAt: new Date() },
      ],
      isArchived: false,
    });
    cleanupGroups.push(grpId);

    // Setup consent for group members
    await SubscriberConsentModel.create({
      email: "sub1.group@example.com",
      status: "subscribed",
      subscribed: true,
      token: crypto.randomBytes(24).toString("hex"),
      consentDate: new Date(),
    });
    cleanupSubscribers.push("sub1.group@example.com");

    await SubscriberConsentModel.create({
      email: "unsub.group@example.com",
      status: "unsubscribed",
      subscribed: false,
      unsubscribedAt: new Date(),
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupSubscribers.push("unsub.group@example.com");
    // "notsub.group@example.com" has no consent record -> not_subscribed

    const grpRes = await resolveAudience({ type: "audience_group", groupId: grpId });
    report(
      "5.1 Audience Group Total Selected equals group member count (3)",
      grpRes.totalSelected === 3,
      `totalSelected: ${grpRes.totalSelected}`
    );

    report(
      "5.2 Audience Group reconciles: 1 Subscribed, 1 Not Subscribed, 1 Unsubscribed",
      grpRes.subscribedCount === 1 &&
        grpRes.notSubscribedCount === 1 &&
        grpRes.unsubscribedCount === 1 &&
        grpRes.eligibleRecipients === 1,
      `Sub: ${grpRes.subscribedCount}, NotSub: ${grpRes.notSubscribedCount}, Unsub: ${grpRes.unsubscribedCount}, Eligible: ${grpRes.eligibleRecipients}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: DEDUPLICATION INTEGRITY
    // -------------------------------------------------------------------------
    console.log("\n--- 6. AUDIT: CONTACT DEDUPLICATION INTEGRITY ---");
    const dupEmail = `dup.contact.${runId}@example.com`;

    // Create 2 enquiries with same email
    const eqDup1 = await getNextSequence("enquiries");
    await EnquiryModel.create({ id: eqDup1, name: "Dup User", email: dupEmail, message: "Enquiry 1", status: "new" });
    cleanupEnquiries.push(eqDup1);

    const eqDup2 = await getNextSequence("enquiries");
    await EnquiryModel.create({ id: eqDup2, name: "Dup User", email: dupEmail, message: "Enquiry 2", status: "new" });
    cleanupEnquiries.push(eqDup2);

    // Create order with same email
    const ordDup = await getNextSequence("orders");
    await OrderModel.create({
      id: ordDup,
      guestName: "Dup User",
      guestEmail: dupEmail,
      guestPhone: "+91 99999 88888",
      status: "confirmed",
      destinations: "Kovalam",
    });
    cleanupOrders.push(ordDup);

    const dupAudience = await resolveAudience({ type: "all_contacts" });
    const dupMatches = dupAudience.eligible.filter((r) => r.email === dupEmail);
    report(
      "6.1 Duplicate email across multiple enquiries and orders appears EXACTLY ONCE in audience",
      dupMatches.length === 1,
      `Occurrences in resolved audience: ${dupMatches.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: CAMPAIGN PREVIEW & PRE-SEND VALIDATION ENGINE INTEGRITY
    // -------------------------------------------------------------------------
    console.log("\n--- 7. AUDIT: CAMPAIGN PREVIEW & PRE-SEND COMPLIANCE ---");
    const testCamp = await createCampaign({
      name: `Compliance Audit Campaign ${runId}`,
      subject: "Heritage Sanctuaries",
      contentHtml: "<p>Hello {{name}}, experience serenity.</p>",
      targetAudience: { type: "all_contacts" },
    });
    cleanupCampaignIds.push(testCamp.id);
    const campPreview = await previewCampaignAudience(testCamp.id);
    const sumPreview =
      (campPreview.subscribedCount ?? 0) +
      (campPreview.notSubscribedCount ?? 0) +
      (campPreview.unsubscribedCount ?? 0) +
      (campPreview.suppressedCount ?? 0);

    report(
      "7.1 Campaign Preview returns 6 separated metrics reconciling to Total Selected",
      sumPreview === campPreview.totalSelected &&
        campPreview.eligibleRecipients === campPreview.subscribedCount,
      `Selected: ${campPreview.totalSelected}, Eligible: ${campPreview.eligibleRecipients}, Sub: ${campPreview.subscribedCount}, NotSub: ${campPreview.notSubscribedCount}, Unsub: ${campPreview.unsubscribedCount}, Supp: ${campPreview.suppressedCount}, Sum: ${sumPreview}`
    );

    const preSend = await validateCampaignPreSend(testCamp.id);
    report(
      "7.2 Pre-Send validation excludes unconsented contacts with code NOT_SUBSCRIBED",
      preSend.exclusionReasons.some((e) => e.code === "NOT_SUBSCRIBED"),
      `Exclusion count: ${preSend.excludedCount}, Ready to send: ${preSend.readyToSend}`
    );

    report(
      "7.3 Pre-Send readyToSend equals verified eligible recipients",
      preSend.readyToSend === campPreview.eligibleRecipients,
      `readyToSend: ${preSend.readyToSend}, eligibleRecipients: ${campPreview.eligibleRecipients}`
    );

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
    if (cleanupGroups.length > 0) {
      await AudienceGroupModel.deleteMany({ id: { $in: cleanupGroups } });
    }
    await disconnectDB();
  }

  console.log("\n================================================================================");
  console.log(`  AUDIT REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
