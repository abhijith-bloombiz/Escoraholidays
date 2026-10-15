import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IInvoiceItem {
  description: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoiceBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch?: string;
  upiId?: string;
}

export interface IInvoice {
  id: number;
  invoiceNumber: string;
  orderId?: number | null;
  itineraryId?: number | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerGstin?: string | null;
  title: string;
  destination?: string | null;
  travelDates?: string | null;
  guestCount?: number | null;
  issueDate: string;
  dueDate?: string | null;
  status: string; // 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
  currency: string;
  items: string; // JSON string of IInvoiceItem[]
  subtotal: number;
  discount: number;
  discountType: string; // 'fixed' | 'percentage'
  taxRate: number; // percentage e.g. 5, 12, 18
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentTerms?: string | null;
  bankDetails?: string | null; // JSON string of IInvoiceBankDetails
  notes?: string | null;
  terms?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceDoc = Document<unknown, {}, IInvoice> & IInvoice;

const invoiceSchema = new Schema<IInvoice>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Number, default: null },
    itineraryId: { type: Number, default: null },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: null },
    customerPhone: { type: String, default: null },
    customerAddress: { type: String, default: null },
    customerGstin: { type: String, default: null },
    title: { type: String, required: true },
    destination: { type: String, default: null },
    travelDates: { type: String, default: null },
    guestCount: { type: Number, default: null },
    issueDate: { type: String, required: true },
    dueDate: { type: String, default: null },
    status: { type: String, required: true, default: "issued", index: true },
    currency: { type: String, required: true, default: "INR" },
    items: { type: String, required: true, default: "[]" },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    discountType: { type: String, required: true, default: "fixed" },
    taxRate: { type: Number, required: true, default: 5 },
    taxAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    balanceDue: { type: Number, required: true, default: 0 },
    paymentTerms: { type: String, default: null },
    bankDetails: { type: String, default: null },
    notes: { type: String, default: null },
    terms: { type: String, default: null },
    createdBy: { type: String, default: null },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "invoices",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export const InvoiceModel: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", invoiceSchema);

export const Invoice = InvoiceModel;
export const invoicesTable = InvoiceModel;

export const insertInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  orderId: z.number().optional().nullable(),
  itineraryId: z.number().optional().nullable(),
  customerName: z.string(),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  customerGstin: z.string().optional().nullable(),
  title: z.string(),
  destination: z.string().optional().nullable(),
  travelDates: z.string().optional().nullable(),
  guestCount: z.number().optional().nullable(),
  issueDate: z.string(),
  dueDate: z.string().optional().nullable(),
  status: z.string().optional().default("issued"),
  currency: z.string().optional().default("INR"),
  items: z.string().optional().default("[]"),
  subtotal: z.number().optional().default(0),
  discount: z.number().optional().default(0),
  discountType: z.string().optional().default("fixed"),
  taxRate: z.number().optional().default(5),
  taxAmount: z.number().optional().default(0),
  totalAmount: z.number().optional().default(0),
  paidAmount: z.number().optional().default(0),
  balanceDue: z.number().optional().default(0),
  paymentTerms: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = IInvoice;
