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
  // Automated Welcome Greeting Bot Settings
  welcomeGreetingEnabled?: boolean;
  welcomeBannerUrl?: string;
  welcomeGreetingText?: string;
  welcomeButton1Label?: string;
  welcomeButton2Label?: string;
  welcomeButton3Label?: string;
  welcomeButton1Reply?: string;
  welcomeButton2Reply?: string;
  welcomeButton3Reply?: string;
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
    welcomeGreetingEnabled: { type: Boolean, default: true },
    welcomeBannerUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    },
    welcomeGreetingText: {
      type: String,
      default: "Good day {{first_name}}! Welcome to Escora Holidays. Simply select an option below or type your enquiry to get started.",
    },
    welcomeButton1Label: { type: String, default: "🌴 Tour Packages" },
    welcomeButton2Label: { type: String, default: "✍️ Plan Custom Trip" },
    welcomeButton3Label: { type: String, default: "🛎️ Talk to Concierge" },
    welcomeButton1Reply: {
      type: String,
      default: "🌴 *Escora Signature Collections*\n\n1. *Munnar Mist Sanctuary (4D/3N)* — Slow-living amidst ancient tea estates.\n2. *Vembanad Houseboat Serenity (3D/2N)* — Private luxury backwater cruise.\n3. *Wayanad Rainforest Retreat (4D/3N)* — Ayurveda & wellness sanctuary.\n\nReply with a package name or your travel dates to get full pricing details!",
    },
    welcomeButton2Reply: {
      type: String,
      default: "✍️ *Plan a Custom Itinerary*\n\nPlease let us know:\n• Your expected travel dates\n• Number of travelers (adults & children)\n• Preferred style (Romantic Honeymoon, Family Sanctuary, or Wellness)\n\nOur private travel designer will curate a slow-luxury itinerary for you.",
    },
    welcomeButton3Reply: {
      type: String,
      default: "🛎️ *Escora Concierge*\n\nNamaste! Our senior travel designer has been notified and will assist you right here in this chat shortly.\n\nDirect Concierge Line: +91 94000 00000.",
    },
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
