import mongoose, { Schema, Model } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  {
    collection: "counters",
    versionKey: false,
    _id: false,
  }
);

export const CounterModel: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", counterSchema);

/**
 * Atomically increments and retrieves the next sequence ID for a given collection.
 */
export async function getNextSequence(sequenceName: string): Promise<number> {
  const result = await CounterModel.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result ? result.seq : 1;
}

/**
 * Ensures the sequence counter is at least `currentMax` to prevent ID collisions.
 */
export async function syncSequence(sequenceName: string, currentMax: number): Promise<void> {
  const existing = await CounterModel.findById(sequenceName);
  if (!existing || existing.seq < currentMax) {
    await CounterModel.findByIdAndUpdate(
      sequenceName,
      { $set: { seq: currentMax } },
      { upsert: true }
    );
  }
}
