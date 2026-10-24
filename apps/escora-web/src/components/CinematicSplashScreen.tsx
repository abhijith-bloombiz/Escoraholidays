import { useEffect, useState, useRef, useCallback } from "react";
import escoraLogoDark from "@assets/escora/escora-logo-dark.png";
import "./CinematicSplashScreen.css";

interface CinematicSplashScreenProps {
  /** Duration in ms before automatic reveal exit (default 1800ms) */
  duration?: number;
  /** Force splash screen to always show on page reload (default true) */
  alwaysShow?: boolean;
  /** Callback fired when the splash screen has fully completed and unmounted */
  onComplete?: () => void;
}

// Pre-calculated deterministic floating golden stardust particles
const PARTICLES = [
  { id: 1, left: "15%", bottom: "25%", size: 3.5, delay: "0s", dur: "4.2s", opacity: 0.65 },
  { id: 2, left: "28%", bottom: "18%", size: 4, delay: "0.8s", dur: "5.5s", opacity: 0.75 },
  { id: 3, left: "42%", bottom: "22%", size: 2.5, delay: "1.4s", dur: "3.8s", opacity: 0.5 },
  { id: 4, left: "58%", bottom: "20%", size: 3.5, delay: "0.3s", dur: "4.8s", opacity: 0.7 },
  { id: 5, left: "72%", bottom: "26%", size: 3, delay: "1.9s", dur: "4.0s", opacity: 0.6 },
  { id: 6, left: "84%", bottom: "15%", size: 4.5, delay: "0.6s", dur: "6.0s", opacity: 0.8 },
  { id: 7, left: "20%", bottom: "40%", size: 2.5, delay: "1.1s", dur: "4.5s", opacity: 0.45 },
  { id: 8, left: "36%", bottom: "35%", size: 3, delay: "2.2s", dur: "5.0s", opacity: 0.55 },
  { id: 9, left: "64%", bottom: "38%", size: 2.5, delay: "1.7s", dur: "3.9s", opacity: 0.5 },
  { id: 10, left: "80%", bottom: "42%", size: 3.5, delay: "0.4s", dur: "5.2s", opacity: 0.65 },
  { id: 11, left: "48%", bottom: "12%", size: 3, delay: "2.6s", dur: "4.6s", opacity: 0.7 },
  { id: 12, left: "90%", bottom: "30%", size: 2.5, delay: "1.2s", dur: "3.6s", opacity: 0.4 },
];

export default function CinematicSplashScreen({
  duration = 3200,
  alwaysShow = true,
  onComplete,
}: CinematicSplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const exitingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Trigger organic liquid reveal exit
  const triggerExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setIsExiting(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("escora:splash-exiting"));
    }
  }, []);

  // Handle immediate skip via Esc, Space, Enter, or Click
  const handleSkip = useCallback(
    (e?: React.MouseEvent | KeyboardEvent) => {
      if (e) {
        e.stopPropagation();
      }
      triggerExit();
    },
    [triggerExit]
  );

  // Set up Organic Liquid Mask Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    let rafId: number | null = null;
    let exitStartTime: number | null = null;
    const exitDuration = 1100; // ms for fluid, majestic organic bloom

    function smootherstep(t: number): number {
      const clamped = Math.max(0, Math.min(1, t));
      return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
    }

    function getMidpoint(
      p1: { x: number; y: number },
      p2: { x: number; y: number }
    ) {
      return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
    }

    function render(timestamp: number) {
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw light luxury background (ivory / cream #faf8f5)
      ctx.fillStyle = "#faf8f5";
      ctx.fillRect(0, 0, width, height);

      // Subtle warm ambient radial depth
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        30,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.6
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      grad.addColorStop(0.35, "rgba(250, 246, 237, 0.92)");
      grad.addColorStop(0.75, "rgba(244, 238, 226, 0.96)");
      grad.addColorStop(1, "rgba(238, 230, 216, 0.98)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      let progress = 0;
      if (exitingRef.current) {
        if (exitStartTime === null) {
          exitStartTime = timestamp;
        }
        progress = Math.min(1.0, (timestamp - exitStartTime) / exitDuration);
      }

      // Max radius to comfortably engulf all four viewport corners
      const maxDist = Math.hypot(width / 2, height / 2);
      const maxRadius = maxDist * 1.35 + 100;
      const currentRadius = maxRadius * smootherstep(progress);

      if (currentRadius > 0.5) {
        const numPoints = prefersReducedMotion ? 20 : 44;
        const points: { x: number; y: number }[] = [];
        const elapsedTime = (timestamp - (exitStartTime || timestamp)) / 1000;

        for (let i = 0; i < numPoints; i++) {
          const theta = (i * 2 * Math.PI) / numPoints;

          let deformation = 0;
          if (!prefersReducedMotion) {
            const h1 = 0.075 * Math.sin(3 * theta + elapsedTime * 1.8);
            const h2 = 0.055 * Math.sin(5 * theta - elapsedTime * 2.1 + 1.3);
            const h3 = 0.035 * Math.cos(7 * theta + elapsedTime * 2.5 + 2.6);
            const h4 = 0.025 * Math.sin(2 * theta - elapsedTime * 1.4 + 4.2);
            deformation = h1 + h2 + h3 + h4;
          }

          const r = Math.max(1, currentRadius * (1.0 + deformation));
          points.push({
            x: width / 2 + r * Math.cos(theta),
            y: height / 2 + r * Math.sin(theta),
          });
        }

        function traceBlob() {
          if (!ctx || points.length < 3) return;
          const firstMid = getMidpoint(points[points.length - 1], points[0]);
          ctx.beginPath();
          ctx.moveTo(firstMid.x, firstMid.y);
          for (let i = 0; i < points.length; i++) {
            const nextPt = points[(i + 1) % points.length];
            const mid = getMidpoint(points[i], nextPt);
            ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
          }
          ctx.closePath();
        }

        // Punch organic liquid hole through the splash background to reveal website underneath
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        traceBlob();
        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.restore();
      }

      if (progress < 1.0) {
        rafId = requestAnimationFrame(render);
      } else {
        // Fully revealed: complete and unmount
        setIsComplete(true);
        onCompleteRef.current?.();
        if (typeof window !== "undefined") {
          document.documentElement.classList.remove("escora-splash-active");
          document.documentElement.classList.add("escora-splash-done");
          window.dispatchEvent(new CustomEvent("escora:splash-done"));
        }
        try {
          sessionStorage.setItem("escora_splash_viewed", "true");
        } catch {
          /* storage disabled */
        }
      }
    }

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Lifetime lifecycle & skip listeners
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("escora-splash-active");
      document.documentElement.classList.remove("escora-splash-done");
    }

    if (!alwaysShow) {
      try {
        if (sessionStorage.getItem("escora_splash_viewed") === "true") {
          setIsComplete(true);
          if (typeof document !== "undefined") {
            document.documentElement.classList.remove("escora-splash-active");
            document.documentElement.classList.add("escora-splash-done");
            window.dispatchEvent(new CustomEvent("escora:splash-done"));
          }
          return;
        }
      } catch {
        /* storage disabled */
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleSkip(e);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const onReplay = () => {
      exitingRef.current = false;
      setIsExiting(false);
      setIsComplete(false);
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("escora-splash-active");
        document.documentElement.classList.remove("escora-splash-done");
      }
    };
    window.addEventListener("escora:replay-splash", onReplay);

    const timer = setTimeout(() => {
      triggerExit();
    }, duration);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("escora:replay-splash", onReplay);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("escora-splash-active");
        document.documentElement.classList.add("escora-splash-done");
      }
    };
  }, [alwaysShow, duration, handleSkip, triggerExit]);

  if (isComplete) return null;

  return (
    <div
      className={`cinematic-splash-wrapper${isExiting ? " exiting" : ""}`}
      onClick={() => handleSkip()}
      role="dialog"
      aria-modal="true"
      aria-label="Escora Holidays"
    >
      {/* ── Organic Liquid Mask Reveal Canvas ── */}
      <canvas
        ref={canvasRef}
        className="cinematic-splash-canvas"
        aria-hidden="true"
      />

      {/* ── Ambient Floating Golden Stardust Particles ── */}
      <div className="cinematic-splash-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="cinematic-splash-particle"
            style={
              {
                left: p.left,
                bottom: p.bottom,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: p.delay,
                animationDuration: p.dur,
                "--p-opacity": p.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* ── Luxury Centered Logo Presentation ── */}
      <div className="cinematic-splash-content" onClick={(e) => e.stopPropagation()}>
        <div className="cinematic-splash-logo-frame">
          <img
            src={escoraLogoDark}
            alt="Escora Holidays"
            className="cinematic-splash-logo-img"
            loading="eager"
            draggable={false}
          />
          <p className="cinematic-splash-tagline">
            EXPLORE &nbsp;·&nbsp; EXPERIENCE &nbsp;·&nbsp; ESCAPE
          </p>
        </div>
      </div>
    </div>
  );
}
