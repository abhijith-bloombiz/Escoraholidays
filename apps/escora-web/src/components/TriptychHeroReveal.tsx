import { useEffect, useRef } from "react";
import defaultSecondaryBg from "@assets/escora/Misty Mountain Sunrise Panorama.png";
import "./TriptychHeroReveal.css";

export interface TriptychHeroRevealProps {
  /**
   * Reference to the parent hero container element to attach pointer listeners to.
   */
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Secondary background image revealed on press-and-hold.
   * Defaults to high-resolution Misty Mountain Sunrise Panorama.
   */
  secondaryImage?: string;
  /**
   * Maximum radius of the organic liquid mask in pixels.
   * If omitted and fullReveal is true, dynamically calculated to engulf the entire container.
   */
  maxRadius?: number;
  /**
   * Whether to expand until the secondary image fully reveals the entire hero section.
   * Defaults to true.
   */
  fullReveal?: boolean;
  /**
   * Luminous outer glow color for the organic mask edge.
   */
  glowColor?: string;
  /**
   * Duration in seconds to gracefully expand to full reveal (slow and smooth).
   * Default: 2.6 seconds.
   */
  expandDuration?: number;
  /**
   * Duration in seconds to smoothly retract on release.
   * Default: 1.4 seconds.
   */
  retractDuration?: number;
  /**
   * Callback invoked when a reveal effect completes, allowing the parent
   * hero section to update its background image to the revealed image.
   */
  onRevealComplete?: () => void;
  /**
   * Automatically play the organic reveal effect from different positions when idle.
   * Default: true.
   */
  autoPlay?: boolean;
  /**
   * Idle delay in milliseconds before initiating an automatic reveal.
   * Default: 3800ms.
   */
  autoPlayDelay?: number;
}

export function TriptychHeroReveal({
  containerRef,
  secondaryImage = defaultSecondaryBg,
  maxRadius,
  fullReveal = true,
  glowColor = "rgba(255, 235, 245, 0.8)",
  expandDuration = 2.6,
  retractDuration = 1.4,
  onRevealComplete,
  autoPlay = true,
  autoPlayDelay = 3800,
}: TriptychHeroRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onRevealCompleteRef = useRef(onRevealComplete);
  onRevealCompleteRef.current = onRevealComplete;

  // Active Image instance currently being drawn on the canvas (locked during reveal & dissolve)
  const activeImgRef = useRef<HTMLImageElement>(new Image());
  // Preloaded Next Image instance for upcoming reveal
  const nextImgRef = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    const img = new Image();
    img.src = secondaryImage;
    nextImgRef.current = img;

    if (!activeImgRef.current.src) {
      activeImgRef.current.src = secondaryImage;
    }
  }, [secondaryImage]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check accessibility reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Dimensions
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!container || !canvas || !ctx) return;
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    // Interaction & physics state
    let isPressed = false;
    let isCompleting = false;
    let isAutoPlaying = false;
    let autoPlayTimer: number | null = null;
    let autoPosIndex = 0;

    let revealProgress = 0; // 0.0 to 1.0 progression
    let currentRadius = 0;
    let targetRadius = 0;
    let hasTriggeredComplete = false;
    let isDissolving = false;
    let dissolveAlpha = 1.0;

    function lockRevealImage() {
      if (nextImgRef.current.src && nextImgRef.current.complete) {
        activeImgRef.current = nextImgRef.current;
      } else if (nextImgRef.current.src) {
        activeImgRef.current.src = nextImgRef.current.src;
      }
    }

    // Organic positions distributed across different locations of the hero landscape
    const AUTO_POSITIONS = [
      { xRatio: 0.28, yRatio: 0.38 }, // upper-left mountain mist
      { xRatio: 0.72, yRatio: 0.42 }, // eastern sunrise crest
      { xRatio: 0.44, yRatio: 0.64 }, // lower central valley & water
      { xRatio: 0.22, yRatio: 0.52 }, // western palm horizon
      { xRatio: 0.78, yRatio: 0.34 }, // high northeast dawn sky
    ];

    function stopAutoPlay() {
      if (autoPlayTimer !== null) {
        window.clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function isHeroInViewport(): boolean {
      if (!container) return false;
      const rect = container.getBoundingClientRect();
      return rect.bottom > 120 && rect.top < window.innerHeight - 120;
    }

    function scheduleAutoPlay(delayMs = autoPlayDelay) {
      if (!autoPlay || prefersReducedMotion) return;
      stopAutoPlay();
      autoPlayTimer = window.setTimeout(() => {
        startAutoReveal();
      }, delayMs);
    }

    function startAutoReveal() {
      if (isPressed || isCompleting || !container || !isHeroInViewport()) {
        scheduleAutoPlay(2200);
        return;
      }

      isAutoPlaying = true;
      isCompleting = false;
      hasTriggeredComplete = false;
      isDissolving = false;
      dissolveAlpha = 1.0;
      revealProgress = 0;

      lockRevealImage();

      const pos = AUTO_POSITIONS[autoPosIndex % AUTO_POSITIONS.length];
      autoPosIndex++;

      const originX = width * pos.xRatio;
      const originY = height * pos.yRatio;

      currentX = originX;
      currentY = originY;
      targetX = originX;
      targetY = originY;
      lastTargetX = originX;
      lastTargetY = originY;
      velX = 0;
      velY = 0;

      targetRadius = computeTargetRadius(originX, originY);

      if (rafId === null) {
        lastTimestamp = null;
        startTime = null;
        rafId = requestAnimationFrame(animate);
      }
    }

    // Blob center coordinates
    let currentX = width / 2;
    let currentY = height / 2;
    let targetX = width / 2;
    let targetY = height / 2;

    // Directional velocity tracking for liquid viscosity/stretching
    let velX = 0;
    let velY = 0;
    let lastTargetX = targetX;
    let lastTargetY = targetY;

    // Animation frame handles
    let rafId: number | null = null;
    let lastTimestamp: number | null = null;
    let startTime: number | null = null;

    // Determine target max radius (fluid responsive sizing / full reveal)
    function computeTargetRadius(fromX: number, fromY: number): number {
      if (maxRadius && maxRadius > 0) return maxRadius;
      if (!fullReveal) {
        const minDimension = Math.min(width, height);
        return Math.min(Math.max(minDimension * 0.42, 260), 520);
      }
      // Full reveal mode: Calculate distance from cursor to all 4 corners of container
      const d1 = Math.hypot(fromX, fromY); // top-left (0, 0)
      const d2 = Math.hypot(width - fromX, fromY); // top-right (width, 0)
      const d3 = Math.hypot(fromX, height - fromY); // bottom-left (0, height)
      const d4 = Math.hypot(width - fromX, height - fromY); // bottom-right (width, height)
      const maxCornerDist = Math.max(d1, d2, d3, d4);
      // Generous buffer ensures all multi-harmonic wave troughs comfortably clear the canvas bounds
      return Math.round(maxCornerDist * 1.35 + 100);
    }

    // Midpoint helper for smooth C1 quadratic bezier spline
    function getMidpoint(
      p1: { x: number; y: number },
      p2: { x: number; y: number }
    ) {
      return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
    }

    // Quintic smootherstep easing (zero 1st & 2nd derivatives at both ends for buttery smoothness)
    function smootherstep(t: number): number {
      const clamped = Math.max(0, Math.min(1, t));
      return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
    }

    // Main animation loop
    function animate(timestamp: number) {
      if (!ctx || !canvas) return;

      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
        startTime = timestamp;
        rafId = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;
      const elapsedTime = (timestamp - (startTime || timestamp)) / 1000;

      // Viscous spring-like center tracking:
      // Lower lerp speed gives a luxurious, heavy liquid glide
      const lerpSpeed = 0.075;
      currentX += (targetX - currentX) * lerpSpeed;
      currentY += (targetY - currentY) * lerpSpeed;

      // Track cursor velocity with decay
      const instantaneousVx = targetX - lastTargetX;
      const instantaneousVy = targetY - lastTargetY;
      lastTargetX = targetX;
      lastTargetY = targetY;

      velX = velX * 0.85 + instantaneousVx * 0.15;
      velY = velY * 0.85 + instantaneousVy * 0.15;
      const speed = Math.sqrt(velX * velX + velY * velY);
      const motionAngle = Math.atan2(velY, velX);

      // Slow, smooth progression update:
      if (isDissolving) {
        dissolveAlpha -= dt / 0.55; // 550ms smooth dissolve
        if (dissolveAlpha <= 0) {
          isDissolving = false;
          dissolveAlpha = 1.0;
          revealProgress = 0;
          currentRadius = 0;
          hasTriggeredComplete = false;
          isCompleting = false;
          isAutoPlaying = false;
          ctx.clearRect(0, 0, width, height);
          rafId = null;
          lastTimestamp = null;
          startTime = null;

          // Prepare next image for upcoming reveal
          if (nextImgRef.current.src) {
            activeImgRef.current = nextImgRef.current;
          }

          // Schedule next auto reveal from another position after dissolve
          scheduleAutoPlay(autoPlayDelay);
          return; // Halt RAF completely when idle (zero CPU/GPU usage)
        }
      } else if (isPressed) {
        revealProgress = Math.min(1.0, revealProgress + dt / expandDuration);
        if (revealProgress >= 0.98 && !hasTriggeredComplete) {
          hasTriggeredComplete = true;
          onRevealCompleteRef.current?.();
        }
      } else if (isCompleting) {
        // User released before 0.98: smoothly finish expanding to 100% so old image never reverts
        revealProgress = Math.min(1.0, revealProgress + dt / 1.2);
        if (revealProgress >= 0.98 && !hasTriggeredComplete) {
          hasTriggeredComplete = true;
          onRevealCompleteRef.current?.();
          isCompleting = false;
          isDissolving = true;
          dissolveAlpha = 1.0;
        }
      } else if (isAutoPlaying) {
        // Automatic reveal progression from selected position
        revealProgress = Math.min(1.0, revealProgress + dt / expandDuration);
        if (revealProgress >= 0.98 && !hasTriggeredComplete) {
          hasTriggeredComplete = true;
          onRevealCompleteRef.current?.();
          isAutoPlaying = false;
          isDissolving = true;
          dissolveAlpha = 1.0;
        }
      } else if (hasTriggeredComplete) {
        // Held past 0.98, user now released
        isDissolving = true;
        dissolveAlpha = 1.0;
      }

      // Calculate current radius through smootherstep
      const maxR = fullReveal
        ? computeTargetRadius(currentX, currentY)
        : targetRadius;
      currentRadius = maxR * smootherstep(revealProgress);

      // Clear previous frame
      ctx.clearRect(0, 0, width, height);

      // Only render if image is ready and radius > 0
      const img = activeImgRef.current;
      if (currentRadius > 0.5 && img.complete && img.naturalWidth > 0) {
        const numPoints = prefersReducedMotion ? 20 : 44;
        const points: { x: number; y: number }[] = [];

        // Build organic perturbed polygon vertices
        for (let i = 0; i < numPoints; i++) {
          const theta = (i * 2 * Math.PI) / numPoints;

          let deformation = 0;
          if (!prefersReducedMotion) {
            // Calm, slow liquid surface ripples
            const h1 = 0.075 * Math.sin(3 * theta + elapsedTime * 1.15);
            const h2 = 0.055 * Math.sin(5 * theta - elapsedTime * 1.35 + 1.3);
            const h3 = 0.035 * Math.cos(7 * theta + elapsedTime * 1.65 + 2.6);
            const h4 = 0.025 * Math.sin(2 * theta - elapsedTime * 0.85 + 4.2);
            deformation = h1 + h2 + h3 + h4;

            // Fluid viscosity: subtle directional elongation along movement vector
            const angleDelta = theta - motionAngle;
            const stretch = Math.min(0.20, speed * 0.008) * Math.cos(angleDelta);
            const pinch =
              -Math.min(0.08, speed * 0.003) * Math.pow(Math.sin(angleDelta), 2);
            deformation += stretch + pinch;
          }

          const r = Math.max(1, currentRadius * (1.0 + deformation));
          const px = currentX + r * Math.cos(theta);
          const py = currentY + r * Math.sin(theta);
          points.push({ x: px, y: py });
        }

        // Trace smooth organic path using midpoints and quadratic Bezier curves
        function traceBlobPath() {
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

        ctx.save();
        if (isDissolving) {
          ctx.globalAlpha = Math.max(0, Math.min(1, dissolveAlpha));
        }

        // 1. Clip and draw secondary background image
        ctx.save();
        traceBlobPath();
        ctx.clip();

        // Calculate "cover; center bottom" geometry identical to .hero-art-bg
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.max(width / iw, height / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (width - dw) / 2;
        const dy = height - dh; // center bottom alignment

        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        // 2. Render luminous ethereal glow on the mask edge (inspired by reference)
        ctx.save();
        traceBlobPath();

        // Outer soft luminous glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 24;
        ctx.strokeStyle = "rgba(255, 246, 252, 0.94)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner crisp champagne highlight
        ctx.shadowBlur = 7;
        ctx.shadowColor = "rgba(255, 255, 255, 0.98)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
        ctx.restore();
      }

      // Continue animation loop
      rafId = requestAnimationFrame(animate);
    }

    // Pointer event handlers
    function handlePointerDown(e: PointerEvent) {
      // User takes active control: interrupt auto-play
      stopAutoPlay();
      isAutoPlaying = false;
      isCompleting = false;
      isDissolving = false;
      dissolveAlpha = 1.0;

      // Only respond to primary click/touch
      if (e.button !== 0 && e.pointerType === "mouse") return;

      // Strict preservation: Do not intercept interactive elements (buttons, inputs, dropdowns, search capsule)
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest(
          'button, a, input, select, textarea, [role="button"], .hero-search-wrapper, .hero-search-capsule, .dest-chip, .pax-option, .dropdown-menu, .hero-search-btn'
        ) ||
          target.isContentEditable)
      ) {
        scheduleAutoPlay(autoPlayDelay);
        return;
      }

      const rect = container?.getBoundingClientRect();
      if (!rect) return;

      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      isPressed = true;
      hasTriggeredComplete = false;
      targetRadius = computeTargetRadius(px, py);

      // Lock in active reveal image
      lockRevealImage();

      // If starting fresh from radius 0, snap center directly to pointer
      if (revealProgress < 0.05) {
        currentX = px;
        currentY = py;
        targetX = px;
        targetY = py;
        lastTargetX = px;
        lastTargetY = py;
        velX = 0;
        velY = 0;
      } else {
        targetX = px;
        targetY = py;
      }

      // Attach window-level listeners to ensure continuous tracking even if pointer leaves hero
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);

      // Start RAF loop if not already running
      if (rafId === null) {
        lastTimestamp = null;
        startTime = null;
        rafId = requestAnimationFrame(animate);
      }
    }

    function handlePointerMove(e: PointerEvent) {
      if (!isPressed || !container) return;
      const rect = container.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      targetRadius = computeTargetRadius(targetX, targetY);
    }

    function handlePointerUp() {
      if (!isPressed) return;
      isPressed = false;

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      // Once the reveal starts, DO NOT retract or revert to the old image!
      // Gracefully advance to full screen reveal, lock in the new background, and dissolve.
      if (!hasTriggeredComplete) {
        isCompleting = true;
      } else {
        isDissolving = true;
        dissolveAlpha = 1.0;
      }
    }

    // Safety reset on window blur
    function handleWindowBlur() {
      if (isPressed) {
        handlePointerUp();
      }
    }

    function handleUserActivity() {
      if (!isPressed && !isAutoPlaying) {
        scheduleAutoPlay(autoPlayDelay);
      }
    }

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handleUserActivity, { passive: true });
    window.addEventListener("blur", handleWindowBlur);

    // Initial startup of ambient autonomous showcase
    scheduleAutoPlay(autoPlayDelay);

    // Cleanup
    return () => {
      stopAutoPlay();
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handleUserActivity);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("blur", handleWindowBlur);
      resizeObserver.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [containerRef, maxRadius, fullReveal, glowColor, expandDuration, retractDuration, autoPlay, autoPlayDelay]);

  return <canvas ref={canvasRef} className="triptych-hero-canvas" aria-hidden="true" />;
}

export default TriptychHeroReveal;
