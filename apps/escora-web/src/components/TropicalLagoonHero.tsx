import React, { useEffect, useRef, useState, useCallback } from "react";
import "./TropicalLagoonHero.css";

export interface DestinationSlide {
  id: number;
  filename: string;
  image: string;
  destination: string;
  category: "HILLS" | "BACKWATERS" | "BEACHES" | "CULTURE";
  badge: string;
  tagline: string;
  alt: string;
  objectPositionDesktop: string;
  objectPositionMobile: string;
}

/**
 * 6 Destination Slides in natural numeric filename order from attached_assets/escora/herobg:
 * 1. 1-munnar.png  -> Munnar (Hills)
 * 2. 2-Alleppy.png -> Alleppey (Backwaters)
 * 3. 3-Alleppy.png -> Alleppey (Backwaters)
 * 4. 4-Alleppy.png -> Alleppey (Backwaters)
 * 5. 5-idukky.png  -> Idukki (Hills)
 * 6. 6-idukky.png  -> Idukki (Hills)
 */
export const HERO_SLIDES: DestinationSlide[] = [
  {
    id: 1,
    filename: "1-munnar.png",
    image: "/assets/herobg/1-munnar.png",
    destination: "Munnar",
    category: "HILLS",
    badge: "01 · MUNNAR",
    tagline: "Highland Tea Plantations & Misty Sholas",
    alt: "Rolling tea plantation hills and misty valleys in Munnar, Kerala",
    objectPositionDesktop: "center center",
    objectPositionMobile: "55% center",
  },
  {
    id: 2,
    filename: "2-Alleppy.png",
    image: "/assets/herobg/2-Alleppy.png",
    destination: "Alleppey",
    category: "BACKWATERS",
    badge: "02 · ALLEPPEY",
    tagline: "Vembanad Waterways & Palm Canopy",
    alt: "Serene Alleppey backwaters with traditional kettuvallam houseboats and tall palms",
    objectPositionDesktop: "65% center",
    objectPositionMobile: "68% center",
  },
  {
    id: 3,
    filename: "3-Alleppy.png",
    image: "/assets/herobg/3-Alleppy.png",
    destination: "Alleppey",
    category: "BACKWATERS",
    badge: "03 · ALLEPPEY",
    tagline: "Slow Waterways & Thatched Kettuvallam",
    alt: "Traditional thatched houseboat cruising through Kerala backwater canals in Alleppey",
    objectPositionDesktop: "center center",
    objectPositionMobile: "50% center",
  },
  {
    id: 4,
    filename: "4-Alleppy.png",
    image: "/assets/herobg/4-Alleppy.png",
    destination: "Alleppey",
    category: "BACKWATERS",
    badge: "04 · ALLEPPEY",
    tagline: "Lagoon Reflections & Coconut Groves",
    alt: "Luxury wooden houseboat reflected on still azure waters near coconut palms in Alleppey",
    objectPositionDesktop: "68% center",
    objectPositionMobile: "72% center",
  },
  {
    id: 5,
    filename: "5-idukky.png",
    image: "/assets/herobg/5-idukky.png",
    destination: "Idukki",
    category: "HILLS",
    badge: "05 · IDUKKI",
    tagline: "Cloud-Piercing Western Ghats Pinnacle",
    alt: "Dramatic mountain pinnacle rock piercing misty clouds over the Western Ghats in Idukki",
    objectPositionDesktop: "center center",
    objectPositionMobile: "48% center",
  },
  {
    id: 6,
    filename: "6-idukky.png",
    image: "/assets/herobg/6-idukky.png",
    destination: "Idukki",
    category: "HILLS",
    badge: "06 · IDUKKI",
    tagline: "Misty Mountain Ridge & Wild High Range",
    alt: "Misty mountain ridge and monolithic rock formation in the high hills of Idukki Kerala",
    objectPositionDesktop: "center center",
    objectPositionMobile: "48% center",
  },
];

const SLIDE_DURATION_MS = 6000; // 6 seconds per destination slide (within 5-7s range)

interface TropicalLagoonHeroProps {
  onExploreClick?: () => void;
}

export default function TropicalLagoonHero({ onExploreClick }: TropicalLagoonHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const heroRootRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Single source of truth for active slide & destination
  const activeSlide = HERO_SLIDES[currentIndex];
  const activeDestination = activeSlide.destination;

  // Preload all 6 images immediately to eliminate flashes, blank frames or loading lags
  useEffect(() => {
    if (typeof window === "undefined") return;
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  // Safe slide transition handler
  const goToSlide = useCallback((newIndex: number) => {
    setCurrentIndex((prev) => {
      if (prev === newIndex) return prev;
      setPreviousIndex(prev);
      return newIndex;
    });
    setProgressKey((k) => k + 1);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = (prev + 1) % HERO_SLIDES.length;
      setPreviousIndex(prev);
      return next;
    });
    setProgressKey((k) => k + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const prevIdx = (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
      setPreviousIndex(prev);
      return prevIdx;
    });
    setProgressKey((k) => k + 1);
  }, []);

  // Automatic slideshow transition every 6 seconds
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, nextSlide]);

  // Smooth scroll to #categories for Explore Kerala button
  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onExploreClick) {
      onExploreClick();
      return;
    }
    const nextSection = document.getElementById("categories");
    if (nextSection) {
      if ((window as any).__lenis) {
        (window as any).__lenis.scrollTo(nextSection, { offset: 0, duration: 1.4 });
      } else {
        const top = nextSection.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      nextSlide();
    } else if (e.key === "ArrowLeft") {
      prevSlide();
    }
  };

  return (
    <div className="esh-outer-container" id="hero">
      <header
        className="esh-root tropical-hero-root"
        ref={heroRootRef}
        aria-label="Escora Holidays Kerala Destination Showcase"
        data-hero="true"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* ────────────────────────────────────────────────────────────
            LAYER 1: CINEMATIC DESTINATION SLIDESHOW (6 SUPPLIED IMAGES)
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-slides-layer" aria-hidden="true">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const isPrevious = idx === previousIndex;

            return (
              <div
                key={slide.id}
                className={`esh-slide${isActive ? " is-active" : ""}${isPrevious ? " is-previous" : ""}`}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="esh-img"
                  fetchPriority={idx === 0 ? "high" : "low"}
                  loading={idx === 0 ? "eager" : "lazy"}
                  style={
                    {
                      "--pos-desktop": slide.objectPositionDesktop,
                      "--pos-mobile": slide.objectPositionMobile,
                    } as React.CSSProperties
                  }
                  onError={(e) => {
                    // Graceful fallback if any image load hiccups
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            );
          })}
        </div>


        {/* ────────────────────────────────────────────────────────────
            LAYER 3: HERO CONTENT & ANIMATED DESTINATION NAME
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-content-wrap">
          {/* Eyebrow Tagline */}
          <div className="esh-eyebrow-row">
            <span className="esh-eyebrow-dot" />
            <span className="esh-eyebrow">KERALA, BEYOND ORDINARY</span>
          </div>

          {/* Prominent Animated Destination Name Display */}
          <div className="esh-title-stage" aria-live="polite">
            <div
              key={activeDestination}
              className="esh-title-motion"
            >
              <h1 className="esh-title">
                <span className="esh-title-text">{activeDestination}</span>
              </h1>
            </div>
          </div>

          {/* Preserved Editorial Description */}
          <p className="esh-description">
            Serene backwaters, lush landscapes<br />
            and vibrant traditions — a journey<br />
            that stays with you.
          </p>

          {/* Preserved Primary CTA Button */}
          <div className="esh-actions">
            <a
              href="#categories"
              onClick={handleScrollDown}
              className="esh-cta"
              aria-label="Explore Kerala private journeys"
            >
              <span className="esh-cta-icon" aria-hidden="true">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
              <span className="esh-cta-label">Explore Kerala</span>
            </a>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 4: SLIDESHOW CONTROLS & DURATION PROGRESS BAR
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-nav-controls" aria-label="Slideshow controls">
          {/* Prev Arrow */}
          <button
            type="button"
            className="esh-nav-arrow"
            onClick={prevSlide}
            aria-label="Previous destination image"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Slide Counter (01 / 06) */}
          <div className="esh-counter">
            <span className="esh-counter-current">
              {String(currentIndex + 1).padStart(2, "0")}
            </span>
            <span className="esh-counter-sep">/</span>
            <span className="esh-counter-total">
              {String(HERO_SLIDES.length).padStart(2, "0")}
            </span>
          </div>

          {/* Next Arrow */}
          <button
            type="button"
            className="esh-nav-arrow"
            onClick={nextSlide}
            aria-label="Next destination image"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Subtle Progress Bar */}
          <div className="esh-progress-track" aria-hidden="true">
            <div
              key={progressKey}
              className={`esh-progress-bar${isPaused ? " is-paused" : ""}`}
              style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
            />
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 5: RIGHT-SIDE VERTICAL CATEGORIES & MILESTONES
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-right-panel" aria-hidden="true">
          {/* Vertical Editorial Categories */}
          <div className="esh-categories">
            <span className={`esh-cat-tag${activeSlide.category === "BACKWATERS" ? " active" : ""}`}>
              BACKWATERS
            </span>
            <span className={`esh-cat-tag${activeSlide.category === "HILLS" ? " active" : ""}`}>
              HILLS
            </span>
            <span className={`esh-cat-tag${activeSlide.category === "BEACHES" ? " active" : ""}`}>
              BEACHES
            </span>
            <span className={`esh-cat-tag${activeSlide.category === "CULTURE" ? " active" : ""}`}>
              CULTURE
            </span>
          </div>

          {/* Milestone Vertical Slide Indicators for all 6 slides */}
          <div className="esh-milestones">
            {HERO_SLIDES.map((slide, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`esh-milestone-btn${isCurrent ? " is-active" : ""}`}
                  aria-label={`Go to slide ${idx + 1}: ${slide.destination}`}
                  title={`${slide.destination} (${idx + 1}/6)`}
                >
                  <span className="esh-milestone-number">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {isCurrent && <span className="esh-milestone-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>
    </div>
  );
}
