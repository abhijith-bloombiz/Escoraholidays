import React, { useEffect, useRef, useState } from "react";
import heroBg from "@assets/escora/hero-bg.png";
import heroWaterMask from "@assets/escora/hero-water-mask.png";
import heroBoat from "@assets/escora/Rustic Wooden Canoe Interior Bow.png";
import heroCompositeHalf from "@assets/escora/hero-bg-clean-half.png";
import heroKeralaText from "@assets/escora/hero-kerala-upright.png";
import "./FloatingWaterHero.css";

interface Ripple {
  x: number;
  y: number;
  birth: number; // timestamp in seconds
  strength: number;
}

interface FloatingWaterHeroProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

const VERTEX_SHADER_SRC = `
attribute vec2 aPosition;
varying vec2 vCoord; // 0..1 in screen space (y=0 top, y=1 bottom)

void main() {
  vCoord = vec2((aPosition.x + 1.0) * 0.5, (1.0 - aPosition.y) * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 vCoord;

uniform sampler2D uTexture;
uniform sampler2D uMask;
uniform sampler2D uBoat;
uniform sampler2D uText;
uniform float uTime;
uniform vec2 uResolution;
uniform float uImageAspect;

// Boat dynamic displacement: offset (glide forward) + floating heave/bob
uniform vec2 uBoatOffset;
uniform float uBoatBob;

// Per-letter emergence factors for K-E-R-A-L-A (6 letters)
// 0.0 = completely submerged, 1.0 = fully emerged upright
uniform float uLetterEmerge[6];

float getLetterEmerge(float x) {
  if (x < 0.2704) return uLetterEmerge[0];
  if (x < 0.3682) return uLetterEmerge[1];
  if (x < 0.4877) return uLetterEmerge[2];
  if (x < 0.6210) return uLetterEmerge[3];
  if (x < 0.7140) return uLetterEmerge[4];
  return uLetterEmerge[5];
}

// Up to 8 active interactive cursor, bow wave, and letter breach ripples: (x, y, age, strength)
uniform vec4 uRipples[8];

// Base canoe placement bounds in 1666x944 normalized UV space (full forward position)
const vec2 uBoatMin = vec2(0.0701253, 0.5095280);
const vec2 uBoatMax = vec2(0.9455480, 1.0300000);

// Exact baseline Y where the upright letters meet the lake water in 1666x944 UV space
const float textBaselineY = 0.5445;

void main() {
  float containerAspect = uResolution.x / uResolution.y;
  vec2 uv;

  // Background-size: cover; background-position: center bottom
  if (containerAspect >= uImageAspect) {
    uv.x = vCoord.x;
    uv.y = 1.0 + (vCoord.y - 1.0) * (uImageAspect / containerAspect);
  } else {
    uv.x = 0.5 + (vCoord.x - 0.5) * (containerAspect / uImageAspect);
    uv.y = vCoord.y;
  }

  // Outside cropped area
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Sample water mask (1.0 = water, 0.0 = sky/mountains/shore)
  float mask = texture2D(uMask, uv).r;

  // Perspective depth scaling:
  // Water extends from distant shoreline (~0.46) to foreground bottom (1.0)
  float depth = clamp((uv.y - 0.46) / 0.54, 0.0, 1.0);
  float depthScale = mix(0.25, 1.0, depth);

  // Organic multi-harmonic lake floating swells (Kerala tranquil water rhythm)
  float t = uTime;
  float w1 = sin(uv.x * 16.0 + t * 1.35 + sin(uv.y * 8.0));
  float w2 = sin(uv.x * 28.0 - t * 1.65 + cos(uv.y * 14.0)) * 0.45;
  float w3 = cos(uv.x * 52.0 + uv.y * 26.0 + t * 2.3) * 0.22;
  float w4 = sin(uv.x * 76.0 - uv.y * 38.0 + t * 3.1) * 0.12;

  float totalWave = w1 + w2 + w3 + w4;

  // Gentle horizontal drift and vertical undulating swell
  float dx = cos(uv.x * 20.0 + t * 1.1 + w1 * 0.4) * 0.0032 * depthScale;
  float dy = totalWave * 0.0052 * depthScale;

  // Interactive cursor, bow wave, and letter breach ripples
  vec2 rippleDisp = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    vec4 rip = uRipples[i];
    float age = rip.z;
    if (age > 0.0 && age < 3.0) {
      vec2 diff = (uv - rip.xy) * vec2(uImageAspect, 1.0);
      float d = length(diff);
      float waveFront = age * 0.17; // expanding ring
      float distToFront = abs(d - waveFront);
      if (distToFront < 0.09) {
        float envelope = exp(-distToFront * 28.0) * exp(-age * 1.25) * rip.w;
        float waveVal = sin(distToFront * 52.0) * envelope;
        vec2 dir = d > 0.001 ? normalize(diff) : vec2(0.0, 1.0);
        rippleDisp += dir * waveVal * 0.0065;
      }
    }
  }

  // Smoothly blend displacement based on water mask
  vec2 disp = (vec2(dx, dy) + rippleDisp) * mask;
  vec2 sampleUv = clamp(uv + disp, vec2(0.001), vec2(0.999));

  // Base pristine scenery & undulating water
  vec4 col = texture2D(uTexture, sampleUv);

  // Specular morning sun shimmer on water ripples (strongest on sunlit left side)
  float slope = (w1 + w2) * 0.5 + rippleDisp.y * 40.0;
  float sunWarmth = smoothstep(0.75, 0.1, uv.x); // golden sunlight on the left
  float shimmer = clamp(slope * 0.65, 0.0, 1.0) * sunWarmth * mask * depthScale;
  col.rgb += vec3(0.95, 0.85, 0.60) * shimmer * 0.18;

  // Fixed waterline at textBaselineY anchors the reflection seamlessly to the upright letters
  float localWaterline = textBaselineY;

  // Vertical emergence rise from beneath the water for each letter:
  // Each letter (K-E-R-A-L-A) has its own emergence factor based on uv.x
  float letterEmerge = getLetterEmerge(uv.x);
  float submergeY = (1.0 - letterEmerge) * 0.22;

  // ── 1. UPRIGHT KERALA TEXT IN AIR (Above the waterline) ──
  if (uv.y <= localWaterline) {
    // Running water drip distortion while emerging
    float drip = sin(uv.y * 120.0 - t * 5.0) * 0.0008 * (1.0 - letterEmerge);
    vec2 airTextUv = vec2(uv.x, clamp(uv.y - submergeY + drip, 0.358, textBaselineY));

    if (airTextUv.x >= 0.0 && airTextUv.x <= 1.0) {
      vec4 textSample = texture2D(uText, airTextUv);

      // Soft ambient sun drop shadow on distant mountains/scenery behind letters
      if (letterEmerge > 0.05) {
        vec2 shadowUv = vec2(uv.x - 0.0016, clamp(uv.y - submergeY + 0.0035, 0.358, textBaselineY));
        if (shadowUv.x >= 0.0 && shadowUv.x <= 1.0) {
          float shadowAlpha = texture2D(uText, shadowUv).a;
          col.rgb *= (1.0 - shadowAlpha * 0.28 * letterEmerge * (1.0 - textSample.a));
        }
      }

      if (textSample.a > 0.002) {
        // Crisp, brilliant white letters matching the approved reference
        vec3 letterCol = mix(vec3(0.99, 0.99, 1.0), vec3(1.0, 0.99, 0.96), sunWarmth * 0.35);

        // Fresh water wetness sheen glistening in the morning sun
        float distToWater = clamp((localWaterline - uv.y) / 0.16, 0.0, 1.0);
        float wetGlisten = pow(1.0 - distToWater, 2.5) * (0.35 + 0.65 * sin(uv.x * 55.0 + t * 3.0));
        letterCol += vec3(0.12, 0.15, 0.18) * wetGlisten * (1.0 - letterEmerge * 0.4);

        col.rgb = mix(col.rgb, letterCol, textSample.a);
      }
    }
  } else {
    // ── 2. BELOW WATERLINE: Living Lake Reflection & Underwater Physics ──
    // Authentic surface reflection of the upright letters rippling on the lake water
    if (letterEmerge > 0.05) {
      float distBelow = uv.y - localWaterline;
      // depthFactor is 0.0 at the contact line, ensuring zero gap and zero tearing at the waterline
      float depthFactor = smoothstep(0.0, 0.035, distBelow);

      // Gentle, calm, realistic Kerala backwater ripples (subtle movement, no harsh distortion)
      float wavePhase1 = distBelow * 55.0 - t * 2.0 + uv.x * 24.0;
      float wavePhase2 = distBelow * 95.0 + t * 2.8 - uv.x * 14.0;
      float rippleX = (sin(wavePhase1) * 0.0016 + cos(wavePhase2) * 0.0008) * depthFactor;
      float rippleY = cos(uv.x * 28.0 + t * 1.5 + distBelow * 40.0) * 0.0006 * depthFactor;

      // Subtle interaction with boat wake and ripples (gentle, not jagged)
      float wakeX = rippleDisp.x * 0.30 * depthFactor;
      float wakeY = rippleDisp.y * 0.12 * depthFactor;

      float reflectY = textBaselineY - distBelow * 0.95 - submergeY + rippleY + wakeY;
      reflectY = clamp(reflectY, 0.358, textBaselineY);
      vec2 reflectUv = vec2(uv.x + rippleX + wakeX, reflectY);

      if (reflectUv.x >= 0.0 && reflectUv.x <= 1.0) {
        vec4 reflectSample = texture2D(uText, reflectUv);
        if (reflectSample.a > 0.002) {
          // Smooth depth attenuation down into the backwater lake
          float reflectFade = exp(-distBelow * 8.5) * letterEmerge;
          
          // Realistic translucent reflection: soft luminous white tinted by water & sun warmth
          vec3 waterReflectCol = mix(vec3(0.90, 0.94, 0.97), vec3(0.97, 0.95, 0.90), sunWarmth * 0.35);
          waterReflectCol *= (1.0 + shimmer * 0.3);

          col.rgb = mix(col.rgb, waterReflectCol, reflectSample.a * reflectFade * 0.44);
        }
      }
    }

    // Underwater portion of the letter while rising from the deep
    if (letterEmerge > 0.04 && letterEmerge < 0.95) {
      vec2 underwaterDisp = disp * 1.2;
      vec2 underTextUv = vec2(uv.x + underwaterDisp.x, clamp(uv.y - submergeY + underwaterDisp.y, 0.358, textBaselineY));

      if (underTextUv.x >= 0.0 && underTextUv.x <= 1.0) {
        vec4 underSample = texture2D(uText, underTextUv);
        if (underSample.a > 0.002) {
          float subDepth = clamp((uv.y - localWaterline) / 0.14, 0.0, 1.0);
          vec3 waterTint = vec3(0.06, 0.22, 0.17);
          vec3 underCol = mix(vec3(0.92, 0.94, 0.90) * 0.85, waterTint, subDepth * 0.82);

          // Dancing underwater caustics
          float caustic = sin(uv.x * 48.0 + t * 2.7) * cos(uv.y * 42.0 - t * 2.1) +
                          sin(uv.x * 82.0 - uv.y * 64.0 + t * 3.3) * 0.45;
          underCol += vec3(0.70, 0.90, 0.80) * clamp(caustic * 0.35 + 0.08, 0.0, 0.55) * (1.0 - subDepth * 0.6);

          float revealAlpha = smoothstep(0.04, 0.35, letterEmerge) * (1.0 - subDepth * 0.75) * (1.0 - letterEmerge) * underSample.a * 0.55;
          col.rgb = mix(col.rgb, underCol, revealAlpha);
        }
      }
    }
  }

  // ── 3. DELICATE WATERLINE MENISCUS CONTACT ──
  // A delicate 2px surface tension glint where the letters meet the water (seamless contact)
  float distToWaterline = abs(uv.y - localWaterline);
  if (distToWaterline < 0.0025 && mask > 0.04 && letterEmerge > 0.08) {
    vec2 breachUv = vec2(uv.x, textBaselineY - submergeY);
    if (breachUv.x >= 0.0 && breachUv.x <= 1.0 && breachUv.y >= 0.358 && breachUv.y <= textBaselineY) {
      vec4 breachSample = texture2D(uText, breachUv);
      if (breachSample.a > 0.05) {
        float meniscus = smoothstep(0.0025, 0.0, distToWaterline) * breachSample.a;
        float sparkle = sin(uv.x * 120.0 + t * 3.5) * 0.25 + 0.75;
        vec3 meniscusCol = mix(vec3(0.96, 0.98, 1.0), vec3(1.0, 0.98, 0.92), sunWarmth * 0.35);
        col.rgb = mix(col.rgb, meniscusCol, meniscus * 0.32 * sparkle * letterEmerge);
      }
    }
  }

  // ── 4. FOREGROUND CANOE BOAT COMPOSITING ──
  // Composite the Rustic Wooden Canoe Bow in the boat area over water, text, and reflections
  vec2 effectiveBoatMin = uBoatMin + vec2(uBoatOffset.x, uBoatOffset.y + uBoatBob);
  vec2 effectiveBoatMax = uBoatMax + vec2(uBoatOffset.x, uBoatOffset.y + uBoatBob);
  // Ensure the boat bottom quad never lifts above the viewport bottom (1.0),
  // completely eliminating any gap between the boat and the hero bottom border when floating
  effectiveBoatMax.y = max(1.025, effectiveBoatMax.y);

  if (uv.x >= effectiveBoatMin.x && uv.x <= effectiveBoatMax.x &&
      uv.y >= effectiveBoatMin.y && uv.y <= effectiveBoatMax.y) {
    vec2 boatUv = (uv - effectiveBoatMin) / (effectiveBoatMax - effectiveBoatMin);
    boatUv = clamp(boatUv, 0.0, 1.0);
    if (boatUv.x >= 0.0 && boatUv.x <= 1.0 && boatUv.y >= 0.0 && boatUv.y <= 1.0) {
      vec4 boatCol = texture2D(uBoat, boatUv);
      col.rgb = mix(col.rgb, boatCol.rgb, boatCol.a);
    }
  }

  gl_FragColor = col;
}
`;

// Letter centers in normalized 1666x944 UV space for physical ripple generation
const LETTER_CENTERS = [0.2104, 0.3190, 0.4295, 0.5537, 0.6681, 0.7800];
const LETTER_WATERLINE_Y = 0.5445;

// Cascading letter reveal curve:
// 6 letters: K (0), E (1), R (2), A (3), L (4), A (5)
// Each letter takes duration = 0.42 to reveal. Stagger step = 0.116.
// Next letter starts when previous letter is ~28% emerged (cascading overlap).
// Uses Ken Perlin's smootherstep curve for zero-jerk, fluid, organic buoyancy.
function getLetterEmergeVal(T: number, index: number): number {
  const duration = 0.42;
  const stagger = 0.116; // 5 * 0.116 = 0.58; 0.58 + 0.42 = 1.00
  const start = index * stagger;
  const linear = Math.max(0.0, Math.min(1.0, (T - start) / duration));
  // Smootherstep (6x^5 - 15x^4 + 10x^3) for ultra-smooth fluid start and settling
  return linear * linear * linear * (linear * (linear * 6.0 - 15.0) + 10.0);
}

export default function FloatingWaterHero({
  containerRef,
  className = "",
}: FloatingWaterHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastRippleTimeRef = useRef(0);
  const lastBowRippleRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Staggered letter emergence dynamics state (K - E - R - A - L - A)
  const targetTextProgressRef = useRef(0.0);
  const currentTextProgressRef = useRef(0.0);
  const letterBreachedRef = useRef<boolean[]>([false, false, false, false, false, false]);
  const letterSunkRef = useRef<boolean[]>([false, false, false, false, false, false]);
  const letterEmergeValuesRef = useRef<Float32Array>(new Float32Array(6));

  // Dedicated scroll interception state:
  // 'docked'  : boat at initial half-visible state. First scroll gesture is intercepted exclusively for the forward glide.
  // 'gliding' : boat is moving forward (~1.0s). Page scroll remains locked in hero.
  // 'forward' : boat is fully arrived. Page scroll to subsequent sections is unlocked.
  const boatStageRef = useRef<"docked" | "gliding" | "forward">("docked");
  const targetProgressRef = useRef(0.0);
  const currentProgressRef = useRef(0.0);
  const glideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dedicated scroll & gesture interception for the boat forward glide & text emergence
  useEffect(() => {
    // If the page was refreshed down-page, set boat and text immediately forward
    if ((window.scrollY || window.pageYOffset || 0) > 30) {
      boatStageRef.current = "forward";
      targetProgressRef.current = 1.0;
      currentProgressRef.current = 1.0;
      targetTextProgressRef.current = 1.0;
      currentTextProgressRef.current = 1.0;
      letterEmergeValuesRef.current.fill(1.0);
    }

    function triggerForwardGlide() {
      if (boatStageRef.current === "docked") {
        boatStageRef.current = "gliding";
        targetProgressRef.current = 1.0;
        window.__lenis?.stop();

        if (glideTimeoutRef.current) clearTimeout(glideTimeoutRef.current);
        glideTimeoutRef.current = setTimeout(() => {
          boatStageRef.current = "forward";
          window.__lenis?.start();
        }, 2500);
      }
    }

    // Intercept wheel in capture phase so Lenis & native scroll do not move to next section
    function handleWheelCapture(e: WheelEvent) {
      const scrollY = window.scrollY || window.pageYOffset || 0;

      // When at top of page and boat is not yet forward:
      if (scrollY <= 8 && boatStageRef.current !== "forward") {
        if (e.deltaY > 2) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.__lenis?.stop();
          triggerForwardGlide();
          return;
        }
      }

      // If at top of page, boat is forward, and user scrolls UP: re-dock boat and reverse text smoothly
      if (scrollY <= 5 && boatStageRef.current === "forward" && e.deltaY < -2) {
        boatStageRef.current = "docked";
        targetProgressRef.current = 0.0;
      }
    }

    // Touch gesture interception for mobile / tablet
    let touchStartY = 0;
    function handleTouchStartCapture(e: TouchEvent) {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }

    function handleTouchMoveCapture(e: TouchEvent) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (scrollY <= 8 && boatStageRef.current !== "forward" && e.touches.length > 0) {
        const deltaY = touchStartY - e.touches[0].clientY;
        if (deltaY > 6) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.__lenis?.stop();
          triggerForwardGlide();
        }
      } else if (scrollY <= 5 && boatStageRef.current === "forward" && e.touches.length > 0) {
        const deltaY = touchStartY - e.touches[0].clientY;
        if (deltaY < -10) {
          boatStageRef.current = "docked";
          targetProgressRef.current = 0.0;
        }
      }
    }

    // Keyboard arrow down / space / page down interception at top of page
    function handleKeyDownCapture(e: KeyboardEvent) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (scrollY <= 8 && boatStageRef.current === "docked") {
        if (["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key)) {
          const active = document.activeElement;
          if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          triggerForwardGlide();
        }
      } else if (scrollY <= 5 && boatStageRef.current === "forward") {
        if (["ArrowUp", "PageUp"].includes(e.key)) {
          const active = document.activeElement;
          if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
          boatStageRef.current = "docked";
          targetProgressRef.current = 0.0;
        }
      }
    }

    // General scroll listener: ensure boat emerges whenever page is scrolled down
    function handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (scrollY > 10) {
        if (boatStageRef.current === "docked") {
          boatStageRef.current = "forward";
        }
        targetProgressRef.current = 1.0;
        window.__lenis?.start();
      }
    }

    window.addEventListener("wheel", handleWheelCapture, { passive: false, capture: true });
    window.addEventListener("touchstart", handleTouchStartCapture, { passive: true, capture: true });
    window.addEventListener("touchmove", handleTouchMoveCapture, { passive: false, capture: true });
    window.addEventListener("keydown", handleKeyDownCapture, { capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheelCapture, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchstart", handleTouchStartCapture, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchmove", handleTouchMoveCapture, { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown", handleKeyDownCapture, { capture: true } as EventListenerOptions);
      window.removeEventListener("scroll", handleScroll);
      if (glideTimeoutRef.current) clearTimeout(glideTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      window.__lenis?.start();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: "high-performance",
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("WebGL not supported; falling back to static hero image.");
      return;
    }

    // Helper: compile shader
    function createShader(type: number, src: string): WebGLShader | null {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Fullscreen quad buffer
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTextureLoc = gl.getUniformLocation(program, "uTexture");
    const uMaskLoc = gl.getUniformLocation(program, "uMask");
    const uBoatLoc = gl.getUniformLocation(program, "uBoat");
    const uTextLoc = gl.getUniformLocation(program, "uText");
    const uLetterEmergeLoc = gl.getUniformLocation(program, "uLetterEmerge");
    const uTimeLoc = gl.getUniformLocation(program, "uTime");
    const uResolutionLoc = gl.getUniformLocation(program, "uResolution");
    const uImageAspectLoc = gl.getUniformLocation(program, "uImageAspect");
    const uRipplesLoc = gl.getUniformLocation(program, "uRipples");
    const uBoatOffsetLoc = gl.getUniformLocation(program, "uBoatOffset");
    const uBoatBobLoc = gl.getUniformLocation(program, "uBoatBob");

    const imgAspect = 1666.0 / 944.0;
    gl.uniform1f(uImageAspectLoc, imgAspect);
    gl.uniform1i(uTextureLoc, 0);
    gl.uniform1i(uMaskLoc, 1);
    gl.uniform1i(uBoatLoc, 2);
    gl.uniform1i(uTextLoc, 3);
    gl.uniform1fv(uLetterEmergeLoc, letterEmergeValuesRef.current);

    // Create Textures
    const textureHero = gl.createTexture();
    const textureMask = gl.createTexture();
    const textureBoat = gl.createTexture();
    const textureText = gl.createTexture();

    let heroLoaded = false;
    let maskLoaded = false;
    let boatLoaded = false;
    let textLoaded = false;

    function checkReady() {
      if (heroLoaded && maskLoaded && boatLoaded && textLoaded) {
        setIsReady(true);
      }
    }

    const imgHero = new Image();
    imgHero.crossOrigin = "anonymous";
    imgHero.src = heroBg;
    imgHero.onload = () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureHero);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        imgHero
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      heroLoaded = true;
      checkReady();
    };

    const imgMask = new Image();
    imgMask.crossOrigin = "anonymous";
    imgMask.src = heroWaterMask;
    imgMask.onload = () => {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textureMask);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        imgMask
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      maskLoaded = true;
      checkReady();
    };

    const imgBoat = new Image();
    imgBoat.crossOrigin = "anonymous";
    imgBoat.src = heroBoat;
    imgBoat.onload = () => {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, textureBoat);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imgBoat
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      boatLoaded = true;
      checkReady();
    };

    const imgText = new Image();
    imgText.crossOrigin = "anonymous";
    imgText.src = heroKeralaText;
    imgText.onload = () => {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, textureText);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imgText
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textLoaded = true;
      checkReady();
    };

    // Resize handler
    function handleResize() {
      if (!canvas || !gl) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uResolutionLoc, rect.width, rect.height);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    // Visibility Observer to pause RAF when scrolled off-screen
    const parentContainer = containerRef?.current || canvas.parentElement;
    let observer: IntersectionObserver | null = null;
    if (parentContainer && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisibleRef.current = entry.isIntersecting;
        },
        { threshold: 0.05 }
      );
      observer.observe(parentContainer);
    }

    // Pointer move listener to spawn subtle interactive water ripples on cursor movement over water
    function handlePointerMove(e: PointerEvent) {
      if (!parentContainer) return;

      const now = performance.now() / 1000;
      if (now - lastRippleTimeRef.current < 0.12) return; // throttle cursor ripples

      const rect = parentContainer.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      // Map screen coords to image UV
      const containerAspect = rect.width / rect.height;
      let uvX: number;
      let uvY: number;

      if (containerAspect >= imgAspect) {
        uvX = nx;
        uvY = 1.0 + (ny - 1.0) * (imgAspect / containerAspect);
      } else {
        uvX = 0.5 + (nx - 0.5) * (containerAspect / imgAspect);
        uvY = ny;
      }

      // Check if pointer is over the water region
      if (uvY > 0.46 && uvX >= 0 && uvX <= 1 && uvY <= 1) {
        lastRippleTimeRef.current = now;
        ripplesRef.current.push({
          x: uvX,
          y: uvY,
          birth: now,
          strength: 1.0,
        });
        if (ripplesRef.current.length > 8) {
          ripplesRef.current.shift();
        }
      }
    }

    const eventTarget = parentContainer || window;
    eventTarget.addEventListener("pointermove", handlePointerMove as EventListener, {
      passive: true,
    });

    // Animation Loop
    let animId: number;
    const startTime = performance.now();

    function render() {
      animId = requestAnimationFrame(render);
      if (!isVisibleRef.current || !heroLoaded || !maskLoaded || !boatLoaded || !textLoaded || !gl) return;

      const now = performance.now() / 1000;
      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform1f(uTimeLoc, prefersReducedMotion ? 0.0 : elapsed);

      // Smooth critically damped lerp for forward boat glide (floating sensation)
      const lerpSpeed = 0.045;
      currentProgressRef.current +=
        (targetProgressRef.current - currentProgressRef.current) * lerpSpeed;

      const progress = currentProgressRef.current;
      // 0.12614 UV units offset downwards initially = 70% portion of boat showing with grounded bottom
      const initialOffsetY = 0.12614;
      const currentOffsetY = initialOffsetY * (1.0 - progress);

      // Natural floating heave & bobbing rhythm on water
      const bob = Math.sin(now * 1.5) * 0.0055 + Math.cos(now * 2.2) * 0.0025;

      // Subtle dynamic bow surge/dip while actively gliding forward
      const delta = targetProgressRef.current - progress;
      const surgeDip = delta * 0.015;

      gl.uniform2f(uBoatOffsetLoc, 0.0, currentOffsetY + surgeDip);
      gl.uniform1f(uBoatBobLoc, prefersReducedMotion ? 0.0 : bob);

      // ── Staggered Letter Emergence (One by One in Order, Cascading & Reversible) ──
      // Show the Kerala text only after the boat image has 80% showed (progress >= 0.8)
      if (targetProgressRef.current >= 1.0) {
        if (progress >= 0.8) {
          targetTextProgressRef.current = 1.0;
        } else {
          targetTextProgressRef.current = 0.0;
        }
      } else {
        // Scrolling back: reverse effect smoothly
        targetTextProgressRef.current = 0.0;
      }

      // Calm, slow, and ultra-smooth progress lerp for the letter reveal wave
      const lerpSpeedText = targetTextProgressRef.current > currentTextProgressRef.current ? 0.018 : 0.026;
      currentTextProgressRef.current +=
        (targetTextProgressRef.current - currentTextProgressRef.current) * lerpSpeedText;

      if (Math.abs(targetTextProgressRef.current - currentTextProgressRef.current) < 0.0005) {
        currentTextProgressRef.current = targetTextProgressRef.current;
      }

      const textT = currentTextProgressRef.current;
      const letterVals = letterEmergeValuesRef.current;

      // Helper to spawn physical waterline breach ripples at letter coordinates
      function spawnLetterBreachRipple(idx: number, strength = 0.85) {
        ripplesRef.current.push({
          x: LETTER_CENTERS[idx],
          y: LETTER_WATERLINE_Y,
          birth: now,
          strength: strength,
        });
        if (ripplesRef.current.length > 8) {
          ripplesRef.current.shift();
        }
      }

      // Update each letter's individual emergence and trigger individual breach ripples
      for (let i = 0; i < 6; i++) {
        const val = prefersReducedMotion ? targetTextProgressRef.current : getLetterEmergeVal(textT, i);
        letterVals[i] = val;

        // Physical waterline breach ripples: each letter ripples when its waterline breaches
        if (targetTextProgressRef.current >= 1.0) {
          // Surfacing in sequential order (0 -> 1 -> 2 -> 3 -> 4 -> 5)
          if (val >= 0.28 && !letterBreachedRef.current[i]) {
            letterBreachedRef.current[i] = true;
            letterSunkRef.current[i] = false;
            spawnLetterBreachRipple(i, 0.88);
          }
        } else {
          // Plunging in reverse order (5 -> 4 -> 3 -> 2 -> 1 -> 0)
          if (val <= 0.45 && !letterSunkRef.current[i]) {
            letterSunkRef.current[i] = true;
            letterBreachedRef.current[i] = false;
            spawnLetterBreachRipple(i, 0.60);
          }
        }
      }

      // Re-arm milestone flags when reaching ends
      if (textT <= 0.005) {
        for (let i = 0; i < 6; i++) letterBreachedRef.current[i] = false;
      }
      if (textT >= 0.995) {
        for (let i = 0; i < 6; i++) letterSunkRef.current[i] = false;
      }

      gl.uniform1fv(uLetterEmergeLoc, letterVals);

      // Generate subtle bow ripples when gliding forward into the lake
      if (progress > 0.05 && progress < 0.95 && Math.abs(delta) > 0.04) {
        if (now - lastBowRippleRef.current > 0.38) {
          lastBowRippleRef.current = now;
          const bowTipY = 0.5095 + currentOffsetY;
          ripplesRef.current.push({
            x: 0.5,
            y: bowTipY,
            birth: now,
            strength: 0.7,
          });
          if (ripplesRef.current.length > 8) {
            ripplesRef.current.shift();
          }
        }
      }

      // Pack active ripples (up to 8)
      const rippleData = new Float32Array(32); // 8 * 4
      const activeRipples = ripplesRef.current.filter(
        (r) => now - r.birth < 3.0
      );
      ripplesRef.current = activeRipples;

      for (let i = 0; i < 8; i++) {
        if (i < activeRipples.length) {
          const r = activeRipples[i];
          rippleData[i * 4 + 0] = r.x;
          rippleData[i * 4 + 1] = r.y;
          rippleData[i * 4 + 2] = now - r.birth; // age in seconds
          rippleData[i * 4 + 3] = r.strength;
        } else {
          rippleData[i * 4 + 2] = -1.0; // inactive
        }
      }
      gl.uniform4fv(uRipplesLoc, rippleData);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    animId = requestAnimationFrame(render);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      eventTarget.removeEventListener("pointermove", handlePointerMove as EventListener);
      if (observer && parentContainer) {
        observer.unobserve(parentContainer);
        observer.disconnect();
      }

      gl.deleteBuffer(posBuffer);
      gl.deleteTexture(textureHero);
      gl.deleteTexture(textureMask);
      gl.deleteTexture(textureBoat);
      gl.deleteTexture(textureText);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [containerRef]);

  return (
    <div className={`floating-water-hero-wrap ${className}`} aria-hidden="true">
      {/* Static background layer displayed instantly while WebGL compiles */}
      <div
        className="floating-water-fallback"
        style={{
          backgroundImage: `url(${heroCompositeHalf})`,
          opacity: isReady ? 0 : 1,
        }}
      />

      {/* WebGL Animated Canvas */}
      <canvas
        ref={canvasRef}
        className={`floating-water-canvas ${isReady ? "is-ready" : ""}`}
      />
    </div>
  );
}
