import {
  AiProvider,
  AiGenerateOptions,
  AiGenerateResult,
  AiServiceStatus,
  AiServiceError,
  AiMessage,
} from "./types";
import { GroqProvider } from "./groq-provider";
import { logger } from "../../lib/logger";

const MAX_PROMPT_LENGTH = 30000;
const MAX_MESSAGES_COUNT = 50;
const MAX_SYSTEM_PROMPT_LENGTH = 20000;

export class AiService {
  private provider: AiProvider;

  constructor(provider?: AiProvider) {
    this.provider = provider || new GroqProvider();
  }

  /**
   * Allows swapping the active provider (e.g., to OpenAI, Anthropic, or a mock for tests).
   */
  setProvider(provider: AiProvider): void {
    logger.info({ previous: this.provider.name, current: provider.name }, "[AiService] Swapped AI provider");
    this.provider = provider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  async getStatus(): Promise<AiServiceStatus> {
    return this.provider.getStatus();
  }

  async listModels(): Promise<string[]> {
    return this.provider.listModels();
  }

  /**
   * Main entry point for generating AI completions.
   * Performs bounds checking, input sanitization, and delegates to the active provider.
   */
  async generate(options: AiGenerateOptions): Promise<AiGenerateResult> {
    this.validateInputs(options);
    return this.provider.generate(options);
  }

  /**
   * Convenience helper for multi-turn chat conversations.
   */
  async chat(
    messages: AiMessage[],
    options?: Omit<AiGenerateOptions, "messages" | "prompt">
  ): Promise<AiGenerateResult> {
    return this.generate({
      ...options,
      messages,
    });
  }

  private validateInputs(options: AiGenerateOptions): void {
    if (!options.prompt && (!options.messages || options.messages.length === 0)) {
      throw new AiServiceError(
        "Invalid request: Either 'prompt' or 'messages' must be specified.",
        "INVALID_INPUT",
        400,
        this.provider.name
      );
    }

    if (options.prompt && options.prompt.length > MAX_PROMPT_LENGTH) {
      throw new AiServiceError(
        `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
        "INVALID_INPUT",
        400,
        this.provider.name
      );
    }

    if (options.systemPrompt && options.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
      throw new AiServiceError(
        `System prompt exceeds maximum allowed length of ${MAX_SYSTEM_PROMPT_LENGTH} characters.`,
        "INVALID_INPUT",
        400,
        this.provider.name
      );
    }

    if (options.messages) {
      if (options.messages.length > MAX_MESSAGES_COUNT) {
        throw new AiServiceError(
          `Message list exceeds maximum allowed count of ${MAX_MESSAGES_COUNT} items.`,
          "INVALID_INPUT",
          400,
          this.provider.name
        );
      }

      for (const m of options.messages) {
        if (!m.content || typeof m.content !== "string") {
          throw new AiServiceError(
            "Every message must contain non-empty string 'content'.",
            "INVALID_INPUT",
            400,
            this.provider.name
          );
        }
        if (m.content.length > MAX_PROMPT_LENGTH) {
          throw new AiServiceError(
            `Individual message content exceeds maximum length of ${MAX_PROMPT_LENGTH} characters.`,
            "INVALID_INPUT",
            400,
            this.provider.name
          );
        }
        if (!["system", "user", "assistant"].includes(m.role)) {
          throw new AiServiceError(
            `Unsupported message role "${m.role}". Expected 'system', 'user', or 'assistant'.`,
            "INVALID_INPUT",
            400,
            this.provider.name
          );
        }
      }
    }
  }
}

// Global shared singleton
export const aiService = new AiService();
