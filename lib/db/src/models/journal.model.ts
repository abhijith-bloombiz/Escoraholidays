import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IJournalPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt?: string | null;
  content?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  authorImageUrl?: string | null;
  imageUrl?: string | null;
  readTimeMinutes?: number | null;
  tags?: string | null;
  published: boolean;
  publishedAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type JournalPostDoc = Document<unknown, {}, IJournalPost> & IJournalPost;

const journalPostSchema = new Schema<IJournalPost>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    excerpt: { type: String, default: null },
    content: { type: String, default: null },
    authorName: { type: String, default: null },
    authorRole: { type: String, default: null },
    authorImageUrl: { type: String, default: null },
    imageUrl: { type: String, default: null },
    readTimeMinutes: { type: Number, default: null },
    tags: { type: String, default: null },
    published: { type: Boolean, required: true, default: true, index: true },
    publishedAt: { type: String, default: null },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "journal_posts",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const JournalPostModel: Model<IJournalPost> =
  mongoose.models.JournalPost || mongoose.model<IJournalPost>("JournalPost", journalPostSchema);

export const JournalPost = JournalPostModel;
export const journalPostsTable = JournalPostModel;

export const insertJournalPostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  authorRole: z.string().optional().nullable(),
  authorImageUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  readTimeMinutes: z.number().optional().nullable(),
  tags: z.string().optional().nullable(),
  published: z.boolean().optional().default(true),
  publishedAt: z.string().optional().nullable(),
});

export type InsertJournalPost = z.infer<typeof insertJournalPostSchema>;
export type JournalPost = IJournalPost;
