import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Global production-ready error handling middleware.
 * Ensures consistent JSON error responses and prevents server crashes or leaked stack traces.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isClientError =
    err.name === "ValidationError" ||
    err.name === "CastError" ||
    err.name === "ZodError";

  const statusCode = isClientError
    ? 400
    : typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      url: req.originalUrl,
      method: req.method,
    },
    "Unhandled error occurred processing request"
  );

  const isProduction = process.env.NODE_ENV === "production";
  const message = statusCode === 500 && isProduction
    ? "Internal server error"
    : err.message || "An unexpected error occurred";

  res.status(statusCode).json({
    error: message,
    ...(isProduction ? {} : { details: err.stack }),
  });
}
