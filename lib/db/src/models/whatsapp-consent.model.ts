import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWhatsAppConsent {
  phone: string; // E.164 normalized phone number e.g. +919876543210
  name?: string | null;
  /**
   * If true, customer has explicitly requested not to receive any WhatsApp communications
   * (including transactional notifications). Defaults to false.
   */
  transactionalOptOut: boolean;
  /**
   * Strictly tracks explicit opt-in consent for promotional / marketing messages.
   * SUBMITTING AN ENQUIRY OR BOOKING DOES NOT GRANT MARKETING CONSENT.
   * Defaults to false.
   */
  marketingConsent: boolean;
  optedInAt?: Date | null;
  optedOutAt?: Date | null;
  source: string; // e.g. "enquiry_form", "checkout_form", "admin_dashboard", "customer_chat", "opt_out_keyword"
  notes?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WhatsAppConsentDoc = Document<unknown, {}, IWhatsAppConsent> & IWhatsAppConsent;

const whatsappConsentSchema = new Schema<IWhatsAppConsent>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: { type: String, default: null, trim: true },
    transactionalOptOut: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    marketingConsent: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    optedInAt: { type: Date, default: null },
    optedOutAt: { type: Date, default: null },
    source: { type: String, default: "enquiry_form" },
    notes: { type: String, default: null },
    updatedBy: { type: String, default: null },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "whatsapp_consents",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const WhatsAppConsentModel: Model<IWhatsAppConsent> =
  mongoose.models.WhatsAppConsent ||
  mongoose.model<IWhatsAppConsent>("WhatsAppConsent", whatsappConsentSchema);

export const WhatsAppConsent = WhatsAppConsentModel;
