import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IExperienceDestination {
  name: string;
  slug: string;
}

export interface IExperience {
  id: number;
  slug: string;
  title: string;
  category: string;
  tagline?: string | null;
  duration?: string | null;
  intensity?: string | null;
  bestTime?: string | null;
  vibe?: string | null;
  heroImage?: string | null;
  gallery: string[];
  story?: string | null;
  highlights: string[];
  inclusions: string[];
  destinations: IExperienceDestination[];
  conciergeTip?: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ExperienceDoc = Document<unknown, {}, IExperience> & IExperience;

const experienceDestinationSchema = new Schema<IExperienceDestination>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false }
);

const experienceSchema = new Schema<IExperience>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    tagline: { type: String, default: null },
    duration: { type: String, default: null },
    intensity: { type: String, default: null },
    bestTime: { type: String, default: null },
    vibe: { type: String, default: null },
    heroImage: { type: String, default: null },
    gallery: { type: [String], default: [] },
    story: { type: String, default: null },
    highlights: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    destinations: { type: [experienceDestinationSchema], default: [] },
    conciergeTip: { type: String, default: null },
    featured: { type: Boolean, required: true, default: true, index: true },
    published: { type: Boolean, required: true, default: true, index: true },
    sortOrder: { type: Number, required: true, default: 0, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "experiences",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const ExperienceModel: Model<IExperience> =
  mongoose.models.Experience || mongoose.model<IExperience>("Experience", experienceSchema);

export const Experience = ExperienceModel;
export const experiencesTable = ExperienceModel;

export const insertExperienceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  category: z.string().min(1, "Category is required"),
  tagline: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  intensity: z.string().optional().nullable(),
  bestTime: z.string().optional().nullable(),
  vibe: z.string().optional().nullable(),
  heroImage: z.string().optional().nullable(),
  gallery: z.array(z.string()).optional().default([]),
  story: z.string().optional().nullable(),
  highlights: z.array(z.string()).optional().default([]),
  inclusions: z.array(z.string()).optional().default([]),
  destinations: z.array(z.object({ name: z.string(), slug: z.string() })).optional().default([]),
  conciergeTip: z.string().optional().nullable(),
  featured: z.boolean().optional().default(true),
  published: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = IExperience;
