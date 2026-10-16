import React, { useState, useCallback, useMemo } from "react";
import type { Destination } from "@workspace/api-client-react";
import Kerala3DMapCanvas from "./Kerala3DMapCanvas";
import DepthCarousel from "./DepthCarousel";
import "./Kerala3DDestinationExplorer.css";

// ── Destination Cover Images ──
import munnarImg from "@assets/escora/destinations/munnar.jpg";
import wayanadImg from "@assets/escora/destinations/wayanad.jpg";
import kochiImg from "@assets/escora/destinations/fort-kochi.jpg";
import alleppeyImg from "@assets/escora/destinations/alleppey.jpg";
import varkalaImg from "@assets/escora/destinations/varkala.jpg";
import thekkadyImg from "@assets/escora/destinations/thekkady.jpg";
import exploreKeralaBg from "@assets/escora/explore-kerala-3d-bg.jpg";

export interface DestinationItem {
  id: string;
  num: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  slug: string;
  image: string;
  features: { label: string; icon: string }[];
  associatedDistrict: string;
}

export const WHEEL_DESTINATIONS: DestinationItem[] = [
  {
    id: "munnar",
    num: "01",
    name: "Munnar",
    category: "MISTY MOUNTAINS",
    tagline: "MISTY TEA GARDENS & HIGHLANDS",
    description: "Perched at 1,600 metres in the Western Ghats, Munnar unfolds in endless rolling carpets of emerald tea plantations, misty valleys, and cool mountain breezes.",
    slug: "munnar",
    image: munnarImg,
    features: [
      { label: "Tea Gardens", icon: "leaf" },
      { label: "Nature Trails", icon: "footprints" },
      { label: "Hill Views", icon: "mountain" },
    ],
    associatedDistrict: "Idukki",
  },
  {
    id: "wayanad",
    num: "02",
    name: "Wayanad",
    category: "FORESTS & WATERFALLS",
    tagline: "LAND OF A THOUSAND STORIES",
    description: "A highland biodiversity sanctuary where ancient spice plantations blend into dense rainforest canopy, Edakkal rock engravings, and serene lake islands.",
    slug: "wayanad",
    image: wayanadImg,
    features: [
      { label: "Rainforests", icon: "trees" },
      { label: "Edakkal Caves", icon: "landmark" },
      { label: "Waterfalls", icon: "droplets" },
    ],
    associatedDistrict: "Wayanad",
  },
  {
    id: "kochi",
    num: "03",
    name: "Kochi",
    category: "HERITAGE & CULTURE",
    tagline: "FIVE CENTURIES OF SPICE HERITAGE",
    description: "The historic spice capital where Portuguese chapels, Dutch residences, Jewish synagogues, and cantilevering Chinese fishing nets create an atmospheric seaside tapestry.",
    slug: "fort-kochi",
    image: kochiImg,
    features: [
      { label: "Chinese Nets", icon: "anchor" },
      { label: "Spice Markets", icon: "sparkles" },
      { label: "Colonial Past", icon: "building-2" },
    ],
    associatedDistrict: "Ernakulam",
  },
  {
    id: "alleppey",
    num: "04",
    name: "Alleppey",
    category: "BACKWATERS",
    tagline: "VENICE OF THE EAST & BACKWATERS",
    description: "The serene heart of Kerala's backwater network — glide past tranquil village shores, Chinese nets, and lush kuttanad paddy fields aboard a bespoke luxury kettuvallam.",
    slug: "alleppey",
    image: alleppeyImg,
    features: [
      { label: "Houseboats", icon: "ship" },
      { label: "Canal Cruises", icon: "waves" },
      { label: "Paddy Fields", icon: "sun" },
    ],
    associatedDistrict: "Alappuzha",
  },
  {
    id: "varkala",
    num: "05",
    name: "Varkala",
    category: "BEACHES & CLIFFS",
    tagline: "CLIFFTOP SHORES & SACRED WATERS",
    description: "Kerala's only clifftop coast where reddish geological formations meet the Arabian Sea, bohemian open-air terraces, and natural mineral springs by the water.",
    slug: "varkala",
    image: varkalaImg,
    features: [
      { label: "Red Cliffs", icon: "sun" },
      { label: "Arabian Sea", icon: "waves" },
      { label: "Coastal Sunsets", icon: "sunset" },
    ],
    associatedDistrict: "Thiruvananthapuram",
  },
  {
    id: "thekkady",
    num: "06",
    name: "Thekkady",
    category: "WILDLIFE & GREENERY",
    tagline: "PERIYAR WILDLIFE & SPICE RESERVES",
    description: "Home to Periyar National Park, where wild elephant herds drink along the reservoir banks while aromatic cardamom, pepper, and cinnamon gardens scent the cool air.",
    slug: "thekkady",
    image: thekkadyImg,
    features: [
      { label: "Periyar Lake", icon: "waves" },
      { label: "Wild Elephants", icon: "shield" },
      { label: "Spice Trails", icon: "leaf" },
    ],
    associatedDistrict: "Idukki",
  },
];

export interface Kerala3DDestinationExplorerProps {
  id?: string;
  destinations?: Destination[];
}

const DESTINATION_ALIASES: Record<string, string[]> = {
  kochi: ["kochi", "fort-kochi"],
  "fort-kochi": ["kochi", "fort-kochi"],
  alleppey: ["alleppey", "alappuzha"],
  alappuzha: ["alleppey", "alappuzha"],
};

const VALID_KERALA_DISTRICTS = new Set([
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad",
]);

function findMatchingDestination(
  destinations: Destination[] | undefined,
  localId: string,
  localSlug: string,
  localName?: string
): Destination | undefined {
  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return undefined;
  }

  const normId = localId.toLowerCase().trim();
  const normSlug = localSlug.toLowerCase().trim();
  const aliases = new Set<string>([
    normId,
    normSlug,
    ...(DESTINATION_ALIASES[normId] || []),
    ...(DESTINATION_ALIASES[normSlug] || []),
  ]);

  // 1. Direct match on slug / alias
  let match = destinations.find((d) => d?.slug && aliases.has(d.slug.toLowerCase().trim()));
  if (match) return match;

  // 2. Fallback match on name
  if (localName) {
    const normName = localName.toLowerCase().trim();
    match = destinations.find((d) => {
      if (!d?.name) return false;
      const dbNormName = d.name.toLowerCase().trim();
      return (
        dbNormName === normName ||
        (normId === "kochi" && (dbNormName === "fort kochi" || dbNormName === "kochi")) ||
        (normId === "alleppey" && (dbNormName === "alappuzha" || dbNormName === "alleppey"))
      );
    });
    if (match) return match;
  }

  return undefined;
}

const Kerala3DDestinationExplorer = React.forwardRef<HTMLElement, Kerala3DDestinationExplorerProps>(
  ({ id = "explore-kerala", destinations }, ref) => {
    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("Idukki");

    // Merge API destination records into WHEEL_DESTINATIONS, keeping local fallbacks
    const items = useMemo<DestinationItem[]>(() => {
      return WHEEL_DESTINATIONS.map((item) => {
        const dbMatch = findMatchingDestination(destinations, item.id, item.slug, item.name);
        if (!dbMatch) return item;

        // Safe region -> associatedDistrict validation against 14 Kerala districts
        let associatedDistrict = item.associatedDistrict;
        if (dbMatch.region && typeof dbMatch.region === "string") {
          const trimmedRegion = dbMatch.region.trim();
          const matchedDistrict = Array.from(VALID_KERALA_DISTRICTS).find(
            (dist) => dist.toLowerCase() === trimmedRegion.toLowerCase()
          );
          if (matchedDistrict) {
            associatedDistrict = matchedDistrict;
          }
        }

        // Safe cover image verification
        const validCoverImage =
          dbMatch.imageUrl && typeof dbMatch.imageUrl === "string" && dbMatch.imageUrl.trim().length > 0
            ? dbMatch.imageUrl.trim()
            : item.image;

        return {
          ...item,
          name: dbMatch.name?.trim() ? dbMatch.name.trim() : item.name,
          category: dbMatch.type?.trim() ? dbMatch.type.trim().toUpperCase() : item.category,
          tagline: dbMatch.shortDesc?.trim() ? dbMatch.shortDesc.trim() : item.tagline,
          description: dbMatch.description?.trim() || dbMatch.shortDesc?.trim() || item.description,
          slug: dbMatch.slug?.trim() ? dbMatch.slug.trim() : item.slug,
          image: validCoverImage,
          associatedDistrict,
          features: item.features, // map & icon features stay local
        };
      });
    }, [destinations]);

    const currentDest = items[activeIdx] || items[0] || WHEEL_DESTINATIONS[0];

    // Selection handler from DepthCarousel
    const handleCarouselChange = useCallback((idx: number, item: DestinationItem) => {
      setActiveIdx(idx);
      if (item && item.associatedDistrict) {
        setSelectedDistrict(item.associatedDistrict);
      }
    }, []);

    // Selection handler from map click
    const handleSelectDistrict = useCallback(
      (districtName: string, associatedDestId?: string) => {
        setSelectedDistrict(districtName);

        if (associatedDestId) {
          const matchIdx = items.findIndex((d) => d.id === associatedDestId);
          if (matchIdx !== -1) {
            setActiveIdx(matchIdx);
          }
        }
      },
      [items]
    );

  return (
    <section
      ref={ref}
      className="kerala-3d-explorer-section"
      id={id}
      aria-label="Explore Kerala 3D Destination Explorer"
    >
      {/* ── Refined Luxury Background Layers (Low-opacity landscape + Soft Ivory-White Mist) ── */}
      <div className="kerala-3d-bg-layer" aria-hidden="true">
        <div
          className="kerala-3d-bg-image"
          style={{ backgroundImage: `url(${exploreKeralaBg})` }}
        />
        <div className="kerala-3d-bg-overlay" />
      </div>

      <div className="kerala-3d-wrap wrap">
        {/* Full-width editorial header matching Travel by Type structure */}
        <div className="kerala-3d-editorial-head">
          <div className="kerala-3d-head-left">
            <div className="kerala-3d-eyebrow">
              <span className="dot" />
              EXPLORE KERALA
            </div>
            <h2 className="kerala-3d-title">
              A land of countless stories,<br />
              <span className="italic-gold">waiting for yours.</span>
            </h2>
          </div>
          <p className="kerala-3d-desc">
            From misty mountains to tranquil backwaters, discover the many sides of Kerala.
          </p>
        </div>

        {/* ── 2-Column Balanced Composition: Left Map + Right DepthCarousel ── */}
        <div className="kerala-3d-stage">
          {/* ══════════════════════════════════════════════════
              COLUMN 1: 3D KERALA RELIEF MAP
              ══════════════════════════════════════════════════ */}
          <div className="kerala-3d-left-col">
            {/* 3D Kerala Relief Map Model */}
            <div className="kerala-3d-map-wrap" aria-label="3D Kerala Relief Model">
              <Kerala3DMapCanvas
                selectedDistrict={selectedDistrict}
                activeDestId={currentDest.id}
                onSelectDistrict={handleSelectDistrict}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              COLUMN 2: REACT BITS 3D DEPTH CAROUSEL
              ══════════════════════════════════════════════════ */}
          <div className="kerala-3d-carousel-col" aria-label="Explore Kerala Depth Carousel">
            <DepthCarousel
              items={items}
              activeIndex={activeIdx}
              onChange={handleCarouselChange}
              cardWidth={328}
              cardHeight={480}
              depth={115}
              spread={145}
              tilt={7}
              tiltDirection="right"
              perspective={1500}
              visibleCards={6}
              blur={0}
              radius={8}
              duration={750}
              autoplay={false}
              loop={true}
              showControls={true}
              showIndicators={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
});

export default Kerala3DDestinationExplorer;
