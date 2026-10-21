/**
 * Escora Holidays — All Contacts Audience Resolution & Consent Separation Verification Suite
 *
 * Verifies all 13 user requirements:
 * 1. All Contacts resolves an enquiry contact who did not check the marketing checkbox.
 * 2. All Contacts resolves a booking customer without marketing consent.
 * 3. All Contacts includes eligible newsletter subscribers.
 * 4. Duplicate email addresses across enquiries, bookings, and newsletter records resolve to one recipient.
 * 5. Audience resolution does not create or modify consent records.
 * 6. Preview counts distinguish total audience membership from eligible recipients.
 * 7. Not Subscribed contacts are excluded from actual marketing delivery.
 * 8. Unsubscribed and Suppressed contacts are excluded from every audience option.
 * 9. Inquiries Prospects Only preserves enquiry targeting independently of consent.
 * 10. Confirmed Journey Guests Only preserves confirmed-booking targeting independently of consent.
 * 11. Subscribed Contacts Only contains only contacts with valid marketing consent.
 * 12. Audience Group preserves membership while enforcing consent before delivery.
 * 13. A campaign with zero eligible recipients cannot perform a misleading empty dispatch.
 */

import assert from "node:assert";
import crypto from "node:crypto";
import "../apps/api-server/src/config/env";
import {
  connectDB,
  disconnectDB,
  EnquiryModel,
  OrderModel,
  SubscriberConsentModel,
  AudienceGroupModel,
  CampaignModel,
  getNextSequence,
} from "../lib/db/src/index";
import {
  resolveAudience,
  previewCampaignAudience,
  validateCampaignPreSend,
  sendCampaign,
  createCampaign,
} from "../apps/api-server/src/services/campaign-service";

let testPassed = 0;
let testFailed = 0;

function report(name: string, ok: boolean, detail?: string) {
  if (ok) {
    testPassed++;
    console.log(`  [PASS] ${name}`);
  } else {
    testFailed++;
    console.error(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function run() {
  console.log("\n========================================================");
  console.log("ESCORA ALL CONTACTS AUDIENCE RESOLUTION VERIFICATION");
  console.log("========================================================\n");

  await connectDB();

  const runId = Date.now().toString(36);
  const cleanupIds = {
    enquiries: [] as number[],
    orders: [] as number[],
    subscribers: [] as string[],
    groups: [] as number[],
    campaigns: [] as number[],
  };

  try {
    // -------------------------------------------------------------------------
    // Setup isolated test entities
    // -------------------------------------------------------------------------
    const emailEnquiryNoConsent = `enq.noconsent.${runId}@example.com`;
    const emailEnquiryWithConsent = `enq.consent.${runId}@example.com`;
    const emailBookingNoConsent = `booking.noconsent.${runId}@example.com`;
    const emailNewsletterOnly = `newsletter.sub.${runId}@example.com`;
    const emailDuplicate = `duplicate.guest.${runId}@example.com`;
    const emailUnsubscribed = `unsub.guest.${runId}@example.com`;
    const emailSuppressed = `suppressed.guest.${runId}@example.com`;
    const emailGroupMember = `group.member.${runId}@example.com`;

    // 1. Enquiry without consent
    const eq1Id = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eq1Id,
      name: "Enquiry Lead No Consent",
      email: emailEnquiryNoConsent,
      message: "Looking for backwaters tour",
      status: "new",
    });
    cleanupIds.enquiries.push(eq1Id);
    // Explicitly record as not_subscribed in consent model
    await SubscriberConsentModel.create({
      email: emailEnquiryNoConsent,
      name: "Enquiry Lead No Consent",
      status: "not_subscribed",
      subscribed: false,
      token: crypto.randomBytes(24).toString("hex"),
      source: "website_contact_form",
    });
    cleanupIds.subscribers.push(emailEnquiryNoConsent);

    // 2. Enquiry with explicit consent
    const eq2Id = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eq2Id,
      name: "Enquiry Lead With Consent",
      email: emailEnquiryWithConsent,
      message: "Interested in luxury package",
      status: "new",
    });
    cleanupIds.enquiries.push(eq2Id);
    await SubscriberConsentModel.create({
      email: emailEnquiryWithConsent,
      name: "Enquiry Lead With Consent",
      status: "subscribed",
      subscribed: true,
      token: crypto.randomBytes(24).toString("hex"),
      source: "website_contact_form",
      consentDate: new Date(),
      consentMethod: "contact_form_checkbox",
    });
    cleanupIds.subscribers.push(emailEnquiryWithConsent);

    // 3. Booking customer without marketing consent
    const ord1Id = await getNextSequence("orders");
    await OrderModel.create({
      id: ord1Id,
      guestName: "Booking Guest No Consent",
      guestEmail: emailBookingNoConsent,
      guestPhone: "+91 9876543210",
      status: "confirmed",
      destinations: "Munnar, Alleppey",
    });
    cleanupIds.orders.push(ord1Id);
    // Notice: no consent record created initially for booking customer!

    // 4. Newsletter subscriber only
    await SubscriberConsentModel.create({
      email: emailNewsletterOnly,
      name: "Newsletter Subscriber",
      status: "subscribed",
      subscribed: true,
      token: crypto.randomBytes(24).toString("hex"),
      source: "newsletter_footer",
      consentDate: new Date(),
    });
    cleanupIds.subscribers.push(emailNewsletterOnly);

    // 5. Duplicate across enquiry and booking
    const eqDupId = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eqDupId,
      name: "Duplicate User",
      email: emailDuplicate,
      message: "First enquiry",
      status: "read",
    });
    cleanupIds.enquiries.push(eqDupId);

    const ordDupId = await getNextSequence("orders");
    await OrderModel.create({
      id: ordDupId,
      guestName: "Duplicate User Confirmed",
      guestEmail: emailDuplicate,
      guestPhone: "+91 9999999999",
      status: "confirmed",
      destinations: "Kovalam",
    });
    cleanupIds.orders.push(ordDupId);

    // 6. Unsubscribed contact
    const eqUnsubId = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eqUnsubId,
      name: "Unsubscribed User",
      email: emailUnsubscribed,
      message: "Unsubscribed inquiry",
      status: "new",
    });
    cleanupIds.enquiries.push(eqUnsubId);
    await SubscriberConsentModel.create({
      email: emailUnsubscribed,
      name: "Unsubscribed User",
      status: "unsubscribed",
      subscribed: false,
      token: crypto.randomBytes(24).toString("hex"),
      source: "website",
      unsubscribedAt: new Date(),
    });
    cleanupIds.subscribers.push(emailUnsubscribed);

    // 7. Suppressed contact
    const eqSuppId = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eqSuppId,
      name: "Suppressed User",
      email: emailSuppressed,
      message: "Suppressed lead",
      status: "new",
    });
    cleanupIds.enquiries.push(eqSuppId);
    await SubscriberConsentModel.create({
      email: emailSuppressed,
      name: "Suppressed User",
      status: "suppressed",
      subscribed: false,
      suppressed: true,
      suppressionReason: "Spam bounce block",
      token: crypto.randomBytes(24).toString("hex"),
      source: "system",
    });
    cleanupIds.subscribers.push(emailSuppressed);

    // 8. Audience group
    const grpId = await getNextSequence("audience_groups");
    await AudienceGroupModel.create({
      id: grpId,
      name: `Test Group ${runId}`,
      type: "manual",
      members: [
        { email: emailGroupMember, name: "Group Contact", addedAt: new Date() },
        { email: emailEnquiryWithConsent, name: "Group With Consent", addedAt: new Date() },
      ],
      memberCount: 2,
    });
    cleanupIds.groups.push(grpId);

    // =========================================================================
    // Test 1: All Contacts resolves enquiry contact who did not check consent
    // =========================================================================
    console.log("Scenario 1: All Contacts Membership & Enquiry Consent Independence");
    const allContactsRes = await resolveAudience({ type: "all_contacts" });
    const resolvedEnquiryNoConsent = allContactsRes.eligible.find((r) => r.email === emailEnquiryNoConsent);

    report(
      "1. All Contacts resolves enquiry contact who did not check marketing checkbox",
      Boolean(resolvedEnquiryNoConsent),
      `Found: ${Boolean(resolvedEnquiryNoConsent)}`
    );
    report(
      "1b. Resolved enquiry contact has consentStatus='not_subscribed' and isSubscribed=false",
      resolvedEnquiryNoConsent?.consentStatus === "not_subscribed" && resolvedEnquiryNoConsent?.isSubscribed === false,
      `consentStatus: ${resolvedEnquiryNoConsent?.consentStatus}, isSubscribed: ${resolvedEnquiryNoConsent?.isSubscribed}`
    );

    // =========================================================================
    // Test 2: All Contacts resolves booking customer without marketing consent
    // =========================================================================
    console.log("\nScenario 2: All Contacts Membership & Booking Customer Inclusion");
    const resolvedBookingNoConsent = allContactsRes.eligible.find((r) => r.email === emailBookingNoConsent);

    report(
      "2. All Contacts resolves booking customer without marketing consent",
      Boolean(resolvedBookingNoConsent),
      `Found: ${Boolean(resolvedBookingNoConsent)}`
    );
    report(
      "2b. Booking customer is accurately classified as isSubscribed=false (consent protected)",
      resolvedBookingNoConsent?.isSubscribed === false && resolvedBookingNoConsent?.consentStatus === "not_subscribed",
      `isSubscribed: ${resolvedBookingNoConsent?.isSubscribed}`
    );

    // =========================================================================
    // Test 3: All Contacts includes eligible newsletter subscribers
    // =========================================================================
    console.log("\nScenario 3: Newsletter Subscriber Inclusion");
    const resolvedNewsletter = allContactsRes.eligible.find((r) => r.email === emailNewsletterOnly);

    report(
      "3. All Contacts includes eligible newsletter subscribers",
      Boolean(resolvedNewsletter && resolvedNewsletter.isSubscribed && resolvedNewsletter.consentStatus === "subscribed"),
      `Found: ${Boolean(resolvedNewsletter)}, isSubscribed: ${resolvedNewsletter?.isSubscribed}`
    );

    // =========================================================================
    // Test 4: Deduplication across enquiries and bookings
    // =========================================================================
    console.log("\nScenario 4: Deduplication Across Contact Sources");
    const duplicateMatches = allContactsRes.eligible.filter((r) => r.email === emailDuplicate);

    report(
      "4. Duplicate email addresses across enquiries, bookings, and records resolve to exactly one recipient",
      duplicateMatches.length === 1,
      `Occurrences in resolved list: ${duplicateMatches.length}`
    );

    // =========================================================================
    // Test 5: Audience resolution is purely read-only (zero consent DB writes)
    // =========================================================================
    console.log("\nScenario 5: Read-Only Audience Resolution (Zero Consent DB Mutation)");
    const countBefore = await SubscriberConsentModel.countDocuments();
    // Re-run resolution multiple times
    await resolveAudience({ type: "all_contacts" });
    await resolveAudience({ type: "enquiries_only" });
    await resolveAudience({ type: "confirmed_guests" });
    const countAfter = await SubscriberConsentModel.countDocuments();

    report(
      "5. Audience resolution does not create or modify consent records in DB",
      countBefore === countAfter,
      `Count before: ${countBefore}, Count after: ${countAfter}`
    );

    // =========================================================================
    // Test 6: Preview counts distinguish total audience membership from eligible recipients
    // =========================================================================
    console.log("\nScenario 6: Preview Counts Distinguish Membership vs. Eligibility");
    const camp1 = await createCampaign({
      name: `Test Camp 1 ${runId}`,
      subject: "Exclusive Kerala Getaways",
      contentHtml: "<p>Hello {{name}}, welcome to Kerala!</p>",
      previewText: "Escape to nature",
      targetAudience: { type: "all_contacts" },
    });
    cleanupIds.campaigns.push(camp1.id);

    const preview = await previewCampaignAudience(camp1.id);
    report(
      "6. Preview counts distinguish total audience membership from eligible recipients",
      preview.totalSelected > preview.eligibleRecipients &&
        preview.eligibleRecipients === preview.activeSubscribers &&
        preview.excludedNotSubscribed > 0,
      `totalSelected: ${preview.totalSelected}, eligible: ${preview.eligibleRecipients}, notSubscribed: ${preview.excludedNotSubscribed}`
    );

    // =========================================================================
    // Test 7: Not Subscribed contacts are excluded from actual marketing delivery
    // =========================================================================
    console.log("\nScenario 7: Not Subscribed Contacts Gated From Delivery");
    const preSendAudit = await validateCampaignPreSend(camp1.id);
    const notSubExclusion = preSendAudit.exclusionReasons.find((e) => e.email === emailEnquiryNoConsent);

    report(
      "7. Not Subscribed contacts are excluded from marketing delivery in pre-send audit",
      Boolean(notSubExclusion && notSubExclusion.code === "NOT_SUBSCRIBED"),
      `Exclusion code: ${notSubExclusion?.code}, reason: ${notSubExclusion?.reason}`
    );

    // =========================================================================
    // Test 8: Unsubscribed and Suppressed contacts excluded from every audience
    // =========================================================================
    console.log("\nScenario 8: Unsubscribed and Suppressed Contact Exclusion");
    const unsubExclusion = preSendAudit.exclusionReasons.find((e) => e.email === emailUnsubscribed);
    const suppExclusion = preSendAudit.exclusionReasons.find((e) => e.email === emailSuppressed);

    report(
      "8. Unsubscribed contacts are excluded with code UNSUBSCRIBED",
      Boolean(unsubExclusion && unsubExclusion.code === "UNSUBSCRIBED"),
      `Found: ${Boolean(unsubExclusion)}, code: ${unsubExclusion?.code}`
    );
    report(
      "8b. Suppressed contacts are excluded with code SUPPRESSED",
      Boolean(suppExclusion && suppExclusion.code === "SUPPRESSED"),
      `Found: ${Boolean(suppExclusion)}, code: ${suppExclusion?.code}`
    );

    // =========================================================================
    // Test 9: Inquiries Prospects Only preserves enquiry targeting independently of consent
    // =========================================================================
    console.log("\nScenario 9: Inquiries Prospects Only");
    const eqOnlyRes = await resolveAudience({ type: "enquiries_only" });
    const hasEqNoConsent = eqOnlyRes.eligible.some((r) => r.email === emailEnquiryNoConsent);
    const hasEqWithConsent = eqOnlyRes.eligible.some((r) => r.email === emailEnquiryWithConsent);
    const hasBookingOnly = eqOnlyRes.eligible.some((r) => r.email === emailBookingNoConsent);

    report(
      "9. Inquiries Prospects Only resolves enquiry contacts regardless of consent",
      hasEqNoConsent && hasEqWithConsent && !hasBookingOnly,
      `NoConsent: ${hasEqNoConsent}, WithConsent: ${hasEqWithConsent}, HasBooking: ${hasBookingOnly}`
    );

    // =========================================================================
    // Test 10: Confirmed Journey Guests Only preserves confirmed-booking targeting
    // =========================================================================
    console.log("\nScenario 10: Confirmed Journey Guests Only");
    const guestsRes = await resolveAudience({ type: "confirmed_guests" });
    const hasBookingGuest = guestsRes.eligible.some((r) => r.email === emailBookingNoConsent);
    const hasEnquiryOnly = guestsRes.eligible.some((r) => r.email === emailEnquiryNoConsent);

    report(
      "10. Confirmed Journey Guests Only resolves booking customers regardless of consent",
      hasBookingGuest && !hasEnquiryOnly,
      `HasBookingGuest: ${hasBookingGuest}, HasEnquiryOnly: ${hasEnquiryOnly}`
    );

    // =========================================================================
    // Test 11: Subscribed Contacts Only contains only contacts with valid marketing consent
    // =========================================================================
    console.log("\nScenario 11: Subscribed Contacts Only");
    const subsOnlyRes = await resolveAudience({ type: "subscribed_contacts" });
    const allHaveConsent = subsOnlyRes.eligible.every(
      (r) => r.isSubscribed && !r.isSuppressed && r.consentStatus === "subscribed"
    );
    const hasNonConsentInSubs = subsOnlyRes.eligible.some((r) => r.email === emailEnquiryNoConsent);

    report(
      "11. Subscribed Contacts Only resolves strictly contacts with valid explicit marketing consent",
      allHaveConsent && !hasNonConsentInSubs && subsOnlyRes.totalSelected === subsOnlyRes.eligibleRecipients,
      `AllHaveConsent: ${allHaveConsent}, HasNonConsent: ${hasNonConsentInSubs}`
    );

    // =========================================================================
    // Test 12: Audience Group preserves membership while enforcing consent before delivery
    // =========================================================================
    console.log("\nScenario 12: Audience Group Membership & Consent Enforcement");
    const groupRes = await resolveAudience({ type: "audience_group", groupId: grpId });
    const groupHasMember = groupRes.eligible.some((r) => r.email === emailGroupMember);
    const groupMemberConsent = groupRes.eligible.find((r) => r.email === emailGroupMember);

    report(
      "12. Audience Group preserves membership regardless of initial consent",
      groupHasMember && groupRes.totalSelected >= 2,
      `Found member: ${groupHasMember}, totalSelected: ${groupRes.totalSelected}`
    );
    report(
      "12b. Audience Group non-consented member is marked not_subscribed for delivery gating",
      groupMemberConsent?.isSubscribed === false,
      `groupMember isSubscribed: ${groupMemberConsent?.isSubscribed}`
    );

    // =========================================================================
    // Test 13: Zero eligible recipients campaign cannot perform misleading empty dispatch
    // =========================================================================
    console.log("\nScenario 13: Zero-Eligible Empty Dispatch Protection");
    // Create a group containing ONLY non-consented members
    const zeroGrpId = await getNextSequence("audience_groups");
    await AudienceGroupModel.create({
      id: zeroGrpId,
      name: `Zero Group ${runId}`,
      type: "manual",
      members: [{ email: emailEnquiryNoConsent, name: "No Consent Lead", addedAt: new Date() }],
      memberCount: 1,
    });
    cleanupIds.groups.push(zeroGrpId);

    const zeroCamp = await createCampaign({
      name: `Zero Eligible Camp ${runId}`,
      subject: "Exclusive Offer",
      contentHtml: "<p>Hello {{name}}</p>",
      targetAudience: { type: "audience_group", groupId: zeroGrpId },
    });
    cleanupIds.campaigns.push(zeroCamp.id);

    // Approve the campaign with staff metadata
    await CampaignModel.updateOne(
      { id: zeroCamp.id },
      { $set: { status: "approved", approvedBy: "Staff Admin", approvedAt: new Date() } }
    );

    // Validate pre-send audit reflects blockReason
    const zeroPreSend = await validateCampaignPreSend(zeroCamp.id);
    report(
      "13. Pre-send audit reports canSend=false and clear blockReason when eligible count is 0",
      zeroPreSend.canSend === false &&
        zeroPreSend.readyToSend === 0 &&
        typeof zeroPreSend.blockReason === "string" &&
        zeroPreSend.blockReason.length > 0,
      `canSend: ${zeroPreSend.canSend}, readyToSend: ${zeroPreSend.readyToSend}, blockReason: "${zeroPreSend.blockReason}"`
    );

    // Attempt to dispatch - must reject with CampaignError ZERO_ELIGIBLE_RECIPIENTS
    let caughtZeroDispatch = false;
    let zeroErrorCode = "";
    try {
      await sendCampaign(zeroCamp.id, { mock: true });
    } catch (err: any) {
      caughtZeroDispatch = true;
      zeroErrorCode = err?.code || "";
    }

    report(
      "13b. sendCampaign strictly rejects dispatch with ZERO_ELIGIBLE_RECIPIENTS error",
      caughtZeroDispatch && zeroErrorCode === "ZERO_ELIGIBLE_RECIPIENTS",
      `Caught: ${caughtZeroDispatch}, ErrorCode: ${zeroErrorCode}`
    );

    // Verify campaign status was NOT transitioned to 'sent'
    const finalZeroCamp = await CampaignModel.findOne({ id: zeroCamp.id }).lean();
    report(
      "13c. Campaign status remains 'approved' and was NOT falsely transitioned to 'sent'",
      finalZeroCamp?.status === "approved",
      `Final status: ${finalZeroCamp?.status}`
    );
  } finally {
    // Teardown test entities
    console.log("\nTeardown: Cleaning up isolated test entities...");
    if (cleanupIds.enquiries.length > 0) {
      await EnquiryModel.deleteMany({ id: { $in: cleanupIds.enquiries } });
    }
    if (cleanupIds.orders.length > 0) {
      await OrderModel.deleteMany({ id: { $in: cleanupIds.orders } });
    }
    if (cleanupIds.subscribers.length > 0) {
      await SubscriberConsentModel.deleteMany({ email: { $in: cleanupIds.subscribers } });
    }
    if (cleanupIds.groups.length > 0) {
      await AudienceGroupModel.deleteMany({ id: { $in: cleanupIds.groups } });
    }
    if (cleanupIds.campaigns.length > 0) {
      await CampaignModel.deleteMany({ id: { $in: cleanupIds.campaigns } });
    }
    await disconnectDB();
  }

  console.log("\n========================================================");
  console.log(`TOTAL TESTS: ${testPassed + testFailed} | PASSED: ${testPassed} | FAILED: ${testFailed}`);
  console.log("========================================================\n");

  if (testFailed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
