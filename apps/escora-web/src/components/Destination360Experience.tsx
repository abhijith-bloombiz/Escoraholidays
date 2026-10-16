import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import type { Destination } from "@workspace/api-client-react";
import "./Destination360Experience.css";

// ── Destination Image Assets ──
import munnarImg from "@assets/escora/destinations/munnar.jpg";
import wayanadImg from "@assets/escora/destinations/wayanad.jpg";
import kovalamImg from "@assets/escora/destinations/kovalam.jpg";
import varkalaImg from "@assets/escora/destinations/varkala.jpg";

interface Destination360Item {
  id: string;
  name: string;
  location: string;
  category: string;
  slug: string;
  image: string;
  panorama: string;
  description: string;
}

const DESTINATIONS: Destination360Item[] = [
  {
    id: "alleppey",
    name: "Alleppey",
    location: "Alappuzha, Kerala",
    category: "Backwaters",
    slug: "alleppey",
    image: "/assets/enquiry-sunset.jpg",
    panorama: "/assets/enquiry-sunset.jpg",
    description: "Cruise along emerald backwaters and palm-fringed lagoons on a luxury kettuvallam.",
  },
  {
    id: "munnar",
    name: "Munnar",
    location: "Munnar, Kerala",
    category: "Hill Station",
    slug: "munnar",
    image: munnarImg,
    panorama: munnarImg,
    description: "Misty tea gardens, rolling Western Ghats peaks, and cool mountain breezes.",
  },
  {
    id: "varkala",
    name: "Varkala",
    location: "Varkala, Kerala",
    category: "Coastal Cliffs",
    slug: "varkala",
    image: varkalaImg,
    panorama: varkalaImg,
    description: "Dramatic red laterite cliffs towering above the Arabian Sea with panoramic sunset coastal vistas.",
  },
  {
    id: "wayanad",
    name: "Wayanad",
    location: "Wayanad, Kerala",
    category: "Nature & Wildlife",
    slug: "wayanad",
    image: wayanadImg,
    panorama: wayanadImg,
    description: "Jungle sanctuaries, mist-shrouded peaks, ancient rock caves, and spice plantations.",
  },
  {
    id: "kovalam",
    name: "Kovalam",
    location: "Kovalam, Kerala",
    category: "Beaches",
    slug: "kovalam",
    image: kovalamImg,
    panorama: kovalamImg,
    description: "Golden crescent shores, red-and-white lighthouse, and Arabian Sea surf.",
  },
];

/* ── Interactive 360° Panorama Viewer Component (Dynamic Three.js) ── */
function PanoramaModal({
  dest,
  onClose,
}: {
  dest: Destination360Item;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isDisposed = false;
    let cleanupFn: (() => void) | undefined;

    // Dynamically import Three.js only when modal opens
    import("three").then((THREE) => {
      if (isDisposed || !containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. Scene & Camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);

      // 2. Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // 3. 360° Inverted Sphere Geometry
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);

      // 4. Texture Loader
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(dest.panorama, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      });

      // 5. Interaction State (Drag / Touch Pan)
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
      window.addEventListener("resize", onResize);

      // 6. Animation Loop
      let reqId: number;
      function animate() {
        reqId = requestAnimationFrame(animate);

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

  return (
    <div className="dest-360-modal-overlay" role="dialog" aria-modal="true" aria-label={`360 Panorama - ${dest.name}`}>
      <div className="dest-360-modal-header">
        <div className="dest-360-modal-badge">
          <span>{dest.name}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ color: "#c59a58" }}>{dest.category}</span>
        </div>
        <button type="button" className="dest-360-modal-close" onClick={onClose} aria-label="Close 360 viewer">
          ✕ CLOSE 360°
        </button>
      </div>

      <div ref={containerRef} className="dest-360-canvas-wrap" />

      <div className="dest-360-modal-footer">
        <span>↔ Drag or swipe to look 360° around {dest.name}</span>
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
  const touchStartX = useRef<number | null>(null);

  // Merge published API destination data into DESTINATIONS, keeping local fallbacks and local panorama assets
  const items = useMemo<Destination360Item[]>(() => {
    return DESTINATIONS.map((item) => {
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

  const activeDest = items[activeIdx] || items[0] || DESTINATIONS[0];
  const total = items.length;

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  return (
    <section className="dest-360-section" id="dest-360" aria-label="360° Destination Experience">
      <div className="dest-360-container">
        {/* ── Main Stage Card (Full-Width Immersive Carousel) ── */}
        <div
          className="dest-360-stage-card"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="region"
          aria-label="360° Destination Experience Carousel"
        >
          {/* Panoramic Scenery Backdrop Slides with Cross-Fade */}
          {items.map((dest, idx) => (
            <div
              key={dest.id}
              className={`dest-360-bg-slide ${activeIdx === idx ? "is-active" : ""}`}
              style={{ backgroundImage: `url(${dest.image})` }}
              aria-hidden={activeIdx !== idx}
            />
          ))}

          {/* Soft Left-To-Right Mist Gradient & Bottom Contrast Vignette */}
          <div className="dest-360-bg-gradient" aria-hidden="true" />
          <div className="dest-360-bg-vignette" aria-hidden="true" />

          {/* ── Side Navigation Arrows (Left & Right Edges, Vertically Centered) ── */}
          <button
            type="button"
            className="dest-360-edge-arrow dest-360-edge-arrow--prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous destination"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className="dest-360-edge-arrow dest-360-edge-arrow--next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next destination"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* ── Top Left Editorial Content ── */}
          <div className="dest-360-top-row">
            <div className="dest-360-editorial">
              <div className="dest-360-eyebrow">
                <span className="dest-360-eyebrow-line" />
                360° DESTINATION EXPERIENCE
              </div>
              <h2 className="dest-360-heading">
                See Kerala from<br />
                <em>Every</em> Angle.
              </h2>
              <p className="dest-360-desc">
                Explore breathtaking destinations in immersive 360° views and get a real feel of the place before you plan your journey.
              </p>
              <Link href={`/destinations/${activeDest.slug}`} className="dest-360-explore-btn">
                <span>Explore Kerala</span>
                <span className="dest-360-btn-arrow-circle">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* ── Center 360° Indicator Graphic (Interactive Trigger) ── */}
          <div
            className="dest-360-center-indicator"
            onClick={() => setIs360Active(true)}
            role="button"
            tabIndex={0}
            aria-label={`Explore ${activeDest.name} in 360 degrees`}
          >
            <div className="dest-360-rotate-text">
              <span className="dest-360-arrow-left">←</span>
              <span className="dest-360-degree-num">360°</span>
              <span className="dest-360-arrow-right">→</span>
            </div>
            <div className="dest-360-arc-graphic">
              <svg viewBox="0 0 260 70" className="dest-360-arc-svg" fill="none">
                <path
                  d="M 18 52 C 75 12, 185 12, 242 52"
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth="1.6"
                  strokeDasharray="4 4"
                />
                <path d="M 14 52 L 24 45 M 14 52 L 26 55" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M 246 52 L 236 45 M 246 52 L 234 55" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <div className="dest-360-hand-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                  <path d="M18 10a2 2 0 0 1 2 2v3a7 7 0 0 1-7 7h-2a7 7 0 0 1-5.3-2.4L4.2 17.5a1.5 1.5 0 0 1 2.1-2.1L8 17" />
                </svg>
              </div>
            </div>
            <span className="dest-360-drag-label">DRAG TO EXPLORE</span>
          </div>

          {/* ── Bottom Section: Feature Pills + Sub-bar (Counter, Dash Pagination, Location) ── */}
          <div className="dest-360-bottom-wrapper">
            {/* 4 Feature Pills */}
            <div className="dest-360-features-row">
              <div className="dest-360-feature-item">
                <div className="dest-360-feat-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b58d4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="14" x="3" y="5" rx="2" />
                    <circle cx="8" cy="10" r="1.5" />
                    <path d="m21 15-5-4-5 5" />
                  </svg>
                </div>
                <div className="dest-360-feat-text">
                  <strong>IMMERSIVE</strong>
                  <span>360° VIEWS</span>
                </div>
              </div>

              <div className="dest-360-feature-item">
                <div className="dest-360-feat-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b58d4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#b58d4a" stroke="none" />
                  </svg>
                </div>
                <div className="dest-360-feat-text">
                  <strong>REAL</strong>
                  <span>DESTINATIONS</span>
                </div>
              </div>

              <div className="dest-360-feature-item">
                <div className="dest-360-feat-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b58d4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="dest-360-feat-text">
                  <strong>FEEL THE</strong>
                  <span>ATMOSPHERE</span>
                </div>
              </div>

              <div className="dest-360-feature-item">
                <div className="dest-360-feat-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b58d4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <div className="dest-360-feat-text">
                  <strong>PLAN WITH</strong>
                  <span>CONFIDENCE</span>
                </div>
              </div>
            </div>

            {/* Bottom Meta Row: Left Slide Counter, Center Dash Dots, Right Location Label */}
            <div className="dest-360-meta-bar">
              {/* Left Slide Counter */}
              <div className="dest-360-counter" aria-label={`Slide ${activeIdx + 1} of ${total}`}>
                <span className="dest-360-counter-num">{String(activeIdx + 1).padStart(2, "0")}</span>
                <span className="dest-360-counter-line" />
                <span className="dest-360-counter-num dest-360-counter-total">{String(total).padStart(2, "0")}</span>
              </div>

              {/* Center Dash Dots */}
              <div className="dest-360-pagination" role="tablist" aria-label="Destination slides">
                {items.map((dest, idx) => (
                  <button
                    key={dest.id}
                    type="button"
                    role="tab"
                    aria-selected={activeIdx === idx}
                    aria-label={`Go to slide ${idx + 1}: ${dest.name}`}
                    className={`dest-360-dash-dot ${activeIdx === idx ? "is-active" : ""}`}
                    onClick={() => setActiveIdx(idx)}
                  />
                ))}
              </div>

              {/* Right Location Label */}
              <div className="dest-360-location">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="dest-360-location-name">{activeDest.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive 360° Modal (Loaded on Demand) ── */}
      {is360Active && (
        <PanoramaModal dest={activeDest} onClose={() => setIs360Active(false)} />
      )}
    </section>
  );
}
