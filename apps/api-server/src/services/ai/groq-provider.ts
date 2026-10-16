import Groq from "groq-sdk";
import { config } from "../../config/env";
import { logger } from "../../lib/logger";
import {
  AiProvider,
  AiGenerateOptions,
  AiGenerateResult,
  AiServiceStatus,
  AiServiceError,
  AiMessage,
} from "./types";

/**
 * Standard known Groq production models for offline verification or fallback reference.
 */
const KNOWN_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

export class GroqProvider implements AiProvider {
  readonly name = "groq";

  private client: Groq | null = null;
  private cachedModels: { list: string[]; fetchedAt: number } | null = null;
  private readonly MODEL_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    if (config.groqApiKey) {
      try {
        const clientOptions: { apiKey: string; baseURL?: string } = {
          apiKey: config.groqApiKey,
        };
        if (config.groqBaseUrl) {
          // If a custom base URL was provided, strip any trailing /openai/v1 as Groq SDK appends it internally
          clientOptions.baseURL = config.groqBaseUrl.replace(/\/openai\/v1\/?$/, "");
        }
        this.client = new Groq(clientOptions);
      } catch (err) {
        logger.warn({ err: (err as Error).message }, "[GroqProvider] Failed to initialize client");
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  isConfigured(): boolean {
    return Boolean(config.groqApiKey && config.groqApiKey.trim().length > 0);
  }

  async getStatus(): Promise<AiServiceStatus> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        provider: this.name,
        model: config.groqModel,
        available: false,
        message: "GROQ_API_KEY environment variable is not configured on the backend.",
      };
    }

    try {
      const models = await this.listModels();
      let activeModel = config.groqModel;
      let isModelAvailable = models.includes(config.groqModel);

      // If default model is not in user's available Groq models, automatically resolve active fallback
      if (!isModelAvailable) {
        try {
          activeModel = await this.resolveActiveModel();
          isModelAvailable = true;
        } catch {
          isModelAvailable = false;
        }
      }

      return {
        configured: true,
        provider: this.name,
        model: activeModel,
        available: isModelAvailable,
        availableModels: models,
        message: isModelAvailable
          ? `Groq AI service is configured, authenticated, and verified (active model: ${activeModel}).`
          : `Configured model "${config.groqModel}" was not found among active Groq models.`,
      };
    } catch (err: any) {
      logger.warn({ error: err.message }, "[GroqProvider] Status check failed");
      return {
        configured: true,
        provider: this.name,
        model: config.groqModel,
        available: false,
        message: `Provider check failed: ${err.message || "Unknown error"}`,
      };
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.isConfigured() || !this.client) {
      throw new AiServiceError(
        "Groq API key is not configured. Cannot list models.",
        "MISSING_CONFIG",
        503,
        this.name
      );
    }

    const now = Date.now();
    if (this.cachedModels && now - this.cachedModels.fetchedAt < this.MODEL_CACHE_TTL_MS) {
      return this.cachedModels.list;
    }

    try {
      const response = await this.client.models.list();
      const models = (response.data || [])
        .map((m) => m.id)
        .filter((id) => typeof id === "string" && id.length > 0);

      this.cachedModels = {
        list: models.length > 0 ? models : KNOWN_GROQ_MODELS,
        fetchedAt: now,
      };

      return this.cachedModels.list;
    } catch (err: any) {
      logger.warn({ error: err.message }, "[GroqProvider] Error fetching models from Groq");
      // If network/auth fails, return fallback known models or rethrow
      if (this.cachedModels) {
        return this.cachedModels.list;
      }
      throw new AiServiceError(
        `Failed to retrieve available models from Groq: ${err.message || "Network error"}`,
        "PROVIDER_ERROR",
        502,
        this.name
      );
    }
  }

  /**
   * Resolves an active, verified model from Groq.
   * If targetModel is available, uses it.
   * If the requested model is not found in the account, automatically selects the best
   * chat/completion model available to this account.
   */
  async resolveActiveModel(targetModel?: string): Promise<string> {
    const available = await this.listModels();
    const candidate = targetModel || config.groqModel;

    // 1. Exact match
    if (available.includes(candidate)) {
      return candidate;
    }

    // 2. Case-insensitive match
    const caseMatch = available.find((m) => m.toLowerCase() === candidate.toLowerCase());
    if (caseMatch) {
      return caseMatch;
    }

    // 3. If target was explicitly requested by caller (different from configured default), reject
    if (targetModel && targetModel !== config.groqModel) {
      throw new AiServiceError(
        `Requested model "${targetModel}" is not available on Groq.`,
        "MODEL_UNAVAILABLE",
        400,
        this.name
      );
    }

    // 4. Intelligently select active chat model from the account
    const preferredFallbacks = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
    ];

    for (const fb of preferredFallbacks) {
      if (available.includes(fb)) {
        return fb;
      }
    }

    // Filter out audio/guard models
    const chatEligible = available.filter(
      (m) => !m.includes("whisper") && !m.includes("guard") && !m.includes("orpheus")
    );
    if (chatEligible.length > 0) {
      return chatEligible[0];
    }

    if (available.length > 0) {
      return available[0];
    }

    throw new AiServiceError(
      `Configured Groq model "${candidate}" is not available, and no suitable model was found.`,
      "MODEL_UNAVAILABLE",
      400,
      this.name
    );
  }

  /**
   * Verifies that the requested model is active and supported by Groq.
   * If the configured model is unavailable, throws an explicit AiServiceError.
   */
  async verifyModel(targetModel: string): Promise<string> {
    return this.resolveActiveModel(targetModel);
  }

  async generate(options: AiGenerateOptions): Promise<AiGenerateResult> {
    if (!this.isConfigured() || !this.client) {
      throw new AiServiceError(
        "AI service is not configured. Please set the GROQ_API_KEY environment variable on the server.",
        "MISSING_CONFIG",
        503,
        this.name
      );
    }

    const targetModel = options.model || config.groqModel;
    const verifiedModel = await this.verifyModel(targetModel);

    // Assemble messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    if (options.messages && options.messages.length > 0) {
      for (const m of options.messages) {
        messages.push({ role: m.role, content: m.content });
      }
    } else if (options.prompt) {
      messages.push({ role: "user", content: options.prompt });
    } else {
      throw new AiServiceError(
        "Either 'prompt' or 'messages' must be provided.",
        "INVALID_INPUT",
        400,
        this.name
      );
    }

    const timeoutMs = options.timeoutMs ?? 25000;
    const maxTokens = Math.min(Math.max(options.maxTokens ?? 1024, 1), 4096);
    const temperature = typeof options.temperature === "number"
      ? Math.max(0, Math.min(options.temperature, 1))
      : 0.7;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.client.chat.completions.create(
        {
          model: verifiedModel,
          messages,
          max_tokens: maxTokens,
          temperature,
          ...(options.responseFormat === "json_object"
            ? { response_format: { type: "json_object" } }
            : {}),
        },
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const choice = response.choices?.[0];
      const content = choice?.message?.content || "";
      const finishReason = choice?.finish_reason || undefined;

      logger.info(
        {
          provider: this.name,
          model: verifiedModel,
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          finishReason,
        },
        "[GroqProvider] Completion generated successfully"
      );

      return {
        content,
        model: verifiedModel,
        provider: this.name,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
        finishReason,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError" || controller.signal.aborted) {
        throw new AiServiceError(
          `Groq API request timed out after ${timeoutMs}ms.`,
          "TIMEOUT",
          504,
          this.name
        );
      }

      // Handle Groq HTTP error responses gracefully
      const status = err.status || err.statusCode || 500;
      const rawMessage = err.message || "Unknown error from Groq";

      if (status === 401) {
        logger.warn("[GroqProvider] Authentication failed: invalid GROQ_API_KEY");
        throw new AiServiceError(
          "Groq authentication failed. The configured GROQ_API_KEY is invalid or expired.",
          "MISSING_CONFIG",
          503,
          this.name
        );
      }

      if (status === 429) {
        logger.warn({ rawMessage }, "[GroqProvider] Rate limit reached on Groq API");
        throw new AiServiceError(
          `Groq AI provider rate limit reached: ${rawMessage}`,
          "RATE_LIMIT_EXCEEDED",
          429,
          this.name
        );
      }

      if (status === 400) {
        throw new AiServiceError(
          `Groq rejected the request: ${rawMessage}`,
          "INVALID_INPUT",
          400,
          this.name
        );
      }

      logger.warn({ status, error: rawMessage }, "[GroqProvider] Groq API call failed");
      throw new AiServiceError(
        "Groq AI generation encountered an internal provider error.",
        "PROVIDER_ERROR",
        502,
        this.name
      );
    }
  }
}
