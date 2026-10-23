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
    React.ReactNode, // 0: Why Escora
    React.ReactNode, // 1: Travel by Type
    React.ReactNode, // 2: 3D Destination Explorer
    React.ReactNode, // 3: From Your Idea To Kerala
    React.ReactNode, // 4: Escora Retreat
    React.ReactNode, // 5: Traveller Testimonials
    React.ReactNode  // 6: Escora Contact Card
  ];
}

export const PINNED_SLIDE_CONFIGS = [
  { id: "why-escora", label: "01 · Why Escora", bg: "#FAF8F5" },
  { id: "categories", label: "02 · Travel by Type", bg: "#FFFFFF" },
  { id: "explore-kerala", label: "03 · Explore Kerala", bg: "#FAF8F5" },
  { id: "how-it-works", label: "04 · How It Works", bg: "#FAF6EE" },
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
  const isAnimatingRef = useRef<boolean>(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Smooth slide navigation helper
  const goToSlide = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= totalSlides) return;
    const st = scrollTriggerRef.current;
    if (!st) return;

    isAnimatingRef.current = true;
    currentSlideRef.current = targetIndex;
    setActiveSlide(targetIndex);

    slidesRef.current.forEach((s, sIdx) => {
      if (!s) return;
      if (sIdx === targetIndex) {
        s.classList.add("is-active");
      } else {
        s.classList.remove("is-active", "is-initial-active");
      }
    });

    const targetProgress = targetIndex / totalSteps;
    const targetScrollY = st.start + targetProgress * (st.end - st.start);

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, 1100);

    if (window.__lenis) {
      window.__lenis.scrollTo(targetScrollY, {
        duration: 0.85,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        onComplete: () => {
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 60);
        },
      });
    } else {
      window.scrollTo({
        top: targetScrollY,
        behavior: "smooth",
      });
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 750);
    }
  }, [totalSlides, totalSteps]);

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
        gsap.set(targetEls, { opacity: 0, y: 60 });
      } else {
        gsap.set(targetEls, { opacity: 0 });
      }
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

      const stepStart = i; // 1 unit duration per step
      const nextBgColor = PINNED_SLIDE_CONFIGS[i + 1].bg;

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
            y: -35,
            opacity: 0,
            stagger: 0.04,
            duration: 0.45,
            ease: "power2.in",
          },
          stepStart
        );
      } else {
        tl.fromTo(
          exitElements,
          { opacity: 1 },
          {
            opacity: 0,
            duration: 0.35,
          },
          stepStart
        );
      }

      // 2. Smooth background transition
      tl.to(
        bg,
        {
          backgroundColor: nextBgColor,
          duration: 0.5,
          ease: "power1.inOut",
        },
        stepStart + 0.2
      );

      // 3. Pointer events & visibility handoff at midpoint
      tl.set(
        currentSlideEl,
        { pointerEvents: "none", visibility: "hidden", opacity: 0 },
        stepStart + 0.45
      );
      tl.set(
        nextSlideEl,
        { pointerEvents: "auto", visibility: "visible", opacity: 1 },
        stepStart + 0.45
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
        stepStart + 0.45
      );

      // 4. Next slide elements reveal from bottom (staggered bottom-to-top)
      if (!prefersReducedMotion) {
        tl.fromTo(
          enterElements,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.05,
            duration: 0.55,
            ease: "power2.out",
          },
          stepStart + 0.45
        );
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

    // Bind Timeline to GSAP ScrollTrigger
    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: () => `+=${totalSteps * window.innerHeight}`,
      pin: true,
      pinSpacing: true,
      animation: tl,
      scrub: 0.65, // Responsive smooth scrub
      snap: {
        snapTo: 1 / totalSteps,
        duration: { min: 0.35, max: 0.75 },
        delay: 0.04,
        ease: "power2.inOut",
      },
      onUpdate: (self) => {
        const rawIdx = Math.round(self.progress * totalSteps);
        const clampedIdx = Math.max(0, Math.min(totalSlides - 1, rawIdx));
        if (!isAnimatingRef.current) {
          currentSlideRef.current = clampedIdx;
          setActiveSlide(clampedIdx);
        }
        slides.forEach((s, sIdx) => {
          if (!s) return;
          if (sIdx === clampedIdx) {
            s.classList.add("is-active");
          } else {
            s.classList.remove("is-active", "is-initial-active");
          }
        });
      },
    });

    scrollTriggerRef.current = st;

    // ─── Scroll Hijacking / Step Snapping (Mouse Wheel) ───
    const handleWheel = (e: WheelEvent) => {
      if (!st.isActive) return;

      // If transition is already in motion, absorb extra wheel ticks
      if (isAnimatingRef.current) {
        e.preventDefault();
        return;
      }

      // Ignore micro jitters (< 24px)
      if (Math.abs(e.deltaY) < 24) return;

      if (e.deltaY > 0) {
        // Forward Scroll (Down)
        if (currentSlideRef.current < totalSlides - 1) {
          e.preventDefault();
          goToSlide(currentSlideRef.current + 1);
        } else {
          // On last slide (Contact Card): Allow natural scroll to proceed into the Footer!
        }
      } else if (e.deltaY < 0) {
        // Backward Scroll (Up)
        if (currentSlideRef.current > 0) {
          e.preventDefault();
          goToSlide(currentSlideRef.current - 1);
        } else {
          // On first slide (Why Escora): Allow natural scroll to proceed up to the Hero!
        }
      }
    };

    // ─── Touch Swiping for Mobile & Tablets ───
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY || 0;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!st.isActive) return;
      if (isAnimatingRef.current) return;

      const touchEndY = e.changedTouches[0]?.clientY || 0;
      const deltaY = touchStartY - touchEndY;

      if (Math.abs(deltaY) > 42) {
        if (deltaY > 0 && currentSlideRef.current < totalSlides - 1) {
          // Swiped up -> Advance to next slide
          goToSlide(currentSlideRef.current + 1);
        } else if (deltaY < 0 && currentSlideRef.current > 0) {
          // Swiped down -> Go to previous slide
          goToSlide(currentSlideRef.current - 1);
        }
      }
    };

    // ─── Keyboard Navigation (Arrow Keys / Page Keys) ───
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!st.isActive) return;
      const targetTag = (document.activeElement?.tagName || "").toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") return;

      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        if (currentSlideRef.current < totalSlides - 1) {
          e.preventDefault();
          goToSlide(currentSlideRef.current + 1);
        }
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        if (currentSlideRef.current > 0) {
          e.preventDefault();
          goToSlide(currentSlideRef.current - 1);
        }
      }
    };

    // Attach listeners
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    // Refresh ScrollTrigger to ensure accurate layout calculation
    ScrollTrigger.refresh();

    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (lenis) {
        lenis.off("scroll", handleLenisScroll);
      }
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
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
