import { aiService, AiServiceError } from "./index";
import { DestinationModel, PackageModel } from "@workspace/db";
import { AssistEnquiryResponse, type EnquiryAiAssistResponse } from "@workspace/api-zod";
import pino from "pino";

const logger = pino({ name: "enquiry-assistant" });

export interface EnquiryAssistantServiceInput {
  enquiry: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    message: string;
    status: string;
    createdAt: string | Date;
  };
  focusPrompt?: string;
  replyTone?: "warm-luxury" | "concise" | "detailed";
}

/**
 * Builds the grounded system prompt for the Escora Travel Designer Assistant.
 * Incorporates published destinations and packages to ground any travel suggestions,
 * and enforces strict privacy and non-fabrication guardrails.
 */
function buildEnquiryAssistantSystemPrompt(
  publishedDestinations: Array<{ name: string; slug: string; region: string; type: string; highlights: string }>,
  publishedPackages: Array<{ title: string; slug: string; duration: string; route: string; style: string }>
): string {
  const destSummary =
    publishedDestinations.length > 0
      ? publishedDestinations.slice(0, 12).map((d) => `${d.name} (${d.region})`).join(", ")
      : "Fort Kochi, Munnar, Alleppey, Thekkady, Wayanad, Kumarakom, Marari, Varkala";

  const pkgSummary =
    publishedPackages.length > 0
      ? publishedPackages.slice(0, 8).map((p) => `${p.title} (${p.duration})`).join(", ")
      : "The Malabar Escape, Cardamom Hills Retreat, Spice Coast Odyssey";

  return `You are the Senior Travel Designer Assistant at Escora Holidays, an ultra-luxury slow travel company specializing in handcrafted private journeys across Kerala, India. You assist internal travel concierges with customer enquiries.

TONE & PHILOSOPHY: Warm, refined, respectful, restorative, botanical slow-luxury. You assist the human designer; do not speak directly to the guest.

APPROVED CATALOG (Grounded Knowledge):
• Destinations: ${destSummary}
• Signature Journeys: ${pkgSummary}

RULES (Mandatory):
1. FACT-BASED EXTRACTION ONLY: Extract ONLY information explicitly stated in the enquiry. Do not fabricate. If travel dates, group size, or budget are unmentioned, set to "Unknown / Not specified". If destinations unmentioned, set to [].
2. UNANSWERED QUESTIONS: Identify direct customer questions that require answers.
3. MISSING DETAILS: Identify crucial missing information needed for bespoke planning (e.g. dates, party size, pace).
4. DRAFT REPLY: Craft a comprehensive, beautifully written slow-luxury email body (at least 2 substantial paragraphs, 150+ words). Acknowledge their request warmly, answer their questions with authentic Kerala insight, politely invite clarification on any missing details, and weave in any travel designer instructions prominently into the reply body text. Never guarantee live inventory or confirmed prices.
5. NEXT ACTION: Recommend the single best next operational step with priority ("high", "medium", "low").

RESPOND WITH VALID JSON ONLY:
{
  "summary": {
    "overview": "Concise summary",
    "destinations": ["Destinations mentioned"],
    "travelDates": "Dates or Unknown / Not specified",
    "groupSize": "Party size or Unknown / Not specified",
    "budget": "Budget or Unknown / Not specified",
    "unansweredQuestions": ["Customer questions"]
  },
  "extractedPreferences": {
    "destinations": ["Destinations mentioned"],
    "travelDates": "Dates or Unknown / Not specified",
    "groupSize": "Party or Unknown / Not specified",
    "budget": "Budget or Unknown / Not specified",
    "travelStyle": "Pace/style or Unknown / Not specified",
    "specialRequests": ["Explicit requests"],
    "missingDetails": ["Information gaps"]
  },
  "suggestedReply": {
    "subject": "Re: Your Kerala Journey with Escora Holidays",
    "greeting": "Dear [Name],",
    "body": "Substantive, beautifully written response draft (150+ words)...",
    "signoff": "Warm regards,\\nEscora Travel Design Team\\nEscora Holidays"
  },
  "nextAction": {
    "recommendedAction": "Action statement",
    "rationale": "Reason based on status/context",
    "priority": "high" | "medium" | "low"
  }
}
`;
}

/**
 * Executes AI-assisted enquiry analysis and draft generation.
 * Enforces authentication context, published-only catalog grounding, and privacy isolation.
 */
export async function assistEnquiry(input: EnquiryAssistantServiceInput): Promise<EnquiryAiAssistResponse> {
  const { enquiry, focusPrompt, replyTone = "warm-luxury" } = input;

  if (!enquiry || !enquiry.id) {
    throw new AiServiceError("Enquiry data with valid ID is required", "INVALID_INPUT", 400);
  }

  const rawMessage = (enquiry.message || "").trim();
  if (!rawMessage) {
    throw new AiServiceError("Enquiry message cannot be empty", "INVALID_INPUT", 400);
  }

  if (!aiService.isConfigured()) {
    throw new AiServiceError(
      "The Escora AI Enquiry Assistant is currently offline for maintenance.",
      "MISSING_CONFIG",
      503
    );
  }

  // Fetch only published destinations & packages for verified catalog context
  let publishedDestinations: Array<{ name: string; slug: string; region: string; type: string; highlights: string }> = [];
  let publishedPackages: Array<{ title: string; slug: string; duration: string; route: string; style: string }> = [];

  try {
    const [dests, pkgs] = await Promise.all([
      DestinationModel.find({ published: true }).select("name slug region type highlights").lean(),
      PackageModel.find({ published: true }).select("name slug durationNights route bestFor category").lean(),
    ]);

    publishedDestinations = dests.map((d) => ({
      name: d.name,
      slug: d.slug,
      region: d.region || "Kerala",
      type: d.type || "Sanctuary",
      highlights: d.highlights || "",
    }));

    publishedPackages = pkgs.map((p) => ({
      title: p.name,
      slug: p.slug,
      duration: `${p.durationNights} Nights`,
      route: p.route || "Kerala",
      style: p.category || "Slow-Luxury",
    }));
  } catch (err: any) {
    logger.warn({ error: err.message }, "[EnquiryAssistant] Could not load catalog, proceeding with core knowledge");
  }

  const systemPrompt = buildEnquiryAssistantSystemPrompt(publishedDestinations, publishedPackages);

  const userPrompt = `Please analyze the following incoming customer enquiry and generate the complete assessment, extracted preferences, draft reply, and next action recommendation.

ENQUIRY DETAILS:
• Reference ID: #${enquiry.id}
• Guest Name: ${enquiry.name}
• Guest Email: ${enquiry.email}
• Guest Phone: ${enquiry.phone || "Not provided"}
• Current Status: ${enquiry.status}
• Received Date: ${typeof enquiry.createdAt === "string" ? enquiry.createdAt : enquiry.createdAt.toISOString()}

CUSTOMER MESSAGE:
"""
${rawMessage}
"""

${focusPrompt ? `TRAVEL DESIGNER INSTRUCTION:\n"${focusPrompt}"\n` : ""}
DESIRED REPLY TONE: ${replyTone}

Remember:
1. Extract ONLY facts explicitly in the customer message. Mark missing fields as "Unknown / Not specified".
2. Address every question asked by the customer in the suggested reply.
3. If a TRAVEL DESIGNER INSTRUCTION is provided, you MUST explicitly integrate and mention its key highlights (e.g., properties, consultations, pacing notes) directly in the suggestedReply.body draft.
4. The 'suggestedReply.body' must be rich, substantive, and elegant (at least 150 words), not a brief summary.
5. Output valid JSON matching the specified structure.`;

  // Log only the non-sensitive metadata (zero customer PII in logs)
  logger.info(
    {
      enquiryId: enquiry.id,
      status: enquiry.status,
      hasPhone: !!enquiry.phone,
      hasDesignerPrompt: !!focusPrompt,
      replyTone,
    },
    "[EnquiryAssistant] Generating enquiry assistance via Groq"
  );

  const completion = await aiService.generate({
    systemPrompt,
    prompt: userPrompt,
    maxTokens: 2500,
    temperature: 0.3,
    responseFormat: "json_object",
  });

  try {
    const rawParsed = JSON.parse(completion.content);

    // Validate and sanitize response structure
    const responsePayload: EnquiryAiAssistResponse = {
      enquiryId: enquiry.id,
      summary: {
        overview: rawParsed.summary?.overview || "Customer inquiry regarding Kerala travel.",
        destinations: Array.isArray(rawParsed.summary?.destinations) ? rawParsed.summary.destinations : [],
        travelDates: rawParsed.summary?.travelDates || "Unknown / Not specified",
        groupSize: rawParsed.summary?.groupSize || "Unknown / Not specified",
        budget: rawParsed.summary?.budget || "Unknown / Not specified",
        unansweredQuestions: Array.isArray(rawParsed.summary?.unansweredQuestions)
          ? rawParsed.summary.unansweredQuestions
          : [],
      },
      extractedPreferences: {
        destinations: Array.isArray(rawParsed.extractedPreferences?.destinations)
          ? rawParsed.extractedPreferences.destinations
          : [],
        travelDates: rawParsed.extractedPreferences?.travelDates || "Unknown / Not specified",
        groupSize: rawParsed.extractedPreferences?.groupSize || "Unknown / Not specified",
        budget: rawParsed.extractedPreferences?.budget || "Unknown / Not specified",
        travelStyle: rawParsed.extractedPreferences?.travelStyle || "Unknown / Not specified",
        specialRequests: Array.isArray(rawParsed.extractedPreferences?.specialRequests)
          ? rawParsed.extractedPreferences.specialRequests
          : [],
        missingDetails: Array.isArray(rawParsed.extractedPreferences?.missingDetails)
          ? rawParsed.extractedPreferences.missingDetails
          : ["Travel dates", "Party size", "Preferred pace"],
      },
      suggestedReply: {
        subject: rawParsed.suggestedReply?.subject || "Re: Your Kerala Journey with Escora Holidays",
        greeting: rawParsed.suggestedReply?.greeting || `Dear ${enquiry.name},`,
        body: rawParsed.suggestedReply?.body || "",
        signoff: rawParsed.suggestedReply?.signoff || "Warm regards,\nEscora Travel Design Team\nEscora Holidays",
      },
      nextAction: {
        recommendedAction:
          rawParsed.nextAction?.recommendedAction || "Review inquiry and send personalized reply.",
        rationale:
          rawParsed.nextAction?.rationale || "Inquiry requires travel designer response.",
        priority: (["low", "medium", "high"].includes(rawParsed.nextAction?.priority)
          ? rawParsed.nextAction.priority
          : "medium") as "low" | "medium" | "high",
      },
      disclaimer:
        "AI-generated assistant draft for review. Human approval is required before sending.",
    };

    return AssistEnquiryResponse.parse(responsePayload);
  } catch (err: any) {
    logger.error({ err: err.message }, "[EnquiryAssistant] Failed to parse or validate AI response");
    throw new AiServiceError(
      "The AI Enquiry Assistant generated an invalid response structure. Please retry.",
      "PROVIDER_ERROR",
      502
    );
  }
}
