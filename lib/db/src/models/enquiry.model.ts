import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IEnquiry {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
  bookingId?: number | null;
  bookingReference?: string | null;
  convertedAt?: Date | null;
  convertedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EnquiryDoc = Document<unknown, {}, IEnquiry> & IEnquiry;

const enquirySchema = new Schema<IEnquiry>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: null },
    message: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "new",
      enum: ["new", "read", "replied", "converted"],
      index: true,
    },
    bookingId: { type: Number, default: null, index: true },
    bookingReference: { type: String, default: null },
    convertedAt: { type: Date, default: null },
    convertedBy: { type: String, default: null },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "enquiries",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const EnquiryModel: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>("Enquiry", enquirySchema);

export const Enquiry = EnquiryModel;
export const enquiriesTable = EnquiryModel;

export const insertEnquirySchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional().nullable(),
  message: z.string(),
  status: z.string().optional().default("new"),
  bookingId: z.number().optional().nullable(),
  bookingReference: z.string().optional().nullable(),
  convertedAt: z.date().optional().nullable(),
  convertedBy: z.string().optional().nullable(),
});

export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;
export type Enquiry = IEnquiry;
