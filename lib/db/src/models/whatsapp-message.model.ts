import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export type WhatsAppMessageType =
  // Automatic Transactional / Service
  | "enquiry_acknowledgement"
  | "booking_confirmation"
  | "itinerary_update"
  | "final_itinerary_delivery"
  | "payment_receipt"
  | "payment_reminder"
  | "booking_cancellation"
  | "document_delivery"
  // Scheduled Service Followup
  | "pre_trip_reminder"
  | "post_trip_feedback"
  | "enquiry_followup"
  // Administrative / Manual Concierge
  | "manual_concierge_message"
  | "custom_enquiry_response"
  | "custom_booking_update"
  // Promotional / Marketing (requires explicit marketing opt-in)
  | "promotional_offer"
  | "seasonal_curation"
  // Inbound Customer Communications
  | "inbound_customer_message"
  | "inbound_help_request"
  | "inbound_opt_out";

export type WhatsAppMessageCategory =
  | "transactional"
  | "service_followup"
  | "administrative"
  | "marketing";

export type WhatsAppDeliveryStatus =
  | "pending"
  | "simulated"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "cancelled"
  | "skipped_no_consent"
  | "skipped_opted_out"
  | "skipped_invalid_phone"
  | "skipped_disabled";

export interface IWhatsAppMessage {
  id: number;
  direction?: "outbound" | "inbound";
  recipientPhone: string;
  recipientName: string;
  messageType: WhatsAppMessageType;
  category: WhatsAppMessageCategory;
  trigger: string;
  relatedType: "enquiry" | "order" | "itinerary" | "invoice" | "custom";
  relatedId: number;
  bodyText: string;
  templateName?: string | null;
  templateLanguage?: string | null;
  templateVariables?: Record<string, any> | null;
  provider: "mock" | "cloud_api";
  providerMessageId?: string | null;
  providerStatus?: string | null;
  providerResponse?: Record<string, any> | null;
  status: WhatsAppDeliveryStatus;
  error?: string | null;
  idempotencyKey: string;
  retryCount: number;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  metadata?: Record<string, any>;
  interactive?: any;
  createdAt: Date;
  updatedAt: Date;
}

export type WhatsAppMessageDoc = Document<unknown, {}, IWhatsAppMessage> & IWhatsAppMessage;

const whatsappMessageSchema = new Schema<IWhatsAppMessage>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    direction: {
      type: String,
      enum: ["outbound", "inbound"],
      default: "outbound",
      index: true,
    },
    recipientPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recipientName: { type: String, required: true, trim: true },
    messageType: {
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
    trigger: { type: String, required: true, index: true },
    relatedType: {
      type: String,
      required: true,
      enum: ["enquiry", "order", "itinerary", "invoice", "custom"],
      index: true,
    },
    relatedId: { type: Number, required: true, index: true },
    bodyText: { type: String, required: true },
    templateName: { type: String, default: null },
    templateLanguage: { type: String, default: "en" },
    templateVariables: { type: Schema.Types.Mixed, default: null },
    provider: {
      type: String,
      required: true,
      enum: ["mock", "cloud_api"],
      default: "mock",
      index: true,
    },
    providerMessageId: { type: String, default: null, index: true },
    providerStatus: { type: String, default: null },
    providerResponse: { type: Schema.Types.Mixed, default: null },
    status: {
      type: String,
      required: true,
      default: "pending",
      index: true,
    },
    error: { type: String, default: null },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    interactive: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "whatsapp_messages",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

whatsappMessageSchema.index({ status: 1, createdAt: -1 });
whatsappMessageSchema.index({ relatedType: 1, relatedId: 1, messageType: 1 });
whatsappMessageSchema.index({ recipientPhone: 1, createdAt: -1 });

export const WhatsAppMessageModel: Model<IWhatsAppMessage> =
  mongoose.models.WhatsAppMessage ||
  mongoose.model<IWhatsAppMessage>("WhatsAppMessage", whatsappMessageSchema);

export const WhatsAppMessage = WhatsAppMessageModel;

export const insertWhatsAppMessageSchema = z.object({
  recipientPhone: z.string().min(6),
  recipientName: z.string().min(1),
  messageType: z.string(),
  category: z.enum(["transactional", "service_followup", "administrative", "marketing"]).default("transactional"),
  trigger: z.string(),
  relatedType: z.enum(["enquiry", "order", "itinerary", "invoice", "custom"]),
  relatedId: z.number(),
  bodyText: z.string().min(1),
  templateName: z.string().optional().nullable(),
  templateLanguage: z.string().optional().default("en"),
  templateVariables: z.record(z.any()).optional().nullable(),
  idempotencyKey: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  interactive: z.any().optional(),
});

export type InsertWhatsAppMessage = z.infer<typeof insertWhatsAppMessageSchema>;
