import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IEnquiry {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
  packageId?: number | null;
  packageName?: string | null;
  travelStyle?: string | null;
  destinations?: string | null;
  travelDate?: string | null;
  departureDate?: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
  currency?: string | null;
  specialRequests?: string | null;
  marketingConsent?: boolean | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrerUrl?: string | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  browserLanguage?: string | null;
  screenResolution?: string | null;
  timezone?: string | null;
  geoCountry?: string | null;
  geoRegion?: string | null;
  geoCity?: string | null;
  bookingId?: number | null;
  bookingReference?: string | null;
  convertedAt?: Date | null;
  convertedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EnquiryDoc = Document<unknown, {}, IEnquiry> & IEnquiry;

const enquirySchema = new Schema<IEnquiry>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: null },
    message: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "new",
      enum: ["new", "read", "replied", "converted"],
      index: true,
    },
    packageId: { type: Number, default: null, index: true },
    packageName: { type: String, default: null },
    travelStyle: { type: String, default: null },
    destinations: { type: String, default: null },
    travelDate: { type: String, default: null },
    departureDate: { type: String, default: null },
    guestCount: { type: Number, default: null, min: 1 },
    budgetRange: { type: String, default: null },
    currency: { type: String, default: "INR" },
    specialRequests: { type: String, default: null },
    marketingConsent: { type: Boolean, default: false },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    referrerUrl: { type: String, default: null },
    landingPage: { type: String, default: null },
    utmSource: { type: String, default: null },
    utmMedium: { type: String, default: null },
    utmCampaign: { type: String, default: null },
    browserLanguage: { type: String, default: null },
    screenResolution: { type: String, default: null },
    timezone: { type: String, default: null },
    geoCountry: { type: String, default: null },
    geoRegion: { type: String, default: null },
    geoCity: { type: String, default: null },
    bookingId: { type: Number, default: null, index: true },
    bookingReference: { type: String, default: null },
    convertedAt: { type: Date, default: null },
    convertedBy: { type: String, default: null },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "enquiries",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const EnquiryModel: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>("Enquiry", enquirySchema);

export const Enquiry = EnquiryModel;
export const enquiriesTable = EnquiryModel;

export const insertEnquirySchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional().nullable(),
  message: z.string(),
  status: z.string().optional().default("new"),
  packageId: z.number().optional().nullable(),
  packageName: z.string().optional().nullable(),
  travelStyle: z.string().optional().nullable(),
  destinations: z.string().optional().nullable(),
  travelDate: z.string().optional().nullable(),
  departureDate: z.string().optional().nullable(),
  guestCount: z.number().optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  marketingConsent: z.boolean().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  referrerUrl: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  browserLanguage: z.string().optional().nullable(),
  screenResolution: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  geoCountry: z.string().optional().nullable(),
  geoRegion: z.string().optional().nullable(),
  geoCity: z.string().optional().nullable(),
  bookingId: z.number().optional().nullable(),
  bookingReference: z.string().optional().nullable(),
  convertedAt: z.date().optional().nullable(),
  convertedBy: z.string().optional().nullable(),
});

export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;
export type Enquiry = IEnquiry;
