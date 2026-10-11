import app from "./app";
import { config } from "./config/env";
import { logger } from "./lib/logger";
import { connectDB, disconnectDB } from "@workspace/db";

async function bootstrap() {
  try {
    await connectDB();
    logger.info("Connected to MongoDB successfully");
  } catch (err) {
    logger.error({ err }, "Initial database connection failed; will retry on incoming requests");
  }

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, "Escora Holidays API Server started");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down HTTP server...");
    server.close(async () => {
      logger.info("HTTP server closed");
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "Fatal error during server startup");
  process.exit(1);
});

