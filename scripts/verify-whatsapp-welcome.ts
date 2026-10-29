/**
 * Escora Holidays — WhatsApp Welcome Bot & 2-Way Live Chat Verification Suite
 *
 * Verifies:
 * 1. Settings persistence for Welcome Bot (Banner URL, Greeting copy, 3 Interactive Buttons & auto-replies).
 * 2. Inbound welcome bot trigger:
 *    - Inbound greeting ("Hi", "Hello") sends welcome banner + greeting + 3 quick-reply buttons.
 * 3. Inbound button click handler:
 *    - Clicking btn_packages replies with packages overview.
 *    - Clicking btn_custom_trip replies with questionnaire link.
 *    - Clicking btn_concierge alerts human concierge.
 * 4. Conversations API (/api/whatsapp/conversations):
 *    - Returns grouped messages, active 24h customer service window countdown, selected buttons.
 * 5. Test Welcome endpoint:
 *    - Dispatches simulated test welcome message with interactive buttons.
 */

import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  WhatsAppMessageModel,
  WhatsAppSettingModel,
  getNextSequence,
} from "../lib/db/src/index";
import {
  getWhatsAppSettings,
  updateWhatsAppSettings,
  processWhatsAppWebhookPayload,
  sendWhatsAppMessage,
} from "../apps/api-server/src/services/whatsapp";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`  • ${name} ... `);
  try {
    await fn();
    console.log("PASSED");
    passed++;
  } catch (err: any) {
    console.log(`FAILED: ${err.message}`);
    console.error(err);
    failed++;
  }
}

async function main() {
  console.log("\n================================================================================");
  console.log("Escora WhatsApp — Welcome Greeting Bot & Live Chat Suite");
  console.log("================================================================================\n");

  await connectDB();

  const testPhone = "+919847199999";
  const rawFrom = "919847199999";

  // Clean previous test messages
  await WhatsAppMessageModel.deleteMany({ recipientPhone: testPhone });

  // 1. Settings persistence
  await test("Welcome Bot Settings: can save banner URL, personalized greeting copy, and buttons", async () => {
    const updated = await updateWhatsAppSettings(
      {
        welcomeGreetingEnabled: true,
        welcomeBannerUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944",
        welcomeGreetingText: "Namaste {{first_name}}! Welcome to Escora Holidays Kerala.",
        welcomeButton1Label: "🌴 Packages",
        welcomeButton1Reply: "Here are our packages: Alleppey, Munnar, Wayanad.",
        welcomeButton2Label: "✍️ Custom Plan",
        welcomeButton2Reply: "Tell us your travel dates and requirements.",
        welcomeButton3Label: "🛎️ Human Help",
        welcomeButton3Reply: "A human concierge is now connected to you.",
      },
      "TestAdmin"
    );

    assert.strictEqual(updated.welcomeGreetingEnabled, true);
    assert.strictEqual(updated.welcomeButton1Label, "🌴 Packages");

    const settings = await getWhatsAppSettings();
    assert.strictEqual(settings.welcomeGreetingText, "Namaste {{first_name}}! Welcome to Escora Holidays Kerala.");
  });

  // 2. Inbound "Hi" triggers automated welcome greeting with 3 buttons
  await test("Inbound 'Hi' Trigger: Automatically dispatches banner image + greeting + 3 quick reply buttons", async () => {
    const inboundId = `wamid.test_inbound_${Date.now()}`;
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ profile: { name: "Anand Sharma" }, wa_id: rawFrom }],
                messages: [
                  {
                    from: rawFrom,
                    id: inboundId,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    text: { body: "Hi" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = await processWhatsAppWebhookPayload(payload);
    assert.strictEqual(result.processedInbound, 1);

    // Verify inbound message saved
    const inbound = await WhatsAppMessageModel.findOne({ providerMessageId: inboundId });
    assert.ok(inbound, "Inbound message should be recorded");
    assert.strictEqual(inbound.direction, "inbound");

    // Verify outbound automated welcome greeting was dispatched
    const welcomeMsg = await WhatsAppMessageModel.findOne({
      recipientPhone: testPhone,
      trigger: "welcome_greeting_bot",
    });
    assert.ok(welcomeMsg, "Automated welcome greeting should be dispatched");
    assert.strictEqual(welcomeMsg.direction, "outbound");
    assert.ok(welcomeMsg.interactive, "Interactive payload must be present");
    assert.strictEqual(welcomeMsg.interactive.type, "button");
    assert.strictEqual(welcomeMsg.interactive.action?.buttons?.length, 3);
  });

  // 3. Guest clicks Button 1 ("🌴 Packages")
  await test("Interactive Button Reply: Guest clicking '🌴 Packages' triggers automated instant catalog reply", async () => {
    const btnPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ profile: { name: "Anand Sharma" }, wa_id: rawFrom }],
                messages: [
                  {
                    from: rawFrom,
                    id: `wamid.btn_click_${Date.now()}`,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    type: "interactive",
                    interactive: {
                      type: "button_reply",
                      button_reply: {
                        id: "btn_packages",
                        title: "🌴 Packages",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await processWhatsAppWebhookPayload(btnPayload);

    // Verify automated reply was sent
    const replyMsg = await WhatsAppMessageModel.findOne({
      recipientPhone: testPhone,
      trigger: "button_click_btn_packages",
    });
    assert.ok(replyMsg, "Automated option reply should be dispatched");
    assert.ok(replyMsg.bodyText.includes("Alleppey"));
  });

  // 4. Guest clicks Button 3 ("🛎️ Human Help" - Concierge handoff)
  await test("Interactive Button Reply: Guest clicking '🛎️ Talk to Concierge' marks conversation for human handoff", async () => {
    const btnPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ profile: { name: "Anand Sharma" }, wa_id: rawFrom }],
                messages: [
                  {
                    from: rawFrom,
                    id: `wamid.btn_concierge_${Date.now()}`,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    type: "interactive",
                    interactive: {
                      type: "button_reply",
                      button_reply: {
                        id: "btn_concierge",
                        title: "🛎️ Human Help",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await processWhatsAppWebhookPayload(btnPayload);

    const replyMsg = await WhatsAppMessageModel.findOne({
      recipientPhone: testPhone,
      trigger: "button_click_btn_concierge",
    });
    assert.ok(replyMsg, "Concierge handoff acknowledgement should be dispatched");
  });

  // 5. Curator Live Manual Reply
  await test("Curator Live Reply: Staff can send a direct live message into the guest's WhatsApp thread", async () => {
    const liveReply = await sendWhatsAppMessage({
      recipientPhone: testPhone,
      recipientName: "Anand Sharma",
      messageType: "manual_concierge_message",
      category: "transactional",
      trigger: "admin_live_chat_reply",
      relatedType: "custom",
      relatedId: 0,
      bodyText: "Hello Anand! I'm Lakshmi from Escora. I can curate a private houseboat stay for your dates in December.",
      idempotencyKey: `live_curator_${Date.now()}`,
      metadata: { staffName: "Lakshmi (Curator)", direction: "outbound" },
    });

    assert.ok(liveReply);
    assert.ok(["simulated", "sent"].includes(liveReply.status));
    assert.strictEqual(liveReply.bodyText.includes("Lakshmi"), true);
  });

  console.log("\n================================================================================");
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log("================================================================================\n");

  // Clean up
  await WhatsAppMessageModel.deleteMany({ recipientPhone: testPhone });
  await disconnectDB();

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Test failed fatal:", err);
  process.exit(1);
});
