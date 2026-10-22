/**
 * ESCORA HOLIDAYS — CAMPAIGN AUDIENCE ELIGIBILITY ACROSS ALL AUDIENCE TYPES
 *
 * Verifies end-to-end:
 * 1. Audience membership vs delivery eligibility separation.
 * 2. All 5 audience types:
 *    - all_contacts
 *    - enquiries_only
 *    - confirmed_guests
 *    - audience_group
 *    - subscribed_contacts (Only Subscribed)
 * 3. Exact count reconciliation between selected, eligible, and excluded contacts.
 * 4. Sample recipient exclusion reasons and delivery statuses (no misleading 'Excluded · Not Subscribed').
 * 5. Deduplication and invalid email handling.
 * 6. Send-time eligibility revalidation and protections.
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
  CampaignModel,
  AudienceGroupModel,
} from "../lib/db/src/index";
import {
  resolveAudience,
  previewCampaignAudience,
  validateCampaignPreSend,
  createCampaign,
  sendCampaign,
  createAudienceGroup,
} from "../apps/api-server/src/services/campaign-service";
import { config } from "../apps/api-server/src/config/env";
import { setResendClientForTesting } from "../apps/api-server/src/lib/email";

async function run() {
  console.log("================================================================================");
  console.log("   AUDIENCE ELIGIBILITY ACROSS ALL AUDIENCE TYPES — VERIFICATION SUITE         ");
  console.log("================================================================================\n");

  await connectDB();

  const runId = crypto.randomBytes(4).toString("hex");
  const cleanupIds = {
    enquiries: [] as number[],
    orders: [] as number[],
    subscribers: [] as string[],
    campaigns: [] as number[],
    groups: [] as number[],
  };

  let passed = 0;
  let failed = 0;

  function test(name: string, ok: boolean, details?: string) {
    if (ok) {
      console.log(`  [PASS] ${name}`);
      if (details) console.log(`         ↳ ${details}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      if (details) console.error(`         ↳ ${details}`);
      failed++;
    }
  }

  try {
    // Enable simulated test dispatch
    (config as any).campaignSendingEnabled = true;
    const sentEmails: any[] = [];
    setResendClientForTesting({
      emails: {
        send: async (payload: any) => {
          sentEmails.push(payload);
          return { data: { id: `resend-test-${Date.now()}` }, error: null };
        },
      },
    } as any);

    // -------------------------------------------------------------------------
    // TEST 1: ONLY SUBSCRIBED AUDIENCE (subscribed_contacts)
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: ONLY SUBSCRIBED AUDIENCE (subscribed_contacts) ---");
    const subEmailActive = `sub.active.${runId}@example.com`;
    const subEmailNotSub = `sub.notsub.${runId}@example.com`;
    const subEmailUnsub = `sub.unsub.${runId}@example.com`;
    const subEmailSupp = `sub.supp.${runId}@example.com`;

    // 1. Active subscribed contact
    await SubscriberConsentModel.create({
      email: subEmailActive,
      name: "Subscribed User",
      status: "subscribed",
      subscribed: true,
      consentDate: new Date(),
      source: "newsletter_popup",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(subEmailActive);

    // 2. Not subscribed contact
    await SubscriberConsentModel.create({
      email: subEmailNotSub,
      name: "Not Subscribed User",
      status: "not_subscribed",
      subscribed: false,
      source: "manual",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(subEmailNotSub);

    // 3. Unsubscribed contact
    await SubscriberConsentModel.create({
      email: subEmailUnsub,
      name: "Unsubscribed User",
      status: "unsubscribed",
      subscribed: false,
      unsubscribedAt: new Date(),
      source: "newsletter",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(subEmailUnsub);

    // 4. Suppressed contact
    await SubscriberConsentModel.create({
      email: subEmailSupp,
      name: "Suppressed User",
      status: "suppressed",
      subscribed: false,
      suppressed: true,
      suppressionReason: "Hard bounce 550 Mailbox does not exist",
      source: "system",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(subEmailSupp);

    const subAudience = await resolveAudience({ type: "subscribed_contacts" });
    const inSubActive = subAudience.eligible.find((r) => r.email === subEmailActive);
    const inSubNotSub = subAudience.eligible.find((r) => r.email === subEmailNotSub);
    const inSubUnsub = subAudience.eligible.find((r) => r.email === subEmailUnsub);
    const inSubSupp = subAudience.eligible.find((r) => r.email === subEmailSupp);

    test("1.1 Only Subscribed includes active subscribed contacts", Boolean(inSubActive && inSubActive.isEligible));
    test("1.2 Only Subscribed strictly excludes not-subscribed contacts from audience", inSubNotSub === undefined);
    test("1.3 Only Subscribed strictly excludes unsubscribed contacts from audience", inSubUnsub === undefined);
    test("1.4 Only Subscribed strictly excludes suppressed contacts from audience", inSubSupp === undefined);
    test(
      "1.5 Only Subscribed mathematical reconciliation",
      subAudience.totalSelected === subAudience.eligibleRecipients &&
        subAudience.notSubscribedCount === 0 &&
        subAudience.unsubscribedCount === 0 &&
        subAudience.suppressedCount === 0,
      `totalSelected: ${subAudience.totalSelected}, eligible: ${subAudience.eligibleRecipients}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: ALL CONTACTS AUDIENCE (all_contacts)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: ALL CONTACTS AUDIENCE (all_contacts) ---");
    const allAudience = await resolveAudience({ type: "all_contacts" });
    const inAllActive = allAudience.eligible.find((r) => r.email === subEmailActive);
    const inAllNotSub = allAudience.eligible.find((r) => r.email === subEmailNotSub);
    const inAllUnsub = allAudience.eligible.find((r) => r.email === subEmailUnsub);
    const inAllSupp = allAudience.eligible.find((r) => r.email === subEmailSupp);

    test("2.1 All Contacts includes active subscribed contacts in audience", Boolean(inAllActive && inAllActive.isEligible));
    test(
      "2.2 All Contacts includes not-subscribed contacts in audience (ineligible for delivery with consent reason)",
      Boolean(inAllNotSub && !inAllNotSub.isEligible && inAllNotSub.exclusionReason === "Missing verified marketing consent"),
      `exclusionReason: "${inAllNotSub?.exclusionReason}"`
    );
    test(
      "2.3 All Contacts includes unsubscribed contacts in audience (ineligible for delivery)",
      Boolean(inAllUnsub && !inAllUnsub.isEligible && inAllUnsub.consentStatus === "unsubscribed")
    );
    test(
      "2.4 All Contacts includes suppressed contacts in audience (ineligible for delivery)",
      Boolean(inAllSupp && !inAllSupp.isEligible && inAllSupp.isSuppressed)
    );
    test(
      "2.5 All Contacts count reconciliation: totalSelected == Subscribed + NotSubscribed + Unsubscribed + Suppressed",
      allAudience.totalSelected ===
        allAudience.subscribedCount +
          allAudience.notSubscribedCount +
          allAudience.unsubscribedCount +
          allAudience.suppressedCount,
      `totalSelected: ${allAudience.totalSelected} == ${allAudience.subscribedCount} + ${allAudience.notSubscribedCount} + ${allAudience.unsubscribedCount} + ${allAudience.suppressedCount}`
    );
    test(
      "2.6 All Contacts delivery reconciliation: totalSelected == eligibleRecipients + (notSubscribed + unsubscribed + suppressed)",
      allAudience.totalSelected ===
        allAudience.eligibleRecipients +
          (allAudience.notSubscribedCount + allAudience.unsubscribedCount + allAudience.suppressedCount),
      `totalSelected: ${allAudience.totalSelected} == ${allAudience.eligibleRecipients} eligible + ${allAudience.notSubscribedCount + allAudience.unsubscribedCount + allAudience.suppressedCount} excluded`
    );

    // -------------------------------------------------------------------------
    // TEST 3: ENQUIRIES AUDIENCE (enquiries_only)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: ENQUIRIES AUDIENCE (enquiries_only) ---");
    const eqSubEmail = `enquiry.sub.${runId}@example.com`;
    const eqNotSubEmail = `enquiry.notsub.${runId}@example.com`;
    const eqUnsubEmail = `enquiry.unsub.${runId}@example.com`;
    const eqSuppEmail = `enquiry.supp.${runId}@example.com`;

    // Create 4 enquiries with unique emails
    const eq1Id = Date.now() + 1;
    await EnquiryModel.create({
      id: eq1Id,
      name: "Enquiry Subscribed",
      email: eqSubEmail,
      message: "Interested in Munnar tea plantations",
      destination: "Munnar",
      status: "new",
    });
    cleanupIds.enquiries.push(eq1Id);
    await SubscriberConsentModel.create({
      email: eqSubEmail,
      name: "Enquiry Subscribed",
      status: "subscribed",
      subscribed: true,
      consentDate: new Date(),
      source: "enquiry_consent_checkbox",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(eqSubEmail);

    const eq2Id = Date.now() + 2;
    await EnquiryModel.create({
      id: eq2Id,
      name: "Enquiry Not Subscribed",
      email: eqNotSubEmail,
      message: "Interested in Alleppey houseboat",
      destination: "Alleppey",
      status: "new",
    });
    cleanupIds.enquiries.push(eq2Id);
    // No consent record created -> defaults in-memory to not_subscribed!

    const eq3Id = Date.now() + 3;
    await EnquiryModel.create({
      id: eq3Id,
      name: "Enquiry Unsubscribed",
      email: eqUnsubEmail,
      message: "Interested in Wayanad",
      destination: "Wayanad",
      status: "replied",
    });
    cleanupIds.enquiries.push(eq3Id);
    await SubscriberConsentModel.create({
      email: eqUnsubEmail,
      name: "Enquiry Unsubscribed",
      status: "unsubscribed",
      subscribed: false,
      unsubscribedAt: new Date(),
      source: "enquiry",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(eqUnsubEmail);

    const eq4Id = Date.now() + 4;
    await EnquiryModel.create({
      id: eq4Id,
      name: "Enquiry Suppressed",
      email: eqSuppEmail,
      message: "Interested in Thekkady",
      destination: "Thekkady",
      status: "new",
    });
    cleanupIds.enquiries.push(eq4Id);
    await SubscriberConsentModel.create({
      email: eqSuppEmail,
      name: "Enquiry Suppressed",
      status: "suppressed",
      subscribed: false,
      suppressed: true,
      suppressionReason: "Spam complaint received",
      source: "enquiry",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(eqSuppEmail);

    const eqAudience = await resolveAudience({ type: "enquiries_only" });
    const inEqSub = eqAudience.eligible.find((r) => r.email === eqSubEmail);
    const inEqNotSub = eqAudience.eligible.find((r) => r.email === eqNotSubEmail);
    const inEqUnsub = eqAudience.eligible.find((r) => r.email === eqUnsubEmail);
    const inEqSupp = eqAudience.eligible.find((r) => r.email === eqSuppEmail);

    test("3.1 Enquiries includes subscribed enquiry contact as delivery eligible", Boolean(inEqSub && inEqSub.isEligible));
    test(
      "3.2 Enquiries includes not-subscribed enquiry contact in audience (ineligible for delivery)",
      Boolean(inEqNotSub && !inEqNotSub.isEligible && inEqNotSub.exclusionReason === "Missing verified marketing consent"),
      `exclusionReason: "${inEqNotSub?.exclusionReason}"`
    );
    test("3.3 Enquiries includes unsubscribed enquiry contact in audience (blocked from delivery)", Boolean(inEqUnsub && !inEqUnsub.isEligible));
    test("3.4 Enquiries includes suppressed enquiry contact in audience (blocked from delivery)", Boolean(inEqSupp && !inEqSupp.isEligible && inEqSupp.isSuppressed));
    test(
      "3.5 Enquiries count reconciliation matches selected sum",
      eqAudience.totalSelected ===
        eqAudience.subscribedCount +
          eqAudience.notSubscribedCount +
          eqAudience.unsubscribedCount +
          eqAudience.suppressedCount,
      `totalSelected: ${eqAudience.totalSelected}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: CONFIRMED GUESTS AUDIENCE (confirmed_guests)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: CONFIRMED GUESTS AUDIENCE (confirmed_guests) ---");
    const ordSubEmail = `guest.sub.${runId}@example.com`;
    const ordNotSubEmail = `guest.notsub.${runId}@example.com`;
    const ordUnsubEmail = `guest.unsub.${runId}@example.com`;
    const ordSuppEmail = `guest.supp.${runId}@example.com`;

    const ord1Id = Date.now() + 101;
    await OrderModel.create({
      id: ord1Id,
      guestName: "Guest Subscribed",
      guestEmail: ordSubEmail,
      guestPhone: "+919876543210",
      status: "confirmed",
      totalAmount: 45000,
      currency: "INR",
      destinations: "Kochi, Munnar",
      travelStyle: "luxury",
    });
    cleanupIds.orders.push(ord1Id);
    await SubscriberConsentModel.create({
      email: ordSubEmail,
      name: "Guest Subscribed",
      status: "subscribed",
      subscribed: true,
      consentDate: new Date(),
      source: "booking_confirmation",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(ordSubEmail);

    const ord2Id = Date.now() + 102;
    await OrderModel.create({
      id: ord2Id,
      guestName: "Guest Not Subscribed",
      guestEmail: ordNotSubEmail,
      guestPhone: "+919876543211",
      status: "completed",
      totalAmount: 60000,
      currency: "INR",
      destinations: "Alleppey",
      travelStyle: "luxury",
    });
    cleanupIds.orders.push(ord2Id);

    const ord3Id = Date.now() + 103;
    await OrderModel.create({
      id: ord3Id,
      guestName: "Guest Unsubscribed",
      guestEmail: ordUnsubEmail,
      guestPhone: "+919876543212",
      status: "confirmed",
      totalAmount: 35000,
      currency: "INR",
      destinations: "Kumarakom",
      travelStyle: "slow",
    });
    cleanupIds.orders.push(ord3Id);
    await SubscriberConsentModel.create({
      email: ordUnsubEmail,
      name: "Guest Unsubscribed",
      status: "unsubscribed",
      subscribed: false,
      unsubscribedAt: new Date(),
      source: "checkout",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(ordUnsubEmail);

    const ord4Id = Date.now() + 104;
    await OrderModel.create({
      id: ord4Id,
      guestName: "Guest Suppressed",
      guestEmail: ordSuppEmail,
      guestPhone: "+919876543213",
      status: "confirmed",
      totalAmount: 50000,
      currency: "INR",
      destinations: "Marari",
      travelStyle: "wellness",
    });
    cleanupIds.orders.push(ord4Id);
    await SubscriberConsentModel.create({
      email: ordSuppEmail,
      name: "Guest Suppressed",
      status: "suppressed",
      subscribed: false,
      suppressed: true,
      suppressionReason: "Permanent mail delivery failure",
      source: "system",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(ordSuppEmail);

    const guestAudience = await resolveAudience({ type: "confirmed_guests" });
    const inGuestSub = guestAudience.eligible.find((r) => r.email === ordSubEmail);
    const inGuestNotSub = guestAudience.eligible.find((r) => r.email === ordNotSubEmail);
    const inGuestUnsub = guestAudience.eligible.find((r) => r.email === ordUnsubEmail);
    const inGuestSupp = guestAudience.eligible.find((r) => r.email === ordSuppEmail);

    test("4.1 Confirmed Guests includes subscribed guest as delivery eligible", Boolean(inGuestSub && inGuestSub.isEligible));
    test(
      "4.2 Confirmed Guests includes not-subscribed booking in audience (ineligible for delivery)",
      Boolean(inGuestNotSub && !inGuestNotSub.isEligible && inGuestNotSub.exclusionReason === "Missing verified marketing consent"),
      `exclusionReason: "${inGuestNotSub?.exclusionReason}"`
    );
    test("4.3 Confirmed Guests includes unsubscribed guest in audience (blocked from delivery)", Boolean(inGuestUnsub && !inGuestUnsub.isEligible));
    test("4.4 Confirmed Guests includes suppressed guest in audience (blocked from delivery)", Boolean(inGuestSupp && !inGuestSupp.isEligible && inGuestSupp.isSuppressed));
    test(
      "4.5 Confirmed Guests count reconciliation matches selected sum",
      guestAudience.totalSelected ===
        guestAudience.subscribedCount +
          guestAudience.notSubscribedCount +
          guestAudience.unsubscribedCount +
          guestAudience.suppressedCount,
      `totalSelected: ${guestAudience.totalSelected}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: AUDIENCE GROUP AUDIENCE (audience_group)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: AUDIENCE GROUP AUDIENCE (audience_group) ---");
    const grpSubEmail = `group.sub.${runId}@example.com`;
    const grpNotSubEmail = `group.notsub.${runId}@example.com`;
    const grpUnsubEmail = `group.unsub.${runId}@example.com`;
    const grpSuppEmail = `group.supp.${runId}@example.com`;

    await SubscriberConsentModel.create({
      email: grpSubEmail,
      name: "Group Member Subscribed",
      status: "subscribed",
      subscribed: true,
      consentDate: new Date(),
      source: "vip_group",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(grpSubEmail);

    await SubscriberConsentModel.create({
      email: grpUnsubEmail,
      name: "Group Member Unsubscribed",
      status: "unsubscribed",
      subscribed: false,
      unsubscribedAt: new Date(),
      source: "vip_group",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(grpUnsubEmail);

    await SubscriberConsentModel.create({
      email: grpSuppEmail,
      name: "Group Member Suppressed",
      status: "suppressed",
      subscribed: false,
      suppressed: true,
      suppressionReason: "Blocked by safety admin",
      source: "system",
      token: crypto.randomBytes(24).toString("hex"),
    });
    cleanupIds.subscribers.push(grpSuppEmail);

    const testGroup = await createAudienceGroup({
      name: `VIP Test Group ${runId}`,
      description: "Group with mixed subscription statuses",
      type: "manual",
      members: [
        { email: grpSubEmail, name: "Group Member Subscribed" },
        { email: grpNotSubEmail, name: "Group Member Not Subscribed" },
        { email: grpUnsubEmail, name: "Group Member Unsubscribed" },
        { email: grpSuppEmail, name: "Group Member Suppressed" },
      ],
    });
    cleanupIds.groups.push(testGroup.id);

    const grpAudience = await resolveAudience({ type: "audience_group", groupId: testGroup.id });
    const inGrpSub = grpAudience.eligible.find((r) => r.email === grpSubEmail);
    const inGrpNotSub = grpAudience.eligible.find((r) => r.email === grpNotSubEmail);
    const inGrpUnsub = grpAudience.eligible.find((r) => r.email === grpUnsubEmail);
    const inGrpSupp = grpAudience.eligible.find((r) => r.email === grpSuppEmail);

    test("5.1 Audience Group includes subscribed member as delivery eligible", Boolean(inGrpSub && inGrpSub.isEligible));
    test(
      "5.2 Audience Group includes not-subscribed member in audience (ineligible for delivery)",
      Boolean(inGrpNotSub && !inGrpNotSub.isEligible && inGrpNotSub.exclusionReason === "Missing verified marketing consent"),
      `exclusionReason: "${inGrpNotSub?.exclusionReason}"`
    );
    test("5.3 Audience Group includes unsubscribed member in audience (blocked from delivery)", Boolean(inGrpUnsub && !inGrpUnsub.isEligible));
    test("5.4 Audience Group includes suppressed member in audience (blocked from delivery)", Boolean(inGrpSupp && !inGrpSupp.isEligible));
    test(
      "5.5 Audience Group count reconciliation matches total selected members exactly",
      grpAudience.totalSelected === 4 &&
        grpAudience.eligibleRecipients === 1 &&
        grpAudience.notSubscribedCount === 1 &&
        grpAudience.unsubscribedCount === 1 &&
        grpAudience.suppressedCount === 1,
      `totalSelected: ${grpAudience.totalSelected}, eligible: ${grpAudience.eligibleRecipients}, notSub: ${grpAudience.notSubscribedCount}, unsub: ${grpAudience.unsubscribedCount}, supp: ${grpAudience.suppressedCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: DEDUPLICATION AND INVALID EMAIL FILTERING
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: DEDUPLICATION AND INVALID EMAIL FILTERING ---");
    // Duplicate enquiry with same email
    const duplicateEmail = `duplicate.enquiry.${runId}@example.com`;
    const dup1Id = Date.now() + 10;
    const dup2Id = Date.now() + 11;
    await EnquiryModel.create({
      id: dup1Id,
      name: "Duplicate Contact 1",
      email: duplicateEmail,
      message: "First enquiry",
      status: "new",
    });
    await EnquiryModel.create({
      id: dup2Id,
      name: "Duplicate Contact 2",
      email: duplicateEmail,
      message: "Second enquiry",
      status: "replied",
    });
    cleanupIds.enquiries.push(dup1Id, dup2Id);

    // Invalid email enquiry
    const badEqId = Date.now() + 12;
    await EnquiryModel.create({
      id: badEqId,
      name: "Invalid Email Person",
      email: "invalid-email-no-at-sign",
      message: "Invalid email",
      status: "new",
    });
    cleanupIds.enquiries.push(badEqId);

    const dedupAudience = await resolveAudience({ type: "enquiries_only" });
    const duplicateOccurrences = dedupAudience.eligible.filter((r) => r.email === duplicateEmail);
    const badEmailFound = dedupAudience.eligible.find((r) => r.email === "invalid-email-no-at-sign");

    test("6.1 Duplicate emails across multiple enquiries are strictly deduplicated to 1 entry", duplicateOccurrences.length === 1);
    test("6.2 Invalid email format without @ is excluded from audience resolution", badEmailFound === undefined);

    // -------------------------------------------------------------------------
    // TEST 7: CAMPAIGN PREVIEW & PRE-SEND VALIDATION INTEGRITY
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: CAMPAIGN PREVIEW & PRE-SEND VALIDATION ---");
    const testCampaign = await createCampaign({
      name: `Group Preview Integrity Test ${runId}`,
      subject: "Exclusive Kerala Expedition for Group",
      contentHtml: "<p>Hello {{name}}, explore your journey.</p>",
      previewText: "Exclusive invitation",
      targetAudience: { type: "audience_group", groupId: testGroup.id },
    });
    cleanupIds.campaigns.push(testCampaign.id);

    const preview = await previewCampaignAudience(testCampaign.id);
    test(
      "7.1 Preview returns exact 6-count breakdown for audience group",
      preview.totalSelected === 4 &&
        preview.eligibleRecipients === 1 &&
        preview.subscribedCount === 1 &&
        preview.notSubscribedCount === 1 &&
        preview.unsubscribedCount === 1 &&
        preview.suppressedCount === 1,
      `totalSelected: ${preview.totalSelected}, eligible: ${preview.eligibleRecipients}`
    );

    const preSend = await validateCampaignPreSend(testCampaign.id);
    const notSubPreSendReason = preSend.exclusionReasons.find((e) => e.email === grpNotSubEmail);
    const unsubPreSendReason = preSend.exclusionReasons.find((e) => e.email === grpUnsubEmail);
    const suppPreSendReason = preSend.exclusionReasons.find((e) => e.email === grpSuppEmail);

    test("7.2 Pre-send validation readyToSend count matches eligible delivery count exactly", preSend.readyToSend === preview.eligibleRecipients);
    test(
      "7.3 Pre-send validation exclusion reason for not-subscribed is 'Missing verified marketing consent'",
      Boolean(notSubPreSendReason && notSubPreSendReason.reason === "Missing verified marketing consent"),
      `reason: "${notSubPreSendReason?.reason}"`
    );
    test("7.4 Pre-send validation blocks unsubscribed contact with code UNSUBSCRIBED", Boolean(unsubPreSendReason && unsubPreSendReason.code === "UNSUBSCRIBED"));
    test("7.5 Pre-send validation blocks suppressed contact with code SUPPRESSED", Boolean(suppPreSendReason && suppPreSendReason.code === "SUPPRESSED"));

    // -------------------------------------------------------------------------
    // TEST 8: DISPATCH EXECUTION SAFETY & CONSISTENT SEND-TIME ELIGIBILITY
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: DISPATCH EXECUTION SAFETY & SEND-TIME ELIGIBILITY ---");
    const sentCampaign = await sendCampaign(testCampaign.id);

    const delivSub = sentCampaign.deliveries.find((d) => d.recipientEmail === grpSubEmail);
    const delivNotSub = sentCampaign.deliveries.find((d) => d.recipientEmail === grpNotSubEmail);
    const delivUnsub = sentCampaign.deliveries.find((d) => d.recipientEmail === grpUnsubEmail);
    const delivSupp = sentCampaign.deliveries.find((d) => d.recipientEmail === grpSuppEmail);

    test("8.1 Subscribed group member is delivered", Boolean(delivSub && (delivSub.status === "sent" || delivSub.status === "accepted")));
    test(
      "8.2 Not-subscribed group member is safely skipped at dispatch with missing consent reason",
      Boolean(delivNotSub && delivNotSub.status === "skipped_unsubscribed" && delivNotSub.error?.includes("Missing verified marketing consent")),
      `status: ${delivNotSub?.status}, error: "${delivNotSub?.error}"`
    );
    test(
      "8.3 Unsubscribed member is strictly blocked at dispatch with opted-out reason",
      Boolean(delivUnsub && delivUnsub.status === "skipped_unsubscribed" && delivUnsub.error?.includes("opted out")),
      `status: ${delivUnsub?.status}`
    );
    test(
      "8.4 Suppressed member is strictly blocked at dispatch with suppression reason",
      Boolean(delivSupp && delivSupp.status === "skipped_unsubscribed" && delivSupp.error?.includes("suppressed")),
      `status: ${delivSupp?.status}`
    );

    // Verify exactly 1 email was actually sent through provider
    test("8.5 Email provider was called ONLY for the 1 eligible subscribed recipient", sentEmails.length === 1 && sentEmails[0].to === grpSubEmail);

  } catch (err: any) {
    console.error("Test execution failed with unhandled exception:", err);
    test("Test Suite Execution", false, err?.message || String(err));
  } finally {
    console.log("\n--- CLEANUP TEST FIXTURES ---");
    try {
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
      setResendClientForTesting(null);
      (config as any).campaignSendingEnabled = false;
      console.log("Cleanup completed.");
    } catch (cleanErr: any) {
      console.warn("Cleanup warning:", cleanErr?.message);
    }
    await disconnectDB();
  }

  console.log("\n================================================================================");
  console.log(`TOTAL SCENARIOS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
