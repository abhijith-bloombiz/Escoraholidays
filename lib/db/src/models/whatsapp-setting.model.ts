import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWhatsAppSetting {
  id: string; // "default" singleton
  provider: "mock" | "cloud_api";
  enableEnquiryAcknowledgement: boolean;
  enableBookingConfirmation: boolean;
  enableItineraryUpdates: boolean;
  enablePaymentReceipts: boolean;
  enablePaymentReminders: boolean;
  enablePreTripReminders: boolean;
  enablePostTripFeedback: boolean;
  enableEnquiryFollowups: boolean;
  enableDocumentDelivery: boolean;
  simulateAutoDelivery: boolean; // Auto-transition simulated -> delivered -> read in mock mode
  enquiryFollowupDelayHours: number;
  postTripFeedbackDelayHours: number;
  updatedAt?: Date;
  updatedBy?: string | null;
}

export type WhatsAppSettingDoc = Document<unknown, {}, IWhatsAppSetting> & IWhatsAppSetting;

const whatsappSettingSchema = new Schema<IWhatsAppSetting>(
  {
    id: { type: String, required: true, unique: true, default: "default" },
    provider: {
      type: String,
      required: true,
      enum: ["mock", "cloud_api"],
      default: "mock",
    },
    enableEnquiryAcknowledgement: { type: Boolean, default: true },
    enableBookingConfirmation: { type: Boolean, default: true },
    enableItineraryUpdates: { type: Boolean, default: true },
    enablePaymentReceipts: { type: Boolean, default: true },
    enablePaymentReminders: { type: Boolean, default: true },
    enablePreTripReminders: { type: Boolean, default: true },
    enablePostTripFeedback: { type: Boolean, default: true },
    enableEnquiryFollowups: { type: Boolean, default: false },
    enableDocumentDelivery: { type: Boolean, default: true },
    simulateAutoDelivery: { type: Boolean, default: true },
    enquiryFollowupDelayHours: { type: Number, default: 24 },
    postTripFeedbackDelayHours: { type: Number, default: 24 },
    updatedBy: { type: String, default: null },
  },
  {
    collection: "whatsapp_settings",
    timestamps: true,
    versionKey: false,
  }
);

export const WhatsAppSettingModel: Model<IWhatsAppSetting> =
  mongoose.models.WhatsAppSetting ||
  mongoose.model<IWhatsAppSetting>("WhatsAppSetting", whatsappSettingSchema);

export const WhatsAppSetting = WhatsAppSettingModel;
