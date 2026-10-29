import {
  WhatsAppProvider,
  SendWhatsAppMessageRequest,
  WhatsAppSendResult,
  WhatsAppStatusResult,
  normalizePhoneNumber,
} from "./types";
import { config } from "../../config/env";
import { logger } from "../../lib/logger";

export interface CloudApiConfig {
  apiToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  graphApiVersion?: string;
  liveSendingEnabled?: boolean;
}

/**
 * Official Meta WhatsApp Cloud API Provider (Graph API v20.0).
 * Dispatches WhatsApp template and text messages to Meta's Cloud API endpoint.
 *
 * Safety & Compliance Safeguards:
 * 1. Strict live-sending safety flag check (WHATSAPP_LIVE_SENDING_ENABLED=true).
 * 2. Token & Phone Number ID validation.
 * 3. Never logs access tokens or secrets.
 * 4. API acceptance response is treated as "sent" (submitted to Meta), NOT "delivered".
 * 5. Delivery receipts are handled asynchronously via webhooks.
 */
export class CloudApiWhatsAppProvider implements WhatsAppProvider {
  public readonly name = "cloud_api" as const;
  private readonly apiToken?: string;
  private readonly phoneNumberId?: string;
  private readonly businessAccountId?: string;
  private readonly graphApiVersion: string;
  private readonly liveSendingEnabled: boolean;
  private readonly fetchFn: typeof fetch;

  constructor(cfg?: CloudApiConfig, customFetch?: typeof fetch) {
    this.apiToken = cfg?.apiToken || config.whatsappApiToken;
    this.phoneNumberId = cfg?.phoneNumberId || config.whatsappPhoneNumberId;
    this.businessAccountId = cfg?.businessAccountId || config.whatsappBusinessAccountId;
    this.graphApiVersion = cfg?.graphApiVersion || config.whatsappGraphApiVersion || "v20.0";
    this.liveSendingEnabled =
      cfg?.liveSendingEnabled !== undefined
        ? cfg.liveSendingEnabled
        : config.whatsappLiveSendingEnabled;
    this.fetchFn = customFetch || globalThis.fetch;
  }

  public isConfigured(): boolean {
    return Boolean(
      this.liveSendingEnabled &&
        this.apiToken &&
        this.apiToken.trim().length > 10 &&
        this.phoneNumberId &&
        this.phoneNumberId.trim().length > 5
    );
  }

  public getConfigurationStatus(): {
    liveSendingEnabled: boolean;
    hasApiToken: boolean;
    hasPhoneNumberId: boolean;
    hasBusinessAccountId: boolean;
    graphApiVersion: string;
  } {
    return {
      liveSendingEnabled: this.liveSendingEnabled,
      hasApiToken: Boolean(this.apiToken && this.apiToken.trim().length > 10),
      hasPhoneNumberId: Boolean(this.phoneNumberId && this.phoneNumberId.trim().length > 5),
      hasBusinessAccountId: Boolean(this.businessAccountId && this.businessAccountId.trim().length > 5),
      graphApiVersion: this.graphApiVersion,
    };
  }

  public async sendMessage(request: SendWhatsAppMessageRequest): Promise<WhatsAppSendResult> {
    const { to, recipientName, type, templateName, templateLanguage, templateVariables, text, idempotencyKey } = request;

    // Safety check 1: Live sending safety flag
    if (!this.liveSendingEnabled) {
      const reason =
        "WhatsApp live sending is strictly disabled (WHATSAPP_LIVE_SENDING_ENABLED=false). To enable live sending, explicitly set WHATSAPP_LIVE_SENDING_ENABLED=true in the environment.";
      logger.warn({ to, idempotencyKey }, `[WhatsApp:CloudApiProvider] ${reason}`);
      throw new Error(`[CloudApiWhatsAppProvider] ${reason}`);
    }

    // Safety check 2: Required credentials
    if (!this.apiToken || !this.phoneNumberId) {
      const reason =
        "Missing Meta WhatsApp Cloud API credentials (WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured).";
      logger.warn({ to, idempotencyKey }, `[WhatsApp:CloudApiProvider] ${reason}`);
      throw new Error(`[CloudApiWhatsAppProvider] ${reason}`);
    }

    // Normalization check: Destination phone number
    const norm = normalizePhoneNumber(to);
    if (!norm.valid) {
      logger.warn(
        { recipient: to, error: norm.error },
        "[WhatsApp:CloudApiProvider] Message rejected: invalid recipient phone format"
      );
      return {
        success: false,
        provider: "cloud_api",
        providerMessageId: `cloud_invalid_${Date.now()}`,
        providerStatus: "failed",
        rawResponse: { error: { message: norm.error } },
        error: norm.error,
        sentAt: new Date(),
      };
    }

    // Meta API expects digits without "+" (E.164 wa_id)
    const waRecipient = norm.normalized.replace(/^\+/, "");
    const url = `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`;

    // Construct Meta payload
    let payload: Record<string, any>;

    if (type === "interactive" && request.interactive) {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: waRecipient,
        type: "interactive",
        interactive: {
          type: request.interactive.type || "button",
          ...(request.interactive.header
            ? {
                header:
                  request.interactive.header.type === "image" && request.interactive.header.imageUrl
                    ? { type: "image", image: { link: request.interactive.header.imageUrl } }
                    : { type: "text", text: request.interactive.header.text },
              }
            : {}),
          body: {
            text: request.interactive.body.text,
          },
          ...(request.interactive.footer
            ? {
                footer: { text: request.interactive.footer.text },
              }
            : {}),
          action: request.interactive.action,
        },
      };
    } else if (type === "template" && templateName) {
      // Meta pre-approved test template: "hello_world"
      if (templateName === "hello_world") {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: waRecipient,
          type: "template",
          template: {
            name: "hello_world",
            language: {
              code: templateLanguage || "en_US",
            },
          },
        };
      } else {
        // Custom approved template with parameters
        const components: any[] = [];
        if (templateVariables && Object.keys(templateVariables).length > 0) {
          const parameters = Object.values(templateVariables).map((val) => ({
            type: "text",
            text: String(val),
          }));
          components.push({
            type: "body",
            parameters,
          });
        }

        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: waRecipient,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: templateLanguage || "en",
            },
            ...(components.length > 0 ? { components } : {}),
          },
        };
      }
    } else {
      // Free-form text message (for customer service window or sandbox testing)
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: waRecipient,
        type: "text",
        text: {
          preview_url: false,
          body: text || "Namaste from Escora Holidays.",
        },
      };
    }

    logger.info(
      {
        provider: "cloud_api",
        recipientPhone: norm.normalized,
        recipientName,
        type,
        templateName: payload.template?.name || "text",
        idempotencyKey,
      },
      `[WhatsApp:CloudApiProvider] Submitting message to Meta Cloud API (${norm.normalized})`
    );

    const sentAt = new Date();

    try {
      const res = await this.fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10-second timeout
      });

      const responseBody: any = await res.json().catch(() => ({}));

      if (!res.ok) {
        const metaError = responseBody?.error;
        const errorCode = metaError?.code;
        const errorSubcode = metaError?.error_subcode;
        const errorMessage =
          metaError?.message || metaError?.error_data?.details || `Meta API HTTP ${res.status}`;

        logger.error(
          {
            status: res.status,
            errorCode,
            errorSubcode,
            errorMessage,
            recipientPhone: norm.normalized,
          },
          "[WhatsApp:CloudApiProvider] Meta Cloud API rejected message submission"
        );

        return {
          success: false,
          provider: "cloud_api",
          providerMessageId: `cloud_error_${Date.now()}`,
          providerStatus: "failed",
          rawResponse: responseBody,
          error: `[Meta ${errorCode || res.status}] ${errorMessage}`,
          sentAt,
        };
      }

      const providerMessageId =
        responseBody.messages?.[0]?.id || `wamid.unknown_${Date.now()}`;

      logger.info(
        {
          providerMessageId,
          recipientPhone: norm.normalized,
        },
        "[WhatsApp:CloudApiProvider] Meta accepted message for delivery"
      );

      // IMPORTANT: API acceptance does NOT mean delivered!
      // Status is "sent" (submitted to Meta). "delivered" and "read" are confirmed via Webhooks.
      return {
        success: true,
        provider: "cloud_api",
        providerMessageId,
        providerStatus: "sent",
        rawResponse: responseBody,
        sentAt,
      };
    } catch (err: any) {
      const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
      const errorMsg = isTimeout
        ? "Meta Cloud API request timed out after 10s"
        : err?.message || "Unknown error connecting to Meta Cloud API";

      logger.error(
        { err: errorMsg, recipientPhone: norm.normalized },
        "[WhatsApp:CloudApiProvider] Network/Transport exception calling Meta"
      );

      return {
        success: false,
        provider: "cloud_api",
        providerMessageId: `cloud_neterr_${Date.now()}`,
        providerStatus: "failed",
        rawResponse: { transportError: errorMsg },
        error: errorMsg,
        sentAt,
      };
    }
  }

  public async getMessageStatus(messageId: string): Promise<WhatsAppStatusResult | null> {
    if (!this.isConfigured()) {
      return null;
    }
    // Meta Cloud API primarily updates status via Webhooks; direct query fallback:
    return null;
  }
}
