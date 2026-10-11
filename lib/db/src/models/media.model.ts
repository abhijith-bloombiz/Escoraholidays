import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IMedia {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes?: number | null;
  createdAt: Date;
}

export type MediaDoc = Document<unknown, {}, IMedia> & IMedia;

const mediaSchema = new Schema<IMedia>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, default: null },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  {
    collection: "media",
    timestamps: false,
    versionKey: false,
  }
);

export const MediaModel: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>("Media", mediaSchema);

export const Media = MediaModel;
export const mediaTable = MediaModel;

export const insertMediaSchema = z.object({
  filename: z.string(),
  url: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().optional().nullable(),
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = IMedia;
