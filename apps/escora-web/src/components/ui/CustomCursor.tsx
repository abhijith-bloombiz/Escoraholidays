import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Avoid running on touch devices or reduced motion
    if (typeof window === "undefined") return;
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouchDevice || prefersReducedMotion) {
      document.body.style.cursor = "auto";
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let rafId = 0;
    let isVisible = false;

    const render = () => {
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      rafId = 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }

      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="hidden lg:block pointer-events-none" aria-hidden="true">
      <div
        ref={dotRef}
        className="custom-cursor-dot pointer-events-none"
        style={{
          top: 0,
          left: 0,
          opacity: 0,
          willChange: "transform",
        }}
      />
      <div
        ref={ringRef}
        className="custom-cursor-ring pointer-events-none"
        style={{
          top: 0,
          left: 0,
          opacity: 0,
          willChange: "transform",
        }}
      />
    </div>
  );
}
