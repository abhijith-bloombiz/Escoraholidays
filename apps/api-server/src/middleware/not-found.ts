import type { Request, Response } from "express";

/**
 * 404 handler for unmatched API routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}
