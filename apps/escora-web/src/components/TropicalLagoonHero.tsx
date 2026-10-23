import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
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

const SLIDE_DURATION_MS = 2000; // 2 seconds per destination slide

interface TropicalLagoonHeroProps {
  onExploreClick?: () => void;
}

export default function TropicalLagoonHero({ onExploreClick }: TropicalLagoonHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const heroRootRef = useRef<HTMLElement>(null);
  const cardButtonRef = useRef<HTMLButtonElement>(null);
  const expandingCardRef = useRef<HTMLDivElement>(null);
  const expandingImgRef = useRef<HTMLImageElement>(null);
  const isTransitioningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active full-screen slide
  const activeSlide = HERO_SLIDES[currentIndex];

  // Preview card displaying the next upcoming slide
  const nextSlideIdx = (currentIndex + 1) % HERO_SLIDES.length;
  const nextPreviewSlide = HERO_SLIDES[nextSlideIdx];

  // Preload all 6 images immediately to eliminate flashes, blank frames or loading lags
  useEffect(() => {
    if (typeof window === "undefined") return;
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  // Cinematic card expansion animation to become full-screen hero background
  const animateCardToBackground = useCallback((targetIndex: number) => {
    if (isTransitioningRef.current) return;
    if (typeof window === "undefined") return;

    const heroEl = heroRootRef.current;
    const cardEl = cardButtonRef.current;
    const expandingEl = expandingCardRef.current;
    const expandingImg = expandingImgRef.current;

    if (!heroEl || !cardEl || !expandingEl || !expandingImg) {
      setCurrentIndex(targetIndex);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCurrentIndex(targetIndex);
      return;
    }

    isTransitioningRef.current = true;

    const targetSlide = HERO_SLIDES[targetIndex];

    // Measure exact position and dimensions of the preview card relative to the hero root
    const heroRect = heroEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();

    const startTop = cardRect.top - heroRect.top;
    const startLeft = cardRect.left - heroRect.left;
    const startWidth = cardRect.width;
    const startHeight = cardRect.height;
    const cardBorderRadius = window.getComputedStyle(cardEl).borderRadius || "18px";

    // Set target image attributes on the expanding clone
    expandingImg.src = targetSlide.image;
    expandingImg.alt = targetSlide.alt;
    expandingImg.style.setProperty("--pos-desktop", targetSlide.objectPositionDesktop);
    expandingImg.style.setProperty("--pos-mobile", targetSlide.objectPositionMobile);

    // Cancel any active tweens
    gsap.killTweensOf(expandingEl);
    gsap.killTweensOf(cardEl);

    // Set initial position of expanding card to overlay preview card exactly
    gsap.set(expandingEl, {
      top: startTop,
      left: startLeft,
      width: startWidth,
      height: startHeight,
      borderRadius: cardBorderRadius,
      opacity: 1,
      border: "none",
      boxShadow: "0 16px 38px rgba(0, 0, 0, 0.42)",
      display: "block",
    });

    // Hide preview card immediately (expanding clone takes over seamlessly)
    gsap.set(cardEl, { opacity: 0 });

    // Smooth cinematic expansion: growing proportionally from bottom-right to fill the entire hero
    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
    });

    tl.to(expandingEl, {
      top: 0,
      left: 0,
      width: heroRect.width,
      height: heroRect.height,
      borderRadius: 0,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      duration: 1.35,
      onComplete: () => {
        // 1. Commit active slide index to state
        setCurrentIndex(targetIndex);

        // 2. Wait for React double-rAF paint of base background before hiding expanding card
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            gsap.set(expandingEl, { display: "none" });

            // 3. Reveal next preview card smoothly from 0% to 100%
            gsap.set(cardEl, { transition: "none" });
            gsap.fromTo(
              cardEl,
              {
                opacity: 0,
                scale: 0,
                transformOrigin: "bottom right",
              },
              {
                opacity: 1,
                scale: 1,
                duration: 0.85,
                ease: "power3.out",
                clearProps: "transform,transformOrigin,transition",
                onComplete: () => {
                  isTransitioningRef.current = false;
                },
              }
            );
          });
        });
      },
    });
  }, []);

  const nextSlide = useCallback(() => {
    if (isTransitioningRef.current) return;
    const next = (currentIndex + 1) % HERO_SLIDES.length;
    animateCardToBackground(next);
  }, [currentIndex, animateCardToBackground]);

  const prevSlide = useCallback(() => {
    if (isTransitioningRef.current) return;
    const prev = (currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
    animateCardToBackground(prev);
  }, [currentIndex, animateCardToBackground]);

  // Automatic slideshow transition in a continuous seamless loop
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, nextSlide]);

  // Smooth scroll to next section for Explore Kerala button
  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onExploreClick) {
      onExploreClick();
      return;
    }
    const nextSection = document.getElementById("why-escora") || document.getElementById("categories");
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
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* ────────────────────────────────────────────────────────────
            LAYER 1: CINEMATIC DESTINATION BASE BACKGROUND
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-slides-layer" aria-hidden="true">
          <div className="esh-slide is-active">
            <img
              src={activeSlide.image}
              alt={activeSlide.alt}
              className="esh-img"
              fetchPriority="high"
              loading="eager"
              style={
                {
                  "--pos-desktop": activeSlide.objectPositionDesktop,
                  "--pos-mobile": activeSlide.objectPositionMobile,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 2: EXPANDING CARD MORPH TRANSITION
        ──────────────────────────────────────────────────────────── */}
        <div
          ref={expandingCardRef}
          className="esh-expanding-card"
          aria-hidden="true"
        >
          <img
            ref={expandingImgRef}
            src={nextPreviewSlide.image}
            alt=""
            className="esh-expanding-img"
          />
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 3: HERO CONTENT & ANIMATED DESTINATION NAME
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-content-wrap">
          {/* Eyebrow: Gold Accent Line + GOD'S OWN COUNTRY */}
          <div className="esh-eyebrow-row">
            <span className="esh-eyebrow-line" aria-hidden="true" />
            <span className="esh-eyebrow">GOD&apos;S OWN COUNTRY</span>
          </div>

          {/* Main Title: KERALA */}
          <div className="esh-title-stage" aria-live="polite">
            <div className="esh-title-motion" key={currentIndex}>
              <h1 className="esh-title">
                <span className="esh-title-text">KERALA</span>
              </h1>
            </div>
          </div>

          {/* Subtitle / Tagline: Where Every Journey Feels Like Home */}
          <h2 className="esh-subtitle">
            Where Every Journey<br />Feels Like Home
          </h2>

          {/* Editorial Description */}
          <p className="esh-description">
            Backwaters, mountains, beaches and culture —<br />
            discover the many shades of Kerala with Escora.
          </p>
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 4: BOTTOM CENTER ALIGNED "EXPLORE KERALA" CTA BUTTON
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-bottom-cta">
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

        {/* ────────────────────────────────────────────────────────────
            LAYER 4: RIGHT-SIDE SINGLE PREVIEW CARD (IMAGE ONLY)
        ──────────────────────────────────────────────────────────── */}
        <div className="esh-right-wrapper">
          <div className="esh-hero-cards-row" role="region" aria-label="Next destination">
            <button
              ref={cardButtonRef}
              type="button"
              className="esh-hero-card"
              onClick={nextSlide}
              aria-label={`Next: ${nextPreviewSlide.destination}`}
              title={`Next: ${nextPreviewSlide.destination}`}
            >
              <img
                src={nextPreviewSlide.image}
                alt={nextPreviewSlide.alt}
                className="esh-card-img"
                loading="lazy"
                decoding="async"
              />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
