import { Router, Request, Response } from "express";
import {
  verifyWebhookToken,
  verifyWebhookSignature,
  processWhatsAppWebhookPayload,
} from "../services/whatsapp";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook verification handshake.
 * Meta calls this when configuring or verifying the webhook callback URL.
 * Responds with hub.challenge if hub.verify_token matches configured secret.
 */
router.get("/whatsapp/webhook", (req: Request, res: Response): void => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  if (verifyWebhookToken(mode, token)) {
    logger.info("[WhatsAppWebhook] Meta webhook handshake verified successfully");
    res.status(200).send(challenge || "");
    return;
  }

  logger.warn({ mode, tokenProvided: Boolean(token) }, "[WhatsAppWebhook] Webhook verification rejected");
  res.status(403).send("Forbidden");
});

/**
 * POST /api/whatsapp/webhook
 * Receives Meta Cloud API status notifications (sent, delivered, read, failed)
 * and inbound customer messages (STOP keyword opt-outs).
 * Validates HMAC signature if configured.
 */
router.post("/whatsapp/webhook", async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const rawBody = (req as any).rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn("[WhatsAppWebhook] Webhook rejected: invalid x-hub-signature-256");
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  // Validate basic shape
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "Malformed webhook payload" });
    return;
  }

  // Meta notifications must specify object: "whatsapp_business_account"
  if (req.body.object && req.body.object !== "whatsapp_business_account") {
    logger.info({ object: req.body.object }, "[WhatsAppWebhook] Ignoring non-whatsapp_business_account webhook");
    res.status(200).json({ status: "ignored" });
    return;
  }

  // Acknowledge receipt to Meta immediately (prevents retries from timeout)
  res.status(200).json({ status: "ok" });

  // Process payload asynchronously
  try {
    const stats = await processWhatsAppWebhookPayload(req.body);
    if (stats.processedStatuses > 0 || stats.processedInbound > 0) {
      logger.info(stats, "[WhatsAppWebhook] Webhook event processed successfully");
    }
  } catch (err: any) {
    logger.error({ err: err?.message }, "[WhatsAppWebhook] Unexpected error processing webhook event");
  }
});

export default router;
