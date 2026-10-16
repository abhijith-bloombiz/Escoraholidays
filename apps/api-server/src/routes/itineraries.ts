import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { nanoid } from "nanoid";
import { ItineraryModel, getNextSequence } from "@workspace/db";
import {
  ListItinerariesQueryParams,
  ListItinerariesResponse,
  CreateItineraryBody,
  GetItineraryParams,
  GetItineraryResponse,
  GetItineraryByShareTokenParams,
  GetItineraryByShareTokenResponse,
  UpdateItineraryParams,
  UpdateItineraryBody,
  UpdateItineraryResponse,
  DeleteItineraryParams,
  AssistItineraryBody,
} from "@workspace/api-zod";
import { createRateLimiter } from "../middleware/rate-limiter";
import { assistItinerary } from "../services/ai/itinerary-assistant";
import { aiService } from "../services/ai/ai-service";
import { AiServiceError } from "../services/ai/types";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const itineraryAiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many AI assistant requests. Please wait a moment before trying again.",
});

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/itineraries", async (req, res, next): Promise<void> => {
  const query = ListItinerariesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.status !== undefined) {
    filter.status = query.data.status;
  }

  try {
    const itineraries = await ItineraryModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(ListItinerariesResponse.parse(itineraries.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

const VALID_ITINERARY_STATUSES = ["draft", "shared", "confirmed", "archived"] as const;

router.post("/itineraries", async (req, res, next): Promise<void> => {
  const parsed = CreateItineraryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.customerName?.trim()) {
    res.status(400).json({ error: "Customer name cannot be empty" });
    return;
  }
  if (!parsed.data.title?.trim()) {
    res.status(400).json({ error: "Itinerary title cannot be empty" });
    return;
  }
  if (
    parsed.data.status !== undefined &&
    !VALID_ITINERARY_STATUSES.includes(parsed.data.status as any)
  ) {
    res.status(400).json({
      error: `Invalid status "${parsed.data.status}". Supported statuses: ${VALID_ITINERARY_STATUSES.join(", ")}`,
    });
    return;
  }

  try {
    const id = await getNextSequence("itineraries");
    const itinerary = await ItineraryModel.create({
      ...parsed.data,
      id,
      shareToken: nanoid(),
    });
    res.status(201).json(GetItineraryResponse.parse(serializeDates(itinerary.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/itineraries/share/:token", async (req, res): Promise<void> => {
  const params = GetItineraryByShareTokenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const itinerary = await ItineraryModel.findOne({ shareToken: params.data.token }).lean();
    if (!itinerary) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }

    // Public share links are only active when status is "shared" or "confirmed".
    // Authenticated admin sessions are permitted to preview draft or archived itineraries.
    const isAuthenticatedAdmin = Boolean((req.session as any)?.authenticated);
    const isPubliclyShared = itinerary.status === "shared" || itinerary.status === "confirmed";

    if (!isPubliclyShared && !isAuthenticatedAdmin) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }

    res.json(GetItineraryByShareTokenResponse.parse(serializeDates(itinerary)));
  } catch {
    res.status(404).json({ error: "Itinerary not found" });
  }
});

router.get("/itineraries/:id", async (req, res): Promise<void> => {
  const params = GetItineraryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const itinerary = await ItineraryModel.findOne({ id: params.data.id }).lean();
    if (!itinerary) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }
    res.json(GetItineraryResponse.parse(serializeDates(itinerary)));
  } catch {
    res.status(404).json({ error: "Itinerary not found" });
  }
});

router.patch("/itineraries/:id", async (req, res, next): Promise<void> => {
  const params = UpdateItineraryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateItineraryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (
    parsed.data.status !== undefined &&
    !VALID_ITINERARY_STATUSES.includes(parsed.data.status as any)
  ) {
    res.status(400).json({
      error: `Invalid status "${parsed.data.status}". Supported statuses: ${VALID_ITINERARY_STATUSES.join(", ")}`,
    });
    return;
  }
  if (parsed.data.customerName !== undefined && !parsed.data.customerName.trim()) {
    res.status(400).json({ error: "Customer name cannot be empty" });
    return;
  }
  if (parsed.data.title !== undefined && !parsed.data.title.trim()) {
    res.status(400).json({ error: "Itinerary title cannot be empty" });
    return;
  }

  try {
    const itinerary = await ItineraryModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!itinerary) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }
    res.json(UpdateItineraryResponse.parse(serializeDates(itinerary)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/itineraries/:id", async (req, res, next): Promise<void> => {
  const params = DeleteItineraryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const itinerary = await ItineraryModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!itinerary) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/itineraries/ai-assist
 * Admin AI Itinerary Assistant:
 * Generates or refines day-by-day slow-luxury proposal draft grounded in Escora catalogue.
 * Requires authenticated admin session.
 */
router.post(
  "/itineraries/ai-assist",
  itineraryAiRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const bodyParsed = AssistItineraryBody.safeParse(req.body || {});
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }

    try {
      if (!aiService.isConfigured()) {
        res.status(503).json({
          error: "The Escora AI Itinerary Assistant is currently offline for maintenance.",
          code: "MISSING_CONFIG",
        });
        return;
      }

      const result = await assistItinerary(bodyParsed.data);
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

      logger.warn({ err: err?.message }, "[ItineraryRoute] Unexpected error during AI itinerary assistance");
      res.status(500).json({
        error: "An unexpected error occurred while processing the itinerary assistant request.",
      });
    }
  }
);

export default router;

