import mongoose, { Schema, Document, Model } from "mongoose";

export type CampaignStatus = "draft" | "approved" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";
export type CampaignAudienceType = "all_contacts" | "enquiries_only" | "confirmed_guests" | "custom_segment";

export interface ICampaignDelivery {
  recipientEmail: string;
  recipientName: string;
  status: "sent" | "failed" | "skipped_unsubscribed";
  sentAt?: Date;
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
  };
  status: CampaignStatus;
  scheduledAt?: Date | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  sentAt?: Date | null;
  stats: {
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    skippedCount: number;
  };
  deliveries: ICampaignDelivery[];
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
      enum: ["sent", "failed", "skipped_unsubscribed"],
    },
    sentAt: { type: Date, default: Date.now },
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
        enum: ["all_contacts", "enquiries_only", "confirmed_guests", "custom_segment"],
      },
      destinations: { type: [String], default: [] },
      travelStyle: { type: String, default: null },
    },
    status: {
      type: String,
      required: true,
      default: "draft",
      enum: ["draft", "approved", "scheduled", "sending", "sent", "cancelled", "failed"],
      index: true,
    },
    scheduledAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      skippedCount: { type: Number, default: 0 },
    },
    deliveries: { type: [campaignDeliverySchema], default: [] },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "campaigns",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const CampaignModel: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", campaignSchema);

export const Campaign = CampaignModel;
