import crypto from "node:crypto";
import { Router, Request, Response, NextFunction } from "express";
import {
  CampaignModel,
  SubscriberConsentModel,
  NotificationModel,
  AudienceGroupModel,
  getNextSequence,
} from "@workspace/db";
import { config } from "../config/env";
import { logger } from "../lib/logger";
import { getAutomationSettings } from "../services/notification-service";
import {
  CreateCampaignBody,
  UpdateCampaignBody,
  ScheduleCampaignBody,
  SendCampaignBody,
  UnsubscribeGuestBody,
  z,
} from "@workspace/api-zod";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  resolveAudience,
  previewCampaignAudience,
  duplicateCampaign,
  scheduleCampaign,
  cancelCampaign,
  sendCampaign,
  handleUnsubscribe,
  listSubscribers,
  adminUnsubscribeSubscriber,
  recordExplicitConsent,
  suppressEmailAddress,
  unsuppressEmailAddress,
  inspectContactRelationships,
  deleteContactRecordSafely,
  auditAndFixConsentInconsistencies,
  listAudienceGroups,
  createAudienceGroup,
  getAudienceGroup,
  updateAudienceGroup,
  deleteAudienceGroup,
  addAudienceGroupMember,
  removeAudienceGroupMember,
  previewAudienceGroup,
  validateCampaignPreSend,
  renderTemplate,
  subscribeToNewsletter,
  CampaignError,
} from "../services/campaign-service";
import { renderCampaignForRecipient } from "../services/merge-tag-resolver";
import {
  sendEmailWithStatus,
  getEffectiveEmailProvider,
  getAuthenticatedSender,
  verifyEmailTransport,
} from "../lib/email";

const router = Router();

function normalizeCampaignDeliveryMode(c: any) {
  if (!c) return c;
  if (
    !c.deliveryMode &&
    c.deliveries?.some(
      (d: any) => d.deliveryStatus === "simulated" || (typeof d.messageId === "string" && d.messageId.startsWith("mock_"))
    )
  ) {
    c.deliveryMode = "simulated";
  }
  return c;
}

/**
 * GET /api/campaigns/stats
 * Dashboard summary metrics computed from real database records. Admin only.
 */
router.get(
  "/campaigns/stats",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [campaignStats, notificationStats, audienceGroupCount, activeSubscribers, settings] = await Promise.all([
        CampaignModel.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalDelivered: { $sum: { $ifNull: ["$stats.sentCount", { $ifNull: ["$deliveredCount", 0] }] } },
              totalSent: { $sum: { $ifNull: ["$stats.sentCount", { $ifNull: ["$sentCount", 0] }] } },
              totalFailed: { $sum: { $ifNull: ["$stats.failedCount", { $ifNull: ["$failedCount", 0] }] } },
            },
          },
        ]),
        NotificationModel.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        AudienceGroupModel.countDocuments(),
        SubscriberConsentModel.countDocuments({
          $or: [
            { status: "subscribed", subscribed: true, suppressed: { $ne: true } },
            { subscribed: true, suppressed: { $ne: true }, unsubscribedAt: null },
          ],
        }),
        getAutomationSettings(),
      ]);

      const cMap: Record<string, number> = {};
      let campaignEmailsSent = 0;
      let campaignEmailsFailed = 0;
      for (const row of campaignStats) {
        cMap[row._id] = row.count;
        campaignEmailsSent += row.totalSent || 0;
        campaignEmailsFailed += row.totalFailed || 0;
      }

      const nMap: Record<string, number> = {};
      for (const row of notificationStats) {
        nMap[row._id] = row.count;
      }

      const notifSent = (nMap["sent"] || 0) + (nMap["accepted"] || 0) + (nMap["delivered"] || 0) + (nMap["simulated"] || 0);
      const notifFailed = (nMap["failed"] || 0) + (nMap["bounced"] || 0);

      let activeAutomations = 0;
      const autoKeys = [
        "enableBookingConfirmation",
        "enableEnquiryAcknowledgement",
        "enableStaffNotifications",
        "enableItineraryUpdates",
        "enableEnquiryFollowups",
        "enablePostTripFeedback",
        "enablePaymentReceipts",
        "enablePaymentReminders",
        "enablePreTripReminders",
        "enableDocumentDelivery",
      ];
      for (const k of autoKeys) {
        if ((settings as any)[k] !== false) {
          activeAutomations++;
        }
      }

      res.json({
        campaignsSent: (cMap["sent"] || 0) + (cMap["completed"] || 0) + (cMap["sending"] || 0),
        scheduledCampaigns: cMap["scheduled"] || 0,
        pendingApprovals: cMap["pending_approval"] || 0,
        draftCampaigns: cMap["draft"] || 0,
        rejectedCampaigns: cMap["rejected"] || 0,
        emailsSentOrDelivered: campaignEmailsSent + notifSent,
        failedEmails: campaignEmailsFailed + notifFailed,
        activeAutomations,
        totalAudienceGroups: audienceGroupCount,
        activeSubscribers,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/campaigns
 * Lists all marketing campaigns. Admin only.
 */
router.get("/campaigns", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const query: any = {};
    if (status) {
      query.status = status;
    }
    const campaigns = await CampaignModel.find(query).sort({ createdAt: -1 }).lean();
    res.json(campaigns.map(normalizeCampaignDeliveryMode));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/campaigns
 * Creates a new campaign draft. Admin only.
 */
router.post("/campaigns", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = CreateCampaignBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const campaign = await createCampaign(parsed.data);
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

const AdminUnsubscribeBody = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().optional(),
  source: z.string().optional(),
});

const RecordExplicitConsentBody = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  consentMethod: z.string().min(1, "Consent method is required"),
  source: z.string().min(1, "Genuine consent source is required"),
  consentDate: z.string().optional(),
  doubleOptInConfirmed: z.boolean().optional(),
  notes: z.string().optional(),
});

const SuppressEmailBody = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().min(1, "Suppression reason is required"),
});

const UnsuppressEmailBody = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().optional(),
});

const DeleteContactBody = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * GET /api/campaigns/subscribers
 * Lists subscriber consent status with search, subscribed, and suppression filters. Admin only.
 */
router.get(
  "/campaigns/subscribers",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statusParam = req.query.status as string | undefined;
      const subscribedParam = req.query.subscribed as string | undefined;
      const suppressedParam = req.query.suppressed as string | undefined;
      const searchParam = req.query.search as string | undefined;

      const filter: any = {};
      if (statusParam) filter.status = statusParam;
      if (subscribedParam === "true") filter.subscribed = true;
      if (subscribedParam === "false") filter.subscribed = false;
      if (suppressedParam === "true") filter.suppressed = true;
      if (suppressedParam === "false") filter.suppressed = false;
      if (searchParam) filter.search = searchParam;

      const subscribers = await listSubscribers(filter);
      res.json(subscribers);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/subscribers/unsubscribe
 * Admin manual opt-out of an email address with audit trail. Admin only.
 */
router.post(
  "/campaigns/subscribers/unsubscribe",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AdminUnsubscribeBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
        return;
      }

      const adminUsername = (req.session as any)?.user?.username || "Admin Staff";
      const updated = await adminUnsubscribeSubscriber(
        parsed.data.email,
        adminUsername,
        parsed.data.reason,
        parsed.data.source
      );
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/subscribers/consent
 * Records genuine, explicit customer subscription consent. Admin only.
 */
router.post(
  "/campaigns/subscribers/consent",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = RecordExplicitConsentBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
        return;
      }

      const adminUsername = (req.session as any)?.user?.username || "Admin Staff";
      const updated = await recordExplicitConsent(parsed.data.email, adminUsername, parsed.data);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/subscribers/suppress
 * Suppresses an email address from all marketing communications. Admin only.
 */
router.post(
  "/campaigns/subscribers/suppress",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = SuppressEmailBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
        return;
      }

      const adminUsername = (req.session as any)?.user?.username || "Admin Staff";
      const updated = await suppressEmailAddress(parsed.data.email, adminUsername, parsed.data.reason);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/subscribers/unsuppress
 * Lifts marketing suppression from an email address. Admin only.
 */
router.post(
  "/campaigns/subscribers/unsuppress",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = UnsuppressEmailBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
        return;
      }

      const adminUsername = (req.session as any)?.user?.username || "Admin Staff";
      const updated = await unsuppressEmailAddress(parsed.data.email, adminUsername, parsed.data.reason);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/campaigns/subscribers/check-delete
 * Inspects all relationships for a contact to determine if removal is safe. Admin only.
 */
router.get(
  "/campaigns/subscribers/check-delete",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.query.email as string;
      if (!email?.trim()) {
        res.status(400).json({ error: "Email query parameter is required" });
        return;
      }

      const inspection = await inspectContactRelationships(email);
      res.json(inspection);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * DELETE /api/campaigns/subscribers
 * Safely removes a contact record without deleting financial records. Admin only.
 */
router.delete(
  "/campaigns/subscribers",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = DeleteContactBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
        return;
      }

      const adminUsername = (req.session as any)?.user?.username || "Admin Staff";
      const result = await deleteContactRecordSafely(parsed.data.email, adminUsername);
      res.json(result);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/subscribers/audit-fix
 * Reconciles confirmed inconsistent consent records (such as test opt-out fixtures). Admin only.
 */
router.post(
  "/campaigns/subscribers/audit-fix",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUsername = (req.session as any)?.user?.username || "Admin Staff";
      const result = await auditAndFixConsentInconsistencies(adminUsername);
      res.json(result);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/campaigns/unsubscribe
 * Public one-click unsubscribe endpoint via GET link.
 */
router.get(
  "/campaigns/unsubscribe",
  async (req: Request, res: Response): Promise<void> => {
    const token = req.query.token as string;
    const email = req.query.email as string;

    try {
      const result = await handleUnsubscribe(token, email);
      if (req.accepts("html")) {
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Unsubscribed — Escora Holidays</title>
              <style>
                body { font-family: Georgia, serif; background: #0f1a12; color: #f5f2eb; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { max-width: 500px; padding: 40px; background: #16241a; border: 1px solid #2a3d2e; border-radius: 8px; text-align: center; }
                h1 { color: #cbab6e; font-weight: 300; font-size: 26px; margin: 0 0 16px 0; }
                p { color: #b8af9e; line-height: 1.6; font-size: 15px; margin: 0; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>Escora Kerala</h1>
                <p>${result.message}</p>
              </div>
            </body>
          </html>
        `);
      } else {
        res.json(result);
      }
    } catch (err: any) {
      res.status(err instanceof CampaignError ? err.statusCode : 400).json({
        error: err.message || "Failed to process unsubscribe request",
      });
    }
  }
);

/**
 * POST /api/campaigns/unsubscribe
 * Public unsubscribe endpoint via POST.
 */
router.post(
  "/campaigns/unsubscribe",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = UnsubscribeGuestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    try {
      const result = await handleUnsubscribe(parsed.data.token, parsed.data.email);
      res.json(result);
    } catch (err: any) {
      res.status(err instanceof CampaignError ? err.statusCode : 400).json({
        error: err.message || "Failed to process unsubscribe request",
      });
    }
  }
);

/**
 * Validates Svix webhook signature for Resend events.
 */
export function verifyResendWebhookSignature(
  payload: string,
  headers: { id?: string; timestamp?: string; signature?: string },
  secret?: string
): boolean {
  if (!secret) return false;
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;

  // Protect against replay attacks (5-minute tolerance)
  const tsNum = Number(timestamp);
  if (Number.isNaN(tsNum)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 300) return false;

  try {
    const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyBytes = Buffer.from(secretKey, "base64");

    const toSign = `${id}.${timestamp}.${payload}`;
    const computedHmac = crypto.createHmac("sha256", keyBytes).update(toSign).digest("base64");

    const passedSignatures = signature.split(" ").map((s) => s.replace(/^v1,/, ""));
    for (const sig of passedSignatures) {
      const sigBuf = Buffer.from(sig, "base64");
      const compBuf = Buffer.from(computedHmac, "base64");
      if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * POST /api/campaigns/webhooks/resend
 * Public authenticated webhook endpoint for Resend delivery, bounce, and spam complaint tracking.
 */
router.post(
  "/campaigns/webhooks/resend",
  async (req: Request, res: Response): Promise<void> => {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const svixId = req.headers["svix-id"] as string | undefined;
    const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
    const svixSignature = req.headers["svix-signature"] as string | undefined;

    if (config.resendWebhookSecret) {
      const isValid = verifyResendWebhookSignature(
        rawBody,
        { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
        config.resendWebhookSecret
      );
      if (!isValid) {
        logger.warn({ svixId }, "[CampaignWebhook] Invalid Resend webhook signature");
        res.status(401).json({ error: "Invalid webhook signature" });
        return;
      }
    } else if (config.isProduction) {
      logger.error("[CampaignWebhook] Missing RESEND_WEBHOOK_SECRET in production; rejecting webhook.");
      res.status(401).json({ error: "Webhook secret not configured in production" });
      return;
    }

    const event = req.body;
    const eventType = event?.type as string | undefined;
    const emailId = event?.data?.email_id || event?.data?.id;

    if (!eventType || !emailId) {
      res.status(400).json({ error: "Invalid webhook payload structure" });
      return;
    }

    logger.info({ eventType, emailId }, "[CampaignWebhook] Processing Resend webhook event");

    try {
      const campaign = await CampaignModel.findOne({ "deliveries.messageId": emailId });
      if (campaign) {
        const delivery = campaign.deliveries.find((d) => d.messageId === emailId);
        if (delivery) {
          if (eventType === "email.delivered") {
            delivery.status = "delivered";
            delivery.deliveryStatus = "delivered";
            delivery.deliveredAt = new Date();
          } else if (eventType === "email.bounced") {
            delivery.status = "bounced";
            delivery.deliveryStatus = "bounced";
            delivery.error = event?.data?.bounce?.message || "Email address bounced";
          } else if (eventType === "email.complained") {
            delivery.status = "complained";
            delivery.deliveryStatus = "complained";
            delivery.error = "Recipient reported spam complaint";
          }
          await campaign.save();
        }
      }

      // Also verify and update transactional NotificationModel if messageId matches
      const notif = await NotificationModel.findOne({ messageId: emailId });
      if (notif) {
        if (eventType === "email.delivered") {
          notif.status = "delivered";
          notif.deliveredAt = new Date();
          notif.metadata = {
            ...(notif.metadata || {}),
            deliveryConfirmedAt: new Date(),
            webhookEvent: eventType,
          };
          logger.info({ emailId, notificationId: notif.id }, "[CampaignWebhook] Notification marked as confirmed delivered via webhook");
        } else if (eventType === "email.bounced") {
          notif.status = "bounced";
          notif.bouncedAt = new Date();
          notif.error = event?.data?.bounce?.message || "Email address bounced";
          notif.metadata = {
            ...(notif.metadata || {}),
            bounceDetails: event?.data?.bounce || null,
            webhookEvent: eventType,
          };
          logger.warn({ emailId, notificationId: notif.id }, "[CampaignWebhook] Notification marked as bounced via webhook");
        } else if (eventType === "email.complained") {
          notif.status = "bounced";
          notif.bouncedAt = new Date();
          notif.error = "Recipient reported spam complaint";
          notif.metadata = {
            ...(notif.metadata || {}),
            complaintDetails: event?.data || null,
            webhookEvent: eventType,
          };
        }
        await notif.save();
      }

      // If bounced or complained, permanently record opt-out in SubscriberConsentModel
      if (eventType === "email.bounced" || eventType === "email.complained") {
        const recipients: string[] = Array.isArray(event?.data?.to)
          ? event.data.to
          : typeof event?.data?.to === "string"
            ? [event.data.to]
            : [];

        for (const rEmail of recipients) {
          if (rEmail && rEmail.includes("@")) {
            await SubscriberConsentModel.findOneAndUpdate(
              { email: rEmail.toLowerCase() },
              {
                $set: {
                  subscribed: false,
                  unsubscribedAt: new Date(),
                  source: eventType === "email.bounced" ? "resend_bounce" : "resend_complaint",
                },
              }
            );
            logger.warn(
              { email: rEmail, reason: eventType },
              "[CampaignWebhook] Recipient permanently unsubscribed due to delivery event"
            );
          }
        }
      }

      res.status(200).json({ received: true, event: eventType, emailId });
    } catch (err: any) {
      logger.error({ err: err?.message, emailId }, "[CampaignWebhook] Failed to process webhook event");
      res.status(500).json({ error: "Failed to process delivery event" });
    }
  }
);

/**
 * GET /api/campaigns/audiences
 * Lists all manual and dynamic audience groups.
 */
router.get(
  "/campaigns/audiences",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groups = await listAudienceGroups();
      res.json(groups);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/audiences
 * Creates a new manual or dynamic audience group.
 */
router.post(
  "/campaigns/audiences",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await createAudienceGroup(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/campaigns/audiences/:id
 * Fetches audience group by ID.
 */
router.get(
  "/campaigns/audiences/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid audience group ID" });
        return;
      }
      const group = await getAudienceGroup(id);
      res.json(group);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * PUT /api/campaigns/audiences/:id
 * Updates an audience group.
 */
router.put(
  "/campaigns/audiences/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid audience group ID" });
        return;
      }
      const updated = await updateAudienceGroup(id, req.body);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * DELETE /api/campaigns/audiences/:id
 * Deletes or archives an audience group.
 */
router.delete(
  "/campaigns/audiences/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid audience group ID" });
        return;
      }
      await deleteAudienceGroup(id);
      res.status(204).end();
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/audiences/:id/members
 * Adds a member to a manual audience group.
 */
router.post(
  "/campaigns/audiences/:id/members",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid audience group ID" });
        return;
      }
      const member = {
        email: req.body?.email,
        name: req.body?.name,
      };
      if (!member.email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      const updated = await addAudienceGroupMember(id, member);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * DELETE /api/campaigns/audiences/:id/members/:email
 * Removes a member from a manual audience group.
 */
router.delete(
  "/campaigns/audiences/:id/members/:email",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid audience group ID" });
        return;
      }
      const email = typeof req.params.email === "string" ? req.params.email : req.params.email[0];
      const updated = await removeAudienceGroupMember(id, email);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/campaigns/audiences/:id/preview
 * Calculates eligible recipients for an audience group with opt-out checks.
 */
router.get(
  "/campaigns/audiences/:id/preview",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid audience group ID" });
        return;
      }
      const preview = await previewAudienceGroup(id);
      res.json(preview);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/campaigns/email-config
 * Returns active email provider and authenticated sender information (no secrets). Admin only.
 */
router.get(
  "/campaigns/email-config",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = getEffectiveEmailProvider();
      const sender = getAuthenticatedSender();
      res.json({
        provider,
        senderEmail: sender.email,
        senderName: sender.name,
        fullFrom: sender.fullFrom,
        isConfigured: sender.isConfigured,
        authMechanism:
          provider === "gmail"
            ? "Gmail SMTP (Google App Password / 2FA)"
            : provider === "resend"
              ? "Resend API (Domain / Onboarding)"
              : "Unconfigured (Credentials Missing)",
        smtpHost: provider === "gmail" ? config.gmailSmtpHost : undefined,
        smtpPort: provider === "gmail" ? config.gmailSmtpPort : undefined,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/email-config/verify
 * Tests the SMTP / email provider connection without dispatching mail. Admin only.
 */
router.post(
  "/campaigns/email-config/verify",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await verifyEmailTransport();
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/test-email
 * POST /api/campaigns/:id/test-email
 * Sends a single test email directly to the provided recipient.
 * CRITICAL SAFEGUARDS:
 * - Sends ONLY to the single provided recipient email.
 * - Does NOT contact the campaign audience.
 * - Does NOT mutate campaign status or increment delivery statistics.
 * - Authenticated genuinely as arunopera7@gmail.com when Gmail is active.
 */
router.post(
  ["/campaigns/test-email", "/campaigns/:id/test-email"],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipientEmail = (req.body?.recipientEmail || req.body?.to || "").trim().toLowerCase();
      if (!recipientEmail || !recipientEmail.includes("@")) {
        res.status(400).json({ error: "A valid recipient email address is required for sending a test email." });
        return;
      }

      let subject = (req.body?.subject || req.body?.campaign?.subject || "").trim();
      let contentHtml = req.body?.contentHtml || req.body?.campaign?.contentHtml || "";
      const previewText = req.body?.previewText || req.body?.campaign?.previewText;

      // If an existing campaign ID is specified and subject/content were omitted, load from campaign
      const campaignId = Number(req.params.id || req.body?.campaignId);
      if (campaignId && (!subject || !contentHtml)) {
        const campaign = await CampaignModel.findOne({ id: campaignId }).lean();
        if (campaign) {
          subject = subject || campaign.subject;
          contentHtml = contentHtml || campaign.contentHtml;
        }
      }

      if (!subject) {
        subject = "Escora Journeys — Test Email Preview";
      }
      if (!contentHtml) {
        contentHtml = "<p>This is a test email sent from Escora Holidays Admin.</p>";
      }

      // Render merge tags with realistic preview data
      const sampleRecipient = {
        name: req.body?.recipientName || "Valued Traveler",
        email: recipientEmail,
        destination: req.body?.destination || "Munnar & Alleppey",
        token: "test-preview-token",
      };

      const rendered = renderCampaignForRecipient(
        {
          subject,
          contentHtml,
          previewText,
        },
        sampleRecipient,
        { baseUrl: config.publicUrl }
      );

      const sender = getAuthenticatedSender();
      logger.info(
        { recipient: recipientEmail, from: sender.fullFrom, provider: sender.provider },
        "[Campaign] Dispatching test email"
      );

      const result = await sendEmailWithStatus({
        to: recipientEmail,
        subject: `[Test] ${rendered.renderedSubject}`,
        html: rendered.renderedHtml,
      });

      // Persist test email audit record into NotificationModel so it appears in Email History
      const notifId = await getNextSequence("notifications");
      const notifStatus = result.success ? "accepted" : "failed";
      await NotificationModel.create({
        id: notifId,
        type: "campaign_test_email",
        category: "manual",
        relatedType: "campaign",
        relatedId: campaignId || 0,
        recipientEmail,
        recipientName: sampleRecipient.name,
        subject: `[Test] ${rendered.renderedSubject}`,
        status: notifStatus,
        sentAt: result.sentAt || new Date(),
        messageId: result.messageId || null,
        error: result.error || null,
        retryCount: 0,
        idempotencyKey: `campaign_test_email:${notifId}:${Date.now()}`,
        metadata: {
          isTestEmail: true,
          campaignId: campaignId || null,
          provider: result.provider || sender.provider,
          smtpResponse: result.smtpResponse || null,
          providerResponse: result.providerResponse || null,
          acceptedRecipients: result.acceptedRecipients || [recipientEmail],
          rejectedRecipients: result.rejectedRecipients || [],
          from: sender.fullFrom,
        },
      }).catch((err) => {
        logger.error({ err: err?.message, notifId }, "[Campaign] Failed to persist test email audit record");
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error || "Failed to deliver test email",
          provider: result.provider || sender.provider,
          from: sender.fullFrom,
          notificationId: notifId,
        });
        return;
      }

      const statusMessage = `Test email accepted by ${result.provider === "gmail" ? "Gmail SMTP relay" : "provider"} for delivery to ${recipientEmail}. Note: Final delivery to inbox depends on recipient spam filters.`;

      res.json({
        success: true,
        status: result.status,
        messageId: result.messageId,
        provider: result.provider || sender.provider,
        from: sender.fullFrom,
        to: recipientEmail,
        recipient: recipientEmail,
        subject: `[Test] ${subject}`,
        personalizedSubject: `[Test] ${rendered.renderedSubject}`,
        smtpResponse: result.smtpResponse,
        message: statusMessage,
        notificationId: notifId,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/campaigns/:id
 * Retrieves campaign details with stats and delivery logs. Admin only.
 */
router.get(
  "/campaigns/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const campaign = await CampaignModel.findOne({ id }).lean();
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      res.json(normalizeCampaignDeliveryMode(campaign));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/campaigns/:id
 * Updates a campaign draft. Admin only.
 */
router.put(
  "/campaigns/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const parsed = UpdateCampaignBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const updated = await updateCampaign(id, parsed.data as any);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * DELETE /api/campaigns/:id
 * Deletes a draft campaign. Admin only.
 */
router.delete(
  "/campaigns/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      await deleteCampaign(id);
      res.status(204).end();
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/:id/audience-preview
 * Previews target recipients and consent counts. Admin only.
 */
router.post(
  "/campaigns/:id/audience-preview",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const preview = await previewCampaignAudience(id);
      res.json(preview);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/campaigns/:id/presend-validation
 * POST /api/campaigns/:id/presend-validation
 * Evaluates recipient data, merge tags, fallbacks, and compliance before dispatching. Admin only.
 */
router.all(
  "/campaigns/:id/presend-validation",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const validationSummary = await validateCampaignPreSend(id);
      res.json(validationSummary);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/audience-estimate
 * Estimates target recipients and consent counts for a target audience before saving. Admin only.
 */
router.post(
  "/campaigns/audience-estimate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = req.body?.targetAudience || req.body || {};
      const type = raw.type;

      if (!type) {
        res.status(400).json({
          error: "Audience type is required.",
          code: "INVALID_AUDIENCE_TYPE",
        });
        return;
      }

      if (type === "custom_segment") {
        res.status(400).json({
          error:
            "The 'Custom Destination Segment' audience option has been retired. Please select one of the five supported audience segments: All Contacts, Inquiries Prospects Only, Confirmed Journey Guests Only, Subscribed Contacts Only, or Audience Group.",
          code: "RETIRED_AUDIENCE_SEGMENT",
        });
        return;
      }

      const validAudienceTypes = [
        "all_contacts",
        "enquiries_only",
        "confirmed_guests",
        "subscribed_contacts",
        "audience_group",
      ];
      if (!validAudienceTypes.includes(type)) {
        res.status(400).json({
          error: `Invalid audience segment type "${type}". Expected one of: all_contacts, enquiries_only, confirmed_guests, subscribed_contacts, audience_group.`,
          code: "INVALID_AUDIENCE_TYPE",
        });
        return;
      }

      const parsedGroupId =
        raw.groupId !== undefined && raw.groupId !== null && raw.groupId !== "" && !Number.isNaN(Number(raw.groupId))
          ? Number(raw.groupId)
          : null;
      const parsedGroupIds = Array.isArray(raw.groupIds)
        ? raw.groupIds.map(Number).filter((n: number) => !Number.isNaN(n))
        : parsedGroupId !== null
          ? [parsedGroupId]
          : [];

      const targetAudience = {
        type,
        destinations: Array.isArray(raw.destinations) ? raw.destinations : undefined,
        travelStyle: raw.travelStyle || null,
        groupId: parsedGroupId,
        groupIds: parsedGroupIds,
      };

      const result = await resolveAudience(targetAudience);
      res.json({
        totalSelected: result.totalSelected,
        eligibleRecipients: result.eligibleRecipients,
        eligibleCount: result.eligibleCount,
        activeSubscribers: result.activeSubscribers,
        subscribedCount: result.subscribedCount,
        notSubscribedCount: result.notSubscribedCount,
        unsubscribedCount: result.unsubscribedCount,
        suppressedCount: result.suppressedCount,
        excludedNotSubscribed: result.excludedNotSubscribed,
        excludedUnsubscribed: result.excludedUnsubscribed,
        excludedSuppressed: result.excludedSuppressed,
        sampleRecipients: result.eligible.slice(0, 10).map((r) => ({
          name: r.name,
          email: r.email,
          source: r.source,
          isSubscribed: r.isSubscribed,
          isSuppressed: r.isSuppressed,
          consentStatus: r.consentStatus,
          isEligible: r.isEligible,
          eligibilityReason: r.eligibilityReason,
          exclusionReason: r.exclusionReason,
          destination: r.destination,
          hasDestination: Boolean(r.destination),
        })),
      });
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/newsletter
 * POST /api/newsletter/subscribe
 * Public website newsletter signup endpoint with rate limiting and opt-out/suppression protection.
 */
router.post(
  ["/campaigns/newsletter", "/newsletter/subscribe"],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;

      if (!email || !email.includes("@")) {
        res.status(400).json({ error: "Please provide a valid email address.", code: "INVALID_EMAIL" });
        return;
      }

      const result = await subscribeToNewsletter(email, name);
      res.json(result);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);



/**
 * POST /api/campaigns/:id/duplicate
 * Clones a campaign as a new draft.
 */
router.post(
  "/campaigns/:id/duplicate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const duplicated = await duplicateCampaign(id);
      res.status(201).json(duplicated);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/:id/schedule
 * Schedules an approved campaign for automatic delivery. Admin only.
 */
router.post(
  "/campaigns/:id/schedule",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const parsed = ScheduleCampaignBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const scheduled = await scheduleCampaign(id, parsed.data.scheduledAt);
      res.json(scheduled);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/:id/send
 * Initiates controlled delivery with consent safeguards. Admin only.
 */
router.post(
  "/campaigns/:id/send",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const sent = await sendCampaign(id);
      res.json(sent);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/campaigns/:id/cancel
 * Cancels a scheduled or approved campaign. Admin only.
 */
router.post(
  "/campaigns/:id/cancel",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const cancelled = await cancelCampaign(id);
      res.json(cancelled);
    } catch (err: any) {
      if (err instanceof CampaignError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

export default router;
