import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./TravelTypeCoverflow.css";

export interface TravelTypeItem {
  id: string;
  label: string;
  img: string;
  name: React.ReactNode;
  desc: string;
  count: string;
  price?: string;
  priceLabel?: string;
  link: string;
}

export interface TravelTypeCoverflowProps {
  items: TravelTypeItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export function getCardBottomBadgeLabel(item: TravelTypeItem): string {
  const id = (item.id || "").toLowerCase().trim();
  if (id === "hill-stations") return "HILL STATIONS";
  if (id === "backwaters") return "BACKWATERS";
  if (id === "beaches") return "KERALA BEACHES";
  if (id === "functional-medicine") return "FUNCTIONAL MEDICINE";
  if (id === "historical-heritage") return "HISTORICAL & HERITAGE";
  if (id === "nature-wildlife") return "NATURE & WILDLIFE";
  if (id === "health-wellness") return "HEALTH & WELLNESS";
  if (id === "honeymoon") return "HONEYMOON";

  return (item.label || item.id || "").toUpperCase();
}

export function formatCardEditorialTitle(item: TravelTypeItem): React.ReactNode {
  const id = (item.id || "").toLowerCase().trim();
  if (id === "beaches") return <>KERALA<br/>BEACHES</>;
  if (id === "backwaters") return <>KERALA<br/>BACKWATERS</>;
  if (id === "honeymoon") return <>KERALA<br/>HONEYMOON</>;
  if (id === "hill-stations") return <>HILL<br/>STATIONS</>;
  if (id === "functional-medicine") return <>FUNCTIONAL<br/>MEDICINE</>;
  if (id === "historical-heritage") return <>HISTORICAL &amp;<br/>HERITAGE</>;
  if (id === "nature-wildlife") return <>NATURE &amp;<br/>WILDLIFE</>;
  if (id === "health-wellness") return <>HEALTH &amp;<br/>WELLNESS</>;

  const text = (item.label || item.id || "").toUpperCase().trim();
  if (text.includes("&")) {
    const parts = text.split("&");
    return <>{parts[0].trim()} &amp;<br />{parts.slice(1).join("&").trim()}</>;
  }
  const words = text.split(/\s+/);
  if (words.length > 1) {
    const firstPart = words.slice(0, -1).join(" ");
    const lastWord = words[words.length - 1];
    return <>{firstPart}<br />{lastWord}</>;
  }
  return text;
}

export function formatTravelCategoryTitle(label: string, slug?: string): React.ReactNode {
  return formatCardEditorialTitle({ id: slug || "", label } as TravelTypeItem);
}

export const TravelTypeCoverflow: React.FC<TravelTypeCoverflowProps> = ({
  items,
  isLoading,
  isError,
  onRetry,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}) => {
  // Center card initially on Beaches (matching reference image) or index 2/0
  const [internalIndex, setInternalIndex] = useState(() => {
    const beachesIdx = items.findIndex((it) => it.id === "beaches");
    if (beachesIdx !== -1) return beachesIdx;
    return items.length > 2 ? 2 : 0;
  });
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const [, navigate] = useLocation();
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [entranceState, setEntranceState] = useState<"pending" | "revealing" | "complete">("complete");

  const carouselRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerCurrentX = useRef<number | null>(null);
  const didDragRef = useRef(false);
  // Track previous offsets of each card to detect circular wrap jumps
  const prevOffsetsRef = useRef<Record<string, number>>({});
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync center card selection when items load dynamically
  useEffect(() => {
    if (controlledIndex === undefined && internalIndex === 0 && items.length > 2) {
      const beachesIdx = items.findIndex((it) => it.id === "beaches");
      setInternalIndex(beachesIdx !== -1 ? beachesIdx : 2);
    }
  }, [items.length, controlledIndex, internalIndex]);

  /* Viewport Intersection Observer: Trigger entrance animation when scrolled into view */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const pinnedSlide = el.closest(".pinned-journey-slide");
    if (pinnedSlide) {
      setEntranceState("complete");
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setEntranceState("complete");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntranceState("complete");
        }
      },
      { threshold: [0, 0.08] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [isLoading, items.length]);

  const total = items.length;

  const updateIndex = useCallback(
    (newIndex: number) => {
      setInternalIndex(newIndex);
      onActiveIndexChange?.(newIndex);
    },
    [onActiveIndexChange]
  );

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    updateIndex((activeIndex + 1) % total);
  }, [activeIndex, total, updateIndex]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    updateIndex((activeIndex - 1 + total) % total);
  }, [activeIndex, total, updateIndex]);

  const handleSelect = useCallback(
    (idx: number) => {
      updateIndex(idx);
    },
    [updateIndex]
  );

  /* Calculate shortest circular offset from activeIndex */
  const getOffset = useCallback(
    (idx: number) => {
      let diff = (idx - activeIndex) % total;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      return diff;
    },
    [activeIndex, total]
  );

  /* Card click handling */
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, idx: number, link: string) => {
    // If a drag gesture just finished, ignore the click
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const offset = getOffset(idx);
    if (offset !== 0) {
      handleSelect(idx);
    } else {
      navigate(link);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, idx: number, link: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const offset = getOffset(idx);
      if (offset !== 0) {
        handleSelect(idx);
      } else {
        navigate(link);
      }
    }
  };

  /* Edge-only tilt effect: tilts on Y axis only when hovering near the left or right edges */
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    if (rect.width === 0) return;

    const x = e.clientX - rect.left;
    const ratio = x / rect.width; // 0 (left edge) to 1 (right edge)

    const EDGE_ZONE = 0.28; // Outer 28% width on the left and right edges
    const MAX_TILT = 7.5; // Max tilt in degrees

    let tiltY = 0;

    if (ratio < EDGE_ZONE) {
      // Hovering near left edge: tilt to the left (-Y)
      const factor = (EDGE_ZONE - ratio) / EDGE_ZONE; // 0 at edge boundary, 1 at leftmost border
      tiltY = -factor * MAX_TILT;
    } else if (ratio > 1 - EDGE_ZONE) {
      // Hovering near right edge: tilt to the right (+Y)
      const factor = (ratio - (1 - EDGE_ZONE)) / EDGE_ZONE; // 0 at edge boundary, 1 at rightmost border
      tiltY = factor * MAX_TILT;
    } else {
      // In the center area (middle 44% of the card): completely flat, zero tilt!
      tiltY = 0;
    }

    card.style.setProperty("--edge-tilt-y", `${tiltY.toFixed(2)}deg`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--edge-tilt-y", "0deg");
  };

  /* Pointer / Mouse Drag interactions */
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only capture primary mouse click or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pointerStartX.current = e.clientX;
    pointerCurrentX.current = e.clientX;
    didDragRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    pointerCurrentX.current = e.clientX;
    const delta = e.clientX - pointerStartX.current;
    if (Math.abs(delta) > 8) {
      didDragRef.current = true;
    }
  };

  const handlePointerUp = () => {
    if (pointerStartX.current !== null && pointerCurrentX.current !== null) {
      const delta = pointerCurrentX.current - pointerStartX.current;
      const DRAG_THRESHOLD = 36;
      if (delta < -DRAG_THRESHOLD) {
        handleNext();
      } else if (delta > DRAG_THRESHOLD) {
        handlePrev();
      }
    }
    pointerStartX.current = null;
    pointerCurrentX.current = null;
    setIsDragging(false);
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    pointerCurrentX.current = null;
    setIsDragging(false);
  };

  /* Auto-play timer */
  const isScrollingRef = useRef(false);
  const isInViewRef = useRef(true);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingRef.current = false;
        scrollTimeout = null;
      }, 600);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (total <= 1) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      if (!isPaused && !isDragging && !isScrollingRef.current && isInViewRef.current) {
        handleNext();
      }
    }, 5200);

    return () => clearInterval(timer);
  }, [total, isPaused, isDragging, handleNext]);

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

  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length) {
      updateIndex(0);
    }
  }, [items.length, activeIndex, updateIndex]);

  /* Preload images */
  useEffect(() => {
    items.forEach((item) => {
      if (item.img && typeof Image !== "undefined") {
        const img = new Image();
        img.src = item.img;
      }
    });
  }, [items]);

  if (isLoading && (!items || items.length === 0)) {
    return (
      <div className="travel-type-coverflow-wrap flex items-center justify-center py-24 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#c59a58]/30 border-t-[#c59a58] rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#E5C388]/90">Loading categories…</p>
        </div>
      </div>
    );
  }

  if (isError && (!items || items.length === 0)) {
    return (
      <div className="travel-type-coverflow-wrap flex items-center justify-center py-20 text-center">
        <div className="flex flex-col items-center gap-3 max-w-sm px-4">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-red-400">Failed to load travel categories</p>
          <p className="text-xs text-white/60">Unable to load category information from the server.</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-full border border-[#c59a58]/40 text-[#c59a58] text-xs font-mono tracking-wider hover:bg-[#c59a58]/10 transition-colors mt-2"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="travel-type-coverflow-wrap flex items-center justify-center py-20 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#E5C388]/70">No travel categories available at this time.</p>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div
      ref={carouselRef}
      className={`travel-type-coverflow-wrap coverflow-entrance-${entranceState}`}
      tabIndex={0}
      role="region"
      aria-label="Travel by Type 3D Coverflow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={onKeyDown}
    >
      {/* ─── 3D Coverflow Stage Container ─── */}
      <div
        className="coverflow-stage-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className={`coverflow-stage ${isDragging ? "is-dragging" : ""}`}>
          {items.map((item, i) => {
            const offset = getOffset(i);

            let offsetAttr = String(offset);
            if (offset < -3) offsetAttr = "hidden-left";
            if (offset > 3) offsetAttr = "hidden-right";

            const prevOffset = prevOffsetsRef.current[item.id];
            const isWrapping =
              prevOffset !== undefined && Math.abs(offset - prevOffset) > total / 2;

            const isCenter = offset === 0;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className={`coverflow-card ${isWrapping ? "is-wrapping" : ""}`}
                data-offset={offsetAttr}
                aria-label={`Explore ${item.label} journeys in Kerala`}
                onClick={(e) => handleCardClick(e, i, item.link)}
                onKeyDown={(e) => handleCardKeyDown(e, i, item.link)}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="coverflow-card-inner">
                  <img
                    src={item.img}
                    alt={`${item.label} — Kerala`}
                    className="coverflow-card-img"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                  <div className="coverflow-card-scrim" />

                  {/* Side Card bottom-left badge: Category name + gold line (matches reference design) */}
                  <div className="coverflow-side-badge">
                    <span className="side-badge-label">{getCardBottomBadgeLabel(item)}</span>
                    <span className="side-badge-gold-line" />
                  </div>

                  {/* Center (Active) card editorial content */}
                  <div className="coverflow-center-top">
                    <span className="coverflow-loc-label">KERALA, INDIA</span>
                    <span className="coverflow-loc-line" />
                  </div>

                  <div className="coverflow-center-bottom">
                    <h3 className="coverflow-center-title">
                      {formatCardEditorialTitle(item)}
                    </h3>
                    <p className="coverflow-center-desc">{item.desc}</p>
                    <div
                      className="coverflow-explore-cta"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      <span className="cta-text">EXPLORE →</span>
                      <span className="cta-gold-line" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Navigation Chevron Arrows (Accessible Side Controls) ─── */}
        <button
          type="button"
          className="coverflow-nav-btn prev"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous journey type"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          type="button"
          className="coverflow-nav-btn next"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next journey type"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* ─── Pagination Dots ─── */}
      <div className="coverflow-pagination" aria-label="Journey type pagination">
        {items.map((it, idx) => (
          <button
            key={it.id}
            type="button"
            className={`coverflow-dot ${idx === activeIndex ? "active" : ""}`}
            onClick={() => handleSelect(idx)}
            aria-label={`Jump to ${it.label}`}
          />
        ))}
      </div>
    </div>
  );
};
