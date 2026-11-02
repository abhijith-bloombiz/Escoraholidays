import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IHeroSlide {
  id: number;
  title: string;
  subtitle: string;
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  videoUrl: string;
  duration?: number;
  posterUrl?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type HeroSlideDoc = Document<unknown, {}, IHeroSlide> & IHeroSlide;

const heroSlideSchema = new Schema<IHeroSlide>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, default: "Hero Slide" },
    subtitle: { type: String, default: "" },
    eyebrow: { type: String, required: true, default: "GOD'S OWN COUNTRY" },
    headingLine1: { type: String, required: true },
    headingLine2: { type: String, required: true },
    videoUrl: { type: String, default: "/hero/15015065_1920_1080_60fps.mp4" },
    duration: { type: Number, default: 8 },
    posterUrl: { type: String, default: null },
    ctaText: { type: String, default: null },
    ctaLink: { type: String, default: null },
    published: { type: Boolean, required: true, default: true, index: true },
    sortOrder: { type: Number, required: true, default: 0, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "hero_slides",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const HeroSlideModel: Model<IHeroSlide> =
  mongoose.models.HeroSlide || mongoose.model<IHeroSlide>("HeroSlide", heroSlideSchema);

export const HeroSlide = HeroSlideModel;
export const heroSlidesTable = HeroSlideModel;

export interface IHeroCompanionCard {
  name: string;
  tag: string;
  coordinates: string;
  subtitle: string;
  image: string;
}

export interface IHeroConfig {
  id: string; // "default" singleton
  eyebrowBadge: string;
  showSearchBar: boolean;
  slideDuration: number;
  centerDestinationOverride?: IHeroCompanionCard | null;
  companionOverrides?: {
    topLeft?: IHeroCompanionCard | null;
    bottomLeft?: IHeroCompanionCard | null;
    topRight?: IHeroCompanionCard | null;
    bottomRight?: IHeroCompanionCard | null;
  } | null;
  updatedAt: Date;
}

export type HeroConfigDoc = Document<unknown, {}, IHeroConfig> & IHeroConfig;

const companionCardSchema = new Schema<IHeroCompanionCard>(
  {
    name: { type: String, default: "" },
    tag: { type: String, default: "" },
    coordinates: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const heroConfigSchema = new Schema<IHeroConfig>(
  {
    id: { type: String, required: true, unique: true, default: "default" },
    eyebrowBadge: { type: String, required: true, default: "GOD'S OWN COUNTRY" },
    showSearchBar: { type: Boolean, required: true, default: false },
    slideDuration: { type: Number, required: true, default: 7 },
    centerDestinationOverride: { type: companionCardSchema, default: null },
    companionOverrides: {
      type: {
        topLeft: { type: companionCardSchema, default: null },
        bottomLeft: { type: companionCardSchema, default: null },
        topRight: { type: companionCardSchema, default: null },
        bottomRight: { type: companionCardSchema, default: null },
      },
      default: null,
    },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "hero_config",
    versionKey: false,
  }
);

export const HeroConfigModel: Model<IHeroConfig> =
  mongoose.models.HeroConfig || mongoose.model<IHeroConfig>("HeroConfig", heroConfigSchema);

export const HeroConfig = HeroConfigModel;
export const heroConfigTable = HeroConfigModel;

export const insertHeroSlideSchema = z.object({
  title: z.string().optional().default("Hero Slide"),
  subtitle: z.string().optional().default(""),
  eyebrow: z.string().optional().default("GOD'S OWN COUNTRY"),
  headingLine1: z.string().min(1, "Heading Line 1 is required"),
  headingLine2: z.string().optional().default(""),
  videoUrl: z.string().optional().default("/hero/15015065_1920_1080_60fps.mp4"),
  duration: z.number().optional().default(8),
  posterUrl: z.string().optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaLink: z.string().optional().nullable(),
  published: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
