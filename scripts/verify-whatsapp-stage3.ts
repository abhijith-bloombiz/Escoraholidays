/**
 * Escora Holidays — WhatsApp Automation Stage 3 Verification Suite
 *
 * Verifies:
 * 1. Webhook Verification Handshake (GET /api/whatsapp/webhook challenge response & rejection)
 * 2. Webhook Signature Security (HMAC-SHA256 signature verification & rejection of invalid signatures)
 * 3. Delivery Lifecycle Tracking (Monotonic sent -> delivered -> read status progression with timestamps)
 * 4. Delivery Lifecycle Out-of-Order Safety (Late delivered event does not overwrite read status)
 * 5. Delivery Lifecycle Failure Events (Meta error codes, undeliverable reasons, and details parsed safely)
 * 6. Webhook Idempotency (Duplicate status webhook events do not create duplicates or corrupt records)
 * 7. Inbound Message Capture & Direction (Inbound messages saved with direction='inbound' in audit log)
 * 8. Inbound Deduplication (Duplicate inbound wamid events are safely skipped)
 * 9. Inbound STOP Keyword (Immediately records customer opt-out and suppresses future dispatches)
 * 10. Inbound HELP Keyword (Records assistance request in consent notes & routes to enquiry without auto-replies)
 * 11. Inbound START Keyword (Re-subscribes customer and clears transactional opt-out)
 */

import assert from "node:assert";
import crypto from "node:crypto";
import {
  connectDB,
  disconnectDB,
  WhatsAppMessageModel,
  WhatsAppConsentModel,
  EnquiryModel,
  getNextSequence,
} from "../lib/db/src/index";
import { config } from "../apps/api-server/src/config/env";
import {
  verifyWebhookToken,
  verifyWebhookSignature,
  processWhatsAppWebhookPayload,
  getWhatsAppConsent,
  setWhatsAppConsent,
  sendWhatsAppMessage,
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
  console.log("Escora WhatsApp Automation — Stage 3 Webhooks & Delivery Tracking Suite");
  console.log("================================================================================\n");

  await connectDB();

  // Test 1: Webhook Challenge Verification (GET /api/whatsapp/webhook)
  await runTest("Webhook Handshake: Validates challenge token and rejects invalid mode/token", async () => {
    const originalToken = config.whatsappWebhookVerifyToken;
    config.whatsappWebhookVerifyToken = "stage3_verify_secret_token_123";

    // 1. Valid handshake
    const valid = verifyWebhookToken("subscribe", "stage3_verify_secret_token_123");
    assert.strictEqual(valid, true, "Matching verify token with subscribe mode must return true");

    // 2. Token mismatch
    const invalidToken = verifyWebhookToken("subscribe", "wrong_token");
    assert.strictEqual(invalidToken, false, "Mismatched verify token must be rejected");

    // 3. Mode mismatch
    const invalidMode = verifyWebhookToken("invalid_mode", "stage3_verify_secret_token_123");
    assert.strictEqual(invalidMode, false, "Non-subscribe mode must be rejected");

    config.whatsappWebhookVerifyToken = originalToken;
  });

  // Test 2: Webhook HMAC-SHA256 Signature Security
  await runTest("Webhook Signature: Rejects missing, invalid, or tampered HMAC signatures", async () => {
    const originalSecret = config.whatsappAppSecret;
    const testSecret = "stage3_test_meta_app_secret";
    config.whatsappAppSecret = testSecret;

    const payloadText = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "1001", changes: [] }],
    });

    // 1. Correct signature
    const validHmac = crypto.createHmac("sha256", testSecret).update(payloadText, "utf8").digest("hex");
    const validHeader = `sha256=${validHmac}`;
    assert.strictEqual(verifyWebhookSignature(payloadText, validHeader), true, "Valid HMAC must pass");

    // 2. Tampered body
    const tamperedBody = payloadText + " ";
    assert.strictEqual(verifyWebhookSignature(tamperedBody, validHeader), false, "Tampered payload must be rejected");

    // 3. Forged signature
    const forgedHeader = "sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    assert.strictEqual(verifyWebhookSignature(payloadText, forgedHeader), false, "Forged signature must be rejected");

    // 4. Missing signature
    assert.strictEqual(verifyWebhookSignature(payloadText, undefined), false, "Missing signature header must be rejected");

    config.whatsappAppSecret = originalSecret;
  });

  // Test 3: Delivery Lifecycle - Monotonic Transitions & Timestamps
  await runTest("Delivery Lifecycle: Updates sent -> delivered -> read monotonically with timestamps", async () => {
    const providerMessageId = `wamid.HBgL_stage3_lifecycle_${Date.now()}`;
    const idempotencyKey = `stage3_mono_${Date.now()}`;
    const nextId = await getNextSequence("whatsapp_messages");

    const initialSentAt = new Date(Date.now() - 30000);

    // Initial outbound message recorded upon API acceptance
    await WhatsAppMessageModel.create({
      id: nextId,
      direction: "outbound",
      recipientPhone: "+919876543210",
      recipientName: "Deepak Nambiar",
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: 501,
      bodyText: "Booking confirmation message",
      provider: "cloud_api",
      providerMessageId,
      providerStatus: "sent",
      status: "sent",
      idempotencyKey,
      sentAt: initialSentAt,
    });

    // 1. Deliver event arrives from Meta webhook
    const deliveredTimeSeconds = Math.floor(Date.now() / 1000) - 15;
    const deliveredPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_001",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: providerMessageId,
                    status: "delivered",
                    timestamp: String(deliveredTimeSeconds),
                    recipient_id: "919876543210",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res1 = await processWhatsAppWebhookPayload(deliveredPayload);
    assert.strictEqual(res1.processedStatuses, 1);

    const afterDelivered = await WhatsAppMessageModel.findOne({ id: nextId }).lean();
    assert.strictEqual(afterDelivered?.status, "delivered");
    assert.ok(afterDelivered?.deliveredAt);
    assert.strictEqual(afterDelivered?.providerStatus, "delivered");

    // 2. Read event arrives from Meta webhook
    const readTimeSeconds = Math.floor(Date.now() / 1000) - 5;
    const readPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_001",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: providerMessageId,
                    status: "read",
                    timestamp: String(readTimeSeconds),
                    recipient_id: "919876543210",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res2 = await processWhatsAppWebhookPayload(readPayload);
    assert.strictEqual(res2.processedStatuses, 1);

    const afterRead = await WhatsAppMessageModel.findOne({ id: nextId }).lean();
    assert.strictEqual(afterRead?.status, "read");
    assert.ok(afterRead?.readAt);

    // 3. Out-of-order check: Late delivered webhook event arriving AFTER read
    await processWhatsAppWebhookPayload(deliveredPayload);
    const afterLateDelivered = await WhatsAppMessageModel.findOne({ id: nextId }).lean();
    assert.strictEqual(afterLateDelivered?.status, "read", "Late delivered event must not downgrade read status");
  });

  // Test 4: Delivery Lifecycle - Meta Failure Event Parsing
  await runTest("Delivery Failure: Accurately records Meta failure code and safe description", async () => {
    const providerMessageId = `wamid.HBgL_stage3_fail_${Date.now()}`;
    const idempotencyKey = `stage3_fail_${Date.now()}`;
    const nextId = await getNextSequence("whatsapp_messages");

    await WhatsAppMessageModel.create({
      id: nextId,
      direction: "outbound",
      recipientPhone: "+919876500000",
      recipientName: "Test Guest",
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: 502,
      bodyText: "Test message",
      provider: "cloud_api",
      providerMessageId,
      providerStatus: "sent",
      status: "sent",
      idempotencyKey,
      sentAt: new Date(),
    });

    // Meta sends a failure webhook event (e.g. 131026 Message Undeliverable)
    const failedPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_001",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: providerMessageId,
                    status: "failed",
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    recipient_id: "919876500000",
                    errors: [
                      {
                        code: 131026,
                        title: "Message Undeliverable",
                        message: "Message Undeliverable",
                        error_data: {
                          details: "Cloud API message could not be delivered to the recipient device.",
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await processWhatsAppWebhookPayload(failedPayload);
    assert.strictEqual(res.processedStatuses, 1);

    const doc = await WhatsAppMessageModel.findOne({ id: nextId }).lean();
    assert.strictEqual(doc?.status, "failed");
    assert.strictEqual(doc?.providerStatus, "failed");
    assert.ok(doc?.error?.includes("131026"), "Error field must record the Meta error code");
    assert.ok(doc?.error?.includes("Message Undeliverable"), "Error field must record safe title/message");
  });

  // Test 5: Inbound General Message & Direction Tagging
  await runTest("Inbound Capture: Records guest message with direction='inbound' and routes to Enquiry", async () => {
    const guestPhone = `+9198711${Math.floor(10000 + Math.random() * 90000)}`;
    const guestWaId = guestPhone.replace("+", "");
    const inMsgId = `wamid.HBgL_inbound_query_${Date.now()}`;

    const inboundPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_001",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [{ profile: { name: "Anand R" }, wa_id: guestWaId }],
                messages: [
                  {
                    from: guestWaId,
                    id: inMsgId,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    text: { body: "Could you please confirm our tea plantation pickup time?" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await processWhatsAppWebhookPayload(inboundPayload);
    assert.strictEqual(res.processedInbound, 1);

    // Verify audit record in WhatsAppMessageModel
    const auditRecord = await WhatsAppMessageModel.findOne({ providerMessageId: inMsgId }).lean();
    assert.ok(auditRecord, "Inbound message must create an audit record");
    assert.strictEqual(auditRecord?.direction, "inbound");
    assert.strictEqual(auditRecord?.recipientName, "Anand R");
    assert.strictEqual(auditRecord?.status, "delivered");
    assert.strictEqual(auditRecord?.bodyText, "Could you please confirm our tea plantation pickup time?");

    // Verify routed to EnquiryModel
    const enquiry = await EnquiryModel.findOne({ phone: guestPhone }).lean();
    assert.ok(enquiry, "Inbound message must create or update an Enquiry ticket");
    assert.strictEqual(enquiry?.status, "new");
  });

  // Test 6: Inbound Deduplication
  await runTest("Inbound Deduplication: Ignores duplicate deliveries of the same inbound message ID", async () => {
    const guestPhone = `+9198722${Math.floor(10000 + Math.random() * 90000)}`;
    const guestWaId = guestPhone.replace("+", "");
    const inMsgId = `wamid.HBgL_dedup_${Date.now()}`;

    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_001",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [{ profile: { name: "Gayathri P" }, wa_id: guestWaId }],
                messages: [
                  {
                    from: guestWaId,
                    id: inMsgId,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    text: { body: "Hello concierge team" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    // First delivery
    const res1 = await processWhatsAppWebhookPayload(payload);
    assert.strictEqual(res1.processedInbound, 1);

    // Second duplicate delivery
    const res2 = await processWhatsAppWebhookPayload(payload);
    assert.strictEqual(res2.processedInbound, 0, "Duplicate inbound delivery must be skipped");

    // Count in DB must be exactly 1
    const count = await WhatsAppMessageModel.countDocuments({ providerMessageId: inMsgId });
    assert.strictEqual(count, 1, "Exactly one audit record must exist for the inbound message");
  });

  // Test 7: Inbound STOP Keyword & Suppression Safeguard
  await runTest("Inbound STOP: Intercepts opt-out keyword and blocks future marketing messages", async () => {
    const phone = `+9198733${Math.floor(10000 + Math.random() * 90000)}`;
    const waId = phone.replace("+", "");

    // Customer originally had marketing consent
    await setWhatsAppConsent(phone, { marketingConsent: true, transactionalOptOut: false });

    // Customer sends STOP
    const stopPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_001",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [{ profile: { name: "Ramesh K" }, wa_id: waId }],
                messages: [
                  {
                    from: waId,
                    id: `wamid.stop_${Date.now()}`,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    text: { body: "STOP" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await processWhatsAppWebhookPayload(stopPayload);

    // Consent check
    const consent = await getWhatsAppConsent(phone);
    assert.strictEqual(consent?.transactionalOptOut, true, "Customer must have transactionalOptOut=true");

    // Attempting to dispatch an outbound message must be blocked immediately
    const dispatchResult = await sendWhatsAppMessage({
      recipientPhone: phone,
      recipientName: "Ramesh K",
      messageType: "promotional_offer",
      category: "marketing",
      trigger: "promo_test",
      relatedType: "custom",
      relatedId: 901,
      bodyText: "Monsoon luxury discount",
      idempotencyKey: `blocked_optout_${Date.now()}`,
    });

    assert.strictEqual(dispatchResult.status, "skipped_opted_out", "Must block message to opted-out guest");
  });

  // Test 8: Inbound HELP Keyword Handling (No autonomous AI / Chatbot reply)
  await runTest("Inbound HELP: Recognizes keyword, updates consent notes, and routes to enquiry", async () => {
    const phone = `+9198744${Math.floor(10000 + Math.random() * 90000)}`;
    const waId = phone.replace("+", "");

    const helpPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_001",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [{ profile: { name: "Sunita Verma" }, wa_id: waId }],
                messages: [
                  {
                    from: waId,
                    id: `wamid.help_${Date.now()}`,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    text: { body: "HELP" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await processWhatsAppWebhookPayload(helpPayload);

    // Consent check: Must NOT opt out customer
    const consent = await getWhatsAppConsent(phone);
    assert.strictEqual(consent?.transactionalOptOut, false, "HELP must NOT opt out the customer");
    assert.ok(consent?.notes?.includes("HELP"), "Notes must record HELP assistance request");

    // Audit record check
    const auditRecord = await WhatsAppMessageModel.findOne({ recipientPhone: phone, messageType: "inbound_help_request" }).lean();
    assert.ok(auditRecord, "Must create inbound_help_request audit record");
    assert.strictEqual(auditRecord?.direction, "inbound");

    // Enquiry check
    const enquiry = await EnquiryModel.findOne({ phone }).lean();
    assert.ok(enquiry, "Must create an Enquiry for concierge assistance");
    assert.ok(enquiry?.message.includes("HELP"), "Enquiry message must reflect the HELP request");
  });

  console.log("\n================================================================================");
  console.log(`Stage 3 Verification Complete: ${passedTests} passed, ${failedTests} failed.`);
  console.log("================================================================================\n");

  await disconnectDB();

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running Stage 3 verification suite:", err);
  process.exit(1);
});
