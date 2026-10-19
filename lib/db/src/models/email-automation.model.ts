import mongoose, { Schema, Document, Model } from "mongoose";

export type AutomationTrigger =
  | "enquiry_submitted"
  | "booking_confirmed"
  | "payment_succeeded"
  | "payment_reminder_due"
  | "pre_trip_departure"
  | "travel_documents_ready"
  | "enquiry_unconverted"
  | "trip_completed"
  | "itinerary_amended"
  | "operational_alert";

export type AutomationCategory = "transactional" | "scheduled" | "operational";

export interface IEmailAutomation {
  id: string;
  name: string;
  category: AutomationCategory;
  trigger: AutomationTrigger;
  triggerDescription: string;
  templateId: string;
  templateName: string;
  recipientLogic: string;
  timingType: "immediate" | "delay";
  delayValue: number;
  delayUnit: "hours" | "days" | "minutes";
  requiresApproval: boolean;
  enabled: boolean;
  conditions?: {
    minAmount?: number;
    destinations?: string[];
    customerStatus?: string;
  };
  lastExecutedAt?: Date | null;
  lastExecutionStatus?: "success" | "failed" | "skipped" | null;
  lastExecutionError?: string | null;
  nextScheduledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export type EmailAutomationDoc = Document<unknown, {}, IEmailAutomation> & IEmailAutomation;

const emailAutomationSchema = new Schema<IEmailAutomation>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["transactional", "scheduled", "operational"],
      default: "transactional",
    },
    trigger: {
      type: String,
      required: true,
      index: true,
    },
    triggerDescription: { type: String, required: true },
    templateId: { type: String, required: true },
    templateName: { type: String, required: true },
    recipientLogic: { type: String, required: true },
    timingType: {
      type: String,
      enum: ["immediate", "delay"],
      default: "immediate",
    },
    delayValue: { type: Number, default: 0 },
    delayUnit: {
      type: String,
      enum: ["hours", "days", "minutes"],
      default: "hours",
    },
    requiresApproval: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true, index: true },
    conditions: {
      minAmount: { type: Number, default: null },
      destinations: { type: [String], default: [] },
      customerStatus: { type: String, default: null },
    },
    lastExecutedAt: { type: Date, default: null },
    lastExecutionStatus: { type: String, default: null },
    lastExecutionError: { type: String, default: null },
    nextScheduledAt: { type: Date, default: null },
    updatedBy: { type: String, default: null },
  },
  {
    collection: "email_automations",
    timestamps: true,
    versionKey: false,
  }
);

export const EmailAutomationModel: Model<IEmailAutomation> =
  mongoose.models.EmailAutomation ||
  mongoose.model<IEmailAutomation>("EmailAutomation", emailAutomationSchema);

export const EmailAutomation = EmailAutomationModel;
