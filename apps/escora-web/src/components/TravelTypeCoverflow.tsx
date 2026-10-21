import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

const getCardTitle = (item: TravelTypeItem): string => {
  switch (item.id) {
    case "health-wellness":
      return "Health & Wellness";
    case "nature-wildlife":
      return "Nature & Wildlife";
    case "hill-stations":
      return "Hill Stations";
    case "backwaters":
      return "Backwaters";
    case "honeymoon":
      return "Honeymoon";
    case "beaches":
      return "Kerala Beaches";
    case "functional-medicine":
      return "Functional Medicine";
    case "historical-heritage":
      return "Heritage & Culture";
    default:
      return item.label;
  }
};

export const TravelTypeCoverflow: React.FC<TravelTypeCoverflowProps> = ({
  items,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}) => {
  // Center card initially on index 1 (Wellness) or controlledIndex
  const [internalIndex, setInternalIndex] = useState(1);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const [, navigate] = useLocation();
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [entranceState, setEntranceState] = useState<"pending" | "revealing" | "complete">("pending");

  const carouselRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerCurrentX = useRef<number | null>(null);
  const didDragRef = useRef(false);
  // Track previous offsets of each card to detect circular wrap jumps
  const prevOffsetsRef = useRef<Record<string, number>>({});
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Viewport Intersection Observer: Trigger entrance animation when scrolled into view */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setEntranceState("complete");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
          setEntranceState((prev) => {
            if (prev === "pending") {
              if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
              revealTimerRef.current = setTimeout(() => {
                setEntranceState("complete");
              }, 1200);
              return "revealing";
            }
            return prev;
          });
        } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.02) {
          setEntranceState("pending");
          if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        }
      },
      { threshold: [0, 0.05, 0.12, 0.35] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

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

  /* Preload images */
  useEffect(() => {
    items.forEach((item) => {
      if (item.img && typeof Image !== "undefined") {
        const img = new Image();
        img.src = item.img;
      }
    });
  }, [items]);

  /* Track offsets after render to detect wrap-around jumps */
  useEffect(() => {
    const nextOffsets: Record<string, number> = {};
    items.forEach((item, i) => {
      nextOffsets[item.id] = getOffset(i);
    });
    prevOffsetsRef.current = nextOffsets;
  }, [items, getOffset]);

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

                  {/* ─── Top Category Tag / Badge on Each Card (Matches Reference Image) ─── */}
                  <div className="coverflow-card-badge">
                    <span className="coverflow-badge-pill">{item.label}</span>
                  </div>

                  {/* ─── Bottom Content: Title + Count + 'View All →' Button ─── */}
                  <div className="tt-card-content">
                    <div className="tt-card-info">
                      <h3 className="tt-card-title">{getCardTitle(item)}</h3>
                      <p className="tt-card-count">{item.count}</p>
                      {item.desc && (
                        <div className="tt-card-reveal">
                          <p className="tt-card-desc">{item.desc}</p>
                        </div>
                      )}
                    </div>

                    <a
                      href={item.link}
                      className="tt-card-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.link);
                      }}
                      aria-label={`View all ${item.label} journeys`}
                    >
                      <span>View All</span>
                      <ArrowRight size={13} strokeWidth={2.2} />
                    </a>
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
