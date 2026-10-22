import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import * as THREE from "three";
import {
  X,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import "./Destination360Modal.css";

export interface Destination360ModalItem {
  id: string;
  num?: string;
  name: string;
  category?: string;
  tagline?: string;
  description?: string;
  slug: string;
  image?: string;
  associatedDistrict?: string;
  panorama?: string;
}

const DEFAULT_PANORAMAS: Record<string, string> = {
  munnar: "/assets/360/munnar.jpg",
  wayanad: "/assets/360/wayanad.jpg",
  kochi: "/assets/360/alleppey.jpg",
  "fort-kochi": "/assets/360/alleppey.jpg",
  alleppey: "/assets/360/alleppey.jpg",
  varkala: "/assets/360/varkala.jpg",
  thekkady: "/assets/360/thekkady.jpg",
  bekal: "/assets/360/kovalam.jpg",
  kovalam: "/assets/360/kovalam.jpg",
};

export interface Destination360ModalProps {
  isOpen: boolean;
  destination: Destination360ModalItem | null;
  destinations?: Destination360ModalItem[];
  onClose: () => void;
  onSelectDestination?: (dest: Destination360ModalItem) => void;
}

export default function Destination360Modal({
  isOpen,
  destination,
  destinations = [],
  onClose,
  onSelectDestination,
}: Destination360ModalProps) {
  const [currentDest, setCurrentDest] = useState<Destination360ModalItem | null>(destination);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(75);

  const modalRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Drag interaction refs
  const isDragging = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const targetLon = useRef(0);
  const targetLat = useRef(0);
  const velX = useRef(0);
  const velY = useRef(0);
  const lastPointer = useRef({ x: 0, y: 0, time: 0 });

  // Sync prop changes
  useEffect(() => {
    if (destination) {
      setCurrentDest(destination);
    }
  }, [destination]);

  // Handle destination panorama URL
  const getPanoramaUrl = useCallback((dest: Destination360ModalItem | null) => {
    if (!dest) return "/assets/360/munnar.jpg";
    if (dest.panorama) return dest.panorama;
    const key = dest.id?.toLowerCase() || dest.slug?.toLowerCase() || "";
    return DEFAULT_PANORAMAS[key] || DEFAULT_PANORAMAS.munnar;
  }, []);

  // Keyboard navigation & Esc listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsAutoRotate((prev) => !prev);
      } else if (e.key === "+" || e.key === "=") {
        handleZoom(-8);
      } else if (e.key === "-" || e.key === "_") {
        handleZoom(8);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (!trackRef.current || !currentDest) return;
    const activeEl = trackRef.current.querySelector(".dest-360-thumb-card.is-active") as HTMLElement;
    if (activeEl) {
      const container = trackRef.current;
      const scrollTarget = activeEl.offsetLeft - (container.clientWidth - activeEl.clientWidth) / 2;
      container.scrollTo({ left: scrollTarget, behavior: "smooth" });
    }
  }, [currentDest]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!isOpen || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (default FOV 75)
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.className = "dest-360-canvas";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Inverted Sphere geometry for 360 equirectangular viewing
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // Initial dummy material
    const material = new THREE.MeshBasicMaterial({ color: 0x05130b });
    const sphereMesh = new THREE.Mesh(geometry, material);
    sphereMeshRef.current = sphereMesh;
    scene.add(sphereMesh);

    // Load initial texture
    const textureLoader = new THREE.TextureLoader();
    const panoramaSrc = getPanoramaUrl(currentDest);
    setIsLoading(true);

    textureLoader.load(
      panoramaSrc,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        material.map = texture;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn("Failed to load 360 panorama, falling back to default:", err);
        textureLoader.load("/assets/360/munnar.jpg", (fallbackTex) => {
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          material.map = fallbackTex;
          material.color.setHex(0xffffff);
          material.needsUpdate = true;
          setIsLoading(false);
        });
      }
    );

    // Animation loop with inertia & auto-rotation
    let reqId: number;
    let headingTimer = 0;

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      // Handle drag inertia deceleration
      if (!isDragging.current) {
        if (Math.abs(velX.current) > 0.005) {
          targetLon.current += velX.current;
          velX.current *= 0.92;
        } else {
          velX.current = 0;
        }

        if (Math.abs(velY.current) > 0.005) {
          targetLat.current += velY.current;
          velY.current *= 0.92;
        } else {
          velY.current = 0;
        }

        // Ambient auto-rotation when user is idle
        if (isAutoRotate && velX.current === 0) {
          targetLon.current += 0.035;
        }
      }

      // Smooth interpolation
      lonRef.current += (targetLon.current - lonRef.current) * 0.15;
      latRef.current += (targetLat.current - latRef.current) * 0.15;

      // Clamp latitude to avoid pole flipping
      const clampedLat = Math.max(-85, Math.min(85, latRef.current));
      latRef.current = clampedLat;
      targetLat.current = Math.max(-85, Math.min(85, targetLat.current));

      const phi = THREE.MathUtils.degToRad(90 - clampedLat);
      const theta = THREE.MathUtils.degToRad(lonRef.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);

      // Update heading angle throttled for compass UI
      headingTimer++;
      if (headingTimer % 4 === 0) {
        const normalizedLon = ((Math.round(lonRef.current) % 360) + 360) % 360;
        setCurrentHeading(normalizedLon);
      }
    };
    animate();

    // Event listeners
    const handleResize = () => {
      if (!canvasContainerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      sphereMeshRef.current = null;
    };
  }, [isOpen]);

  // Load new panorama texture when currentDest changes
  useEffect(() => {
    if (!isOpen || !sphereMeshRef.current) return;

    const mesh = sphereMeshRef.current;
    const material = mesh.material as THREE.MeshBasicMaterial;
    const textureLoader = new THREE.TextureLoader();
    const panoramaSrc = getPanoramaUrl(currentDest);

    setIsLoading(true);
    textureLoader.load(
      panoramaSrc,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        material.map = texture;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
        setIsLoading(false);
      },
      undefined,
      () => {
        setIsLoading(false);
      }
    );
  }, [currentDest, isOpen, getPanoramaUrl]);

  // Pointer drag controls with velocity tracking
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    lastPointer.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    velX.current = 0;
    velY.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    targetLon.current -= dx * 0.16;
    targetLat.current += dy * 0.16;

    pointerStart.current = { x: e.clientX, y: e.clientY };

    const now = performance.now();
    const dt = Math.max(1, now - lastPointer.current.time);
    velX.current = -((e.clientX - lastPointer.current.x) / dt) * 1.8;
    velY.current = ((e.clientY - lastPointer.current.y) / dt) * 1.8;
    lastPointer.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY * 0.04);
  };

  // Zoom handler
  const handleZoom = (deltaFov: number) => {
    if (!cameraRef.current) return;
    const newFov = Math.max(35, Math.min(95, cameraRef.current.fov + deltaFov));
    cameraRef.current.fov = newFov;
    cameraRef.current.updateProjectionMatrix();
    setZoomLevel(Math.round(newFov));
  };

  // Reset to North / front
  const handleResetOrientation = () => {
    targetLon.current = 0;
    targetLat.current = 0;
    velX.current = 0;
    velY.current = 0;
    if (cameraRef.current) {
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
      setZoomLevel(75);
    }
  };

  // Toggle fullscreen
  const handleToggleFullscreen = async () => {
    if (!modalRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await modalRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  // Switch destination
  const handleSelectDest = (dest: Destination360ModalItem) => {
    setCurrentDest(dest);
    if (onSelectDestination) {
      onSelectDestination(dest);
    }
  };

  // Cycle prev/next destination
  const handlePrevDest = () => {
    if (!destinations.length || !currentDest) return;
    const currentIdx = destinations.findIndex((d) => d.id === currentDest.id);
    const nextIdx = currentIdx <= 0 ? destinations.length - 1 : currentIdx - 1;
    handleSelectDest(destinations[nextIdx]);
  };

  const handleNextDest = () => {
    if (!destinations.length || !currentDest) return;
    const currentIdx = destinations.findIndex((d) => d.id === currentDest.id);
    const nextIdx = currentIdx >= destinations.length - 1 ? 0 : currentIdx + 1;
    handleSelectDest(destinations[nextIdx]);
  };

  if (!isOpen || !currentDest) return null;

  return (
    <div
      ref={modalRef}
      className="dest-360-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`360 Panorama Viewer - ${currentDest.name}`}
    >
      {/* ── TOP HEADER / IDENTITY BAR ── */}
      <header className="dest-360-popup-header">
        {/* Left: Destination branding & tags */}
        <div className="dest-360-header-left">
          <div className="dest-360-live-pill">
            <span className="dest-360-pulse-dot" />
            <span>360° LIVE EXPLORER</span>
          </div>

          <div className="dest-360-header-info">
            <div className="dest-360-header-title-row">
              {currentDest.num && <span className="dest-360-header-num">{currentDest.num}</span>}
              <h2 className="dest-360-header-title">{currentDest.name}</h2>
              {currentDest.associatedDistrict && (
                <span className="dest-360-header-district">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  {currentDest.associatedDistrict}
                </span>
              )}
            </div>
            {currentDest.category && (
              <span className="dest-360-header-category">{currentDest.category}</span>
            )}
          </div>
        </div>

        {/* Right: Quick action buttons & Close */}
        <div className="dest-360-header-right">
          <Link
            href={`/destinations/${currentDest.slug}`}
            className="dest-360-view-guide-btn"
            target="_blank"
            rel="noopener noreferrer"
            title="Open complete destination guide in new tab"
          >
            <span>Destination Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            className="dest-360-close-btn"
            onClick={onClose}
            aria-label="Close 360 viewer"
            title="Close 360° View (Esc)"
          >
            <X className="w-4 h-4" />
            <span>CLOSE</span>
          </button>
        </div>
      </header>

      {/* ── 360 INTERACTIVE VIEWPORT ── */}
      <div
        className="dest-360-viewport-canvas"
        ref={canvasContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* ── AMBIENT VIGNETTES FOR IMMERSIVE DEPTH ── */}
      <div className="dest-360-vignette-top" aria-hidden="true" />
      <div className="dest-360-vignette-bottom" aria-hidden="true" />

      {/* ── LOADING SPINNER OVERLAY ── */}
      {isLoading && (
        <div className="dest-360-loading-overlay">
          <div className="dest-360-spinner" />
          <p className="dest-360-loading-text">Loading 360° Spherical Panorama…</p>
        </div>
      )}

      {/* ── FLOATING LUXURY CONTROLS HUD (Right Stack) ── */}
      <aside className="dest-360-hud-tools" aria-label="360 view controls">
        {/* 1. Compass Rose (Rotates to show orientation, resets on click) */}
        <button
          type="button"
          className="dest-360-hud-btn dest-360-compass-tool"
          onClick={handleResetOrientation}
          title="Reset to North Orientation"
          aria-label="Compass heading, click to reset orientation"
        >
          <div
            className="dest-360-compass-dial"
            style={{ transform: `rotate(${-currentHeading}deg)` }}
          >
            <Compass className="w-6 h-6 text-gold" />
          </div>
          <span className="dest-360-compass-text">{currentHeading}°</span>
        </button>

        {/* 2. Auto-Rotate Play/Pause Toggle */}
        <button
          type="button"
          className={`dest-360-hud-btn ${isAutoRotate ? "is-active" : ""}`}
          onClick={() => setIsAutoRotate((prev) => !prev)}
          title={isAutoRotate ? "Pause Auto-Rotation (Space)" : "Start Auto-Rotation (Space)"}
          aria-label={isAutoRotate ? "Pause panoramic rotation" : "Play panoramic rotation"}
        >
          {isAutoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="dest-360-hud-tooltip">
            {isAutoRotate ? "Pause Auto-Rotate" : "Auto-Rotate"}
          </span>
        </button>

        {/* 3. Zoom In (+) */}
        <button
          type="button"
          className="dest-360-hud-btn"
          onClick={() => handleZoom(-8)}
          title="Zoom In (+)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
          <span className="dest-360-hud-tooltip">Zoom In</span>
        </button>

        {/* 4. Zoom Out (−) */}
        <button
          type="button"
          className="dest-360-hud-btn"
          onClick={() => handleZoom(8)}
          title="Zoom Out (−)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
          <span className="dest-360-hud-tooltip">Zoom Out</span>
        </button>

        {/* 5. Reset View */}
        <button
          type="button"
          className="dest-360-hud-btn"
          onClick={handleResetOrientation}
          title="Reset view to default"
          aria-label="Reset orientation and zoom"
        >
          <RotateCw className="w-4 h-4" />
          <span className="dest-360-hud-tooltip">Reset View</span>
        </button>

        {/* 6. Fullscreen Toggle */}
        <button
          type="button"
          className="dest-360-hud-btn"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="dest-360-hud-tooltip">
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </span>
        </button>
      </aside>

      {/* ── DRAG INTERACTION HINT PILL ── */}
      <div className="dest-360-hint-pill">
        <span>↔ Drag or swipe to look around in 360° · Scroll to zoom</span>
      </div>

      {/* ── BOTTOM DESTINATION SWITCHER DOCK ── */}
      {destinations.length > 0 && (
        <div className="dest-360-bottom-dock">
          {/* Previous destination chevron */}
          <button
            type="button"
            className="dest-360-dock-arrow"
            onClick={handlePrevDest}
            aria-label="Previous destination"
            title="Previous destination"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Thumbnails Track */}
          <div className="dest-360-thumbs-track" ref={trackRef}>
            {destinations.map((dest) => {
              const isActive = dest.id === currentDest.id;
              return (
                <button
                  key={dest.id}
                  type="button"
                  className={`dest-360-thumb-card ${isActive ? "is-active" : ""}`}
                  onClick={() => handleSelectDest(dest)}
                  aria-selected={isActive}
                  aria-label={`Switch 360 view to ${dest.name}`}
                >
                  <img
                    src={dest.image || "/assets/360/munnar.jpg"}
                    alt={dest.name}
                    className="dest-360-thumb-img"
                    loading="lazy"
                  />
                  <div className="dest-360-thumb-scrim" />
                  <div className="dest-360-thumb-caption">
                    <span className="dest-360-thumb-num">{dest.num}</span>
                    <span className="dest-360-thumb-name">{dest.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next destination chevron */}
          <button
            type="button"
            className="dest-360-dock-arrow"
            onClick={handleNextDest}
            aria-label="Next destination"
            title="Next destination"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
