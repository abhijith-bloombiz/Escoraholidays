import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import type { Destination } from "@workspace/api-client-react";
import "./Destination360Experience.css";

export interface Destination360Item {
  id: string;
  name: string;
  location: string;
  category: string;
  slug: string;
  image: string;
  thumb: string;
  panorama: string;
  description: string;
}

export const DESTINATIONS_360: Destination360Item[] = [
  {
    id: "alleppey",
    name: "Alleppey",
    location: "Alappuzha, Kerala",
    category: "Backwaters",
    slug: "alleppey",
    image: "/assets/360/alleppey.jpg",
    thumb: "/assets/360/thumbs/alleppey.jpg",
    panorama: "/assets/360/alleppey.jpg",
    description: "Cruise along emerald backwaters and palm-fringed lagoons on an authentic luxury kettuvallam.",
  },
  {
    id: "munnar",
    name: "Munnar",
    location: "Munnar, Kerala",
    category: "Hill Stations",
    slug: "munnar",
    image: "/assets/360/munnar.jpg",
    thumb: "/assets/360/thumbs/munnar.jpg",
    panorama: "/assets/360/munnar.jpg",
    description: "Misty tea gardens, rolling Western Ghats peaks, and cool mountain breezes at sunrise.",
  },
  {
    id: "wayanad",
    name: "Wayanad",
    location: "Wayanad, Kerala",
    category: "Nature & Wildlife",
    slug: "wayanad",
    image: "/assets/360/wayanad.jpg",
    thumb: "/assets/360/thumbs/wayanad.jpg",
    panorama: "/assets/360/wayanad.jpg",
    description: "Jungle sanctuaries, wild elephant herds, mist-shrouded peaks, and ancient rock caves.",
  },
  {
    id: "varkala",
    name: "Varkala",
    location: "Varkala, Kerala",
    category: "Cliffs & Beaches",
    slug: "varkala",
    image: "/assets/360/varkala.jpg",
    thumb: "/assets/360/thumbs/varkala.jpg",
    panorama: "/assets/360/varkala.jpg",
    description: "Dramatic red laterite cliffs towering above the turquoise Arabian Sea with sunset vistas.",
  },
  {
    id: "kovalam",
    name: "Kovalam",
    location: "Kovalam, Kerala",
    category: "Beaches",
    slug: "kovalam",
    image: "/assets/360/kovalam.jpg",
    thumb: "/assets/360/thumbs/kovalam.jpg",
    panorama: "/assets/360/kovalam.jpg",
    description: "Golden crescent shores, iconic red-and-white striped lighthouse, and warm sea surf.",
  },
  {
    id: "thekkady",
    name: "Thekkady",
    location: "Thekkady, Kerala",
    category: "Wildlife & Forests",
    slug: "thekkady",
    image: "/assets/360/thekkady.jpg",
    thumb: "/assets/360/thumbs/thekkady.jpg",
    panorama: "/assets/360/thekkady.jpg",
    description: "Periyar lake sanctuary, elephant herds grazing by the water, and cardamom-scented forests.",
  },
];

/* ── Interactive 360° Spherical Panorama Modal (Three.js) ── */
function PanoramaModal({
  dest,
  onClose,
  initialFov = 75,
}: {
  dest: Destination360Item;
  onClose: () => void;
  initialFov?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState(initialFov);

  useEffect(() => {
    let isDisposed = false;
    let cleanupFn: (() => void) | undefined;

    import("three").then((THREE) => {
      if (isDisposed || !containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(zoomLevel, width / height, 1, 1100);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      rendererRef.current = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(dest.panorama, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      });

      let isUserInteracting = false;
      let onPointerDownMouseX = 0;
      let onPointerDownMouseY = 0;
      let lon = 0;
      let onPointerDownLon = 0;
      let lat = 0;
      let onPointerDownLat = 0;
      let phi = 0;
      let theta = 0;

      function onPointerDown(event: PointerEvent) {
        isUserInteracting = true;
        onPointerDownMouseX = event.clientX;
        onPointerDownMouseY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
      }

      function onPointerMove(event: PointerEvent) {
        if (!isUserInteracting) return;
        lon = (onPointerDownMouseX - event.clientX) * 0.15 + onPointerDownLon;
        lat = (event.clientY - onPointerDownMouseY) * 0.15 + onPointerDownLat;
      }

      function onPointerUp() {
        isUserInteracting = false;
      }

      function onWheel(event: WheelEvent) {
        event.preventDefault();
        camera.fov = Math.max(35, Math.min(100, camera.fov + event.deltaY * 0.05));
        camera.updateProjectionMatrix();
        setZoomLevel(Math.round(camera.fov));
      }

      function onResize() {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }

      container.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      container.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("resize", onResize);

      let reqId: number;
      function animate() {
        reqId = requestAnimationFrame(animate);

        // Subtle ambient drift when not dragging
        if (!isUserInteracting) {
          lon += 0.035;
        }

        lat = Math.max(-85, Math.min(85, lat));
        phi = THREE.MathUtils.degToRad(90 - lat);
        theta = THREE.MathUtils.degToRad(lon);

        const targetX = 500 * Math.sin(phi) * Math.cos(theta);
        const targetY = 500 * Math.cos(phi);
        const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

        camera.lookAt(targetX, targetY, targetZ);
        renderer.render(scene, camera);
      }
      animate();

      cleanupFn = () => {
        cancelAnimationFrame(reqId);
        container.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("wheel", onWheel);
        window.removeEventListener("resize", onResize);
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        geometry.dispose();
      };
    });

    return () => {
      isDisposed = true;
      if (cleanupFn) cleanupFn();
    };
  }, [dest]);

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newFov = Math.max(35, Math.min(100, cameraRef.current.fov + delta));
    cameraRef.current.fov = newFov;
    cameraRef.current.updateProjectionMatrix();
    setZoomLevel(Math.round(newFov));
  };

  return (
    <div className="dest-360-modal-overlay" role="dialog" aria-modal="true" aria-label={`360 Panorama - ${dest.name}`}>
      <div className="dest-360-modal-header">
        <div className="dest-360-modal-badge">
          <span className="dest-360-modal-title">{dest.name}</span>
          <span className="dest-360-modal-sep">·</span>
          <span className="dest-360-modal-cat">{dest.category}</span>
        </div>
        <div className="dest-360-modal-actions">
          <button
            type="button"
            className="dest-360-modal-btn"
            onClick={() => handleZoom(-10)}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="dest-360-modal-btn"
            onClick={() => handleZoom(10)}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="dest-360-modal-close"
            onClick={onClose}
            aria-label="Close 360 viewer"
          >
            ✕ CLOSE 360°
          </button>
        </div>
      </div>

      <div ref={containerRef} className="dest-360-canvas-wrap" />

      <div className="dest-360-modal-footer">
        <span className="dest-360-drag-tip">↔ Drag or swipe to look around in 360° · Scroll to zoom</span>
      </div>
    </div>
  );
}

export interface Destination360ExperienceProps {
  destinations?: Destination[];
}

const DESTINATION_ALIASES: Record<string, string[]> = {
  kochi: ["kochi", "fort-kochi"],
  "fort-kochi": ["kochi", "fort-kochi"],
  alleppey: ["alleppey", "alappuzha"],
  alappuzha: ["alleppey", "alappuzha"],
};

function findMatchingDestination(
  destinations: Destination[] | undefined,
  localId: string,
  localSlug: string,
  localName?: string
): Destination | undefined {
  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return undefined;
  }

  const normId = localId.toLowerCase().trim();
  const normSlug = localSlug.toLowerCase().trim();
  const aliases = new Set<string>([
    normId,
    normSlug,
    ...(DESTINATION_ALIASES[normId] || []),
    ...(DESTINATION_ALIASES[normSlug] || []),
  ]);

  // 1. Direct match on slug / alias
  let match = destinations.find((d) => d?.slug && aliases.has(d.slug.toLowerCase().trim()));
  if (match) return match;

  // 2. Fallback match on name
  if (localName) {
    const normName = localName.toLowerCase().trim();
    match = destinations.find((d) => {
      if (!d?.name) return false;
      const dbNormName = d.name.toLowerCase().trim();
      return (
        dbNormName === normName ||
        (normId === "kochi" && (dbNormName === "fort kochi" || dbNormName === "kochi")) ||
        (normId === "alleppey" && (dbNormName === "alappuzha" || dbNormName === "alleppey"))
      );
    });
    if (match) return match;
  }

  return undefined;
}

export default function Destination360Experience({ destinations }: Destination360ExperienceProps = {}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [is360Active, setIs360Active] = useState(false);
  const [stagePanX, setStagePanX] = useState(0);
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [stageZoom, setStageZoom] = useState(1);
  const stageDragStart = useRef<number | null>(null);
  const stagePanStart = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Merge published API destination data into DESTINATIONS, keeping local fallbacks and local panorama assets
  const items = useMemo<Destination360Item[]>(() => {
    return DESTINATIONS_360.map((item) => {
      const dbMatch = findMatchingDestination(destinations, item.id, item.slug, item.name);
      if (!dbMatch) return item;

      // Safe cover image verification for slide backdrop
      const validCoverImage =
        dbMatch.imageUrl && typeof dbMatch.imageUrl === "string" && dbMatch.imageUrl.trim().length > 0
          ? dbMatch.imageUrl.trim()
          : item.image;

      // Safe region/location label
      let location = item.location;
      if (dbMatch.region && typeof dbMatch.region === "string" && dbMatch.region.trim().length > 0) {
        const trimmedRegion = dbMatch.region.trim();
        location = trimmedRegion.toLowerCase().includes("kerala")
          ? trimmedRegion
          : `${trimmedRegion}, Kerala`;
      }

      return {
        ...item,
        name: dbMatch.name?.trim() ? dbMatch.name.trim() : item.name,
        category: dbMatch.type?.trim() ? dbMatch.type.trim() : item.category,
        description: dbMatch.shortDesc?.trim() || dbMatch.description?.trim() || item.description,
        slug: dbMatch.slug?.trim() ? dbMatch.slug.trim() : item.slug,
        location,
        image: validCoverImage,
        // STRICT REQUIREMENT: Keep local panorama asset for Three.js sphere texture.
        // Never overwrite with 2D admin imageUrl.
        panorama: item.panorama,
      };
    });
  }, [destinations]);

  const activeDest = items[activeIdx] || items[0] || DESTINATIONS_360[0];
  const total = items.length;

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Keep active card centered in the bottom carousel track
  useEffect(() => {
    if (!trackRef.current) return;
    const activeEl = trackRef.current.children[activeIdx] as HTMLElement;
    if (activeEl) {
      const container = trackRef.current;
      const scrollTarget = activeEl.offsetLeft - (container.clientWidth - activeEl.clientWidth) / 2;
      container.scrollTo({ left: scrollTarget, behavior: "smooth" });
    }
  }, [activeIdx]);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  // Stage pointer drag panning
  const handleStagePointerDown = (e: React.PointerEvent) => {
    setIsDraggingStage(true);
    stageDragStart.current = e.clientX;
    stagePanStart.current = stagePanX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingStage || stageDragStart.current === null) return;
    const delta = e.clientX - stageDragStart.current;
    // Bound the horizontal pan
    const maxPan = 140;
    const newPan = Math.max(-maxPan, Math.min(maxPan, stagePanStart.current + delta * 0.45));
    setStagePanX(newPan);
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    if (isDraggingStage) {
      setIsDraggingStage(false);
      stageDragStart.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleZoomIn = () => {
    setStageZoom((prev) => Math.min(prev + 0.12, 1.35));
  };

  const handleZoomOut = () => {
    setStageZoom((prev) => Math.max(prev - 0.12, 1.0));
  };

  const resetCompass = () => {
    setStagePanX(0);
    setStageZoom(1);
  };

  return (
    <section
      className="dest-360-section"
      id="dest-360"
      aria-label="360° Destination Experience"
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="region"
    >
      {/* ── Full-Bleed Section 360 Background Viewport ── */}
      <div
        className={`dest-360-stage-viewport ${isDraggingStage ? "is-dragging" : ""}`}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
      >
        {items.map((dest, idx) => {
              const isActive = activeIdx === idx;
              return (
                <div
                  key={dest.id}
                  className={`dest-360-bg-slide ${isActive ? "is-active" : ""}`}
                  style={{
                    backgroundImage: `url(${dest.image})`,
                    transform: `scale(${stageZoom}) translateX(${stagePanX}px)`,
                  }}
                  aria-hidden={!isActive}
                />
              );
            })}

            {/* Left Atmospheric Shadow for Text Readability */}
            <div className="dest-360-gradient-left" aria-hidden="true" />
            {/* Top Subtle Vignette */}
            <div className="dest-360-gradient-top" aria-hidden="true" />
            {/* Bottom Horizon Fade into Cards Tray */}
            <div className="dest-360-gradient-bottom" aria-hidden="true" />

            {/* ── Top-Left Editorial Content Overlay ── */}
            <div className="dest-360-editorial-block">
              {/* Eyebrow Label with 02 and Dash */}
              <div className="dest-360-eyebrow">
                <span className="dest-360-eyebrow-icon">✦</span>
                <span className="dest-360-eyebrow-num">02</span>
                <span className="dest-360-eyebrow-dash" />
                <span className="dest-360-eyebrow-text">360° DESTINATION EXPERIENCE</span>
              </div>

              {/* Headline with Serif Italic 'Every Angle.' */}
              <h2 className="dest-360-heading">
                See Kerala from<br />
                <em>Every Angle.</em>
              </h2>

              {/* Subtitle Paragraph */}
              <p className="dest-360-desc">
                Explore breathtaking destinations in immersive 360° views and get a real feel for the places before you visit.
              </p>

              {/* Golden Pill CTA Button */}
              <button
                type="button"
                className="dest-360-cta-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIs360Active(true);
                }}
                aria-label={`Explore ${activeDest.name} in 360 degrees`}
              >
                <span className="dest-360-play-icon" aria-hidden="true">▶</span>
                <span className="dest-360-cta-text">EXPLORE IN 360°</span>
                <span className="dest-360-cta-arrow" aria-hidden="true">→</span>
              </button>
            </div>

            {/* ── Center-Right Interactive 360 Indicator Badge ── */}
            <div
              className="dest-360-center-badge-wrap"
              onClick={(e) => {
                e.stopPropagation();
                setIs360Active(true);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Launch interactive 360 view of ${activeDest.name}`}
            >
              <div className="dest-360-circle-indicator">
                <svg viewBox="0 0 80 80" className="dest-360-circle-svg" fill="none" aria-hidden="true">
                  {/* Top-Right Arc with Arrowhead */}
                  <path
                    d="M 40 10 A 30 30 0 0 1 70 40"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <polygon points="70,40 76,33 66,35" fill="#ffffff" />

                  {/* Bottom-Left Arc with Arrowhead */}
                  <path
                    d="M 40 70 A 30 30 0 0 1 10 40"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <polygon points="10,40 4,47 14,45" fill="#ffffff" />
                </svg>
                <span className="dest-360-degree-number">360°</span>
              </div>
              <span className="dest-360-drag-label">DRAG TO EXPLORE</span>
            </div>

            {/* ── Right-Edge Floating Glass Tools Stack ── */}
            <div className="dest-360-right-tools" onClick={(e) => e.stopPropagation()}>
              {/* 1. Compass Rose */}
              <button
                type="button"
                className="dest-360-tool-btn dest-360-compass-btn"
                onClick={resetCompass}
                title="Reset orientation"
                aria-label="Compass Orientation"
              >
                <svg viewBox="0 0 36 36" width="22" height="22" fill="none" aria-hidden="true">
                  <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 3" />
                  <text x="18" y="7" textAnchor="middle" fill="#ffffff" fontSize="5.8" fontWeight="bold">N</text>
                  <text x="30" y="20" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="5.8">E</text>
                  <text x="18" y="32" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="5.8">S</text>
                  <text x="6" y="20" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="5.8">W</text>
                  <polygon points="18,9 20.5,18 18,16" fill="#e0aa48" />
                  <polygon points="18,27 20.5,18 18,16" fill="rgba(255,255,255,0.6)" />
                  <polygon points="18,9 15.5,18 18,16" fill="#f5cf7a" />
                  <polygon points="18,27 15.5,18 18,16" fill="rgba(255,255,255,0.3)" />
                </svg>
              </button>

              {/* 2. Zoom In */}
              <button
                type="button"
                className="dest-360-tool-btn"
                onClick={handleZoomIn}
                title="Zoom in"
                aria-label="Zoom in"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>

              {/* 3. Zoom Out */}
              <button
                type="button"
                className="dest-360-tool-btn"
                onClick={handleZoomOut}
                title="Zoom out"
                aria-label="Zoom out"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M5 12h14" />
                </svg>
              </button>

              {/* 4. Fullscreen */}
              <button
                type="button"
                className="dest-360-tool-btn"
                onClick={() => setIs360Active(true)}
                title="Fullscreen 360 view"
                aria-label="Open fullscreen 360 panorama"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8V5a2 2 0 0 1 2-2h3M19 3h3a2 2 0 0 1 2 2v3M24 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Bottom Destination Carousel / Card Tray ── */}
          <div className="dest-360-bottom-tray">
            {/* Left Chevron Button */}
            <button
              type="button"
              className="dest-360-nav-arrow dest-360-nav-arrow--prev"
              onClick={handlePrev}
              aria-label="Previous destination"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Destination Cards Track */}
            <div className="dest-360-cards-track" ref={trackRef}>
              {items.map((dest, idx) => {
                const isActive = activeIdx === idx;
                return (
                  <div
                    key={dest.id}
                    className={`dest-360-card ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveIdx(idx)}
                    role="button"
                    tabIndex={0}
                    aria-selected={isActive}
                    aria-label={`View ${dest.name} - ${dest.category}`}
                  >
                    <img
                      src={dest.thumb}
                      alt={dest.name}
                      className="dest-360-card-img"
                      loading="lazy"
                    />
                    <div className="dest-360-card-gradient" />
                    <div className="dest-360-card-content">
                      <h3 className="dest-360-card-title">{dest.name}</h3>
                      <p className="dest-360-card-category">{dest.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Chevron Button */}
            <button
              type="button"
              className="dest-360-nav-arrow dest-360-nav-arrow--next"
              onClick={handleNext}
              aria-label="Next destination"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

      {/* ── Interactive 360° Spherical Panorama Modal (Three.js) ── */}
      {is360Active && (
        <PanoramaModal dest={activeDest} onClose={() => setIs360Active(false)} />
      )}
    </section>
  );
}
