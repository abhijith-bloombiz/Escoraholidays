import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { JournalPostModel, getNextSequence } from "@workspace/db";
import {
  ListJournalPostsQueryParams,
  ListJournalPostsResponse,
  CreateJournalPostBody,
  GetJournalPostResponse,
  UpdateJournalPostParams,
  UpdateJournalPostBody,
  UpdateJournalPostResponse,
  DeleteJournalPostParams,
  AssistJournalPostBody,
  type JournalAiAssistResponse,
} from "@workspace/api-zod";
import { aiService, AiServiceError, assistJournalPost } from "../services/ai";
import { createRateLimiter } from "../middleware/rate-limiter";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Rate limiting for Journal AI Content Assistant: max 30 requests per minute per IP
const journalAiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many AI assistant requests. Please wait a moment before trying again.",
});

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/journal", async (req, res, next): Promise<void> => {
  const query = ListJournalPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.category !== undefined) {
    filter.category = query.data.category;
  }
  if (query.data.published !== undefined) {
    filter.published = query.data.published;
  }
  if (query.data.tag !== undefined) {
    filter.tags = { $regex: query.data.tag, $options: "i" };
  }

  try {
    const posts = await JournalPostModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(ListJournalPostsResponse.parse(posts.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

router.post("/journal", async (req, res, next): Promise<void> => {
  const parsed = CreateJournalPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.title?.trim()) {
    res.status(400).json({ error: "Journal title cannot be empty" });
    return;
  }
  if (!parsed.data.slug?.trim()) {
    res.status(400).json({ error: "Journal slug cannot be empty" });
    return;
  }
  if (!parsed.data.category?.trim()) {
    res.status(400).json({ error: "Journal category cannot be empty" });
    return;
  }
  if (
    parsed.data.readTimeMinutes !== undefined &&
    parsed.data.readTimeMinutes !== null &&
    (!Number.isInteger(parsed.data.readTimeMinutes) || parsed.data.readTimeMinutes < 1)
  ) {
    res.status(400).json({ error: "readTimeMinutes must be an integer of at least 1" });
    return;
  }

  try {
    const id = await getNextSequence("journal_posts");
    const post = await JournalPostModel.create({ ...parsed.data, id });
    res.status(201).json(GetJournalPostResponse.parse(serializeDates(post.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/journal/:id", async (req, res, next): Promise<void> => {
  const rawId = req.params.id;
  if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
    res.status(404).json({ error: "Journal post not found" });
    return;
  }

  const isNumeric = /^\d+$/.test(rawId);
  const filter: Record<string, any> = isNumeric
    ? { $or: [{ id: Number(rawId) }, { slug: rawId }] }
    : { slug: rawId };

  const isAdmin = Boolean((req.session as any)?.authenticated);
  if (!isAdmin) {
    filter.published = true;
  }

  try {
    const post = await JournalPostModel.findOne(filter).lean();
    if (!post) {
      res.status(404).json({ error: "Journal post not found" });
      return;
    }
    res.json(GetJournalPostResponse.parse(serializeDates(post)));
  } catch (err) {
    next(err);
  }
});

router.patch("/journal/:id", async (req, res, next): Promise<void> => {
  const params = UpdateJournalPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateJournalPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.title !== undefined && !parsed.data.title.trim()) {
    res.status(400).json({ error: "Journal title cannot be empty" });
    return;
  }
  if (parsed.data.slug !== undefined && !parsed.data.slug.trim()) {
    res.status(400).json({ error: "Journal slug cannot be empty" });
    return;
  }
  if (parsed.data.category !== undefined && !parsed.data.category.trim()) {
    res.status(400).json({ error: "Journal category cannot be empty" });
    return;
  }
  if (
    parsed.data.readTimeMinutes !== undefined &&
    parsed.data.readTimeMinutes !== null &&
    (!Number.isInteger(parsed.data.readTimeMinutes) || parsed.data.readTimeMinutes < 1)
  ) {
    res.status(400).json({ error: "readTimeMinutes must be an integer of at least 1" });
    return;
  }

  try {
    const post = await JournalPostModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!post) {
      res.status(404).json({ error: "Journal post not found" });
      return;
    }
    res.json(UpdateJournalPostResponse.parse(serializeDates(post)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/journal/:id", async (req, res, next): Promise<void> => {
  const params = DeleteJournalPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const post = await JournalPostModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!post) {
      res.status(404).json({ error: "Journal post not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/journal/ai-assist
 * Admin AI Content Assistant:
 * Generates drafts, suggests titles/excerpts/intros, rewrites, expands, shortens,
 * refines, and generates SEO metadata grounded in Escora catalogue.
 * Requires authenticated admin session.
 */
router.post(
  "/journal/ai-assist",
  journalAiRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const bodyParsed = AssistJournalPostBody.safeParse(req.body || {});
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }

    try {
      if (!aiService.isConfigured()) {
        res.status(503).json({
          error: "The Escora AI Content Assistant is currently offline for maintenance.",
          code: "MISSING_CONFIG",
        });
        return;
      }

      const result = await assistJournalPost(bodyParsed.data);
      res.json(result);
    } catch (err: any) {
      if (err instanceof AiServiceError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          provider: err.provider,
        });
        return;
      }

      logger.warn({ err: err?.message }, "[JournalRoute] Unexpected error during AI content assistance");
      res.status(500).json({
        error: "An unexpected error occurred while processing the journal assistant request.",
      });
    }
  }
);

export default router;

