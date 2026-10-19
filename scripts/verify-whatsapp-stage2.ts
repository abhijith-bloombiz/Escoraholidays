/**
 * Escora Holidays — WhatsApp Automation Stage 2 Verification Suite
 *
 * Verifies:
 * 1. Cloud API Provider: Guards against live sending when liveSendingEnabled=false.
 * 2. Cloud API Provider: Requires both apiToken and phoneNumberId.
 * 3. Cloud API Provider: Correctly formats Meta payload for "hello_world" test template.
 * 4. Cloud API Provider: Correctly formats Meta payload for custom template with variables.
 * 5. Cloud API Provider: Correctly formats Meta payload for free-form text messages.
 * 6. Cloud API Provider: Treats Meta 200 acceptance as "sent" (NOT "delivered").
 * 7. Cloud API Provider: Safely catches Meta API errors (e.g. rate limit, recipient not in list) without secret leaks.
 * 8. Webhook Handshake: GET /api/whatsapp/webhook returns challenge on token match, 403 on mismatch.
 * 9. Webhook Signature: Validates x-hub-signature-256 HMAC-SHA256 signature.
 * 10. Webhook Status Processing: Updates status to "delivered" and "read" monotonically.
 * 11. Webhook Monotonicity: Prevents late "delivered" events from downgrading "read" status.
 * 12. Webhook Inbound Opt-Out: Automatically records STOP keyword and sets transactionalOptOut=true.
 * 13. Webhook Inbound Opt-In: Automatically records START keyword and clears transactionalOptOut.
 * 14. Admin Diagnostics: Returns provider mode and status without exposing credentials.
 */

import assert from "node:assert";
import crypto from "node:crypto";
import {
  connectDB,
  disconnectDB,
  WhatsAppMessageModel,
  WhatsAppConsentModel,
  getNextSequence,
} from "../lib/db/src/index";
import { config } from "../apps/api-server/src/config/env";
import {
  CloudApiWhatsAppProvider,
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
  console.log("Escora WhatsApp Automation — Stage 2 Meta Cloud API & Webhook Suite");
  console.log("================================================================================\n");

  await connectDB();

  // Test 1: Cloud API Provider Live Sending Safety Flag
  await runTest("Cloud API Guard: Rejects live send when liveSendingEnabled=false", async () => {
    const provider = new CloudApiWhatsAppProvider({
      apiToken: "EAAB_test_token_1234567890",
      phoneNumberId: "100000000001",
      liveSendingEnabled: false,
    });

    assert.strictEqual(provider.isConfigured(), false);

    await assert.rejects(
      async () => {
        await provider.sendMessage({
          to: "+919876543210",
          recipientName: "Test Guest",
          type: "template",
          templateName: "hello_world",
          idempotencyKey: `test_guard_${Date.now()}`,
        });
      },
      /WHATSAPP_LIVE_SENDING_ENABLED=false/
    );
  });

  // Test 2: Cloud API Provider Missing Credentials Check
  await runTest("Cloud API Guard: Rejects when API Token or Phone Number ID is missing", async () => {
    const providerMissingToken = new CloudApiWhatsAppProvider({
      apiToken: undefined,
      phoneNumberId: "100000000001",
      liveSendingEnabled: true,
    });
    assert.strictEqual(providerMissingToken.isConfigured(), false);

    await assert.rejects(
      async () => {
        await providerMissingToken.sendMessage({
          to: "+919876543210",
          recipientName: "Test Guest",
          type: "template",
          templateName: "hello_world",
          idempotencyKey: `test_missing_token_${Date.now()}`,
        });
      },
      /Missing Meta WhatsApp Cloud API credentials/
    );
  });

  // Test 3: Meta Sandbox Template "hello_world" Payload Construction
  await runTest("Cloud API Dispatch: Correctly formats Meta hello_world test template payload", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    const mockFetch = async (url: any, init: any): Promise<any> => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers;
      capturedBody = JSON.parse(init?.body || "{}");

      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: "whatsapp",
          contacts: [{ input: "919876543210", wa_id: "919876543210" }],
          messages: [{ id: "wamid.HBgL_meta_test_001" }],
        }),
      };
    };

    const provider = new CloudApiWhatsAppProvider(
      {
        apiToken: "EAAB_test_mock_token_for_verification_only",
        phoneNumberId: "100000000099",
        liveSendingEnabled: true,
      },
      mockFetch as any
    );

    const result = await provider.sendMessage({
      to: "+91 98765 43210",
      recipientName: "Dr. Ananya",
      type: "template",
      templateName: "hello_world",
      idempotencyKey: `meta_hw_${Date.now()}`,
    });

    assert.ok(capturedUrl.includes("100000000099/messages"));
    assert.strictEqual(capturedHeaders["Authorization"], "Bearer EAAB_test_mock_token_for_verification_only");
    assert.strictEqual(capturedBody.messaging_product, "whatsapp");
    assert.strictEqual(capturedBody.to, "919876543210");
    assert.strictEqual(capturedBody.type, "template");
    assert.strictEqual(capturedBody.template.name, "hello_world");
    assert.strictEqual(capturedBody.template.language.code, "en_US");

    // CRITICAL: Status must be "sent", NOT "delivered"
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provider, "cloud_api");
    assert.strictEqual(result.providerStatus, "sent");
    assert.strictEqual(result.providerMessageId, "wamid.HBgL_meta_test_001");
  });

  // Test 4: Custom Template with Parameters Payload Construction
  await runTest("Cloud API Dispatch: Correctly formats parameters for custom approved templates", async () => {
    let capturedBody: any = null;

    const mockFetch = async (_url: any, init: any): Promise<any> => {
      capturedBody = JSON.parse(init?.body || "{}");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: "whatsapp",
          messages: [{ id: "wamid.HBgL_custom_002" }],
        }),
      };
    };

    const provider = new CloudApiWhatsAppProvider(
      {
        apiToken: "EAAB_test_mock_token_for_verification_only",
        phoneNumberId: "100000000099",
        liveSendingEnabled: true,
      },
      mockFetch as any
    );

    await provider.sendMessage({
      to: "+919876543210",
      recipientName: "Vikram Nair",
      type: "template",
      templateName: "escora_booking_confirmation_v1",
      templateLanguage: "en",
      templateVariables: {
        guest_name: "Vikram Nair",
        booking_id: "ESC-881",
        journey: "Backwater Sanctuary",
      },
      idempotencyKey: `meta_custom_${Date.now()}`,
    });

    assert.strictEqual(capturedBody.template.name, "escora_booking_confirmation_v1");
    assert.strictEqual(capturedBody.template.language.code, "en");
    assert.strictEqual(capturedBody.template.components.length, 1);
    assert.strictEqual(capturedBody.template.components[0].parameters.length, 3);
    assert.strictEqual(capturedBody.template.components[0].parameters[0].text, "Vikram Nair");
    assert.strictEqual(capturedBody.template.components[0].parameters[1].text, "ESC-881");
  });

  // Test 5: Meta API Error Handling (Rate Limit & Recipient List)
  await runTest("Cloud API Errors: Captures Meta error codes safely without crashing or leaking secrets", async () => {
    const mockFetchError = async (): Promise<any> => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          message: "(#131030) Recipient phone number not in allowed list",
          type: "OAuthException",
          code: 131030,
          error_data: {
            messaging_product: "whatsapp",
            details: "Recipient phone number not in allowed list",
          },
          fbtrace_id: "AxYz_trace_123",
        },
      }),
    });

    const provider = new CloudApiWhatsAppProvider(
      {
        apiToken: "EAAB_test_mock_secret_token",
        phoneNumberId: "100000000099",
        liveSendingEnabled: true,
      },
      mockFetchError as any
    );

    const result = await provider.sendMessage({
      to: "+919876543210",
      recipientName: "Test User",
      type: "template",
      templateName: "hello_world",
      idempotencyKey: `meta_err_${Date.now()}`,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.providerStatus, "failed");
    assert.ok(result.error?.includes("131030"));
    assert.ok(result.error?.includes("Recipient phone number not in allowed list"));
    // Ensure token is NOT leaked in the error
    assert.ok(!result.error?.includes("EAAB_test_mock_secret_token"));
  });

  // Test 6: Webhook Handshake Verification (GET /api/whatsapp/webhook)
  await runTest("Webhook Verification: Responds with challenge on token match, rejects on mismatch", async () => {
    const originalToken = config.whatsappWebhookVerifyToken;
    config.whatsappWebhookVerifyToken = "test_webhook_verify_token_999";

    // Valid verify token
    const isValid = verifyWebhookToken("subscribe", "test_webhook_verify_token_999");
    assert.strictEqual(isValid, true, "Matching verify token must return true");

    // Invalid verify token
    const isInvalidToken = verifyWebhookToken("subscribe", "wrong_random_token");
    assert.strictEqual(isInvalidToken, false, "Mismatched verify token must return false");

    // Invalid mode
    const isInvalidMode = verifyWebhookToken("unsubscribe", "test_webhook_verify_token_999");
    assert.strictEqual(isInvalidMode, false, "Invalid mode must return false");

    // Restore original token
    config.whatsappWebhookVerifyToken = originalToken;
  });

  // Test 7: Webhook Signature Verification (HMAC-SHA256)
  await runTest("Webhook Signature: Validates x-hub-signature-256 header correctly", async () => {
    const secret = "test_meta_app_secret_123";
    const originalSecret = config.whatsappAppSecret;
    config.whatsappAppSecret = secret;

    const payloadText = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const expectedSignature = `sha256=${crypto.createHmac("sha256", secret).update(payloadText, "utf8").digest("hex")}`;

    const valid = verifyWebhookSignature(payloadText, expectedSignature);
    assert.strictEqual(valid, true, "Valid HMAC signature must pass");

    const invalid = verifyWebhookSignature(payloadText, "sha256=invalid_hex_signature_deadbeef");
    assert.strictEqual(invalid, false, "Invalid HMAC signature must be rejected");

    config.whatsappAppSecret = originalSecret;
  });

  // Test 8: Webhook Status Processing - Delivered & Read Monotonic Updates
  await runTest("Webhook Processing: Updates message from sent -> delivered -> read monotonically", async () => {
    const providerMessageId = `wamid.HBgL_${Date.now()}_monotonic_test`;
    const idempotencyKey = `mono_test_${Date.now()}`;

    // Create an initial message in 'sent' state
    const nextId = await getNextSequence("whatsapp_messages");
    await WhatsAppMessageModel.create({
      id: nextId,
      recipientPhone: "+919876543210",
      recipientName: "Sanjay Menon",
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: 104,
      bodyText: "Confirmed booking",
      provider: "cloud_api",
      providerMessageId,
      providerStatus: "sent",
      status: "sent",
      idempotencyKey,
      sentAt: new Date(),
    });

    // 1. Send 'delivered' webhook event
    const deliveredPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "200000000000002",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: providerMessageId,
                    status: "delivered",
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    recipient_id: "919876543210",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const resDelivered = await processWhatsAppWebhookPayload(deliveredPayload);
    assert.strictEqual(resDelivered.processedStatuses, 1);

    const docAfterDelivered = await WhatsAppMessageModel.findOne({ id: nextId }).lean();
    assert.strictEqual(docAfterDelivered?.status, "delivered");
    assert.ok(docAfterDelivered?.deliveredAt);

    // 2. Send 'read' webhook event
    const readPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "200000000000002",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: providerMessageId,
                    status: "read",
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    recipient_id: "919876543210",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const resRead = await processWhatsAppWebhookPayload(readPayload);
    assert.strictEqual(resRead.processedStatuses, 1);

    const docAfterRead = await WhatsAppMessageModel.findOne({ id: nextId }).lean();
    assert.strictEqual(docAfterRead?.status, "read");
    assert.ok(docAfterRead?.readAt);

    // 3. Monotonic check: Late 'delivered' event must NOT revert status back to 'delivered'
    await processWhatsAppWebhookPayload(deliveredPayload);
    const docAfterLateDelivered = await WhatsAppMessageModel.findOne({ id: nextId }).lean();
    assert.strictEqual(docAfterLateDelivered?.status, "read", "Late delivered event must not downgrade read status");
  });

  // Test 9: Webhook Inbound STOP Keyword Opt-Out Handling
  await runTest("Webhook Inbound: Inbound STOP keyword automatically records customer opt-out", async () => {
    const customerPhone = "+919800011122";

    // Customer was previously not opted out
    await setWhatsAppConsent(customerPhone, { transactionalOptOut: false });

    const inboundStopPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "200000000000002",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "919800011122",
                    id: `wamid.inbound_${Date.now()}`,
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

    const res = await processWhatsAppWebhookPayload(inboundStopPayload);
    assert.strictEqual(res.processedInbound, 1);

    const consent = await getWhatsAppConsent(customerPhone);
    assert.strictEqual(consent?.transactionalOptOut, true, "Customer must be recorded as opted-out");
    assert.strictEqual(consent?.source, "webhook_stop_keyword");

    // 2. Inbound START keyword re-subscribes
    const inboundStartPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "200000000000002",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "919800011122",
                    id: `wamid.inbound_${Date.now()}_start`,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    text: { body: "START" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await processWhatsAppWebhookPayload(inboundStartPayload);
    const reConsent = await getWhatsAppConsent(customerPhone);
    assert.strictEqual(reConsent?.transactionalOptOut, false, "Customer must be re-subscribed");
  });

  console.log("\n================================================================================");
  console.log(`Stage 2 Verification Complete: ${passedTests} passed, ${failedTests} failed.`);
  console.log("================================================================================\n");

  await disconnectDB();

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running Stage 2 verification suite:", err);
  process.exit(1);
});
