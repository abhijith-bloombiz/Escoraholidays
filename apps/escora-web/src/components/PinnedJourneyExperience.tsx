import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./PinnedJourneyExperience.css";

// Register ScrollTrigger once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface PinnedJourneyExperienceProps {
  children: [
    React.ReactNode, // 0: Travel by Type
    React.ReactNode, // 1: 3D Destination Explorer
    React.ReactNode, // 2: From Your Idea To Kerala (How It Works)
    React.ReactNode, // 3: Why Escora
    React.ReactNode, // 4: Escora Retreat
    React.ReactNode, // 5: Traveller Testimonials
    React.ReactNode  // 6: Escora Contact Card
  ];
}

export const PINNED_SLIDE_CONFIGS = [
  { id: "categories", label: "01 · Travel by Type", bg: "#FFFFFF" },
  { id: "explore-kerala", label: "02 · Explore Kerala", bg: "#FAF8F5" },
  { id: "how-it-works", label: "03 · How It Works", bg: "#FAF6EE" },
  { id: "why-escora", label: "04 · Why Escora", bg: "#FAF8F5" },
  { id: "retreat", label: "05 · Escora Retreat", bg: "#FBF8F2" },
  { id: "testimonials", label: "06 · Traveller Stories", bg: "#FAF7F0" },
  { id: "contact", label: "07 · Plan Journey", bg: "#FFFFFF" },
];

declare global {
  interface Window {
    __pinnedJourney?: {
      goToSlide: (index: number) => void;
      getActiveSlide: () => number;
    };
  }
}

export default function PinnedJourneyExperience({ children }: PinnedJourneyExperienceProps) {
  const totalSlides = PINNED_SLIDE_CONFIGS.length;
  const totalSteps = totalSlides - 1;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const currentSlideRef = useRef<number>(0);
  const targetSlideRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const isCooldownRef = useRef<boolean>(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTweenRef = useRef<gsap.core.Tween | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const playCoverflowRevealRef = useRef<(() => void) | null>(null);

  // Transition executor that guarantees sequential, one-by-one, reversible transitions
  const performStepTransition = useCallback((toIndex: number, userDirection?: number) => {
    const clampedIndex = Math.max(0, Math.min(totalSlides - 1, toIndex));
    const fromIndex = currentSlideRef.current;
    if (clampedIndex === fromIndex && !isTransitioningRef.current) return;

    const st = scrollTriggerRef.current;
    const tl = timelineRef.current;
    if (!tl) return;

    targetSlideRef.current = clampedIndex;
    isTransitioningRef.current = true;

    // Add is-transitioning class to suppress competing CSS transitions during active timeline playback
    if (wrapperRef.current) {
      wrapperRef.current.classList.add("is-transitioning");
    }

    // Calculate exact target scroll coordinate corresponding to this section
    const targetScrollY = st ? st.start + clampedIndex * window.innerHeight : 0;
    const stepDiff = Math.abs(clampedIndex - tl.time());
    const duration = stepDiff <= 1 ? 1.15 : Math.min(1.55, 0.95 + stepDiff * 0.2);

    if (transitionTweenRef.current) {
      transitionTweenRef.current.kill();
    }

    // Ensure participating slides are visible in DOM during transition
    const minIdx = Math.min(fromIndex, clampedIndex);
    const maxIdx = Math.max(fromIndex, clampedIndex);
    slidesRef.current.forEach((s, sIdx) => {
      if (!s) return;
      if (sIdx >= minIdx && sIdx <= maxIdx) {
        gsap.set(s, { visibility: "visible", opacity: 1, pointerEvents: "none" });
      }
    });

    transitionTweenRef.current = gsap.to(tl, {
      time: clampedIndex,
      duration,
      ease: "power2.inOut",
      overwrite: "auto",
      onUpdate: () => {
        const curTime = tl.time();
        const activeIdx = Math.max(0, Math.min(totalSlides - 1, Math.round(curTime)));
        setActiveSlide(activeIdx);
      },
      onComplete: () => {
        currentSlideRef.current = clampedIndex;
        targetSlideRef.current = clampedIndex;
        setActiveSlide(clampedIndex);
        isTransitioningRef.current = false;

        if (wrapperRef.current) {
          wrapperRef.current.classList.remove("is-transitioning");
        }

        // Settle state: only active slide is visible & accepts pointer events
        slidesRef.current.forEach((s, sIdx) => {
          if (!s) return;
          if (sIdx === clampedIndex) {
            s.classList.add("is-active");
            gsap.set(s, { pointerEvents: "auto", visibility: "visible", opacity: 1 });
          } else {
            s.classList.remove("is-active", "is-initial-active");
            gsap.set(s, { pointerEvents: "none", visibility: "hidden", opacity: 0 });
          }
        });

        if (clampedIndex === 0) {
          const coverflowWrap = wrapperRef.current?.querySelector<HTMLElement>(".travel-type-coverflow-wrap");
          if (coverflowWrap) {
            gsap.set(coverflowWrap, {
              "--tt-reveal-center": 1,
              "--tt-reveal-inner": 1,
              "--tt-reveal-outer": 1,
              "--tt-reveal-ui": 1,
            });
          }
        }

        // 220ms cooldown to discard trailing inertia wheel ticks from trackpads
        isCooldownRef.current = true;
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          isCooldownRef.current = false;
        }, 220);
      },
    });

    // Synchronize page scroll smoothly with Lenis or native scrollTo
    if (st) {
      if (window.__lenis) {
        window.__lenis.scrollTo(targetScrollY, {
          duration,
          easing: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          immediate: false,
        });
      } else {
        window.scrollTo({
          top: targetScrollY,
          behavior: "smooth",
        });
      }
    }
  }, [totalSlides]);

  // Smooth slide navigation helper (public API for navbar / indicators)
  const goToSlide = useCallback((targetIndex: number) => {
    performStepTransition(targetIndex);
  }, [performStepTransition]);

  // Expose helper globally for navbar anchor clicks (e.g. #contact, #categories)
  useEffect(() => {
    window.__pinnedJourney = {
      goToSlide,
      getActiveSlide: () => currentSlideRef.current,
    };
    return () => {
      delete window.__pinnedJourney;
    };
  }, [goToSlide]);

  // Setup GSAP Timeline and ScrollTrigger pinning
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    const bg = bgRef.current;
    const slides = slidesRef.current;

    if (!wrapper || !stage || !bg) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Connect Lenis to ScrollTrigger so GSAP gets immediate updates on smooth scrolls
    const lenis = window.__lenis;
    const handleLenisScroll = () => {
      ScrollTrigger.update();
    };
    if (lenis) {
      lenis.on("scroll", handleLenisScroll);
    }

    // Set initial background color to match Slide 0
    gsap.set(bg, { backgroundColor: PINNED_SLIDE_CONFIGS[0]?.bg || "#FFFFFF" });

    // Initial setup for slides: Slide 0 is visible, all others hidden
    slides.forEach((slide, idx) => {
      if (!slide) return;
      if (idx === 0) {
        slide.classList.add("is-active", "is-initial-active");
        gsap.set(slide, { opacity: 1, visibility: "visible", pointerEvents: "auto" });
      } else {
        slide.classList.remove("is-active", "is-initial-active");
        gsap.set(slide, { opacity: 0, visibility: "hidden", pointerEvents: "none" });
      }
    });

    // Explicitly ensure Slide 0 reveal elements are visible at natural position
    const slide0Elements = Array.from(
      slides[0]?.querySelectorAll<HTMLElement>("[data-pinned-reveal]") || []
    );
    if (slide0Elements.length > 0) {
      gsap.set(slide0Elements, { opacity: 1, y: 0, clearProps: "transform" });
    }

    // Explicitly set slides 1..totalSteps reveal elements hidden below
    for (let idx = 1; idx < totalSlides; idx++) {
      const slideEl = slides[idx];
      if (!slideEl) continue;
      const revealElements = Array.from(
        slideEl.querySelectorAll<HTMLElement>("[data-pinned-reveal]")
      );
      const targetEls = revealElements.length > 0 ? revealElements : [slideEl];
      if (!prefersReducedMotion) {
        gsap.set(targetEls, { opacity: 0, y: 35 });
      } else {
        gsap.set(targetEls, { opacity: 0 });
      }
    }

    // Component-specific reveal elements:
    const coverflowWrap = wrapper.querySelector<HTMLElement>(".travel-type-coverflow-wrap");

    // Initialize Travel by Type cards fully revealed so Slide 0 is pristine on mount and hero scroll
    if (coverflowWrap) {
      gsap.set(coverflowWrap, {
        "--tt-reveal-center": 1,
        "--tt-reveal-inner": 1,
        "--tt-reveal-outer": 1,
        "--tt-reveal-ui": 1,
      });
    }

    // Initialize 3D Map reveal state (hidden initially if slide 0 is not explore-kerala)
    if (typeof window !== "undefined" && window.__kerala3DMap) {
      window.__kerala3DMap.setRevealProgress(PINNED_SLIDE_CONFIGS[0]?.id === "explore-kerala" ? 1 : 0);
    }

    // Initialize Testimonials Carousel reveal CSS variables
    const testiWrap = wrapper.querySelector<HTMLElement>(".testi-carousel-wrapper");
    const isTestimonialsFirst = PINNED_SLIDE_CONFIGS[0]?.id === "testimonials";
    if (testiWrap && !prefersReducedMotion) {
      gsap.set(testiWrap, {
        "--testi-reveal-center": isTestimonialsFirst ? 1 : 0,
        "--testi-reveal-sides": isTestimonialsFirst ? 1 : 0,
        "--testi-reveal-ui": isTestimonialsFirst ? 1 : 0,
      });
    }

    // Create Master Timeline linked to ScrollTrigger with smooth scrub & snap
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.inOut" },
    });

    timelineRef.current = tl;

    // Build step transitions between consecutive slides
    for (let i = 0; i < totalSteps; i++) {
      const currentSlideEl = slides[i];
      const nextSlideEl = slides[i + 1];
      if (!currentSlideEl || !nextSlideEl) continue;

      const currentConfig = PINNED_SLIDE_CONFIGS[i];
      const nextConfig = PINNED_SLIDE_CONFIGS[i + 1];
      const stepStart = i; // 1 unit duration per step
      const nextBgColor = nextConfig.bg;

      // Select elements inside current slide for exit animation (reverse stagger)
      const currentElements = Array.from(
        currentSlideEl.querySelectorAll<HTMLElement>("[data-pinned-reveal]")
      );
      const exitElements = currentElements.length > 0 ? [...currentElements].reverse() : [currentSlideEl];

      // Select elements inside next slide for enter animation (bottom-to-top stagger)
      const nextElements = Array.from(
        nextSlideEl.querySelectorAll<HTMLElement>("[data-pinned-reveal]")
      );
      const enterElements = nextElements.length > 0 ? nextElements : [nextSlideEl];

      // 1. Current slide elements exit (reverse reveal)
      if (!prefersReducedMotion) {
        tl.fromTo(
          exitElements,
          { y: 0, opacity: 1 },
          {
            y: -28,
            opacity: 0,
            stagger: 0.04,
            duration: 0.44,
            ease: "power2.inOut",
          },
          stepStart
        );

        // Exiting Travel by Type: Gracefully fold coverflow cards with comfortable easing
        if (currentConfig.id === "categories" && coverflowWrap) {
          tl.fromTo(
            coverflowWrap,
            { "--tt-reveal-ui": 1 },
            { "--tt-reveal-ui": 0, duration: 0.28, ease: "power2.inOut", immediateRender: false },
            stepStart
          );
          tl.fromTo(
            coverflowWrap,
            { "--tt-reveal-outer": 1 },
            { "--tt-reveal-outer": 0, duration: 0.35, ease: "power2.inOut", immediateRender: false },
            stepStart + 0.04
          );
          tl.fromTo(
            coverflowWrap,
            { "--tt-reveal-inner": 1 },
            { "--tt-reveal-inner": 0, duration: 0.38, ease: "power2.inOut", immediateRender: false },
            stepStart + 0.08
          );
          tl.fromTo(
            coverflowWrap,
            { "--tt-reveal-center": 1 },
            { "--tt-reveal-center": 0, duration: 0.40, ease: "power2.inOut", immediateRender: false },
            stepStart + 0.10
          );
        }

        // Exiting 3D Map: Fold 3D Map & Palm Tree back up
        if (currentConfig.id === "explore-kerala") {
          const mapExitProxy = { progress: 1 };
          tl.fromTo(
            mapExitProxy,
            { progress: 1 },
            {
              progress: 0,
              duration: 0.42,
              ease: "power2.inOut",
              onUpdate: () => {
                if (typeof window !== "undefined" && window.__kerala3DMap) {
                  window.__kerala3DMap.setRevealProgress(mapExitProxy.progress);
                }
              },
            },
            stepStart
          );
        }

        // Exiting Testimonials: Fold side cards away and collapse center card smoothly
        if (currentConfig.id === "testimonials" && testiWrap) {
          tl.fromTo(
            testiWrap,
            { "--testi-reveal-ui": 1 },
            { "--testi-reveal-ui": 0, duration: 0.28, ease: "power2.inOut" },
            stepStart
          );
          tl.fromTo(
            testiWrap,
            { "--testi-reveal-sides": 1 },
            { "--testi-reveal-sides": 0, duration: 0.36, ease: "power2.inOut" },
            stepStart + 0.05
          );
          tl.fromTo(
            testiWrap,
            { "--testi-reveal-center": 1 },
            { "--testi-reveal-center": 0, duration: 0.40, ease: "power2.inOut" },
            stepStart + 0.08
          );
        }
      } else {
        tl.fromTo(
          exitElements,
          { opacity: 1 },
          {
            opacity: 0,
            duration: 0.40,
          },
          stepStart
        );
      }

      // 2. Smooth background transition
      tl.to(
        bg,
        {
          backgroundColor: nextBgColor,
          duration: 0.58,
          ease: "power1.inOut",
        },
        stepStart + 0.22
      );

      // 3. Pointer events & visibility handoff at midpoint
      tl.set(
        nextSlideEl,
        { pointerEvents: "auto", visibility: "visible", opacity: 1 },
        stepStart + 0.46
      );
      tl.set(
        currentSlideEl,
        { pointerEvents: "none", visibility: "hidden", opacity: 0 },
        stepStart + 0.48
      );
      tl.call(
        () => {
          slides.forEach((s, sIdx) => {
            if (!s) return;
            if (sIdx === i + 1) {
              s.classList.add("is-active");
            } else {
              s.classList.remove("is-active", "is-initial-active");
            }
          });
        },
        undefined,
        stepStart + 0.47
      );

      // 4. Next slide elements reveal from bottom (smooth bottom-to-top cascade)
      if (!prefersReducedMotion) {
        tl.fromTo(
          enterElements,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.055,
            duration: 0.52,
            ease: "power2.out",
          },
          stepStart + 0.46
        );

        // Entering 3D Map: Reveal 3D Map cascade from North to South & Draw Palm Tree
        if (nextConfig.id === "explore-kerala") {
          const mapEnterProxy = { progress: 0 };
          tl.fromTo(
            mapEnterProxy,
            { progress: 0 },
            {
              progress: 1,
              duration: 0.52,
              ease: "power2.out",
              onUpdate: () => {
                if (typeof window !== "undefined" && window.__kerala3DMap) {
                  window.__kerala3DMap.setRevealProgress(mapEnterProxy.progress);
                }
              },
            },
            stepStart + 0.46
          );
        }

        // Entering Testimonials: Center card expands, side cards fan out, pagination fades in
        if (nextConfig.id === "testimonials" && testiWrap) {
          tl.fromTo(
            testiWrap,
            { "--testi-reveal-center": 0 },
            { "--testi-reveal-center": 1, duration: 0.42, ease: "power2.out" },
            stepStart + 0.46
          );
          tl.fromTo(
            testiWrap,
            { "--testi-reveal-sides": 0 },
            { "--testi-reveal-sides": 1, duration: 0.46, ease: "power2.out" },
            stepStart + 0.52
          );
          tl.fromTo(
            testiWrap,
            { "--testi-reveal-ui": 0 },
            { "--testi-reveal-ui": 1, duration: 0.35, ease: "power2.out" },
            stepStart + 0.62
          );
        }
      } else {
        tl.fromTo(
          enterElements,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.35,
          },
          stepStart + 0.45
        );
      }
    }

    // 1. ScrollTrigger solely pins the stage container (no scrub or snap interference)
    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: () => `+=${totalSteps * window.innerHeight}`,
      pin: true,
      pinSpacing: true,
      onUpdate: (self) => {
        // Handle native scrollbar thumb dragging
        if (!isTransitioningRef.current) {
          const expectedIndex = Math.max(0, Math.min(totalSlides - 1, Math.round(self.progress * totalSteps)));
          if (expectedIndex !== currentSlideRef.current) {
            performStepTransition(expectedIndex);
          }
        }
      },
    });

    scrollTriggerRef.current = st;

    // Check initial scroll on mount
    const initialScroll = window.__lenis?.scroll ?? window.scrollY;
    if (st && initialScroll >= st.start && initialScroll <= st.end) {
      const initialIdx = Math.max(0, Math.min(totalSlides - 1, Math.round((initialScroll - st.start) / window.innerHeight)));
      currentSlideRef.current = initialIdx;
      targetSlideRef.current = initialIdx;
      setActiveSlide(initialIdx);
      tl.time(initialIdx);
      slides.forEach((s, sIdx) => {
        if (!s) return;
        if (sIdx === initialIdx) {
          s.classList.add("is-active");
          gsap.set(s, { pointerEvents: "auto", visibility: "visible", opacity: 1 });
        } else {
          s.classList.remove("is-active", "is-initial-active");
          gsap.set(s, { pointerEvents: "none", visibility: "hidden", opacity: 0 });
        }
      });
    }

    // ─── Precision Sequential Wheel Handling (Mouse Wheel & Trackpad) ───
    const handleWheel = (e: WheelEvent) => {
      if (!st) return;

      const scrollY = window.__lenis?.scroll ?? window.scrollY;
      const isInside = scrollY >= st.start - 8 && scrollY <= st.end + 8;
      if (!isInside) return;

      // Ignore micro jitters (< 14px)
      if (Math.abs(e.deltaY) < 14) return;

      if (e.deltaY > 0) {
        // Forward Scroll (Down)
        if (currentSlideRef.current === totalSlides - 1) {
          // On last slide (Contact Card): Allow natural scroll to proceed into the Footer!
          return;
        }

        // Inside pinned journey: control forward transition strictly one slide at a time
        e.preventDefault();

        if (isTransitioningRef.current || isCooldownRef.current) {
          // Absorb excess rapid wheel ticks so sections are never skipped!
          return;
        }

        performStepTransition(currentSlideRef.current + 1, 1);
      } else if (e.deltaY < 0) {
        // Backward Scroll (Up)
        if (currentSlideRef.current === 0) {
          // On first slide (Travel by Type): Allow natural scroll to proceed up to the Hero!
          return;
        }

        // Inside pinned journey: control backward transition strictly one slide at a time
        e.preventDefault();

        if (isTransitioningRef.current) {
          // Mid-transition direction reversal: if was moving forward, reverse back smoothly!
          if (targetSlideRef.current > currentSlideRef.current) {
            performStepTransition(currentSlideRef.current, -1);
          }
          return;
        }

        if (isCooldownRef.current) {
          return;
        }

        performStepTransition(currentSlideRef.current - 1, -1);
      }
    };

    // ─── Touch Swiping for Mobile & Tablets ───
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY || 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!st) return;
      const scrollY = window.__lenis?.scroll ?? window.scrollY;
      const isInside = scrollY >= st.start - 8 && scrollY <= st.end + 8;
      if (!isInside) return;

      const currentY = e.touches[0]?.clientY || 0;
      const deltaY = touchStartY - currentY; // > 0 means swiping up (scrolling forward)

      // Allow natural swipe to exit to Hero or Footer at boundaries
      if (deltaY < 0 && currentSlideRef.current === 0) return;
      if (deltaY > 0 && currentSlideRef.current === totalSlides - 1) return;

      if (Math.abs(deltaY) > 8) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!st) return;
      const scrollY = window.__lenis?.scroll ?? window.scrollY;
      const isInside = scrollY >= st.start - 8 && scrollY <= st.end + 8;
      if (!isInside) return;

      const touchEndY = e.changedTouches[0]?.clientY || 0;
      const deltaY = touchStartY - touchEndY;

      if (Math.abs(deltaY) < 32) return;

      if (deltaY > 0) {
        // Swiped up -> Advance strictly 1 slide
        if (currentSlideRef.current === totalSlides - 1) return;
        if (isTransitioningRef.current || isCooldownRef.current) return;
        performStepTransition(currentSlideRef.current + 1, 1);
      } else {
        // Swiped down -> Go back strictly 1 slide
        if (currentSlideRef.current === 0) return;
        if (isTransitioningRef.current) {
          if (targetSlideRef.current > currentSlideRef.current) {
            performStepTransition(currentSlideRef.current, -1);
          }
          return;
        }
        if (isCooldownRef.current) return;
        performStepTransition(currentSlideRef.current - 1, -1);
      }
    };

    // ─── Keyboard Navigation (Arrow Keys / Page Keys) ───
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!st) return;
      const scrollY = window.__lenis?.scroll ?? window.scrollY;
      const isInside = scrollY >= st.start - 8 && scrollY <= st.end + 8;
      if (!isInside) return;

      const targetTag = (document.activeElement?.tagName || "").toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") return;

      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        if (currentSlideRef.current < totalSlides - 1) {
          e.preventDefault();
          if (!isTransitioningRef.current && !isCooldownRef.current) {
            performStepTransition(currentSlideRef.current + 1, 1);
          }
        }
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        if (currentSlideRef.current > 0) {
          e.preventDefault();
          if (isTransitioningRef.current && targetSlideRef.current > currentSlideRef.current) {
            performStepTransition(currentSlideRef.current, -1);
          } else if (!isTransitioningRef.current && !isCooldownRef.current) {
            performStepTransition(currentSlideRef.current - 1, -1);
          }
        }
      }
    };

    // Attach listeners
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    // Refresh ScrollTrigger to ensure accurate layout calculation
    ScrollTrigger.refresh();

    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (transitionTweenRef.current) transitionTweenRef.current.kill();
      if (lenis) {
        lenis.off("scroll", handleLenisScroll);
      }

      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      st.kill();
      tl.kill();
    };
  }, [totalSteps, totalSlides, goToSlide]);

  return (
    <div ref={wrapperRef} className="pinned-journey-wrapper" id="pinned-journey-experience">
      {/* Pinned Viewport Stage */}
      <div
        ref={stageRef}
        className={`pinned-journey-stage${activeSlide === totalSlides - 1 ? " is-last-slide" : ""}`}
      >
        {/* Dynamic Background Crossfade Layer */}
        <div ref={bgRef} className="pinned-journey-bg" />
        <div className="pinned-journey-ambient-glow" />

        {/* Stacked Slides Container */}
        <div className="pinned-journey-slides-container">
          {children.map((child, idx) => (
            <div
              key={PINNED_SLIDE_CONFIGS[idx]?.id || idx}
              ref={(el) => {
                slidesRef.current[idx] = el;
              }}
              className={`pinned-journey-slide slide-${PINNED_SLIDE_CONFIGS[idx]?.id}${
                activeSlide === idx ? " is-active" : ""
              }${idx === 0 ? " is-initial-active" : ""}`}
              data-slide-index={idx}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
