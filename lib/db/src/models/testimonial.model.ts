import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface ITestimonial {
  id: number;
  name: string;
  quote: string;
  category?: string | null;
  dateLabel?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  photoAlt?: string | null;
  rating: number;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TestimonialDoc = Document<unknown, {}, ITestimonial> & ITestimonial;

const testimonialSchema = new Schema<ITestimonial>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    quote: { type: String, required: true, trim: true },
    category: { type: String, default: null, trim: true },
    dateLabel: { type: String, default: null, trim: true },
    location: { type: String, default: null, trim: true },
    avatarUrl: { type: String, default: null },
    photoUrl: { type: String, default: null },
    photoAlt: { type: String, default: null, trim: true },
    rating: { type: Number, required: true, default: 5, min: 1, max: 5 },
    sortOrder: { type: Number, required: true, default: 0, index: true },
    published: { type: Boolean, required: true, default: true, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "testimonials",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const TestimonialModel: Model<ITestimonial> =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", testimonialSchema);

export const Testimonial = TestimonialModel;
export const testimonialsTable = TestimonialModel;

export const insertTestimonialSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  quote: z.string().min(1, "Testimonial quote is required"),
  category: z.string().optional().nullable(),
  dateLabel: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  photoAlt: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().default(5),
  sortOrder: z.number().int().optional().default(0),
  published: z.boolean().optional().default(true),
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = ITestimonial;
