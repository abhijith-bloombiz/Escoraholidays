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

// Text emergence factor: 0.0 = completely submerged/hidden underwater, 1.0 = fully emerged upright
uniform float uTextEmerge;

// Up to 8 active interactive cursor, bow wave, and letter breach ripples: (x, y, age, strength)
uniform vec4 uRipples[8];

// Base canoe placement bounds in 1666x944 normalized UV space (full forward position)
const vec2 uBoatMin = vec2(0.0947876, 0.5095280);
const vec2 uBoatMax = vec2(0.9208857, 1.0006747);

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

  // Living undulating water line at the baseline where letters meet the water
  float localWaterline = textBaselineY + totalWave * 0.0035 + rippleDisp.y * 1.2;

  // Vertical emergence rise from beneath the water:
  // When uTextEmerge = 0.0: submergeY = 0.22 (all letters submerged 70px below baseline, completely invisible)
  // When uTextEmerge = 1.0: submergeY = 0.00 (settled upright at resting baseline)
  float submergeY = (1.0 - uTextEmerge) * 0.22;

  // ── 1. UPRIGHT KERALA TEXT IN AIR (Above the living waterline) ──
  if (uv.y <= localWaterline) {
    // Running water drip distortion while emerging
    float drip = sin(uv.y * 120.0 - t * 6.5) * 0.0012 * (1.0 - uTextEmerge * 0.85);
    vec2 airTextUv = vec2(uv.x, uv.y - submergeY + drip);

    if (airTextUv.x >= 0.0 && airTextUv.x <= 1.0 && airTextUv.y >= 0.358 && airTextUv.y <= 0.545) {
      vec4 textSample = texture2D(uText, airTextUv);

      // Soft ambient sun drop shadow on distant mountains/scenery behind letters
      if (uTextEmerge > 0.05) {
        vec2 shadowUv = vec2(uv.x - 0.0016, uv.y - submergeY + 0.0035);
        if (shadowUv.x >= 0.0 && shadowUv.x <= 1.0 && shadowUv.y >= 0.358 && shadowUv.y <= 0.545) {
          float shadowAlpha = texture2D(uText, shadowUv).a;
          col.rgb *= (1.0 - shadowAlpha * 0.28 * uTextEmerge * (1.0 - textSample.a));
        }
      }

      if (textSample.a > 0.002) {
        // Crisp, brilliant white letters matching the approved reference
        vec3 letterCol = mix(vec3(0.99, 0.99, 1.0), vec3(1.0, 0.99, 0.96), sunWarmth * 0.35);

        // Fresh water wetness sheen glistening in the morning sun
        float distToWater = clamp((localWaterline - uv.y) / 0.16, 0.0, 1.0);
        float wetGlisten = pow(1.0 - distToWater, 2.5) * (0.35 + 0.65 * sin(uv.x * 55.0 + t * 3.0));
        letterCol += vec3(0.12, 0.15, 0.18) * wetGlisten * (1.0 - uTextEmerge * 0.4);

        col.rgb = mix(col.rgb, letterCol, textSample.a);
      }
    }
  } else {
    // ── 2. BELOW WATERLINE: Living Lake Reflection & Underwater Physics ──
    // Authentic surface reflection of the upright letters rippling on the lake water
    if (uTextEmerge > 0.05) {
      float distBelow = uv.y - localWaterline;
      float reflectedAirY = localWaterline - distBelow * 0.88;
      vec2 reflectUv = vec2(uv.x + disp.x * 3.0, reflectedAirY - submergeY + disp.y * 1.5);

      if (reflectUv.x >= 0.0 && reflectUv.x <= 1.0 && reflectUv.y >= 0.358 && reflectUv.y <= 0.545) {
        vec4 reflectSample = texture2D(uText, reflectUv);
        if (reflectSample.a > 0.002) {
          float reflectFade = exp(-distBelow * 7.5) * uTextEmerge;
          vec3 reflectCol = vec3(0.94, 0.95, 0.98) * (1.0 + shimmer * 0.4);
          col.rgb = mix(col.rgb, reflectCol, reflectSample.a * reflectFade * 0.65);
        }
      }
    }

    // Underwater portion of the letter while rising from the deep
    if (uTextEmerge > 0.04 && uTextEmerge < 0.95) {
      vec2 underwaterDisp = disp * 2.4;
      vec2 underTextUv = vec2(uv.x + underwaterDisp.x, uv.y - submergeY + underwaterDisp.y);

      if (underTextUv.x >= 0.0 && underTextUv.x <= 1.0 && underTextUv.y >= 0.358 && underTextUv.y <= 0.545) {
        vec4 underSample = texture2D(uText, underTextUv);
        if (underSample.a > 0.002) {
          float subDepth = clamp((uv.y - localWaterline) / 0.14, 0.0, 1.0);
          vec3 waterTint = vec3(0.06, 0.22, 0.17);
          vec3 underCol = mix(vec3(0.92, 0.94, 0.90) * 0.85, waterTint, subDepth * 0.82);

          // Dancing underwater caustics
          float caustic = sin(uv.x * 48.0 + t * 2.7) * cos(uv.y * 42.0 - t * 2.1) +
                          sin(uv.x * 82.0 - uv.y * 64.0 + t * 3.3) * 0.45;
          underCol += vec3(0.70, 0.90, 0.80) * clamp(caustic * 0.35 + 0.08, 0.0, 0.55) * (1.0 - subDepth * 0.6);

          float revealAlpha = smoothstep(0.04, 0.35, uTextEmerge) * (1.0 - subDepth * 0.75) * (1.0 - uTextEmerge) * underSample.a * 0.65;
          col.rgb = mix(col.rgb, underCol, revealAlpha);
        }
      }
    }
  }

  // ── 3. SURFACE MENISCUS FOAM & SUNLIGHT GLINT AT WATERLINE BREACH ──
  // Sparkling water line where letters cut through the air-water boundary
  float distToWaterline = abs(uv.y - localWaterline);
  if (distToWaterline < 0.0075 && mask > 0.04 && uTextEmerge > 0.06) {
    vec2 breachUv = vec2(uv.x, textBaselineY - submergeY);
    if (breachUv.x >= 0.0 && breachUv.x <= 1.0 && breachUv.y >= 0.358 && breachUv.y <= 0.545) {
      vec4 breachSample = texture2D(uText, breachUv);
      if (breachSample.a > 0.08) {
        float meniscus = smoothstep(0.0075, 0.0, distToWaterline) * breachSample.a;
        float sparkle = sin(uv.x * 140.0 + t * 5.0) * 0.35 + 0.65;
        vec3 foamGlint = vec3(1.0, 1.0, 0.95);
        col.rgb = mix(col.rgb, foamGlint, meniscus * 0.88 * sparkle * smoothstep(0.08, 0.45, uTextEmerge));
      }
    }
  }

  // ── 4. FOREGROUND CANOE BOAT COMPOSITING ──
  // Composite the Rustic Wooden Canoe Bow in the boat area over water, text, and reflections
  vec2 effectiveBoatMin = uBoatMin + vec2(uBoatOffset.x, uBoatOffset.y + uBoatBob);
  vec2 effectiveBoatMax = uBoatMax + vec2(uBoatOffset.x, uBoatOffset.y + uBoatBob);

  if (uv.x >= effectiveBoatMin.x && uv.x <= effectiveBoatMax.x &&
      uv.y >= effectiveBoatMin.y && uv.y <= effectiveBoatMax.y) {
    vec2 boatUv = (uv - effectiveBoatMin) / (effectiveBoatMax - effectiveBoatMin);
    if (boatUv.x >= 0.0 && boatUv.x <= 1.0 && boatUv.y >= 0.0 && boatUv.y <= 1.0) {
      vec4 boatCol = texture2D(uBoat, boatUv);
      col.rgb = mix(col.rgb, boatCol.rgb, boatCol.a);
    }
  }

  gl_FragColor = col;
}
`;

// Letter centers in normalized 1666x944 UV space for physical ripple generation
const LETTER_CENTERS = [0.1903, 0.3103, 0.4346, 0.5648, 0.6927, 0.8109];
const LETTER_WATERLINE_Y = 0.5445;

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

  // Hover emergence dynamics state
  const targetEmergeRef = useRef(0.0); // 0.0 = submerged, 1.0 = fully emerged
  const currentEmergeRef = useRef(0.0);
  const lastTargetEmergeRef = useRef(0.0);
  const firedMilestonesRef = useRef<Set<number>>(new Set());

  // Dedicated scroll interception state:
  // 'docked'  : boat at initial half-visible state. First scroll gesture is intercepted exclusively for the forward glide.
  // 'gliding' : boat is moving forward (~1.0s). Page scroll remains locked in hero.
  // 'forward' : boat is fully arrived. Page scroll to subsequent sections is unlocked.
  const boatStageRef = useRef<"docked" | "gliding" | "forward">("docked");
  const targetProgressRef = useRef(0.0);
  const currentProgressRef = useRef(0.0);
  const glideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dedicated scroll & gesture interception for the boat forward glide
  useEffect(() => {
    // If the page was refreshed down-page, set boat immediately forward
    if ((window.scrollY || window.pageYOffset || 0) > 30) {
      boatStageRef.current = "forward";
      targetProgressRef.current = 1.0;
      currentProgressRef.current = 1.0;
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
        }, 1100);
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

      // If at top of page, boat is forward, and user scrolls UP: re-dock the boat
      if (scrollY <= 2 && boatStageRef.current === "forward" && e.deltaY < -15) {
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
      }
    }

    // General scroll listener to re-arm docking and submerge text when scrolled away
    function handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (scrollY > 120) {
        targetEmergeRef.current = 0.0;
      }
      if (scrollY > 50) {
        boatStageRef.current = "forward";
        targetProgressRef.current = 1.0;
        window.__lenis?.start();
      } else if (scrollY <= 2 && boatStageRef.current === "forward") {
        // Re-arm when user returns to top and settles
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          if ((window.scrollY || 0) <= 2) {
            boatStageRef.current = "docked";
            targetProgressRef.current = 0.0;
          }
        }, 650);
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
    const uTextEmergeLoc = gl.getUniformLocation(program, "uTextEmerge");
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
    gl.uniform1f(uTextEmergeLoc, 0.0);

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
          if (!entry.isIntersecting) {
            targetEmergeRef.current = 0.0;
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(parentContainer);
    }

    // Pointer move listener to spawn subtle interactive water ripples & ensure emerged when hovering
    function handlePointerMove(e: PointerEvent) {
      if (!parentContainer) return;
      if (targetEmergeRef.current !== 1.0) {
        targetEmergeRef.current = 1.0;
      }

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

    // Hover Enter & Leave events for physical emergence
    function handlePointerEnter() {
      targetEmergeRef.current = 1.0;
    }

    function handlePointerLeave() {
      targetEmergeRef.current = 0.0;
    }

    // Mobile / Touch interaction to toggle emergence
    function handleTouchStart() {
      targetEmergeRef.current = targetEmergeRef.current > 0.5 ? 0.0 : 1.0;
    }

    // Optional click on hero background to trigger forward glide if docked
    function handleContainerClick() {
      if (boatStageRef.current === "docked" && (window.scrollY || 0) <= 8) {
        boatStageRef.current = "gliding";
        targetProgressRef.current = 1.0;
        window.__lenis?.stop();
        if (glideTimeoutRef.current) clearTimeout(glideTimeoutRef.current);
        glideTimeoutRef.current = setTimeout(() => {
          boatStageRef.current = "forward";
          window.__lenis?.start();
        }, 1100);
      }
    }

    const eventTarget = parentContainer || window;
    eventTarget.addEventListener("pointermove", handlePointerMove as EventListener, {
      passive: true,
    });
    eventTarget.addEventListener("pointerenter", handlePointerEnter as EventListener);
    eventTarget.addEventListener("pointerleave", handlePointerLeave as EventListener);
    eventTarget.addEventListener("touchstart", handleTouchStart as EventListener, { passive: true });
    parentContainer?.addEventListener("click", handleContainerClick);

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
      // 0.22 UV units offset downwards initially = half portion of boat showing
      const initialOffsetY = 0.22;
      const currentOffsetY = initialOffsetY * (1.0 - progress);

      // Natural floating heave & bobbing rhythm on water
      const bob = Math.sin(now * 1.5) * 0.0055 + Math.cos(now * 2.2) * 0.0025;

      // Subtle dynamic bow surge/dip while actively gliding forward
      const delta = targetProgressRef.current - progress;
      const surgeDip = delta * 0.015;

      gl.uniform2f(uBoatOffsetLoc, 0.0, currentOffsetY + surgeDip);
      gl.uniform1f(uBoatBobLoc, prefersReducedMotion ? 0.0 : bob);

      // ── Physical Water Emergence & Hover Easing ──
      const targetEmerge = targetEmergeRef.current;
      if (targetEmerge !== lastTargetEmergeRef.current) {
        lastTargetEmergeRef.current = targetEmerge;
        firedMilestonesRef.current.clear();
      }

      // Organic buoyant rise & damping sink speed
      const lerpSpeedEmerge = targetEmerge > currentEmergeRef.current ? 0.048 : 0.038;
      currentEmergeRef.current += (targetEmerge - currentEmergeRef.current) * lerpSpeedEmerge;

      if (Math.abs(targetEmerge - currentEmergeRef.current) < 0.001) {
        currentEmergeRef.current = targetEmerge;
      }

      const emergeVal = currentEmergeRef.current;
      gl.uniform1f(uTextEmergeLoc, prefersReducedMotion ? targetEmerge : emergeVal);

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

      // Staggered breach ripples when rising through the water surface
      if (targetEmerge === 1.0) {
        if (emergeVal >= 0.25 && !firedMilestonesRef.current.has(1)) {
          firedMilestonesRef.current.add(1);
          spawnLetterBreachRipple(0, 0.85); // 'K'
          spawnLetterBreachRipple(5, 0.85); // 'A'
        }
        if (emergeVal >= 0.42 && !firedMilestonesRef.current.has(2)) {
          firedMilestonesRef.current.add(2);
          spawnLetterBreachRipple(1, 0.90); // 'E'
          spawnLetterBreachRipple(4, 0.90); // 'L'
        }
        if (emergeVal >= 0.60 && !firedMilestonesRef.current.has(3)) {
          firedMilestonesRef.current.add(3);
          spawnLetterBreachRipple(2, 0.95); // 'R'
          spawnLetterBreachRipple(3, 0.95); // 'A'
        }
      } else {
        // Plunging ripples when sinking back underwater
        if (emergeVal <= 0.65 && !firedMilestonesRef.current.has(4)) {
          firedMilestonesRef.current.add(4);
          spawnLetterBreachRipple(2, 0.60);
          spawnLetterBreachRipple(3, 0.60);
        }
        if (emergeVal <= 0.48 && !firedMilestonesRef.current.has(5)) {
          firedMilestonesRef.current.add(5);
          spawnLetterBreachRipple(1, 0.60);
          spawnLetterBreachRipple(4, 0.60);
        }
        if (emergeVal <= 0.30 && !firedMilestonesRef.current.has(6)) {
          firedMilestonesRef.current.add(6);
          spawnLetterBreachRipple(0, 0.60);
          spawnLetterBreachRipple(5, 0.60);
        }
      }

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
      eventTarget.removeEventListener("pointerenter", handlePointerEnter as EventListener);
      eventTarget.removeEventListener("pointerleave", handlePointerLeave as EventListener);
      eventTarget.removeEventListener("touchstart", handleTouchStart as EventListener);
      parentContainer?.removeEventListener("click", handleContainerClick);
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
