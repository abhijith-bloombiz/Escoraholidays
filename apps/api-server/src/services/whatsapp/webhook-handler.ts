import crypto from "node:crypto";
import {
  WhatsAppMessageModel,
  EnquiryModel,
  getNextSequence,
  type WhatsAppDeliveryStatus,
} from "@workspace/db";
import { config } from "../../config/env";
import { logger } from "../../lib/logger";
import { setWhatsAppConsent, sendWhatsAppMessage, getWhatsAppSettings } from "./whatsapp-service";
import { normalizePhoneNumber } from "./types";

/**
 * Verifies Meta's Webhook Subscription challenge (GET /api/whatsapp/webhook).
 * Meta sends:
 * - hub.mode: must equal "subscribe"
 * - hub.verify_token: must match WHATSAPP_WEBHOOK_VERIFY_TOKEN
 * - hub.challenge: numeric challenge to echo back
 */
export function verifyWebhookToken(mode?: string, token?: string, expectedToken?: string): boolean {
  if (mode !== "subscribe" || !token) {
    return false;
  }

  const configuredToken = expectedToken || config.whatsappWebhookVerifyToken;
  if (!configuredToken) {
    logger.warn("[WhatsAppWebhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured; rejecting verification request");
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(configuredToken);
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Validates Meta's HMAC-SHA256 signature (x-hub-signature-256 header) on webhook payloads.
 * Format: "sha256=<hex_digest>"
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
  const appSecret = config.whatsappAppSecret;

  // If app secret is not configured:
  if (!appSecret) {
    if (config.isProduction) {
      logger.error("[WhatsAppWebhook] Missing WHATSAPP_APP_SECRET in production; rejecting unsigned webhook.");
      return false;
    }
    // In local development, permit if header is missing, but warn
    if (!signatureHeader) {
      logger.warn("[WhatsAppWebhook] Dev notice: WHATSAPP_APP_SECRET unset; accepting webhook without signature.");
      return true;
    }
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    logger.warn({ signatureHeader }, "[WhatsAppWebhook] Missing or malformed x-hub-signature-256 header");
    return false;
  }

  const providedHash = signatureHeader.slice(7);
  const expectedHash = crypto
    .createHmac("sha256", appSecret || "")
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(providedHash, "hex");
    const b = Buffer.from(expectedHash, "hex");
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Hierarchy for monotonic status progression:
// failed is recorded with error; read > delivered > sent > simulated > pending
const STATUS_PRIORITY: Record<string, number> = {
  pending: 1,
  simulated: 2,
  sent: 3,
  delivered: 4,
  read: 5,
  failed: 6,
};

export interface ProcessWebhookResult {
  processedStatuses: number;
  processedInbound: number;
  errors: string[];
}

/**
 * Processes incoming Meta WhatsApp Cloud API webhook events:
 * 1. Delivery & Read Receipts (updating WhatsAppMessage records by providerMessageId).
 * 2. Inbound Keyword Opt-outs (e.g. STOP, UNSUBSCRIBE) to enforce DPDP / anti-spam safeguards.
 * 3. Safe, idempotent handling of duplicate deliveries from Meta.
 */
export async function processWhatsAppWebhookPayload(payload: any): Promise<ProcessWebhookResult> {
  const result: ProcessWebhookResult = {
    processedStatuses: 0,
    processedInbound: 0,
    errors: [],
  };

  if (!payload || !Array.isArray(payload.entry)) {
    return result;
  }

  for (const entry of payload.entry) {
    if (!Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      const value = change.value;
      if (!value) continue;

      // =========================================================================
      // 1. Process Status Events (sent, delivered, read, failed)
      // =========================================================================
      if (Array.isArray(value.statuses)) {
        for (const statusObj of value.statuses) {
          const providerMessageId = statusObj.id;
          const newStatusRaw = statusObj.status as string; // 'sent' | 'delivered' | 'read' | 'failed'
          const timestampSeconds = Number(statusObj.timestamp) || Math.floor(Date.now() / 1000);
          const eventTime = new Date(timestampSeconds * 1000);

          if (!providerMessageId) continue;

          try {
            const existing = await WhatsAppMessageModel.findOne({ providerMessageId }).lean();
            if (!existing) {
              logger.info(
                { providerMessageId, status: newStatusRaw },
                "[WhatsAppWebhook] Received status for untracked or external message ID"
              );
              continue;
            }

            const currentPriority = STATUS_PRIORITY[existing.status] || 0;
            const newPriority = STATUS_PRIORITY[newStatusRaw] || 0;

            const currentResponse =
              existing.providerResponse && typeof existing.providerResponse === "object"
                ? existing.providerResponse
                : {};

            const updateFields: Record<string, any> = {
              providerStatus: newStatusRaw,
              updatedAt: new Date(),
              providerResponse: { ...currentResponse, latestWebhook: statusObj },
            };

            if (newStatusRaw === "delivered") {
              // Only update status if current state is not already "read"
              if (currentPriority < STATUS_PRIORITY.read) {
                updateFields.status = "delivered";
              }
              if (!existing.deliveredAt || eventTime < existing.deliveredAt) {
                updateFields.deliveredAt = eventTime;
              }
            } else if (newStatusRaw === "read") {
              updateFields.status = "read";
              updateFields.readAt = eventTime;
              if (!existing.deliveredAt) {
                updateFields.deliveredAt = eventTime;
              }
            } else if (newStatusRaw === "sent") {
              if (currentPriority < STATUS_PRIORITY.sent) {
                updateFields.status = "sent";
                updateFields.sentAt = eventTime;
              }
            } else if (newStatusRaw === "failed") {
              if (currentPriority < STATUS_PRIORITY.delivered) {
                updateFields.status = "failed";
              }
              const errorItem = statusObj.errors?.[0];
              const details = errorItem?.error_data?.details ? `: ${errorItem.error_data.details}` : "";
              const errorMsg = errorItem
                ? `[Meta Error ${errorItem.code}] ${errorItem.title || errorItem.message || "Message delivery failed"}${details}`
                : "Meta reported delivery failure";
              updateFields.error = errorMsg;
            }

            await WhatsAppMessageModel.updateOne({ id: existing.id }, { $set: updateFields });
            result.processedStatuses++;

            logger.info(
              {
                messageId: existing.id,
                providerMessageId,
                oldStatus: existing.status,
                newStatus: updateFields.status || existing.status,
              },
              `[WhatsAppWebhook] Updated message #${existing.id} status to ${updateFields.status || existing.status}`
            );
          } catch (err: any) {
            logger.error({ err: err?.message, providerMessageId }, "[WhatsAppWebhook] Error updating message status");
            result.errors.push(err?.message || "Failed to update status");
          }
        }
      }

      // =========================================================================
      // 2. Process Inbound Messages (Opt-Out, Help, General Inbound Inquiries)
      // =========================================================================
      if (Array.isArray(value.messages)) {
        for (const msgObj of value.messages) {
          const fromWaId = msgObj.from;
          const buttonId = msgObj.interactive?.button_reply?.id || msgObj.button?.payload || null;
          const bodyText =
            msgObj.text?.body?.trim() ||
            msgObj.interactive?.button_reply?.title?.trim() ||
            msgObj.interactive?.list_reply?.title?.trim() ||
            msgObj.button?.text?.trim() ||
            "";
          const timestampSeconds = Number(msgObj.timestamp) || Math.floor(Date.now() / 1000);
          const eventTime = new Date(timestampSeconds * 1000);

          if (!fromWaId || !bodyText) continue;

          const norm = normalizePhoneNumber(fromWaId);
          const normalizedPhone = norm.valid ? norm.normalized : `+${fromWaId}`;
          const contactName = Array.isArray(value.contacts)
            ? value.contacts.find((c: any) => c.wa_id === fromWaId)?.profile?.name || "WhatsApp Guest"
            : "WhatsApp Guest";

          // 1. Deduplication: prevent processing duplicate Meta webhook deliveries
          if (msgObj.id) {
            const alreadyProcessed = await WhatsAppMessageModel.findOne({ providerMessageId: msgObj.id }).lean();
            if (alreadyProcessed) {
              logger.info(
                { providerMessageId: msgObj.id },
                "[WhatsAppWebhook] Inbound message already processed (duplicate delivery); skipping"
              );
              continue;
            }
          }

          const cleanKeyword = bodyText.toLowerCase().replace(/[^a-z]/g, "");
          const isStop = ["stop", "unsubscribe", "cancel", "optout", "halt"].includes(cleanKeyword);
          const isHelp = ["help", "support", "info", "assist"].includes(cleanKeyword);
          const isStart = ["start", "unstop", "optin", "subscribe"].includes(cleanKeyword);

          let messageType:
            | "inbound_opt_out"
            | "inbound_help_request"
            | "inbound_customer_message"
            | "manual_concierge_message" = "inbound_customer_message";
          let trigger = "customer_inbound_message";

          // Inbound Opt-Out Keywords (STOP)
          if (isStop) {
            messageType = "inbound_opt_out";
            trigger = "customer_opt_out";
            try {
              await setWhatsAppConsent(normalizedPhone, {
                transactionalOptOut: true,
                source: "webhook_stop_keyword",
                notes: `Customer opted out via inbound message: "${bodyText}"`,
              });
              logger.info(
                { phone: normalizedPhone, keyword: cleanKeyword },
                "[WhatsAppWebhook] Processed STOP keyword: customer opted out of WhatsApp"
              );
            } catch (err: any) {
              logger.error({ err: err?.message, phone: normalizedPhone }, "[WhatsAppWebhook] Failed to record STOP opt-out");
            }
          } else if (isHelp) {
            // Inbound Help Keywords (HELP)
            messageType = "inbound_help_request";
            trigger = "customer_help_request";
            try {
              await setWhatsAppConsent(normalizedPhone, {
                source: "webhook_help_keyword",
                notes: `Customer requested assistance/HELP on ${new Date().toISOString()}: "${bodyText}"`,
              });
              logger.info(
                { phone: normalizedPhone, keyword: cleanKeyword },
                "[WhatsAppWebhook] Processed HELP keyword: logged assistance request"
              );
            } catch (err: any) {
              logger.error({ err: err?.message, phone: normalizedPhone }, "[WhatsAppWebhook] Failed to update HELP consent notes");
            }
          } else if (isStart) {
            // Inbound Opt-In Keywords (START)
            messageType = "manual_concierge_message";
            trigger = "customer_opt_in";
            try {
              await setWhatsAppConsent(normalizedPhone, {
                transactionalOptOut: false,
                source: "webhook_start_keyword",
                notes: `Customer re-subscribed via inbound message: "${bodyText}"`,
              });
              logger.info(
                { phone: normalizedPhone, keyword: cleanKeyword },
                "[WhatsAppWebhook] Processed START keyword: customer un-stopped WhatsApp"
              );
            } catch (err: any) {
              logger.error({ err: err?.message, phone: normalizedPhone }, "[WhatsAppWebhook] Failed to record START opt-in");
            }
          }

          // 2. Route to Existing Admin Workflow (Enquiries)
          let matchedEnquiryId = 0;
          try {
            const existingEnquiry = await EnquiryModel.findOne({ phone: normalizedPhone }).sort({ createdAt: -1 });
            if (existingEnquiry) {
              matchedEnquiryId = existingEnquiry.id;
              await EnquiryModel.updateOne(
                { id: existingEnquiry.id },
                {
                  $set: {
                    status: "new",
                    updatedAt: new Date(),
                  },
                }
              );
              logger.info(
                { enquiryId: existingEnquiry.id, phone: normalizedPhone },
                "[WhatsAppWebhook] Routed inbound message to existing Enquiry"
              );
            } else if (!isStop) {
              const nextEnqId = await getNextSequence("enquiries");
              matchedEnquiryId = nextEnqId;
              await EnquiryModel.create({
                id: nextEnqId,
                name: contactName,
                email: `${fromWaId}@whatsapp.guest`,
                phone: normalizedPhone,
                message: isHelp ? `[WhatsApp HELP Request] ${bodyText}` : `[WhatsApp Inbound] ${bodyText}`,
                status: "new",
              });
              logger.info(
                { enquiryId: nextEnqId, phone: normalizedPhone },
                "[WhatsAppWebhook] Created new Enquiry for inbound WhatsApp message"
              );
            }
          } catch (err: any) {
            logger.warn({ err: err?.message, phone: normalizedPhone }, "[WhatsAppWebhook] Could not route to EnquiryModel");
          }

          // 3. Record Inbound Message in WhatsApp Message Audit Trail
          try {
            const nextMsgId = await getNextSequence("whatsapp_messages");
            await WhatsAppMessageModel.create({
              id: nextMsgId,
              direction: "inbound",
              recipientPhone: normalizedPhone,
              recipientName: contactName,
              messageType,
              category: "transactional",
              trigger,
              relatedType: "enquiry",
              relatedId: matchedEnquiryId,
              bodyText,
              provider: "cloud_api",
              providerMessageId: msgObj.id || `inbound_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              providerStatus: "delivered",
              status: "delivered",
              deliveredAt: eventTime,
              idempotencyKey: `inbound_${msgObj.id || Date.now()}`,
              metadata: {
                fromWaId,
                wamid: msgObj.id,
                timestamp: msgObj.timestamp,
                rawType: msgObj.type,
                keyword: cleanKeyword || null,
              },
            });
            result.processedInbound++;

            // 4. Automated Welcome Greeting or Interactive Button Response
            if (!isStop) {
              try {
                const settings = await getWhatsAppSettings();
                const isGreeting =
                  ["hi", "hello", "hey", "namaste", "enquire", "welcome", "hola"].includes(cleanKeyword) ||
                  cleanKeyword.startsWith("hi") ||
                  cleanKeyword.startsWith("hello") ||
                  cleanKeyword.startsWith("hey");

                if (buttonId) {
                  // Customer clicked one of our interactive buttons
                  let responseText = "";
                  if (buttonId.includes("package") || buttonId === "btn_packages") {
                    responseText =
                      settings.welcomeButton1Reply ||
                      "🌴 *Escora Signature Collections*\n\n1. *Munnar Mist Sanctuary (4D/3N)* — Slow-living amidst ancient tea estates.\n2. *Vembanad Houseboat Serenity (3D/2N)* — Private luxury backwater cruise.\n3. *Wayanad Rainforest Retreat (4D/3N)* — Ayurveda & wellness sanctuary.\n\nReply with a package name or your travel dates to get full pricing details!";
                  } else if (buttonId.includes("custom") || buttonId === "btn_custom_trip") {
                    responseText =
                      settings.welcomeButton2Reply ||
                      "✍️ *Plan a Custom Itinerary*\n\nPlease let us know:\n• Your expected travel dates\n• Number of travelers (adults & children)\n• Preferred style (Romantic Honeymoon, Family Sanctuary, or Wellness)\n\nOur private travel designer will curate a slow-luxury itinerary for you.";
                  } else if (buttonId.includes("concierge") || buttonId === "btn_concierge") {
                    responseText =
                      settings.welcomeButton3Reply ||
                      "🛎️ *Escora Concierge Assigned*\n\nNamaste! Our senior travel designer has been notified and will assist you right here in this chat shortly.\n\nDirect Concierge Line: +91 94000 00000.";
                  }

                  if (responseText) {
                    await sendWhatsAppMessage({
                      recipientPhone: normalizedPhone,
                      recipientName: contactName,
                      messageType: "manual_concierge_message",
                      category: "transactional",
                      trigger: `button_click_${buttonId}`,
                      relatedType: "enquiry",
                      relatedId: matchedEnquiryId,
                      bodyText: responseText,
                      idempotencyKey: `auto_btn_${buttonId}_${msgObj.id || Date.now()}`,
                      metadata: { buttonId, buttonTitle: bodyText },
                    });
                  }
                } else if (settings.welcomeGreetingEnabled !== false) {
                  // Check if we recently sent an automated greeting within the last 24h
                  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  const recentGreeting = await WhatsAppMessageModel.findOne({
                    recipientPhone: normalizedPhone,
                    trigger: "welcome_greeting_bot",
                    createdAt: { $gte: oneDayAgo },
                  }).lean();

                  if (!recentGreeting || isGreeting) {
                    const currentHour = new Date().getHours();
                    const greetingTime =
                      currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";
                    const baseText =
                      settings.welcomeGreetingText ||
                      "Good day {{first_name}}! Welcome to Escora Holidays. Simply select an option below or type your enquiry to get started.";
                    const personalizedText = baseText
                      .replace(/\{\{first_name\}\}/g, contactName !== "WhatsApp Guest" ? contactName : "there")
                      .replace(/\{\{greeting_time\}\}/g, greetingTime);

                    const bannerUrl =
                      settings.welcomeBannerUrl ||
                      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80";
                    const btn1 = (settings.welcomeButton1Label || "🌴 Tour Packages").slice(0, 20);
                    const btn2 = (settings.welcomeButton2Label || "✍️ Plan Custom Trip").slice(0, 20);
                    const btn3 = (settings.welcomeButton3Label || "🛎️ Talk to Concierge").slice(0, 20);

                    await sendWhatsAppMessage({
                      recipientPhone: normalizedPhone,
                      recipientName: contactName,
                      messageType: "enquiry_acknowledgement",
                      category: "transactional",
                      trigger: "welcome_greeting_bot",
                      relatedType: "enquiry",
                      relatedId: matchedEnquiryId,
                      bodyText: `${personalizedText}\n\n[Options: 1. ${btn1} | 2. ${btn2} | 3. ${btn3}]`,
                      interactive: {
                        type: "button",
                        header: {
                          type: "image",
                          imageUrl: bannerUrl,
                        },
                        body: {
                          text: personalizedText,
                        },
                        footer: {
                          text: "Escora Holidays · Bespoke Luxury",
                        },
                        action: {
                          buttons: [
                            { type: "reply", reply: { id: "btn_packages", title: btn1 } },
                            { type: "reply", reply: { id: "btn_custom_trip", title: btn2 } },
                            { type: "reply", reply: { id: "btn_concierge", title: btn3 } },
                          ],
                        },
                      },
                      idempotencyKey: `welcome_${msgObj.id || Date.now()}`,
                      metadata: {
                        bannerUrl,
                        buttons: [btn1, btn2, btn3],
                      },
                    });
                  }
                }
              } catch (botErr: any) {
                logger.warn({ err: botErr?.message, phone: normalizedPhone }, "[WhatsAppWebhook] Automated greeting bot error");
              }
            }
          } catch (err: any) {
            logger.error({ err: err?.message, fromWaId }, "[WhatsAppWebhook] Error creating inbound audit message");
            result.errors.push(err?.message || "Failed to record inbound message");
          }
        }
      }
    }
  }

  return result;
}
