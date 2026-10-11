import mongoose, { ConnectOptions } from "mongoose";

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (uri && (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"))) {
    return uri;
  }
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  return "mongodb://localhost:27017/escora_dev";
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getConnectionState(): string {
  switch (mongoose.connection.readyState) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
}

const MONGOOSE_OPTIONS: ConnectOptions = {
  maxPoolSize: 50,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  autoIndex: process.env.NODE_ENV !== "production", // rely on explicit index creation in prod
  retryWrites: true,
};

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected()) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = getMongoUri();

  if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
    console.warn("[db] No MONGODB_URI set; using local development database: " + uri);
  }

  connectionPromise = mongoose
    .connect(uri, MONGOOSE_OPTIONS)
    .then((m) => {
      console.log(`[db] Connected to MongoDB host=${m.connection.host} db=${m.connection.name}`);
      return m;
    })
    .catch((err) => {
      connectionPromise = null;
      console.warn("[db] MongoDB connection failed:", err.message);
      throw err;
    });

  return connectionPromise;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connectionPromise = null;
    console.log("[db] Disconnected from MongoDB");
  }
}

mongoose.connection.on("disconnected", () => {
  connectionPromise = null;
  console.warn("[db] MongoDB connection lost");
});

mongoose.connection.on("error", (err) => {
  console.error("[db] MongoDB connection error:", err.message);
});

// Graceful shutdown on termination signals
const handleShutdown = async (signal: string) => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.log(`[db] Closed MongoDB connection on ${signal}`);
    } catch {
      // Ignored during process teardown
    }
  }
};

process.once("SIGINT", () => handleShutdown("SIGINT"));
process.once("SIGTERM", () => handleShutdown("SIGTERM"));
