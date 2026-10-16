import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "node:crypto";

export interface ISubscriberConsent {
  email: string;
  name?: string | null;
  subscribed: boolean;
  token: string;
  unsubscribedAt?: Date | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriberConsentDoc = Document<unknown, {}, ISubscriberConsent> & ISubscriberConsent;

const subscriberConsentSchema = new Schema<ISubscriberConsent>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, default: null },
    subscribed: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(24).toString("hex"),
    },
    unsubscribedAt: { type: Date, default: null },
    source: { type: String, default: "enquiry" },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "subscriber_consents",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const SubscriberConsentModel: Model<ISubscriberConsent> =
  mongoose.models.SubscriberConsent ||
  mongoose.model<ISubscriberConsent>("SubscriberConsent", subscriberConsentSchema);

export const SubscriberConsent = SubscriberConsentModel;
