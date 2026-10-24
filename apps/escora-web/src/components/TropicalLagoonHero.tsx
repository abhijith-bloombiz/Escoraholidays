import React, { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import kovalamCleanBadge from "@assets/escora/destinations/kovalam-clean.jpg";
import wayanadBadge from "@assets/escora/destinations/wayanad.jpg";
import fortKochiBadge from "@assets/escora/destinations/fort-kochi.jpg";
import bekalBadge from "@assets/escora/destinations/bekal.jpg";
import "./TropicalLagoonHero.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const KERALA_LETTERS = ["K", "E", "R", "A", "L", "A"];

interface TropicalLagoonHeroProps {
  onExploreClick?: () => void;
}

export default function TropicalLagoonHero({ onExploreClick }: TropicalLagoonHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  const centerRef = useRef<HTMLDivElement>(null);
  const centerInnerRef = useRef<HTMLDivElement>(null);
  const panelLeftRef = useRef<HTMLDivElement>(null);
  const panelRightRef = useRef<HTMLDivElement>(null);
  const panelTopLeftRef = useRef<HTMLDivElement>(null);
  const panelTopMidRef = useRef<HTMLDivElement>(null);
  const panelTopRightRef = useRef<HTMLDivElement>(null);
  const panelBottomLeftRef = useRef<HTMLDivElement>(null);
  const panelBottomMidRef = useRef<HTMLDivElement>(null);
  const panelBottomRightRef = useRef<HTMLDivElement>(null);

  const titleGroupRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);

  const autoRevealTlRef = useRef<gsap.core.Timeline | null>(null);
  const isAutoRevealedRef = useRef(false);

  // Preload all 9 mosaic assets immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    const assets = [
      "/assets/herobg/1-munnar.png",
      "/assets/herobg/4-Alleppy.png",
      "/assets/herobg/5-idukky.png",
      kovalamCleanBadge,
      "/assets/herobg/6-idukky.png",
      wayanadBadge,
      "/assets/herobg/3-Alleppy.png",
      fortKochiBadge,
      bekalBadge,
    ];
    assets.forEach((src) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 1. Initial Hero Mount Animation: Staggered character-by-character KERALA reveal & set initial off-screen states
  useEffect(() => {
    const letters = lettersRef.current.filter(Boolean) as HTMLSpanElement[];
    if (letters.length === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ensure surrounding panels start off-screen
    if (!isAutoRevealedRef.current) {
      if (panelTopLeftRef.current) gsap.set(panelTopLeftRef.current, { yPercent: -125, opacity: 0 });
      if (panelTopMidRef.current) gsap.set(panelTopMidRef.current, { yPercent: -125, opacity: 0 });
      if (panelTopRightRef.current) gsap.set(panelTopRightRef.current, { yPercent: -125, opacity: 0 });
      if (panelLeftRef.current) gsap.set(panelLeftRef.current, { xPercent: -125, opacity: 0 });
      if (panelRightRef.current) gsap.set(panelRightRef.current, { xPercent: 125, opacity: 0 });
      if (panelBottomLeftRef.current) gsap.set(panelBottomLeftRef.current, { yPercent: 125, opacity: 0 });
      if (panelBottomMidRef.current) gsap.set(panelBottomMidRef.current, { yPercent: 125, opacity: 0 });
      if (panelBottomRightRef.current) gsap.set(panelBottomRightRef.current, { yPercent: 125, opacity: 0 });
    }

    if (titleGroupRef.current) {
      gsap.set(titleGroupRef.current, { x: 0, y: 0 });
    }

    if (subtitleRef.current) {
      gsap.set(subtitleRef.current, { opacity: 0 });
    }

    if (headingRef.current) {
      gsap.set(headingRef.current, { transformOrigin: "center center" });
    }

    if (prefersReducedMotion) {
      gsap.set(letters, { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 });
      return;
    }

    gsap.fromTo(
      letters,
      {
        opacity: 0,
        y: 45,
        filter: "blur(16px)",
        scale: 1.15,
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1,
        stagger: 0.08,
        duration: 1.25,
        ease: "power3.out",
        delay: 0.15,
      }
    );
  }, []);

  // 2. Auto-Reveal Choreography: 1st Image (Fullscreen) -> 2nd Image (Mosaic Grid)
  const triggerAutoReveal = useCallback(() => {
    if (isAutoRevealedRef.current) return;
    isAutoRevealedRef.current = true;

    const center = centerRef.current;
    if (!center) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 900;

    if (prefersReducedMotion) {
      gsap.set(center, {
        top: isMobile ? "14%" : "13.2%",
        left: isMobile ? "6%" : "15.2%",
        width: isMobile ? "88%" : "72.0%",
        height: isMobile ? "56%" : "70.2%",
        borderColor: "#ffffff",
      });
      if (titleGroupRef.current) {
        gsap.set(titleGroupRef.current, {
          x: isMobile ? "-13vw" : "-17.3vw",
          y: isMobile ? "-9vh" : "-16.8vh",
        });
      }
      if (headingRef.current) gsap.set(headingRef.current, { scale: isMobile ? 0.72 : 0.58, transformOrigin: "center center" });
      if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 0.95, y: 0 });
      const panels = [
        panelLeftRef.current,
        panelRightRef.current,
        panelTopLeftRef.current,
        panelTopMidRef.current,
        panelTopRightRef.current,
        panelBottomLeftRef.current,
        panelBottomMidRef.current,
        panelBottomRightRef.current,
      ].filter(Boolean);
      gsap.set(panels, { xPercent: 0, yPercent: 0, opacity: 1 });
      ScrollTrigger.refresh();
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        ScrollTrigger.refresh();
      },
    });

    autoRevealTlRef.current = tl;

    // A. Center panel shrinks from 100vw × 100vh down to mosaic bounds
    tl.to(
      center,
      {
        top: isMobile ? "14%" : "13.2%",
        left: isMobile ? "6%" : "15.2%",
        width: isMobile ? "88%" : "72.0%",
        height: isMobile ? "56%" : "70.2%",
        borderColor: "#ffffff",
        duration: 1.45,
        ease: "power2.inOut",
      },
      0
    );

    // B. Title group transitions smoothly from center to the top-left cloud
    if (titleGroupRef.current) {
      tl.to(
        titleGroupRef.current,
        {
          x: isMobile ? "-13vw" : "-17.3vw",
          y: isMobile ? "-9vh" : "-16.8vh",
          duration: 1.45,
          ease: "power2.inOut",
        },
        0
      );
    }

    // C. KERALA heading scales down into mosaic scale
    if (headingRef.current) {
      tl.to(
        headingRef.current,
        {
          scale: isMobile ? 0.72 : 0.58,
          transformOrigin: "center center",
          duration: 1.45,
          ease: "power2.inOut",
        },
        0
      );
    }

    // Subtitle "God's Own Country" fades in gracefully on the right slope
    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 15 },
        {
          opacity: 0.95,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
        },
        0.75
      );
    }

    // C. Surrounding panels slide into position from all four directions using fromTo
    // Left panel slides in from the left
    if (panelLeftRef.current) {
      tl.fromTo(
        panelLeftRef.current,
        { xPercent: -125, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1.15, ease: "power2.out" },
        0.18
      );
    }

    // Right panel slides in from the right
    if (panelRightRef.current) {
      tl.fromTo(
        panelRightRef.current,
        { xPercent: 125, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1.15, ease: "power2.out" },
        0.22
      );
    }

    // Top panels slide down from above
    if (panelTopLeftRef.current) {
      tl.fromTo(
        panelTopLeftRef.current,
        { yPercent: -125, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05, ease: "power2.out" },
        0.28
      );
    }

    if (panelTopMidRef.current) {
      tl.fromTo(
        panelTopMidRef.current,
        { yPercent: -125, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05, ease: "power2.out" },
        0.36
      );
    }

    if (panelTopRightRef.current) {
      tl.fromTo(
        panelTopRightRef.current,
        { yPercent: -125, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05, ease: "power2.out" },
        0.44
      );
    }

    // Bottom panels slide up from below
    if (panelBottomLeftRef.current) {
      tl.fromTo(
        panelBottomLeftRef.current,
        { yPercent: 125, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05, ease: "power2.out" },
        0.32
      );
    }

    if (panelBottomMidRef.current) {
      tl.fromTo(
        panelBottomMidRef.current,
        { yPercent: 125, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05, ease: "power2.out" },
        0.42
      );
    }

    if (panelBottomRightRef.current) {
      tl.fromTo(
        panelBottomRightRef.current,
        { yPercent: 125, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05, ease: "power2.out" },
        0.52
      );
    }
  }, []);

  // Listen for splash screen exit/completion to trigger auto-reveal
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if splash screen already completed
    const splashActive =
      document.documentElement.classList.contains("escora-splash-active") ||
      !!document.querySelector(".cinematic-splash-wrapper");

    if (!splashActive) {
      // No splash active — auto reveal after 2s interval matching user specification
      const t = setTimeout(() => {
        triggerAutoReveal();
      }, 2000);
      return () => clearTimeout(t);
    }

    // Splash screen is active — listen for completion events
    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    const handleSplashDone = () => {
      revealTimer = setTimeout(() => {
        triggerAutoReveal();
      }, 2000);
    };

    window.addEventListener("escora:splash-done", handleSplashDone);

    // Fallback: in case event was missed, trigger after max duration
    const fallbackTimer = setTimeout(() => {
      triggerAutoReveal();
    }, 5000);

    return () => {
      if (revealTimer) clearTimeout(revealTimer);
      clearTimeout(fallbackTimer);
      window.removeEventListener("escora:splash-done", handleSplashDone);
    };
  }, [triggerAutoReveal]);

  const scrollTlRef = useRef<gsap.core.Timeline | null>(null);

  const getOrCreateScrollTimeline = useCallback(() => {
    if (scrollTlRef.current) return scrollTlRef.current;

    const center = centerRef.current;
    const centerInner = centerInnerRef.current;
    if (!center || !centerInner) return null;

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 900;
    const animDuration = 0.85;

    const scrollTl = gsap.timeline({
      paused: true,
      defaults: { ease: "none" },
    });

    if (!isMobile) {
      // ── DESKTOP SCROLL COORDINATION ──
      // 1. Center Panel Shrinks into Central Position
      scrollTl.fromTo(
        center,
        {
          top: "13.2%",
          left: "15.2%",
          width: "72.0%",
          height: "70.2%",
        },
        {
          top: "29.0%",
          left: "26.25%",
          width: "47.5%",
          height: "42.0%",
          duration: animDuration,
          immediateRender: false,
        },
        0
      );

      // 2. Top Row Panels Expand Downward
      const topPanels = [
        panelTopLeftRef.current,
        panelTopMidRef.current,
        panelTopRightRef.current,
      ].filter(Boolean);
      topPanels.forEach((el) => {
        scrollTl.fromTo(
          el!,
          { height: "13.2%" },
          { height: "29.0%", duration: animDuration, immediateRender: false },
          0
        );
      });

      // 3. Left Panel Expands Rightward and Adjusts Top/Height
      if (panelLeftRef.current) {
        scrollTl.fromTo(
          panelLeftRef.current,
          {
            top: "13.2%",
            left: "0%",
            width: "15.2%",
            height: "70.2%",
          },
          {
            top: "29.0%",
            left: "0%",
            width: "26.25%",
            height: "42.0%",
            duration: animDuration,
            immediateRender: false,
          },
          0
        );
      }

      // 4. Right Panel Expands Leftward and Adjusts Top/Height
      if (panelRightRef.current) {
        scrollTl.fromTo(
          panelRightRef.current,
          {
            top: "13.2%",
            left: "87.2%",
            width: "12.8%",
            height: "86.8%",
          },
          {
            top: "29.0%",
            left: "73.75%",
            width: "26.25%",
            height: "71.0%",
            duration: animDuration,
            immediateRender: false,
          },
          0
        );
      }

      // 5. Bottom Row Panels Expand Upward and Scale Horizontally to Meet Right Panel
      if (panelBottomLeftRef.current) {
        scrollTl.fromTo(
          panelBottomLeftRef.current,
          {
            top: "83.4%",
            left: "0%",
            width: "54.2%",
            height: "16.6%",
          },
          {
            top: "71.0%",
            left: "0%",
            width: "45.84%",
            height: "29.0%",
            duration: animDuration,
            immediateRender: false,
          },
          0
        );
      }

      if (panelBottomMidRef.current) {
        scrollTl.fromTo(
          panelBottomMidRef.current,
          {
            top: "83.4%",
            left: "54.2%",
            width: "7.6%",
            height: "16.6%",
          },
          {
            top: "71.0%",
            left: "45.84%",
            width: "6.43%",
            height: "29.0%",
            duration: animDuration,
            immediateRender: false,
          },
          0
        );
      }

      if (panelBottomRightRef.current) {
        scrollTl.fromTo(
          panelBottomRightRef.current,
          {
            top: "83.4%",
            left: "61.8%",
            width: "25.4%",
            height: "16.6%",
          },
          {
            top: "71.0%",
            left: "52.27%",
            width: "21.48%",
            height: "29.0%",
            duration: animDuration,
            immediateRender: false,
          },
          0
        );
      }

      // 6. Scale and track titleGroup proportionally with the center panel
      if (titleGroupRef.current) {
        scrollTl.fromTo(
          titleGroupRef.current,
          { x: "-17.3vw", y: "-16.8vh" },
          { x: "-11.4vw", y: "-10.1vh", duration: animDuration, immediateRender: false },
          0
        );
      }
      if (headingRef.current) {
        scrollTl.fromTo(
          headingRef.current,
          { scale: 0.58, transformOrigin: "center center" },
          { scale: 0.42, transformOrigin: "center center", duration: animDuration, immediateRender: false },
          0
        );
      }
      if (subtitleRef.current) {
        scrollTl.fromTo(
          subtitleRef.current,
          { scale: 1, transformOrigin: "right center" },
          { scale: 0.75, transformOrigin: "right center", duration: animDuration, immediateRender: false },
          0
        );
      }
    } else {
      // ── MOBILE SCROLL COORDINATION (<= 900px) ──
      scrollTl.fromTo(
        center,
        {
          top: "14%",
          left: "6%",
          width: "88%",
          height: "56%",
        },
        {
          top: "21%",
          left: "17%",
          width: "66%",
          height: "42%",
          duration: animDuration,
          immediateRender: false,
        },
        0
      );

      const mobileTopPanels = [
        panelTopLeftRef.current,
        panelTopRightRef.current,
      ].filter(Boolean);
      mobileTopPanels.forEach((el) => {
        scrollTl.fromTo(
          el!,
          { height: "14%" },
          { height: "21%", duration: animDuration, immediateRender: false },
          0
        );
      });

      if (panelLeftRef.current) {
        scrollTl.fromTo(
          panelLeftRef.current,
          { top: "14%", left: "0%", width: "6%", height: "56%" },
          { top: "21%", left: "0%", width: "17%", height: "42%", duration: animDuration, immediateRender: false },
          0
        );
      }

      if (panelRightRef.current) {
        scrollTl.fromTo(
          panelRightRef.current,
          { top: "14%", left: "94%", width: "6%", height: "86%" },
          { top: "21%", left: "83%", width: "17%", height: "79%", duration: animDuration, immediateRender: false },
          0
        );
      }

      if (panelBottomLeftRef.current) {
        scrollTl.fromTo(
          panelBottomLeftRef.current,
          { top: "70%", left: "0%", width: "50%", height: "30%" },
          { top: "63%", left: "0%", width: "44.15%", height: "37%", duration: animDuration, immediateRender: false },
          0
        );
      }

      if (panelBottomRightRef.current) {
        scrollTl.fromTo(
          panelBottomRightRef.current,
          { top: "70%", left: "50%", width: "44%", height: "30%" },
          { top: "63%", left: "44.15%", width: "38.85%", height: "37%", duration: animDuration, immediateRender: false },
          0
        );
      }

      if (titleGroupRef.current) {
        scrollTl.fromTo(
          titleGroupRef.current,
          { x: "-13vw", y: "-9vh" },
          { x: "-9.7vw", y: "-6.7vh", duration: animDuration, immediateRender: false },
          0
        );
      }
      if (headingRef.current) {
        scrollTl.fromTo(
          headingRef.current,
          { scale: 0.72, transformOrigin: "center center" },
          { scale: 0.54, transformOrigin: "center center", duration: animDuration, immediateRender: false },
          0
        );
      }
      if (subtitleRef.current) {
        scrollTl.fromTo(
          subtitleRef.current,
          { scale: 1, transformOrigin: "right bottom" },
          { scale: 0.82, transformOrigin: "right bottom", duration: animDuration, immediateRender: false },
          0
        );
      }
    }

    // Center card inner subtle depth enhancement (box-shadow & border highlight)
    scrollTl.fromTo(
      centerInner,
      {
        boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        borderColor: "transparent",
      },
      {
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
        borderColor: "rgba(0, 0, 0, 0.08)",
        duration: animDuration,
        immediateRender: false,
      },
      0
    );

    // Buffer zone between 0.85 and 1.00: holds the mosaic firmly before unpinning
    scrollTl.to({}, { duration: 0.15 }, animDuration);

    scrollTlRef.current = scrollTl;
    return scrollTl;
  }, []);

  // 3. Scroll-Linked Coordinated Mosaic Contraction & Expansion: Center card shrinks and all 8 surrounding cards seamlessly expand to fill the area with zero black gaps
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    const center = centerRef.current;
    const centerInner = centerInnerRef.current;
    if (!container || !stage || !center || !centerInner) return;

    // Connect Lenis to ScrollTrigger
    const lenis = (window as any).__lenis;
    const handleLenisScroll = () => {
      ScrollTrigger.update();
    };
    if (lenis) {
      lenis.on("scroll", handleLenisScroll);
    }

    let ctx: gsap.Context | null = null;

    const setupScrollAnimation = () => {
      if (ctx) ctx.revert();
      if (scrollTlRef.current) {
        scrollTlRef.current.kill();
        scrollTlRef.current = null;
      }

      ctx = gsap.context(() => {
        const isMobile = window.innerWidth <= 900;
        const heroAnimDistance = isMobile ? window.innerHeight * 0.9 : window.innerHeight * 1.35;
        const stackDistance = window.innerHeight;
        const totalDistance = heroAnimDistance + stackDistance;

        // Pinned ScrollTrigger with smooth card stack handoff to next section
        ScrollTrigger.create({
          trigger: container,
          start: "top top",
          end: `+=${totalDistance}`,
          pin: stage,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!isAutoRevealedRef.current && self.progress > 0.001) {
              triggerAutoReveal();
              autoRevealTlRef.current?.progress(1);
            }
            if (isAutoRevealedRef.current) {
              const tl = getOrCreateScrollTimeline();
              if (tl) {
                const animRatio = heroAnimDistance / totalDistance;
                const animProgress = Math.min(1, self.progress / animRatio);
                tl.progress(animProgress);
              }
            }
          },
        });
      }, container);
    };

    setupScrollAnimation();

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      if (Math.abs(window.innerWidth - lastWidth) > 50) {
        lastWidth = window.innerWidth;
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          setupScrollAnimation();
          if (isAutoRevealedRef.current) {
            getOrCreateScrollTimeline();
          }
          ScrollTrigger.refresh();
        }, 150);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      if (lenis) {
        lenis.off("scroll", handleLenisScroll);
      }
      window.removeEventListener("resize", handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (scrollTlRef.current) {
        scrollTlRef.current.kill();
        scrollTlRef.current = null;
      }
      if (ctx) ctx.revert();
    };
  }, [triggerAutoReveal, getOrCreateScrollTimeline]);

  return (
    <div className="esh-scroll-container" ref={containerRef} id="hero">
      <header
        className="esh-pinned-stage"
        ref={stageRef}
        aria-label="Escora Holidays Kerala Cinematic Showcase"
      >
        {/* ── Top Row (3 panels) ── */}
        <div className="esh-panel esh-panel-top-left" ref={panelTopLeftRef} aria-hidden="true">
          <img
            src="/assets/herobg/4-Alleppy.png"
            alt="Alleppey backwaters coconut groves"
            className="esh-panel-img"
            loading="eager"
          />
        </div>

        <div className="esh-panel esh-panel-top-mid" ref={panelTopMidRef} aria-hidden="true">
          <img
            src="/assets/herobg/5-idukky.png"
            alt="Idukki cloud-piercing mountain pinnacle"
            className="esh-panel-img"
            loading="eager"
          />
        </div>

        <div className="esh-panel esh-panel-top-right" ref={panelTopRightRef} aria-hidden="true">
          <img
            src={kovalamCleanBadge}
            alt="Kovalam coastline beach Kerala"
            className="esh-panel-img"
            loading="eager"
          />
        </div>

        {/* ── Left Column (1 tall panel) ── */}
        <div className="esh-panel esh-panel-left" ref={panelLeftRef} aria-hidden="true">
          <img
            src="/assets/herobg/6-idukky.png"
            alt="Idukki monolithic misty mountain ridge"
            className="esh-panel-img"
            loading="eager"
          />
        </div>

        {/* ── Center Landscape (Main Hero Card) ── */}
        <div className="esh-panel esh-panel-center" ref={centerRef}>
          <div className="esh-center-inner" ref={centerInnerRef}>
            <img
              src="/assets/herobg/1-munnar.png"
              alt="Munnar rolling green tea plantations in Kerala"
              className="esh-panel-img esh-center-img"
              loading="eager"
              fetchPriority="high"
            />
            <div className="esh-center-content">
              <div className="esh-hero-title-group" ref={titleGroupRef}>
                <h1 className="esh-mosaic-title text-white" ref={headingRef} aria-label="Kerala">
                  {KERALA_LETTERS.map((char, idx) => (
                    <span
                      key={idx}
                      className="esh-mosaic-char text-white"
                      ref={(el) => {
                        lettersRef.current[idx] = el;
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </h1>
              </div>

              {/* Editorial Subtitle placed on the scenic right slope */}
              <p className="esh-mosaic-subtitle text-white" ref={subtitleRef}>
                God&apos;s Own Country
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Column (1 tall panel spanning middle to bottom) ── */}
        <div className="esh-panel esh-panel-right" ref={panelRightRef} aria-hidden="true">
          <img
            src={wayanadBadge}
            alt="Wayanad rainforest canopy and Western Ghats overpass"
            className="esh-panel-img"
            loading="eager"
          />
        </div>

        {/* ── Bottom Row (3 panels) ── */}
        <div className="esh-panel esh-panel-bottom-left" ref={panelBottomLeftRef} aria-hidden="true">
          <img
            src="/assets/herobg/3-Alleppy.png"
            alt="Alleppey traditional kettuvallam houseboat"
            className="esh-panel-img"
            loading="eager"
          />
        </div>

        <div className="esh-panel esh-panel-bottom-mid" ref={panelBottomMidRef} aria-hidden="true">
          <img
            src={fortKochiBadge}
            alt="Fort Kochi heritage architecture"
            className="esh-panel-img"
            loading="eager"
          />
        </div>

        <div className="esh-panel esh-panel-bottom-right" ref={panelBottomRightRef} aria-hidden="true">
          <img
            src={bekalBadge}
            alt="Bekal fort coastal ramparts and ocean"
            className="esh-panel-img"
            loading="eager"
          />
        </div>
      </header>
    </div>
  );
}
