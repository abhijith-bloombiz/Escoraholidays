export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface AiGenerateOptions {
  messages?: AiMessage[];
  prompt?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
  responseFormat?: "text" | "json_object";
}

export interface AiUsageStats {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiGenerateResult {
  content: string;
  model: string;
  provider: string;
  usage?: AiUsageStats;
  finishReason?: string;
}

export interface AiServiceStatus {
  configured: boolean;
  provider: string;
  model: string;
  available: boolean;
  message?: string;
  availableModels?: string[];
}

export type AiErrorCode =
  | "MISSING_CONFIG"
  | "MODEL_UNAVAILABLE"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_INPUT"
  | "TIMEOUT"
  | "PROVIDER_ERROR";

export class AiServiceError extends Error {
  readonly code: AiErrorCode;
  readonly statusCode: number;
  readonly provider: string;

  constructor(message: string, code: AiErrorCode, statusCode = 500, provider = "groq") {
    super(message);
    this.name = "AiServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.provider = provider;
  }
}

export interface AiProvider {
  readonly name: string;
  isConfigured(): boolean;
  getStatus(): Promise<AiServiceStatus>;
  listModels(): Promise<string[]>;
  generate(options: AiGenerateOptions): Promise<AiGenerateResult>;
}
