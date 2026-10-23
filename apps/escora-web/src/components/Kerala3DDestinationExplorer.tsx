import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ArrowRight, RotateCw } from "lucide-react";
import type { Destination } from "@workspace/api-client-react";
import Destination360Modal from "./Destination360Modal";
import Kerala3DMapCanvas from "./Kerala3DMapCanvas";
import "./Kerala3DDestinationExplorer.css";

// ── Destination Cover Images ──
import munnarImg from "@assets/escora/destinations/munnar.jpg";
import wayanadImg from "@assets/escora/destinations/wayanad.jpg";
import kochiImg from "@assets/escora/destinations/fort-kochi.jpg";
import alleppeyImg from "@assets/escora/destinations/alleppey.jpg";
import varkalaImg from "@assets/escora/destinations/varkala.jpg";
import thekkadyImg from "@assets/escora/destinations/thekkady.jpg";
import bekalImg from "@assets/escora/destinations/bekal.jpg";
import kovalamImg from "@assets/escora/destinations/kovalam.jpg";

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
  panorama?: string;
}

const DEFAULT_PANORAMAS: Record<string, string> = {
  munnar: "/assets/360/munnar.hdr",
  wayanad: "/assets/360/wayanad.jpg",
  kochi: "/assets/360/alleppey.jpg",
  "fort-kochi": "/assets/360/alleppey.jpg",
  alleppey: "/assets/360/alleppey.jpg",
  varkala: "/assets/360/varkala.jpg",
  thekkady: "/assets/360/thekkady.jpg",
  bekal: "/assets/360/bekal.hdr",
  bakel: "/assets/360/bekal.hdr",
  kovalam: "/assets/360/kovalam.hdr",
};

export const KERALA_DESTINATIONS_DATA: DestinationItem[] = [
  {
    id: "munnar",
    num: "01",
    name: "Munnar",
    category: "MISTY HIGHLANDS",
    tagline: "Endless rolling carpets of emerald tea plantations & cool mountain breezes.",
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
    tagline: "Ancient spice plantations blending into dense rainforest canopy & waterfalls.",
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
    name: "Fort Kochi",
    category: "HERITAGE & CULTURE",
    tagline: "Five centuries of colonial spice trade, art cafés & seaside fishing nets.",
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
    category: "BACKWATERS & LAGOONS",
    tagline: "Glide past tranquil backwaters & emerald paddy fields on a luxury kettuvallam.",
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
    category: "CLIFFTOP BEACHES",
    tagline: "Dramatic red geology cliffs meeting the Arabian Sea with clifftop cafés.",
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
    tagline: "Periyar National Park reservoir where wild elephants roam aromatic spice trails.",
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
  {
    id: "bekal",
    num: "07",
    name: "Bekal",
    category: "HISTORIC FORTS & SEAS",
    tagline: "A 300-year-old crimson keyhole fort rising above turquoise coastal waves.",
    description: "A 300-year-old laterite keyhole fort perched on the Malabar coastline, where crimson ramparts meet crashing waves and golden sunset beaches.",
    slug: "bekal",
    image: bekalImg,
    features: [
      { label: "Bekal Fort", icon: "landmark" },
      { label: "Ocean Ramparts", icon: "shield" },
      { label: "Malabar Sunsets", icon: "sunset" },
    ],
    associatedDistrict: "Kasaragod",
  },
  {
    id: "kovalam",
    num: "08",
    name: "Kovalam",
    category: "CRESCENT BAYS & SURF",
    tagline: "Legendary crescent beaches framed by coconut palms and lighthouse coves.",
    description: "A world-renowned coastal haven famous for its striped red-and-white lighthouse, calm sheltered coves, and golden sandy beaches.",
    slug: "kovalam",
    image: kovalamImg,
    features: [
      { label: "Lighthouse Beach", icon: "sun" },
      { label: "Arabian Sea", icon: "waves" },
      { label: "Ayurvedic Spas", icon: "sparkles" },
    ],
    associatedDistrict: "Thiruvananthapuram",
  },
];

export const WHEEL_DESTINATIONS = KERALA_DESTINATIONS_DATA;

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

  let match = destinations.find((d) => d?.slug && aliases.has(d.slug.toLowerCase().trim()));
  if (match) return match;

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

interface SlotDef {
  slotName: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  zIndex: number;
  isCenter: boolean;
  row: "top" | "center" | "bottom";
  col: "left" | "center" | "right";
}

// 7 Symmetrical Slots on Desktop:
// Top row: 3 cards in an upward arch curve (⌒)
// Center card: Dead center middle, overlapping both rows, bigger (1.18x) and elevated (z: 20)
// Bottom row: 3 cards in an inverted downward bowl curve (◡) "like it's upside down"
const DESKTOP_SLOTS: SlotDef[] = [
  // 0: Center Spotlight (overlapping both rows in the middle)
  { slotName: "center", x: 0, y: 0, rotate: 0, scale: 1.12, zIndex: 20, isCenter: true, row: "center", col: "center" },
  // 1: Top-Right (tilted outward, lower than center apex)
  { slotName: "top-right", x: 255, y: -125, rotate: 4, scale: 0.92, zIndex: 6, isCenter: false, row: "top", col: "right" },
  // 2: Bottom-Right (tilted inward, higher than center dip)
  { slotName: "bottom-right", x: 255, y: 125, rotate: -4, scale: 0.92, zIndex: 6, isCenter: false, row: "bottom", col: "right" },
  // 3: Bottom-Center (lowest dip of bottom bowl curve)
  { slotName: "bottom-center", x: 0, y: 160, rotate: 0, scale: 0.88, zIndex: 4, isCenter: false, row: "bottom", col: "center" },
  // 4: Bottom-Left (tilted inward, higher than center dip)
  { slotName: "bottom-left", x: -255, y: 125, rotate: 4, scale: 0.92, zIndex: 6, isCenter: false, row: "bottom", col: "left" },
  // 5: Top-Left (tilted outward, lower than center apex)
  { slotName: "top-left", x: -255, y: -125, rotate: -4, scale: 0.92, zIndex: 6, isCenter: false, row: "top", col: "left" },
  // 6: Top-Center (highest apex of top arch curve)
  { slotName: "top-center", x: 0, y: -160, rotate: 0, scale: 0.88, zIndex: 4, isCenter: false, row: "top", col: "center" },
];

const Kerala3DDestinationExplorer = React.forwardRef<HTMLElement, Kerala3DDestinationExplorerProps>(
  ({ id = "explore-kerala", destinations }, ref) => {
    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("Idukki");
    const [active360Dest, setActive360Dest] = useState<DestinationItem | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [isInView, setIsInView] = useState(true);
    const [isInteracting, setIsInteracting] = useState(false);
    const [isTabVisible, setIsTabVisible] = useState(
      typeof document !== "undefined" ? document.visibilityState === "visible" : true
    );
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const handleOpen360 = useCallback((destItem: DestinationItem) => {
      setActive360Dest(destItem);
    }, []);

    const stageRef = useRef<HTMLDivElement>(null);
    const sectionInternalRef = useRef<HTMLElement | null>(null);
    const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Merge forwarded ref with internal ref
    const setSectionRef = useCallback(
      (node: HTMLElement | null) => {
        sectionInternalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref && "current" in ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      [ref]
    );

    // Responsive check
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // IntersectionObserver to only auto-animate when section is in viewport
    useEffect(() => {
      const el = sectionInternalRef.current;
      if (!el || typeof IntersectionObserver === "undefined") {
        setIsInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting);
        },
        { threshold: 0.12 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    // Tab visibility handling: pause timer when browser tab is inactive
    useEffect(() => {
      const handleVisibilityChange = () => {
        setIsTabVisible(document.visibilityState === "visible");
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // Check prefers-reduced-motion
    useEffect(() => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return;
      }
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.("change", listener);
      return () => {
        mediaQuery.removeEventListener?.("change", listener);
      };
    }, []);

    // Merge API destination records into KERALA_DESTINATIONS_DATA, keeping local fallbacks
    const items = useMemo<DestinationItem[]>(() => {
      return KERALA_DESTINATIONS_DATA.map((item) => {
        const dbMatch = findMatchingDestination(destinations, item.id, item.slug, item.name);
        if (!dbMatch) return item;

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
          features: item.features,
          panorama: DEFAULT_PANORAMAS[item.id] || "/assets/360/munnar.hdr",
        };
      });
    }, [destinations]);

    const total = items.length;
    const currentDest = items[activeIdx] || items[0] || KERALA_DESTINATIONS_DATA[0];

    // Synchronize 3D map selected district whenever current destination changes
    useEffect(() => {
      if (currentDest?.associatedDistrict) {
        setSelectedDistrict(currentDest.associatedDistrict);
      }
    }, [currentDest]);

    // Selection handler from 3D map pin or district click
    const handleSelectDistrict = useCallback(
      (districtName: string, associatedDestId?: string) => {
        setSelectedDistrict(districtName);

        if (associatedDestId) {
          const matchIdx = items.findIndex((d) => d.id === associatedDestId);
          if (matchIdx !== -1) {
            setActiveIdx(matchIdx);
            return;
          }
        }

        const districtMatchIdx = items.findIndex((d) => d.associatedDistrict === districtName);
        if (districtMatchIdx !== -1) {
          setActiveIdx(districtMatchIdx);
        }
      },
      [items]
    );

    // Navigation callbacks
    const handleNext = useCallback(() => {
      setActiveIdx((prev) => (prev + 1) % total);
    }, [total]);

    const handlePrev = useCallback(() => {
      setActiveIdx((prev) => (prev - 1 + total) % total);
    }, [total]);

    const handleSelectCard = useCallback((index: number) => {
      setActiveIdx(index);
    }, []);

    // Auto-advance interval: 4000ms for comfortable luxury reading pace
    const AUTO_ROTATE_DELAY = 4000;

    useEffect(() => {
      if (!isAutoPlay || prefersReducedMotion || !isInView || !isTabVisible || isHovered || isInteracting) {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
          autoPlayTimerRef.current = null;
        }
        return;
      }

      autoPlayTimerRef.current = setInterval(() => {
        handleNext();
      }, AUTO_ROTATE_DELAY);

      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
          autoPlayTimerRef.current = null;
        }
      };
    }, [isAutoPlay, prefersReducedMotion, isInView, isTabVisible, isHovered, isInteracting, handleNext, activeIdx]);


    // Keyboard navigation when section is focused / active
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrev();
        }
      },
      [handleNext, handlePrev]
    );

    // Touch swipe support
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
      setIsInteracting(true);
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
      setIsInteracting(false);
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartX.current;
      if (diffX > 45) {
        handlePrev();
      } else if (diffX < -45) {
        handleNext();
      }
      touchStartX.current = null;
    };

    const isEffectivelyPaused = !isAutoPlay || isHovered || isInteracting || !isTabVisible;

    return (
      <section
        ref={setSectionRef}
        className={`kerala-3d-explorer-section ${isEffectivelyPaused ? "is-paused" : "is-auto-animating"}`}
        id={id}
        aria-label="Explore Kerala Destination Showcase"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="kerala-3d-wrap wrap">
          {/* ══════════════════════════════════════════════════════════════
              FULL-WIDTH EDITORIAL HEADER
              ══════════════════════════════════════════════════════════════ */}
          <div className="kerala-3d-editorial-head">
            <div className="kerala-3d-head-left">
              <div className="kerala-3d-eyebrow">
                <span className="dot" />
                EXPLORE KERALA
              </div>
              <h2 className="kerala-3d-title">
                Stories, <span className="accent-gold">waiting for yours.</span>
              </h2>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              2-COLUMN STAGE: LEFT 3D MAP + RIGHT 7-CARD ARCH SHOWCASE
              ══════════════════════════════════════════════════════════════ */}
          <div className="kerala-3d-stage">
            {/* ── Left Column: 3D Kerala Relief Map ── */}
            <div className="kerala-3d-left-col">
              <div className="kerala-3d-map-wrap" aria-label="3D Kerala Relief Model">
                <Kerala3DMapCanvas
                  selectedDistrict={selectedDistrict}
                  activeDestId={currentDest.id}
                  onSelectDistrict={handleSelectDistrict}
                />
              </div>
            </div>

            {/* ── Right Column: 7-Card Arch Showcase Stage ── */}
            <div
              ref={stageRef}
              className={`kerala-arch-stage-container ${isMobile ? "is-mobile-view" : ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-label="Interactive Kerala Destination Cards"
          >
            {/* Left Chevron Button */}
            <button
              type="button"
              className="kerala-nav-arrow kerala-nav-prev"
              onClick={handlePrev}
              aria-label="Previous destination"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Chevron Button */}
            <button
              type="button"
              className="kerala-nav-arrow kerala-nav-next"
              onClick={handleNext}
              aria-label="Next destination"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Stage Cards Plane */}
            <div className="kerala-arch-stage">
              {items.map((item, idx) => {
                // Calculate circular offset from activeIdx
                const diff = ((idx - activeIdx) % total + total) % total;

                // Handle desktop 7 slots vs extra items
                let slot: SlotDef;
                if (!isMobile) {
                  if (diff < DESKTOP_SLOTS.length) {
                    slot = DESKTOP_SLOTS[diff];
                  } else {
                    // Extra 8th+ item stays hidden along top arc trajectory between center and top-center
                    slot = {
                      slotName: "hidden",
                      x: 0,
                      y: -125,
                      rotate: 0,
                      scale: 0.82,
                      zIndex: 2,
                      isCenter: false,
                      row: "top",
                      col: "center",
                    };
                  }
                } else {
                  // Mobile view: horizontal coverflow layout
                  if (diff === 0) {
                    slot = { slotName: "mobile-center", x: 0, y: 0, rotate: 0, scale: 1, zIndex: 10, isCenter: true, row: "center", col: "center" };
                  } else if (diff === 1) {
                    slot = { slotName: "mobile-right", x: 175, y: 0, rotate: 3, scale: 0.85, zIndex: 5, isCenter: false, row: "center", col: "right" };
                  } else if (diff === total - 1) {
                    slot = { slotName: "mobile-left", x: -175, y: 0, rotate: -3, scale: 0.85, zIndex: 5, isCenter: false, row: "center", col: "left" };
                  } else if (diff === 2) {
                    slot = { slotName: "mobile-hidden", x: 260, y: 0, rotate: 4, scale: 0.7, zIndex: 1, isCenter: false, row: "center", col: "right" };
                  } else {
                    slot = { slotName: "mobile-hidden", x: -260, y: 0, rotate: -4, scale: 0.7, zIndex: 1, isCenter: false, row: "center", col: "left" };
                  }
                }

                const isCenter = slot.isCenter;
                const isHidden = slot.slotName === "hidden" || slot.slotName === "mobile-hidden";

                return (
                  <div
                    key={item.id}
                    id={`kerala-card-${item.id}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.name} destination card${isCenter ? ", highlighted in center" : ""}`}
                    className={`kerala-arch-card ${isCenter ? "is-center-card" : "is-outer-card"} ${slot.row === "bottom" ? "is-bottom-card" : slot.row === "top" ? "is-top-card" : ""} slot-${slot.slotName} ${isHidden ? "is-hidden" : ""}`}
                    style={
                      {
                        "--tx": `${slot.x}px`,
                        "--ty": `${slot.y}px`,
                        "--rot": `${slot.rotate}deg`,
                        "--scale": slot.scale,
                        "--zIndex": slot.zIndex,
                        zIndex: slot.zIndex,
                      } as React.CSSProperties
                    }
                    onClick={() => {
                      if (!isCenter) {
                        handleSelectCard(idx);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!isCenter) handleSelectCard(idx);
                      }
                    }}
                  >
                    <div className="kerala-card-inner">
                      {/* ── Rounded Photo Container ── */}
                      <div className="kerala-card-media">
                        <img
                          src={item.image}
                          alt={`${item.name}, Kerala`}
                          className="kerala-card-img"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const fallback = KERALA_DESTINATIONS_DATA.find((d) => d.id === item.id)?.image;
                            if (fallback && e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                        />
                        <div className="kerala-card-img-scrim" />
                      </div>

                      {/* ── Card Content (Matching screenshot typography & layout) ── */}
                      <div className="kerala-card-content">
                        {/* Destination Title */}
                        <h3 className="kerala-card-title">{item.name}</h3>

                        {/* Read More / Action */}
                        {!isCenter ? (
                          <span className="kerala-card-readmore">Read More</span>
                        ) : (
                          <div className="kerala-center-expanded">
                            <p className="kerala-center-tagline">{item.tagline}</p>
                            <div className="kerala-center-cta-group">
                              <button
                                type="button"
                                className="kerala-center-360-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpen360(item);
                                }}
                                aria-label={`Explore ${item.name} in 360°`}
                                title={`Explore ${item.name} in interactive 360° view`}
                              >
                                <RotateCw className="w-3.5 h-3.5 text-gold" />
                                <span>360° View</span>
                              </button>
                              <Link
                                href={`/destinations/${item.slug}`}
                                className="kerala-center-cta"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Read more about ${item.name}`}
                                title={`Read more about ${item.name}`}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                PAGINATION DOTS INDICATOR
                ══════════════════════════════════════════════════════════════ */}
            <div
              className="kerala-pagination"
              role="group"
              aria-label="Destination navigation dots"
            >
              {items.map((item, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Go to ${item.name}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`kerala-dot ${isActive ? "is-active" : ""}`}
                    onClick={() => handleSelectCard(idx)}
                  >
                    {isActive && (
                      <span
                        className={`kerala-dot-fill ${isEffectivelyPaused ? "is-paused" : ""}`}
                        key={`dot-progress-${activeIdx}`}
                        style={{
                          animationPlayState: isEffectivelyPaused ? "paused" : "running",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

        {/* ── 360° Interactive Panoramic Popup Modal ── */}
        {Boolean(active360Dest) && (
          <Destination360Modal
            isOpen={true}
            destination={active360Dest}
            destinations={items}
            onClose={() => setActive360Dest(null)}
            onSelectDestination={(dest) => {
              const found = items.find((it) => String(it.id) === String(dest.id) || it.slug === dest.slug);
              if (found) {
                setActive360Dest(found);
                const foundIdx = items.findIndex((it) => String(it.id) === String(dest.id) || it.slug === dest.slug);
                if (foundIdx !== -1) setActiveIdx(foundIdx);
              }
            }}
          />
        )}
      </section>
    );
  }
);

Kerala3DDestinationExplorer.displayName = "Kerala3DDestinationExplorer";

export default Kerala3DDestinationExplorer;
