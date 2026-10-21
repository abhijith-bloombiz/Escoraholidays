import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "node:crypto";

export interface ISubscriberAuditLog {
  action: "subscribed" | "unsubscribed" | "suppressed" | "unsuppressed" | "reconciled" | "deleted";
  performedBy: string;
  timestamp: Date;
  reason?: string | null;
  method?: string | null;
  source?: string | null;
}

export type ConsentStatus = "subscribed" | "not_subscribed" | "unsubscribed" | "suppressed";

export interface ISubscriberConsent {
  email: string;
  name?: string | null;
  status: ConsentStatus;
  subscribed: boolean;
  token: string;
  unsubscribedAt?: Date | null;
  source: string;
  suppressed?: boolean;
  suppressedAt?: Date | null;
  suppressionReason?: string | null;
  suppressedBy?: string | null;
  consentDate?: Date | null;
  consentMethod?: string | null;
  doubleOptInConfirmed?: boolean;
  updatedBy?: string | null;
  auditLog?: ISubscriberAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriberConsentDoc = Document<unknown, {}, ISubscriberConsent> & ISubscriberConsent;

const subscriberAuditLogSchema = new Schema<ISubscriberAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: ["subscribed", "unsubscribed", "suppressed", "unsuppressed", "reconciled", "deleted"],
    },
    performedBy: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    reason: { type: String, default: null },
    method: { type: String, default: null },
    source: { type: String, default: null },
  },
  { _id: false }
);

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
    status: {
      type: String,
      required: true,
      enum: ["subscribed", "not_subscribed", "unsubscribed", "suppressed"],
      default: "not_subscribed",
      index: true,
    },
    subscribed: {
      type: Boolean,
      required: true,
      default: false,
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
    suppressed: { type: Boolean, default: false, index: true },
    suppressedAt: { type: Date, default: null },
    suppressionReason: { type: String, default: null },
    suppressedBy: { type: String, default: null },
    consentDate: { type: Date, default: null },
    consentMethod: { type: String, default: null },
    doubleOptInConfirmed: { type: Boolean, default: false },
    updatedBy: { type: String, default: null },
    auditLog: { type: [subscriberAuditLogSchema], default: [] },
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

