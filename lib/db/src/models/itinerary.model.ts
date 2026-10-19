import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IItinerary {
  id: number;
  shareToken: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  title: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImageUrl?: string | null;
  summary?: string | null;
  days: string;
  stays: string;
  inclusions?: string | null;
  exclusions?: string | null;
  pricing: string;
  currency: string;
  status: string;
  createdBy?: string | null;
  referenceNumber?: string | null;
  curatorName?: string | null;
  curatorPhone?: string | null;
  emergencyContacts?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  tripIncludes?: string | null;
  transportation?: string | null;
  hotelTerms?: string | null;
  paymentTerms?: string | null;
  importantInfo?: string | null;
  enquiryId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ItineraryDoc = Document<unknown, {}, IItinerary> & IItinerary;

const itinerarySchema = new Schema<IItinerary>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    shareToken: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: null },
    customerPhone: { type: String, default: null },
    title: { type: String, required: true },
    destination: { type: String, default: null },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    coverImageUrl: { type: String, default: null },
    summary: { type: String, default: null },
    days: { type: String, required: true, default: "[]" },
    stays: { type: String, required: true, default: "[]" },
    inclusions: { type: String, default: null },
    exclusions: { type: String, default: null },
    pricing: { type: String, required: true, default: "{}" },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      required: true,
      default: "draft",
      enum: ["draft", "shared", "confirmed", "archived"],
      index: true,
    },
    createdBy: { type: String, default: null },
    referenceNumber: { type: String, default: null },
    curatorName: { type: String, default: null },
    curatorPhone: { type: String, default: null },
    emergencyContacts: { type: String, default: null },
    adults: { type: Number, default: null },
    children: { type: Number, default: null },
    infants: { type: Number, default: null },
    tripIncludes: { type: String, default: null },
    transportation: { type: String, default: null },
    hotelTerms: { type: String, default: null },
    paymentTerms: { type: String, default: null },
    importantInfo: { type: String, default: null },
    enquiryId: { type: Number, default: null, index: true },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "itineraries",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const ItineraryModel: Model<IItinerary> =
  mongoose.models.Itinerary || mongoose.model<IItinerary>("Itinerary", itinerarySchema);

export const Itinerary = ItineraryModel;
export const itinerariesTable = ItineraryModel;

export const insertItinerarySchema = z.object({
  customerName: z.string(),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  title: z.string(),
  destination: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  days: z.string().optional().default("[]"),
  stays: z.string().optional().default("[]"),
  inclusions: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  pricing: z.string().optional().default("{}"),
  currency: z.string().optional().default("INR"),
  status: z.string().optional().default("draft"),
  createdBy: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  curatorName: z.string().optional().nullable(),
  curatorPhone: z.string().optional().nullable(),
  emergencyContacts: z.string().optional().nullable(),
  adults: z.number().optional().nullable(),
  children: z.number().optional().nullable(),
  infants: z.number().optional().nullable(),
  tripIncludes: z.string().optional().nullable(),
  transportation: z.string().optional().nullable(),
  hotelTerms: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  importantInfo: z.string().optional().nullable(),
  enquiryId: z.number().optional().nullable(),
});

export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type Itinerary = IItinerary;
