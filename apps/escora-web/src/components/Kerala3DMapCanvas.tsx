import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import districtsGeoData from "@/data/kerala-districts.json";
import "./Kerala3DMapCanvas.css";

import { DISTRICT_DETAILS, type DistrictInfo } from "@/data/districtDetails";
export { DISTRICT_DETAILS, type DistrictInfo };

// Reference: 03 Midnight Navy & Antique Gold color theme
// Map Color: #17283D with subtle topographic elevation variations
const DISTRICT_TOPOGRAPHY: Record<string, { depth: number; color: number }> = {
  Idukki: { depth: 0.44, color: 0x152539 }, // Western Ghats highest peaks (deepest midnight navy)
  Wayanad: { depth: 0.42, color: 0x16273b }, // Northern Ghats highland
  Palakkad: { depth: 0.38, color: 0x182a40 }, // Ghats corridor
  Pathanamthitta: { depth: 0.38, color: 0x17293e }, // Forest highlands
  Thrissur: { depth: 0.34, color: 0x192d43 }, // Midland heartland
  Malappuram: { depth: 0.33, color: 0x1b2f46 }, // Rolling hills
  Kottayam: { depth: 0.33, color: 0x1a2e45 }, // Rubber hills
  Alappuzha: { depth: 0.28, color: 0x1e344e }, // Coastal backwaters
  Ernakulam: { depth: 0.29, color: 0x1d334c }, // Coastal harbor
  Kollam: { depth: 0.29, color: 0x1d334c }, // Coastal lagoon
  Thiruvananthapuram: { depth: 0.30, color: 0x1c3149 }, // Southern coastline
  Kozhikode: { depth: 0.30, color: 0x1b3048 }, // Coastal Malabar
  Kannur: { depth: 0.31, color: 0x192d44 }, // Northern coast
  Kasaragod: { depth: 0.31, color: 0x1a2e45 }, // Northern coastline
};

// Reference-matched key map pins with accurate geographic coordinates
// Arranged North to South (top of Kerala down to bottom)
export const KERALA_DISTRICT_COORDINATES: Record<string, { lat: number; lon: number; district: string }> = {
  Kasaragod: { lat: 12.5102, lon: 74.9852, district: "Kasaragod" },
  Kannur: { lat: 11.8745, lon: 75.3704, district: "Kannur" },
  Wayanad: { lat: 11.6854, lon: 76.1320, district: "Wayanad" },
  Kozhikode: { lat: 11.2588, lon: 75.7804, district: "Kozhikode" },
  Malappuram: { lat: 11.0510, lon: 76.0711, district: "Malappuram" },
  Palakkad: { lat: 10.7867, lon: 76.6548, district: "Palakkad" },
  Thrissur: { lat: 10.5276, lon: 76.2144, district: "Thrissur" },
  Ernakulam: { lat: 9.9816, lon: 76.2999, district: "Ernakulam" },
  Idukki: { lat: 9.8494, lon: 76.9739, district: "Idukki" },
  Kottayam: { lat: 9.5916, lon: 76.5222, district: "Kottayam" },
  Alappuzha: { lat: 9.4981, lon: 76.3388, district: "Alappuzha" },
  Pathanamthitta: { lat: 9.2648, lon: 76.7870, district: "Pathanamthitta" },
  Kollam: { lat: 8.8932, lon: 76.6141, district: "Kollam" },
  Thiruvananthapuram: { lat: 8.5241, lon: 76.9366, district: "Thiruvananthapuram" },
};

export const KNOWN_KERALA_LOCATIONS: Record<string, { lat: number; lon: number; district: string }> = {
  // Highlands
  munnar: { lat: 10.0889, lon: 77.0595, district: "Idukki" },
  thekkady: { lat: 9.6001, lon: 77.1648, district: "Idukki" },
  periyar: { lat: 9.6001, lon: 77.1648, district: "Idukki" },
  wayanad: { lat: 11.6854, lon: 76.1320, district: "Wayanad" },
  vagamon: { lat: 9.6874, lon: 76.9056, district: "Idukki" },
  silentvalley: { lat: 11.0800, lon: 76.4300, district: "Palakkad" },
  "silent-valley": { lat: 11.0800, lon: 76.4300, district: "Palakkad" },
  nelliyampathy: { lat: 10.5348, lon: 76.6936, district: "Palakkad" },
  ponmudi: { lat: 8.7600, lon: 77.1167, district: "Thiruvananthapuram" },
  ranipuram: { lat: 12.4286, lon: 75.3533, district: "Kasaragod" },
  vythiri: { lat: 11.5500, lon: 76.0333, district: "Wayanad" },
  gavi: { lat: 9.4357, lon: 77.1652, district: "Pathanamthitta" },

  // Coastal & Beaches
  bekal: { lat: 12.3897, lon: 75.0329, district: "Kasaragod" },
  varkala: { lat: 8.7379, lon: 76.7163, district: "Thiruvananthapuram" },
  kovalam: { lat: 8.4004, lon: 76.9787, district: "Thiruvananthapuram" },
  marari: { lat: 9.6019, lon: 76.2974, district: "Alappuzha" },
  mararikulam: { lat: 9.6019, lon: 76.2974, district: "Alappuzha" },
  cherai: { lat: 10.1416, lon: 76.1783, district: "Ernakulam" },
  kannur: { lat: 11.8745, lon: 75.3704, district: "Kannur" },
  poovar: { lat: 8.3188, lon: 77.0683, district: "Thiruvananthapuram" },
  muzhappilangad: { lat: 11.7925, lon: 75.4503, district: "Kannur" },
  kappad: { lat: 11.3833, lon: 75.7167, district: "Kozhikode" },

  // Backwaters & Lakes
  alleppey: { lat: 9.4981, lon: 76.3388, district: "Alappuzha" },
  alappuzha: { lat: 9.4981, lon: 76.3388, district: "Alappuzha" },
  kumarakom: { lat: 9.6180, lon: 76.4300, district: "Kottayam" },
  kollam: { lat: 8.8932, lon: 76.6141, district: "Kollam" },
  ashtamudi: { lat: 8.9500, lon: 76.5833, district: "Kollam" },
  munroe: { lat: 8.9833, lon: 76.6167, district: "Kollam" },
  "munroe-island": { lat: 8.9833, lon: 76.6167, district: "Kollam" },
  kuttanad: { lat: 9.4167, lon: 76.4667, district: "Alappuzha" },

  // Heritage & Cities
  kochi: { lat: 9.9658, lon: 76.2421, district: "Ernakulam" },
  "fort-kochi": { lat: 9.9658, lon: 76.2421, district: "Ernakulam" },
  ernakulam: { lat: 9.9816, lon: 76.2999, district: "Ernakulam" },
  mattancherry: { lat: 9.9577, lon: 76.2592, district: "Ernakulam" },
  kozhikode: { lat: 11.2588, lon: 75.7804, district: "Kozhikode" },
  calicut: { lat: 11.2588, lon: 75.7804, district: "Kozhikode" },
  thrissur: { lat: 10.5276, lon: 76.2144, district: "Thrissur" },
  palakkad: { lat: 10.7867, lon: 76.6548, district: "Palakkad" },
  trivandrum: { lat: 8.5241, lon: 76.9366, district: "Thiruvananthapuram" },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366, district: "Thiruvananthapuram" },
  athirappilly: { lat: 10.2851, lon: 76.5698, district: "Thrissur" },
  malappuram: { lat: 11.0510, lon: 76.0711, district: "Malappuram" },
  pathanamthitta: { lat: 9.2648, lon: 76.7870, district: "Pathanamthitta" },
  kottayam: { lat: 9.5916, lon: 76.5222, district: "Kottayam" },
  kasaragod: { lat: 12.5102, lon: 74.9852, district: "Kasaragod" },
};

export const KERALA_DISTRICT_NAMES = [
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad",
] as const;

export function resolveDistrictName(input?: string | null): string {
  if (!input) return "Idukki";
  const s = input.trim().toLowerCase();
  if (s.includes("alappuzha") || s.includes("alleppey")) return "Alappuzha";
  if (s.includes("ernakulam") || s.includes("kochi") || s.includes("cochin")) return "Ernakulam";
  if (s.includes("idukki") || s.includes("munnar") || s.includes("thekkady")) return "Idukki";
  if (s.includes("kannur") || s.includes("cannanore")) return "Kannur";
  if (s.includes("kasaragod") || s.includes("bekal")) return "Kasaragod";
  if (s.includes("kollam") || s.includes("quilon") || s.includes("ashtamudi")) return "Kollam";
  if (s.includes("kottayam") || s.includes("kumarakom")) return "Kottayam";
  if (s.includes("kozhikode") || s.includes("calicut")) return "Kozhikode";
  if (s.includes("malappuram")) return "Malappuram";
  if (s.includes("palakkad") || s.includes("palghat")) return "Palakkad";
  if (s.includes("pathanamthitta") || s.includes("gavi")) return "Pathanamthitta";
  if (s.includes("thiruvananthapuram") || s.includes("trivandrum") || s.includes("varkala") || s.includes("kovalam")) return "Thiruvananthapuram";
  if (s.includes("thrissur") || s.includes("trichur") || s.includes("athirappilly")) return "Thrissur";
  if (s.includes("wayanad")) return "Wayanad";

  const match = KERALA_DISTRICT_NAMES.find((d) => d.toLowerCase() === s);
  return match || "Idukki";
}

export function resolveDestinationCoordinates(d: {
  slug?: string;
  name?: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: string | null;
}): { lat: number; lon: number; district: string } {
  // 1. Direct explicit numeric latitude & longitude from CMS
  const latNum = typeof d.latitude === "number" ? d.latitude : parseFloat(String(d.latitude || ""));
  const lonNum = typeof d.longitude === "number" ? d.longitude : parseFloat(String(d.longitude || ""));

  const hasValidLat = !isNaN(latNum) && latNum >= 8.0 && latNum <= 13.0;
  const hasValidLon = !isNaN(lonNum) && lonNum >= 74.5 && lonNum <= 77.8;

  // 2. Parse from coordinates string e.g. "10.08°N 77.06°E" or "10.08, 77.06"
  let parsedLat: number | null = null;
  let parsedLon: number | null = null;
  if ((!hasValidLat || !hasValidLon) && d.coordinates) {
    const match = d.coordinates.match(/([0-9.]+)\s*°?\s*N?[,\s]+([0-9.]+)\s*°?\s*E?/i);
    if (match) {
      const pLat = parseFloat(match[1]);
      const pLon = parseFloat(match[2]);
      if (!isNaN(pLat) && !isNaN(pLon) && pLat >= 8.0 && pLat <= 13.0 && pLon >= 74.5 && pLon <= 77.8) {
        parsedLat = pLat;
        parsedLon = pLon;
      }
    }
  }

  const slug = (d.slug || "").toLowerCase().trim();
  const name = (d.name || "").toLowerCase().trim();
  const known = KNOWN_KERALA_LOCATIONS[slug] || KNOWN_KERALA_LOCATIONS[name];

  const district = resolveDistrictName(d.region || known?.district);
  const districtFallback = KERALA_DISTRICT_COORDINATES[district] || { lat: 10.08, lon: 77.06, district: "Idukki" };

  const finalLat = hasValidLat ? latNum : (parsedLat ?? known?.lat ?? districtFallback.lat);
  const finalLon = hasValidLon ? lonNum : (parsedLon ?? known?.lon ?? districtFallback.lon);

  return {
    lat: finalLat,
    lon: finalLon,
    district: known?.district || district,
  };
}

export interface MapPinData {
  id: string;
  label: string;
  district: string;
  lon: number;
  lat: number;
  associatedDestId?: string;
}

export function buildMapPins(destinations?: any[]): MapPinData[] {
  if (!destinations || destinations.length === 0) {
    return MAP_PINS;
  }

  // Filter ONLY destinations that are marked as featured in CMS for the map
  const featuredList = destinations.filter(
    (d) => Boolean(d && (d.featured === true || d.featured === 1))
  );

  // If admin has set featured destinations, show ONLY those on the map.
  // If none are featured yet (e.g. before initial CMS configuration), use curated top destinations
  const targetList =
    featuredList.length > 0
      ? featuredList
      : destinations.filter((d) => {
          const s = (d.slug || "").toLowerCase();
          return ["kochi", "munnar", "thekkady", "alleppey", "varkala", "trivandrum", "calicut", "wayanad"].includes(s);
        });

  const listToUse = targetList.length > 0 ? targetList : destinations.slice(0, 5);

  const pins: MapPinData[] = [];
  listToUse.forEach((d) => {
    if (!d || !d.name) return;
    const { lat, lon, district } = resolveDestinationCoordinates(d);
    pins.push({
      id: d.slug || d.name,
      label: d.name,
      district,
      lat,
      lon,
      associatedDestId: d.slug,
    });
  });

  return pins;
}

export const MAP_PINS: MapPinData[] = [
  { id: "Wayanad", label: "Wayanad", district: "Wayanad", lon: 76.13, lat: 11.68, associatedDestId: "wayanad" },
  { id: "Calicut", label: "Calicut", district: "Kozhikode", lon: 75.78, lat: 11.25, associatedDestId: "calicut" },
  { id: "Munnar", label: "Munnar", district: "Idukki", lon: 77.06, lat: 10.08, associatedDestId: "munnar" },
  { id: "Kochi", label: "Kochi", district: "Ernakulam", lon: 76.26, lat: 9.93, associatedDestId: "kochi" },
  { id: "Thekkady", label: "Thekkady", district: "Idukki", lon: 77.16, lat: 9.60, associatedDestId: "thekkady" },
  { id: "Alleppey", label: "Alleppey", district: "Alappuzha", lon: 76.33, lat: 9.49, associatedDestId: "alleppey" },
  { id: "Varkala", label: "Varkala", district: "Thiruvananthapuram", lon: 76.71, lat: 8.73, associatedDestId: "varkala" },
  { id: "Trivandrum", label: "Trivandrum", district: "Thiruvananthapuram", lon: 76.93, lat: 8.50, associatedDestId: "trivandrum" },
];

// 14 Kerala districts sorted strictly North to South (top of Kerala map down to bottom)
const NORTH_TO_SOUTH_DISTRICTS = [
  "Kasaragod",
  "Kannur",
  "Wayanad",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Thrissur",
  "Ernakulam",
  "Idukki",
  "Kottayam",
  "Alappuzha",
  "Pathanamthitta",
  "Kollam",
  "Thiruvananthapuram",
];

interface PinScreenPosition {
  id: string;
  label: string;
  district: string;
  associatedDestId?: string;
  x: number;
  y: number;
  visible: boolean;
}

declare global {
  interface Window {
    __kerala3DMap?: {
      setRevealProgress: (progress: number) => void;
      triggerReveal: () => void;
      resetReveal: () => void;
      ensureRevealed: () => void;
    };
  }
}

export interface Kerala3DMapCanvasProps {
  selectedDistrict: string | null;
  activeDestId?: string;
  onSelectDistrict: (districtName: string, associatedDestId?: string) => void;
  destinations?: any[];
}

export default function Kerala3DMapCanvas({
  selectedDistrict,
  activeDestId,
  onSelectDistrict,
  destinations,
}: Kerala3DMapCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const pinsToUse = React.useMemo(() => {
    return buildMapPins(destinations);
  }, [destinations]);

  const pinsToUseRef = useRef<MapPinData[]>(pinsToUse);
  pinsToUseRef.current = pinsToUse;

  const recalcPinsRef = useRef<() => void>(() => {});

  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [pinPositions, setPinPositions] = useState<PinScreenPosition[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  const isRevealedRef = useRef(false);
  const isRevealingRef = useRef(false);
  const revealTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const ensureRevealedRef = useRef<() => void>(() => {});
  const pinElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const districtMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedDistrictRef = useRef<string | null>(selectedDistrict);
  selectedDistrictRef.current = selectedDistrict;

  const onSelectDistrictRef = useRef(onSelectDistrict);
  onSelectDistrictRef.current = onSelectDistrict;

  const wakeLoopRef = useRef<() => void>(() => {});

  useEffect(() => {
    wakeLoopRef.current();
  }, [selectedDistrict]);

  useEffect(() => {
    recalcPinsRef.current();
    wakeLoopRef.current();
  }, [pinsToUse]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // WebGL Check
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    if (!gl) return;

    // ── Three.js Scene Setup ──
    const scene = new THREE.Scene();
    scene.background = null;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 480;
    const dims = { w: width, h: height };

    // Calibrated isometric perspective camera so entire Kerala relief and all pins fit cleanly within viewport
    const camera = new THREE.PerspectiveCamera(38.5, width / height, 0.1, 100);
    camera.position.set(0.15, -6.15, 9.15);
    camera.lookAt(0.14, -0.12, 0);

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ── Realistic Lighting (Warm #F4F0E8 ambient with Antique Gold accents) ──
    const ambientLight = new THREE.AmbientLight(0xf4f0e8, 1.45);
    scene.add(ambientLight);

    // Sun Key Light illuminating Western Ghats relief
    const sunLight = new THREE.DirectionalLight(0xfff8e8, 2.1);
    sunLight.position.set(5.5, -4.5, 9.5);
    sunLight.castShadow = !isMobile;
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // Warm Antique Gold mountain ridge accent light (#D6B66F)
    const ridgeLight = new THREE.PointLight(0xd6b66f, 1.35, 16);
    ridgeLight.position.set(3.2, 0.2, 3);
    scene.add(ridgeLight);

    // ── Scaling & Geographic Centering ──
    const centerLon = 76.14;
    const centerLat = 10.25;
    const scale = 1.76;

    const bedrockMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e1b2b, // Deep Midnight Navy bedrock base
      roughness: 0.82,
      metalness: 0.18,
    });

    const sidewallMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6b66f, // #D6B66F Antique Gold extruded relief walls
      roughness: 0.42,
      metalness: 0.48,
    });

    const goldLineMaterial = new THREE.LineBasicMaterial({
      color: 0xd6b66f, // #D6B66F Antique Gold district boundary lines
      linewidth: 1.2,
      transparent: true,
      opacity: 0.75,
    });

    const activeLineMaterial = new THREE.LineBasicMaterial({
      color: 0xe6c478, // #E6C478 Highlight Color
      linewidth: 2.2,
    });

    const districtGroups = new Map<string, THREE.Group>();
    const districtMeshes = new Map<string, THREE.Mesh>();
    const districtEdges = new Map<string, THREE.LineSegments>();
    const districtRevealStates = new Map<
      string,
      { scale: number; offsetY: number; offsetZ: number }
    >();

    // ── Build 14 Geographically Accurate 3D Districts & Silhouette Bedrock ──
    districtsGeoData.features.forEach((feature) => {
      const name = feature.properties.DISTRICT;
      const coords = feature.geometry.coordinates[0]; // Exterior polygon ring
      const topo = DISTRICT_TOPOGRAPHY[name] || { depth: 0.32, color: 0x2e6441 };

      // Calculate 2D centroid for this district
      let sumX = 0;
      let sumY = 0;
      coords.forEach(([lon, lat]) => {
        sumX += (lon - centerLon) * scale;
        sumY += (lat - centerLat) * scale;
      });
      const centroidX = sumX / coords.length;
      const centroidY = sumY / coords.length;

      // Group for this district centered at its geographic centroid
      const districtGrp = new THREE.Group();
      districtGrp.userData = { centroidX, centroidY, name };

      const shape = new THREE.Shape();
      coords.forEach(([lon, lat], i) => {
        const x = (lon - centerLon) * scale - centroidX;
        const y = (lat - centerLat) * scale - centroidY;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });

      // 1. Bedrock base mesh following exact district silhouette at Z = -0.20
      const baseSettings = {
        depth: 0.20,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 2,
      };
      const baseGeo = new THREE.ExtrudeGeometry(shape, baseSettings);
      const bedrockMesh = new THREE.Mesh(baseGeo, bedrockMaterial);
      bedrockMesh.position.z = -0.20;
      bedrockMesh.receiveShadow = true;
      districtGrp.add(bedrockMesh);

      // 2. Top terrain district mesh with natural elevation variation
      const districtSettings = {
        depth: topo.depth,
        bevelEnabled: true,
        bevelThickness: 0.045,
        bevelSize: 0.03,
        bevelSegments: 3,
      };
      const districtGeo = new THREE.ExtrudeGeometry(shape, districtSettings);
      districtGeo.computeVertexNormals();

      const topMaterial = new THREE.MeshStandardMaterial({
        color: topo.color,
        roughness: 0.48,
        metalness: 0.18,
        flatShading: false,
      });

      const mesh = new THREE.Mesh(districtGeo, [topMaterial, sidewallMaterial]);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { districtName: name, baseZ: 0, defaultColor: topo.color };

      districtGrp.add(mesh);
      districtMeshes.set(name, mesh);

      // 3. Subtle gold border lines outlining accurate boundaries
      const edgesGeo = new THREE.EdgesGeometry(districtGeo, 24);
      const edgeLines = new THREE.LineSegments(edgesGeo, goldLineMaterial);
      edgeLines.name = `${name}-edges`;
      districtGrp.add(edgeLines);
      districtEdges.set(name, edgeLines);

      // Initial unrevealed state: hidden, offset higher (North/top) and deeper
      const revState = {
        scale: 0,
        offsetY: 0.38,
        offsetZ: -0.32,
      };
      districtRevealStates.set(name, revState);

      districtGrp.position.set(centroidX, centroidY + revState.offsetY, revState.offsetZ);
      districtGrp.scale.set(0, 0, 0);

      scene.add(districtGrp);
      districtGroups.set(name, districtGrp);
    });

    districtMeshesRef.current = districtMeshes;
    const districtMeshArray = Array.from(districtMeshes.values());

    // ── Raycasting for Mouse Hover & Selection ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let currentHovered: string | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(districtMeshArray);

      if (intersects.length > 0) {
        const hitName = (intersects[0].object as THREE.Mesh).userData.districtName;
        if (currentHovered !== hitName) {
          currentHovered = hitName;
          setHoveredDistrict(hitName);
          wakeLoop();
        }
      } else {
        if (currentHovered !== null) {
          currentHovered = null;
          setHoveredDistrict(null);
          wakeLoop();
        }
      }
    };

    const onPointerLeave = () => {
      mouse.x = -999;
      mouse.y = -999;
      if (currentHovered !== null) {
        currentHovered = null;
        setHoveredDistrict(null);
        wakeLoop();
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(clickMouse, camera);
      const intersects = raycaster.intersectObjects(districtMeshArray);

      if (intersects.length > 0) {
        const hitName = (intersects[0].object as THREE.Mesh).userData.districtName;
        const details = DISTRICT_DETAILS[hitName];
        const currentPins = pinsToUseRef.current;
        const pinMatch = currentPins.find((p) => p.district === hitName && p.associatedDestId);
        onSelectDistrictRef.current(hitName, pinMatch?.associatedDestId || details?.associatedDestId);
      }
    };

    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("mouseleave", onPointerLeave);
    renderer.domElement.addEventListener("click", onClick);

    // ── Calculate 2D Screen Positions for Reference Pins ──
    const tempVec = new THREE.Vector3();
    const calculatePins = (w: number, h: number) => {
      const updatedPins: PinScreenPosition[] = [];
      const currentPins = pinsToUseRef.current;

      currentPins.forEach((pin) => {
        const x = (pin.lon - centerLon) * scale;
        const y = (pin.lat - centerLat) * scale;
        const mesh = districtMeshes.get(pin.district);
        const zOffset = mesh ? mesh.position.z : 0;
        const topo = DISTRICT_TOPOGRAPHY[pin.district] || { depth: 0.32 };

        tempVec.set(x, y, topo.depth + 0.12 + zOffset);
        tempVec.project(camera);

        const screenX = ((tempVec.x + 1) / 2) * w;
        const screenY = ((-tempVec.y + 1) / 2) * h;

        updatedPins.push({
          id: pin.id,
          label: pin.label,
          district: pin.district,
          associatedDestId: pin.associatedDestId,
          x: screenX,
          y: screenY,
          visible: tempVec.z < 1,
        });
      });

      setPinPositions(updatedPins);
    };

    recalcPinsRef.current = () => calculatePins(dims.w, dims.h);

    // Calculate initial pin positions
    calculatePins(width, height);

    // ── Demand-Based Animation Loop ──
    let animId = 0;
    let isVisible = false;

    const wakeLoop = () => {
      if (!isVisible || animId) return;
      animate();
    };
    wakeLoopRef.current = wakeLoop;

    const animate = () => {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let maxDelta = 0;

      // Update district elevations
      districtMeshes.forEach((mesh, name) => {
        const isSelected = selectedDistrictRef.current === name;
        const isHovered = currentHovered === name;

        let targetZ = 0;
        if (isSelected) targetZ = 0.36;
        else if (isHovered) targetZ = 0.20;

        if (prefersReduced) {
          mesh.position.z = targetZ;
        } else {
          const delta = Math.abs(targetZ - mesh.position.z);
          if (delta > maxDelta) maxDelta = delta;
          mesh.position.z += (targetZ - mesh.position.z) * 0.14;
        }

        const edgeLines = districtEdges.get(name);
        if (edgeLines) {
          edgeLines.position.z = mesh.position.z;
        }

        const mat = (mesh.material as THREE.Material[])[0] as THREE.MeshStandardMaterial;
        const defaultColor = mesh.userData.defaultColor;

        if (isSelected) {
          mat.emissive.setHex(0xe6c478);
          mat.emissiveIntensity = 0.28;
          mat.color.setHex(0x1e3654);
          if (edgeLines) edgeLines.material = activeLineMaterial;
        } else if (isHovered) {
          mat.emissive.setHex(0xd6b66f);
          mat.emissiveIntensity = 0.18;
          mat.color.setHex(0x1a304b);
          if (edgeLines) edgeLines.material = activeLineMaterial;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mat.color.setHex(defaultColor);
          if (edgeLines) edgeLines.material = goldLineMaterial;
        }
      });

      // Synchronize pin positions and opacities directly with 3D projection during forward & backward wave
      const w = dims.w;
      const h = dims.h;
      const currentPins = pinsToUseRef.current;
      currentPins.forEach((pin) => {
        const el = pinElementsRef.current.get(pin.id);
        if (!el) return;
        const st = districtRevealStates.get(pin.district);
        const currentScale = st ? Math.max(0, Math.min(1, st.scale)) : 1;
        const currentOffsetY = st ? st.offsetY : 0;
        const currentOffsetZ = st ? st.offsetZ : 0;
        const topo = DISTRICT_TOPOGRAPHY[pin.district] || { depth: 0.32 };
        const mesh = districtMeshes.get(pin.district);
        const zOffset = mesh ? mesh.position.z : 0;

        const x = (pin.lon - centerLon) * scale;
        const y = (pin.lat - centerLat) * scale;
        tempVec.set(x, y + currentOffsetY, topo.depth + 0.12 + zOffset + currentOffsetZ);
        tempVec.project(camera);

        const screenX = ((tempVec.x + 1) / 2) * w;
        const screenY = ((-tempVec.y + 1) / 2) * h;

        const opacity = Math.max(0, Math.min(1, (currentScale - 0.20) / 0.80));
        el.style.left = `${screenX}px`;
        el.style.top = `${screenY}px`;
        el.style.opacity = `${opacity}`;
        el.style.transform = `translate(-50%, -50%) scale(${0.35 + 0.65 * currentScale})`;
        el.style.pointerEvents = opacity > 0.75 ? "auto" : "none";
      });

      renderer.render(scene, camera);

      const isTimelineActive = Boolean(revealTimelineRef.current && isVisible);
      if ((maxDelta > 0.001 || isTimelineActive) && !prefersReduced) {
        animId = requestAnimationFrame(animate);
      } else {
        // Snap all meshes to exact targetZ to ensure clean resting state
        districtMeshes.forEach((mesh, name) => {
          const isSelected = selectedDistrictRef.current === name;
          const isHovered = currentHovered === name;
          const targetZ = isSelected ? 0.36 : isHovered ? 0.20 : 0;
          mesh.position.z = targetZ;
          const edgeLines = districtEdges.get(name);
          if (edgeLines) edgeLines.position.z = targetZ;
        });
        renderer.render(scene, camera);
        animId = 0;
      }
    };

    // ── Unified Reveal Logic & GSAP Scrub Pipeline ──
    const currentProgressRef = { p: 0 };

    const setRevealProgress = (progress: number) => {
      const p = Math.max(0, Math.min(1, progress));
      currentProgressRef.p = p;
      isVisible = p > 0;

      if (p >= 0.96) {
        if (!isRevealedRef.current) {
          isRevealedRef.current = true;
          setIsRevealed(true);
        }
      } else if (p <= 0.04) {
        if (isRevealedRef.current) {
          isRevealedRef.current = false;
          setIsRevealed(false);
        }
      }

      // Update 14 districts in North to South cascade
      const count = NORTH_TO_SOUTH_DISTRICTS.length;
      NORTH_TO_SOUTH_DISTRICTS.forEach((name, idx) => {
        const st = districtRevealStates.get(name);
        const grp = districtGroups.get(name);
        if (!st || !grp) return;

        // Cascade window from North (idx = 0) to South (idx = 13)
        const start = (idx / count) * 0.52;
        const end = start + 0.48;
        const raw = Math.max(0, Math.min(1, (p - start) / (end - start)));
        // Smooth cubic ease out
        const eased = 1 - Math.pow(1 - raw, 2.8);

        st.scale = eased;
        st.offsetY = (1 - eased) * 0.42;
        st.offsetZ = (1 - eased) * -0.32;

        grp.scale.set(eased, eased, eased);
        grp.position.set(
          grp.userData.centroidX,
          grp.userData.centroidY + st.offsetY,
          st.offsetZ
        );
      });



      
      // Update Pins projection & visibility directly
      const w = dims.w;
      const h = dims.h;
      MAP_PINS.forEach((pin) => {
        const el = pinElementsRef.current.get(pin.id);
        if (!el) return;
        const st = districtRevealStates.get(pin.district);
        const currentScale = st ? Math.max(0, Math.min(1, st.scale)) : 1;
        const currentOffsetY = st ? st.offsetY : 0;
        const currentOffsetZ = st ? st.offsetZ : 0;
        const topo = DISTRICT_TOPOGRAPHY[pin.district] || { depth: 0.32 };
        const mesh = districtMeshes.get(pin.district);
        const zOffset = mesh ? mesh.position.z : 0;

        const x = (pin.lon - centerLon) * scale;
        const y = (pin.lat - centerLat) * scale;
        tempVec.set(x, y + currentOffsetY, topo.depth + 0.12 + zOffset + currentOffsetZ);
        tempVec.project(camera);

        const screenX = ((tempVec.x + 1) / 2) * w;
        const screenY = ((-tempVec.y + 1) / 2) * h;

        const opacity = Math.max(0, Math.min(1, (currentScale - 0.22) / 0.78));
        el.style.left = `${screenX}px`;
        el.style.top = `${screenY}px`;
        el.style.opacity = `${opacity}`;
        el.style.transform = `translate(-50%, -50%) scale(${0.35 + 0.65 * currentScale})`;
        el.style.pointerEvents = opacity > 0.75 ? "auto" : "none";
      });

      // Synchronously render to ensure lockstep accuracy with GSAP timeline scrub
      renderer.render(scene, camera);
    };

    const ensureRevealed = () => {
      setRevealProgress(1);
    };
    ensureRevealedRef.current = ensureRevealed;

    const resetReveal = () => {
      if (revealTimelineRef.current) {
        revealTimelineRef.current.kill();
        revealTimelineRef.current = null;
      }
      setRevealProgress(0);
    };

    const triggerReveal = () => {
      if (currentProgressRef.p >= 0.98) return;
      if (revealTimelineRef.current) {
        revealTimelineRef.current.kill();
      }

      const proxy = { p: currentProgressRef.p };
      const tl = gsap.to(proxy, {
        p: 1,
        duration: 1.15,
        ease: "power2.out",
        onUpdate: () => {
          setRevealProgress(proxy.p);
        },
      });
      revealTimelineRef.current = tl as any;
    };

    // Register global hook for GSAP ScrollTrigger timeline scrubbing
    if (typeof window !== "undefined") {
      window.__kerala3DMap = {
        setRevealProgress,
        triggerReveal,
        resetReveal,
        ensureRevealed,
      };

      // Check if Slide 2 is already active on page load
      const parentSlide = container.closest(".pinned-journey-slide");
      if (
        parentSlide &&
        (parentSlide.classList.contains("is-active") ||
          parentSlide.classList.contains("is-initial-active"))
      ) {
        setRevealProgress(1);
      } else {
        setRevealProgress(0);
      }
    }

    // Fallback IntersectionObserver for standalone view / non-pinned mode
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          isVisible = true;
          // Only trigger if not already driven by GSAP
          if (currentProgressRef.p < 0.05 && !container.closest(".pinned-journey-stage")) {
            triggerReveal();
          }
          wakeLoop();
        }
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0 }
    );
    observer.observe(container);

    // Initial viewport check for standalone mode
    if (typeof window !== "undefined") {
      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        triggerReveal();
        wakeLoop();
      }
    }

    // Tab visibility handling: pause when browser tab is inactive, resume when tab is active
    const handleTabVisibility = () => {
      if (document.hidden) {
        revealTimelineRef.current?.pause();
        if (animId) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
      } else if (isVisible) {
        revealTimelineRef.current?.play();
        wakeLoop();
      }
    };
    document.addEventListener("visibilitychange", handleTabVisibility);

    // ── Resize Handler ──
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 380;
      const h = container.clientHeight || 480;
      dims.w = w;
      dims.h = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      calculatePins(w, h);
      wakeLoop();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (typeof window !== "undefined" && window.__kerala3DMap) {
        delete window.__kerala3DMap;
      }
      revealTimelineRef.current?.kill();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleTabVisibility);
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", onPointerMove);
      renderer.domElement.removeEventListener("mouseleave", onPointerLeave);
      renderer.domElement.removeEventListener("click", onClick);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      wakeLoopRef.current = () => {};
    };
  }, []);

  return (
    <div
      className={`kerala-3d-map-three-container ${isRevealed ? "is-revealed" : ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        userSelect: "none",
      }}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "pointer",
        }}
      />

      {/* Reference-Matched 3D Map Pin Badges */}
      <div
        className="kerala-3d-map-pins-layer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {pinPositions.map((pin, idx) => {
          const isDestActive = activeDestId ? pin.associatedDestId === activeDestId : false;
          const isSelectedDistrict = selectedDistrict === pin.district;
          const isHovered = hoveredDistrict === pin.district;
          const isHighlighted = isDestActive || isSelectedDistrict || isHovered;

          return (
            <div
              key={pin.id}
              ref={(el) => {
                if (el) pinElementsRef.current.set(pin.id, el);
                else pinElementsRef.current.delete(pin.id);
              }}
              className={`map-floating-pin-pill ${isHighlighted ? "is-active" : ""} ${isDestActive ? "is-dest-target" : ""}`}
              style={
                {
                  position: "absolute",
                  left: `${pin.x}px`,
                  top: `${pin.y}px`,
                  "--pin-idx": idx,
                  cursor: "pointer",
                } as React.CSSProperties
              }
              onClick={() => {
                onSelectDistrict(pin.district, pin.associatedDestId);
              }}
              onMouseEnter={() => {
                setHoveredDistrict(pin.district);
              }}
              onMouseLeave={() => setHoveredDistrict(null)}
            >
              <span className={`pin-dot ${isDestActive ? "pin-target-dot" : ""}`} />
              <span className="pin-text">{pin.label}</span>
            </div>
          );
        })}
      </div>

      

      
    </div>
  );
}
