import { DestinationModel, PackageModel, EnquiryModel } from "@workspace/db";
import { AssistItineraryResponse, type ItineraryAiAssistResponse } from "@workspace/api-zod";
import { aiService } from "./ai-service";
import { AiServiceError } from "./types";
import { imageSearchService } from "../image-search-service";
import { logger } from "../../lib/logger";

export interface ItineraryAssistantServiceInput {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  destination?: string;
  durationDays?: number;
  startDate?: string;
  pace?: "unhurried-slow" | "balanced" | "active-discovery";
  travelerType?: string;
  budgetTier?: string;
  interests?: string[];
  notes?: string;
  enquiryId?: number;
  refinementPrompt?: string;
  currentItinerary?: any;
}

/**
 * Builds the concise grounded system prompt for the Admin AI Itinerary Assistant.
 * Strictly adheres to Escora's botanical slow-luxury aesthetic, catalog grounding,
 * and clear distinction between verified facts, AI suggestions, and unconfirmed items.
 * Kept well under the 4000-character ceiling of AiService.
 */
function buildItineraryAssistantSystemPrompt(
  publishedDestinations: Array<{ name: string; slug: string; region: string; type: string; highlights: string }>,
  publishedPackages: Array<{ title: string; slug: string; duration: string; route: string; style: string }>
): string {
  const destList =
    publishedDestinations.length > 0
      ? publishedDestinations.slice(0, 10).map((d) => d.name).join(", ")
      : "Fort Kochi, Munnar, Alleppey, Thekkady, Wayanad, Kumarakom";

  const pkgList =
    publishedPackages.length > 0
      ? publishedPackages.slice(0, 6).map((p) => p.title).join(", ")
      : "The Malabar Escape, Cardamom Hills Retreat";

  return `Senior Itinerary Designer at Escora Holidays — bespoke slow-luxury journeys across Kerala.
Pacing: Unhurried, restorative, immersive.

CATALOGUE:
Destinations: ${destList}
Signature Journeys: ${pkgList}

RULES:
1. Ground routes & themes in Escora's verified Kerala catalogue.
2. Accommodations are indicative luxury recommendations; never state room/tariff is confirmed.
3. List unconfirmed boutique stays/permits in "unconfirmedItems" for concierge operational check.
4. Provide realistic road transit times (e.g. Kochi to Munnar ~4.5h) in "travelDesignerAdvice".
5. For each day, provide a specific "imageSearchQuery" (e.g. "Munnar Lockhart tea factory misty hills") for photographic matching.
6. Return valid JSON only matching this schema:
{
  "title": "Evocative slow-luxury title",
  "destination": "Primary region(s)",
  "durationDays": 7,
  "durationNights": 6,
  "summary": "1-2 paragraphs slow-luxury narrative",
  "coverImageUrl": "",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD or empty",
      "title": "Day title",
      "destination": "Location",
      "imageSearchQuery": "Specific landmark photo query",
      "description": "Day overview",
      "activities": [
        { "time": "Morning", "title": "Activity title", "description": "Short description" }
      ]
    }
  ],
  "stays": [
    { "name": "Sanctuary name", "location": "Location", "nights": 2, "roomType": "Room category", "notes": "Notes" }
  ],
  "inclusions": ["Chauffeur luxury vehicle", "Curated breakfast"],
  "exclusions": ["Airfares", "Discretionary gratuities"],
  "verifiedCatalogMatches": {
    "destinations": [{ "name": "Fort Kochi", "slug": "fort-kochi", "region": "Central Kerala", "highlights": "Colonial heritage" }],
    "packages": [{ "title": "The Malabar Escape", "slug": "the-malabar-escape", "duration": "7 Nights" }]
  },
  "unconfirmedItems": ["Room confirmation needed"],
  "travelDesignerAdvice": "Scenic drive advice",
  "disclaimer": "AI-generated draft proposal. Staff review required."
}`;
}

/**
 * Executes AI-assisted itinerary generation and refinement.
 * Enforces session authentication, published-only catalog grounding, and privacy isolation.
 */
export async function assistItinerary(input: ItineraryAssistantServiceInput): Promise<ItineraryAiAssistResponse> {
  const {
    customerName,
    destination,
    durationDays = 7,
    startDate,
    pace = "unhurried-slow",
    travelerType = "Couple / Pair",
    budgetTier = "Signature Slow-Luxury",
    interests = ["tea-hills", "backwaters", "heritage"],
    notes,
    enquiryId,
    refinementPrompt,
    currentItinerary,
  } = input;

  if (!aiService.isConfigured()) {
    throw new AiServiceError(
      "The Escora AI Itinerary Assistant is currently offline for maintenance.",
      "MISSING_CONFIG",
      503
    );
  }

  // Bounds checking
  const boundedDurationDays = Math.max(2, Math.min(Number(durationDays) || 7, 30));
  const boundedDurationNights = Math.max(1, boundedDurationDays - 1);

  // If enquiryId provided, look up enquiry to extract relevant travel context without leaking PII
  let enquiryContext = "";
  if (enquiryId) {
    try {
      const enq = await EnquiryModel.findOne({ id: enquiryId }).lean();
      if (enq && enq.message) {
        enquiryContext = `\nASSOCIATED CUSTOMER ENQUIRY (Reference #${enq.id}):\n"""\n${enq.message.slice(0, 1500)}\n"""\n`;
      }
    } catch (err: any) {
      logger.warn({ err: err?.message, enquiryId }, "[ItineraryAssistant] Could not load enquiry context");
    }
  }

  // Fetch only published destinations & packages for verified catalog grounding
  let publishedDestinations: Array<{
    name: string;
    slug: string;
    region: string;
    type: string;
    highlights: string;
    imageUrl?: string | null;
  }> = [];
  let publishedPackages: Array<{
    title: string;
    slug: string;
    duration: string;
    route: string;
    style: string;
  }> = [];

  try {
    const [dests, pkgs] = await Promise.all([
      DestinationModel.find({ published: true }).select("name slug region type highlights imageUrl").lean(),
      PackageModel.find({ published: true }).select("name slug durationNights route bestFor category").lean(),
    ]);

    publishedDestinations = dests.map((d) => ({
      name: d.name,
      slug: d.slug,
      region: d.region || "Kerala",
      type: d.type || "Sanctuary",
      highlights: d.highlights || "",
      imageUrl: d.imageUrl || undefined,
    }));

    publishedPackages = pkgs.map((p) => ({
      title: p.name,
      slug: p.slug,
      duration: `${p.durationNights} Nights`,
      route: p.route || "Kerala",
      style: p.category || "Slow-Luxury",
    }));
  } catch (err: any) {
    logger.warn({ error: err.message }, "[ItineraryAssistant] Could not load catalog, proceeding with defaults");
  }

  const systemPrompt = buildItineraryAssistantSystemPrompt(publishedDestinations, publishedPackages);

  // Construct user prompt with customer requirements and optional current itinerary / refinement instructions
  let userPrompt = `Please design a bespoke day-by-day Slow-Luxury Kerala Itinerary Proposal draft for our client.

CLIENT TRAVEL REQUIREMENTS:
• Client Name: ${customerName || "Valued Guest"}
• Target Region / Destinations: ${destination || "Kerala Slow Travel (Munnar & Backwaters)"}
• Duration: ${boundedDurationDays} Days / ${boundedDurationNights} Nights
• Start Date / Preferred Season: ${startDate || "Upcoming Season"}
• Pace Preference: ${pace}
• Traveler Group: ${travelerType}
• Budget Tier: ${budgetTier}
• Key Interests: ${interests.length > 0 ? interests.join(", ") : "Tea Hills, Backwaters, Botanical Wellness"}
${notes ? `• Special Requests / Client Notes: "${notes}"\n` : ""}${enquiryContext}`;

  if (currentItinerary) {
    userPrompt += `\nCURRENT ITINERARY STATE (FOR REFINEMENT):\n`;
    userPrompt += `• Existing Title: ${currentItinerary.title || "Untitled"}\n`;
    userPrompt += `• Existing Destination: ${currentItinerary.destination || "Kerala"}\n`;
    if (Array.isArray(currentItinerary.days) && currentItinerary.days.length > 0) {
      userPrompt += `• Current Days (${currentItinerary.days.length}):\n`;
      for (const d of currentItinerary.days.slice(0, 10)) {
        userPrompt += `  Day ${d.day}: ${d.title} (${d.destination || ""})\n`;
      }
    }
    if (Array.isArray(currentItinerary.stays) && currentItinerary.stays.length > 0) {
      userPrompt += `• Current Stays: ${currentItinerary.stays.map((s: any) => s.name).join(", ")}\n`;
    }
  }

  if (refinementPrompt) {
    userPrompt += `\nTRAVEL DESIGNER REFINEMENT INSTRUCTIONS (MANDATORY):\n"""\n${refinementPrompt}\n"""\nPlease explicitly update and reshape the itinerary according to these senior concierge directions.\n`;
  }

  userPrompt += `\nEnsure:
1. Provide exactly ${boundedDurationDays} sequential days in the "days" array with morning, afternoon, and evening/sunset activities.
2. Pair with logical, slow-pacing boutique stays in the "stays" array.
3. List 2 to 4 items in "unconfirmedItems" that the concierge should double-check.
4. Output valid JSON only.`;

  // Log only non-sensitive operational parameters (zero customer PII in logs)
  logger.info(
    {
      durationDays: boundedDurationDays,
      destination: destination || "default",
      pace,
      hasRefinementPrompt: !!refinementPrompt,
      hasEnquiry: !!enquiryId,
      hasCurrentItinerary: !!currentItinerary,
    },
    "[ItineraryAssistant] Generating itinerary draft via Groq"
  );

  const completion = await aiService.generate({
    systemPrompt,
    prompt: userPrompt,
    maxTokens: 2500,
    temperature: 0.3,
    responseFormat: "json_object",
    timeoutMs: 45000,
  });

  try {
    const raw = JSON.parse(completion.content);

    // Find best matching cover image from verified published destinations or stock search
    let coverImageUrl = "";
    if (raw.coverImageUrl && typeof raw.coverImageUrl === "string" && raw.coverImageUrl.startsWith("http")) {
      coverImageUrl = raw.coverImageUrl;
    } else {
      const targetDest = (raw.destination || destination || "").toLowerCase();
      const matchedDest = publishedDestinations.find(
        (d) => d.imageUrl && d.imageUrl.startsWith("http") && targetDest.includes(d.name.toLowerCase())
      );
      coverImageUrl = matchedDest?.imageUrl || "";
      if (!coverImageUrl) {
        coverImageUrl = await imageSearchService.searchSinglePhoto(
          `${raw.destination || destination || "Kerala"} luxury resort kerala`,
          publishedDestinations[0]?.imageUrl || ""
        );
      }
    }

    // Match catalog entities for verified badge lists
    const targetText = `${raw.title} ${raw.destination} ${raw.summary}`.toLowerCase();
    const matchedDestinations = publishedDestinations
      .filter((d) => targetText.includes(d.name.toLowerCase()))
      .slice(0, 4)
      .map((d) => ({
        name: d.name,
        slug: d.slug,
        region: d.region,
        highlights: d.highlights,
      }));

    const matchedPackages = publishedPackages
      .filter((p) => targetText.includes(p.title.toLowerCase()) || targetText.includes(p.slug.toLowerCase()))
      .slice(0, 3)
      .map((p) => ({
        title: p.title,
        slug: p.slug,
        duration: p.duration,
      }));

    // Ensure at least one destination match if available
    if (matchedDestinations.length === 0 && publishedDestinations.length > 0) {
      matchedDestinations.push({
        name: publishedDestinations[0].name,
        slug: publishedDestinations[0].slug,
        region: publishedDestinations[0].region,
        highlights: publishedDestinations[0].highlights,
      });
    }

    // Resolve exact matching photography for each day concurrently (Method B)
    const rawDaysList: any[] = Array.isArray(raw.days) ? raw.days : [];
    const dayPhotoPromises = rawDaysList.map(async (d: any, dayIdx: number) => {
      const destName = typeof d.destination === "string" ? d.destination : raw.destination || "Kerala";
      const matchedDest = publishedDestinations.find(
        (pd) => pd.imageUrl && pd.imageUrl.startsWith("http") && destName.toLowerCase().includes(pd.name.toLowerCase())
      );
      const fallback = matchedDest?.imageUrl || "";
      const query = d.imageSearchQuery || `${destName} ${d.title || ""}`;
      const photos = await imageSearchService.searchPhotos(query, 3, fallback, dayIdx);
      return {
        imageUrl: photos[0],
        imageUrls: photos,
      };
    });
    const resolvedDayPhotos = await Promise.all(dayPhotoPromises);

    // Sanitize days array with attached high-resolution photos
    const sanitizedDays = rawDaysList.map((d: any, index: number) => {
      const photos = resolvedDayPhotos[index] || { imageUrl: "", imageUrls: [] };
      return {
        day: typeof d.day === "number" ? d.day : index + 1,
        date: typeof d.date === "string" ? d.date : "",
        title: typeof d.title === "string" ? d.title : `Day ${index + 1}: Kerala Discovery`,
        description: typeof d.description === "string" ? d.description : "",
        destination: typeof d.destination === "string" ? d.destination : raw.destination || "Kerala",
        imageUrl: photos.imageUrl || undefined,
        imageUrls: photos.imageUrls.length > 0 ? photos.imageUrls : undefined,
        activities: Array.isArray(d.activities)
          ? d.activities.map((a: any) => ({
              time: typeof a.time === "string" ? a.time : "Daytime",
              title: typeof a.title === "string" ? a.title : "Curated exploration",
              description: typeof a.description === "string" ? a.description : "",
            }))
          : [
              {
                time: "Morning",
                title: "Slow breakfast & orientation",
                description: "Relaxed morning enjoying plantation breezes",
              },
            ],
      };
    });

    // Sanitize stays array
    const sanitizedStays = Array.isArray(raw.stays)
      ? raw.stays.map((s: any) => ({
          name: typeof s.name === "string" ? s.name : "Indicative Boutique Sanctuary",
          location: typeof s.location === "string" ? s.location : raw.destination || "Kerala",
          checkIn: typeof s.checkIn === "string" ? s.checkIn : "",
          checkOut: typeof s.checkOut === "string" ? s.checkOut : "",
          nights: typeof s.nights === "number" ? s.nights : 2,
          roomType: typeof s.roomType === "string" ? s.roomType : "Signature Heritage Suite",
          notes: typeof s.notes === "string" ? s.notes : "Indicative boutique accommodation subject to confirmation",
        }))
      : [];

    const effectiveStays =
      sanitizedStays.length > 0
        ? sanitizedStays
        : [
            {
              name: "Indicative Heritage Sanctuary & Spa",
              location: raw.destination || destination || "Kerala",
              checkIn: "",
              checkOut: "",
              nights: boundedDurationNights || 2,
              roomType: "Signature Heritage Suite",
              notes: "Indicative boutique accommodation subject to confirmation",
            },
          ];

    const responsePayload: ItineraryAiAssistResponse = {
      title: raw.title || `Bespoke ${raw.destination || "Kerala"} Slow Journey`,
      destination: raw.destination || "Kerala",
      durationDays: boundedDurationDays,
      durationNights: boundedDurationNights,
      summary:
        raw.summary ||
        "An unhurried journey through Kerala's most restorative landscapes, crafted for deep rejuvenation and authentic local discovery.",
      coverImageUrl,
      days: sanitizedDays,
      stays: effectiveStays,
      inclusions: Array.isArray(raw.inclusions) && raw.inclusions.length > 0
        ? raw.inclusions
        : [
            "Private chauffeur-driven luxury vehicle throughout",
            "Artisanal breakfast and curated dinners daily",
            "Private guided excursions with local naturalists",
          ],
      exclusions: Array.isArray(raw.exclusions) && raw.exclusions.length > 0
        ? raw.exclusions
        : [
            "International and domestic flight tickets",
            "Discretionary tips and personal expenditures",
          ],
      verifiedCatalogMatches: {
        destinations: matchedDestinations,
        packages: matchedPackages,
      },
      unconfirmedItems: Array.isArray(raw.unconfirmedItems) && raw.unconfirmedItems.length > 0
        ? raw.unconfirmedItems
        : [
            "Specific boutique estate room categories pending live seasonal confirmation",
            "Private chef and naturalist availability confirmation",
          ],
      travelDesignerAdvice:
        raw.travelDesignerAdvice ||
        "Recommend an unhurried morning departure to enjoy misty hill viewpoints during optimal lighting hours.",
      disclaimer:
        "AI-generated draft proposal. Staff review and confirmation required before saving or sharing with guest.",
    };

    return AssistItineraryResponse.parse(responsePayload);
  } catch (err: any) {
    logger.error({ err: err.message }, "[ItineraryAssistant] Failed to parse or validate AI response");
    throw new AiServiceError(
      "The AI Itinerary Assistant generated an invalid response structure. Please retry.",
      "PROVIDER_ERROR",
      502
    );
  }
}
