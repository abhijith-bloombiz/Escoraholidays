export interface VisualCampaignFields {
  name: string;
  audienceType: "all_contacts" | "enquiries_only" | "confirmed_guests" | "custom_segment" | "audience_group";
  groupId?: string;
  groupIds?: string[];
  subject: string;
  previewText: string;
  templateId: string;
  eyebrow: string;
  heading: string;
  lead?: string;
  heroImage?: string;
  body: string;
  quote?: string;
  highlights?: string[];
  ctaText: string;
  ctaUrl: string;
  secondaryNote?: string;
  accentColor: string; // e.g. #24543D (Forest Green), #855A18 (Antique Gold), #304F7D (Classic Navy)
}

export interface CampaignTemplatePreset {
  id: string;
  title: string;
  category:
    | "Travel Inspiration / Newsletter"
    | "Seasonal Travel Campaigns"
    | "Destination Spotlight"
    | "Special Offers and Holiday Packages"
    | "Welcome / Customer Engagement";
  badge: string;
  description: string;
  accentColor: string;
  defaultValues: Omit<VisualCampaignFields, "name" | "audienceType" | "templateId">;
}

export const CURATED_HERO_IMAGES = [
  {
    title: "Alleppey Houseboat Waters",
    url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    tag: "Waterways",
  },
  {
    title: "Munnar Mist & Cardamom Hills",
    url: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80",
    tag: "Highlands",
  },
  {
    title: "Monsoon Rainforests & Sanctuaries",
    url: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
    tag: "Monsoon",
  },
  {
    title: "Vembanad Lake Starlit Mooring",
    url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    tag: "Backwaters",
  },
  {
    title: "Fort Kochi Heritage & Palms",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    tag: "Heritage",
  },
];

export const CAMPAIGN_TEMPLATES: CampaignTemplatePreset[] = [
  {
    id: "kerala_chronicle",
    title: "The Kerala Chronicle (Editorial Newsletter)",
    category: "Travel Inspiration / Newsletter",
    badge: "Editorial Magazine",
    description: "Evocative slow-travel reflections, seasonal field notes, and quiet retreats from the Western Ghats to the coast.",
    accentColor: "#24543D",
    defaultValues: {
      subject: "The Kerala Chronicle: Stories of Untamed Backwaters & Spice Highlands",
      previewText: "Slow travel reflections, quiet waterways, and winter high range invitations.",
      eyebrow: "Escora Holidays · Editorial Dispatches",
      heading: "Quiet Waters & Mountain Whispers",
      lead: "A seasonal dispatch from the Western Ghats to the palm-fringed Arabian coast.",
      heroImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
      body: "Traveling slowly through Kerala is an invitation to inhabit the pause. At Escora, our journeys are shaped around the natural cadences of the land—where dawn breaks over misty cardamom plantations and afternoons unfold along still lake waterways.\n\nIn this season's dispatch, our private journey concierges share rare retreats, handpicked plantation stays, and the quietest corners of {{destination}}.",
      quote: "To travel slowly is not merely to change scenery, but to change the depth of one's attention.",
      highlights: [
        "Living Heritage of Fort Kochi · Private Art & Spice Walk",
        "The Cardamom Trail at Twilight · Naturalist-led Estate Walks",
        "Sunset Over Vembanad Lake · Private Lakeside Dining",
      ],
      ctaText: "Read the Kerala Journal",
      ctaUrl: "https://www.escoraholidays.com/journal",
      secondaryNote: "Questions about your upcoming journey? Reply directly to this note to speak with your private travel designer.",
      accentColor: "#24543D",
    },
  },
  {
    id: "monsoon_sanctuary",
    title: "Monsoon Sanctuary & Ayurvedic Restoration",
    category: "Seasonal Travel Campaigns",
    badge: "Seasonal Wellness",
    description: "Curative panchakarma therapies, misty Western Ghats mornings, and restorative lakeside stays during Kerala's renewal season.",
    accentColor: "#24543D",
    defaultValues: {
      subject: "The Monsoon Sanctuary: Slow Days and Ayurvedic Rejuvenation in Kerala",
      previewText: "Embrace misty Western Ghats mornings and ancient restorative treatments.",
      eyebrow: "Escora Holidays · Slow Sanctuaries",
      heading: "Greetings, {{name}}.",
      lead: "When rain awakens the ancient forests and Ayurvedic traditions of Kerala.",
      heroImage: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
      body: "As the south-west monsoon envelops Kerala in deep emerald and rain-scented breezes, the land enters its traditional season of renewal. In Ayurvedic philosophy, monsoon air opens the pores, creating the most receptive conditions of the year for curative panchakarma and restorative herbal oils.\n\nOur private journey designers are curating seven-to-ten day monsoon stays across our heritage sanctuaries in Munnar and Kumarakom, paired with dedicated Ayurvedic consultations and private lakeside dining.",
      quote: "Slow travel is not an absence of movement, but an elevation of presence.",
      highlights: [
        "Dedicated Ayurvedic Physician Consultations & Tailored Regimens",
        "Secluded Heritage Sanctuaries in Munnar & Kumarakom",
        "Artisanal Spice-Infused Dining Curated for Rejuvenation",
      ],
      ctaText: "Inquire with a Concierge",
      ctaUrl: "https://www.escoraholidays.com/plan",
      secondaryNote: "Limited private sanctuary suites available for the upcoming monsoon season.",
      accentColor: "#24543D",
    },
  },
  {
    id: "winter_tea",
    title: "Winter Tea Harvest & Cardamom Hills",
    category: "Destination Spotlight",
    badge: "Highland Retreat",
    description: "Exclusive invitation to Munnar's high ranges, private estate bungalows, single-batch tea tastings, and evening hearths.",
    accentColor: "#855A18",
    defaultValues: {
      subject: "Winter in the High Ranges: An Exclusive Invitation to the Cardamom Hills",
      previewText: "Crisp mountain air, handpicked teas, and crackling estate hearths.",
      eyebrow: "Escora Holidays · Mountain Retreats",
      heading: "Dear {{name}},",
      lead: "Crisp morning mist over the Cardamom Hills.",
      heroImage: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80",
      body: "Winter in Munnar brings dawn mists that gently peel back to reveal sunlit tea valleys, crisp highland breezes, and evenings gathered around heritage fireplaces. We invite you to experience the winter harvest at our private estate partner in the high ranges.\n\nEnjoy private naturalist-led birding excursions, tea tastings paired with single-estate artisanal batches, and bespoke dining overlooking the valleys of {{destination}}.",
      quote: "Among high tea terraces, stillness is the truest luxury.",
      highlights: [
        "Private Naturalist-Led Birding & Tea Valley Walks",
        "Bespoke Single-Estate Artisanal Tea Tasting Sessions",
        "Fireplace Dinners with Panoramic Cardamom Valley Views",
      ],
      ctaText: "Discover Signature Journeys",
      ctaUrl: "https://www.escoraholidays.com/packages",
      secondaryNote: "Reserve early for the prime November through February harvest window.",
      accentColor: "#855A18",
    },
  },
  {
    id: "backwater_houseboat",
    title: "Backwater Houseboat & Heritage Gastronomy",
    category: "Special Offers and Holiday Packages",
    badge: "Bespoke Journey",
    description: "Handcrafted kettuvallam voyages with private chefs, candlelit mooring on Vembanad Lake, and tranquil canal canoe journeys.",
    accentColor: "#304F7D",
    defaultValues: {
      subject: "Glide Along Still Waters: Handcrafted Houseboat Journeys in Alleppey",
      previewText: "Private chef dining, starlit canals, and untamed Vembanad tranquility.",
      eyebrow: "Escora Holidays · Waterway Sanctuaries",
      heading: "Warm greetings, {{name}}.",
      lead: "Private kettuvallams crafted for unhurried coastal stillness.",
      heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
      body: "The gentle rhythm of a private kettuvallam gliding through palm-fringed backwaters remains one of the world's most meditative travel experiences. On board Escora's private luxury houseboats, every meal is prepared by your personal chef using heritage coastal recipes.\n\nFrom tranquil canoe explorations through narrow village canals to candlelit starlit dinners on deck, let us design an unhurried escape tailored just for you.",
      quote: "The backwaters do not demand your attention; they gently quiet the mind until you notice everything.",
      highlights: [
        "Dedicated Chef On Board Crafting Bespoke Coastal Menus",
        "Hand-Paddled Canoe Exploration into Untouched Village Canals",
        "Overnight Mooring at Secluded Starlit Canals",
      ],
      ctaText: "Explore Sample Itineraries",
      ctaUrl: "https://www.escoraholidays.com/itineraries",
      secondaryNote: "Exclusive bespoke pricing and complimentary lakeside high tea for reservations confirmed this month.",
      accentColor: "#304F7D",
    },
  },
  {
    id: "welcome_invitation",
    title: "Welcome to the Escora Journey",
    category: "Welcome / Customer Engagement",
    badge: "Guest Welcome",
    description: "Gracious introduction to Escora's private journey atelier, dedicated designers, and slow luxury philosophy in Kerala.",
    accentColor: "#24543D",
    defaultValues: {
      subject: "Welcome to Escora Holidays: Where Kerala Unfolds at Your Pace",
      previewText: "Thank you for connecting with our private travel atelier.",
      eyebrow: "Escora Holidays · Welcome Invitation",
      heading: "Welcome to Escora, {{name}}.",
      lead: "Handcrafted journeys in God's Own Country.",
      heroImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      body: "Thank you for expressing an interest in exploring Kerala with Escora Holidays. We believe the finest travel is deeply personal, unhurried, and mindful of the land and its people.\n\nWhether you dream of misty tea hills in {{destination}}, restful backwater houseboats, or seaside Ayurvedic sanctuaries, our private journey designers are here to listen to what moves you and craft an itinerary that is entirely your own.",
      quote: "We do not sell pre-packaged tours; we shape private chapters in the story of your life.",
      highlights: [
        "100% Customized Itineraries Designed Around Your Pace",
        "Private Chauffeur & Handpicked Boutique Heritage Stays",
        "Direct 24/7 Concierge Support Throughout Your Entire Stay",
      ],
      ctaText: "Begin Designing Your Journey",
      ctaUrl: "https://www.escoraholidays.com/plan",
      secondaryNote: "Our journey designers are ready to prepare a complimentary initial proposal for you.",
      accentColor: "#24543D",
    },
  },
];

export const PERSONALIZATION_TAGS = [
  { tag: "{{name}}", label: "Guest Name", sample: "Lady Eleanor" },
  { tag: "{{destination}}", label: "Destination", sample: "Munnar & Alleppey" },
  { tag: "{{year}}", label: "Current Year", sample: "2026" },
  { tag: "{{email}}", label: "Guest Email", sample: "eleanor@example.com" },
  { tag: "{{unsubscribeUrl}}", label: "Unsubscribe Link", sample: "#" },
];

/**
 * Compiles visual form fields into bulletproof, responsive, inline-styled email HTML.
 */
export function generateCampaignHtml(fields: VisualCampaignFields): string {
  const accent = fields.accentColor || "#24543D";
  const goldAccent = "#cbab6e";

  const paragraphsHtml = fields.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="font-size: 15px; line-height: 1.7; color: #4a3d30; margin: 0 0 20px 0;">${p.replace(/\n/g, "<br/>")}</p>`
    )
    .join("\n");

  const quoteHtml = fields.quote?.trim()
    ? `
  <div style="background: #f0ece4; border-left: 3px solid ${accent}; padding: 18px 24px; margin: 28px 0; border-radius: 0 6px 6px 0;">
    <p style="font-style: italic; font-size: 15px; line-height: 1.6; color: #3a2e22; margin: 0;">
      &ldquo;${fields.quote.trim()}&rdquo;
    </p>
  </div>`
    : "";

  const highlightsHtml =
    fields.highlights && fields.highlights.filter((h) => h.trim().length > 0).length > 0
      ? `
  <div style="margin: 28px 0; padding: 20px; background: #faf8f5; border: 1px solid #ebdcc5; border-radius: 6px;">
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: ${accent}; font-weight: 700; margin-bottom: 12px;">Curated Highlights</div>
    <ul style="margin: 0; padding-left: 20px; color: #4a3d30; font-size: 14px; line-height: 1.8;">
      ${fields.highlights
        .filter((h) => h.trim().length > 0)
        .map((h) => `<li style="margin-bottom: 6px;">${h.trim()}</li>`)
        .join("")}
    </ul>
  </div>`
      : "";

  const heroImageHtml = fields.heroImage?.trim()
    ? `
  <div style="margin-bottom: 28px; text-align: center;">
    <img src="${fields.heroImage.trim()}" alt="${fields.heading || "Escora Journey"}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 6px; display: block;" />
  </div>`
    : "";

  const leadHtml = fields.lead?.trim()
    ? `<p style="font-size: 16px; line-height: 1.6; color: #6b5847; font-style: italic; margin: 0 0 20px 0;">${fields.lead.trim()}</p>`
    : "";

  const secondaryNoteHtml = fields.secondaryNote?.trim()
    ? `<p style="font-size: 13px; line-height: 1.6; color: #7a6c5d; text-align: center; margin: 24px 0 0 0;">${fields.secondaryNote.trim()}</p>`
    : "";

  return `<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 40px 32px; border-radius: 8px; border: 1px solid #e8dcc4;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; letter-spacing: 0.25em; color: ${goldAccent}; text-transform: uppercase; margin-bottom: 24px; font-weight: 600;">
    ${fields.eyebrow || "Escora Holidays · Slow Sanctuaries"}
  </div>

  ${heroImageHtml}

  <h1 style="font-weight: 300; font-size: 28px; line-height: 1.3; color: #1a1410; margin: 0 0 16px 0;">
    ${fields.heading || "Greetings, {{name}}."}
  </h1>

  ${leadHtml}

  ${paragraphsHtml}

  ${quoteHtml}

  ${highlightsHtml}

  <div style="text-align: center; margin: 36px 0 24px 0;">
    <a href="${fields.ctaUrl || "https://www.escoraholidays.com/plan"}" style="background: ${accent}; color: #faf7f1; padding: 14px 30px; text-decoration: none; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; display: inline-block; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
      ${fields.ctaText || "Inquire with a Concierge"}
    </a>
  </div>

  ${secondaryNoteHtml}

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #8c7e6c; text-align: center;">
    <p style="margin: 0 0 8px 0; letter-spacing: 0.15em; text-transform: uppercase; color: ${goldAccent}; font-weight: 600;">Escora Holidays · Slow Travel Sanctuaries</p>
    <p style="margin: 0 0 10px 0;">Heritage House, 1/284 River Road, Fort Kochi, Kerala 682001, India</p>
    <p style="margin: 0;">
      You received this message because you expressed interest in handcrafted Kerala slow travel with Escora.
      <br />
      <a href="{{unsubscribeUrl}}" style="color: #6b5d4f; text-decoration: underline; margin-top: 6px; display: inline-block;">Unsubscribe from marketing journeys</a>
    </p>
  </div>
</div>`;
}

/**
 * Extracts visual fields from existing HTML if available, or returns default template fields.
 */
export function extractFieldsFromExisting(
  name: string,
  subject: string,
  previewText: string | null | undefined,
  audienceType: any,
  contentHtml: string
): VisualCampaignFields {
  // Check if it matches an existing preset
  for (const t of CAMPAIGN_TEMPLATES) {
    if (contentHtml.includes(t.defaultValues.eyebrow) || (subject && subject.includes(t.title))) {
      return {
        ...t.defaultValues,
        name: name || "",
        audienceType: audienceType || "all_contacts",
        subject: subject || t.defaultValues.subject,
        previewText: previewText || t.defaultValues.previewText,
        templateId: t.id,
      };
    }
  }

  // Parse HTML elements gracefully
  const eyebrowMatch = contentHtml.match(/letter-spacing:\s*0\.25em[^>]*>([^<]+)<\/div>/i);
  const headingMatch = contentHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  const ctaMatch = contentHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  const quoteMatch = contentHtml.match(/&ldquo;([\s\S]*?)&rdquo;|"([\s\S]*?)"/i);

  // Extract body paragraphs (excluding compliance footer)
  const paragraphMatches = Array.from(contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(
      (text) =>
        text.length > 20 &&
        !text.includes("Heritage House") &&
        !text.includes("You received this message")
    );

  const fallbackTemplate = CAMPAIGN_TEMPLATES[0];

  return {
    name: name || "",
    audienceType: audienceType || "all_contacts",
    subject: subject || fallbackTemplate.defaultValues.subject,
    previewText: previewText || fallbackTemplate.defaultValues.previewText,
    templateId: fallbackTemplate.id,
    eyebrow: eyebrowMatch ? eyebrowMatch[1].trim() : fallbackTemplate.defaultValues.eyebrow,
    heading: headingMatch ? headingMatch[1].replace(/<[^>]+>/g, "").trim() : fallbackTemplate.defaultValues.heading,
    heroImage: imgMatch ? imgMatch[1] : fallbackTemplate.defaultValues.heroImage,
    body: paragraphMatches.length > 0 ? paragraphMatches.join("\n\n") : fallbackTemplate.defaultValues.body,
    quote: quoteMatch ? (quoteMatch[1] || quoteMatch[2]).trim() : fallbackTemplate.defaultValues.quote,
    highlights: fallbackTemplate.defaultValues.highlights,
    ctaText: ctaMatch ? ctaMatch[2].replace(/<[^>]+>/g, "").trim() : fallbackTemplate.defaultValues.ctaText,
    ctaUrl: ctaMatch ? ctaMatch[1] : fallbackTemplate.defaultValues.ctaUrl,
    secondaryNote: fallbackTemplate.defaultValues.secondaryNote,
    accentColor: fallbackTemplate.accentColor,
  };
}
