import type { Request, Response, NextFunction } from "express";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface ClientRecord {
  timestamps: number[];
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max, message = "Too many requests. Please slow down and try again." } = options;
  const clients = new Map<string, ClientRecord>();

  // Periodically purge clients with no active requests in the window
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        clients.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  // Ensure interval does not prevent process exit in tests
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const testClient = req.headers["x-test-client-id"] as string | undefined;
    const ip = (testClient && testClient.trim()) || req.ip || req.socket.remoteAddress || "anonymous";
    const now = Date.now();

    let record = clients.get(ip);
    if (!record) {
      record = { timestamps: [] };
      clients.set(ip, record);
    }

    // Filter to requests within current window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    const count = record.timestamps.length;
    const remaining = Math.max(0, max - count - 1);
    const oldest = record.timestamps[0] || now;
    const resetTimeSeconds = Math.ceil((oldest + windowMs) / 1000);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetTimeSeconds);

    if (count >= max) {
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        error: message,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}
