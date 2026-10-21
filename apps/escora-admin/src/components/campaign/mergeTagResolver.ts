/**
 * Escora Admin — Client-Side Merge Tag Personalization & Live Preview Engine
 * Synchronized with the backend merge-tag-resolver service.
 */

export interface SampleRecipientProfile {
  id: string;
  label: string;
  description: string;
  name: string;
  email: string;
  destination: string;
  isBookedGuest: boolean;
}

export const SAMPLE_RECIPIENT_PROFILES: SampleRecipientProfile[] = [
  {
    id: "confirmed_marcus",
    label: "Confirmed Booking — Marcus Vance",
    description: "Real booked guest with confirmed Alleppey itinerary",
    name: "Marcus Vance",
    email: "marcus.vance@example.com",
    destination: "Alleppey",
    isBookedGuest: true,
  },
  {
    id: "enquiry_clara",
    label: "Enquiry Lead — Clara Dunne",
    description: "General Kerala enquiry without booked destination (uses natural fallback)",
    name: "Clara Dunne",
    email: "clara.dunne@example.com",
    destination: "",
    isBookedGuest: false,
  },
  {
    id: "minimal_anonymous",
    label: "Minimal Contact — Anonymous",
    description: "Newsletter subscriber without name or destination (tests all fallbacks)",
    name: "",
    email: "subscriber@example.com",
    destination: "",
    isBookedGuest: false,
  },
];

export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function detectUnresolvedAndMalformedTags(text: string): {
  unresolved: string[];
  malformed: string[];
} {
  if (!text) return { unresolved: [], malformed: [] };

  const unresolvedSet = new Set<string>();
  const malformedSet = new Set<string>();

  // Any remaining double-curly merge tags: {{tag}}
  const standardTagRegex = /\{\{\s*([a-zA-Z0-9_\-\.]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = standardTagRegex.exec(text)) !== null) {
    unresolvedSet.add(match[0]);
  }

  // Malformed merge tags: e.g. {{name} or {name}} or {{name before HTML/newline
  const malformedOpenRegex = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}(?!\})/g;
  while ((match = malformedOpenRegex.exec(text)) !== null) {
    malformedSet.add(match[0]);
  }

  const malformedUnclosedRegex = /\{\{\s*([a-zA-Z0-9_\-]+)\s*(?=[<\r\n]|(?:\s+[a-zA-Z0-9_\-]+=)|$)/g;
  while ((match = malformedUnclosedRegex.exec(text)) !== null) {
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

export function resolveMergeTagsClient(
  template: string,
  profile: SampleRecipientProfile,
  options: {
    isHtml?: boolean;
    defaultDestination?: string;
    campaignDestination?: string;
  } = {}
): {
  rendered: string;
  tagValues: Record<string, string>;
  usedFallbacks: { name: boolean; destination: boolean };
  unresolvedTags: string[];
  malformedTags: string[];
} {
  if (!template) {
    return {
      rendered: "",
      tagValues: {},
      usedFallbacks: { name: false, destination: false },
      unresolvedTags: [],
      malformedTags: [],
    };
  }

  const isHtml = options.isHtml ?? true;
  const rawName = profile.name.trim();
  const hasValidName = rawName.length > 0;

  const rawDest = profile.destination.trim();
  const hasValidDestination = rawDest.length > 0;
  const fallbackDestination =
    options.campaignDestination?.trim() || options.defaultDestination || "Kerala";
  const resolvedDestinationPlain = hasValidDestination ? rawDest : fallbackDestination;

  const yearStr = new Date().getFullYear().toString();
  const unsubscribeUrl = "#";

  let usedNameFallback = false;
  const tagValues: Record<string, string> = {};

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
            const prefix = fullString.slice(Math.max(0, offset - 20), offset);
            if (/(?:hello|hi|hey)\s*,?\s*$/i.test(prefix)) {
              nameValue = "there";
            } else {
              nameValue = "Valued Guest";
            }
          }
          const finalVal = isHtml ? escapeHtml(nameValue) : nameValue;
          tagValues["{{name}}"] = finalVal;
          return finalVal;
        }

        case "destination": {
          const finalVal = isHtml
            ? escapeHtml(resolvedDestinationPlain)
            : resolvedDestinationPlain;
          tagValues["{{destination}}"] = finalVal;
          return finalVal;
        }

        case "year": {
          tagValues["{{year}}"] = yearStr;
          return yearStr;
        }

        case "email": {
          const finalVal = isHtml ? escapeHtml(profile.email) : profile.email;
          tagValues["{{email}}"] = finalVal;
          return finalVal;
        }

        case "unsubscribeurl": {
          tagValues["{{unsubscribeUrl}}"] = unsubscribeUrl;
          return unsubscribeUrl;
        }

        default:
          return fullMatch;
      }
    }
  );

  const { unresolved, malformed } = detectUnresolvedAndMalformedTags(rendered);

  return {
    rendered,
    tagValues,
    usedFallbacks: {
      name: usedNameFallback,
      destination: !hasValidDestination,
    },
    unresolvedTags: unresolved,
    malformedTags: malformed,
  };
}
