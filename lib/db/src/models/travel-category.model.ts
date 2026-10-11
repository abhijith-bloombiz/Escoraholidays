import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface ITravelCategory {
  id: number;
  slug: string;
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  priceFrom?: string | null;
  priceLabel?: string | null;
  journeyCount?: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TravelCategoryDoc = Document<unknown, {}, ITravelCategory> & ITravelCategory;

const travelCategorySchema = new Schema<ITravelCategory>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true, index: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    priceFrom: { type: String, default: null },
    priceLabel: { type: String, default: null },
    journeyCount: { type: String, default: null },
    sortOrder: { type: Number, required: true, default: 0, index: true },
    published: { type: Boolean, required: true, default: true, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "travel_categories",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const TravelCategoryModel: Model<ITravelCategory> =
  mongoose.models.TravelCategory || mongoose.model<ITravelCategory>("TravelCategory", travelCategorySchema);

export const TravelCategory = TravelCategoryModel;
export const travelCategoriesTable = TravelCategoryModel;

export const insertTravelCategorySchema = z.object({
  slug: z.string(),
  label: z.string(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  priceFrom: z.string().optional().nullable(),
  priceLabel: z.string().optional().nullable(),
  journeyCount: z.string().optional().nullable(),
  sortOrder: z.number().optional().default(0),
  published: z.boolean().optional().default(true),
});

export type InsertTravelCategory = z.infer<typeof insertTravelCategorySchema>;
export type TravelCategory = ITravelCategory;
