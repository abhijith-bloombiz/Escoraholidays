import { useEffect, useRef } from "react";

export const DEFAULT_HOMEPAGE_SECTIONS = [
  "hero",
  "the-escora-way",
  "categories",
  "explore-kerala",
  "dest-360",
  "why-escora",
  "how-it-works",
  "retreat",
  "testimonials",
  "contact",
];

export interface SectionSnapAssistOptions {
  /** Section element IDs in DOM sequence to assist snapping between */
  targetIds?: string[];
  /** Progress threshold within section to engage boundary snap (0.90 = 90%) */
  snapThreshold?: number;
  /** Duration of the snap animation in seconds (1.1s - 1.4s) */
  duration?: number;
  /** Easing function for the snap animation: gentle, continuous ease-out */
  easing?: (t: number) => number;
}

interface SectionMetric {
  id: string;
  top: number;
  height: number;
  bottom: number;
}

/**
 * Fluid, gentle ease-out curve:
 * Decelerates continuously from user's current scroll momentum into the section boundary.
 * Starts with moderate initial speed that matches normal scroll, then smoothly glides
 * to rest at velocity 0 with zero jerk or abrupt stop.
 */
export const DEFAULT_SNAP_EASING = (t: number): number => 1 - Math.pow(1 - t, 3.4);

/** Graceful 1.2s duration for a silky, quiet luxury glide into the section boundary */
export const DEFAULT_SNAP_DURATION = 1.2;
export const DEFAULT_SNAP_THRESHOLD = 0.90;

/**
 * Controlled 90% Section-Boundary Snapping with Lenis
 *
 * Characteristics:
 * 1. 0% through 89% travel: completely natural, uninhibited user scroll.
 * 2. Crossing 90% forward threshold: Lenis animates remaining <=10% distance to the exact
 *    bottom boundary of the section (top of the next section).
 * 3. Crossing backward threshold (travel progress <= 10%): animates remaining distance to
 *    the start boundary of the current section.
 * 4. Zero forced reflows during scroll: section geometry is measured outside the scroll loop.
 * 5. Non-trapping: intentional user reversal or key navigation immediately halts programmatic scroll.
 * 6. Duplicate triggers prevented during animation and cooldown window.
 * 7. Respects reduced-motion and touch device preferences.
 * 8. Reuses the existing single Lenis instance and animation loop.
 */
export function useSectionSnapAssist(
  config?: string[] | SectionSnapAssistOptions
) {
  const options: SectionSnapAssistOptions = Array.isArray(config)
    ? { targetIds: config }
    : config || {};

  const targetIds = options.targetIds ?? DEFAULT_HOMEPAGE_SECTIONS;
  const snapThreshold = options.snapThreshold ?? DEFAULT_SNAP_THRESHOLD;
  const duration = options.duration ?? DEFAULT_SNAP_DURATION;
  const easing = options.easing ?? DEFAULT_SNAP_EASING;

  const isSnappingRef = useRef(false);
  const snapDirectionRef = useRef<number>(0);
  const lastSnappedTargetRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const lastScrollYRef = useRef<number>(0);
  const cachedMetricsRef = useRef<SectionMetric[]>([]);
  const cachedElementsRef = useRef<Array<{ id: string; el: HTMLElement | null }>>([]);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect user's reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Preserve 100% native gesture scrolling on touch & mobile screens
    const isTouchOrMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth <= 768;
    if (isTouchOrMobile) {
      return;
    }

    // Populate and cache DOM element references
    cachedElementsRef.current = targetIds.map((id) => ({
      id,
      el: document.getElementById(id),
    }));

    // Measure live geometry of eligible sections OUTSIDE active scroll events
    const measureMetrics = () => {
      const currentScrollY = window.__lenis?.scroll ?? (window.scrollY || window.pageYOffset || 0);
      const list: SectionMetric[] = [];

      for (const item of cachedElementsRef.current) {
        if (!item.el || !item.el.isConnected) {
          item.el = document.getElementById(item.id);
        }
        if (!item.el) continue;

        const rect = item.el.getBoundingClientRect();
        const top = Math.round(rect.top + currentScrollY);
        const height = Math.round(rect.height);
        list.push({
          id: item.id,
          top,
          height,
          bottom: top + height,
        });
      }

      // Sort sequentially down the page
      list.sort((a, b) => a.top - b.top);
      cachedMetricsRef.current = list;
    };

    // Initial measurement + deferred updates once fonts & images settle
    measureMetrics();
    const initTimer1 = setTimeout(measureMetrics, 300);
    const initTimer2 = setTimeout(measureMetrics, 1200);

    // Debounced resize handler to update cached geometry without thrashing
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measureMetrics();
      }, 150);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    lastScrollYRef.current = window.__lenis?.scroll ?? (window.scrollY || window.pageYOffset || 0);

    const cancelSnap = (cooldownMs = 350) => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (isSnappingRef.current && window.__lenis) {
        // Halt programmatic Lenis animation at current position without fighting user
        window.__lenis.scrollTo(window.__lenis.scroll, { immediate: true });
      }
      isSnappingRef.current = false;
      snapDirectionRef.current = 0;
      cooldownUntilRef.current = Date.now() + cooldownMs;
    };

    // User interrupt handlers: Yield control immediately on intentional counter-actions
    const handleWheel = (e: WheelEvent) => {
      if (!isSnappingRef.current) return;
      const wheelDir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      // Interrupt ONLY if wheel is moving OPPOSITE to the ongoing snap
      if (wheelDir !== 0 && wheelDir === -snapDirectionRef.current) {
        cancelSnap(400);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSnappingRef.current) return;
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape"].includes(e.key)) {
        cancelSnap(400);
      }
    };

    const handlePointerDown = () => {
      if (isSnappingRef.current) {
        cancelSnap(300);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    // High-performance scroll handler: reads cached metrics with ZERO DOM queries
    const handleScrollUpdate = (currentY: number, reportedDirection?: number) => {
      const prevY = lastScrollYRef.current;
      const diff = currentY - prevY;
      lastScrollYRef.current = currentY;

      // Determine scroll direction: 1 for down/forward, -1 for up/backward
      let direction = reportedDirection !== undefined && reportedDirection !== 0
        ? (reportedDirection > 0 ? 1 : -1)
        : (diff > 0 ? 1 : diff < 0 ? -1 : 0);

      if (direction === 0 && Math.abs(diff) >= 1) {
        direction = diff > 0 ? 1 : -1;
      }
      if (direction === 0) return;

      // User interrupt check: If currently snapping and scroll direction flips
      if (isSnappingRef.current) {
        if (snapDirectionRef.current !== 0 && direction === -snapDirectionRef.current) {
          cancelSnap(350);
        }
        return;
      }

      // Do not initiate a new snap during cooldown
      if (Date.now() < cooldownUntilRef.current) {
        return;
      }

      // Read from cached geometry array: 0 DOM queries, 0 reflows
      const metrics = cachedMetricsRef.current;
      if (metrics.length < 2) return;

      const viewportHeight = window.innerHeight;
      const animMs = Math.round(duration * 1000);

      // Check adjacent section intervals [i, i+1]
      for (let i = 0; i < metrics.length - 1; i++) {
        const currentSec = metrics[i];
        const nextSec = metrics[i + 1];

        const startY = currentSec.top;
        const endY = nextSec.top;
        const travelDistance = endY - startY;

        // Skip invalid or non-positive travel
        if (travelDistance <= 60) continue;

        // Check if current scroll is within this section transition zone
        if (currentY >= startY - 2 && currentY <= endY + 2) {
          // If a section is tall (> 1.4x viewport), allow natural reading without forced snap
          if (currentSec.height > viewportHeight * 1.4 || nextSec.height > viewportHeight * 1.4) {
            continue;
          }

          // Calculate travel progress through current section: 0.0 (start) to 1.0 (end)
          const progress = (currentY - startY) / travelDistance;

          // ─── 1. Forward 90% Boundary Snap ───
          if (direction > 0) {
            // Trigger once user crosses the 90% threshold towards current section bottom
            if (progress >= snapThreshold && progress < 0.995 && currentY < endY - 3) {
              // If already docked at or near this end boundary, do not re-trigger
              if (lastSnappedTargetRef.current === endY && Math.abs(currentY - endY) < 35) {
                continue;
              }

              // Smoothly animate the remaining distance (<=10%) to end boundary using existing Lenis instance
              isSnappingRef.current = true;
              snapDirectionRef.current = 1;
              lastSnappedTargetRef.current = endY;
              cooldownUntilRef.current = Date.now() + animMs + 100;

              const onDone = () => {
                isSnappingRef.current = false;
                snapDirectionRef.current = 0;
                if (timeoutIdRef.current) {
                  clearTimeout(timeoutIdRef.current);
                  timeoutIdRef.current = null;
                }
              };

              if (window.__lenis) {
                window.__lenis.scrollTo(endY, {
                  duration,
                  easing,
                  lock: false,
                  onComplete: onDone,
                });
              } else {
                window.scrollTo({ top: endY, behavior: "smooth" });
                timeoutIdRef.current = setTimeout(onDone, animMs);
              }

              // Safety fallback in case animation completion callback does not fire
              timeoutIdRef.current = setTimeout(onDone, animMs + 150);
              break;
            }
          }

          // ─── 2. Backward Boundary Snap ───
          else if (direction < 0) {
            // When scrolling up, user traverses from endY toward startY.
            // When progress <= (1 - snapThreshold) (<= 0.10), user has completed 90% of the return trip
            if (progress <= (1 - snapThreshold) && progress > 0.005 && currentY > startY + 3) {
              if (lastSnappedTargetRef.current === startY && Math.abs(currentY - startY) < 35) {
                continue;
              }

              isSnappingRef.current = true;
              snapDirectionRef.current = -1;
              lastSnappedTargetRef.current = startY;
              cooldownUntilRef.current = Date.now() + animMs + 100;

              const onDone = () => {
                isSnappingRef.current = false;
                snapDirectionRef.current = 0;
                if (timeoutIdRef.current) {
                  clearTimeout(timeoutIdRef.current);
                  timeoutIdRef.current = null;
                }
              };

              if (window.__lenis) {
                window.__lenis.scrollTo(startY, {
                  duration,
                  easing,
                  lock: false,
                  onComplete: onDone,
                });
              } else {
                window.scrollTo({ top: startY, behavior: "smooth" });
                timeoutIdRef.current = setTimeout(onDone, animMs);
              }

              // Safety fallback
              timeoutIdRef.current = setTimeout(onDone, animMs + 150);
              break;
            }
          }
        }
      }

      // Re-arm lastSnappedTargetRef once user has scrolled comfortably away from the boundary
      if (lastSnappedTargetRef.current !== null) {
        if (Math.abs(currentY - lastSnappedTargetRef.current) > 50) {
          lastSnappedTargetRef.current = null;
        }
      }
    };

    // Connect to single existing Lenis instance
    let detachLenis: (() => void) | null = null;
    const connectToLenis = () => {
      const lenis = window.__lenis;
      if (!lenis) return false;

      const lenisHandler = (e: { scroll: number; direction: number }) => {
        handleScrollUpdate(e.scroll, e.direction);
      };

      lenis.on("scroll", lenisHandler);
      detachLenis = () => {
        lenis.off("scroll", lenisHandler);
      };
      return true;
    };

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    if (!connectToLenis()) {
      retryTimer = setTimeout(() => {
        connectToLenis();
      }, 50);
    }

    // Window scroll event fallback ONLY if Lenis is not available
    const onWindowScroll = () => {
      if (!window.__lenis) {
        handleScrollUpdate(window.scrollY || window.pageYOffset || 0);
      }
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", onWindowScroll);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (initTimer1) clearTimeout(initTimer1);
      if (initTimer2) clearTimeout(initTimer2);
      if (retryTimer) clearTimeout(retryTimer);
      if (detachLenis) detachLenis();
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      isSnappingRef.current = false;
      snapDirectionRef.current = 0;
    };
  }, [targetIds, snapThreshold, duration, easing]);
}

