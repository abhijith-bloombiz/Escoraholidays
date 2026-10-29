/**
 * WhatsApp Provider Types & Phone Normalization Utilities
 */

export interface SendWhatsAppMessageRequest {
  to: string; // Recipient phone number (raw or formatted)
  recipientName: string;
  type: "template" | "text" | "interactive";
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, any>;
  text?: string;
  interactive?: {
    type: "button" | "list";
    header?: {
      type: "image" | "text";
      imageUrl?: string;
      text?: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text?: string;
    };
    action: {
      buttons?: Array<{
        type: "reply";
        reply: {
          id: string;
          title: string;
        };
      }>;
      button?: string;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppSendResult {
  success: boolean;
  provider: "mock" | "cloud_api";
  providerMessageId: string;
  providerStatus: "simulated" | "sent" | "delivered" | "failed";
  rawResponse: Record<string, any>;
  error?: string | null;
  sentAt: Date;
}

export interface WhatsAppStatusResult {
  messageId: string;
  status: "simulated" | "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
  error?: string | null;
}

export interface WhatsAppProvider {
  readonly name: "mock" | "cloud_api";
  sendMessage(request: SendWhatsAppMessageRequest): Promise<WhatsAppSendResult>;
  getMessageStatus?(messageId: string): Promise<WhatsAppStatusResult | null>;
}

export interface PhoneNormalizationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Normalizes phone numbers to standard E.164 format (+[country code][number]).
 * Handles:
 * - Common Indian 10-digit mobile numbers (e.g., "9876543210" -> "+919876543210")
 * - 11-digit numbers with leading 0 (e.g., "09876543210" -> "+919876543210")
 * - International numbers with "+" prefix (e.g., "+1 (555) 234-5678" -> "+15552345678")
 * - Numbers with international dial code without plus (e.g., "919876543210" -> "+919876543210")
 */
export function normalizePhoneNumber(rawPhone?: string | null, defaultCountryCode: string = "91"): PhoneNormalizationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { valid: false, normalized: "", error: "Phone number is empty or missing" };
  }

  // Remove whitespace, dashes, parentheses, dots
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]+/g, "");

  // Check if starting with "+"
  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.slice(1).replace(/\D/g, "");
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return { valid: false, normalized: "", error: `Invalid international phone length: ${cleaned}` };
    }
    return { valid: true, normalized: `+${digitsOnly}` };
  }

  // Digits only
  const digits = cleaned.replace(/\D/g, "");

  // Leading 00 international prefix (e.g. 0091...)
  if (digits.startsWith("00") && digits.length >= 10) {
    const without00 = digits.slice(2);
    return { valid: true, normalized: `+${without00}` };
  }

  // 10 digits starting with 6, 7, 8, or 9 (standard Indian mobile)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { valid: true, normalized: `+${defaultCountryCode}${digits}` };
  }

  // 11 digits starting with 0 followed by 6, 7, 8, 9 (Indian mobile with leading 0)
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return { valid: true, normalized: `+${defaultCountryCode}${digits.slice(1)}` };
  }

  // 12 digits starting with 91 (India)
  if (digits.length === 12 && digits.startsWith("91")) {
    return { valid: true, normalized: `+${digits}` };
  }

  // Generic international digits (8 to 15 digits)
  if (digits.length >= 8 && digits.length <= 15) {
    return { valid: true, normalized: `+${digits}` };
  }

  return {
    valid: false,
    normalized: "",
    error: `Unable to normalize phone number "${rawPhone}". Expected E.164 format with country code.`,
  };
}
