import { Router, Request, Response, NextFunction } from "express";
import { NotificationModel, EmailAutomationModel } from "@workspace/db";
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

export const RETIRED_AUTOMATION_IDS = [
  "pre_trip_reminder",
  "travel_document_delivery",
  "enquiry_followup",
  "itinerary_update",
  "internal_staff_notification",
] as const;

export const RETIRED_NOTIFICATION_TYPES = [
  "pre_trip_reminder",
  "travel_document_delivery",
  "enquiry_followup",
  "itinerary_update",
  "exceptional_notice",
  "major_itinerary_update",
] as const;

export const DEFAULT_AUTOMATIONS = [
  {
    id: "enquiry_acknowledgement",
    name: "Enquiry Acknowledgement",
    category: "transactional",
    trigger: "enquiry_submitted",
    triggerDescription: "Customer submits an enquiry via website, WhatsApp, or concierge intake",
    templateId: "luxury_welcome_ack",
    templateName: "Luxury Welcome & Enquiry Acknowledgement",
    recipientLogic: "Direct to guest email from Enquiry record",
    timingType: "immediate",
    delayValue: 0,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
  },
  {
    id: "booking_confirmation",
    name: "Booking Confirmation",
    category: "transactional",
    trigger: "booking_confirmed",
    triggerDescription: "Order status transitions to confirmed after staff review",
    templateId: "royal_booking_confirmation",
    templateName: "Royal Booking Confirmation & Sanctuary Summary",
    recipientLogic: "Lead guest email from Order record",
    timingType: "immediate",
    delayValue: 0,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
  },
  {
    id: "payment_receipt",
    name: "Payment Confirmation & Receipt",
    category: "transactional",
    trigger: "payment_succeeded",
    triggerDescription: "Payment succeeds via payment gateway or manual bank reconciliation",
    templateId: "payment_receipt_ledger",
    templateName: "Escora Official Payment Receipt & Ledger Statement",
    recipientLogic: "Payer contact email address",
    timingType: "immediate",
    delayValue: 0,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
  },
  {
    id: "payment_reminder",
    name: "Payment Deadline Reminder",
    category: "scheduled",
    trigger: "payment_reminder_due",
    triggerDescription: "Pending balance deadline approaching (48h before due date)",
    templateId: "payment_deadline_notice",
    templateName: "Gentle Balance Settlement Reminder",
    recipientLogic: "Guest on pending balance order",
    timingType: "delay",
    delayValue: 48,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
  },
  {
    id: "post_trip_feedback",
    name: "Post-Trip Thank-You & Review Request",
    category: "scheduled",
    trigger: "trip_completed",
    triggerDescription: "Tour marked completed in booking operations",
    templateId: "post_trip_review_feedback",
    templateName: "Welcome Home & Private Experience Review Request",
    recipientLogic: "Completed journey guests",
    timingType: "delay",
    delayValue: 24,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
  },
];

const TRIGGER_TO_NOTIFICATION_TYPE: Record<string, string> = {
  enquiry_submitted: "enquiry_acknowledgement",
  booking_confirmed: "booking_confirmation",
  payment_succeeded: "payment_receipt",
  payment_reminder_due: "payment_deadline_reminder",
  trip_completed: "post_trip_feedback",
};

const TRIGGER_TO_SETTING_KEY: Record<string, string> = {
  enquiry_submitted: "enableEnquiryAcknowledgement",
  booking_confirmed: "enableBookingConfirmation",
  payment_succeeded: "enablePaymentReceipts",
  payment_reminder_due: "enablePaymentReminders",
  trip_completed: "enablePostTripFeedback",
};

/**
 * Ensures only the 5 essential automations are active in database.
 * Automatically decommissions the 5 retired automations and cancels any pending jobs.
 */
async function ensureAutomationsSeeded(): Promise<void> {
  try {
    // 1. Remove retired automation rules from EmailAutomationModel
    await EmailAutomationModel.deleteMany({ id: { $in: Array.from(RETIRED_AUTOMATION_IDS) } });

    // 2. Invalidate / cancel pending scheduled jobs for retired automations (preserving audit records)
    await NotificationModel.updateMany(
      {
        type: { $in: Array.from(RETIRED_NOTIFICATION_TYPES) },
        status: { $in: ["pending", "pending_approval"] },
      },
      {
        $set: {
          status: "cancelled",
          error: "Automation rule retired from active email dispatches",
          updatedAt: new Date(),
        },
      }
    );

    // 3. Ensure each of the 5 retained automations exists in DB
    for (const auto of DEFAULT_AUTOMATIONS) {
      const exists = await EmailAutomationModel.findOne({ id: auto.id });
      if (!exists) {
        await EmailAutomationModel.create(auto);
      }
    }
  } catch (err) {
    // Duplicate key or concurrent operation safeguard
  }
}

/**
 * GET /api/notifications/automations
 * Lists all configured email automations from database with real execution stats.
 */
router.get("/notifications/automations", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureAutomationsSeeded();

    const [automations, statsAgg, recentExecutions] = await Promise.all([
      EmailAutomationModel.find({ id: { $nin: Array.from(RETIRED_AUTOMATION_IDS) } }).sort({ createdAt: 1 }).lean(),
      NotificationModel.aggregate([
        {
          $group: {
            _id: { type: "$type", status: "$status" },
            count: { $sum: 1 },
            lastExecuted: { $max: "$updatedAt" },
            nextScheduled: { $min: "$scheduledFor" },
          },
        },
      ]),
      NotificationModel.aggregate([
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: "$type",
            lastStatus: { $first: "$status" },
            lastError: { $first: "$error" },
            lastExecutedAt: { $first: "$updatedAt" },
            lastRecipientEmail: { $first: "$recipientEmail" },
          },
        },
      ]),
    ]);

    const typeStats: Record<
      string,
      {
        sent: number;
        failed: number;
        skipped: number;
        pending: number;
        lastExecutedAt: Date | null;
        lastExecutionStatus: string | null;
        lastExecutionError: string | null;
        nextScheduledAt: Date | null;
      }
    > = {};

    for (const group of statsAgg) {
      const type = group._id?.type;
      const status = group._id?.status;
      if (!type) continue;
      if (!typeStats[type]) {
        typeStats[type] = {
          sent: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
          lastExecutedAt: null,
          lastExecutionStatus: null,
          lastExecutionError: null,
          nextScheduledAt: null,
        };
      }
      const entry = typeStats[type];
      if (status === "sent") entry.sent += group.count;
      else if (status === "failed") entry.failed += group.count;
      else if (status === "skipped") entry.skipped += group.count;
      else if (status === "pending" || status === "pending_approval" || status === "sending") {
        entry.pending += group.count;
      }
      if (group.lastExecuted && (!entry.lastExecutedAt || group.lastExecuted > entry.lastExecutedAt)) {
        entry.lastExecutedAt = group.lastExecuted;
      }
      if (group.nextScheduled && (!entry.nextScheduledAt || group.nextScheduled < entry.nextScheduledAt)) {
        entry.nextScheduledAt = group.nextScheduled;
      }
    }

    for (const recent of recentExecutions) {
      const type = recent._id;
      if (type && typeStats[type]) {
        typeStats[type].lastExecutionStatus = recent.lastStatus;
        typeStats[type].lastExecutionError = recent.lastError;
      }
    }

    const result = automations.map((auto) => {
      const notifType = TRIGGER_TO_NOTIFICATION_TYPE[auto.trigger] || auto.trigger;
      const stats = typeStats[notifType] || {
        sent: 0,
        failed: 0,
        skipped: 0,
        pending: 0,
        lastExecutedAt: auto.lastExecutedAt || null,
        lastExecutionStatus: auto.lastExecutionStatus || null,
        lastExecutionError: auto.lastExecutionError || null,
        nextScheduledAt: auto.nextScheduledAt || null,
      };

      return {
        ...auto,
        stats,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/automations
 * Creates a new email automation rule in the database.
 */
router.post("/notifications/automations", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      category = "transactional",
      trigger,
      triggerDescription,
      templateId,
      templateName,
      recipientLogic,
      timingType = "immediate",
      delayValue = 0,
      delayUnit = "hours",
      requiresApproval = false,
      enabled = true,
      conditions,
    } = req.body;

    if (!name || !trigger || !templateName || !recipientLogic) {
      res.status(400).json({ error: "name, trigger, templateName, and recipientLogic are required." });
      return;
    }

    const RETIRED_TRIGGERS = [
      "pre_trip_departure",
      "travel_documents_ready",
      "enquiry_unconverted",
      "itinerary_amended",
      "operational_alert",
    ];
    if (RETIRED_TRIGGERS.includes(trigger)) {
      res.status(400).json({ error: `The trigger "${trigger}" has been retired and is no longer supported.` });
      return;
    }

    const id = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";

    const created = await EmailAutomationModel.create({
      id,
      name: name.trim(),
      category,
      trigger,
      triggerDescription: triggerDescription || `Automation triggered on ${trigger}`,
      templateId: templateId || "custom_template",
      templateName,
      recipientLogic,
      timingType,
      delayValue: Number(delayValue) || 0,
      delayUnit,
      requiresApproval: Boolean(requiresApproval),
      enabled: Boolean(enabled),
      conditions: conditions || {},
      updatedBy: staffUsername,
    });

    // Synchronize global settings if applicable
    const settingKey = TRIGGER_TO_SETTING_KEY[trigger];
    if (settingKey) {
      await updateAutomationSettings({ [settingKey]: enabled }, staffUsername);
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/automations/:id
 * Retrieves a single automation by ID.
 */
router.get("/notifications/automations/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automation = await EmailAutomationModel.findOne({ id: req.params.id }).lean();
    if (!automation) {
      res.status(404).json({ error: "Automation not found" });
      return;
    }
    res.json(automation);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/notifications/automations/:id
 * Updates an automation's complete configuration.
 */
router.put("/notifications/automations/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";
    const updates = { ...req.body, updatedBy: staffUsername };
    delete updates._id;
    delete updates.id;

    const updated = await EmailAutomationModel.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: "Automation not found" });
      return;
    }

    // Synchronize global settings if trigger matches
    const settingKey = TRIGGER_TO_SETTING_KEY[updated.trigger];
    if (settingKey && typeof updated.enabled === "boolean") {
      const settingUpdates: Record<string, any> = { [settingKey]: updated.enabled };
      if (updated.trigger === "trip_completed" && updated.delayValue) {
        settingUpdates.postTripFeedbackDelayHours = updated.delayValue;
      }
      await updateAutomationSettings(settingUpdates, staffUsername);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/automations/:id
 * Toggles or updates configuration rules/delays for a specific automation.
 */
router.patch("/notifications/automations/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    const staffUsername = (req as any).user?.username || req.body.staffUsername || "Staff Admin";

    const updates: Record<string, any> = { updatedBy: staffUsername };
    if (typeof req.body.enabled === "boolean") {
      updates.enabled = req.body.enabled;
    }
    if (typeof req.body.delayValue === "number") {
      updates.delayValue = req.body.delayValue;
    }
    if (req.body.delayUnit) {
      updates.delayUnit = req.body.delayUnit;
    }
    if (typeof req.body.requiresApproval === "boolean") {
      updates.requiresApproval = req.body.requiresApproval;
    }

    const updated = await EmailAutomationModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: `Automation "${id}" not found` });
      return;
    }

    // Synchronize global settings
    const settingKey = TRIGGER_TO_SETTING_KEY[updated.trigger];
    if (settingKey && typeof req.body.enabled === "boolean") {
      const settingUpdates: Record<string, any> = { [settingKey]: req.body.enabled };
      if (typeof req.body.delayValue === "number") {
        if (updated.trigger === "trip_completed") settingUpdates.postTripFeedbackDelayHours = req.body.delayValue;
      }
      await updateAutomationSettings(settingUpdates, staffUsername);
    }

    res.json({ success: true, automation: updated, enabled: updated.enabled });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications/automations/:id
 * Deletes an automation from database.
 */
router.delete("/notifications/automations/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await EmailAutomationModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      res.status(404).json({ error: "Automation not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

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
