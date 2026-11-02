import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IDestination {
  id: number;
  name: string;
  slug: string;
  region: string;
  type: string;
  description?: string | null;
  shortDesc?: string | null;
  imageUrl?: string | null;
  galleryImages?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bestSeason?: string | null;
  elevation?: string | null;
  nightsMin?: number | null;
  nightsMax?: number | null;
  highlights?: string | null;
  howToReach?: string | null;
  featured?: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DestinationDoc = Document<unknown, {}, IDestination> & IDestination;

const destinationSchema = new Schema<IDestination>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    region: { type: String, required: true },
    type: { type: String, required: true, index: true },
    description: { type: String, default: null },
    shortDesc: { type: String, default: null },
    imageUrl: { type: String, default: null },
    galleryImages: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    bestSeason: { type: String, default: null },
    elevation: { type: String, default: null },
    nightsMin: { type: Number, default: null, min: 0 },
    nightsMax: { type: Number, default: null, min: 0 },
    highlights: { type: String, default: null },
    howToReach: { type: String, default: null },
    featured: { type: Boolean, required: true, default: false, index: true },
    published: { type: Boolean, required: true, default: false, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "destinations",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const DestinationModel: Model<IDestination> =
  mongoose.models.Destination || mongoose.model<IDestination>("Destination", destinationSchema);

export const Destination = DestinationModel;
export const destinationsTable = DestinationModel;

export const insertDestinationSchema = z.object({
  name: z.string(),
  slug: z.string(),
  region: z.string(),
  type: z.string(),
  description: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  galleryImages: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  bestSeason: z.string().optional().nullable(),
  elevation: z.string().optional().nullable(),
  nightsMin: z.number().optional().nullable(),
  nightsMax: z.number().optional().nullable(),
  highlights: z.string().optional().nullable(),
  howToReach: z.string().optional().nullable(),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
});

export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = IDestination;
