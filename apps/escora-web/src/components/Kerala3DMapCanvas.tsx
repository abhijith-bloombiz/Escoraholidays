import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import districtsGeoData from "@/data/kerala-districts.json";

// District metadata & destination associations
export interface DistrictInfo {
  name: string;
  associatedDestId?: string;
  category: string;
  highlights: string;
}

export const DISTRICT_DETAILS: Record<string, DistrictInfo> = {
  Alappuzha: {
    name: "Alappuzha",
    associatedDestId: "alleppey",
    category: "Backwater Capital",
    highlights: "Vembanad Lake, Kettuvallam houseboats & Kuttanad paddy fields",
  },
  Ernakulam: {
    name: "Ernakulam (Kochi)",
    associatedDestId: "kochi",
    category: "Heritage & Commerce",
    highlights: "Fort Kochi colonial streets, Chinese fishing nets & Mattancherry",
  },
  Idukki: {
    name: "Idukki",
    associatedDestId: "munnar",
    category: "Highland Spice & Tea Country",
    highlights: "Munnar tea gardens, Anamudi peak & Periyar wildlife in Thekkady",
  },
  Kannur: {
    name: "Kannur",
    associatedDestId: "kannur",
    category: "Theyyam & Loom Coast",
    highlights: "Sacred Theyyam rituals, Muzhappilangad drive-in beach & St. Angelo Fort",
  },
  Kasaragod: {
    name: "Kasaragod",
    associatedDestId: "bekal",
    category: "Forts & Rivers",
    highlights: "Bekal coastal fortress, Ranipuram hill station & uncrowded shores",
  },
  Kollam: {
    name: "Kollam",
    category: "Ashtamudi Estuary",
    highlights: "Gateway to the backwaters, historic cashew trade & Munroe Island",
  },
  Kottayam: {
    name: "Kottayam",
    associatedDestId: "kumarakom",
    category: "Lakes & Letters",
    highlights: "Kumarakom bird sanctuary, rubber hills & backwater canals",
  },
  Kozhikode: {
    name: "Kozhikode",
    category: "Historic Spice Port",
    highlights: "Vasco da Gama's landing, Malabar culinary heritage & Beypore shipyards",
  },
  Malappuram: {
    name: "Malappuram",
    category: "Cultural Heartland",
    highlights: "Kottakkal Arya Vaidya Sala, teak plantations & rolling hills",
  },
  Palakkad: {
    name: "Palakkad",
    category: "Gateway of the Ghats",
    highlights: "Palakkad Gap, Silent Valley National Park & historic granite fort",
  },
  Pathanamthitta: {
    name: "Pathanamthitta",
    category: "Pilgrimage & Forest",
    highlights: "Gavi ecotourism, Sabarimala shrine & Perunthenaruvi falls",
  },
  Thiruvananthapuram: {
    name: "Thiruvananthapuram",
    associatedDestId: "varkala",
    category: "Royal Capital & Cliffs",
    highlights: "Varkala laterite cliffs, Kovalam lighthouse & Padmanabhaswamy Temple",
  },
  Thrissur: {
    name: "Thrissur",
    category: "Cultural Capital",
    highlights: "Thrissur Pooram elephant festival, Vadakkunnathan Temple & performing arts",
  },
  Wayanad: {
    name: "Wayanad",
    associatedDestId: "wayanad",
    category: "Highland Rainforest",
    highlights: "Edakkal prehistoric rock art, Chembra peak & misty rainforest stays",
  },
};

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
const MAP_PINS = [
  { id: "Kasaragod", label: "Kasaragod", district: "Kasaragod", lon: 75.00, lat: 12.50, associatedDestId: "bekal" },
  { id: "Kannur", label: "Kannur", district: "Kannur", lon: 75.37, lat: 11.87 },
  { id: "Wayanad", label: "Wayanad", district: "Wayanad", lon: 76.13, lat: 11.68, associatedDestId: "wayanad" },
  { id: "Kozhikode", label: "Kozhikode", district: "Kozhikode", lon: 75.78, lat: 11.25 },
  { id: "Thrissur", label: "Thrissur", district: "Thrissur", lon: 76.21, lat: 10.52 },
  { id: "Munnar", label: "Munnar", district: "Idukki", lon: 77.06, lat: 10.08, associatedDestId: "munnar" },
  { id: "Kochi", label: "Kochi", district: "Ernakulam", lon: 76.26, lat: 9.93, associatedDestId: "kochi" },
  { id: "Thekkady", label: "Thekkady", district: "Idukki", lon: 77.16, lat: 9.60, associatedDestId: "thekkady" },
  { id: "Alleppey", label: "Alleppey", district: "Alappuzha", lon: 76.33, lat: 9.49, associatedDestId: "alleppey" },
  { id: "Varkala", label: "Varkala", district: "Thiruvananthapuram", lon: 76.71, lat: 8.73, associatedDestId: "varkala" },
  { id: "Trivandrum", label: "Trivandrum", district: "Thiruvananthapuram", lon: 76.93, lat: 8.50, associatedDestId: "kovalam" },
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

interface Kerala3DMapCanvasProps {
  selectedDistrict: string | null;
  activeDestId?: string;
  onSelectDistrict: (districtName: string, associatedDestId?: string) => void;
}

export default function Kerala3DMapCanvas({
  selectedDistrict,
  activeDestId,
  onSelectDistrict,
}: Kerala3DMapCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
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
    const camera = new THREE.PerspectiveCamera(39, width / height, 0.1, 100);
    camera.position.set(0.15, -6.3, 9.4);
    camera.lookAt(0.14, 0.15, 0);

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
    const scale = 1.58;

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
        onSelectDistrictRef.current(hitName, details?.associatedDestId);
      }
    };

    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("mouseleave", onPointerLeave);
    renderer.domElement.addEventListener("click", onClick);

    // ── Calculate 2D Screen Positions for Reference Pins ──
    const tempVec = new THREE.Vector3();
    const calculatePins = (w: number, h: number) => {
      const updatedPins: PinScreenPosition[] = [];

      MAP_PINS.forEach((pin) => {
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

    // ── Sequential Reveal Animations (Looping Forward and Backward) ──
    const ensureRevealed = () => {
      revealTimelineRef.current?.progress(1);
      isRevealedRef.current = true;
      setIsRevealed(true);

      districtGroups.forEach((grp, name) => {
        const st = districtRevealStates.get(name);
        if (st) {
          st.scale = 1;
          st.offsetY = 0;
          st.offsetZ = 0;
        }
        grp.scale.set(1, 1, 1);
        const { centroidX, centroidY } = grp.userData;
        grp.position.set(centroidX, centroidY, 0);
      });
      wakeLoop();
    };
    ensureRevealedRef.current = ensureRevealed;

    const resetReveal = () => {
      if (revealTimelineRef.current) {
        revealTimelineRef.current.kill();
        revealTimelineRef.current = null;
      }
      isRevealedRef.current = false;
      setIsRevealed(false);

      NORTH_TO_SOUTH_DISTRICTS.forEach((name) => {
        const st = districtRevealStates.get(name);
        const grp = districtGroups.get(name);
        if (st && grp) {
          st.scale = 0;
          st.offsetY = 0.38;
          st.offsetZ = -0.32;
          grp.scale.set(0, 0, 0);
          grp.position.set(grp.userData.centroidX, grp.userData.centroidY + 0.38, -0.32);
        }
      });

      // Reset pins to hidden state
      MAP_PINS.forEach((pin) => {
        const el = pinElementsRef.current.get(pin.id);
        if (el) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          el.style.transform = "translate(-50%, -50%) scale(0.35)";
        }
      });

      wakeLoop();
    };

    const triggerReveal = () => {
      if (isRevealedRef.current) return;
      isRevealedRef.current = true;
      setIsRevealed(true);

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced) {
        ensureRevealed();
        return;
      }

      if (revealTimelineRef.current) {
        revealTimelineRef.current.kill();
      }

      // Smooth one-shot cascade from North (Kasaragod) down to South (Trivandrum)
      const tl = gsap.timeline({
        onUpdate: () => {
          wakeLoop();
        },
        onComplete: () => {
          ensureRevealed();
        },
      });
      revealTimelineRef.current = tl;

      NORTH_TO_SOUTH_DISTRICTS.forEach((name, idx) => {
        const st = districtRevealStates.get(name);
        const grp = districtGroups.get(name);
        if (!st || !grp) return;

        st.scale = 0;
        st.offsetY = 0.38; // Coming from the top (North)
        st.offsetZ = -0.32; // Popping up towards camera
        grp.scale.set(0, 0, 0);
        grp.position.set(grp.userData.centroidX, grp.userData.centroidY + 0.38, -0.32);

        // Sequence from top (Kasaragod) down to bottom (Trivandrum) one by one in order
        const delay = idx * 0.055;

        tl.to(
          st,
          {
            scale: 1,
            offsetY: 0,
            offsetZ: 0,
            duration: 0.65,
            ease: "power2.out",
            onUpdate: () => {
              const s = Math.max(0, st.scale);
              grp.scale.set(s, s, s);
              grp.position.y = grp.userData.centroidY + st.offsetY;
              grp.position.z = st.offsetZ;
            },
          },
          delay
        );
      });
    };

    // ── IntersectionObserver: Trigger reveal strictly when user scrolls and reaches map viewport ──
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          isVisible = true;
          if (!isRevealedRef.current) {
            triggerReveal();
          }
          wakeLoop();
        } else {
          const rect = entry.boundingClientRect;
          if (rect.top > window.innerHeight || rect.bottom < 0) {
            isVisible = false;
            resetReveal();
            if (animId) {
              cancelAnimationFrame(animId);
              animId = 0;
            }
          }
        }
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0 }
    );
    observer.observe(container);

    // Initial check: ONLY trigger if user reloads while already scrolled down to the map
    // NEVER trigger on page load when user is at the top hero
    if (typeof window !== "undefined" && window.scrollY > 300) {
      const initialRect = container.getBoundingClientRect();
      if (initialRect.top < window.innerHeight * 0.85 && initialRect.bottom > 0) {
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

  // Active floating district details ONLY on hover (removed from default view!)
  const tooltipDetails = hoveredDistrict ? DISTRICT_DETAILS[hoveredDistrict] : null;

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

      {/* Floating District Information Badge (ONLY displayed on hover!) */}
      {tooltipDetails && (
        <div
          className="kerala-3d-district-floating-tooltip"
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div className="district-tooltip-card">
            <div className="district-tooltip-header">
              <span className="district-tooltip-badge">District</span>
              <span className="district-tooltip-category">{tooltipDetails.category}</span>
            </div>
            <h4 className="district-tooltip-name">{tooltipDetails.name}</h4>
            <p className="district-tooltip-desc">{tooltipDetails.highlights}</p>
          </div>
        </div>
      )}
    </div>
  );
}
