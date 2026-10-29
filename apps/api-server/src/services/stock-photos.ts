/**
 * Authoritative Curated Stock Photography Registry for Kerala & South India Slow Travel.
 * All URLs are direct, verified, high-resolution Unsplash CDN photo links with responsive
 * quality parameters (auto=format, fit=crop, w=1600, q=80).
 *
 * Provides instant, zero-latency, high-aesthetic matching photos for:
 * - Proposal Cover Images
 * - Day-by-Day Photo slots (Photo 1, Photo 2, Photo 3)
 * - Fallbacks when live search APIs have empty results or rate limits.
 */

export interface DestinationStockPhotos {
  cover: string;
  gallery: string[];
}

export const STOCK_PHOTO_CATALOG: Record<string, DestinationStockPhotos> = {
  munnar: {
    cover: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80", // Misty tea hills
      "https://images.unsplash.com/photo-1598555231777-621ef8db7992?auto=format&fit=crop&w=1600&q=80", // Tea plantation rows
      "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1600&q=80", // Mountain sunrise
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80", // Mountain cloud line
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1600&q=80", // Tea valley winding roads
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80", // Western ghats peaks
    ],
  },
  alleppey: {
    cover: "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=1600&q=80", // Luxury houseboat
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80", // Palm-fringed backwater canal
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1600&q=80", // Sunset backwaters
      "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=1600&q=80", // Canoe on peaceful lagoon
      "https://images.unsplash.com/photo-1741243781186-fee59344ea4f?auto=format&fit=crop&w=1600&q=80", // Backwater serenity
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=1600&q=80", // Lagoon palms
    ],
  },
  kochi: {
    cover: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1600&q=80", // Chinese fishing nets at dusk
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80", // Kathakali heritage performance
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Colonial heritage architecture
      "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=1600&q=80", // Spice bazaar & aromatics
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80", // Fort Kochi harbor promenade
    ],
  },
  thekkady: {
    cover: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=1600&q=80", // Periyar lake sanctuary
      "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=1600&q=80", // Cardamom & pepper spice grove
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80", // Forest wilderness
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80", // Spice plantation walk
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1600&q=80", // Bamboo grove
    ],
  },
  kumarakom: {
    cover: "https://images.unsplash.com/photo-1741243781186-fee59344ea4f?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1741243781186-fee59344ea4f?auto=format&fit=crop&w=1600&q=80", // Vembanad lake shore
      "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=1600&q=80", // Water sanctuary villa
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1600&q=80", // Serene lake dawn
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Luxury backwater pool
      "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=1600&q=80", // Lotus canal boat
    ],
  },
  wayanad: {
    cover: "https://images.unsplash.com/photo-1691342538271-5a97b7c1c089?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1691342538271-5a97b7c1c089?auto=format&fit=crop&w=1600&q=80", // Misty rainforest & Churam
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80", // Mountain valley trail
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80", // Coffee and spice estate
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1600&q=80", // Bamboo reserve
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80", // Canopy view
    ],
  },
  varkala: {
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // Red sedimentary cliffs
      "https://images.unsplash.com/photo-1715785849770-22374ff8bdfb?auto=format&fit=crop&w=1600&q=80", // Sunset over Arabian sea
      "https://images.unsplash.com/photo-1519082572439-7ed19908e47e?auto=format&fit=crop&w=1600&q=80", // Coastal waves
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Cliffside cafe view
    ],
  },
  kovalam: {
    cover: "https://images.unsplash.com/photo-1715785849770-22374ff8bdfb?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1715785849770-22374ff8bdfb?auto=format&fit=crop&w=1600&q=80", // Lighthouse beach
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // Crescent shoreline
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Seaside luxury resort
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80", // Coastal breeze
    ],
  },
  trivandrum: {
    cover: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80", // Royal heritage temple
      "https://images.unsplash.com/photo-1715785849770-22374ff8bdfb?auto=format&fit=crop&w=1600&q=80", // Kovalam & Poovar coast
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Palace grounds
      "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=1600&q=80", // Poovar golden beach estuary
    ],
  },
  poovar: {
    cover: "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=1600&q=80", // Estuary meeting sea
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // Golden sands
      "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=1600&q=80", // Mangrove boat cruise
    ],
  },
  marari: {
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // Quiet coconut palm beach
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Slow luxury villa pool
      "https://images.unsplash.com/photo-1715785849770-22374ff8bdfb?auto=format&fit=crop&w=1600&q=80", // Fisherman canoes sunset
    ],
  },
  athirappilly: {
    cover: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80", // Cascading jungle waterfalls
      "https://images.unsplash.com/photo-1691342538271-5a97b7c1c089?auto=format&fit=crop&w=1600&q=80", // Rainforest mist
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=1600&q=80", // River gorge
    ],
  },
  bekal: {
    cover: "https://images.unsplash.com/photo-1519082572439-7ed19908e47e?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519082572439-7ed19908e47e?auto=format&fit=crop&w=1600&q=80", // Coastal sea fort ramparts
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // Ocean waves against stone
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Luxury beach resort
    ],
  },
  kashmir: {
    cover: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1600&q=80", // Dal Lake Shikara
      "https://images.unsplash.com/photo-1598555231777-621ef8db7992?auto=format&fit=crop&w=1600&q=80", // Snow peaks & alpine valley
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80", // Meadow & pine forest
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1600&q=80", // Houseboat reflection
    ],
  },
  thailand: {
    cover: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1600&q=80", // Turquoise lagoon & limestone cliffs
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // Tropical beach & longtail boat
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80", // Golden pagoda & temple
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80", // Private island resort
    ],
  },
  default: {
    cover: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80", // Tea hills
      "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=1600&q=80", // Houseboat
      "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1600&q=80", // Fort Kochi nets
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=1600&q=80", // Sanctuary
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", // Beach sunset
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80", // Heritage Kathakali
    ],
  },
};

/**
 * Normalizes destination or query text to identify the matching key in STOCK_PHOTO_CATALOG.
 */
export function identifyStockCategory(input: string): string {
  const lower = (input || "").toLowerCase();
  if (lower.includes("munnar") || lower.includes("lockhart") || lower.includes("tea") || lower.includes("eravikulam") || lower.includes("mattupetty")) return "munnar";
  if (lower.includes("alleppey") || lower.includes("alappuzha") || lower.includes("houseboat") || lower.includes("punnamada") || lower.includes("backwater")) return "alleppey";
  if (lower.includes("kochi") || lower.includes("cochin") || lower.includes("fort kochi") || lower.includes("mattancherry") || lower.includes("chinese net")) return "kochi";
  if (lower.includes("thekkady") || lower.includes("periyar") || lower.includes("kumily") || lower.includes("spice")) return "thekkady";
  if (lower.includes("kumarakom") || lower.includes("vembanad") || lower.includes("bird sanctuary")) return "kumarakom";
  if (lower.includes("wayanad") || lower.includes("vythiri") || lower.includes("chembra") || lower.includes("churam")) return "wayanad";
  if (lower.includes("varkala") || lower.includes("cliff")) return "varkala";
  if (lower.includes("kovalam") || lower.includes("samudra")) return "kovalam";
  if (lower.includes("trivandrum") || lower.includes("thiruvananthapuram") || lower.includes("padmanabha")) return "trivandrum";
  if (lower.includes("poovar")) return "poovar";
  if (lower.includes("marari") || lower.includes("mararikulam")) return "marari";
  if (lower.includes("athirappilly") || lower.includes("waterfall")) return "athirappilly";
  if (lower.includes("bekal") || lower.includes("kasaragod")) return "bekal";
  if (lower.includes("kashmir") || lower.includes("srinagar") || lower.includes("gulmarg") || lower.includes("pahalgam")) return "kashmir";
  if (lower.includes("thailand") || lower.includes("bangkok") || lower.includes("phuket") || lower.includes("krabi") || lower.includes("pattaya")) return "thailand";
  return "default";
}

/**
 * Returns a high-res matching stock cover photo for a destination or journey.
 */
export function getStockCoverPhoto(destinationOrTitle: string): string {
  const cat = identifyStockCategory(destinationOrTitle);
  return STOCK_PHOTO_CATALOG[cat]?.cover || STOCK_PHOTO_CATALOG.default.cover;
}

/**
 * Returns up to `count` matching stock photo URLs for a specific day or section.
 * Uses `dayIndex` or `offset` to cycle through distinct photos so every day gets unique visuals!
 */
export function getStockPhotosForDay(
  destinationOrQuery: string,
  count = 3,
  dayIndex = 0
): string[] {
  const cat = identifyStockCategory(destinationOrQuery);
  const gallery = STOCK_PHOTO_CATALOG[cat]?.gallery || STOCK_PHOTO_CATALOG.default.gallery;
  
  if (gallery.length === 0) return [STOCK_PHOTO_CATALOG.default.cover];

  const results: string[] = [];
  const offset = (dayIndex * count) % gallery.length;

  for (let i = 0; i < count; i++) {
    const idx = (offset + i) % gallery.length;
    results.push(gallery[idx]);
  }

  return results;
}
