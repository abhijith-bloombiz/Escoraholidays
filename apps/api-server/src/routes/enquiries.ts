import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { EnquiryModel, getNextSequence } from "@workspace/db";
import {
  ListEnquiriesQueryParams,
  ListEnquiriesResponse,
  CreateEnquiryBody,
  GetEnquiryParams,
  GetEnquiryResponse,
  UpdateEnquiryParams,
  UpdateEnquiryBody,
  UpdateEnquiryResponse,
  DeleteEnquiryParams,
  AssistEnquiryParams,
  AssistEnquiryBody,
  AssistEnquiryResponse,
} from "@workspace/api-zod";
import { sendContactConfirmation, sendAdminContactNotification } from "../lib/email";
import { aiService, AiServiceError, assistEnquiry } from "../services/ai";
import { createRateLimiter } from "../middleware/rate-limiter";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const enquiryAiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many AI assistant requests. Please wait a moment before trying again.",
});

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

const VALID_ENQUIRY_STATUSES = ["new", "read", "replied"] as const;

router.post("/enquiries", async (req, res, next): Promise<void> => {
  const parsed = CreateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.name?.trim()) {
    res.status(400).json({ error: "Name cannot be empty" });
    return;
  }
  if (!parsed.data.email?.trim()) {
    res.status(400).json({ error: "Email cannot be empty" });
    return;
  }
  if (!parsed.data.message?.trim()) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  try {
    const id = await getNextSequence("enquiries");
    const enquiryDoc = await EnquiryModel.create({ ...parsed.data, id });
    const enquiry = enquiryDoc.toObject();
    const serialized = serializeDates(enquiry);

    // Send emails asynchronously — don't block the response
    Promise.all([
      sendContactConfirmation(enquiry),
      sendAdminContactNotification(enquiry),
    ]).catch(() => { /* non-fatal */ });

    res.status(201).json(GetEnquiryResponse.parse(serialized));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/enquiries", async (req, res, next): Promise<void> => {
  const query = ListEnquiriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.status) {
    filter.status = query.data.status;
  }

  try {
    const rows = await EnquiryModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(ListEnquiriesResponse.parse(rows.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

router.get("/enquiries/:id", async (req, res): Promise<void> => {
  const params = GetEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const row = await EnquiryModel.findOne({ id: params.data.id }).lean();
    if (!row) {
      res.status(404).json({ error: "Enquiry not found" });
      return;
    }
    res.json(GetEnquiryResponse.parse(serializeDates(row)));
  } catch {
    res.status(404).json({ error: "Enquiry not found" });
  }
});

router.patch("/enquiries/:id", async (req, res, next): Promise<void> => {
  const params = UpdateEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (
    parsed.data.status !== undefined &&
    !VALID_ENQUIRY_STATUSES.includes(parsed.data.status as any)
  ) {
    res.status(400).json({
      error: `Invalid status "${parsed.data.status}". Supported statuses: ${VALID_ENQUIRY_STATUSES.join(", ")}`,
    });
    return;
  }

  try {
    const row = await EnquiryModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!row) {
      res.status(404).json({ error: "Enquiry not found" });
      return;
    }
    res.json(UpdateEnquiryResponse.parse(serializeDates(row)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/enquiries/:id", async (req, res, next): Promise<void> => {
  const params = DeleteEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const row = await EnquiryModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!row) {
      res.status(404).json({ error: "Enquiry not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/enquiries/:id/ai-assist
 * Admin AI Enquiry Assistant:
 * Analyzes the enquiry, extracts verified facts, drafts personalized slow-luxury reply,
 * and recommends next actions. Requires authenticated admin session.
 */
router.post(
  "/enquiries/:id/ai-assist",
  enquiryAiRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params = AssistEnquiryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const bodyParsed = AssistEnquiryBody.safeParse(req.body || {});
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }

    try {
      const enquiry = await EnquiryModel.findOne({ id: params.data.id }).lean();
      if (!enquiry) {
        res.status(404).json({ error: "Enquiry not found" });
        return;
      }

      if (!aiService.isConfigured()) {
        res.status(503).json({
          error: "The Escora AI Enquiry Assistant is currently offline for maintenance.",
          code: "MISSING_CONFIG",
        });
        return;
      }

      const result = await assistEnquiry({
        enquiry: {
          id: enquiry.id,
          name: enquiry.name,
          email: enquiry.email,
          phone: enquiry.phone,
          message: enquiry.message,
          status: enquiry.status,
          createdAt: enquiry.createdAt,
        },
        focusPrompt: bodyParsed.data.focusPrompt,
        replyTone: bodyParsed.data.replyTone,
      });

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

      logger.warn({ err: err?.message }, "[EnquiryRoute] Unexpected error during AI assistance");
      res.status(500).json({
        error: "An unexpected error occurred while processing the enquiry assistant request.",
      });
    }
  }
);

export default router;
