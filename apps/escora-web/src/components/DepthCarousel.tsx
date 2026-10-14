import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./DepthCarousel.css";

export interface DepthCarouselItem {
  id: string;
  num?: string;
  name: string;
  category?: string;
  tagline: string;
  slug: string;
  image: string;
  features?: { label: string; icon: string }[];
  associatedDistrict?: string;
}

interface DepthCarouselProps {
  items: DepthCarouselItem[];
  activeIndex?: number;
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: "right" | "left";
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onChange?: (index: number, item: DepthCarouselItem) => void;
  className?: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export default function DepthCarousel({
  items,
  activeIndex,
  cardWidth = 328,
  cardHeight = 480,
  radius = 8,
  tint = "#0c1a12",
  depth = 190,
  spread = 95,
  tilt = 16,
  tiltDirection = "right",
  perspective = 1400,
  visibleCards = 5,
  falloff = 0.18,
  blur = 0,
  duration = 750,
  ease = "power3.out",
  autoplay = false,
  autoplayDelay = 3500,
  loop = true,
  showControls = true,
  showIndicators = true,
  onChange,
  className = "",
}: DepthCarouselProps) {
  const data = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const count = data.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const spreadRef = useRef(spread);
  const cfgRef = useRef({
    count,
    depth,
    spread,
    tilt,
    tiltDirection,
    visibleCards,
    falloff,
    blur,
    duration,
    ease,
    loop,
    cardWidth,
    autoplayDelay,
  });
  const onChangeRef = useRef(onChange);

  const dragRef = useRef<{
    x: number;
    startPos: number;
    lastX: number;
    lastT: number;
    v: number;
    moved: boolean;
    id: number;
  } | null>(null);
  const wheelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reducedRef = useRef(false);

  const [active, setActive] = useState(0);

  onChangeRef.current = onChange;
  spreadRef.current = spread;
  cfgRef.current = {
    count,
    depth,
    spread,
    tilt,
    tiltDirection,
    visibleCards,
    falloff,
    blur,
    duration,
    ease,
    loop,
    cardWidth,
    autoplayDelay,
  };

  const layout = useCallback((pos: number) => {
    const cfg = cfgRef.current;
    const n = cfg.count;
    if (!n) return;
    const dir = cfg.tiltDirection === "left" ? -1 : 1;
    const sc = scaleRef.current;
    const curSpread = spreadRef.current;

    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;

      let d = i - pos;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        // When transitioning, allow smooth wrap-around for the card leaving or entering the stack
        if (d > n - 0.75) {
          d = d - n;
        }
      }

      const back = Math.max(0, d);
      const shown = d >= -0.75 && d <= cfg.visibleCards + 0.5;

      const tz = -cfg.depth * back;
      const tx = dir * curSpread * back;
      const ry = dir * cfg.tilt * clamp(back, 0, 1);

      // Unfocused cards maintain full opacity (no transparency) inside the visible stack
      let opacity = 1;
      if (d < -0.75) {
        opacity = 0;
      } else if (d < 0) {
        opacity = Math.max(0, 1 + d * 1.5);
      } else if (d > cfg.visibleCards) {
        opacity = Math.max(0, 1 - (d - cfg.visibleCards));
      }
      if (!shown) opacity = 0;

      // Keep images bright and pleasant (1.0 brightness, no darkening filter)
      // Unfocused images get clean depth blur while preserving high image quality
      const blurPx =
        cfg.blur > 0 && back > 0
          ? Math.min(cfg.blur, 1.8 + (back - 1) * 0.75)
          : 0;
      const zi = Math.round(2000 - back * 40);

      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(
        2
      )}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = blurPx > 0 ? `blur(${blurPx.toFixed(2)}px)` : "none";
      el.style.zIndex = String(zi);
      el.style.pointerEvents = shown && opacity > 0.05 ? "auto" : "none";
    }
  }, []);

  const notify = useCallback(
    (idx: number) => {
      setActive(idx);
      onChangeRef.current?.(idx, data[idx]);
    },
    [data]
  );

  const tweenTo = useCallback(
    (target: number, animate: boolean) => {
      tweenRef.current?.kill();
      const cfg = cfgRef.current;
      const proxy = { p: posRef.current };
      const dur = animate && !reducedRef.current ? cfg.duration / 1000 : 0;
      tweenRef.current = gsap.to(proxy, {
        p: target,
        duration: dur,
        ease: cfg.ease,
        onUpdate: () => {
          posRef.current = proxy.p;
          layout(proxy.p);
        },
        onComplete: () => {
          const n = cfg.count;
          if (n > 0) posRef.current = ((posRef.current % n) + n) % n;
          layout(posRef.current);
        },
      });
    },
    [layout]
  );

  const setFocus = useCallback(
    (rawIndex: number, animate = true) => {
      const cfg = cfgRef.current;
      const n = cfg.count;
      if (!n) return;
      const idx = cfg.loop ? ((rawIndex % n) + n) % n : clamp(rawIndex, 0, n - 1);
      let delta = idx - (posRef.current % n);
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      tweenTo(posRef.current + delta, animate);
      if (idx !== focusRef.current) {
        focusRef.current = idx;
        notify(idx);
      }
    },
    [tweenTo, notify]
  );

  // Sync with external activeIndex prop (e.g., from map selection)
  useEffect(() => {
    if (activeIndex !== undefined && activeIndex !== focusRef.current) {
      setFocus(activeIndex, true);
    }
  }, [activeIndex, setFocus]);

  const navigateBy = useCallback(
    (step: number) => setFocus(focusRef.current + step, true),
    [setFocus]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const cfg = cfgRef.current;

      if (w >= 768) {
        // On desktop, stretch cascading cards to comfortably fill the empty space to the right
        const cardLeft = w * 0.18;
        const availableRight = w - cardLeft - 130;
        const steps = Math.max(1, cfg.visibleCards - 1);
        const stretchedSpread = clamp(Math.round(availableRight / steps), 110, 175);
        spreadRef.current = Math.max(cfg.spread, stretchedSpread);
        scaleRef.current = 1;
      } else {
        // On tablet and mobile viewports, keep spread compact and scale gently
        spreadRef.current = clamp(Math.round(w * 0.14), 60, 95);
        scaleRef.current = clamp(w / 520, 0.72, 1);
      }

      layout(posRef.current);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [layout]);

  // Safe horizontal wheel navigation (does NOT block vertical page scrolling)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const cfg = cfgRef.current;
      if (cfg.count < 2) return;

      // Allow normal vertical page scrolling! Only intercept predominantly horizontal wheel gestures
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) {
        return;
      }

      e.preventDefault();
      tweenRef.current?.kill();
      const step = clamp(e.deltaX / (cfg.cardWidth * 0.9), -0.6, 0.6);
      posRef.current += step;
      layout(posRef.current);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => setFocus(Math.round(posRef.current), true), 130);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [layout, setFocus]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const cfg = cfgRef.current;
    if (cfg.count < 2) return;
    tweenRef.current?.kill();
    dragRef.current = {
      x: e.clientX,
      startPos: posRef.current,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const cfg = cfgRef.current;
      const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (!drag.moved) return;
      const now = performance.now();
      const dt = Math.max(now - drag.lastT, 1);
      drag.v = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = now;
      posRef.current = drag.startPos - dx / stepPx;
      layout(posRef.current);
    },
    [layout]
  );

  const onPointerEnd = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    const cfg = cfgRef.current;
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
    const projected = posRef.current - (drag.v * 180) / stepPx;
    setFocus(Math.round(projected), true);
  }, [setFocus]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateBy(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateBy(1);
      }
    },
    [navigateBy]
  );

  const onCardClick = useCallback(
    (index: number) => {
      if (dragRef.current?.moved) return;
      // If clicking a background card, bring it to the foreground
      if (index !== focusRef.current) {
        setFocus(index, true);
      }
    },
    [setFocus]
  );

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!autoplay || reducedRef.current || count < 2) return;
    const root = rootRef.current;
    let hovered = false;
    let focused = false;
    const stop = () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    const start = () => {
      stop();
      autoTimerRef.current = setInterval(() => {
        if (!hovered && !focused) navigateBy(1);
      }, Math.max(cfgRef.current.autoplayDelay, 600));
    };
    const onEnter = () => {
      hovered = true;
    };
    const onLeave = () => {
      hovered = false;
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = () => {
      focused = false;
    };
    root?.addEventListener("mouseenter", onEnter);
    root?.addEventListener("mouseleave", onLeave);
    root?.addEventListener("focusin", onFocusIn);
    root?.addEventListener("focusout", onFocusOut);
    start();
    return () => {
      stop();
      root?.removeEventListener("mouseenter", onEnter);
      root?.removeEventListener("mouseleave", onLeave);
      root?.removeEventListener("focusin", onFocusIn);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [autoplay, autoplayDelay, count, navigateBy]);

  useEffect(() => {
    layout(posRef.current);
  }, [
    layout,
    depth,
    spread,
    tilt,
    tiltDirection,
    visibleCards,
    falloff,
    blur,
    cardWidth,
    cardHeight,
    radius,
    count,
  ]);

  useEffect(
    () => () => {
      tweenRef.current?.kill();
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    },
    []
  );

  return (
    <div
      ref={rootRef}
      className={`depth-carousel ${className}`.trim()}
      style={{ "--dc-perspective": `${perspective}px` } as React.CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label="Kerala Destinations 3D Depth Carousel"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div className="depth-carousel__stage" ref={stageRef}>
        {data.map((item, i) => {
          const isCenter = active === i;
          const displayName = item.slug === "fort-kochi" ? "KOCHI" : item.name.toUpperCase();

          return (
            <div
              key={item.id || i}
              className={`depth-carousel__card${isCenter ? " is-active" : " is-receding"}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count} - ${item.name}`}
              aria-hidden={!isCenter}
              onClick={() => onCardClick(i)}
            >
              {/* Full-bleed Destination Image */}
              <img
                className="depth-carousel__img"
                src={item.image}
                alt={`${item.name} — Kerala`}
                draggable={false}
                loading={i < 3 ? "eager" : "lazy"}
              />

              {/* Editorial Gradient Scrim matching the first explore section card */}
              <div className="depth-carousel__scrim" />

              {/* Center (Active) Card Top: Location Label + Divider Line */}
              <div className="depth-carousel__center-top">
                <span className="depth-carousel__loc-label">KERALA, INDIA</span>
                <span className="depth-carousel__loc-line" />
              </div>

              {/* Center (Active) Card Bottom: Spaced Serif Title, Tagline & Explore CTA with Gold Line */}
              <div className="depth-carousel__center-bottom">
                <h3 className="depth-carousel__center-title">{displayName}</h3>
                <p className="depth-carousel__center-tagline">{item.tagline}</p>
                <Link
                  href={`/destinations/${item.slug}`}
                  className="depth-carousel__explore-cta"
                  onClick={(e: React.MouseEvent) => {
                    if (!isCenter) {
                      e.preventDefault();
                      setFocus(i, true);
                    }
                  }}
                >
                  <span className="depth-carousel__cta-text">EXPLORE →</span>
                  <span className="depth-carousel__cta-gold-line" />
                </Link>
              </div>

              {/* Side (Receding) Cards: Destination name at bottom-left with gold underline */}
              <div className="depth-carousel__side-caption">
                <span className="depth-carousel__side-dest-name">{displayName}</span>
                <span className="depth-carousel__side-gold-line" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Flanking Circular Navigation Arrows */}
      {showControls && count > 1 && (
        <>
          <button
            type="button"
            className="depth-carousel__arrow depth-carousel__arrow--prev"
            aria-label="Previous destination"
            onClick={(e) => {
              e.stopPropagation();
              navigateBy(-1);
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="depth-carousel__arrow depth-carousel__arrow--next"
            aria-label="Next destination"
            onClick={(e) => {
              e.stopPropagation();
              navigateBy(1);
            }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Bottom Indicators */}
      {showIndicators && count > 1 && (
        <div className="depth-carousel__dots" role="tablist" aria-label="Destination slides">
          {data.map((item, i) => (
            <button
              key={item.id || i}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Go to ${item.name} (${i + 1} of ${count})`}
              className={`depth-carousel__dot${active === i ? " is-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setFocus(i, true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
