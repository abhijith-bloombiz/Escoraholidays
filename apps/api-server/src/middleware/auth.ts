import type { Request, Response, NextFunction } from "express";

/**
 * Middleware requiring active admin session authentication.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if ((req.session as any)?.authenticated) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}
