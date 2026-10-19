import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export type NotificationType =
  // Automatic Transactional
  | "booking_confirmation"
  | "payment_receipt"
  | "enquiry_acknowledgement"
  | "payment_deadline_reminder"
  | "final_itinerary_delivery"
  | "itinerary_update"
  | "booking_cancellation"
  | "travel_document_delivery"
  // Scheduled
  | "pre_trip_reminder"
  | "overdue_payment_followup"
  | "enquiry_followup"
  | "post_trip_feedback"
  | "birthday_anniversary_greeting"
  | "outstanding_document_reminder"
  // Admin Approval Required
  | "personalized_offer"
  | "major_itinerary_update"
  | "ai_marketing_email"
  | "exceptional_notice"
  // Manual Admin Emails
  | "custom_enquiry_response"
  | "quotation_delivery"
  | "itinerary_proposal"
  | "complaint_response"
  | "refund_notice"
  | "travel_disruption"
  // Conversion & Audit
  | "enquiry_conversion";

export type NotificationCategory =
  | "transactional"
  | "marketing"
  | "promotional"
  | "service_followup"
  | "administrative"
  | "manual";

export type NotificationStatus =
  | "pending"
  | "pending_approval"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled"
  | "skipped";

export interface INotification {
  id: number;
  type: NotificationType;
  category: NotificationCategory;
  relatedType: "order" | "itinerary" | "enquiry" | "invoice" | "customer";
  relatedId: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: NotificationStatus;
  requiresApproval?: boolean;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  sentBy?: string | null;
  scheduledFor?: Date | null;
  sentAt?: Date | null;
  messageId?: string | null;
  error?: string | null;
  retryCount: number;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDoc = Document<unknown, {}, INotification> & INotification;

const notificationSchema = new Schema<INotification>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      default: "transactional",
      index: true,
    },
    relatedType: {
      type: String,
      required: true,
      index: true,
    },
    relatedId: { type: Number, required: true, index: true },
    recipientEmail: { type: String, required: true, index: true },
    recipientName: { type: String, required: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "pending",
      index: true,
    },
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    sentBy: { type: String, default: null },
    scheduledFor: { type: Date, default: null, index: true },
    sentAt: { type: Date, default: null },
    messageId: { type: String, default: null },
    error: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "notifications",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ relatedType: 1, relatedId: 1, type: 1 });

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);

export const Notification = NotificationModel;

export interface IAutomationSetting {
  id: string; // single document "default"
  enableBookingConfirmation: boolean;
  enableEnquiryAcknowledgement?: boolean;
  enableStaffNotifications?: boolean;
  enableItineraryUpdates: boolean;
  enableEnquiryFollowups: boolean;
  enablePostTripFeedback: boolean;
  enablePaymentReceipts: boolean;
  enablePaymentReminders: boolean;
  enablePreTripReminders: boolean;
  preTripReminderDays?: number;
  enableCancellationNotifications: boolean;
  enableDocumentDelivery: boolean;
  enquiryFollowupDelayHours: number;
  postTripFeedbackDelayHours: number;
  updatedAt?: Date;
  updatedBy?: string | null;
}

const automationSettingSchema = new Schema<IAutomationSetting>(
  {
    id: { type: String, required: true, unique: true, default: "default" },
    enableBookingConfirmation: { type: Boolean, default: true },
    enableEnquiryAcknowledgement: { type: Boolean, default: true },
    enableStaffNotifications: { type: Boolean, default: true },
    enableItineraryUpdates: { type: Boolean, default: true },
    enableEnquiryFollowups: { type: Boolean, default: true },
    enablePostTripFeedback: { type: Boolean, default: true },
    enablePaymentReceipts: { type: Boolean, default: true },
    enablePaymentReminders: { type: Boolean, default: true },
    enablePreTripReminders: { type: Boolean, default: true },
    preTripReminderDays: { type: Number, default: 3 },
    enableCancellationNotifications: { type: Boolean, default: true },
    enableDocumentDelivery: { type: Boolean, default: true },
    enquiryFollowupDelayHours: { type: Number, default: 24 },
    postTripFeedbackDelayHours: { type: Number, default: 24 },
    updatedBy: { type: String, default: null },
  },
  {
    collection: "automation_settings",
    timestamps: true,
    versionKey: false,
  }
);

export const AutomationSettingModel: Model<IAutomationSetting> =
  mongoose.models.AutomationSetting ||
  mongoose.model<IAutomationSetting>("AutomationSetting", automationSettingSchema);

export const AutomationSetting = AutomationSettingModel;

export const insertNotificationSchema = z.object({
  type: z.string(),
  category: z.string().default("transactional"),
  relatedType: z.enum(["order", "itinerary", "enquiry", "invoice", "customer"]),
  relatedId: z.number(),
  recipientEmail: z.string().email(),
  recipientName: z.string(),
  subject: z.string(),
  status: z
    .enum(["pending", "pending_approval", "sending", "sent", "failed", "cancelled", "skipped"])
    .default("pending"),
  requiresApproval: z.boolean().optional(),
  scheduledFor: z.date().optional().nullable(),
  idempotencyKey: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
