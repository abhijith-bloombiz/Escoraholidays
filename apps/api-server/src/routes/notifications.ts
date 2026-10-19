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

const DEFAULT_AUTOMATIONS = [
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
    id: "pre_trip_reminder",
    name: "Pre-Trip Countdown & Guide",
    category: "scheduled",
    trigger: "pre_trip_departure",
    triggerDescription: "Configured days prior to scheduled tour departure",
    templateId: "pre_trip_countdown",
    templateName: "Kerala Luxury Journey Countdown & Packing Guide",
    recipientLogic: "Guest on upcoming confirmed tour",
    timingType: "delay",
    delayValue: 3,
    delayUnit: "days",
    requiresApproval: false,
    enabled: true,
  },
  {
    id: "travel_document_delivery",
    name: "Travel Documents & Vouchers",
    category: "transactional",
    trigger: "travel_documents_ready",
    triggerDescription: "Flight tickets, resort vouchers or permits verified and attached",
    templateId: "travel_vouchers_dossier",
    templateName: "Official Travel Vouchers & Journey Dossier",
    recipientLogic: "Lead traveller email",
    timingType: "immediate",
    delayValue: 0,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
  },
  {
    id: "enquiry_followup",
    name: "Enquiry Follow-Up",
    category: "scheduled",
    trigger: "enquiry_unconverted",
    triggerDescription: "Unconverted enquiry with no recorded staff engagement",
    templateId: "enquiry_followup_consultation",
    templateName: "Curated Itinerary Follow-up & Kerala Consultation",
    recipientLogic: "Unconverted enquirer email",
    timingType: "delay",
    delayValue: 24,
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
  {
    id: "itinerary_update",
    name: "Itinerary Update & Amenity Notice",
    category: "transactional",
    trigger: "itinerary_amended",
    triggerDescription: "Published itinerary updated by travel operations",
    templateId: "itinerary_refinement_notice",
    templateName: "Itinerary Refinement Notice & Updated Journey Plan",
    recipientLogic: "Confirmed travellers on updated itinerary",
    timingType: "immediate",
    delayValue: 0,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
  },
  {
    id: "internal_staff_notification",
    name: "Internal Staff Operational Alert",
    category: "operational",
    trigger: "operational_alert",
    triggerDescription: "VIP arrival, booking cancellation, or high-budget inquiry",
    templateId: "concierge_duty_alert",
    templateName: "Escora Concierge Operational Duty Alert",
    recipientLogic: "Assigned tour specialist & operations desk",
    timingType: "immediate",
    delayValue: 0,
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
  pre_trip_departure: "pre_trip_reminder",
  travel_documents_ready: "travel_document_delivery",
  enquiry_unconverted: "enquiry_followup",
  trip_completed: "post_trip_feedback",
  itinerary_amended: "itinerary_update",
  operational_alert: "exceptional_notice",
};

const TRIGGER_TO_SETTING_KEY: Record<string, string> = {
  enquiry_submitted: "enableEnquiryAcknowledgement",
  booking_confirmed: "enableBookingConfirmation",
  payment_succeeded: "enablePaymentReceipts",
  payment_reminder_due: "enablePaymentReminders",
  pre_trip_departure: "enablePreTripReminders",
  travel_documents_ready: "enableDocumentDelivery",
  enquiry_unconverted: "enableEnquiryFollowups",
  trip_completed: "enablePostTripFeedback",
  itinerary_amended: "enableItineraryUpdates",
  operational_alert: "enableStaffNotifications",
};

/**
 * Ensures initial default automations are seeded into database if collection is empty.
 */
async function ensureAutomationsSeeded(): Promise<void> {
  try {
    const count = await EmailAutomationModel.countDocuments();
    if (count === 0) {
      await EmailAutomationModel.insertMany(DEFAULT_AUTOMATIONS);
    }
  } catch (err) {
    // If concurrent insert happens, ignore duplicate key error
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
      EmailAutomationModel.find().sort({ createdAt: 1 }).lean(),
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
      if (updated.trigger === "enquiry_unconverted" && updated.delayValue) {
        settingUpdates.enquiryFollowupDelayHours = updated.delayValue;
      } else if (updated.trigger === "trip_completed" && updated.delayValue) {
        settingUpdates.postTripFeedbackDelayHours = updated.delayValue;
      } else if (updated.trigger === "pre_trip_departure" && updated.delayValue) {
        settingUpdates.preTripReminderDays = updated.delayValue;
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
        if (updated.trigger === "enquiry_unconverted") settingUpdates.enquiryFollowupDelayHours = req.body.delayValue;
        if (updated.trigger === "trip_completed") settingUpdates.postTripFeedbackDelayHours = req.body.delayValue;
        if (updated.trigger === "pre_trip_departure") settingUpdates.preTripReminderDays = req.body.delayValue;
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
