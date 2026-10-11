import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IPackage {
  id: number;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  shortDesc?: string | null;
  durationNights: number;
  route?: string | null;
  bestFor?: string | null;
  season?: string | null;
  priceFrom?: number | null;
  heroImageUrl?: string | null;
  galleryImages?: string | null;
  itinerary?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  faqs?: string | null;
  accommodations?: string | null;
  tags?: string | null;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PackageDoc = Document<unknown, {}, IPackage> & IPackage;

const packageSchema = new Schema<IPackage>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: null },
    shortDesc: { type: String, default: null },
    durationNights: { type: Number, required: true },
    route: { type: String, default: null },
    bestFor: { type: String, default: null },
    season: { type: String, default: null },
    priceFrom: { type: Number, default: null },
    heroImageUrl: { type: String, default: null },
    galleryImages: { type: String, default: null },
    itinerary: { type: String, default: null },
    inclusions: { type: String, default: null },
    exclusions: { type: String, default: null },
    faqs: { type: String, default: null },
    accommodations: { type: String, default: null },
    tags: { type: String, default: null },
    featured: { type: Boolean, required: true, default: false, index: true },
    published: { type: Boolean, required: true, default: false, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "packages",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const PackageModel: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>("Package", packageSchema);

export const Package = PackageModel;
export const packagesTable = PackageModel;

export const insertPackageSchema = z.object({
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  description: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  durationNights: z.number(),
  route: z.string().optional().nullable(),
  bestFor: z.string().optional().nullable(),
  season: z.string().optional().nullable(),
  priceFrom: z.number().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  galleryImages: z.string().optional().nullable(),
  itinerary: z.string().optional().nullable(),
  inclusions: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  faqs: z.string().optional().nullable(),
  accommodations: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
});

export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = IPackage;
