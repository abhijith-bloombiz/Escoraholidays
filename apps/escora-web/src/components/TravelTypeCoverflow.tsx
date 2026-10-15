import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

interface TravelTypeCoverflowProps {
  items: TravelTypeItem[];
}

export const TravelTypeCoverflow: React.FC<TravelTypeCoverflowProps> = ({ items }) => {
  // Center card initially on index 1 (Health & Wellness) or 0
  const [activeIndex, setActiveIndex] = useState(1);
  const [, navigate] = useLocation();
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const total = items.length;

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

  /* Click on any other card smoothly moves it to center. Clicking center card navigates. */
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, idx: number, link: string) => {
    e.preventDefault();
    e.stopPropagation();
    const offset = getOffset(idx);
    if (offset !== 0) {
      const card = e.currentTarget;
      card.classList.remove("is-tilting");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
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

  /* Interactive smooth 3D micro-tilt when cursor moves across card */
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const normX = Math.max(-1, Math.min(1, (x / rect.width - 0.5) * 2));
    const normY = Math.max(-1, Math.min(1, (y / rect.height - 0.5) * 2));

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

  /* Scroll detection */
  useEffect(() => {
    let isScrollingActive = false;
    const onScroll = () => {
      if (!isScrollingActive) {
        isScrollingActive = true;
        setIsScrolling(true);
      }
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
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
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  /* Auto-play timer */
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

  /* Preload images */
  useEffect(() => {
    items.forEach((item) => {
      if (item.img && typeof Image !== "undefined") {
        const img = new Image();
        img.src = item.img;
      }
    });
  }, [items]);

  if (!items || items.length === 0) return null;

  const entranceClass = !hasEntered
    ? "coverflow-entrance-pending"
    : isRevealing
    ? "coverflow-entrance-revealing"
    : "coverflow-entrance-complete";

  return (
    <div
      ref={carouselRef}
      className={`explore-coverflow-wrap travel-type-coverflow-wrap ${entranceClass}`}
      tabIndex={0}
      role="region"
      aria-label="Travel by Type 3D Coverflow"
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
          {items.map((item, i) => {
            const offset = getOffset(i);

            let offsetAttr = String(offset);
            if (offset < -3) offsetAttr = "hidden-left";
            if (offset > 3) offsetAttr = "hidden-right";

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="coverflow-card cat-card"
                data-offset={offsetAttr}
                aria-label={`Explore ${item.label} journeys in Kerala`}
                onClick={(e) => handleCardClick(e, i, item.link)}
                onKeyDown={(e) => handleCardKeyDown(e, i, item.link)}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="coverflow-card-inner">
                  <div className="coverflow-card-media">
                    <img
                      src={item.img}
                      alt={`${item.label} — Kerala`}
                      className="coverflow-card-img"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                    <div className="coverflow-card-scrim" />
                    <div className="coverflow-card-border-glow" />
                  </div>

                  {/* Top-Left Gold Badge */}
                  <span className="c-label">{item.label}</span>

                  {/* Exact Previous Content & Typography */}
                  <div className="content">
                    <div className="c-name">{item.name}</div>
                    <div className="c-reveal">
                      <p>{item.desc}</p>
                    </div>
                    <div className="c-meta">
                      <div className="c-count">{item.count}</div>
                      <div className="c-cta">
                        Explore <span className="arr" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation arrow buttons */}
        <button
          type="button"
          className="coverflow-nav-btn prev"
          onClick={handlePrev}
          aria-label="Previous journey type"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          className="coverflow-nav-btn next"
          onClick={handleNext}
          aria-label="Next journey type"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Pagination indicators */}
      <div className="coverflow-pagination" aria-label="Journey type pagination">
        {items.map((it, idx) => (
          <button
            key={it.id}
            type="button"
            className={`coverflow-dot ${idx === activeIndex ? "active" : ""}`}
            onClick={() => handleSelect(idx)}
            aria-label={`Jump to ${it.name}`}
          />
        ))}
      </div>
    </div>
  );
};
