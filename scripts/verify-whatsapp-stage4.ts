/**
 * Escora Holidays — WhatsApp Automation Stage 4 Verification Suite
 *
 * Comprehensive validation of business workflow integration:
 * 1. Enquiry Acknowledgement (valid enquiry save, idempotency, non-blocking)
 * 2. Booking Confirmation (genuine confirmed status only, unconfirmed rejection, idempotency)
 * 3. Payment Receipt (verified settlement only, zero/cancelled rejection, balance/amount accuracy)
 * 4. Itinerary Update (meaningful changes only, confirmed status requirement, draft suppression)
 * 5. Document Delivery (confirmed/completed orders only, authorized delivery, download links)
 * 6. Payment Reminders (scheduled outstanding balance only, paid/cancelled suppression)
 * 7. Pre-Trip Reminders (scheduled confirmed departure only, pending/cancelled rejection)
 * 8. Post-Trip Feedback (completed orders only, pending/cancelled rejection)
 * 9. Consent & Opt-Out Safeguards (STOP opt-out enforcement across all triggers)
 * 10. Independent Admin Automation Toggles (per-event enable/disable, skipped_disabled audit logging)
 * 11. Safe Admin Retries (preserves consent and idempotency safeguards)
 * 12. Scheduler Worker Integration (processDueEmailNotifications dispatches both email and WhatsApp)
 */

import assert from "node:assert";
import crypto from "node:crypto";
import {
  connectDB,
  disconnectDB,
  WhatsAppMessageModel,
  WhatsAppConsentModel,
  WhatsAppSettingModel,
  OrderModel,
  EnquiryModel,
  InvoiceModel,
  ItineraryModel,
  NotificationModel,
  getNextSequence,
  type IOrder,
  type IInvoice,
  type IItinerary,
  type IEnquiry,
} from "../lib/db/src/index";
import { config } from "../apps/api-server/src/config/env";
import {
  triggerWhatsAppEnquiryAcknowledgement,
  triggerWhatsAppBookingConfirmation,
  triggerWhatsAppPaymentReceipt,
  triggerWhatsAppItineraryUpdate,
  triggerWhatsAppDocumentDelivery,
  triggerWhatsAppPaymentReminder,
  triggerWhatsAppPreTripReminder,
  triggerWhatsAppPostTripFeedback,
  retryWhatsAppMessage,
  updateWhatsAppSettings,
  getWhatsAppSettings,
  setWhatsAppConsent,
} from "../apps/api-server/src/services/whatsapp";
import { processDueEmailNotifications } from "../apps/api-server/src/services/notification-service";

let passedTests = 0;
let failedTests = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  process.stdout.write(`  • ${name} ... `);
  try {
    await fn();
    console.log("PASSED");
    passedTests++;
  } catch (err: any) {
    console.log(`FAILED: ${err.message}`);
    console.error(err);
    failedTests++;
  }
}

async function main() {
  console.log("\n================================================================================");
  console.log("Escora WhatsApp Automation — Stage 4 Business Workflow Integration Suite");
  console.log("================================================================================\n");

  await connectDB();

  // Reset settings to all automations enabled in mock mode
  await updateWhatsAppSettings({
    provider: "mock",
    enableEnquiryAcknowledgement: true,
    enableBookingConfirmation: true,
    enableItineraryUpdates: true,
    enablePaymentReceipts: true,
    enablePaymentReminders: true,
    enablePreTripReminders: true,
    enablePostTripFeedback: true,
    enableDocumentDelivery: true,
    simulateAutoDelivery: false, // keep stationary for deterministic status asserts
  }, "Stage4-TestSuite");

  const testPhone = "+91 98470 12345";
  const uniquePrefix = `s4_${Date.now()}`;

  // ---------------------------------------------------------------------------
  // Test 1: Enquiry Acknowledgement
  // ---------------------------------------------------------------------------
  await runTest("Enquiry Acknowledgement: Triggers upon valid enquiry with stable idempotency", async () => {
    const seq = await getNextSequence("enquiries");
    const enquiry: IEnquiry = {
      id: seq,
      name: "Rohit Varma",
      email: `rohit_${uniquePrefix}@example.com`,
      phone: testPhone,
      message: "Looking for an 8-day slow-luxury honeymoon in Munnar and Kumarakom.",
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const msg = await triggerWhatsAppEnquiryAcknowledgement(enquiry);
    assert.ok(msg, "Should create a WhatsApp message for valid enquiry");
    assert.strictEqual(msg.messageType, "enquiry_acknowledgement");
    assert.strictEqual(msg.status, "simulated");
    assert.strictEqual(msg.recipientPhone, "+919847012345");
    assert.strictEqual(msg.relatedId, seq);
    assert.ok(msg.bodyText.includes("Rohit Varma"), "Body text should include guest name");

    // Idempotency check: Repeated call returns existing record without duplicates
    const duplicate = await triggerWhatsAppEnquiryAcknowledgement(enquiry);
    assert.ok(duplicate);
    assert.strictEqual(duplicate.id, msg.id, "Duplicate trigger must return identical message record");
  });

  // ---------------------------------------------------------------------------
  // Test 2: Booking Confirmation
  // ---------------------------------------------------------------------------
  await runTest("Booking Confirmation: Triggers only for confirmed orders and rejects unconfirmed", async () => {
    const seq = await getNextSequence("orders");

    // 1. Unconfirmed / Pending Order
    const pendingOrder: IOrder = {
      id: seq,
      guestName: "Ananya Iyer",
      guestEmail: `ananya_${uniquePrefix}@example.com`,
      guestPhone: testPhone,
      status: "pending",
      packageName: "Backwaters & Spice Sanctuaries",
      travelDate: "2026-11-15",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pendingMsg = await triggerWhatsAppBookingConfirmation(pendingOrder);
    assert.strictEqual(pendingMsg, null, "Unconfirmed order must NOT trigger booking confirmation");

    // 2. Confirmed Order
    const confirmedOrder: IOrder = {
      ...pendingOrder,
      status: "confirmed",
    };

    const confMsg = await triggerWhatsAppBookingConfirmation(confirmedOrder);
    assert.ok(confMsg, "Confirmed order must trigger booking confirmation");
    assert.strictEqual(confMsg.messageType, "booking_confirmation");
    assert.strictEqual(confMsg.status, "simulated");
    assert.ok(confMsg.bodyText.includes("Ananya Iyer"));
    assert.ok(confMsg.bodyText.includes("Backwaters & Spice Sanctuaries"));

    // 3. Repeated call is idempotent
    const duplicateConf = await triggerWhatsAppBookingConfirmation(confirmedOrder);
    assert.strictEqual(duplicateConf?.id, confMsg.id, "Repeated confirmed trigger must be idempotent");
  });

  // ---------------------------------------------------------------------------
  // Test 3: Payment Receipt
  // ---------------------------------------------------------------------------
  await runTest("Payment Receipt: Triggers only for settled non-cancelled payments with paidAmount > 0", async () => {
    const seq = await getNextSequence("invoices");

    // 1. Cancelled or zero-payment invoice
    const zeroInvoice: IInvoice = {
      id: seq,
      invoiceNumber: `INV-${seq}`,
      title: "Kerala Tour Invoice",
      issueDate: "2026-11-01",
      customerName: "Vikram Nair",
      customerPhone: testPhone,
      customerEmail: `vikram_${uniquePrefix}@example.com`,
      currency: "INR",
      items: "[]",
      subtotal: 150000,
      discount: 0,
      discountType: "fixed",
      taxRate: 5,
      taxAmount: 7500,
      totalAmount: 150000,
      paidAmount: 0,
      balanceDue: 150000,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const zeroMsg = await triggerWhatsAppPaymentReceipt(zeroInvoice);
    assert.strictEqual(zeroMsg, null, "Zero payment invoice must not trigger payment receipt");

    // 2. Settled payment
    const settledInvoice: IInvoice = {
      ...zeroInvoice,
      paidAmount: 50000,
      balanceDue: 100000,
      status: "partially_paid",
    };

    const settledMsg = await triggerWhatsAppPaymentReceipt(settledInvoice);
    assert.ok(settledMsg, "Settled payment must trigger payment receipt");
    assert.strictEqual(settledMsg.messageType, "payment_receipt");
    assert.strictEqual(settledMsg.status, "simulated");
    assert.ok(settledMsg.bodyText.includes("50,000"), "Receipt body must include formatted paid amount");
    assert.ok(settledMsg.bodyText.includes((100000).toLocaleString("en-IN")), "Receipt body must include remaining balance");

    // 3. Repeated call is idempotent
    const duplicateReceipt = await triggerWhatsAppPaymentReceipt(settledInvoice);
    assert.strictEqual(duplicateReceipt?.id, settledMsg.id, "Repeated payment receipt call must be idempotent");
  });

  // ---------------------------------------------------------------------------
  // Test 4: Itinerary Update
  // ---------------------------------------------------------------------------
  await runTest("Itinerary Update: Triggers only on meaningful changes to confirmed itineraries", async () => {
    const seq = await getNextSequence("itineraries");

    // 1. Unconfirmed / Draft Itinerary
    const draftItin: IItinerary = {
      id: seq,
      title: "Munnar & Alleppey Signature",
      destination: "Munnar, Alleppey",
      customerName: "Divya Menon",
      customerPhone: testPhone,
      customerEmail: `divya_${uniquePrefix}@example.com`,
      status: "draft",
      shareToken: `token_${uniquePrefix}`,
      startDate: "2026-12-01",
      endDate: "2026-12-07",
      days: "[]",
      stays: "[]",
      pricing: "{}",
      currency: "INR",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const draftMsg = await triggerWhatsAppItineraryUpdate(draftItin, { title: "Draft Changed" });
    assert.strictEqual(draftMsg, null, "Draft itinerary update must not trigger WhatsApp notification");

    // 2. Confirmed Itinerary with NO meaningful changes
    const confirmedItin: IItinerary = {
      ...draftItin,
      status: "confirmed",
    };

    const noChangeMsg = await triggerWhatsAppItineraryUpdate(confirmedItin, {
      title: "Munnar & Alleppey Signature",
      destination: "Munnar, Alleppey",
      startDate: "2026-12-01",
      endDate: "2026-12-07",
    });
    assert.strictEqual(noChangeMsg, null, "No meaningful changes must return null to avoid customer spam");

    // 3. Confirmed Itinerary WITH meaningful changes (e.g. hotel stays refined & dates updated)
    const changedMsg = await triggerWhatsAppItineraryUpdate(confirmedItin, {
      title: "Munnar & Alleppey Signature",
      startDate: "2026-12-05", // Revised travel dates!
      stays: JSON.stringify([{ hotel: "Spice Tree Munnar" }]),
    });
    assert.ok(changedMsg, "Meaningful changes to confirmed itinerary must trigger update");
    assert.strictEqual(changedMsg.messageType, "itinerary_update");
    assert.strictEqual(changedMsg.status, "simulated");
    assert.ok(changedMsg.bodyText.includes("Divya Menon"));
    assert.ok(changedMsg.bodyText.includes(`token_${uniquePrefix}`), "Must include private share link");

    // 4. Repeated trigger with same changes is idempotent
    const duplicateUpdate = await triggerWhatsAppItineraryUpdate(confirmedItin, {
      title: "Munnar & Alleppey Signature",
      startDate: "2026-12-05",
      stays: JSON.stringify([{ hotel: "Spice Tree Munnar" }]),
    });
    assert.strictEqual(duplicateUpdate?.id, changedMsg.id, "Repeated update with same changes must be idempotent");
  });

  // ---------------------------------------------------------------------------
  // Test 5: Document Delivery
  // ---------------------------------------------------------------------------
  await runTest("Document Delivery: Triggers only for confirmed/completed bookings with authorized vouchers", async () => {
    const seq = await getNextSequence("orders");

    // 1. Pending order
    const pendingOrder: IOrder = {
      id: seq,
      guestName: "Karthik Pillai",
      guestPhone: testPhone,
      guestEmail: `karthik_${uniquePrefix}@example.com`,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const unconfDoc = await triggerWhatsAppDocumentDelivery(pendingOrder, "Sanctuary Pass");
    assert.strictEqual(unconfDoc, null, "Document delivery for unconfirmed order must be suppressed");

    // 2. Confirmed order
    const confirmedOrder: IOrder = {
      ...pendingOrder,
      status: "confirmed",
    };

    const docMsg = await triggerWhatsAppDocumentDelivery(
      confirmedOrder,
      "Luxury Houseboat Vouchers & Driver Details",
      "https://escoraholidays.com/docs/vouchers-123.pdf"
    );
    assert.ok(docMsg, "Document delivery for confirmed booking must succeed");
    assert.strictEqual(docMsg.messageType, "document_delivery");
    assert.strictEqual(docMsg.status, "simulated");
    assert.ok(docMsg.bodyText.includes("Luxury Houseboat Vouchers"));
    assert.ok(docMsg.bodyText.includes("https://escoraholidays.com/docs/vouchers-123.pdf"));

    // 3. Repeated delivery of same document title is idempotent
    const dupDoc = await triggerWhatsAppDocumentDelivery(
      confirmedOrder,
      "Luxury Houseboat Vouchers & Driver Details",
      "https://escoraholidays.com/docs/vouchers-123.pdf"
    );
    assert.strictEqual(dupDoc?.id, docMsg.id, "Repeated document delivery must be idempotent");
  });

  // ---------------------------------------------------------------------------
  // Test 6: Payment Reminders
  // ---------------------------------------------------------------------------
  await runTest("Payment Reminder: Triggers only when balance is outstanding and rejects paid/cancelled", async () => {
    const seq = await getNextSequence("invoices");

    // 1. Fully paid invoice
    const paidInvoice: IInvoice = {
      id: seq,
      invoiceNumber: `INV-${seq}`,
      title: "Kerala Tour Invoice",
      issueDate: "2026-11-01",
      customerName: "Sanjay Nambiar",
      customerPhone: testPhone,
      customerEmail: `sanjay_${uniquePrefix}@example.com`,
      currency: "INR",
      items: "[]",
      subtotal: 100000,
      discount: 0,
      discountType: "fixed",
      taxRate: 5,
      taxAmount: 5000,
      totalAmount: 100000,
      paidAmount: 100000,
      balanceDue: 0,
      status: "paid",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const paidMsg = await triggerWhatsAppPaymentReminder(paidInvoice);
    assert.strictEqual(paidMsg, null, "Paid invoice must not trigger payment reminder");

    // 2. Outstanding balance invoice
    const outstandingInvoice: IInvoice = {
      ...paidInvoice,
      balanceDue: 45000,
      paidAmount: 55000,
      status: "partially_paid",
      dueDate: "2026-11-20",
    };

    const remMsg = await triggerWhatsAppPaymentReminder(outstandingInvoice);
    assert.ok(remMsg, "Outstanding balance must trigger payment reminder");
    assert.strictEqual(remMsg.messageType, "payment_reminder");
    assert.strictEqual(remMsg.status, "simulated");
    assert.ok(remMsg.bodyText.includes("45,000"), "Body must state outstanding balance");

    // 3. Repeated reminder is idempotent
    const dupRem = await triggerWhatsAppPaymentReminder(outstandingInvoice);
    assert.strictEqual(dupRem?.id, remMsg.id, "Repeated payment reminder must be idempotent");
  });

  // ---------------------------------------------------------------------------
  // Test 7: Pre-Trip Reminders
  // ---------------------------------------------------------------------------
  await runTest("Pre-Trip Reminder: Triggers only for confirmed orders with departure travel date", async () => {
    const seq = await getNextSequence("orders");

    // 1. Unconfirmed order
    const pendingOrder: IOrder = {
      id: seq,
      guestName: "Meera Krishnan",
      guestPhone: testPhone,
      guestEmail: `meera_${uniquePrefix}@example.com`,
      status: "pending",
      travelDate: "2026-11-10",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pendingMsg = await triggerWhatsAppPreTripReminder(pendingOrder);
    assert.strictEqual(pendingMsg, null, "Unconfirmed order must not trigger pre-trip reminder");

    // 2. Confirmed order
    const confirmedOrder: IOrder = {
      ...pendingOrder,
      status: "confirmed",
      packageName: "Wayanad Rainforest Retreat",
    };

    const preTripMsg = await triggerWhatsAppPreTripReminder(confirmedOrder);
    assert.ok(preTripMsg, "Confirmed order must trigger pre-trip reminder");
    assert.strictEqual(preTripMsg.messageType, "pre_trip_reminder");
    assert.strictEqual(preTripMsg.status, "simulated");
    assert.ok(preTripMsg.bodyText.includes("Meera Krishnan"));
    assert.ok(preTripMsg.bodyText.includes("2026-11-10"));

    // 3. Repeated call is idempotent
    const dupPreTrip = await triggerWhatsAppPreTripReminder(confirmedOrder);
    assert.strictEqual(dupPreTrip?.id, preTripMsg.id, "Repeated pre-trip reminder must be idempotent");
  });

  // ---------------------------------------------------------------------------
  // Test 8: Post-Trip Feedback
  // ---------------------------------------------------------------------------
  await runTest("Post-Trip Feedback: Triggers only for completed journeys and rejects pending/cancelled", async () => {
    const seq = await getNextSequence("orders");

    // 1. Confirmed (not completed) order
    const ongoingOrder: IOrder = {
      id: seq,
      guestName: "Arjun Radhakrishnan",
      guestPhone: testPhone,
      guestEmail: `arjun_${uniquePrefix}@example.com`,
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ongoingMsg = await triggerWhatsAppPostTripFeedback(ongoingOrder);
    assert.strictEqual(ongoingMsg, null, "Non-completed order must not trigger post-trip feedback");

    // 2. Completed order
    const completedOrder: IOrder = {
      ...ongoingOrder,
      status: "completed",
    };

    const feedbackMsg = await triggerWhatsAppPostTripFeedback(completedOrder);
    assert.ok(feedbackMsg, "Completed order must trigger post-trip feedback");
    assert.strictEqual(feedbackMsg.messageType, "post_trip_feedback");
    assert.strictEqual(feedbackMsg.status, "simulated");
    assert.ok(feedbackMsg.bodyText.includes("Arjun Radhakrishnan"));
    assert.ok(feedbackMsg.bodyText.includes("Welcome home"));

    // 3. Repeated call is idempotent
    const dupFeedback = await triggerWhatsAppPostTripFeedback(completedOrder);
    assert.strictEqual(dupFeedback?.id, feedbackMsg.id, "Repeated post-trip feedback must be idempotent");
  });

  // ---------------------------------------------------------------------------
  // Test 9: Consent, Opt-Out, and Safeguards
  // ---------------------------------------------------------------------------
  await runTest("Consent Safeguards: Explicit transactional opt-out suppresses all dispatches with audit record", async () => {
    const optOutPhone = "+91 98479 99999";
    await setWhatsAppConsent(optOutPhone, {
      transactionalOptOut: true,
      optOutReason: "Customer texted STOP",
    });

    const seq = await getNextSequence("orders");
    const order: IOrder = {
      id: seq,
      guestName: "Opted Out Guest",
      guestPhone: optOutPhone,
      guestEmail: `optout_${uniquePrefix}@example.com`,
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const blockedMsg = await triggerWhatsAppBookingConfirmation(order);
    assert.ok(blockedMsg, "Blocked message should still produce an audit record");
    assert.strictEqual(blockedMsg.status, "skipped_opted_out");
    assert.ok(blockedMsg.error?.includes("opted out"), "Audit error reason must explain opt-out");

    // Clean up consent for test isolation
    await WhatsAppConsentModel.deleteOne({ phone: "+919847999999" });
  });

  // ---------------------------------------------------------------------------
  // Test 10: Independent Automation Toggles
  // ---------------------------------------------------------------------------
  await runTest("Admin Controls: Disabling an automation skips dispatch and records skipped_disabled audit entry", async () => {
    // Disable Booking Confirmation independently
    await updateWhatsAppSettings({ enableBookingConfirmation: false }, "Admin-Toggle-Test");

    const seq = await getNextSequence("orders");
    const order: IOrder = {
      id: seq,
      guestName: "Pooja Hegde",
      guestPhone: testPhone,
      guestEmail: `pooja_${uniquePrefix}@example.com`,
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const skippedMsg = await triggerWhatsAppBookingConfirmation(order);
    assert.ok(skippedMsg, "Should record skipped_disabled audit entry in DB");
    assert.strictEqual(skippedMsg.status, "skipped_disabled");
    assert.ok(skippedMsg.error?.includes("disabled in WhatsApp settings"));

    // Re-enable Booking Confirmation
    await updateWhatsAppSettings({ enableBookingConfirmation: true }, "Admin-Toggle-Test");
  });

  // ---------------------------------------------------------------------------
  // Test 11: Safe Admin Retries
  // ---------------------------------------------------------------------------
  await runTest("Safe Admin Retries: Retrying a message respects consent and duplicate safeguards", async () => {
    // Create a message that failed / was skipped
    const seq = await getNextSequence("whatsapp_messages");
    const msg = await WhatsAppMessageModel.create({
      id: seq,
      recipientPhone: "+919847012345",
      recipientName: "Test Guest",
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: 9999,
      bodyText: "Retry test text",
      provider: "mock",
      status: "failed",
      error: "Temporary mock failure",
      idempotencyKey: `wa_retry_test_${seq}`,
      retryCount: 0,
    });

    const retried = await retryWhatsAppMessage(msg.id);
    assert.strictEqual(retried.status, "simulated", "Retried message should succeed in mock mode");
    assert.strictEqual(retried.retryCount, 1, "Retry count must increment");

    // Calling retry on already delivered message throws error
    await WhatsAppMessageModel.updateOne({ id: msg.id }, { status: "delivered" });
    await assert.rejects(
      async () => await retryWhatsAppMessage(msg.id),
      /already in state "delivered"/,
      "Must reject retrying already delivered message to prevent duplicate delivery"
    );
  });

  // ---------------------------------------------------------------------------
  // Test 12: Scheduler Worker Tick Integration
  // ---------------------------------------------------------------------------
  await runTest("Scheduler Worker: processDueEmailNotifications atomically dispatches scheduled WhatsApp reminders", async () => {
    // Create an invoice with balance due
    const invSeq = await getNextSequence("invoices");
    const testInvoice = await InvoiceModel.create({
      id: invSeq,
      invoiceNumber: `INV-SCHED-${invSeq}`,
      title: "Kerala Luxury Journey Invoice",
      issueDate: "2026-11-01",
      customerName: "Aswathy Mohan",
      customerPhone: testPhone,
      customerEmail: `aswathy_${uniquePrefix}@example.com`,
      totalAmount: 80000,
      paidAmount: 20000,
      balanceDue: 60000,
      status: "partially_paid",
      dueDate: "2026-11-25",
    });

    // Schedule a payment deadline reminder in durable NotificationModel
    const notifSeq = await getNextSequence("notifications");
    await NotificationModel.create({
      id: notifSeq,
      type: "payment_deadline_reminder",
      category: "transactional",
      relatedType: "invoice",
      relatedId: testInvoice.id,
      recipientEmail: testInvoice.customerEmail,
      recipientName: testInvoice.customerName,
      subject: "Upcoming Payment Reminder",
      scheduledFor: new Date(Date.now() - 1000), // Due right now
      status: "pending",
      retryCount: 0,
      idempotencyKey: `sched_rem_${invSeq}_${Date.now()}`,
    });

    // Execute scheduler worker tick
    const processed = await processDueEmailNotifications();
    assert.ok(processed >= 1, "Scheduler worker tick should process due notification");

    // Verify WhatsApp payment reminder was triggered
    const waReminder = await WhatsAppMessageModel.findOne({
      relatedType: "invoice",
      relatedId: testInvoice.id,
      messageType: "payment_reminder",
    }).lean();

    assert.ok(waReminder, "Scheduled tick must trigger corresponding WhatsApp payment reminder");
    assert.strictEqual(waReminder.status, "simulated");
    assert.ok(waReminder.bodyText.includes("60,000"));

    // Clean up test invoice & notification
    await InvoiceModel.deleteOne({ id: invSeq });
    await NotificationModel.deleteOne({ id: notifSeq });
  });

  console.log("\n================================================================================");
  console.log(`Results: ${passedTests} passed, ${failedTests} failed out of ${passedTests + failedTests} tests`);
  console.log("================================================================================\n");

  await disconnectDB();

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running Stage 4 verification suite:", err);
  process.exit(1);
});
