import crypto from "node:crypto";
import {
  WhatsAppProvider,
  SendWhatsAppMessageRequest,
  WhatsAppSendResult,
  WhatsAppStatusResult,
  normalizePhoneNumber,
} from "./types";
import { logger } from "../../lib/logger";

/**
 * Mock WhatsApp Provider for Stage 1.
 * Simulates WhatsApp Cloud API responses without requiring Meta credentials or making external network calls.
 * Records all simulation metadata and verifies payload structure.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  public readonly name = "mock" as const;

  public async sendMessage(request: SendWhatsAppMessageRequest): Promise<WhatsAppSendResult> {
    const { to, recipientName, type, templateName, text, idempotencyKey, templateVariables } = request;

    const norm = normalizePhoneNumber(to);
    if (!norm.valid) {
      logger.warn(
        { recipient: to, error: norm.error },
        "[WhatsApp:MockProvider] Message rejected due to invalid phone format"
      );
      return {
        success: false,
        provider: "mock",
        providerMessageId: `mock_failed_${Date.now()}`,
        providerStatus: "failed",
        rawResponse: {
          error: {
            message: norm.error,
            type: "OAuthException",
            code: 100,
            error_subcode: 2494010,
            fbtrace_id: `mock_trace_${crypto.randomBytes(6).toString("hex")}`,
          },
        },
        error: norm.error,
        sentAt: new Date(),
      };
    }

    const providerMessageId = `mock_wam_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const sentAt = new Date();

    // Log simulation details with luxury styling
    logger.info(
      {
        provider: "mock",
        providerMessageId,
        recipientPhone: norm.normalized,
        recipientName,
        type,
        templateName,
        textPreview: text ? text.slice(0, 80) : undefined,
        idempotencyKey,
      },
      `[WhatsApp:MockProvider] [SIMULATED SEND] Message successfully routed to ${norm.normalized} (${recipientName})`
    );

    const rawResponse = {
      messaging_product: "whatsapp",
      contacts: [
        {
          input: norm.normalized,
          wa_id: norm.normalized.replace(/^\+/, ""),
        },
      ],
      messages: [
        {
          id: providerMessageId,
          message_status: "accepted",
        },
      ],
      _simulationMetadata: {
        mode: "mock",
        templateName: templateName || "custom_text",
        recipientName,
        variablesCount: templateVariables ? Object.keys(templateVariables).length : 0,
        simulatedAt: sentAt.toISOString(),
      },
    };

    return {
      success: true,
      provider: "mock",
      providerMessageId,
      providerStatus: "simulated",
      rawResponse,
      sentAt,
    };
  }

  public async getMessageStatus(messageId: string): Promise<WhatsAppStatusResult | null> {
    if (!messageId.startsWith("mock_wam_")) {
      return null;
    }

    return {
      messageId,
      status: "delivered",
      timestamp: new Date(),
    };
  }
}
