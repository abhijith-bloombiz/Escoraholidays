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
    // 60FPS high-performance smooth inertia scroll instance
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
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

    // Watch DOM resizes to recalculate scroll bounds smoothly
    const ro = new ResizeObserver(() => {
      lenis.resize();
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
          const elem = document.querySelector(hash);
          if (elem) {
            e.preventDefault();
            lenis.scrollTo(elem as HTMLElement, {
              offset: -85,
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
