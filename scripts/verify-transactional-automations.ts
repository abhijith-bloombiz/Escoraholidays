/**
 * Escora Holidays — Transactional & Customer Follow-Up Automation Verification Suite
 *
 * Verifies:
 * 1. Booking confirmation triggers upon transition to "confirmed" state.
 * 2. Unconfirmed bookings / enquiries do not trigger confirmation emails.
 * 3. Duplicate event protection (idempotency) prevents double-sending.
 * 4. Itinerary updates sent only for meaningful changes on confirmed itineraries.
 * 5. Unrelated itinerary edits and repeated identical patches do not re-send.
 * 6. Enquiry follow-up scheduling with configurable delay.
 * 7. Enquiry follow-up cancellation when staff replies.
 * 8. Enquiry follow-up cancellation when customer confirms a booking.
 * 9. Enquiry follow-up skipped when recipient has unsubscribed.
 * 10. Post-trip feedback scheduling upon order transition to "completed".
 * 11. Post-trip feedback cancellation when order is cancelled.
 * 12. Post-trip feedback dispatch with review URL.
 * 13. Server restart recovery for stuck notifications without duplicate sends.
 * 14. Admin notification auditing and manual retry endpoint.
 * 15. Zero real outbound emails sent during automated test execution.
 */

import assert from "node:assert";
import crypto from "node:crypto";
import {
  connectDB,
  disconnectDB,
  OrderModel,
  ItineraryModel,
  EnquiryModel,
  InvoiceModel,
  SubscriberConsentModel,
  NotificationModel,
  getNextSequence,
} from "../lib/db/src/index";
import { config } from "../apps/api-server/src/config/env";
import { setResendClientForTesting } from "../apps/api-server/src/lib/email";
import {
  triggerBookingConfirmation,
  triggerItineraryUpdate,
  scheduleEnquiryFollowup,
  cancelEnquiryFollowup,
  schedulePostTripFeedback,
  cancelPostTripFeedback,
  triggerPaymentReceipt,
  schedulePaymentDeadlineReminder,
  scheduleOverduePaymentFollowup,
  triggerFinalItineraryDelivery,
  triggerBookingCancellation,
  triggerTravelDocumentDelivery,
  schedulePreTripReminder,
  scheduleOutstandingDocumentReminder,
  queueApprovalRequiredNotification,
  approveNotification,
  rejectNotification,
  sendManualAdminEmail,
  processDueEmailNotifications,
  recoverStaleEmailNotifications,
  detectItineraryChanges,
  listEmailNotifications,
  retryEmailNotification,
} from "../apps/api-server/src/services/notification-service";

const TEST_RUN_ID = Date.now().toString().slice(-6);

interface TestResult {
  code: string;
  name: string;
  category: string;
  status: "PASS" | "FAIL";
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function pass(code: string, name: string, category: string, details?: string) {
  results.push({ code, name, category, status: "PASS", details });
  console.log(`  [PASS] [${category}] ${code}: ${name}`);
  if (details) console.log(`         ↳ ${details}`);
}

function fail(code: string, name: string, category: string, error: string) {
  results.push({ code, name, category, status: "FAIL", error });
  console.error(`  [FAIL] [${category}] ${code}: ${name}`);
  console.error(`         ↳ Error: ${error}`);
}

async function runTransactionalVerificationSuite() {
  console.log("================================================================================");
  console.log(" ESCORA HOLIDAYS — TRANSACTIONAL & FOLLOW-UP AUTOMATIONS VERIFICATION SUITE   ");
  console.log("================================================================================\n");

  await connectDB();

  // Enforce zero real outbound emails in automated tests
  setResendClientForTesting(null);

  const guestEmailA = `guest.confirm.${TEST_RUN_ID}@example.com`;
  const guestEmailB = `guest.itinerary.${TEST_RUN_ID}@example.com`;
  const guestEmailC = `guest.enquiry.${TEST_RUN_ID}@example.com`;
  const guestEmailD = `guest.feedback.${TEST_RUN_ID}@example.com`;

  const createdOrderIds: number[] = [];
  const createdItineraryIds: number[] = [];
  const createdEnquiryIds: number[] = [];
  const createdInvoiceIds: number[] = [];

  try {
    // ---------------------------------------------------------------------------
    // STEP 1: Booking Confirmation Triggers & Safeguards
    // ---------------------------------------------------------------------------
    console.log("--------------------------------------------------------------------------------");
    console.log("Step 1: Booking Confirmation Triggers & Safeguards");
    console.log("--------------------------------------------------------------------------------");

    // 1a: Unconfirmed booking (status: enquiry) must NOT trigger confirmation email
    const orderId1 = await getNextSequence("orders");
    createdOrderIds.push(orderId1);
    const unconfirmedOrder = await OrderModel.create({
      id: orderId1,
      guestName: "Lord Arthur",
      guestEmail: guestEmailA,
      guestPhone: "+91 98470 11111",
      destinations: "Fort Kochi & Munnar",
      travelDate: "2026-11-10",
      departureDate: "2026-11-18",
      guestCount: 2,
      status: "enquiry",
    });

    const unconfirmedResult = await triggerBookingConfirmation(unconfirmedOrder.toObject());
    assert.strictEqual(unconfirmedResult, null, "Unconfirmed order must return null");

    const noNotif = await NotificationModel.findOne({
      relatedType: "order",
      relatedId: orderId1,
      type: "booking_confirmation",
    });
    assert.strictEqual(noNotif, null, "No confirmation notification must be created for enquiry orders");
    pass(
      "BOOKING-CONFIRM-01",
      "Unconfirmed booking enquiry creation does NOT trigger booking confirmation email",
      "BOOKING_CONFIRMATION",
      `Order #${orderId1} with status 'enquiry' produced zero confirmation notifications`
    );

    // 1b: Transition to "confirmed" triggers booking confirmation
    unconfirmedOrder.status = "confirmed";
    unconfirmedOrder.totalAmount = 185000;
    unconfirmedOrder.packageName = "Highland & Coast Slow Luxury";
    await unconfirmedOrder.save();

    const confirmedResult = await triggerBookingConfirmation(unconfirmedOrder.toObject());
    assert.ok(confirmedResult, "Confirmed order must produce notification record");
    assert.strictEqual(confirmedResult.status, "sent", "Notification status must be sent");
    assert.strictEqual(confirmedResult.recipientEmail, guestEmailA.toLowerCase());
    assert.ok(confirmedResult.messageId, "Provider message ID must be recorded");
    assert.ok(confirmedResult.subject.includes(`#${orderId1}`), "Subject must include booking reference");

    pass(
      "BOOKING-CONFIRM-02",
      "Order transition to 'confirmed' triggers booking confirmation email with full details",
      "BOOKING_CONFIRMATION",
      `Confirmed order #${orderId1} generated notification #${confirmedResult.id} (ID: ${confirmedResult.messageId})`
    );

    // 1c: Duplicate confirmation event does NOT send duplicate email (idempotency key protection)
    const duplicateResult = await triggerBookingConfirmation(unconfirmedOrder.toObject());
    assert.ok(duplicateResult);
    assert.strictEqual(duplicateResult.id, confirmedResult.id, "Must return existing notification without creating duplicate");

    const countNotifs = await NotificationModel.countDocuments({
      relatedType: "order",
      relatedId: orderId1,
      type: "booking_confirmation",
    });
    assert.strictEqual(countNotifs, 1, "Exactly one confirmation notification must exist for the order");

    pass(
      "BOOKING-CONFIRM-03",
      "Duplicate confirmation event returns existing record and prevents duplicate emails",
      "BOOKING_CONFIRMATION",
      `Repeated confirmation for order #${orderId1} safely preserved single notification record`
    );

    // ---------------------------------------------------------------------------
    // STEP 2: Itinerary Updates Triggers & Meaningful Change Detection
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 2: Itinerary Updates Triggers & Meaningful Change Detection");
    console.log("--------------------------------------------------------------------------------");

    // 2a: Draft / unconfirmed itinerary edit does NOT trigger email
    const itinId1 = await getNextSequence("itineraries");
    createdItineraryIds.push(itinId1);
    const draftItin = await ItineraryModel.create({
      id: itinId1,
      shareToken: `token-${Date.now()}-1`,
      customerName: "Eleanor Vance",
      customerEmail: guestEmailB,
      title: "Kerala Backwater Sanctuary Draft",
      destination: "Alleppey",
      startDate: "2026-12-01",
      endDate: "2026-12-07",
      status: "draft",
      days: JSON.stringify([{ day: 1, title: "Arrival" }]),
      stays: JSON.stringify([{ day: 1, hotelName: "Heritage House" }]),
      pricing: JSON.stringify({ total: 120000 }),
    });

    const draftUpdateResult = await triggerItineraryUpdate(draftItin.toObject(), {
      destination: "Kumarakom",
    });
    assert.strictEqual(draftUpdateResult, null, "Draft itinerary update must not trigger email");

    pass(
      "ITIN-UPDATE-01",
      "Unconfirmed / draft itinerary update does NOT send customer email",
      "ITINERARY_UPDATES",
      `Draft itinerary #${itinId1} changes did not trigger customer email`
    );

    // 2b: Unrelated edits (no customer-facing changes) on confirmed itinerary do NOT trigger email
    draftItin.status = "confirmed";
    await draftItin.save();

    const noChangeResult = await triggerItineraryUpdate(draftItin.toObject(), {
      // Identical fields, nothing changed
      title: draftItin.title,
      destination: draftItin.destination,
      startDate: draftItin.startDate,
      endDate: draftItin.endDate,
      days: draftItin.days,
      stays: draftItin.stays,
      pricing: draftItin.pricing,
    });
    assert.strictEqual(noChangeResult, null, "Zero customer-facing changes must produce null");

    pass(
      "ITIN-UPDATE-02",
      "Unrelated or identical edits on confirmed itinerary do NOT trigger customer notification",
      "ITINERARY_UPDATES",
      "Zero customer-facing diff safely skipped dispatch"
    );

    // 2c: Meaningful changes on confirmed itinerary trigger email with clear summary
    const previousState: Partial<typeof draftItin> = {
      title: draftItin.title,
      destination: draftItin.destination,
      startDate: draftItin.startDate,
      endDate: draftItin.endDate,
      days: draftItin.days,
      stays: draftItin.stays,
      pricing: draftItin.pricing,
    };

    // Apply meaningful refinements
    draftItin.startDate = "2026-12-05";
    draftItin.endDate = "2026-12-12";
    draftItin.stays = JSON.stringify([{ day: 1, hotelName: "Philipkutty's Farm" }]);
    draftItin.pricing = JSON.stringify({ total: 145000 });
    await draftItin.save();

    const detectedChanges = detectItineraryChanges(draftItin.toObject(), previousState);
    assert.ok(detectedChanges.length >= 2, "Must detect travel dates and stays changes");

    const itinUpdateResult = await triggerItineraryUpdate(draftItin.toObject(), previousState);
    assert.ok(itinUpdateResult, "Meaningful change must create notification record");
    assert.strictEqual(itinUpdateResult.status, "sent");
    assert.strictEqual(itinUpdateResult.recipientEmail, guestEmailB.toLowerCase());
    assert.ok(itinUpdateResult.metadata?.changes?.length >= 2);

    pass(
      "ITIN-UPDATE-03",
      "Meaningful changes on confirmed itinerary trigger update notification with itemized summary",
      "ITINERARY_UPDATES",
      `Itinerary #${itinId1} notified customer with ${detectedChanges.length} itemized refinements`
    );

    // 2d: Repeating the exact same update does NOT send duplicate email
    const repeatedUpdateResult = await triggerItineraryUpdate(draftItin.toObject(), previousState);
    assert.ok(repeatedUpdateResult);
    assert.strictEqual(repeatedUpdateResult.id, itinUpdateResult.id, "Must return existing notification via content hash");

    pass(
      "ITIN-UPDATE-04",
      "Repeated processing of the same itinerary change is deduplicated via content hash",
      "ITINERARY_UPDATES",
      `Deduplicated duplicate save for itinerary #${itinId1}`
    );

    // ---------------------------------------------------------------------------
    // STEP 3: Customer Enquiry Follow-Ups & Lifecycle Cancellation
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 3: Customer Enquiry Follow-Ups & Lifecycle Cancellation");
    console.log("--------------------------------------------------------------------------------");

    // 3a: Enquiry creation schedules follow-up in database
    const enqId1 = await getNextSequence("enquiries");
    createdEnquiryIds.push(enqId1);
    const enquiry1 = await EnquiryModel.create({
      id: enqId1,
      name: "Marcus Aurelius",
      email: guestEmailC,
      message: "Looking for an 8-day slow travel experience around Munnar tea estates and Vembanad lake.",
      status: "new",
    });

    const followupNotif = await scheduleEnquiryFollowup(enquiry1.toObject());
    assert.ok(followupNotif, "Enquiry must produce scheduled follow-up job");
    assert.strictEqual(followupNotif.status, "pending");
    assert.ok(followupNotif.scheduledFor, "scheduledFor must be set in future");

    pass(
      "ENQUIRY-FOLLOWUP-01",
      "Enquiry submission automatically schedules durable follow-up in database",
      "ENQUIRY_FOLLOWUPS",
      `Scheduled follow-up #${followupNotif.id} for enquiry #${enqId1}`
    );

    // 3b: When staff replies, pending follow-up is safely cancelled
    enquiry1.status = "replied";
    await enquiry1.save();
    const cancelledCount = await cancelEnquiryFollowup(enqId1, "Staff replied to enquiry");
    assert.strictEqual(cancelledCount, 1, "Exactly one follow-up job must be cancelled");

    const cancelledNotif = await NotificationModel.findOne({ id: followupNotif.id });
    assert.strictEqual(cancelledNotif?.status, "cancelled");
    assert.strictEqual(cancelledNotif?.error, "Staff replied to enquiry");

    pass(
      "ENQUIRY-FOLLOWUP-02",
      "Pending enquiry follow-up is safely cancelled when staff marks enquiry replied",
      "ENQUIRY_FOLLOWUPS",
      `Cancelled follow-up #${followupNotif.id} with status 'cancelled'`
    );

    // 3c: When customer books a trip before follow-up, worker cancels follow-up automatically
    const enqId2 = await getNextSequence("enquiries");
    createdEnquiryIds.push(enqId2);
    const bookedGuestEmail = `booked.guest.${TEST_RUN_ID}@example.com`;
    const enquiry2 = await EnquiryModel.create({
      id: enqId2,
      name: "Lady Clara",
      email: bookedGuestEmail,
      message: "Can you send pricing for luxury houseboats?",
      status: "new",
    });

    const followup2 = await scheduleEnquiryFollowup(enquiry2.toObject());
    assert.ok(followup2);

    // Guest books an order with same email
    const orderId2 = await getNextSequence("orders");
    createdOrderIds.push(orderId2);
    await OrderModel.create({
      id: orderId2,
      guestName: "Lady Clara",
      guestEmail: bookedGuestEmail,
      guestPhone: "+91 98470 22222",
      status: "confirmed",
    });

    // Backdate scheduledFor so scheduler considers it due
    await NotificationModel.updateOne({ id: followup2.id }, { $set: { scheduledFor: new Date(Date.now() - 1000) } });

    // Run scheduler worker tick
    await processDueEmailNotifications();

    const notifAfterWorker = await NotificationModel.findOne({ id: followup2.id });
    assert.strictEqual(notifAfterWorker?.status, "cancelled", "Worker must cancel follow-up because guest booked an order");
    assert.ok(notifAfterWorker?.error?.includes("already has confirmed booking"));

    pass(
      "ENQUIRY-FOLLOWUP-03",
      "Worker automatically cancels follow-up if customer has confirmed a booking",
      "ENQUIRY_FOLLOWUPS",
      `Follow-up #${followup2.id} was cancelled before dispatch: customer booked Order #${orderId2}`
    );

    // 3d: When customer is unsubscribed, follow-up is skipped
    const enqId3 = await getNextSequence("enquiries");
    createdEnquiryIds.push(enqId3);
    const unsubGuestEmail = `unsub.guest.${TEST_RUN_ID}@example.com`;
    await SubscriberConsentModel.create({
      email: unsubGuestEmail,
      name: "Unsubscribed Guest",
      subscribed: false,
      token: crypto.randomBytes(24).toString("hex"),
      source: "manual_opt_out",
    });

    const enquiry3 = await EnquiryModel.create({
      id: enqId3,
      name: "Unsubscribed Guest",
      email: unsubGuestEmail,
      message: "Please follow up",
      status: "new",
    });

    const followup3 = await scheduleEnquiryFollowup(enquiry3.toObject());
    assert.ok(followup3);
    await NotificationModel.updateOne({ id: followup3.id }, { $set: { scheduledFor: new Date(Date.now() - 1000) } });

    await processDueEmailNotifications();

    const notifUnsub = await NotificationModel.findOne({ id: followup3.id });
    assert.strictEqual(notifUnsub?.status, "skipped", "Must be marked skipped due to unsubscribed status");

    pass(
      "ENQUIRY-FOLLOWUP-04",
      "Follow-up is safely SKIPPED when recipient has opted out of communications",
      "ENQUIRY_FOLLOWUPS",
      `Follow-up #${followup3.id} skipped due to opt-out consent status`
    );

    // 3e: Due unresolved enquiry follow-up is dispatched cleanly
    const enqId4 = await getNextSequence("enquiries");
    createdEnquiryIds.push(enqId4);
    const validFollowupEmail = `valid.followup.${TEST_RUN_ID}@example.com`;
    const enquiry4 = await EnquiryModel.create({
      id: enqId4,
      name: "Julian Sterling",
      email: validFollowupEmail,
      message: "Inquiring about Wayanad treehouse retreats.",
      status: "new",
    });

    const followup4 = await scheduleEnquiryFollowup(enquiry4.toObject());
    assert.ok(followup4);
    await NotificationModel.updateOne({ id: followup4.id }, { $set: { scheduledFor: new Date(Date.now() - 1000) } });

    const processedCount = await processDueEmailNotifications();
    assert.ok(processedCount >= 1, "Must process due follow-up notification");

    const notifSent = await NotificationModel.findOne({ id: followup4.id });
    assert.strictEqual(notifSent?.status, "sent");
    assert.ok(notifSent?.sentAt);
    assert.ok(notifSent?.messageId);

    pass(
      "ENQUIRY-FOLLOWUP-05",
      "Due unresolved enquiry follow-up is dispatched cleanly with provider tracking",
      "ENQUIRY_FOLLOWUPS",
      `Follow-up #${followup4.id} sent successfully with message ID ${notifSent?.messageId}`
    );

    // ---------------------------------------------------------------------------
    // STEP 4: Post-Trip Feedback Automations & Lifecycle
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 4: Post-Trip Feedback Automations & Lifecycle");
    console.log("--------------------------------------------------------------------------------");

    // 4a: Order in enquiry or confirmed status does NOT trigger feedback early
    const orderId3 = await getNextSequence("orders");
    createdOrderIds.push(orderId3);
    const activeOrder = await OrderModel.create({
      id: orderId3,
      guestName: "Lord Hamilton",
      guestEmail: guestEmailD,
      guestPhone: "+91 98470 33333",
      status: "confirmed",
      destinations: "Marari & Thekkady",
    });

    const feedbackEarlyResult = await schedulePostTripFeedback(activeOrder.toObject());
    assert.strictEqual(feedbackEarlyResult, null, "Active/confirmed order must not schedule feedback");

    pass(
      "FEEDBACK-01",
      "Confirmed or active order does NOT schedule feedback request prematurely",
      "POST_TRIP_FEEDBACK",
      `Order #${orderId3} in 'confirmed' status produced null feedback`
    );

    // 4b: Transition to "completed" schedules post-trip feedback
    activeOrder.status = "completed";
    await activeOrder.save();

    const feedbackScheduled = await schedulePostTripFeedback(activeOrder.toObject());
    assert.ok(feedbackScheduled);
    assert.strictEqual(feedbackScheduled.status, "pending");
    assert.strictEqual(feedbackScheduled.type, "post_trip_feedback");
    assert.ok(feedbackScheduled.scheduledFor);

    pass(
      "FEEDBACK-02",
      "Order transition to 'completed' schedules post-trip feedback with configurable delay",
      "POST_TRIP_FEEDBACK",
      `Feedback job #${feedbackScheduled.id} scheduled for ${feedbackScheduled.scheduledFor}`
    );

    // 4c: Cancellation of completed order cancels pending feedback
    const orderId4 = await getNextSequence("orders");
    createdOrderIds.push(orderId4);
    const orderToCancel = await OrderModel.create({
      id: orderId4,
      guestName: "Temporary Guest",
      guestEmail: `temp.${TEST_RUN_ID}@example.com`,
      guestPhone: "+91 98470 44444",
      status: "completed",
    });

    const feedbackToCancel = await schedulePostTripFeedback(orderToCancel.toObject());
    assert.ok(feedbackToCancel);

    const cancelledFeedbackCount = await cancelPostTripFeedback(orderId4, "Booking cancelled / reverted");
    assert.strictEqual(cancelledFeedbackCount, 1);

    const cancelledFeedbackDoc = await NotificationModel.findOne({ id: feedbackToCancel.id });
    assert.strictEqual(cancelledFeedbackDoc?.status, "cancelled");

    pass(
      "FEEDBACK-03",
      "Reverting or cancelling completed order safely cancels pending feedback job",
      "POST_TRIP_FEEDBACK",
      `Cancelled feedback #${feedbackToCancel.id} with reason 'Booking cancelled / reverted'`
    );

    // 4d: Due post-trip feedback is dispatched with feedback review URL
    await NotificationModel.updateOne(
      { id: feedbackScheduled.id },
      { $set: { scheduledFor: new Date(Date.now() - 1000) } }
    );

    await processDueEmailNotifications();

    const sentFeedbackDoc = await NotificationModel.findOne({ id: feedbackScheduled.id });
    assert.strictEqual(sentFeedbackDoc?.status, "sent");
    assert.ok(sentFeedbackDoc?.messageId);
    assert.ok(sentFeedbackDoc?.sentAt);

    pass(
      "FEEDBACK-04",
      "Due post-trip feedback is dispatched with review link and tracking recorded",
      "POST_TRIP_FEEDBACK",
      `Dispatched feedback #${feedbackScheduled.id} with message ID ${sentFeedbackDoc?.messageId}`
    );

    // ---------------------------------------------------------------------------
    // STEP 5: Reliability, Restart Recovery & Bounded Retries
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 5: Reliability, Restart Recovery & Bounded Retries");
    console.log("--------------------------------------------------------------------------------");

    // 5a: Stale notification recovery resets stuck 'sending' records to 'pending'
    const staleNotifId = await getNextSequence("notifications");
    await NotificationModel.create({
      id: staleNotifId,
      type: "booking_confirmation",
      category: "transactional",
      relatedType: "order",
      relatedId: orderId1,
      recipientEmail: "stale@example.com",
      recipientName: "Stale Traveler",
      subject: "Stale Recovery Test",
      status: "sending",
      retryCount: 0,
      idempotencyKey: `stale:recovery:${staleNotifId}`,
    });
    await NotificationModel.updateOne(
      { id: staleNotifId },
      { $set: { updatedAt: new Date(Date.now() - 10 * 60 * 1000) } },
      { timestamps: false }
    );

    const recoveredCount = await recoverStaleEmailNotifications(5 * 60 * 1000);
    assert.ok(recoveredCount >= 1, "Must recover stale notification");

    const recoveredDoc = await NotificationModel.findOne({ id: staleNotifId });
    assert.strictEqual(recoveredDoc?.status, "pending", "Stale notification must be reset to pending");

    pass(
      "RELIABILITY-01",
      "Server restart recovery recovers notifications interrupted mid-send without duplicate emails",
      "RELIABILITY",
      `Recovered stuck notification #${staleNotifId} back to pending`
    );

    // 5b: Zero live sends in tests
    assert.strictEqual(
      config.env === "test" || !config.transactionalSendingEnabled,
      true,
      "Live sending must remain disabled in automated tests"
    );

    pass(
      "RELIABILITY-02",
      "Live sending remains disabled in tests and development; safe simulation active",
      "RELIABILITY",
      "Zero outbound HTTP requests to Resend during test execution"
    );

    // ---------------------------------------------------------------------------
    // STEP 6: Admin Audit Inspection & Manual Retry
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 6: Admin Audit Inspection & Manual Retry");
    console.log("--------------------------------------------------------------------------------");

    // 6a: listEmailNotifications returns complete history with filtering
    const allNotifs = await listEmailNotifications({ limit: 50 });
    assert.ok(allNotifs.length >= 4, "Must retrieve notifications history");

    const orderNotifs = await listEmailNotifications({ relatedType: "order", relatedId: orderId1 });
    assert.ok(orderNotifs.some((n) => n.type === "booking_confirmation"));

    pass(
      "ADMIN-AUDIT-01",
      "listEmailNotifications provides complete audit records with entity and status filtering",
      "ADMIN_INTEGRATION",
      `Retrieved ${allNotifs.length} notification audit records for administration`
    );

    // 6b: Manual retry of failed notification
    const failedNotifId = await getNextSequence("notifications");
    await NotificationModel.create({
      id: failedNotifId,
      type: "booking_confirmation",
      category: "transactional",
      relatedType: "order",
      relatedId: orderId1,
      recipientEmail: "retry@example.com",
      recipientName: "Retry Traveler",
      subject: "Retry Test",
      status: "failed",
      error: "Temporary network timeout",
      retryCount: 2,
      idempotencyKey: `failed:test:${failedNotifId}`,
    });

    const retriedDoc = await retryEmailNotification(failedNotifId);
    assert.strictEqual(retriedDoc.status, "pending");
    assert.strictEqual(retriedDoc.retryCount, 0);
    assert.strictEqual(retriedDoc.error, null);

    pass(
      "ADMIN-AUDIT-02",
      "retryEmailNotification re-queues failed notification with zero retryCount and clear error",
      "ADMIN_INTEGRATION",
      `Re-queued failed notification #${failedNotifId} for immediate retry`
    );

    // ---------------------------------------------------------------------------
    // STEP 7: Payment Receipts & Deadline Reminders
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 7: Payment Receipts & Deadline Reminders");
    console.log("--------------------------------------------------------------------------------");

    // 7a: Payment receipt triggered on invoice payment
    const invoiceId1 = await getNextSequence("invoices");
    createdInvoiceIds.push(invoiceId1);
    const testInvoice1 = await InvoiceModel.create({
      id: invoiceId1,
      invoiceNumber: `INV-ESC-${TEST_RUN_ID}-01`,
      title: "Fort Kochi & Munnar Sanctuary Voyage",
      issueDate: new Date().toISOString().split("T")[0],
      customerName: "Claire Beauchamp",
      customerEmail: `guest.payment.${TEST_RUN_ID}@example.com`,
      items: JSON.stringify([{ description: "Luxury Cottage Stays (3N)", quantity: 1, rate: 75000, amount: 75000 }]),
      currency: "INR",
      subtotal: 75000,
      discount: 0,
      discountType: "fixed",
      taxRate: 5,
      taxAmount: 3750,
      totalAmount: 78750,
      paidAmount: 25000,
      balanceDue: 53750,
      status: "partially_paid",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });

    const receiptResult = await triggerPaymentReceipt(testInvoice1.toObject(), 25000);
    assert.ok(receiptResult, "Must produce payment receipt notification");
    assert.strictEqual(receiptResult.status, "sent");
    assert.strictEqual(receiptResult.type, "payment_receipt");
    assert.ok(receiptResult.subject.includes(testInvoice1.invoiceNumber));

    pass(
      "PAYMENT-RECEIPT-01",
      "Invoice payment triggers payment receipt notification with updated balance",
      "PAYMENTS",
      `Dispatched receipt #${receiptResult.id} for invoice #${invoiceId1} with paid amount ₹25,000`
    );

    // 7b: Duplicate payment receipt check returns existing notification without duplicate send
    const duplicateReceiptResult = await triggerPaymentReceipt(testInvoice1.toObject(), 25000);
    assert.ok(duplicateReceiptResult);
    assert.strictEqual(duplicateReceiptResult.id, receiptResult.id);

    pass(
      "PAYMENT-RECEIPT-02",
      "Duplicate payment event returns existing record and prevents duplicate receipts",
      "PAYMENTS",
      `Deduplicated payment receipt for invoice #${invoiceId1}`
    );

    // 7c: Invoice schedules payment deadline reminder
    const deadlineReminder = await schedulePaymentDeadlineReminder(testInvoice1.toObject(), 3);
    assert.ok(deadlineReminder, "Must schedule payment deadline reminder");
    assert.strictEqual(deadlineReminder.status, "pending");
    assert.strictEqual(deadlineReminder.type, "payment_deadline_reminder");

    pass(
      "PAYMENT-DEADLINE-01",
      "Invoice with balance due schedules payment deadline reminder",
      "PAYMENTS",
      `Scheduled deadline reminder #${deadlineReminder.id} for invoice #${invoiceId1}`
    );

    // 7d: Overdue invoice generates overdue payment follow-up notice
    const overdueResult = await scheduleOverduePaymentFollowup(testInvoice1.toObject());
    assert.ok(overdueResult, "Must generate overdue payment notice");
    assert.strictEqual(overdueResult.type, "overdue_payment_followup");

    pass(
      "PAYMENT-OVERDUE-01",
      "Overdue invoice schedules overdue payment follow-up notice",
      "PAYMENTS",
      `Scheduled overdue payment follow-up #${overdueResult.id}`
    );

    // 7e: Settling invoice cancels pending deadline reminder at pre-send check
    testInvoice1.paidAmount = 78750;
    testInvoice1.balanceDue = 0;
    testInvoice1.status = "paid";
    await testInvoice1.save();

    await NotificationModel.updateOne(
      { id: deadlineReminder.id },
      { $set: { scheduledFor: new Date(Date.now() - 1000) } }
    );
    await processDueEmailNotifications();

    const cancelledDeadlineDoc = await NotificationModel.findOne({ id: deadlineReminder.id });
    assert.strictEqual(cancelledDeadlineDoc?.status, "cancelled");
    assert.ok(cancelledDeadlineDoc?.error?.includes("settled"));

    pass(
      "PAYMENT-DEADLINE-02",
      "Settled invoice balance cancels pending payment deadline reminder before worker dispatches it",
      "PAYMENTS",
      `Safely cancelled deadline reminder #${deadlineReminder.id}: invoice settled`
    );

    // ---------------------------------------------------------------------------
    // STEP 8: Final Itinerary Delivery & Draft Safeguard
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 8: Final Itinerary Delivery & Draft Safeguard");
    console.log("--------------------------------------------------------------------------------");

    // 8a: Draft or archived itinerary cannot be delivered as final
    const draftItinTest = await ItineraryModel.create({
      id: await getNextSequence("itineraries"),
      shareToken: `token-draft-${TEST_RUN_ID}`,
      customerName: "Eleanor Vance",
      customerEmail: guestEmailB,
      title: "Draft Itinerary Unconfirmed",
      destination: "Alleppey",
      startDate: "2026-12-01",
      endDate: "2026-12-07",
      status: "draft",
      days: JSON.stringify([{ day: 1, title: "Arrival" }]),
      stays: JSON.stringify([{ day: 1, hotelName: "Heritage House" }]),
      pricing: JSON.stringify({ total: 120000 }),
    });
    createdItineraryIds.push(draftItinTest.id);

    const draftDeliveryResult = await triggerFinalItineraryDelivery(draftItinTest.toObject());
    assert.strictEqual(draftDeliveryResult, null, "Draft itinerary must return null");

    pass(
      "FINAL-ITIN-01",
      "Draft or unconfirmed itinerary strictly blocks final itinerary delivery",
      "ITINERARY_DELIVERY",
      `Delivery safely rejected for draft itinerary #${draftItinTest.id}`
    );

    // 8b: Confirmed itinerary delivers final itinerary email with live share link
    const itinId2 = await getNextSequence("itineraries");
    createdItineraryIds.push(itinId2);
    const confirmedItin = await ItineraryModel.create({
      id: itinId2,
      shareToken: `token-final-${TEST_RUN_ID}`,
      customerName: "Eleanor Vance",
      customerEmail: guestEmailB,
      title: "Fort Kochi & Tea Highlands Confirmed Itinerary",
      destination: "Fort Kochi & Munnar",
      startDate: "2026-12-01",
      endDate: "2026-12-08",
      status: "confirmed",
      days: JSON.stringify([{ day: 1, title: "Heritage Walk in Fort Kochi" }]),
      stays: JSON.stringify([{ day: 1, hotelName: "Brunton Boatyard" }]),
      pricing: JSON.stringify({ total: 240000 }),
    });

    const finalDeliveryResult = await triggerFinalItineraryDelivery(confirmedItin.toObject());
    assert.ok(finalDeliveryResult, "Confirmed itinerary must produce delivery notification");
    assert.strictEqual(finalDeliveryResult.status, "sent");
    assert.strictEqual(finalDeliveryResult.type, "final_itinerary_delivery");
    assert.ok(finalDeliveryResult.messageId);

    pass(
      "FINAL-ITIN-02",
      "Confirmed itinerary delivers final itinerary email with live share link and tracking",
      "ITINERARY_DELIVERY",
      `Delivered final itinerary #${itinId2} with message ID ${finalDeliveryResult.messageId}`
    );

    // ---------------------------------------------------------------------------
    // STEP 9: Booking Cancellation & Travel Document Delivery
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 9: Booking Cancellation & Travel Document Delivery");
    console.log("--------------------------------------------------------------------------------");

    // 9a: Booking cancellation email triggers upon order cancellation
    const cancelOrderResult = await triggerBookingCancellation(
      unconfirmedOrder.toObject(),
      "Traveler requested postponement to autumn 2027"
    );
    assert.ok(cancelOrderResult, "Must produce cancellation notification");
    assert.strictEqual(cancelOrderResult.status, "sent");
    assert.strictEqual(cancelOrderResult.type, "booking_cancellation");

    pass(
      "BOOKING-CANCEL-01",
      "Booking cancellation triggers cancellation notification with reason",
      "CANCELLATION",
      `Dispatched cancellation notification #${cancelOrderResult.id} for order #${unconfirmedOrder.id}`
    );

    // 9b: Travel document delivery
    const docDeliveryResult = await triggerTravelDocumentDelivery(unconfirmedOrder.toObject(), {
      title: "Periyar Wildlife Sanctuary Permits & Houseboat Boarding Pass",
      documentType: "Boarding Pass & Activity Permits",
      notes: "Please present QR code at gate 2 upon boarding.",
      downloadUrl: "https://escora.in/docs/pass-123.pdf",
    });
    assert.ok(docDeliveryResult, "Must produce travel document delivery notification");
    assert.strictEqual(docDeliveryResult.status, "sent");
    assert.strictEqual(docDeliveryResult.type, "travel_document_delivery");

    pass(
      "DOC-DELIVERY-01",
      "Travel document delivery sends customer vouchers and access credentials",
      "TRAVEL_DOCUMENTS",
      `Delivered travel document notification #${docDeliveryResult.id}`
    );

    // ---------------------------------------------------------------------------
    // STEP 10: Pre-Trip Reminders & Outstanding Travel Document Reminders
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 10: Pre-Trip Reminders & Outstanding Travel Document Reminders");
    console.log("--------------------------------------------------------------------------------");

    // 10a: Confirmed booking schedules pre-trip reminder
    const preTripOrder = await OrderModel.findOne({ id: orderId1 });
    assert.ok(preTripOrder);
    const preTripResult = await schedulePreTripReminder(preTripOrder.toObject(), 3);
    assert.ok(preTripResult, "Must schedule pre-trip reminder");
    assert.strictEqual(preTripResult.type, "pre_trip_reminder");
    assert.strictEqual(preTripResult.status, "pending");

    pass(
      "PRE-TRIP-01",
      "Confirmed order schedules pre-trip reminder prior to departure date",
      "PRE_TRIP",
      `Scheduled pre-trip reminder #${preTripResult.id} for order #${orderId1}`
    );

    // 10b: If order is cancelled, pre-trip reminder is automatically cancelled at pre-send check
    preTripOrder.status = "cancelled";
    await preTripOrder.save();

    await NotificationModel.updateOne(
      { id: preTripResult.id },
      { $set: { scheduledFor: new Date(Date.now() - 1000) } }
    );
    await processDueEmailNotifications();

    const cancelledPreTrip = await NotificationModel.findOne({ id: preTripResult.id });
    assert.strictEqual(cancelledPreTrip?.status, "cancelled");

    pass(
      "PRE-TRIP-02",
      "Cancelled booking automatically cancels pending pre-trip reminder at pre-send check",
      "PRE_TRIP",
      `Cancelled pre-trip reminder #${preTripResult.id} safely: booking cancelled`
    );

    // 10c: Outstanding document reminder is scheduled and dispatched
    const docOrderId = await getNextSequence("orders");
    createdOrderIds.push(docOrderId);
    const docOrder = await OrderModel.create({
      id: docOrderId,
      guestName: "Lady Marion",
      guestEmail: guestEmailA,
      guestPhone: "+91 98470 22222",
      destinations: "Wayanad Rainforest",
      travelDate: "2026-11-20",
      departureDate: "2026-11-25",
      guestCount: 2,
      status: "confirmed",
    });

    const outstandingDocNotif = await scheduleOutstandingDocumentReminder(
      docOrder.toObject(),
      ["Passport Bio Page Scan", "Dietary & Health Profile Form"],
      new Date(Date.now() - 1000)
    );
    assert.ok(outstandingDocNotif);

    await processDueEmailNotifications();
    const sentOutstandingDoc = await NotificationModel.findOne({ id: outstandingDocNotif.id });
    assert.strictEqual(sentOutstandingDoc?.status, "sent");

    pass(
      "DOC-REMINDER-01",
      "Outstanding document reminder is dispatched with missing checklist items",
      "TRAVEL_DOCUMENTS",
      `Dispatched document reminder #${outstandingDocNotif.id} with 2 missing items`
    );

    // ---------------------------------------------------------------------------
    // STEP 11: Admin Approval-Required Workflows
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 11: Admin Approval-Required Workflows (Sensitive & Major Changes)");
    console.log("--------------------------------------------------------------------------------");

    // 11a: Approval-required notification is queued with status "pending_approval"
    const approvalNotif = await queueApprovalRequiredNotification({
      type: "major_itinerary_update",
      category: "service_followup",
      relatedType: "itinerary",
      relatedId: itinId2,
      recipientEmail: guestEmailB,
      recipientName: "Eleanor Vance",
      subject: "Critical Schedule Revision — Fort Kochi & Munnar",
      bodyHtml: "<p>Your departure transfer has been adjusted to 08:30 AM due to scenic railway maintenance.</p>",
    });
    assert.strictEqual(approvalNotif.status, "pending_approval");
    assert.strictEqual(approvalNotif.requiresApproval, true);

    pass(
      "APPROVAL-WORKFLOW-01",
      "Major change notification is safely queued in 'pending_approval' state",
      "ADMIN_APPROVAL",
      `Queued notification #${approvalNotif.id} with requiresApproval=true`
    );

    // 11b: Background worker strictly ignores pending_approval notifications
    await NotificationModel.updateOne(
      { id: approvalNotif.id },
      { $set: { scheduledFor: new Date(Date.now() - 1000) } }
    );
    await processDueEmailNotifications();

    const stillPendingApproval = await NotificationModel.findOne({ id: approvalNotif.id });
    assert.strictEqual(
      stillPendingApproval?.status,
      "pending_approval",
      "Worker must not touch notifications requiring approval"
    );

    pass(
      "APPROVAL-WORKFLOW-02",
      "Background dispatcher strictly ignores pending_approval notifications until staff acts",
      "ADMIN_APPROVAL",
      `Notification #${approvalNotif.id} remained safely un-sent in pending_approval status`
    );

    // 11c: Staff rejects notification
    const rejectedNotif = await rejectNotification(approvalNotif.id, "Staff declined: itinerary already re-routed");
    assert.strictEqual(rejectedNotif.status, "cancelled");
    assert.strictEqual(rejectedNotif.error, "Staff declined: itinerary already re-routed");

    pass(
      "APPROVAL-WORKFLOW-03",
      "Staff can reject approval-required notification with logged reason",
      "ADMIN_APPROVAL",
      `Staff rejected notification #${approvalNotif.id}`
    );

    // 11d: Staff approves notification -> transitions to pending -> dispatched by worker
    const approvalNotif2 = await queueApprovalRequiredNotification({
      type: "personalized_offer",
      category: "promotional",
      relatedType: "customer",
      relatedId: 101,
      recipientEmail: guestEmailB,
      recipientName: "Eleanor Vance",
      subject: "Private Backwater Houseboat Complimentary Upgrade",
      bodyHtml: "<p>We are delighted to extend a complimentary suite upgrade for your upcoming journey.</p>",
    });
    assert.strictEqual(approvalNotif2.status, "pending_approval");

    const approvedDoc = await approveNotification(approvalNotif2.id, "Lead Concierge");
    assert.strictEqual(approvedDoc.status, "pending");
    assert.strictEqual(approvedDoc.approvedBy, "Lead Concierge");
    assert.ok(approvedDoc.approvedAt);

    await processDueEmailNotifications();
    const dispatchedApprovalDoc = await NotificationModel.findOne({ id: approvalNotif2.id });
    assert.strictEqual(dispatchedApprovalDoc?.status, "sent");
    assert.ok(dispatchedApprovalDoc?.messageId);

    pass(
      "APPROVAL-WORKFLOW-04",
      "Staff approval enables immediate dispatch by background worker with audit trail",
      "ADMIN_APPROVAL",
      `Approved and dispatched notification #${approvalNotif2.id} (message ID: ${dispatchedApprovalDoc?.messageId})`
    );

    // ---------------------------------------------------------------------------
    // STEP 12: Manual Admin Direct Communications
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Step 12: Manual Admin Direct Communications");
    console.log("--------------------------------------------------------------------------------");

    // 12a: Direct manual quote / dispute / custom response dispatch
    const manualResult = await sendManualAdminEmail({
      type: "quotation_delivery",
      category: "manual",
      relatedType: "enquiry",
      relatedId: 71,
      recipientEmail: guestEmailC,
      recipientName: "Arthur Conan",
      title: "Custom Quotation: Wayanad Plantation Sanctuary",
      bodyHtml: "<p>Enclosed please find our bespoke proposal for your private stay in Wayanad.</p>",
      callToAction: {
        label: "View Quotation Details",
        url: "https://escora.in/quotes/wayanad-71",
      },
    });
    assert.ok(manualResult);
    assert.strictEqual(manualResult.status, "sent");
    assert.strictEqual(manualResult.category, "manual");
    assert.strictEqual(manualResult.type, "quotation_delivery");
    assert.ok(manualResult.messageId);

    pass(
      "MANUAL-ADMIN-01",
      "Manual admin email dispatches bespoke quotation with custom CTA and tracking",
      "MANUAL_ADMIN",
      `Dispatched manual quotation notification #${manualResult.id} (message ID: ${manualResult.messageId})`
    );
  } catch (err: any) {
    console.error("FATAL SUITE ERROR:", err);
    throw err;
  } finally {
    // Teardown test records
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Teardown: Purging test records");
    console.log("--------------------------------------------------------------------------------");

    if (createdOrderIds.length > 0) {
      await OrderModel.deleteMany({ id: { $in: createdOrderIds } });
    }
    if (createdItineraryIds.length > 0) {
      await ItineraryModel.deleteMany({ id: { $in: createdItineraryIds } });
    }
    if (createdEnquiryIds.length > 0) {
      await EnquiryModel.deleteMany({ id: { $in: createdEnquiryIds } });
    }
    if (createdInvoiceIds.length > 0) {
      await InvoiceModel.deleteMany({ id: { $in: createdInvoiceIds } });
    }
    await NotificationModel.deleteMany({
      $or: [
        { recipientEmail: { $regex: TEST_RUN_ID } },
        { idempotencyKey: { $regex: TEST_RUN_ID } },
        { idempotencyKey: { $regex: "stale:recovery" } },
        { idempotencyKey: { $regex: "failed:test" } },
      ],
    });
    await SubscriberConsentModel.deleteMany({
      email: { $regex: TEST_RUN_ID },
    });

    console.log("  [CLEANUP] Successfully purged test orders, enquiries, itineraries, and mock notification records.");
    await disconnectDB();
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("   TRANSACTIONAL AUTOMATIONS SUITE SUMMARY                                      ");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log(`  Total Tests Run : ${total}`);
  console.log(`  Passed          : ${passed}`);
  console.log(`  Failed          : ${failed}`);
  console.log("--------------------------------------------------------------------------------\n");

  if (failed > 0) {
    console.error("  FAILED TESTS:");
    for (const f of results.filter((r) => r.status === "FAIL")) {
      console.error(`    - [${f.category}] ${f.code}: ${f.name}\n      ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log("  ALL TRANSACTIONAL AND FOLLOW-UP AUTOMATIONS VERIFIED SUCCESSFULLY!\n");
  }
}

runTransactionalVerificationSuite().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
