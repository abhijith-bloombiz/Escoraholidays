import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

interface SmoothScrollProps {
  children?: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const [location] = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 60FPS high-performance smooth inertia scroll instance
    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0 : 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !prefersReducedMotion,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.4,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    // RAF 60fps loop
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Watch DOM resizes to recalculate scroll bounds smoothly (debounced to avoid layout thrashing)
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lenis.resize();
      }, 150);
    });
    ro.observe(document.body);

    // Smooth anchor navigation handler (e.g. href="#contact", href="#categories", href="/#contact")
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (href) {
        let hash = "";
        if (href.startsWith("#") && href.length > 1) {
          hash = href;
        } else if (href.startsWith("/#") && href.length > 2 && (window.location.pathname === "/" || window.location.pathname === "")) {
          hash = href.substring(1);
        }
        if (hash) {
          const PINNED_HASH_MAP: Record<string, number> = {
            "#why-escora": 0,
            "#categories": 1,
            "#explore-kerala": 2,
            "#how-it-works": 3,
            "#retreat": 4,
            "#testimonials": 5,
            "#contact": 6,
          };

          if (hash in PINNED_HASH_MAP && window.__pinnedJourney) {
            e.preventDefault();
            window.__pinnedJourney.goToSlide(PINNED_HASH_MAP[hash]);
            return;
          }

          const elem = document.querySelector(hash);
          if (elem) {
            e.preventDefault();
            lenis.scrollTo(elem as HTMLElement, {
              offset: 0,
              duration: 1.25,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          }
        }
      }
    }

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      lenis.destroy();
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, []);

  // Reset scroll position on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return <>{children}</>;
}
