import { useLocation } from "wouter";
import { useEffect } from "react";

export default function CustomCursor() {
  const [location] = useLocation();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dot = document.querySelector(".custom-cursor-dot") as HTMLElement;
      const ring = document.querySelector(".custom-cursor-ring") as HTMLElement;
      
      if (dot && ring) {
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
        ring.style.left = `${e.clientX}px`;
        ring.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Ensure cursors disappear on touch devices
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      document.body.style.cursor = 'auto';
    }
  }, []);

  return (
    <div className="hidden lg:block">
      <div className="custom-cursor-dot pointer-events-none" />
      <div className="custom-cursor-ring pointer-events-none" />
    </div>
  );
}
