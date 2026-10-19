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

export default router;
