/**
 * Escora Email Campaigns — Centralized Merge Tag Personalization & Pre-Send Validation Engine
 *
 * Supported Merge Tags:
 * - {{name}}: Guest full name (escaped in HTML; fallback: "Valued Guest" or "there")
 * - {{destination}}: Destination name (escaped in HTML; fallback: "Kerala" or campaign destination)
 * - {{year}}: Current calendar year (e.g. "2026")
 * - {{email}}: Guest email address (strictly validated)
 * - {{unsubscribeUrl}}: Verified CAN-SPAM / GDPR unsubscribe URL with cryptographic token
 */

import crypto from "node:crypto";
import { config } from "../config/env";

export interface RecipientPersonalizationData {
  name?: string | null;
  email: string;
  destination?: string | null;
  token?: string | null;
  year?: string | number | null;
  source?: string | null;
  isSubscribed?: boolean;
}

export interface MergeTagResolutionOptions {
  isHtml?: boolean;
  defaultName?: string;
  defaultDestination?: string;
  campaignDestination?: string;
  baseUrl?: string;
}

export interface TagResolutionMeta {
  rawKey: string;
  normalizedKey: string;
  resolvedValue: string;
  isFallback: boolean;
  fallbackReason?: string;
}

export interface MergeTagResolutionResult {
  rendered: string;
  resolvedTags: Record<string, string>;
  tagMeta: Record<string, TagResolutionMeta>;
  unresolvedTags: string[];
  malformedTags: string[];
  usedFallbacks: {
    name: boolean;
    destination: boolean;
  };
  hasErrors: boolean;
  errors: string[];
}

export interface PreSendValidationSummary {
  campaignId: number;
  totalEligible: number;
  readyToSend: number;
  excludedCount: number;
  canSend: boolean;
  fallbacksSummary: {
    nameFallbackCount: number;
    destinationFallbackCount: number;
    exactDestinationCount: number;
  };
  unresolvedTags: string[];
  malformedTags: string[];
  exclusionReasons: Array<{
    email: string;
    reason: string;
    code:
      | "MISSING_EMAIL"
      | "INVALID_EMAIL"
      | "MISSING_CONSENT_TOKEN"
      | "UNRESOLVED_TAGS"
      | "UNSUBSCRIBED"
      | "NOT_SUBSCRIBED"
      | "SUPPRESSED"
      | "RETIRED_AUDIENCE_SEGMENT";
  }>;
  sampleRecipients: Array<{
    email: string;
    name: string;
    destination: string;
    usedNameFallback: boolean;
    usedDestinationFallback: boolean;
    previewSubject: string;
  }>;
  blockReason?: string | null;
}

/**
 * Escapes characters that are special in HTML to prevent XSS / HTML injection
 * when embedding recipient-provided values into HTML email bodies.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generates the canonical one-click unsubscribe URL with token and email.
 */
export function buildUnsubscribeUrl(
  token: string,
  email: string,
  baseUrl = config.publicUrl || "https://www.escoraholidays.com"
): string {
  if (!token || !email) return "";
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/api/campaigns/unsubscribe?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}

/**
 * Detects any unresolved or malformed merge tags in a string.
 * Legitimate single curly braces (e.g. in CSS styles or normal text) are NOT flagged.
 */
export function detectUnresolvedAndMalformedTags(text: string): {
  unresolved: string[];
  malformed: string[];
} {
  if (!text) return { unresolved: [], malformed: [] };

  const unresolvedSet = new Set<string>();
  const malformedSet = new Set<string>();

  // 1. Any remaining double-curly merge tags: {{tag}}
  const standardTagRegex = /\{\{\s*([a-zA-Z0-9_\-\.]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = standardTagRegex.exec(text)) !== null) {
    unresolvedSet.add(match[0]);
  }

  // 2. Malformed merge tags:
  // e.g. {{name} (two open, one close) or {name}} (one open, two close)
  // or {{name (two open, zero close before HTML boundary, whitespace, or EOF)
  // Ensure we don't match CSS blocks like "p { color: red; }"
  const malformedOpenRegex = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}(?!\})/g;
  while ((match = malformedOpenRegex.exec(text)) !== null) {
    malformedSet.add(match[0]);
  }

  const malformedUnclosedRegex = /\{\{\s*([a-zA-Z0-9_\-]+)\s*(?=[<\r\n]|(?:\s+[a-zA-Z0-9_\-]+=)|$)/g;
  while ((match = malformedUnclosedRegex.exec(text)) !== null) {
    // Only add if not part of a standard tag
    if (!match[0].endsWith("}}")) {
      malformedSet.add(match[0].trim());
    }
  }

  const malformedCloseRegex = /(?<!\{)\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;
  while ((match = malformedCloseRegex.exec(text)) !== null) {
    malformedSet.add(match[0]);
  }

  return {
    unresolved: Array.from(unresolvedSet),
    malformed: Array.from(malformedSet),
  };
}

/**
 * Deterministically resolves destination from an array of order records associated with a customer email.
 *
 * Rule:
 * 1. Prioritizes confirmed or completed bookings, sorted by most recent (createdAt desc).
 * 2. Next, checks active enquiries/orders (status !== "cancelled").
 * 3. Extracts destinations -> packageName -> itineraryTitle.
 * 4. Trims and cleans the result. If empty, returns undefined (no guess).
 */
export function resolveDestinationFromOrders(
  orders: Array<{
    destinations?: string | string[] | null;
    packageName?: string | null;
    itineraryTitle?: string | null;
    status?: string | null;
    createdAt?: Date | string | null;
  }>
): string | undefined {
  if (!orders || orders.length === 0) return undefined;

  // Sort orders descending by createdAt
  const sorted = [...orders].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // 1. Look for confirmed/completed orders first
  const confirmed = sorted.find(
    (o) => o.status === "confirmed" || o.status === "completed"
  );
  const targetOrder = confirmed || sorted.find((o) => o.status !== "cancelled") || sorted[0];

  if (!targetOrder) return undefined;

  let rawDest = "";
  if (Array.isArray(targetOrder.destinations)) {
    rawDest = targetOrder.destinations.filter(Boolean).join(", ").trim();
  } else if (typeof targetOrder.destinations === "string") {
    rawDest = targetOrder.destinations.trim();
  }

  if (!rawDest && targetOrder.packageName) {
    rawDest = targetOrder.packageName.trim();
  }
  if (!rawDest && targetOrder.itineraryTitle) {
    rawDest = targetOrder.itineraryTitle.trim();
  }

  return rawDest.length > 0 ? rawDest : undefined;
}

/**
 * Resolves all merge tags in a single pass to strictly prevent secondary / recursive
 * merge-tag interpretation (e.g. if a customer name or destination contains "{{...}}").
 */
export function resolveMergeTags(
  template: string,
  data: RecipientPersonalizationData,
  options: MergeTagResolutionOptions = {}
): MergeTagResolutionResult {
  if (!template) {
    return {
      rendered: "",
      resolvedTags: {},
      tagMeta: {},
      unresolvedTags: [],
      malformedTags: [],
      usedFallbacks: { name: false, destination: false },
      hasErrors: false,
      errors: [],
    };
  }

  const isHtml = options.isHtml ?? true;
  const errors: string[] = [];

  // 1. Name resolution & context-aware fallback
  const rawName = typeof data.name === "string" ? data.name.trim() : "";
  const hasValidName = rawName.length > 0 && !/^undefined$/i.test(rawName) && !/^null$/i.test(rawName);

  // 2. Destination resolution & natural fallback
  const rawDest = typeof data.destination === "string" ? data.destination.trim() : "";
  const hasValidDestination =
    rawDest.length > 0 && !/^undefined$/i.test(rawDest) && !/^null$/i.test(rawDest);

  const fallbackDestination =
    options.campaignDestination?.trim() || options.defaultDestination || "Kerala";
  const resolvedDestinationPlain = hasValidDestination ? rawDest : fallbackDestination;
  const usedDestinationFallback = !hasValidDestination;

  // 3. Email resolution
  const email = (data.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    errors.push(`Invalid or missing recipient email address: "${data.email || ""}"`);
  }

  // 4. Year resolution
  const yearStr = (data.year || new Date().getFullYear()).toString();

  // 5. Unsubscribe URL resolution
  let unsubscribeUrl = "";
  if (data.token) {
    unsubscribeUrl = buildUnsubscribeUrl(data.token, email, options.baseUrl);
  } else {
    // If no token was provided, flag as missing unsubscribe URL
    errors.push(`Missing cryptographic consent token for recipient "${email}"`);
  }

  const resolvedTags: Record<string, string> = {};
  const tagMeta: Record<string, TagResolutionMeta> = {};
  let usedNameFallback = false;

  // Single-pass replacement using RegExp replacer function
  // Match {{ tag }} with arbitrary internal whitespace
  const MERGE_TAG_REGEX = /\{\{\s*([a-zA-Z0-9_\-\.]+)\s*\}\}/gi;

  const rendered = template.replace(
    MERGE_TAG_REGEX,
    (fullMatch, tagKey: string, offset: number, fullString: string) => {
      const lowerKey = tagKey.toLowerCase();

      switch (lowerKey) {
        case "name": {
          let nameValue: string;
          if (hasValidName) {
            nameValue = rawName;
          } else {
            usedNameFallback = true;
            // Context-aware fallback: if preceded by "hello", "hi", "hey", use "there"
            const prefix = fullString.slice(Math.max(0, offset - 20), offset);
            if (/(?:hello|hi|hey)\s*,?\s*$/i.test(prefix)) {
              nameValue = "there";
            } else {
              nameValue = options.defaultName || "Valued Guest";
            }
          }

          const finalValue = isHtml ? escapeHtml(nameValue) : nameValue;
          resolvedTags[fullMatch] = finalValue;
          tagMeta[lowerKey] = {
            rawKey: tagKey,
            normalizedKey: lowerKey,
            resolvedValue: finalValue,
            isFallback: !hasValidName,
            fallbackReason: !hasValidName ? "Recipient record has no registered name" : undefined,
          };
          return finalValue;
        }

        case "destination": {
          const finalValue = isHtml
            ? escapeHtml(resolvedDestinationPlain)
            : resolvedDestinationPlain;
          resolvedTags[fullMatch] = finalValue;
          tagMeta[lowerKey] = {
            rawKey: tagKey,
            normalizedKey: lowerKey,
            resolvedValue: finalValue,
            isFallback: usedDestinationFallback,
            fallbackReason: usedDestinationFallback
              ? "Recipient has no confirmed booking destination; using campaign/default fallback"
              : undefined,
          };
          return finalValue;
        }

        case "year": {
          const finalValue = yearStr;
          resolvedTags[fullMatch] = finalValue;
          tagMeta[lowerKey] = {
            rawKey: tagKey,
            normalizedKey: lowerKey,
            resolvedValue: finalValue,
            isFallback: false,
          };
          return finalValue;
        }

        case "email": {
          const finalValue = isHtml ? escapeHtml(email) : email;
          resolvedTags[fullMatch] = finalValue;
          tagMeta[lowerKey] = {
            rawKey: tagKey,
            normalizedKey: lowerKey,
            resolvedValue: finalValue,
            isFallback: false,
          };
          return finalValue;
        }

        case "unsubscribeurl": {
          // Unsubscribe URLs should not be HTML-escaped inside href attributes,
          // but if inserted raw in body, query params are already URI-encoded.
          const finalValue = unsubscribeUrl || "#";
          resolvedTags[fullMatch] = finalValue;
          tagMeta[lowerKey] = {
            rawKey: tagKey,
            normalizedKey: lowerKey,
            resolvedValue: finalValue,
            isFallback: !data.token,
            fallbackReason: !data.token ? "Consent token not provided" : undefined,
          };
          return finalValue;
        }

        default:
          // Keep unresolved tag untouched for inspection
          return fullMatch;
      }
    }
  );

  // Inspect the rendered content for any remaining unresolved or malformed tags
  const { unresolved, malformed } = detectUnresolvedAndMalformedTags(rendered);

  if (unresolved.length > 0) {
    errors.push(`Unresolved merge tags remaining: ${unresolved.join(", ")}`);
  }
  if (malformed.length > 0) {
    errors.push(`Malformed merge tag syntax detected: ${malformed.join(", ")}`);
  }

  return {
    rendered,
    resolvedTags,
    tagMeta,
    unresolvedTags: unresolved,
    malformedTags: malformed,
    usedFallbacks: {
      name: usedNameFallback,
      destination: usedDestinationFallback,
    },
    hasErrors: errors.length > 0,
    errors,
  };
}

/**
 * Validates and renders complete campaign content (subject, previewText, and HTML body)
 * for a specific recipient, checking all fields for unresolved tags and compliance.
 */
export function renderCampaignForRecipient(
  campaign: {
    subject: string;
    contentHtml: string;
    previewText?: string | null;
    targetAudience?: { destinations?: string[] };
  },
  recipient: RecipientPersonalizationData,
  options: { baseUrl?: string } = {}
): {
  success: boolean;
  errors: string[];
  renderedSubject: string;
  renderedPreviewText?: string;
  renderedHtml: string;
  usedFallbacks: { name: boolean; destination: boolean };
} {
  const campaignDest = campaign.targetAudience?.destinations?.[0];
  const allErrors: string[] = [];

  // 1. Render Subject (Text context - no HTML entity escaping)
  const subjectRes = resolveMergeTags(campaign.subject, recipient, {
    isHtml: false,
    campaignDestination: campaignDest,
    baseUrl: options.baseUrl,
  });
  if (subjectRes.hasErrors) {
    allErrors.push(`Subject: ${subjectRes.errors.join("; ")}`);
  }

  // 2. Render Preview Text (Text context)
  let renderedPreviewText: string | undefined = undefined;
  if (campaign.previewText) {
    const previewRes = resolveMergeTags(campaign.previewText, recipient, {
      isHtml: false,
      campaignDestination: campaignDest,
      baseUrl: options.baseUrl,
    });
    if (previewRes.hasErrors) {
      allErrors.push(`PreviewText: ${previewRes.errors.join("; ")}`);
    }
    renderedPreviewText = previewRes.rendered;
  }

  // 3. Render HTML Body (HTML context - full HTML escaping)
  const bodyRes = resolveMergeTags(campaign.contentHtml, recipient, {
    isHtml: true,
    campaignDestination: campaignDest,
    baseUrl: options.baseUrl,
  });
  if (bodyRes.hasErrors) {
    allErrors.push(`Body: ${bodyRes.errors.join("; ")}`);
  }

  let finalHtml = bodyRes.rendered;

  // 4. Ensure verified unsubscribe link exists in the HTML
  const cleanUnsubUrl = recipient.token
    ? buildUnsubscribeUrl(recipient.token, recipient.email, options.baseUrl)
    : "";

  if (cleanUnsubUrl && !finalHtml.includes(cleanUnsubUrl)) {
    const complianceFooter = `
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #8c7e6c; text-align: center;">
        <p style="margin: 0 0 8px 0; letter-spacing: 0.15em; text-transform: uppercase; color: #cbab6e; font-weight: 600;">Escora Holidays · Slow Travel Sanctuaries</p>
        <p style="margin: 0 0 12px 0;">Heritage House, 1/284 River Road, Fort Kochi, Kerala 682001, India</p>
        <p style="margin: 0;">
          You received this message because you expressed interest in handcrafted Kerala slow travel with Escora.
          <br />
          <a href="${cleanUnsubUrl}" style="color: #6b5d4f; text-decoration: underline; margin-top: 6px; display: inline-block;">Unsubscribe from marketing journeys</a>
        </p>
      </div>
    `;
    finalHtml += complianceFooter;
  }

  const usedFallbacks = {
    name: subjectRes.usedFallbacks.name || bodyRes.usedFallbacks.name,
    destination: subjectRes.usedFallbacks.destination || bodyRes.usedFallbacks.destination,
  };

  return {
    success: allErrors.length === 0,
    errors: allErrors,
    renderedSubject: subjectRes.rendered,
    renderedPreviewText,
    renderedHtml: finalHtml,
    usedFallbacks,
  };
}
