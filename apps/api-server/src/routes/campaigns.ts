import crypto from "node:crypto";
import { Router, Request, Response, NextFunction } from "express";
import { CampaignModel, SubscriberConsentModel, NotificationModel, AudienceGroupModel } from "@workspace/db";
import { config } from "../config/env";
import { logger } from "../lib/logger";
import { getAutomationSettings } from "../services/notification-service";
import {
  CreateCampaignBody,
  UpdateCampaignBody,
  ScheduleCampaignBody,
  SendCampaignBody,
  UnsubscribeGuestBody,
} from "@workspace/api-zod";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  resolveAudience,
  previewCampaignAudience,
  submitCampaignForApproval,
  rejectCampaign,
  duplicateCampaign,
  approveCampaign,
  scheduleCampaign,
  cancelCampaign,
  sendCampaign,
  handleUnsubscribe,
  listSubscribers,
  listAudienceGroups,
  createAudienceGroup,
  getAudienceGroup,
  updateAudienceGroup,
  deleteAudienceGroup,
  addAudienceGroupMember,
  removeAudienceGroupMember,
  previewAudienceGroup,
  CampaignError,
} from "../services/campaign-service";

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
              totalDelivered: { $sum: "$deliveredCount" },
              totalSent: { $sum: "$sentCount" },
              totalFailed: { $sum: "$failedCount" },
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
        SubscriberConsentModel.countDocuments({ subscribed: true }),
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

      const notifSent = nMap["sent"] || 0;
      const notifFailed = nMap["failed"] || 0;

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
        campaignsSent: (cMap["completed"] || 0) + (cMap["sending"] || 0),
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

/**
 * GET /api/campaigns/subscribers
 * Lists subscriber consent status. Admin only.
 */
router.get(
  "/campaigns/subscribers",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subscribedParam = req.query.subscribed;
      const subscribedFilter =
        subscribedParam === "true" ? true : subscribedParam === "false" ? false : undefined;
      const subscribers = await listSubscribers(subscribedFilter);
      res.json(subscribers);
    } catch (err) {
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
 * POST /api/campaigns/audience-estimate
 * Estimates target recipients and consent counts for a target audience before saving. Admin only.
 */
router.post(
  "/campaigns/audience-estimate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetAudience = req.body?.targetAudience || {
        type: req.body?.type || "all_contacts",
        destinations: req.body?.destinations,
        travelStyle: req.body?.travelStyle,
      };
      const { eligible, activeSubscribers, unsubscribedCount } = await resolveAudience(targetAudience);
      res.json({
        eligibleRecipients: eligible.length,
        activeSubscribers,
        unsubscribedCount,
        sampleRecipients: eligible.slice(0, 5).map((r) => ({
          name: r.name,
          email: r.email,
          source: r.source,
          isSubscribed: r.isSubscribed,
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
 * POST /api/campaigns/:id/approve
 * Explicit staff approval gate. Admin only.
 */
router.post(
  "/campaigns/:id/approve",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const staffUsername = (req.session as any)?.user?.username || "Admin Staff";
      const approved = await approveCampaign(id, staffUsername);
      res.json(approved);
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
 * POST /api/campaigns/:id/submit-approval
 * Submits a draft or rejected campaign for approval.
 */
router.post(
  "/campaigns/:id/submit-approval",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const submitted = await submitCampaignForApproval(id);
      res.json(submitted);
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
 * POST /api/campaigns/:id/reject
 * Rejects a campaign with a reason. Admin only.
 */
router.post(
  "/campaigns/:id/reject",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid campaign ID" });
        return;
      }

      const reason = req.body?.reason || "Campaign rejected by reviewer";
      const staffUsername = (req.session as any)?.user?.username || "Admin Staff";
      const rejected = await rejectCampaign(id, staffUsername, reason);
      res.json(rejected);
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
 * Initiates controlled delivery with approval and consent safeguards. Admin only.
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

      const parsed = SendCampaignBody.safeParse(req.body || {});
      const mock = parsed.success ? parsed.data?.mock : undefined;

      const sent = await sendCampaign(id, { mock });
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
