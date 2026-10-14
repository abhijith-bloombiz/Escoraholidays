import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Clean, high-resolution destination photographs without any baked-in text/badges
import munnarPhoto from "@assets/escora/collections/munnar-tea-estate.jpeg";
import alleppeyPhoto from "@assets/escora/collections/alleppey-lagoon-houseboat.jpeg";
import wayanadPhoto from "@assets/escora/collections/hill-stations-hero.jpg";
import varkalaPhoto from "@assets/escora/collections/varkala-cliffs.jpeg";
import kochiPhoto from "@assets/escora/collections/fort-kochi-heritage.jpg";
import bekalPhoto from "@assets/escora/collections/bekal-fort.jpeg";
import thekkadyPhoto from "@assets/escora/collections/periyar-tiger-reserve.webp";
import kovalamPhoto from "@assets/escora/collections/kovalam-beach.jpeg";
import kumarakomPhoto from "@assets/escora/collections/kumarakom-bird-sanctuary.jpeg";
import kannurPhoto from "@assets/escora/collections/payyambalam-driving-beach.jpg";

export interface CoverflowItem {
  id: number | string;
  name?: React.ReactNode;
  title?: string;
  label?: string;
  slug?: string;
  img?: string;
  imageUrl?: string | null;
  desc?: string;
  shortDesc?: string | null;
  type?: string | null;
  region?: string | null;
  count?: string;
  price?: string;
  priceLabel?: string;
  link?: string;
  [key: string]: any;
}

export type CoverflowDestinationItem = CoverflowItem;

interface ExploreCoverflowProps {
  destinations?: CoverflowDestinationItem[];
  items?: CoverflowItem[];
}

const CLEAN_PHOTOS: Record<string, string> = {
  munnar: munnarPhoto,
  alleppey: alleppeyPhoto,
  wayanad: wayanadPhoto,
  varkala: varkalaPhoto,
  "fort-kochi": kochiPhoto,
  bekal: bekalPhoto,
  thekkady: thekkadyPhoto,
  kovalam: kovalamPhoto,
  kumarakom: kumarakomPhoto,
  kannur: kannurPhoto,
};

const PREFERRED_ORDER = ["munnar", "alleppey", "wayanad", "varkala", "fort-kochi"];

const CUSTOM_TAGLINES: Record<string, string> = {
  munnar: "MISTY TEA GARDENS & HIGHLANDS",
  alleppey: "VENICE OF THE EAST & BACKWATERS",
  varkala: "CLIFFTOP SHORES & SACRED WATERS",
  wayanad: "LAND OF A THOUSAND STORIES",
  "fort-kochi": "FIVE CENTURIES OF SPICE HERITAGE",
  thekkady: "PERIYAR WILDLIFE & SPICE RESERVES",
  kovalam: "CRESCENT PALM-FRINGED BAYS",
  kumarakom: "LAGOON TRANQUILITY & BIRD SANCTUARY",
  bekal: "HISTORIC KEYHOLE FORT & OCEAN HORIZONS",
  kannur: "THEYYAM RITUALS & UNTOUCHED COAST",
};

const CATEGORY_TITLES: Record<string, string> = {
  honeymoon: "Honeymoon",
  "health-wellness": "Health & Wellness",
  "nature-wildlife": "Nature & Wildlife",
  "hill-stations": "Hill Stations",
  backwaters: "Backwaters",
  beaches: "Kerala Beaches",
  "functional-medicine": "Functional Medicine",
  "historical-heritage": "Historical & Heritage",
};

export const ExploreCoverflow: React.FC<ExploreCoverflowProps> = ({
  destinations: rawDestinations,
  items: rawItems,
}) => {
  // If items provided (Travel by Type), preserve their exact order.
  // Otherwise order so the 5 reference destinations appear first.
  const itemsList = useMemo(() => {
    if (rawItems && rawItems.length > 0) return rawItems;
    if (!rawDestinations || rawDestinations.length === 0) return [];
    const ordered: CoverflowItem[] = [];
    const remaining = [...rawDestinations];

    for (const slug of PREFERRED_ORDER) {
      const idx = remaining.findIndex((d) => d.slug === slug);
      if (idx !== -1) {
        ordered.push(remaining[idx]);
        remaining.splice(idx, 1);
      }
    }
    return [...ordered, ...remaining];
  }, [rawItems, rawDestinations]);

  // Initial active index = 1 or 2 (or 0 if few items)
  const [activeIndex, setActiveIndex] = useState(() => (itemsList.length >= 3 ? 1 : 0));
  const [, navigate] = useLocation();
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const total = itemsList.length;

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleSelect = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  /* Click on any other card smoothly moves it to the center. Clicking center card navigates. */
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, idx: number, targetUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    const offset = getOffset(idx);
    if (offset !== 0) {
      // Reset tilt state so the card glides upright and clean to center
      const card = e.currentTarget;
      card.classList.remove("is-tilting");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
      handleSelect(idx);
    } else {
      navigate(targetUrl);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, idx: number, targetUrl: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const offset = getOffset(idx);
      if (offset !== 0) {
        handleSelect(idx);
      } else {
        navigate(targetUrl);
      }
    }
  };

  /* Interactive smooth 3D micro-tilt when cursor hovers over card and its borders */
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Relative mouse position in percentage (0% to 100%) for radial border sheen
    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // Normalized from -1 to +1 relative to card center
    const normX = Math.max(-1, Math.min(1, (x / rect.width - 0.5) * 2));
    const normY = Math.max(-1, Math.min(1, (y / rect.height - 0.5) * 2));

    // Subtle, luxurious 3D micro-tilt: 7.5 degrees max
    const maxTilt = 7.5;
    const tiltX = -normY * maxTilt;
    const tiltY = normX * maxTilt;

    card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    card.style.setProperty("--mouse-x", `${px.toFixed(1)}%`);
    card.style.setProperty("--mouse-y", `${py.toFixed(1)}%`);

    if (!card.classList.contains("is-tilting")) {
      card.classList.add("is-tilting");
    }
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.classList.remove("is-tilting");
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--mouse-x", "50%");
    card.style.setProperty("--mouse-y", "50%");
  };

  const [isInView, setIsInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Viewport visibility: reveal entrance when scrolling forward or reverse into exact viewport */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      setHasEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Enters viewport (either scrolling forward/down or reverse/up)
        if (entry.isIntersecting && entry.intersectionRatio >= 0.18) {
          setIsInView(true);
          setHasEntered((prev) => {
            if (!prev) {
              setIsRevealing(true);
              if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
              revealTimerRef.current = setTimeout(() => {
                setIsRevealing(false);
              }, 1000);
              return true;
            }
            return prev;
          });
        }
        // Fully leaves viewport (scrolled away up or down)
        else if (!entry.isIntersecting || entry.intersectionRatio <= 0.02) {
          setIsInView(false);
          setHasEntered(false);
          setIsRevealing(false);
          if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        }
      },
      { threshold: [0, 0.05, 0.18, 0.4] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  /* Scroll detection: do not auto-scroll cards while the user is actively scrolling */
  useEffect(() => {
    let isScrollingActive = false;
    const onScroll = () => {
      if (!isScrollingActive) {
        isScrollingActive = true;
        setIsScrolling(true);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingActive = false;
        setIsScrolling(false);
      }, 1200);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  /* Auto-play timer: advances every 4.8s (giving 1.15s silky glide + ~3.65s restful viewing delay)
     Runs ONLY when the cards are in the viewport and user is not scrolling or interacting */
  useEffect(() => {
    if (total <= 1 || isPaused || isScrolling || !isInView) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4800);

    return () => clearInterval(timer);
  }, [activeIndex, isPaused, isScrolling, isInView, total, handleNext]);

  /* Pause auto-play when tab is hidden */
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  /* Touch swipe handling */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  /* Keyboard arrow navigation */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  /* Calculate shortest circular offset from activeIndex */
  const getOffset = (idx: number) => {
    let diff = (idx - activeIndex) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  /* Preload all photos so every slide transition is instant and zero-delay */
  useEffect(() => {
    itemsList.forEach((item) => {
      const src =
        item.img ||
        (item.slug ? CLEAN_PHOTOS[item.slug] : undefined) ||
        item.imageUrl ||
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80";
      if (src && typeof Image !== "undefined") {
        const img = new Image();
        img.src = src;
      }
    });
  }, [itemsList]);

  if (!itemsList || itemsList.length === 0) return null;

  const entranceClass = !hasEntered
    ? "coverflow-entrance-pending"
    : isRevealing
    ? "coverflow-entrance-revealing"
    : "coverflow-entrance-complete";

  return (
    <div
      ref={carouselRef}
      className={`explore-coverflow-wrap ${entranceClass}`}
      tabIndex={0}
      role="region"
      aria-label="Kerala 3D Coverflow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="coverflow-stage-container">
        <div className="coverflow-stage">
          {/* 3D Coverflow Cards */}
        {itemsList.map((item, i) => {
          const offset = getOffset(i);
          const isCenter = offset === 0;

          // Map numeric offset to data attribute value (-3 to +3 are staged for silky smooth transition)
          let offsetAttr = String(offset);
          if (offset < -3) offsetAttr = "hidden-left";
          if (offset > 3) offsetAttr = "hidden-right";

          const imageSrc =
            item.img ||
            (item.slug ? CLEAN_PHOTOS[item.slug] : undefined) ||
            item.imageUrl ||
            "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80";

          const rawTitle =
            item.title ||
            CATEGORY_TITLES[String(item.id)] ||
            (typeof item.name === "string" ? item.name : item.label) ||
            (item.slug === "fort-kochi" ? "KOCHI" : String(item.slug || item.id || ""));

          const displayName = rawTitle.toUpperCase();
          const centerTitle = item.slug === "wayanad" ? "KERALA" : displayName;

          const tagline =
            item.desc ||
            item.shortDesc ||
            (item.slug ? CUSTOM_TAGLINES[item.slug] : undefined) ||
            (item.type ? `${item.type.toUpperCase()} ESCAPE` : "LAND OF A THOUSAND STORIES");

          const locationLabel = "KERALA, INDIA";

          const targetUrl =
            item.link ||
            (item.slug ? `/destinations/${item.slug}` : `/collections/${item.id}`);

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              className="coverflow-card"
              data-offset={offsetAttr}
              aria-label={`Explore ${rawTitle}, Kerala`}
              onClick={(e) => handleCardClick(e, i, targetUrl)}
              onKeyDown={(e) => handleCardKeyDown(e, i, targetUrl)}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="coverflow-card-inner">
                <div className="coverflow-card-media">
                  <img
                    src={imageSrc}
                    alt={`${rawTitle} — Kerala`}
                    className="coverflow-card-img"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                  <div className="coverflow-card-scrim" />
                  <div className="coverflow-card-border-glow" />
                </div>

                {/* Center (Active) card editorial content with 3D depth — smooth CSS cross-fade */}
                <div className="coverflow-center-top">
                  <span className="coverflow-loc-label">{locationLabel}</span>
                  <span className="coverflow-loc-line" />
                </div>

                <div className="coverflow-center-bottom">
                  <h3 className="coverflow-center-title">{centerTitle}</h3>
                  <p className="coverflow-center-tagline" style={{ textTransform: "none", letterSpacing: "0.02em", fontWeight: 400, fontSize: 12, lineHeight: 1.5, maxWidth: 280 }}>
                    {tagline}
                  </p>
                  <div className="coverflow-explore-cta">
                    <span className="cta-text">EXPLORE →</span>
                    <span className="cta-gold-line" />
                  </div>
                </div>

                {/* Side cards: Title at bottom-left with gold underline — smooth CSS cross-fade */}
                <div className="coverflow-side-caption">
                  <span className="side-dest-name">{displayName}</span>
                  <span className="side-gold-line" />
                </div>
              </div>
            </div>
          );
        })}
        </div>

        {/* Navigation arrow buttons positioned at the far outer edges — placed outside 3D stage so they always sit above cards */}
        <button
          type="button"
          className="coverflow-nav-btn prev"
          onClick={handlePrev}
          aria-label="Previous card"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          className="coverflow-nav-btn next"
          onClick={handleNext}
          aria-label="Next card"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Pagination indicators below center */}
      <div className="coverflow-pagination" aria-label="Carousel pagination">
        {itemsList.map((item, idx) => {
          const rawTitle =
            item.title ||
            CATEGORY_TITLES[String(item.id)] ||
            (typeof item.name === "string" ? item.name : item.label) ||
            String(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`coverflow-dot ${idx === activeIndex ? "active" : ""}`}
              onClick={() => handleSelect(idx)}
              aria-label={`Jump to ${rawTitle}`}
            />
          );
        })}
      </div>
    </div>
  );
};
