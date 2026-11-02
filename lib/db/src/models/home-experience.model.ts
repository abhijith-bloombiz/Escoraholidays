import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IHomeExperienceCard {
  id: number;
  slot: number; // 1, 2, 3, 4
  title: string;
  tag: string;
  location: string;
  duration: string;
  desc: string;
  inclusion: string;
  videoUrl: string;
  posterUrl?: string | null;
  experienceSlug?: string | null;
  ctaText?: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type HomeExperienceCardDoc = Document<unknown, {}, IHomeExperienceCard> & IHomeExperienceCard;

const homeExperienceCardSchema = new Schema<IHomeExperienceCard>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    slot: { type: Number, required: true, unique: true, min: 1, max: 4, index: true },
    title: { type: String, required: true },
    tag: { type: String, required: true, default: "Signature Experience" },
    location: { type: String, required: true, default: "Kerala" },
    duration: { type: String, required: true, default: "Half Day" },
    desc: { type: String, required: true, default: "" },
    inclusion: { type: String, required: true, default: "" },
    videoUrl: { type: String, required: true, default: "/Experience-section/12881094-hd_1920_1080_30fps.mp4" },
    posterUrl: { type: String, default: null },
    experienceSlug: { type: String, default: null },
    ctaText: { type: String, default: "Curate This Experience" },
    published: { type: Boolean, required: true, default: true, index: true },
    sortOrder: { type: Number, required: true, default: 1 },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "home_experience_cards",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const HomeExperienceCardModel: Model<IHomeExperienceCard> =
  mongoose.models.HomeExperienceCard ||
  mongoose.model<IHomeExperienceCard>("HomeExperienceCard", homeExperienceCardSchema);

export const HomeExperienceCard = HomeExperienceCardModel;

export const insertHomeExperienceCardSchema = z.object({
  slot: z.number().int().min(1).max(4),
  title: z.string().min(1, "Title is required"),
  tag: z.string().default("Signature Experience"),
  location: z.string().default("Kerala"),
  duration: z.string().default("Half Day"),
  desc: z.string().default(""),
  inclusion: z.string().default(""),
  videoUrl: z.string().min(1, "Video URL is required"),
  posterUrl: z.string().optional().nullable(),
  experienceSlug: z.string().optional().nullable(),
  ctaText: z.string().optional().nullable().default("Curate This Experience"),
  published: z.boolean().optional().default(true),
  sortOrder: z.number().optional(),
});

export const updateHomeExperienceCardSchema = insertHomeExperienceCardSchema.partial();
