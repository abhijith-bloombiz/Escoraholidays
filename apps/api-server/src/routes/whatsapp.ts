import { Router, Request, Response, NextFunction } from "express";
import {
  listWhatsAppMessages,
  getWhatsAppMessageById,
  retryWhatsAppMessage,
  getWhatsAppSettings,
  updateWhatsAppSettings,
  getWhatsAppConsent,
  setWhatsAppConsent,
  sendWhatsAppMessage,
  WhatsAppServiceError,
} from "../services/whatsapp";
import { normalizePhoneNumber } from "../services/whatsapp/types";
import { config } from "../config/env";
import { WhatsAppMessageModel } from "@workspace/db";

const router = Router();

/**
 * GET /api/whatsapp/settings
 * Retrieves active WhatsApp automation flags, provider mode, and timing.
 * Admin only.
 */
router.get("/whatsapp/settings", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getWhatsAppSettings();
    const publicUrl = (config.publicUrl || "").replace(/\/$/, "");
    res.json({
      ...settings,
      providerMode: config.whatsappProvider,
      liveSendingEnabled: config.whatsappLiveSendingEnabled,
      hasApiToken: Boolean(config.whatsappApiToken && config.whatsappApiToken.trim().length > 10),
      hasPhoneNumberId: Boolean(config.whatsappPhoneNumberId && config.whatsappPhoneNumberId.trim().length > 5),
      hasWebhookSecret: Boolean(config.whatsappAppSecret && config.whatsappAppSecret.trim().length > 5),
      hasWebhookVerifyToken: Boolean(config.whatsappWebhookVerifyToken),
      graphApiVersion: config.whatsappGraphApiVersion,
      webhookCallbackUrl: `${publicUrl}/api/whatsapp/webhook`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/whatsapp/settings
 * Updates WhatsApp automation toggles, provider selection, and auto-delivery simulator flag.
 * Admin only.
 */
router.patch("/whatsapp/settings", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffUsername = (req as any).user?.username || (req.session as any)?.username || "Staff Admin";
    const updated = await updateWhatsAppSettings(req.body, staffUsername);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/whatsapp/messages
 * Lists WhatsApp message audit trail with delivery status and filtering.
 * Admin only.
 */
router.get("/whatsapp/messages", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const direction = req.query.direction as string | undefined;
    const messageType = req.query.messageType as string | undefined;
    const relatedType = req.query.relatedType as string | undefined;
    const relatedId = req.query.relatedId ? Number(req.query.relatedId) : undefined;
    const phone = req.query.phone as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;

    const messages = await listWhatsAppMessages({
      status,
      direction,
      messageType,
      relatedType,
      relatedId: Number.isNaN(relatedId) ? undefined : relatedId,
      phone,
      search,
      limit,
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/whatsapp/messages/:id
 * Retrieves full audit details for a specific WhatsApp message.
 * Admin only.
 */
router.get("/whatsapp/messages/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid WhatsApp message ID" });
      return;
    }

    const message = await getWhatsAppMessageById(id);
    res.json(message);
  } catch (err: any) {
    if (err instanceof WhatsAppServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * POST /api/whatsapp/messages/:id/retry
 * Retries a failed or cancelled WhatsApp message without duplicate sends.
 * Admin only.
 */
router.post("/whatsapp/messages/:id/retry", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid WhatsApp message ID" });
      return;
    }

    const retried = await retryWhatsAppMessage(id);
    res.json(retried);
  } catch (err: any) {
    if (err instanceof WhatsAppServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * GET /api/whatsapp/consent/:phone
 * Checks customer WhatsApp consent & opt-out status for a specific phone number.
 * Admin only.
 */
router.get("/whatsapp/consent/:phone", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPhone = typeof req.params.phone === "string" ? req.params.phone : String(req.params.phone || "");
    const norm = normalizePhoneNumber(rawPhone);
    if (!norm.valid) {
      res.status(400).json({ error: norm.error || "Invalid phone number format" });
      return;
    }

    const consent = await getWhatsAppConsent(norm.normalized);
    res.json({
      phone: norm.normalized,
      hasExplicitRecord: Boolean(consent),
      transactionalOptOut: consent?.transactionalOptOut ?? false,
      marketingConsent: consent?.marketingConsent ?? false,
      details: consent,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/whatsapp/consent
 * Updates or records customer WhatsApp consent / opt-out preferences.
 * Admin only.
 */
router.post("/whatsapp/consent", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, transactionalOptOut, marketingConsent, name, source, notes } = req.body;
    if (!phone) {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }

    const staffUsername = (req as any).user?.username || (req.session as any)?.username || "Staff Admin";
    const consent = await setWhatsAppConsent(phone, {
      transactionalOptOut,
      marketingConsent,
      name,
      source: source || "admin_dashboard",
      notes,
      staffUsername,
    });

    res.json({ success: true, consent });
  } catch (err: any) {
    if (err instanceof WhatsAppServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * POST /api/whatsapp/simulate
 * Interactive test send simulator for admin dashboard.
 * Dispatches test template or custom message through the mock provider.
 * Admin only.
 */
router.post("/whatsapp/simulate", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      recipientPhone,
      recipientName,
      messageType,
      category,
      bodyText,
      templateName,
      templateVariables,
      relatedType,
      relatedId,
    } = req.body;

    if (!recipientPhone || !recipientName || !bodyText) {
      res.status(400).json({ error: "recipientPhone, recipientName, and bodyText are required" });
      return;
    }

    const idempotencyKey = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const message = await sendWhatsAppMessage({
      recipientPhone,
      recipientName,
      messageType: messageType || "manual_concierge_message",
      category: category || "transactional",
      trigger: "admin_test_simulator",
      relatedType: relatedType || "custom",
      relatedId: Number(relatedId) || 0,
      bodyText,
      templateName,
      templateVariables,
      idempotencyKey,
      metadata: { simulatedBy: (req.session as any)?.username || "Admin" },
    });

    res.json({ success: true, message });
  } catch (err: any) {
    if (err instanceof WhatsAppServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * GET /api/whatsapp/conversations
 * Groups WhatsApp messages by customer phone number for the 2-way live chat dashboard.
 * Calculates active 24h service window status, unread counts, and latest interaction.
 */
router.get("/whatsapp/conversations", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const messages = await WhatsAppMessageModel.find({}).sort({ createdAt: -1 }).lean();
    const map = new Map<string, any>();

    for (const msg of messages) {
      const phone = msg.recipientPhone;
      if (!phone || phone === "invalid") continue;

      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          recipientName: msg.recipientName || "WhatsApp Guest",
          lastMessage: msg.bodyText,
          lastMessageAt: msg.createdAt,
          lastDirection: msg.direction || "outbound",
          status: msg.status,
          unreadCount: 0,
          messages: [],
          latestInboundTime: null,
          matchedEnquiryId: msg.relatedType === "enquiry" ? msg.relatedId : null,
          selectedOption: msg.metadata?.buttonTitle || null,
        });
      }

      const conv = map.get(phone);
      conv.messages.unshift(msg);

      if (msg.direction === "inbound" && !conv.latestInboundTime) {
        conv.latestInboundTime = msg.createdAt;
      }
      if (msg.metadata?.buttonTitle && !conv.selectedOption) {
        conv.selectedOption = msg.metadata.buttonTitle;
      }
    }

    const now = Date.now();
    const conversations = Array.from(map.values()).map((conv) => {
      const latestInboundMs = conv.latestInboundTime ? new Date(conv.latestInboundTime).getTime() : 0;
      const windowExpiresMs = latestInboundMs ? latestInboundMs + 24 * 60 * 60 * 1000 : 0;
      const isServiceWindowActive = latestInboundMs > 0 && now < windowExpiresMs;

      return {
        phone: conv.phone,
        recipientName: conv.recipientName,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        lastDirection: conv.lastDirection,
        status: conv.status,
        messages: conv.messages,
        isServiceWindowActive,
        serviceWindowExpiresAt: latestInboundMs ? new Date(windowExpiresMs) : null,
        matchedEnquiryId: conv.matchedEnquiryId,
        selectedOption: conv.selectedOption,
      };
    });

    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/whatsapp/conversations/:phone/reply
 * Staff sends a live manual message back to customer's WhatsApp from the dashboard.
 */
router.post("/whatsapp/conversations/:phone/reply", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPhone = Array.isArray(req.params.phone) ? req.params.phone[0] : String(req.params.phone || "");
    const { text, staffName, recipientName } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: "Message text is required" });
      return;
    }

    const norm = normalizePhoneNumber(rawPhone);
    const phone = norm.valid ? norm.normalized : rawPhone;
    const sender = staffName || (req.session as any)?.username || "Curator";

    const message = await sendWhatsAppMessage({
      recipientPhone: phone,
      recipientName: recipientName || "Guest",
      messageType: "manual_concierge_message",
      category: "transactional",
      trigger: "admin_live_chat_reply",
      relatedType: "custom",
      relatedId: 0,
      bodyText: text.trim(),
      idempotencyKey: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      metadata: { staffName: sender, direction: "outbound" },
    });

    res.json({ success: true, message });
  } catch (err: any) {
    if (err instanceof WhatsAppServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * POST /api/whatsapp/test-welcome
 * Admin triggers test welcome message to their own phone to verify banner, greeting, and buttons.
 */
router.post("/whatsapp/test-welcome", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      res.status(400).json({ error: "Phone number is required for test send" });
      return;
    }

    const settings = await getWhatsAppSettings();
    const norm = normalizePhoneNumber(phone);
    const validPhone = norm.valid ? norm.normalized : phone;
    const recipientName = name || "Admin Traveler";

    const bannerUrl =
      settings.welcomeBannerUrl ||
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80";
    const btn1 = (settings.welcomeButton1Label || "🌴 Tour Packages").slice(0, 20);
    const btn2 = (settings.welcomeButton2Label || "✍️ Plan Custom Trip").slice(0, 20);
    const btn3 = (settings.welcomeButton3Label || "🛎️ Talk to Concierge").slice(0, 20);

    const currentHour = new Date().getHours();
    const greetingTime = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";
    const baseText =
      settings.welcomeGreetingText ||
      "Good day {{first_name}}! Welcome to Escora Holidays. Simply select an option below or type your enquiry to get started.";
    const personalizedText = baseText
      .replace(/\{\{first_name\}\}/g, recipientName)
      .replace(/\{\{greeting_time\}\}/g, greetingTime);

    const message = await sendWhatsAppMessage({
      recipientPhone: validPhone,
      recipientName,
      messageType: "enquiry_acknowledgement",
      category: "transactional",
      trigger: "admin_test_welcome_greeting",
      relatedType: "custom",
      relatedId: 0,
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
      idempotencyKey: `test_welcome_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      metadata: {
        isTest: true,
        bannerUrl,
        buttons: [btn1, btn2, btn3],
      },
    });

    res.json({ success: true, message });
  } catch (err: any) {
    if (err instanceof WhatsAppServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

export default router;

