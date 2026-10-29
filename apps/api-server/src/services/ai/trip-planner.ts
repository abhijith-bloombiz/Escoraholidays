import { DestinationModel, PackageModel, type IDestination, type IPackage } from "@workspace/db";
import { aiService } from "./ai-service";
import { AiServiceError } from "./types";
import { imageSearchService } from "../image-search-service";
import { logger } from "../../lib/logger";

export interface TripPlanRequestData {
  durationDays: number;
  seasonOrDates?: string;
  startLocation?: string;
  travelersCount?: number;
  travelerType?: string;
  budgetTier?: string;
  currency?: string;
  interests?: string[];
  pace?: string;
  additionalNotes?: string;
  refinementPrompt?: string;
  currentItinerary?: any;
}

export interface GroundedEntityItem {
  name: string;
  slug: string;
  url: string;
  type: "destination" | "journey";
  highlightsOrRoute: string;
}

export interface DayItineraryItem {
  day: number;
  title: string;
  destination: string;
  destinationSlug?: string;
  theme?: string;
  morningActivity: string;
  afternoonActivity: string;
  eveningActivity: string;
  stayRecommendation: string;
  travelNote?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

import { currencyService, type TripBudgetDetails, type SupportedCurrency } from "../currency-service";

export interface FormattedTripItinerary {
  title: string;
  tagline: string;
  overview: string;
  durationDays: number;
  durationNights: number;
  routeSequence: string[];
  idealSeason: string;
  pace: string;
  budgetGuidance: string;
  budget?: TripBudgetDetails;
  days: DayItineraryItem[];
  verifiedDestinations: GroundedEntityItem[];
  verifiedJourneys: GroundedEntityItem[];
  practicalAdvice: string[];
  catalogueNotice: string;
  realisticAssessment?: string;
}

export interface TripPlannerResult {
  itinerary: FormattedTripItinerary;
  provider: string;
  model: string;
  refinementSuggestions: string[];
}

const CATALOGUE_DISCLAIMER =
  "All destinations, curated routes, and journey themes are drawn directly from Escora Holidays' verified published Kerala catalog. Accommodation references describe indicative boutique sanctuary styles; property reservation and exact quotes are personalized with your dedicated Escora travel designer.";

/**
 * Builds factual, safely grounded Escora context and generates a day-by-day slow-luxury trip itinerary.
 * Strictly queries published records. Never touches customer bookings, enquiries, or private notes.
 */
export async function planEscoraTrip(data: TripPlanRequestData): Promise<TripPlannerResult> {
  // Check service availability
  if (!aiService.isConfigured()) {
    throw new AiServiceError(
      "The Escora AI Trip Planner is temporarily offline for maintenance. Please explore our curated journeys or connect directly with our travel designers.",
      "MISSING_CONFIG",
      503,
      aiService.getProviderName()
    );
  }

  // 1. Query verified published catalog only
  const [destinations, packages] = await Promise.all([
    DestinationModel.find({ published: true }).lean(),
    PackageModel.find({ published: true }).lean(),
  ]);

  const durationDays = Math.max(2, Math.min(data.durationDays || 7, 30));
  const durationNights = Math.max(1, durationDays - 1);
  const season = data.seasonOrDates?.trim() || "Winter (October to March)";
  const startLoc = data.startLocation?.trim() || "Kochi (COK Airport)";
  const travelersCount = Math.max(1, Math.min(data.travelersCount || 2, 50));
  const travelerType = data.travelerType?.trim() || "Couple / Pair";
  const budgetTier = data.budgetTier?.trim() || "Signature Slow-Luxury";
  const currency = data.currency?.trim() || "INR";
  const interests = data.interests && data.interests.length > 0
    ? data.interests
    : ["tea-hills", "backwaters", "heritage"];
  const pace = data.pace?.trim() || "Slow & Unhurried";
  const notes = (data.additionalNotes || "").slice(0, 1000).trim();
  const refinementPrompt = (data.refinementPrompt || "").slice(0, 1000).trim();

  // Deterministically compute authoritative canonical INR budget and target currency conversion
  const budgetDetails = await currencyService.calculateTripBudget(
    budgetTier,
    durationDays,
    travelersCount,
    currency
  );

  // 2. Format catalog for AI context
  const catalogDestinationsText = destinations
    .map((d) => {
      const stay = d.nightsMin && d.nightsMax ? `${d.nightsMin}–${d.nightsMax} nights` : "2–3 nights";
      const seasonInfo = d.bestSeason || "October to March";
      const desc = d.shortDesc || d.description || d.highlights || "";
      return `- Destination: "${d.name}" | Slug: "${d.slug}" | Region: ${d.region} | Type: ${d.type} | Ideal Stay: ${stay} | Season: ${seasonInfo} | Highlights: ${desc.slice(0, 200)}`;
    })
    .join("\n");

  const catalogPackagesText = packages
    .map((p) => {
      const price = p.priceFrom ? `Indicative from ₹${p.priceFrom.toLocaleString("en-IN")}` : "Custom";
      return `- Curated Journey: "${p.name}" | Slug: "${p.slug}" | Route: ${p.route} | Duration: ${p.durationNights} nights | Best For: ${p.bestFor || "Slow Luxury"} | Price: ${price}`;
    })
    .join("\n");

  // 3. System prompt enforcing Escora slow-luxury rules, catalog strictness, conciseness, and schema adherence
  const systemPrompt = `You are the Master Travel Designer for Escora Holidays — South India's premier slow-luxury, experiential travel house.
You craft meticulously paced, sensory, unhurried journeys through God's Own Country (Kerala).

CRITICAL GROUNDING RULES:
1. APPROVED CATALOG STRICTNESS:
   - Base your itinerary ONLY on the verified published Escora destinations and journeys listed below.
   - You MUST select destinations from this list: ${destinations.map((d) => `"${d.name}"`).join(", ")}.
   - If asked for destinations outside Kerala or South India (e.g. Paris, Tokyo, Himalayas), explain politely in 'realisticAssessment' that Escora specializes exclusively in Kerala & South India slow travel, and redirect to the verified Kerala catalog.

2. SLOW-LUXURY PACING CONTRACT:
   - Real luxury is time and tranquility, not racing to check off tourist spots.
   - For a ${durationDays}-day voyage, limit the route to ${durationDays <= 4 ? "1 to 2" : durationDays <= 8 ? "2 to 3" : "3 to 4"} core destinations.
   - Road transfers in Kerala's Western Ghats take 3.5 to 5 hours of scenic driving; avoid scheduling transfers on consecutive days whenever possible.
   - If the requested duration or interest combination is too rushed, prioritize quality over quantity and explain your pacing adjustments in 'realisticAssessment'.

3. CONCISE, HIGH-VALUE LUXURY WRITING (CRITICAL):
   - Produce concise, clear, premium-quality content. Shorten the text length, NOT the travel experience or recommendation quality.
   - Deliver maximum substance with minimum words. Avoid long rambling paragraphs, repetitive descriptions, and unnecessary introductions.
   - Eliminate filler phrases and travel clichés (e.g., 'enjoy the beautiful scenery', 'soak in the sights and sounds', 'as the morning sun rises', 'take time to relax and unwind').
   - Use specific, destination-relevant language, genuine local landmarks, and authentic cultural or nature experiences (e.g., 'private solar cruise through Punnamada backwaters', 'guided walk through Lockhart tea factory', 'sunset Kathakali demonstration at Fort Kochi').
   - Voyage Overview: Exactly 2 concise sentences (approx 35–55 words total) detailing the voyage arc and distinctive character. Evocative, meaningful, easy to scan.
   - Day Title: Short, descriptive day title (3–6 words, e.g., 'Colonial Fort Kochi & Harbor').
   - Daily Themes: Approximately one concise sentence (usually 15–25 words) capturing the day's distinctive focus and atmosphere without filler.
   - Activities: Present 'morningActivity', 'afternoonActivity', and 'eveningActivity' as short labels or compact text (10–18 words each) specifying the distinctive experience, venue, or sight without lengthy explanations or filler.
   - Retain only the most relevant 2–4 distinctive recommendations for each day. Avoid listing too many activities simply to fill the itinerary, and avoid duplicating attractions across days unless revisiting is intentional.
   - Accommodations: Keep 'stayRecommendation' concise (under 8 words), showing the sanctuary category and overnight location clearly (e.g., 'Heritage tea bungalow, Munnar').
   - Logistics: Keep 'travelNote' concise and practical (under 10 words, e.g., '3.5h scenic private transfer'), or null if staying put.
   - Personalization: Preserve full personalization reflecting the guest's selected interests, duration, party composition, budget tier, and requested pace.

4. NON-FABRICATION:
   - Do NOT invent specific hotel room confirmation numbers, real-time availability, or guaranteed locked prices.
   - Describe accommodations by sanctuary category and style (e.g., "Restored Dutch colonial heritage villa", "Boutique tea plantation bungalow", "Private solar-assisted backwater cruiser").

5. OUTPUT FORMAT (MANDATORY):
   - You MUST output ONLY a valid JSON object matching the requested schema. No markdown formatting outside the JSON, no intro text, no conversational sign-offs.`;

  // 4. User prompt formulating guest requirements or refinement
  let userPrompt = `GUEST TRIP SPECIFICATIONS:
- Duration: ${durationDays} Days / ${durationNights} Nights
- Preferred Season / Travel Dates: ${season}
- Starting Hub: ${startLoc}
- Travelers: ${travelersCount} guest(s) (${travelerType})
- Desired Travel Style & Pace: ${pace}
- Selected Interests: ${interests.join(", ")}
- Target Budget Tier: ${budgetTier} (${currency}) [Baseline: ${budgetDetails.canonicalInr.formatted}]
${notes ? `- Special Requests & Preferences: "${notes}"` : ""}

VERIFIED ESCORA CATALOG:
[Approved Destinations]
${catalogDestinationsText}

[Approved Journeys]
${catalogPackagesText}
`;

  if (refinementPrompt && data.currentItinerary) {
    userPrompt += `
REFINEMENT INSTRUCTION:
The guest has reviewed their previous itinerary ("${data.currentItinerary.title || "Previous Kerala Journey"}") and requests the following specific refinement:
"${refinementPrompt}"

Please update and refine the day-by-day plan to honor this request while maintaining logical geographical routing, Escora's slow-luxury philosophy, and concise premium wording.
`;
  } else {
    userPrompt += `
Please design an unhurried, evocative ${durationDays}-day day-by-day slow-luxury Kerala itinerary for this guest. Keep all text concise, clear, and premium in quality.`;
  }

  userPrompt += `
JSON OUTPUT SCHEMA:
{
  "title": "Evocative journey title (e.g., 'Mist & Waters: A 7-Day Kerala Passage')",
  "tagline": "Poetic single-sentence essence of the trip (under 15 words)",
  "overview": "Concise 2-sentence slow-luxury overview of the voyage arc (approx 35–55 words, no filler)",
  "durationDays": ${durationDays},
  "durationNights": ${durationNights},
  "routeSequence": ["Array of destination names in travel order"],
  "idealSeason": "Season or timing summary",
  "pace": "${pace}",
  "realisticAssessment": "Honest 1-sentence assessment of pacing and transit feasibility",
  "days": [
    {
      "day": 1,
      "title": "Short descriptive title (3–6 words, e.g. 'Colonial Fort Kochi & Sunset Harbor')",
      "destination": "Verified destination name from catalog",
      "destinationSlug": "Matching slug from catalog",
      "imageSearchQuery": "Munnar tea plantation misty morning",
      "theme": "One concise sentence (15–25 words) capturing the day's focus and atmosphere",
      "morningActivity": "Short label or compact text (10–18 words) focusing on distinctive experience or landmark",
      "afternoonActivity": "Short label or compact text (10–18 words) focusing on distinctive experience or landmark",
      "eveningActivity": "Short label or compact text (10–18 words) focusing on distinctive experience or landmark",
      "stayRecommendation": "Concise sanctuary category & overnight location (under 8 words, e.g. 'Heritage boutique villa, Fort Kochi')",
      "travelNote": "Essential transit timing or null if staying put (under 10 words, e.g. '3.5h scenic private transfer')"
    }
    // Repeat for all ${durationDays} days
  ]
}`;

  logger.info(
    { durationDays, travelersCount, interests, budgetTier, isRefinement: Boolean(refinementPrompt) },
    "[TripPlanner] Generating grounded trip plan via Groq"
  );

  // 5. Generate via Groq using responseFormat: "json_object"
  const completion = await aiService.generate({
    systemPrompt,
    prompt: userPrompt,
    responseFormat: "json_object",
    maxTokens: 3500,
    temperature: 0.6,
    timeoutMs: 35000,
  });

  // 6. Parse and sanitize JSON output
  let parsedRaw: any;
  try {
    const rawContent = completion.content.trim();
    parsedRaw = JSON.parse(rawContent);
  } catch (err: any) {
    logger.warn({ error: err.message }, "[TripPlanner] Failed to parse initial JSON completion; attempting recovery");
    // Fallback regex to extract JSON object
    const match = completion.content.match(/\{[\s\S]*\}/);
    if (match) {
      parsedRaw = JSON.parse(match[0]);
    } else {
      throw new AiServiceError(
        "The AI provider generated an unstructured response. Please retry.",
        "PROVIDER_ERROR",
        502,
        completion.provider
      );
    }
  }

  // 7. Grounding Verification & Link Resolution
  // Cross-reference all days and destinations against the active published catalog
  const destByLower = new Map<string, IDestination>();
  const destBySlug = new Map<string, IDestination>();

  for (const d of destinations) {
    destByLower.set(d.name.toLowerCase(), d);
    destBySlug.set(d.slug.toLowerCase(), d);
  }

  const rawDays: any[] = Array.isArray(parsedRaw.days) ? parsedRaw.days : [];
  const referencedDestSlugs = new Set<string>();

  // Concurrently resolve exact photos for all itinerary days (Method B)
  const dayPhotoPromises = [];
  for (let i = 0; i < durationDays; i++) {
    const rawDay = rawDays[i] || {};
    const destName = rawDay.destination || "Kerala";
    const matchedDest = destByLower.get(destName.toLowerCase()) || destBySlug.get((rawDay.destinationSlug || "").toLowerCase());
    const fallbackPhoto = matchedDest?.imageUrl || "";
    const query = rawDay.imageSearchQuery || `${matchedDest?.name || destName} ${rawDay.title || ""}`;
    dayPhotoPromises.push(imageSearchService.searchPhotos(query, 3, fallbackPhoto, i));
  }
  const resolvedPhotos = await Promise.all(dayPhotoPromises);

  const normalizedDays: DayItineraryItem[] = [];
  for (let i = 0; i < durationDays; i++) {
    const rawDay = rawDays[i] || {};
    const dayNum = i + 1;
    const destName = rawDay.destination || "Kerala";
    const matchedDest = destByLower.get(destName.toLowerCase()) || destBySlug.get((rawDay.destinationSlug || "").toLowerCase());

    const slug = matchedDest ? matchedDest.slug : (rawDay.destinationSlug || "kerala");
    if (matchedDest) {
      referencedDestSlugs.add(matchedDest.slug);
    }

    const photos = resolvedPhotos[i] || [];

    normalizedDays.push({
      day: dayNum,
      title: rawDay.title || `Day ${dayNum}: Immersive Exploration of ${destName}`,
      destination: matchedDest ? matchedDest.name : destName,
      destinationSlug: slug,
      theme: rawDay.theme || "Slow Kerala Living",
      morningActivity: rawDay.morningActivity || "Unhurried breakfast followed by gentle morning stroll.",
      afternoonActivity: rawDay.afternoonActivity || "Experiential discovery and afternoon sanctuary rest.",
      eveningActivity: rawDay.eveningActivity || "Atmospheric sunset viewing and local culinary dinner.",
      stayRecommendation: rawDay.stayRecommendation || "Curated slow-luxury boutique sanctuary.",
      travelNote: rawDay.travelNote || undefined,
      imageUrl: photos[0] || undefined,
      imageUrls: photos.length > 0 ? photos : undefined,
    });
  }

  // Collect verified published destination entities
  const verifiedDestinations: GroundedEntityItem[] = [];
  for (const slug of referencedDestSlugs) {
    const d = destBySlug.get(slug);
    if (d) {
      verifiedDestinations.push({
        name: d.name,
        slug: d.slug,
        url: `/destinations/${d.slug}`,
        type: "destination",
        highlightsOrRoute: d.shortDesc || d.highlights || `${d.region} · ${d.type}`,
      });
    }
  }

  // If few destinations matched, include top 2 general published destinations
  if (verifiedDestinations.length === 0 && destinations.length > 0) {
    for (const d of destinations.slice(0, 3)) {
      verifiedDestinations.push({
        name: d.name,
        slug: d.slug,
        url: `/destinations/${d.slug}`,
        type: "destination",
        highlightsOrRoute: d.shortDesc || d.highlights || `${d.region} · ${d.type}`,
      });
    }
  }

  // Find relevant verified packages that match the route
  const verifiedJourneys: GroundedEntityItem[] = [];
  for (const p of packages) {
    const routeLower = (p.route || "").toLowerCase();
    const matchesRoute = verifiedDestinations.some((vd) => routeLower.includes(vd.name.toLowerCase()));
    if (matchesRoute && verifiedJourneys.length < 3) {
      verifiedJourneys.push({
        name: p.name,
        slug: p.slug,
        url: `/journeys/${p.slug}`,
        type: "journey",
        highlightsOrRoute: p.route || "Kerala Highlights",
      });
    }
  }

  // Default fallback journey if none matched
  if (verifiedJourneys.length === 0 && packages.length > 0) {
    const defaultPkg = packages[0];
    verifiedJourneys.push({
      name: defaultPkg.name,
      slug: defaultPkg.slug,
      url: `/journeys/${defaultPkg.slug}`,
      type: "journey",
      highlightsOrRoute: defaultPkg.route || "Kerala Slow Luxury Route",
    });
  }

  // Dynamic contextual refinement suggestions
  const rawRefinements: string[] = Array.isArray(parsedRaw.refinementSuggestions)
    ? parsedRaw.refinementSuggestions.filter((s: any) => typeof s === "string" && s.trim().length > 0)
    : [];

  const defaultRefinements = [
    "Make this pace even more relaxed with 3 nights in one sanctuary",
    "Focus more on organic farm-to-table cuisine and Ayurveda wellness",
    "Incorporate a tranquil Arabian Sea cliffside beach retreat",
  ];

  const finalRefinements = rawRefinements.length >= 2 ? rawRefinements.slice(0, 4) : defaultRefinements;

  // Construct final formatted itinerary
  const itinerary: FormattedTripItinerary = {
    title: parsedRaw.title || `The ${durationDays}-Day Kerala Slow-Luxury Odyssey`,
    tagline: parsedRaw.tagline || "An unhurried voyage through South India's emerald hills and mirror backwaters.",
    overview: parsedRaw.overview || "A thoughtfully curated journey across Kerala, crafted around conscious discovery and serene stays.",
    durationDays,
    durationNights,
    routeSequence: Array.isArray(parsedRaw.routeSequence) && parsedRaw.routeSequence.length > 0
      ? parsedRaw.routeSequence
      : verifiedDestinations.map((d) => d.name),
    idealSeason: parsedRaw.idealSeason || season,
    pace,
    budgetGuidance: budgetDetails.guidanceText,
    budget: budgetDetails,
    realisticAssessment: parsedRaw.realisticAssessment || `This ${durationDays}-day itinerary balances scenic transit with restful sanctuary stays, ensuring you experience Kerala deeply rather than spending all day in transport.`,
    days: normalizedDays,
    verifiedDestinations,
    verifiedJourneys,
    practicalAdvice: Array.isArray(parsedRaw.practicalAdvice) && parsedRaw.practicalAdvice.length > 0
      ? parsedRaw.practicalAdvice
      : [
          "Pack lightweight breathable linens and modest attire for heritage temple areas.",
          "Mountain drives to Munnar and Thekkady feature winding scenic roads; travel unhurriedly during daylight.",
          "Backwater cruises are best enjoyed during golden sunset hours when village waterways calm down.",
        ],
    catalogueNotice: CATALOGUE_DISCLAIMER,
  };

  return {
    itinerary,
    provider: completion.provider,
    model: completion.model,
    refinementSuggestions: finalRefinements,
  };
}
