import mongoose, { Schema, Document, Model } from "mongoose";

export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "scheduled"
  | "sending"
  | "sent"
  | "cancelled"
  | "failed";
export type CampaignAudienceType =
  | "all_contacts"
  | "enquiries_only"
  | "confirmed_guests"
  | "custom_segment"
  | "audience_group";

export type CampaignDeliveryStatus =
  | "sent"
  | "simulated"
  | "accepted"
  | "delivered"
  | "bounced"
  | "failed"
  | "skipped_unsubscribed"
  | "complained";

export interface ICampaignDelivery {
  recipientEmail: string;
  recipientName: string;
  status: CampaignDeliveryStatus;
  deliveryStatus?: CampaignDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date | null;
  messageId?: string | null;
  error?: string | null;
}

export interface ICampaign {
  id: number;
  name: string;
  subject: string;
  previewText?: string | null;
  contentHtml: string;
  targetAudience: {
    type: CampaignAudienceType;
    destinations?: string[];
    travelStyle?: string | null;
    groupId?: number | null;
    groupIds?: number[];
  };
  status: CampaignStatus;
  scheduledAt?: Date | null;
  submittedForApprovalAt?: Date | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  sentAt?: Date | null;
  stats: {
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    skippedCount: number;
  };
  deliveries: ICampaignDelivery[];
  deliveryMode?: "simulated" | "live" | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CampaignDoc = Document<unknown, {}, ICampaign> & ICampaign;

const campaignDeliverySchema = new Schema<ICampaignDelivery>(
  {
    recipientEmail: { type: String, required: true },
    recipientName: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        "sent",
        "simulated",
        "accepted",
        "delivered",
        "bounced",
        "failed",
        "skipped_unsubscribed",
        "complained",
      ],
    },
    deliveryStatus: { type: String, default: null },
    sentAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date, default: null },
    messageId: { type: String, default: null },
    error: { type: String, default: null },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    previewText: { type: String, default: null },
    contentHtml: { type: String, required: true },
    targetAudience: {
      type: {
        type: String,
        required: true,
        default: "all_contacts",
        enum: ["all_contacts", "enquiries_only", "confirmed_guests", "custom_segment", "audience_group"],
      },
      destinations: { type: [String], default: [] },
      travelStyle: { type: String, default: null },
      groupId: { type: Number, default: null },
      groupIds: { type: [Number], default: [] },
    },
    status: {
      type: String,
      required: true,
      default: "draft",
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "scheduled",
        "sending",
        "sent",
        "cancelled",
        "failed",
      ],
      index: true,
    },
    scheduledAt: { type: Date, default: null },
    submittedForApprovalAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: String, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    sentAt: { type: Date, default: null },
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      skippedCount: { type: Number, default: 0 },
    },
    deliveries: { type: [campaignDeliverySchema], default: [] },
    deliveryMode: { type: String, enum: ["simulated", "live"], default: null },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "campaigns",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

campaignSchema.index({ "deliveries.messageId": 1 });
campaignSchema.index({ status: 1, scheduledAt: 1, approvedBy: 1 });

export const CampaignModel: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", campaignSchema);

export const Campaign = CampaignModel;
