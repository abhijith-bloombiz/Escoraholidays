import mongoose from "mongoose";
import { connectDB, getMongoUri, isConnected, disconnectDB, getConnectionState } from "./connection";
import * as models from "./models";

export * from "./models";
export * from "./connection";
export * from "./seeds/itinerary-templates-data";
export * from "./seeds/seed-templates";

// Auto-connect when imported if URI is provided, but allow offline mode without crashing
if (process.env.MONGODB_URI || process.env.DATABASE_URL) {
  connectDB().catch(() => {
    // Handled in connection listener, warnings logged
  });
} else {
  console.warn("[db] MONGODB_URI is not set. The server will start but database operations will fail until connected.");
}

export const db = mongoose;
export default mongoose;
