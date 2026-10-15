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

/**
 * Smooth, viewport-assisted section scroll behavior for the Escora homepage.
 *
 * - Fluid, natural scrolling until a section reaches approximately halfway into the viewport.
 * - Smoothly docks the section into its intended viewport position using Lenis (with native fallback).
 * - Symmetrical support for both downward and upward scrolling.
 * - Respects the floating navbar clearance (~76px) so headings are never concealed.
 * - Settle lock prevents repeated snapping or trapping; allows natural escape to the next section.
 * - Respects section heights: taller sections dock to top and allow free internal scrolling without loops.
 * - Disables during rapid scrolling / flick gestures to avoid fighting user intent.
 * - Completely preserves normal native scrolling on touch and mobile devices.
 * - Respects user's reduced-motion preference.
 */
export function useSectionSnapAssist(targetIds: string[] = DEFAULT_HOMEPAGE_SECTIONS) {
  const isSnappingRef = useRef(false);
  const settledSectionIdRef = useRef<string | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Honor reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Preserve 100% normal native scrolling on mobile and touch devices
    const isTouchOrMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth <= 768;
    if (isTouchOrMobile) {
      return;
    }

    lastScrollYRef.current = window.scrollY;
    lastScrollTimeRef.current = performance.now();

    const checkAndSnap = () => {
      // Do not snap while an animation is already in progress or during cooldown
      if (isSnappingRef.current || Date.now() < cooldownUntilRef.current) {
        return;
      }

      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const navHeight = window.innerWidth > 900 ? 76 : 64;
      const availHeight = windowHeight - navHeight;

      const diff = currentScrollY - lastScrollYRef.current;
      // Require at least a tiny scroll movement to detect direction
      if (Math.abs(diff) < 2) return;
      const direction = diff > 0 ? "down" : "up";

      for (const id of targetIds) {
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const sectionHeight = rect.height;
        const sectionTop = rect.top + currentScrollY;

        // Calculate target docking position:
        // - Hero section docks at scrollY = 0
        // - Sections that comfortably fit in viewport are centered in available space below navbar
        // - Taller sections dock cleanly at the top leaving navbar clearance
        let targetY: number;
        if (id === "hero") {
          targetY = 0;
        } else if (sectionHeight <= availHeight) {
          const centerOffset = Math.round((availHeight - sectionHeight) / 2);
          targetY = Math.round(sectionTop - navHeight - centerOffset);
        } else {
          targetY = Math.round(sectionTop - navHeight);
        }

        const dist = targetY - currentScrollY;

        // If currently settled on this section, release lock only when user has scrolled away
        if (settledSectionIdRef.current === id) {
          if (Math.abs(dist) > Math.min(140, windowHeight * 0.22)) {
            settledSectionIdRef.current = null;
          } else {
            // User is still looking at this settled section or scrolling through it
            continue;
          }
        }

        // For tall sections (taller than available viewport):
        // If the user is currently reading inside the middle of a tall section, do not snap back
        if (sectionHeight > availHeight * 1.08) {
          if (rect.top < navHeight - 60 && rect.bottom > windowHeight + 60) {
            continue;
          }
        }

        let shouldSnap = false;

        if (direction === "down") {
          // Approaching from above: section reaches approximately halfway into the viewport
          // rect.top is crossing the mid-viewport threshold (~25% to 62% of viewport height)
          if (rect.top <= windowHeight * 0.62 && rect.top >= windowHeight * 0.25 && dist > 20) {
            shouldSnap = true;
          }
        } else if (direction === "up") {
          // Approaching from below: section reaches approximately halfway into the viewport
          // rect.bottom is crossing the mid-viewport threshold (~38% to 75% of viewport height)
          if (rect.bottom >= windowHeight * 0.38 && rect.bottom <= windowHeight * 0.75 && dist < -20) {
            shouldSnap = true;
          } else if (id === "hero" && currentScrollY <= windowHeight * 0.45 && currentScrollY > 15) {
            shouldSnap = true;
          }
        }

        if (shouldSnap) {
          isSnappingRef.current = true;
          settledSectionIdRef.current = id;
          cooldownUntilRef.current = Date.now() + 850;

          const finishSnapping = () => {
            isSnappingRef.current = false;
          };

          // Smooth assisted scroll using Lenis if active, else native smooth scroll
          if (window.__lenis) {
            window.__lenis.scrollTo(targetY, {
              duration: 0.9,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              onComplete: finishSnapping,
            });
          } else {
            window.scrollTo({ top: targetY, behavior: "smooth" });
            setTimeout(finishSnapping, 800);
          }

          // Safety fallback reset
          setTimeout(finishSnapping, 950);
          break;
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    const onScroll = () => {
      // If currently snapping or in cooldown, just track scroll position
      if (isSnappingRef.current || Date.now() < cooldownUntilRef.current) {
        lastScrollYRef.current = window.scrollY;
        lastScrollTimeRef.current = performance.now();
        return;
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastScrollTimeRef.current);
      const diff = window.scrollY - lastScrollYRef.current;
      const speed = Math.abs(diff) / dt; // px per millisecond

      lastScrollYRef.current = window.scrollY;
      lastScrollTimeRef.current = now;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // If scrolling at normal moderate pace, evaluate snap candidate
      if (speed < 1.2 && Math.abs(diff) < 80) {
        checkAndSnap();
      }

      // Short debounce when scrolling slows or pauses, giving natural Lenis-like deceleration
      scrollTimeoutRef.current = setTimeout(() => {
        checkAndSnap();
      }, 70);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [targetIds]);
}
