import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./TropicalLagoonHero.css";

// Ensure ScrollTrigger is registered
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TropicalLagoonHeroProps {
  onExploreClick?: () => void;
}

export default function TropicalLagoonHero({ onExploreClick }: TropicalLagoonHeroProps) {
  const pinContainerRef = useRef<HTMLDivElement>(null);
  const heroRootRef = useRef<HTMLElement>(null);
  const headingMotionRef = useRef<HTMLDivElement>(null);
  const boatScrollWrapperRef = useRef<HTMLDivElement>(null);
  const boatEntranceWrapperRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const bottomLeftRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 8. Respect prefers-reduced-motion fallback
    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Calculate precise travel and exit distances so elements start/finish completely off-screen
    const getTravelDistance = () => Math.round(window.innerWidth * 0.95 + 160);
    const getExitDistance = () => Math.round(window.innerWidth * 0.88 + 140);

    // Connect Lenis to ScrollTrigger so smooth scroll syncs perfectly
    const handleLenisScroll = () => {
      ScrollTrigger.update();
    };

    if (window.__lenis) {
      window.__lenis.on("scroll", handleLenisScroll);
    } else {
      const checkInterval = setInterval(() => {
        if (window.__lenis) {
          clearInterval(checkInterval);
          window.__lenis.on("scroll", handleLenisScroll);
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 2500);
    }

    // GSAP context automatically collects and cleans up all animations on unmount
    const ctx = gsap.context(() => {
      const travelDist = getTravelDistance();

      // Check if user refreshed or navigated while already scrolled down past the hero
      const isScrolledPast = window.scrollY > window.innerHeight * 0.4;

      // ────────────────────────────────────────────────────────────
      // PHASE 1 & 2: HERO REVEAL ENTRANCE TIMELINE
      // ────────────────────────────────────────────────────────────
      const entranceTl = gsap.timeline({
        paused: isScrolledPast,
        defaults: { ease: "power3.out" },
      });

      // Phase 1: Oversized ESCORA heading flies in from outside left edge to center
      // Starts with opacity around 0.5 and ends at opacity 1
      entranceTl.fromTo(
        headingMotionRef.current,
        {
          x: -travelDist,
          opacity: 0.5,
        },
        {
          x: 0,
          opacity: 1,
          duration: 1.45,
          ease: "power3.out",
        },
        0
      );

      // Phase 2: Transparent houseboat follows from outside left edge into center
      // Staggered after headline starts so it clearly follows the text
      entranceTl.fromTo(
        boatEntranceWrapperRef.current,
        {
          x: -travelDist,
        },
        {
          x: 0,
          duration: 1.55,
          ease: "power3.out",
        },
        0.42
      );

      // Subtle editorial UI reveal (eyebrow, description/CTA, and right indicators)
      const uiElements = [
        eyebrowRef.current,
        bottomLeftRef.current,
        rightPanelRef.current,
      ].filter(Boolean);

      if (uiElements.length > 0) {
        entranceTl.fromTo(
          uiElements,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power2.out" },
          0.65
        );
      }

      if (isScrolledPast) {
        entranceTl.progress(1);
      } else {
        entranceTl.play();
      }

      // ────────────────────────────────────────────────────────────
      // PHASE 3: SCROLL-DRIVEN BOAT EXIT TO THE RIGHT
      // ────────────────────────────────────────────────────────────
      // Pin hero during downward scroll and drive boat from center to off-screen right.
      // Reversible when scrolling upward back to top.
      const pinDistance = Math.max(Math.round(window.innerHeight * 0.95), 650);

      gsap.to(boatScrollWrapperRef.current, {
        x: () => getExitDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: pinContainerRef.current,
          start: "top top",
          end: () => `+=${pinDistance}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, pinContainerRef);

    // Refresh ScrollTrigger once DOM layout finishes settling
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
      if (window.__lenis) {
        window.__lenis.off("scroll", handleLenisScroll);
      }
    };
  }, []);

  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onExploreClick) {
      onExploreClick();
      return;
    }
    const nextSection =
      document.getElementById("the-escora-way") ||
      document.getElementById("categories");
    if (nextSection) {
      if ((window as any).__lenis) {
        (window as any).__lenis.scrollTo(nextSection, { offset: 0, duration: 1.4 });
      } else {
        const top = nextSection.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return (
    <div
      className="tropical-hero-pin-container"
      ref={pinContainerRef}
      id="hero"
    >
      <header
        className="tropical-hero-root"
        ref={heroRootRef}
        aria-label="Escora Holidays Kerala Hero"
      >
        {/* ────────────────────────────────────────────────────────────
            LAYER 1: FULL-VIEWPORT TROPICAL LAGOON BACKGROUND
        ──────────────────────────────────────────────────────────── */}
        <div className="tropical-hero-bg-layer" aria-hidden="true">
          <img
            src="/assets/new-hero/Aerial Tropical Lagoon with Palm Shadows.png"
            alt="Aerial tropical Kerala lagoon with turquoise waters and palm shadows"
            className="tropical-hero-bg-img"
            fetchPriority="high"
            loading="eager"
          />
          {/* Subtle ambient lighting tone curve */}
          <div className="tropical-hero-lighting-overlay" />
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 2 & 3: CENTERPIECE (TYPOGRAPHY BEHIND BOAT)
        ──────────────────────────────────────────────────────────── */}
        <div className="tropical-hero-centerpiece">
          {/* Eyebrow Tagline above the letter 'E' */}
          <div className="tropical-hero-eyebrow-container" ref={eyebrowRef}>
            <span className="tropical-hero-eyebrow">KERALA, BEYOND ORDINARY</span>
          </div>

          {/* Oversized ESCORA Wordmark Layer (Z-Index 2, behind boat) */}
          <div
            className="tropical-hero-heading-motion-wrapper"
            ref={headingMotionRef}
          >
            <h1 className="sr-only">Escora Holidays - Kerala, Beyond Ordinary</h1>
            <div className="tropical-hero-wordmark-layer">
              <img
                src="/assets/new-hero/Emerald Water ESCORA Wordmark Text.png"
                alt="Escora"
                className="tropical-hero-wordmark-img"
                fetchPriority="high"
                loading="eager"
              />
            </div>
          </div>

          {/* Transparent Top-Down Houseboat Layer (Z-Index 3, in front of text) */}
          <div
            className="tropical-hero-boat-scroll-wrapper"
            ref={boatScrollWrapperRef}
          >
            <div
              className="tropical-hero-boat-entrance-wrapper"
              ref={boatEntranceWrapperRef}
            >
              <div className="tropical-hero-boat-layer">
                <img
                  src="/assets/new-hero/Top-Down Tropical Thatched Houseboat.png"
                  alt="Traditional Kerala thatched kettuvallam houseboat floating on serene turquoise backwaters"
                  className="tropical-hero-boat-img"
                  fetchPriority="high"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 4: BOTTOM-LEFT EDITORIAL DESCRIPTION & CTA
        ──────────────────────────────────────────────────────────── */}
        <div className="tropical-hero-bottom-left" ref={bottomLeftRef}>
          <p className="tropical-hero-description">
            Serene backwaters, lush landscapes<br />
            and vibrant traditions — a journey<br />
            that stays with you.
          </p>
          <a
            href="#the-escora-way"
            onClick={handleScrollDown}
            className="tropical-hero-cta"
            aria-label="Explore Kerala private journeys"
          >
            <span className="tropical-hero-cta-icon" aria-hidden="true">
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
            <span className="tropical-hero-cta-label">Explore Kerala</span>
          </a>
        </div>

        {/* ────────────────────────────────────────────────────────────
            LAYER 5: RIGHT-SIDE VERTICAL LABELS & MILESTONE INDICATORS
        ──────────────────────────────────────────────────────────── */}
        <div
          className="tropical-hero-right-panel"
          ref={rightPanelRef}
          aria-hidden="true"
        >
          {/* Vertical Editorial Categories */}
          <div className="tropical-hero-categories">
            <span className="hero-cat-tag">BACKWATERS</span>
            <span className="hero-cat-tag">HILLS</span>
            <span className="hero-cat-tag">BEACHES</span>
            <span className="hero-cat-tag">CULTURE</span>
          </div>

          {/* Milestone Vertical Slide Indicators */}
          <div className="tropical-hero-milestones">
            <span className="hero-milestone-number active">01</span>
            <span className="hero-milestone-line" />
            <span className="hero-milestone-number">02</span>
            <span className="hero-milestone-number">03</span>
          </div>
        </div>
      </header>
    </div>
  );
}

