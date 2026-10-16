import { Router, Request, Response, NextFunction } from "express";
import {
  listEmailNotifications,
  getNotificationById,
  updateNotification,
  cancelNotification,
  retryEmailNotification,
  approveNotification,
  rejectNotification,
  sendManualAdminEmail,
  getNotificationPreview,
  getAutomationSettings,
  updateAutomationSettings,
  NotificationError,
} from "../services/notification-service";

const router = Router();

/**
 * GET /api/notifications/settings
 * Retrieves active automation controls and delays.
 * Admin only.
 */
router.get("/notifications/settings", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getAutomationSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/settings
 * Updates automation enable/disable flags and scheduling delays.
 * Admin only.
 */
router.patch("/notifications/settings", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";
    const updated = await updateAutomationSettings(req.body, staffUsername);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications
 * Lists transactional and automated notification audit records.
 * Admin only.
 */
router.get("/notifications", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const relatedType = req.query.relatedType as string | undefined;
    const relatedId = req.query.relatedId ? Number(req.query.relatedId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;

    const notifications = await listEmailNotifications({
      type,
      status,
      relatedType,
      relatedId: Number.isNaN(relatedId) ? undefined : relatedId,
      limit,
    });

    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/:id
 * Retrieves a single notification audit record with full metadata.
 * Admin only.
 */
router.get("/notifications/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid notification ID" });
      return;
    }
    const notification = await getNotificationById(id);
    res.json(notification);
  } catch (err: any) {
    if (err instanceof NotificationError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * GET /api/notifications/:id/preview
 * Generates slow-luxury rendered HTML preview for visual review before sending.
 * Admin only.
 */
router.get("/notifications/:id/preview", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid notification ID" });
      return;
    }
    const preview = await getNotificationPreview(id);
    res.json(preview);
  } catch (err: any) {
    if (err instanceof NotificationError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id
 * Allows staff to edit subject, recipient, or bodyHtml of an un-sent notification (pending or pending_approval).
 * Admin only.
 */
router.patch("/notifications/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid notification ID" });
      return;
    }
    const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";
    const updated = await updateNotification(id, req.body, staffUsername);
    res.json({ success: true, notification: updated });
  } catch (err: any) {
    if (err instanceof NotificationError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

/**
 * POST /api/notifications/:id/retry
 * Retries a failed notification.
 * Admin only.
 */
router.post(
  "/notifications/:id/retry",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid notification ID" });
        return;
      }

      const retried = await retryEmailNotification(id);
      res.json(retried);
    } catch (err: any) {
      if (err instanceof NotificationError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/notifications/:id/approve
 * Approves a notification held in "pending_approval" status (sensitive/promotional/major change).
 * Admin only.
 */
router.post(
  "/notifications/:id/approve",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid notification ID" });
        return;
      }

      const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";
      const approved = await approveNotification(id, staffUsername);
      res.json({ success: true, notification: approved });
    } catch (err: any) {
      if (err instanceof NotificationError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/notifications/:id/reject
 * Rejects a notification held in "pending_approval" status.
 * Admin only.
 */
router.post(
  "/notifications/:id/reject",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid notification ID" });
        return;
      }

      const reason = req.body.reason || "Rejected by staff";
      const rejected = await rejectNotification(id, reason);
      res.json({ success: true, notification: rejected });
    } catch (err: any) {
      if (err instanceof NotificationError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/notifications/:id/cancel
 * Cancels a scheduled or pending notification.
 * Admin only.
 */
router.post(
  "/notifications/:id/cancel",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid notification ID" });
        return;
      }

      const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";
      const reason = req.body.reason || "Cancelled by staff";
      const cancelled = await cancelNotification(id, reason, staffUsername);
      res.json({ success: true, notification: cancelled });
    } catch (err: any) {
      if (err instanceof NotificationError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/notifications/manual
 * Sends or queues manual administrative emails (quotations, proposals, disputes, refunds, disruptions).
 * Admin only.
 */
router.post(
  "/notifications/manual",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        type,
        recipientEmail,
        recipientName,
        title,
        bodyHtml,
        relatedType,
        relatedId,
        callToAction,
        category,
        queueApproval,
      } = req.body;

      if (!recipientEmail || !title || !bodyHtml || !relatedType || relatedId === undefined) {
        res.status(400).json({
          error: "recipientEmail, title, bodyHtml, relatedType, and relatedId are required",
        });
        return;
      }

      const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";

      const notification = await sendManualAdminEmail({
        type: type || "custom_enquiry_response",
        category: category || "administrative",
        relatedType,
        relatedId: Number(relatedId),
        recipientEmail,
        recipientName: recipientName || "Guest",
        title,
        bodyHtml,
        callToAction,
        sentBy: staffUsername,
        queueApproval: Boolean(queueApproval),
      });

      res.json({ success: true, notification });
    } catch (err: any) {
      if (err instanceof NotificationError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      next(err);
    }
  }
);

export default router;
