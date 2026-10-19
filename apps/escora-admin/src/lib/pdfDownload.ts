import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generates a clean, descriptive filename based on the itinerary/proposal title.
 * - Strips existing .pdf extensions
 * - Replaces separators (dashes, slashes, middle dots, colons, ampersands, etc.) with spaces
 * - Strips illegal filename characters (<>:"/\|?*)
 * - Normalizes whitespace and hyphens into single hyphens
 * - Ensures .pdf extension appears only once
 * - Falls back to "Escora-Itinerary.pdf" if empty or invalid
 */
export function formatItineraryPdfFilename(title?: string | null): string {
  const fallback = "Escora-Itinerary.pdf";
  if (!title || typeof title !== "string") {
    return fallback;
  }

  let clean = title.trim();

  // Strip trailing .pdf or .PDF
  clean = clean.replace(/\.pdf$/i, "");

  // Replace separators with spaces: em dash, en dash, middle dot, slash, backslash, colon, vertical bar, ampersand, plus, comma, underscore
  clean = clean.replace(/[—–·/\\:|&+,_]+/g, " ");

  // Remove any remaining illegal filename characters
  clean = clean.replace(/[^a-zA-Z0-9\s-]/g, "");

  // Normalize all whitespace and hyphens into single hyphens
  clean = clean.trim().replace(/[\s-]+/g, "-");

  // Remove leading and trailing hyphens
  clean = clean.replace(/^-+|-+$/g, "");

  if (!clean) {
    return fallback;
  }

  return `${clean}.pdf`;
}

/**
 * Resolves modern color functions (oklch, oklab, color-mix) into standard browser-compatible rgb/hex.
 * Modern browsers natively compute colors when assigned to Canvas 2D fillStyle.
 */
function resolveColorToRgb(colorFunctionString: string, fallback = "#39271F"): string {
  if (typeof document === "undefined") return fallback;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = colorFunctionString;
    const computed = ctx.fillStyle;
    if (computed && !computed.includes("oklch") && !computed.includes("oklab")) {
      return computed;
    }
  } catch {
    // If resolution fails, return safe fallback
  }
  return fallback;
}

/**
 * Sanitizes CSS text to prevent html2canvas color-parser exceptions.
 * html2canvas 1.4.x does not support CSS Color Module Level 4 (oklch, oklab, color-mix).
 */
function sanitizeCssText(css: string): string {
  if (!css) return "";

  // 1. Replace oklch(...) occurrences
  let sanitized = css.replace(/oklch\(([^)]+)\)/gi, (match) => {
    return resolveColorToRgb(match, "#39271F");
  });

  // 2. Replace oklab(...) occurrences
  sanitized = sanitized.replace(/oklab\(([^)]+)\)/gi, (match) => {
    return resolveColorToRgb(match, "#39271F");
  });

  // 3. Replace color-mix(...) occurrences
  sanitized = sanitized.replace(/color-mix\(([^)]+)\)/gi, "#39271F");

  // 4. Replace any modern color(...) occurrences
  sanitized = sanitized.replace(/color\((?:display-p3|a98-rgb|prophoto-rgb|rec2020|srgb)[^)]+\)/gi, "#39271F");

  return sanitized;
}

/**
 * Extracts all active stylesheet rules from the document and returns a sanitized combined CSS string.
 */
function extractAndSanitizeDocumentStyles(): string {
  let combined = "";
  if (typeof document === "undefined") return combined;

  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            combined += rules[j].cssText + "\n";
          }
        }
      } catch {
        // Cross-origin stylesheets (e.g. Google Fonts) cannot be read via cssRules;
        // they are loaded independently by html2canvas if needed or already in canvas cache.
      }
    }
  } catch (err) {
    console.warn("[Itinerary PDF] Warning reading document stylesheets:", err);
  }

  return sanitizeCssText(combined);
}

/**
 * Pre-converts all <img> elements inside target into local Base64 data URLs.
 * This completely prevents:
 * 1. html2canvas CORS image fetch errors
 * 2. Canvas taint security errors on canvas.toDataURL()
 * 3. Blank image frames when external CDNs delay response
 */
async function preinlineImages(target: HTMLElement, timeoutMs = 4000): Promise<void> {
  const imgElements = Array.from(target.querySelectorAll("img"));
  if (imgElements.length === 0) return;

  const conversions = imgElements.map(async (img) => {
    const src = img.currentSrc || img.src || img.getAttribute("src");
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(src, { mode: "cors", signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      img.src = dataUrl;
      img.setAttribute("src", dataUrl);
    } catch {
      // If conversion fails (e.g. external image without CORS headers), ensure crossOrigin is anonymous
      // so html2canvas can still attempt cross-origin load without crashing the whole export
      img.crossOrigin = "anonymous";
    }
  });

  await Promise.allSettled(conversions);
}

/**
 * Waits until .brochure-page elements are mounted in the DOM.
 */
async function waitForPages(target: HTMLElement, timeoutMs = 3000): Promise<HTMLElement[]> {
  const start = performance.now();
  while (true) {
    const pages = Array.from(target.querySelectorAll<HTMLElement>(".brochure-page"));
    if (pages.length > 0) {
      return pages;
    }
    if (performance.now() - start > timeoutMs) {
      const root = target.querySelector<HTMLElement>(".escora-brochure-root") || target;
      return [root];
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Renders a single DOM page element to canvas with fallback scale logic.
 */
async function renderPageToCanvas(
  pageEl: HTMLElement,
  sanitizedStyles: string,
  preferredScale = 2
): Promise<HTMLCanvasElement> {
  const options = {
    scale: preferredScale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#FAF7F1",
    logging: false,
    imageTimeout: 5000,
    onclone: (clonedDoc: Document) => {
      // 1. Remove all external <link rel="stylesheet"> in cloned document to prevent
      // html2canvas from making raw network requests for un-sanitized Tailwind v4 CSS
      clonedDoc.querySelectorAll("link[rel='stylesheet']").forEach((link) => {
        link.remove();
      });

      // 2. Inject pre-sanitized CSS covering all app utilities with oklch/oklab stripped
      if (sanitizedStyles) {
        const injectedStyle = clonedDoc.createElement("style");
        injectedStyle.setAttribute("data-pdf-sanitized", "true");
        injectedStyle.textContent = sanitizedStyles;
        clonedDoc.head.appendChild(injectedStyle);
      }

      // 3. Sanitize any inline <style> elements inside cloned document
      clonedDoc.querySelectorAll("style:not([data-pdf-sanitized='true'])").forEach((s) => {
        if (s.textContent) {
          s.textContent = sanitizeCssText(s.textContent);
        }
      });

      // 4. Force exact A4 dimensions and clean layout on cloned brochure pages
      clonedDoc.querySelectorAll<HTMLElement>(".brochure-page").forEach((p) => {
        p.style.boxShadow = "none";
        p.style.margin = "0";
        p.style.borderRadius = "0";
        p.style.border = "none";
        p.style.width = "210mm";
        p.style.height = "297mm";
        p.style.minHeight = "297mm";
        p.style.maxHeight = "297mm";
        p.style.background = "#FAF7F1";
        p.style.overflow = "hidden";
        p.style.position = "relative";
      });
    },
  };

  try {
    return await html2canvas(pageEl, options);
  } catch (firstErr) {
    if (preferredScale > 1) {
      console.warn("[Itinerary PDF] High-scale canvas capture failed, retrying at scale 1...", firstErr);
      return await html2canvas(pageEl, { ...options, scale: 1 });
    }
    throw firstErr;
  }
}

/**
 * Converts a DOM element (specifically the .brochure-page sections of an itinerary)
 * into a multi-page A4 PDF file and triggers an immediate direct download without
 * opening the browser print dialog, print preview, or a new tab.
 */
export async function downloadElementAsPdf(
  targetId: string,
  filename: string
): Promise<void> {
  const target = document.getElementById(targetId);
  if (!target) {
    throw new Error(`PDF target container #${targetId} was not found in the DOM.`);
  }

  // Ensure fonts (Inter, Manrope) are decoded and ready for canvas drawing
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font readiness check failure shouldn't block downloading
    }
  }

  // Save previous inline styles so we can restore them cleanly
  const prevStyle = {
    position: target.style.position,
    left: target.style.left,
    top: target.style.top,
    zIndex: target.style.zIndex,
    opacity: target.style.opacity,
    visibility: target.style.visibility,
    display: target.style.display,
    width: target.style.width,
    pointerEvents: target.style.pointerEvents,
  };

  // Position at (0, 0) behind current content with exact A4 width for crisp measurement
  target.style.position = "fixed";
  target.style.left = "0";
  target.style.top = "0";
  target.style.zIndex = "-9999";
  target.style.opacity = "1";
  target.style.visibility = "visible";
  target.style.display = "block";
  target.style.width = "210mm";
  target.style.pointerEvents = "none";

  try {
    // 1. Wait for pages to mount
    const pages = await waitForPages(target);

    // 2. Pre-inline external images into Base64 DataURLs to avoid canvas taint/CORS crashes
    await preinlineImages(target);

    // 3. Extract and sanitize all active document stylesheets once
    const sanitizedStyles = extractAndSanitizeDocumentStyles();

    // 4. Allow browser to settle layout
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const elementsToRender = pages.length > 0 ? pages : [target];

    for (let i = 0; i < elementsToRender.length; i++) {
      const pageEl = elementsToRender[i];
      const canvas = await renderPageToCanvas(pageEl, sanitizedStyles, 2);

      let imgData: string;
      try {
        imgData = canvas.toDataURL("image/jpeg", 0.95);
      } catch (taintErr) {
        console.warn("[Itinerary PDF] Direct toDataURL failed (tainted canvas), retrying with safe fallback", taintErr);
        // Fallback to PNG without quality param if JPEG fails
        imgData = canvas.toDataURL("image/png");
      }

      if (i > 0) {
        pdf.addPage("a4", "portrait");
      }

      // Add image to full A4 page (210mm x 297mm)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    // Direct download via genuine PDF Blob
    const blob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (error) {
    console.error("[Itinerary PDF] Generation failed:", error);
    throw error;
  } finally {
    // Cleanly restore the target element styles
    target.style.position = prevStyle.position;
    target.style.left = prevStyle.left;
    target.style.top = prevStyle.top;
    target.style.zIndex = prevStyle.zIndex;
    target.style.opacity = prevStyle.opacity;
    target.style.visibility = prevStyle.visibility;
    target.style.display = prevStyle.display;
    target.style.width = prevStyle.width;
    target.style.pointerEvents = prevStyle.pointerEvents;
  }
}
