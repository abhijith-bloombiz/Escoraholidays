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
  sendCampaign,
  createCampaign,
  scheduleCampaign,
  handleUnsubscribe,
} from "../apps/api-server/src/services/campaign-service";
import { processDueScheduledCampaigns } from "../apps/api-server/src/services/campaign-scheduler";
import { config } from "../apps/api-server/src/config/env";
import { setResendClientForTesting } from "../apps/api-server/src/lib/email";

let testsPassed = 0;
let testsFailed = 0;

function report(step: string, ok: boolean, details?: string) {
  if (ok) {
    testsPassed++;
    console.log(`  [PASS] ${step}`);
    if (details) console.log(`         ↳ ${details}`);
  } else {
    testsFailed++;
    console.error(`  [FAIL] ${step}`);
    if (details) console.error(`         ↳ ERROR: ${details}\n`);
  }
}

async function run() {
  console.log("================================================================================");
  console.log("   ESCORA HOLIDAYS — ALL CONTACTS AUDIENCE ELIGIBILITY VERIFICATION            ");
  console.log("================================================================================\n");

  await connectDB();

  const runId = Date.now().toString(36);
  const cleanupIds = {
    enquiries: [] as number[],
    orders: [] as number[],
    subscribers: [] as string[],
    campaigns: [] as number[],
  };

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES ACROSS ALL FOUR CONSENT STATES
    // -------------------------------------------------------------------------
    console.log("--- 1. SETTING UP TEST FIXTURES ACROSS 4 CONSENT STATES ---");

    const emailSubscribed = `guest.subscribed.${runId}@example.com`;
    const emailNotSubscribed = `guest.not.subscribed.${runId}@example.com`;
    const emailNoConsentRecord = `guest.no.record.${runId}@example.com`;
    const emailUnsubscribed = `guest.unsubscribed.${runId}@example.com`;
    const emailSuppressed = `guest.suppressed.${runId}@example.com`;

    // 1. Subscribed contact (via enquiry + explicit consent)
    const eq1Id = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eq1Id,
      name: "Subscribed Guest",
      email: emailSubscribed,
      message: "Looking for slow travel journey",
      status: "new",
    });
    cleanupIds.enquiries.push(eq1Id);
    await SubscriberConsentModel.create({
      email: emailSubscribed,
      name: "Subscribed Guest",
      status: "subscribed",
      subscribed: true,
      token: crypto.randomBytes(24).toString("hex"),
      source: "website_plan_journey",
      consentDate: new Date(),
    });
    cleanupIds.subscribers.push(emailSubscribed);

    // 2. Not Subscribed contact with explicit not_subscribed record
    const eq2Id = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eq2Id,
      name: "Not Subscribed Guest",
      email: emailNotSubscribed,
      message: "Enquiry without marketing consent checkbox",
      status: "new",
    });
    cleanupIds.enquiries.push(eq2Id);
    await SubscriberConsentModel.create({
      email: emailNotSubscribed,
      name: "Not Subscribed Guest",
      status: "not_subscribed",
      subscribed: false,
      token: crypto.randomBytes(24).toString("hex"),
      source: "website_contact_form",
    });
    cleanupIds.subscribers.push(emailNotSubscribed);

    // 3. No recorded consent (Order booking customer without consent row in SubscriberConsentModel)
    const ord1Id = await getNextSequence("orders");
    await OrderModel.create({
      id: ord1Id,
      guestName: "Booking Guest No Consent Record",
      guestEmail: emailNoConsentRecord,
      guestPhone: "+91 98765 43210",
      status: "confirmed",
      destinations: "Kumarakom, Marari",
    });
    cleanupIds.orders.push(ord1Id);
    // Deliberately no SubscriberConsentModel record created!

    // 4. Unsubscribed contact (previously opted out)
    const eq3Id = await getNextSequence("enquiries");
    await EnquiryModel.create({
      id: eq3Id,
      name: "Unsubscribed Guest",
      email: emailUnsubscribed,
      message: "Past inquiry, now opted out",
      status: "read",
    });
    cleanupIds.enquiries.push(eq3Id);
    await SubscriberConsentModel.create({
      email: emailUnsubscribed,
      name: "Unsubscribed Guest",
      status: "unsubscribed",
      subscribed: false,
      unsubscribedAt: new Date(),
      token: crypto.randomBytes(24).toString("hex"),
      source: "newsletter",
    });
    cleanupIds.subscribers.push(emailUnsubscribed);

    // 5. Suppressed contact (spam complaint / hard bounce)
    const ord2Id = await getNextSequence("orders");
    await OrderModel.create({
      id: ord2Id,
      guestName: "Suppressed Guest",
      guestEmail: emailSuppressed,
      guestPhone: "+91 91234 56789",
      status: "confirmed",
      destinations: "Wayanad",
    });
    cleanupIds.orders.push(ord2Id);
    await SubscriberConsentModel.create({
      email: emailSuppressed,
      name: "Suppressed Guest",
      status: "suppressed",
      subscribed: false,
      suppressed: true,
      suppressionReason: "Permanent hard bounce mailbox unavailable",
      token: crypto.randomBytes(24).toString("hex"),
      source: "system",
    });
    cleanupIds.subscribers.push(emailSuppressed);

    report("1.1 Fixtures Initialized", true, "Created 5 contacts representing Subscribed, Not Subscribed, No Consent Record, Unsubscribed, and Suppressed");

    // -------------------------------------------------------------------------
    // 2. AUDIENCE RESOLUTION VERIFICATION FOR ALL CONTACTS
    // -------------------------------------------------------------------------
    console.log("\n--- 2. AUDIENCE RESOLUTION FOR ALL CONTACTS ---");
    const allContactsAudience = await resolveAudience({ type: "all_contacts" });

    const foundSubscribed = allContactsAudience.eligible.find((r) => r.email === emailSubscribed);
    const foundNotSubscribed = allContactsAudience.eligible.find((r) => r.email === emailNotSubscribed);
    const foundNoRecord = allContactsAudience.eligible.find((r) => r.email === emailNoConsentRecord);
    const foundUnsubscribed = allContactsAudience.eligible.find((r) => r.email === emailUnsubscribed);
    const foundSuppressed = allContactsAudience.eligible.find((r) => r.email === emailSuppressed);

    report("2.1 Subscribed Contact Included in All Contacts", Boolean(foundSubscribed && foundSubscribed.consentStatus === "subscribed"));
    report("2.2 Not Subscribed Contact Included in All Contacts", Boolean(foundNotSubscribed && foundNotSubscribed.consentStatus === "not_subscribed"));
    report("2.3 No Consent Record Contact Included in All Contacts", Boolean(foundNoRecord && foundNoRecord.consentStatus === "not_subscribed"));
    report("2.4 In-Memory Deterministic Token Assigned for No Consent Record", Boolean(foundNoRecord && foundNoRecord.token && foundNoRecord.token.length >= 32));
    report("2.5 Unsubscribed Contact Gathered with consentStatus='unsubscribed'", Boolean(foundUnsubscribed && foundUnsubscribed.consentStatus === "unsubscribed"));
    report("2.6 Suppressed Contact Gathered with isSuppressed=true", Boolean(foundSuppressed && foundSuppressed.isSuppressed === true));

    // Check eligible counts for all_contacts
    report(
      "2.7 Eligible Recipients in All Contacts Includes Only Contacts with Verified Consent",
      allContactsAudience.eligibleRecipients === allContactsAudience.activeSubscribers &&
        allContactsAudience.excludedNotSubscribed === allContactsAudience.notSubscribedCount,
      `eligibleRecipients: ${allContactsAudience.eligibleRecipients}, activeSubscribers: ${allContactsAudience.activeSubscribers}, excludedNotSubscribed: ${allContactsAudience.excludedNotSubscribed}`
    );

    // -------------------------------------------------------------------------
    // 3. AUDIENCE ESTIMATE & PREVIEW FOR ALL CONTACTS
    // -------------------------------------------------------------------------
    console.log("\n--- 3. CAMPAIGN PREVIEW & ESTIMATES ---");
    const campAll = await createCampaign({
      name: `All Contacts Preview Test ${runId}`,
      subject: "Exclusive Kerala Slow Luxury Journey",
      contentHtml: "<p>Hello {{name}}, explore our sanctuaries at {{destination}}.</p>",
      previewText: "Experience slow travel",
      targetAudience: { type: "all_contacts" },
    });
    cleanupIds.campaigns.push(campAll.id);

    const previewAll = await previewCampaignAudience(campAll.id);
    report(
      "3.1 Preview Distinguishes Total Selected from Eligible Recipients and Excluded Categories",
      previewAll.totalSelected >= 5 &&
        previewAll.eligibleRecipients === previewAll.activeSubscribers &&
        previewAll.excludedNotSubscribed === previewAll.notSubscribedCount &&
        previewAll.totalSelected === previewAll.subscribedCount + previewAll.notSubscribedCount + previewAll.unsubscribedCount + previewAll.suppressedCount,
      `totalSelected: ${previewAll.totalSelected}, eligible: ${previewAll.eligibleRecipients}, notSubscribed: ${previewAll.notSubscribedCount}, unsubscribed: ${previewAll.excludedUnsubscribed}, suppressed: ${previewAll.excludedSuppressed}`
    );

    // -------------------------------------------------------------------------
    // 4. PRE-SEND VALIDATION & EXCLUSION REASONS FOR ALL CONTACTS
    // -------------------------------------------------------------------------
    console.log("\n--- 4. PRE-SEND VALIDATION FOR ALL CONTACTS ---");
    const preSendAll = await validateCampaignPreSend(campAll.id);

    const subExcludedAll = preSendAll.exclusionReasons.find((e) => e.email === emailSubscribed);
    const notSubExcludedAll = preSendAll.exclusionReasons.find((e) => e.email === emailNotSubscribed);
    const noRecordExcludedAll = preSendAll.exclusionReasons.find((e) => e.email === emailNoConsentRecord);
    const unsubExcludedAll = preSendAll.exclusionReasons.find((e) => e.email === emailUnsubscribed);
    const suppExcludedAll = preSendAll.exclusionReasons.find((e) => e.email === emailSuppressed);

    report("4.1 Subscribed Contact NOT Excluded in All Contacts Pre-Send", !subExcludedAll);
    report("4.2 Not Subscribed Contact EXCLUDED with code NOT_SUBSCRIBED", Boolean(notSubExcludedAll && notSubExcludedAll.code === "NOT_SUBSCRIBED"));
    report("4.3 No Consent Record Contact EXCLUDED with code NOT_SUBSCRIBED", Boolean(noRecordExcludedAll && noRecordExcludedAll.code === "NOT_SUBSCRIBED"));
    report("4.4 Unsubscribed Contact EXCLUDED with code UNSUBSCRIBED", Boolean(unsubExcludedAll && unsubExcludedAll.code === "UNSUBSCRIBED"));
    report("4.5 Suppressed Contact EXCLUDED with code SUPPRESSED", Boolean(suppExcludedAll && suppExcludedAll.code === "SUPPRESSED"));

    // -------------------------------------------------------------------------
    // 5. SUBSCRIBED CONTACTS ONLY COMPARISON (MUST REMAIN CONSENT RESTRICTED)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. COMPARISON WITH SUBSCRIBED CONTACTS ONLY ---");
    const campSub = await createCampaign({
      name: `Subscribed Contacts Only Test ${runId}`,
      subject: "Subscribers Only Invitation",
      contentHtml: "<p>Hello {{name}}, welcome back.</p>",
      targetAudience: { type: "subscribed_contacts" },
    });
    cleanupIds.campaigns.push(campSub.id);

    const previewSub = await previewCampaignAudience(campSub.id);
    const preSendSub = await validateCampaignPreSend(campSub.id);

    // In Subscribed Contacts Only, eligibleRecipients must strictly equal activeSubscribers
    report(
      "5.1 Subscribed Contacts Only strictly requires explicit consent",
      previewSub.eligibleRecipients === previewSub.activeSubscribers,
      `eligibleRecipients: ${previewSub.eligibleRecipients}, activeSubscribers: ${previewSub.activeSubscribers}`
    );

    // In Subscribed Contacts Only, unconsented contacts are not in audience or excluded
    const notSubInSub = previewSub.sampleRecipients.find((r) => r.email === emailNotSubscribed || r.email === emailNoConsentRecord);
    report("5.2 Unconsented Contacts NOT Present in Subscribed Contacts Audience", !notSubInSub);

    // -------------------------------------------------------------------------
    // 6. IMMEDIATE DISPATCH EXECUTION FOR ALL CONTACTS
    // -------------------------------------------------------------------------
    console.log("\n--- 6. IMMEDIATE CAMPAIGN DISPATCH EXECUTION ---");
    // Enable mock email provider mode in process so emails simulate delivery without hitting live SMTP
    (config as any).campaignSendingEnabled = true;
    setResendClientForTesting({
      emails: {
        send: async () => ({ data: { id: "mock-msg-" + Date.now() }, error: null }),
      },
    });

    const sentCampaign = await sendCampaign(campAll.id);

    assert(Array.isArray(sentCampaign.deliveries), "Deliveries must be recorded");

    const deliverySubscribed = sentCampaign.deliveries.find((d) => d.recipientEmail === emailSubscribed);
    const deliveryNotSubscribed = sentCampaign.deliveries.find((d) => d.recipientEmail === emailNotSubscribed);
    const deliveryNoRecord = sentCampaign.deliveries.find((d) => d.recipientEmail === emailNoConsentRecord);
    const deliveryUnsubscribed = sentCampaign.deliveries.find((d) => d.recipientEmail === emailUnsubscribed);
    const deliverySuppressed = sentCampaign.deliveries.find((d) => d.recipientEmail === emailSuppressed);

    // Subscribed contact must be dispatched (sent / simulated / accepted)
    report(
      "6.1 Subscribed Contact Dispatched in All Contacts",
      Boolean(deliverySubscribed && ["sent", "simulated", "accepted", "delivered"].includes(deliverySubscribed.status)),
      `Status: ${deliverySubscribed?.status}`
    );

    // Not Subscribed contact must be skipped as unconsented
    report(
      "6.2 Not Subscribed Contact SKIPPED in All Contacts (skipped_unsubscribed recorded)",
      Boolean(deliveryNotSubscribed && deliveryNotSubscribed.status === "skipped_unsubscribed"),
      `Status: ${deliveryNotSubscribed?.status}, error: ${deliveryNotSubscribed?.error}`
    );

    // No Record contact must be skipped as unconsented
    report(
      "6.3 Contact Without Initial Consent Record SKIPPED in All Contacts (skipped_unsubscribed recorded)",
      Boolean(deliveryNoRecord && deliveryNoRecord.status === "skipped_unsubscribed"),
      `Status: ${deliveryNoRecord?.status}, error: ${deliveryNoRecord?.error}`
    );

    // Unsubscribed contact MUST BE SKIPPED
    report(
      "6.4 Unsubscribed Contact NEVER Dispatched (skipped_unsubscribed recorded)",
      Boolean(deliveryUnsubscribed && deliveryUnsubscribed.status === "skipped_unsubscribed"),
      `Status: ${deliveryUnsubscribed?.status}, error: ${deliveryUnsubscribed?.error}`
    );

    // Suppressed contact MUST BE SKIPPED
    report(
      "6.5 Suppressed Contact NEVER Dispatched (skipped_unsubscribed recorded)",
      Boolean(deliverySuppressed && deliverySuppressed.status === "skipped_unsubscribed"),
      `Status: ${deliverySuppressed?.status}, error: ${deliverySuppressed?.error}`
    );

    // -------------------------------------------------------------------------
    // 7. SCHEDULED CAMPAIGN DISPATCH EXECUTION FOR ALL CONTACTS
    // -------------------------------------------------------------------------
    console.log("\n--- 7. SCHEDULED CAMPAIGN DISPATCH EXECUTION ---");
    const campSched = await createCampaign({
      name: `All Contacts Scheduled Test ${runId}`,
      subject: "Scheduled Kerala Slow Travel Update",
      contentHtml: "<p>Hello {{name}}, scheduled message.</p>",
      targetAudience: { type: "all_contacts" },
    });
    cleanupIds.campaigns.push(campSched.id);

    // Schedule for 1 minute in the past so it is immediately due for processing
    const pastTime = new Date(Date.now() - 60000).toISOString();
    await CampaignModel.updateOne(
      { id: campSched.id },
      { $set: { status: "scheduled", scheduledAt: new Date(pastTime) } }
    );

    const processedCampaign = await processDueScheduledCampaigns();
    assert(processedCampaign, "Scheduled campaign must be processed by scheduler");

    const schedDelivNotSub = processedCampaign.deliveries.find((d) => d.recipientEmail === emailNotSubscribed);
    const schedDelivUnsub = processedCampaign.deliveries.find((d) => d.recipientEmail === emailUnsubscribed);
    const schedDelivSupp = processedCampaign.deliveries.find((d) => d.recipientEmail === emailSuppressed);

    report(
      "7.1 Scheduled Dispatch Strictly Skips Not Subscribed Contact",
      Boolean(schedDelivNotSub && schedDelivNotSub.status === "skipped_unsubscribed"),
      `Status: ${schedDelivNotSub?.status}, error: ${schedDelivNotSub?.error}`
    );
    report(
      "7.2 Scheduled Dispatch Strictly Skips Unsubscribed Contact",
      Boolean(schedDelivUnsub && schedDelivUnsub.status === "skipped_unsubscribed"),
      `Status: ${schedDelivUnsub?.status}`
    );
    report(
      "7.3 Scheduled Dispatch Strictly Skips Suppressed Contact",
      Boolean(schedDelivSupp && schedDelivSupp.status === "skipped_unsubscribed"),
      `Status: ${schedDelivSupp?.status}`
    );

    // -------------------------------------------------------------------------
    // 8. ONE-CLICK UNSUBSCRIBE TEST FOR DETERMINISTIC TOKEN
    // -------------------------------------------------------------------------
    console.log("\n--- 8. ONE-CLICK UNSUBSCRIBE FOR CONTACT WITH DETERMINISTIC TOKEN ---");
    // foundNoRecord was not initially in SubscriberConsentModel
    assert(foundNoRecord?.token, "Token must exist for contact without initial consent record");

    const unsubResult = await handleUnsubscribe(foundNoRecord.token, emailNoConsentRecord);
    report("8.1 handleUnsubscribe succeeds with deterministic token", unsubResult.ok === true);

    const dbConsentAfterUnsub = await SubscriberConsentModel.findOne({ email: emailNoConsentRecord });
    report(
      "8.2 Contact is now persisted as unsubscribed in SubscriberConsentModel",
      Boolean(dbConsentAfterUnsub && dbConsentAfterUnsub.status === "unsubscribed" && dbConsentAfterUnsub.subscribed === false),
      `status: ${dbConsentAfterUnsub?.status}, unsubscribedAt: ${dbConsentAfterUnsub?.unsubscribedAt}`
    );
    cleanupIds.subscribers.push(emailNoConsentRecord);

    // Re-verify that subsequent dispatch to this email is now permanently BLOCKED
    const campAfterUnsub = await createCampaign({
      name: `Post Unsubscribe Test ${runId}`,
      subject: "Test Post Unsubscribe",
      contentHtml: "<p>Hello {{name}}</p>",
      targetAudience: { type: "all_contacts" },
    });
    cleanupIds.campaigns.push(campAfterUnsub.id);

    const postUnsubSent = await sendCampaign(campAfterUnsub.id);
    const postDeliv = postUnsubSent.deliveries.find((d) => d.recipientEmail === emailNoConsentRecord);
    report(
      "8.3 Contact who unsubscribed via deterministic link is now permanently skipped",
      Boolean(postDeliv && postDeliv.status === "skipped_unsubscribed"),
      `Status: ${postDeliv?.status}, error: ${postDeliv?.error}`
    );

  } catch (err: any) {
    console.error("Test execution error:", err);
    report("Test Runner Execution", false, err?.message || String(err));
  } finally {
    console.log("\n--- CLEANUP ---");
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
      if (cleanupIds.campaigns.length > 0) {
        await CampaignModel.deleteMany({ id: { $in: cleanupIds.campaigns } });
      }
      setResendClientForTesting(null);
      (config as any).campaignSendingEnabled = false;
      console.log("Cleanup completed.");
    } catch (cleanupErr: any) {
      console.warn("Cleanup error:", cleanupErr?.message);
    }
    await disconnectDB();
  }

  console.log("\n================================================================================");
  console.log(`TOTAL SCENARIOS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
  console.log("================================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
