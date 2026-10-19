import mongoose, { Schema, Document, Model } from "mongoose";

export type AudienceGroupType = "manual" | "dynamic";

export interface IAudienceGroupMember {
  email: string;
  name?: string | null;
  source?: string | null;
  addedAt: Date;
}

export interface IDynamicGroupRules {
  destinations?: string[];
  travelStyle?: string | null;
  customerStatus?: Array<"enquiry" | "confirmed" | "completed" | "cancelled">;
  minBookings?: number;
  inactiveDays?: number;
}

export interface IAudienceGroup {
  id: number;
  name: string;
  description?: string | null;
  type: AudienceGroupType;
  members: IAudienceGroupMember[];
  rules?: IDynamicGroupRules;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AudienceGroupDoc = Document<unknown, {}, IAudienceGroup> & IAudienceGroup;

const audienceGroupMemberSchema = new Schema<IAudienceGroupMember>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: null },
    source: { type: String, default: "manual" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const dynamicGroupRulesSchema = new Schema<IDynamicGroupRules>(
  {
    destinations: { type: [String], default: [] },
    travelStyle: { type: String, default: null },
    customerStatus: { type: [String], default: [] },
    minBookings: { type: Number, default: 0 },
    inactiveDays: { type: Number, default: null },
  },
  { _id: false }
);

const audienceGroupSchema = new Schema<IAudienceGroup>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["manual", "dynamic"],
      default: "manual",
      index: true,
    },
    members: { type: [audienceGroupMemberSchema], default: [] },
    rules: { type: dynamicGroupRulesSchema, default: {} },
    isArchived: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "audience_groups",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

audienceGroupSchema.index({ type: 1, isArchived: 1 });

export const AudienceGroupModel: Model<IAudienceGroup> =
  mongoose.models.AudienceGroup ||
  mongoose.model<IAudienceGroup>("AudienceGroup", audienceGroupSchema);

export const AudienceGroup = AudienceGroupModel;
