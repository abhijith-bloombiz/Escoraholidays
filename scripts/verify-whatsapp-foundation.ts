/**
 * Escora Holidays — WhatsApp Automation Stage 1 Verification Suite
 *
 * Verifies:
 * 1. Mock Provider foundation simulates sending without external network calls.
 * 2. Provider selection fallback safely prefers Mock in development.
 * 3. Idempotency keys prevent duplicate message dispatch.
 * 4. Anti-spam consent safeguard: Enquiry submission DOES NOT grant marketing consent.
 * 5. Marketing messages are strictly blocked without explicit prior opt-in.
 * 6. Explicit marketing consent allows marketing dispatch.
 * 7. Customer opt-out (STOP) blocks transactional communications.
 * 8. Automation toggle settings correctly disable specific message types.
 * 9. Retry mechanism safely updates existing records without duplicate sends.
 * 10. E.164 phone normalization formats various Indian & international inputs.
 * 11. Workflow triggers (enquiry ack, booking confirmation, itinerary update, invoice receipt, document delivery).
 * 12. Zero real WhatsApp messages sent (credentials kept server-side, live sending false).
 */

import assert from "node:assert";
import crypto from "node:crypto";
import {
  connectDB,
  disconnectDB,
  WhatsAppMessageModel,
  WhatsAppConsentModel,
  WhatsAppSettingModel,
  EnquiryModel,
  OrderModel,
  ItineraryModel,
  InvoiceModel,
  getNextSequence,
} from "../lib/db/src/index";
import { config } from "../apps/api-server/src/config/env";
import {
  getWhatsAppProvider,
  MockWhatsAppProvider,
  CloudApiWhatsAppProvider,
  normalizePhoneNumber,
  sendWhatsAppMessage,
  retryWhatsAppMessage,
  getWhatsAppSettings,
  updateWhatsAppSettings,
  getWhatsAppConsent,
  setWhatsAppConsent,
  verifyWhatsAppConsent,
  triggerWhatsAppEnquiryAcknowledgement,
  triggerWhatsAppBookingConfirmation,
  triggerWhatsAppItineraryUpdate,
  triggerWhatsAppPaymentReceipt,
  triggerWhatsAppDocumentDelivery,
} from "../apps/api-server/src/services/whatsapp";

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
  console.log("Escora WhatsApp Automation — Stage 1 Mock Foundation Verification Suite");
  console.log("================================================================================\n");

  await connectDB();

  // Test 1: Phone Normalization
  await runTest("Phone Normalization: Handles 10-digit Indian, 0-prefixed, and international formats", async () => {
    const t1 = normalizePhoneNumber("9876543210");
    assert.strictEqual(t1.valid, true);
    assert.strictEqual(t1.normalized, "+919876543210");

    const t2 = normalizePhoneNumber("+91 98765 43210");
    assert.strictEqual(t2.valid, true);
    assert.strictEqual(t2.normalized, "+919876543210");

    const t3 = normalizePhoneNumber("09876543210");
    assert.strictEqual(t3.valid, true);
    assert.strictEqual(t3.normalized, "+919876543210");

    const t4 = normalizePhoneNumber("+44 7911 123456");
    assert.strictEqual(t4.valid, true);
    assert.strictEqual(t4.normalized, "+447911123456");

    const t5 = normalizePhoneNumber("invalid");
    assert.strictEqual(t5.valid, false);
  });

  // Test 2: Mock Provider Foundation
  await runTest("Mock Provider: Dispatches simulated send and returns mock provider message ID", async () => {
    const provider = getWhatsAppProvider();
    assert.strictEqual(provider.name, "mock");

    const res = await provider.sendMessage({
      to: "+919876543210",
      recipientName: "Dr. Ananya",
      type: "text",
      text: "Namaste from Escora Holidays",
      idempotencyKey: `test_mock_${Date.now()}`,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.provider, "mock");
    assert.ok(res.providerMessageId.startsWith("mock_wam_"));
    assert.strictEqual(res.providerStatus, "simulated");
  });

  // Test 3: Cloud API Architecture Skeleton Guard
  await runTest("Cloud API Skeleton: Guards against accidental live send without credentials", async () => {
    const cloudProvider = new CloudApiWhatsAppProvider();
    assert.strictEqual(cloudProvider.name, "cloud_api");
    assert.strictEqual(cloudProvider.isConfigured(), false); // Must be false in Stage 1

    await assert.rejects(
      async () => {
        await cloudProvider.sendMessage({
          to: "+919876543210",
          recipientName: "Test",
          type: "text",
          text: "Test",
          idempotencyKey: "test_cloud_guard",
        });
      },
      /WhatsApp live sending is strictly disabled|Stage 1/
    );
  });

  // Test 4: Idempotency Protection
  await runTest("Idempotency: Prevents duplicate sends when using identical idempotency key", async () => {
    const idempotencyKey = `idem_test_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const first = await sendWhatsAppMessage({
      recipientPhone: "+919876543210",
      recipientName: "Vikram Nair",
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: 101,
      bodyText: "Booking confirmed",
      idempotencyKey,
    });

    assert.strictEqual(first.idempotencyKey, idempotencyKey);
    assert.strictEqual(first.status, "simulated");

    // Second attempt with SAME key
    const second = await sendWhatsAppMessage({
      recipientPhone: "+919876543210",
      recipientName: "Vikram Nair",
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: 101,
      bodyText: "Booking confirmed AGAIN",
      idempotencyKey,
    });

    assert.strictEqual(second.id, first.id, "Second dispatch must return existing record");
    assert.strictEqual(second.providerMessageId, first.providerMessageId, "Provider message ID must match");

    // Verify only ONE record in DB
    const count = await WhatsAppMessageModel.countDocuments({ idempotencyKey });
    assert.strictEqual(count, 1, "Exactly one database document must exist for the idempotency key");
  });

  // Test 5: Consent Safeguard - Enquiry does NOT grant marketing consent
  await runTest("Consent Safeguard: Submitting an enquiry does not allow marketing broadcasts", async () => {
    const phone = "+919811122233";

    // Create enquiry
    const enqId = await getNextSequence("enquiries");
    const enq = await EnquiryModel.create({
      id: enqId,
      name: "Rohit Varma",
      email: "rohit.varma@example.com",
      phone,
      message: "Looking for a Kumarakom houseboat",
      status: "new",
    });

    // Verify consent check: category marketing without explicit opt-in must be BLOCKED
    const consentCheck = await verifyWhatsAppConsent(phone, "marketing");
    assert.strictEqual(consentCheck.allowed, false);
    assert.strictEqual(consentCheck.status, "skipped_no_consent");

    // Attempt to dispatch a marketing message
    const msg = await sendWhatsAppMessage({
      recipientPhone: phone,
      recipientName: enq.name,
      messageType: "promotional_offer",
      category: "marketing",
      trigger: "seasonal_promo",
      relatedType: "enquiry",
      relatedId: enq.id,
      bodyText: "Exclusive 20% discount on monsoon houseboats",
      idempotencyKey: `mkt_test_${Date.now()}`,
    });

    assert.strictEqual(msg.status, "skipped_no_consent");
    assert.ok(msg.error?.includes("explicit marketing consent"));
  });

  // Test 6: Explicit Marketing Consent Grants Permission
  await runTest("Consent Safeguard: Explicit opt-in permits marketing messages", async () => {
    const phone = "+919822233344";

    // Explicit opt-in via consent model
    await setWhatsAppConsent(phone, {
      marketingConsent: true,
      name: "Meera Pillai",
      source: "vip_guest_explicit_optin",
    });

    const consentCheck = await verifyWhatsAppConsent(phone, "marketing");
    assert.strictEqual(consentCheck.allowed, true);

    const msg = await sendWhatsAppMessage({
      recipientPhone: phone,
      recipientName: "Meera Pillai",
      messageType: "promotional_offer",
      category: "marketing",
      trigger: "seasonal_promo",
      relatedType: "custom",
      relatedId: 1,
      bodyText: "Exclusive invitation to Kerala Cardamom Hills harvest",
      idempotencyKey: `mkt_vip_${Date.now()}`,
    });

    assert.strictEqual(msg.status, "simulated");
  });

  // Test 7: Customer Opt-Out (STOP) suppresses transactional communications
  await runTest("Opt-Out Safeguard: Customer opt-out suppresses even transactional messages", async () => {
    const phone = "+919833344455";

    // Customer requests opt-out
    await setWhatsAppConsent(phone, {
      transactionalOptOut: true,
      name: "Suresh Kumar",
      source: "customer_stop_keyword",
    });

    const consentCheck = await verifyWhatsAppConsent(phone, "transactional");
    assert.strictEqual(consentCheck.allowed, false);
    assert.strictEqual(consentCheck.status, "skipped_opted_out");

    const msg = await sendWhatsAppMessage({
      recipientPhone: phone,
      recipientName: "Suresh Kumar",
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: 102,
      bodyText: "Booking confirmation",
      idempotencyKey: `optout_test_${Date.now()}`,
    });

    assert.strictEqual(msg.status, "skipped_opted_out");
    assert.ok(msg.error?.includes("opted out"));
  });

  // Test 8: Automation Toggles
  await runTest("Automation Controls: Disabling specific trigger skips dispatch", async () => {
    // Disable payment reminders temporarily
    await updateWhatsAppSettings({ enablePaymentReminders: false }, "TestSuite");

    const msg = await sendWhatsAppMessage({
      recipientPhone: "+919844455566",
      recipientName: "Pooja Reddy",
      messageType: "payment_reminder",
      category: "transactional",
      trigger: "invoice_due_reminder",
      relatedType: "invoice",
      relatedId: 201,
      bodyText: "Your installment payment is due tomorrow",
      idempotencyKey: `toggle_test_${Date.now()}`,
    });

    assert.strictEqual(msg.status, "skipped_disabled");
    assert.ok(msg.error?.includes("disabled in WhatsApp settings"));

    // Re-enable
    await updateWhatsAppSettings({ enablePaymentReminders: true }, "TestSuite");
  });

  // Test 9: Safe Retry without Duplicates
  await runTest("Retry Support: Retrying failed/skipped message updates row and increments retryCount", async () => {
    const phone = "+919855566677";
    await setWhatsAppConsent(phone, { marketingConsent: false, transactionalOptOut: false });

    // Send a marketing message that will be skipped (no consent)
    const initial = await sendWhatsAppMessage({
      recipientPhone: phone,
      recipientName: "Kavita Rao",
      messageType: "promotional_offer",
      category: "marketing",
      trigger: "test_promo",
      relatedType: "custom",
      relatedId: 301,
      bodyText: "Monsoon offer",
      idempotencyKey: `retry_test_${Date.now()}`,
    });

    assert.strictEqual(initial.status, "skipped_no_consent");
    assert.strictEqual(initial.retryCount, 0);

    // Now customer provides marketing consent
    await setWhatsAppConsent(phone, { marketingConsent: true });

    // Retry the existing message
    const retried = await retryWhatsAppMessage(initial.id);
    assert.strictEqual(retried.id, initial.id, "ID must remain unchanged");
    assert.strictEqual(retried.retryCount, 1, "retryCount must increment to 1");
    assert.strictEqual(retried.status, "simulated", "Status must update to simulated upon successful retry");
  });

  // Test 10: Workflow Triggers
  await runTest("Workflow Triggers: Enquiry, Booking, Itinerary, Invoice, Documents dispatch successfully", async () => {
    // 1. Enquiry Acknowledgement
    const enq = {
      id: 991,
      name: "Aarti Krishnan",
      email: "aarti@example.com",
      phone: "+919866677788",
      message: "Private Munnar tea sanctuary inquiry",
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const ackMsg = await triggerWhatsAppEnquiryAcknowledgement(enq as any);
    assert.ok(ackMsg);
    assert.strictEqual(ackMsg.messageType, "enquiry_acknowledgement");
    assert.strictEqual(ackMsg.relatedId, 991);
    assert.strictEqual(ackMsg.status, "simulated");

    // 2. Booking Confirmation
    const order = {
      id: 881,
      guestName: "Capt. Rajesh Nair",
      guestEmail: "rajesh@example.com",
      guestPhone: "+919877788899",
      packageName: "Backwater Serenade & Heritage Estate",
      travelDate: "2026-11-10",
      departureDate: "2026-11-17",
      guestCount: 2,
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const bookMsg = await triggerWhatsAppBookingConfirmation(order as any);
    assert.ok(bookMsg);
    assert.strictEqual(bookMsg.messageType, "booking_confirmation");
    assert.strictEqual(bookMsg.relatedId, 881);
    assert.strictEqual(bookMsg.status, "simulated");

    // 3. Itinerary Update
    const itinerary = {
      id: 771,
      customerName: "Dr. Deepa Sen",
      customerPhone: "+919888899900",
      title: "Wayanad Rainforest Sanctuary",
      shareToken: "token_wayanad_123",
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const itinMsg = await triggerWhatsAppItineraryUpdate(itinerary as any);
    assert.ok(itinMsg);
    assert.strictEqual(itinMsg.messageType, "itinerary_update");
    assert.strictEqual(itinMsg.relatedId, 771);

    // 4. Invoice Receipt
    const invoice = {
      id: 661,
      invoiceNumber: "ESC-INV-2026-0661",
      customerName: "Harish Nambiar",
      customerPhone: "+919899900011",
      totalAmount: 120000,
      paidAmount: 60000,
      balanceDue: 60000,
      status: "partially_paid",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const rcptMsg = await triggerWhatsAppPaymentReceipt(invoice as any);
    assert.ok(rcptMsg);
    assert.strictEqual(rcptMsg.messageType, "payment_receipt");
    assert.strictEqual(rcptMsg.relatedId, 661);

    // 5. Document Delivery
    const docMsg = await triggerWhatsAppDocumentDelivery(
      order as any,
      "Private Houseboat Boarding Pass & Sanctuary Voucher",
      "https://www.escoraholidays.com/docs/voucher-881.pdf"
    );
    assert.ok(docMsg);
    assert.strictEqual(docMsg.messageType, "document_delivery");
    assert.strictEqual(docMsg.relatedId, 881);
  });

  console.log("\n================================================================================");
  console.log(`Verification Complete: ${passedTests} passed, ${failedTests} failed.`);
  console.log("================================================================================\n");

  await disconnectDB();

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running verification suite:", err);
  process.exit(1);
});
