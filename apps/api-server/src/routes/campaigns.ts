import { Router, Request, Response, NextFunction } from "express";
import { CampaignModel } from "@workspace/db";
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
  previewCampaignAudience,
  approveCampaign,
  scheduleCampaign,
  cancelCampaign,
  sendCampaign,
  handleUnsubscribe,
  listSubscribers,
  CampaignError,
} from "../services/campaign-service";

const router = Router();

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
    res.json(campaigns);
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

      res.json(campaign);
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
