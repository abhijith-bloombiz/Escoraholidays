import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  GetAiStatusResponse,
  GenerateAiResponseBody,
  GenerateAiResponseResponse,
  AskAiAssistantBody,
  AskAiAssistantResponse,
  GenerateTripPlanBody,
} from "@workspace/api-zod";
import { aiService, AiServiceError, buildEscoraGroundingContext, planEscoraTrip, type AiMessage } from "../services/ai";
import { createRateLimiter } from "../middleware/rate-limiter";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Rate limiting for AI endpoints: max 30 requests per minute per IP
const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many AI requests. Please slow down and try again.",
});

/**
 * GET /api/ai/status
 * Returns current configuration, provider name, model, and operational availability.
 * Never throws or leaks secrets.
 */
router.get("/ai/status", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await aiService.getStatus();
    res.json(GetAiStatusResponse.parse(status));
  } catch (err) {
    logger.warn({ err }, "[AI Route] Unexpected error checking status");
    res.status(500).json({
      configured: false,
      provider: aiService.getProviderName(),
      model: "unknown",
      available: false,
      message: "Internal error retrieving AI service status.",
    });
  }
});

/**
 * POST /api/ai/generate
 * Direct structured generation endpoint for general/future backend tasks.
 * Validates request body, enforces rate limiting, and returns structured responses.
 */
router.post(
  "/ai/generate",
  aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = GenerateAiResponseBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid request payload.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        });
        return;
      }

      const { prompt, messages, systemPrompt, maxTokens, temperature } = parsed.data;

      if (!prompt?.trim() && (!messages || messages.length === 0)) {
        res.status(400).json({
          error: "Either 'prompt' or a non-empty 'messages' list is required.",
        });
        return;
      }

      const result = await aiService.generate({
        prompt: prompt?.trim(),
        messages: messages?.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content.trim(),
        })),
        systemPrompt: systemPrompt?.trim(),
        maxTokens,
        temperature,
      });

      res.json(GenerateAiResponseResponse.parse(result));
    } catch (err: any) {
      if (err instanceof AiServiceError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          provider: err.provider,
        });
        return;
      }

      logger.warn({ err: err?.message }, "[AI Route] Unexpected error during AI generation");
      res.status(500).json({
        error: "An unexpected error occurred while processing the AI request.",
      });
    }
  }
);

/**
 * POST /api/ai/assistant
 * Dedicated public Escora Travel Assistant conversation endpoint.
 * Grounded strictly in approved, published Escora destinations and journeys.
 */
router.post(
  "/ai/assistant",
  aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AskAiAssistantBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid request payload.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        });
        return;
      }

      const userMessage = parsed.data.message.trim();
      if (!userMessage) {
        res.status(400).json({
          error: "Message cannot be empty.",
        });
        return;
      }

      // Check service availability before processing
      if (!aiService.isConfigured()) {
        res.status(503).json({
          error:
            "The Escora AI Travel Assistant is currently offline for maintenance. Please explore our curated journeys or connect directly with our travel designers.",
          code: "MISSING_CONFIG",
        });
        return;
      }

      // Sanitize recent history turns (keep last 6 messages to stay token-bounded)
      const rawHistory = parsed.data.history || [];
      const sanitizedHistory: AiMessage[] = rawHistory.slice(-6).map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content.slice(0, 2000).trim(),
      }));

      // Grounding Context Builder: extracts relevant published destinations & packages
      const grounding = await buildEscoraGroundingContext(userMessage, sanitizedHistory);

      // Generate response via provider
      const result = await aiService.generate({
        messages: [
          ...sanitizedHistory,
          { role: "user", content: userMessage },
        ],
        systemPrompt: grounding.systemPrompt,
        maxTokens: 800,
        temperature: 0.6,
      });

      res.json(
        AskAiAssistantResponse.parse({
          message: result.content,
          provider: result.provider,
          model: result.model,
          suggestions: grounding.suggestions,
          groundedEntities: grounding.groundedEntities,
        })
      );
    } catch (err: any) {
      if (err instanceof AiServiceError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          provider: err.provider,
        });
        return;
      }

      logger.warn({ err: err?.message }, "[AI Route] Unexpected error during assistant conversation");
      res.status(500).json({
        error: "An unexpected error occurred while communicating with the travel assistant.",
      });
    }
  }
);

/**
 * POST /api/ai/plan
 * Dedicated AI Trip Planner endpoint.
 * Generates and refines bespoke slow-luxury Kerala itineraries grounded strictly in verified published records.
 */
router.post(
  "/ai/plan",
  aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = GenerateTripPlanBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid trip planning request.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        });
        return;
      }

      if (!aiService.isConfigured()) {
        res.status(503).json({
          error:
            "The Escora AI Trip Planner is temporarily offline for maintenance. Please explore our curated journeys or connect directly with our travel designers.",
          code: "MISSING_CONFIG",
        });
        return;
      }

      const planResult = await planEscoraTrip(parsed.data);

      res.json(planResult);
    } catch (err: any) {
      if (err instanceof AiServiceError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          provider: err.provider,
        });
        return;
      }

      logger.warn({ err: err?.message }, "[AI Route] Unexpected error during trip planning");
      res.status(500).json({
        error: "An unexpected error occurred while generating your bespoke travel itinerary.",
      });
    }
  }
);

export default router;
