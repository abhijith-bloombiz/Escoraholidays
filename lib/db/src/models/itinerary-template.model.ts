import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IItineraryTemplate {
  id: string;
  label: string;
  title: string;
  description: string;
  destination: string;
  customerName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  curatorName?: string | null;
  curatorPhone?: string | null;
  emergencyContacts?: string | null;
  referenceNumber?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  tripIncludes?: string | null;
  transportation?: string | null;
  coverImageUrl?: string | null;
  summary?: string | null;
  days: string;
  stays: string;
  pricing: string;
  inclusions?: string | null;
  exclusions?: string | null;
  hotelTerms?: string | null;
  paymentTerms?: string | null;
  importantInfo?: string | null;
  status: string;
  isPredefined?: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ItineraryTemplateDoc = Document<unknown, {}, IItineraryTemplate> & IItineraryTemplate;

const itineraryTemplateSchema = new Schema<IItineraryTemplate>(
  {
    id: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    destination: { type: String, required: true },
    customerName: { type: String, default: null },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    curatorName: { type: String, default: null },
    curatorPhone: { type: String, default: null },
    emergencyContacts: { type: String, default: null },
    referenceNumber: { type: String, default: null },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
    tripIncludes: { type: String, default: null },
    transportation: { type: String, default: null },
    coverImageUrl: { type: String, default: null },
    summary: { type: String, default: null },
    days: { type: String, required: true, default: "[]" },
    stays: { type: String, required: true, default: "[]" },
    pricing: { type: String, required: true, default: "{}" },
    inclusions: { type: String, default: null },
    exclusions: { type: String, default: null },
    hotelTerms: { type: String, default: null },
    paymentTerms: { type: String, default: null },
    importantInfo: { type: String, default: null },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "archived", "draft"],
      index: true,
    },
    isPredefined: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "itinerary_templates",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const ItineraryTemplateModel: Model<IItineraryTemplate> =
  mongoose.models.ItineraryTemplate ||
  mongoose.model<IItineraryTemplate>("ItineraryTemplate", itineraryTemplateSchema);

export const ItineraryTemplate = ItineraryTemplateModel;
export const itineraryTemplatesTable = ItineraryTemplateModel;

export const insertItineraryTemplateSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Template name is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  destination: z.string().min(1, "Destination is required"),
  customerName: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  curatorName: z.string().optional().nullable(),
  curatorPhone: z.string().optional().nullable(),
  emergencyContacts: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  adults: z.number().optional().nullable(),
  children: z.number().optional().nullable(),
  infants: z.number().optional().nullable(),
  tripIncludes: z.string().optional().nullable(),
  transportation: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  days: z.string().optional().default("[]"),
  stays: z.string().optional().default("[]"),
  pricing: z.string().optional().default("{}"),
  inclusions: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  hotelTerms: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  importantInfo: z.string().optional().nullable(),
  status: z.string().optional().default("active"),
  isPredefined: z.boolean().optional().default(false),
  displayOrder: z.number().optional().default(0),
});

export type InsertItineraryTemplate = z.infer<typeof insertItineraryTemplateSchema>;
export type ItineraryTemplate = IItineraryTemplate;
