import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IOrder {
  id: number;
  packageId?: number | null;
  packageName?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  travelStyle?: string | null;
  destinations?: string | null;
  travelDate?: string | null;
  departureDate?: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
  specialRequests?: string | null;
  status: string;
  totalAmount?: number | null;
  notes?: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDoc = Document<unknown, {}, IOrder> & IOrder;

const orderSchema = new Schema<IOrder>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    packageId: { type: Number, default: null },
    packageName: { type: String, default: null },
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true, index: true },
    guestPhone: { type: String, required: true },
    travelStyle: { type: String, default: null },
    destinations: { type: String, default: null },
    travelDate: { type: String, default: null },
    departureDate: { type: String, default: null },
    guestCount: { type: Number, default: null, min: 1 },
    budgetRange: { type: String, default: null },
    specialRequests: { type: String, default: null },
    status: {
      type: String,
      required: true,
      default: "enquiry",
      enum: ["enquiry", "confirmed", "completed", "cancelled"],
      index: true,
    },
    totalAmount: { type: Number, default: null, min: 0 },
    notes: { type: String, default: null },
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
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "orders",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export const Order = OrderModel;
export const ordersTable = OrderModel;

export const insertOrderSchema = z.object({
  packageId: z.number().optional().nullable(),
  packageName: z.string().optional().nullable(),
  guestName: z.string(),
  guestEmail: z.string(),
  guestPhone: z.string(),
  travelStyle: z.string().optional().nullable(),
  destinations: z.string().optional().nullable(),
  travelDate: z.string().optional().nullable(),
  departureDate: z.string().optional().nullable(),
  guestCount: z.number().optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  status: z.string().optional().default("enquiry"),
  totalAmount: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
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
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = IOrder;
