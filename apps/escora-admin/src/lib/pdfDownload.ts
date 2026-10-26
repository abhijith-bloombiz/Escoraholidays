import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/**
 * Generates a clean, descriptive filename based on the itinerary/proposal title.
 */
export function formatItineraryPdfFilename(title?: string | null): string {
  const fallback = "Escora-Itinerary.pdf";
  if (!title || typeof title !== "string") {
    return fallback;
  }

  let clean = title.trim();

  // Strip trailing .pdf or .PDF
  clean = clean.replace(/\.pdf$/i, "");

  // Replace separators with spaces
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

// In-memory cache for converted Base64 data URLs to eliminate repeat network fetches
const imageBase64Cache = new Map<string, string>();

/**
 * Fast synchronous conversion of an already-loaded Image element into DataURL via 2D Canvas.
 * Takes < 1ms directly from browser memory without any network request.
 */
function tryCanvasDataUrl(img: HTMLImageElement): string | null {
  try {
    if (!img.complete || img.naturalWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const src = (img.currentSrc || img.src || img.getAttribute("src") || "").toLowerCase();
    const isJpeg = /\.jpe?g($|\?)/i.test(src) || src.startsWith("data:image/jpeg");

    if (isJpeg) {
      return canvas.toDataURL("image/jpeg", 0.95);
    }
    // PNG, SVG, WebP, transparent or unknown: ALWAYS preserve alpha with PNG
    return canvas.toDataURL("image/png");
  } catch {
    // If canvas is tainted due to cross-origin restriction, return null to fall back
    return null;
  }
}

/**
 * High-speed pre-inlining of external <img> elements inside target.
 * Uses in-memory cache and canvas memory extraction first, falling back to fast abortable fetch.
 */
async function preinlineImages(target: HTMLElement, timeoutMs = 1500): Promise<void> {
  const imgElements = Array.from(target.querySelectorAll("img"));
  if (imgElements.length === 0) return;

  const conversions = imgElements.map(async (img) => {
    const src = img.currentSrc || img.src || img.getAttribute("src");
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
      return;
    }

    // 1. Check in-memory cache first (0ms)
    if (imageBase64Cache.has(src)) {
      const cached = imageBase64Cache.get(src)!;
      img.src = cached;
      img.setAttribute("src", cached);
      return;
    }

    // 2. Try instant memory extraction from rendered DOM (<1ms)
    const localData = tryCanvasDataUrl(img);
    if (localData) {
      imageBase64Cache.set(src, localData);
      img.src = localData;
      img.setAttribute("src", localData);
      return;
    }

    // 3. Fast abortable network fetch fallback (timeout capped at 1500ms)
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

      imageBase64Cache.set(src, dataUrl);
      img.src = dataUrl;
      img.setAttribute("src", dataUrl);
    } catch {
      // Mark as anonymous so html2canvas can still attempt cross-origin load
      img.crossOrigin = "anonymous";
    }
  });

  await Promise.allSettled(conversions);
}

/**
 * Waits until .brochure-page or .escora-brochure-root elements are mounted in the DOM.
 */
async function waitForPages(target: HTMLElement, timeoutMs = 2000): Promise<HTMLElement[]> {
  const root = target.classList?.contains("escora-brochure-root")
    ? target
    : target.querySelector<HTMLElement>(".escora-brochure-root");
  if (root) {
    return [root];
  }
  const pages = Array.from(target.querySelectorAll<HTMLElement>(".brochure-page"));
  if (pages.length > 0) {
    return pages;
  }
  const start = performance.now();
  while (true) {
    const p = Array.from(target.querySelectorAll<HTMLElement>(".brochure-page"));
    if (p.length > 0) {
      return p;
    }
    const r = target.querySelector<HTMLElement>(".escora-brochure-root");
    if (r) {
      return [r];
    }
    if (performance.now() - start > timeoutMs) {
      return [target];
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

/**
 * Renders a single DOM page element to canvas at optimized scale.
 */
async function renderPageToCanvas(
  pageEl: HTMLElement,
  preferredScale = 2.0
): Promise<HTMLCanvasElement> {
  const options = {
    scale: preferredScale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 5000,
    onclone: (clonedDoc: Document) => {
      // 1. Ensure Google Fonts (Plus Jakarta Sans, Inter) are linked
      const luxuryFontUrl =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap";
      if (!clonedDoc.querySelector("link[href*='Plus+Jakarta+Sans']")) {
        const fontLink = clonedDoc.createElement("link");
        fontLink.rel = "stylesheet";
        fontLink.href = luxuryFontUrl;
        clonedDoc.head.appendChild(fontLink);
      }

      // 2. Forward decoded fonts from current document
      if (typeof document !== "undefined" && document.fonts) {
        document.fonts.forEach((font) => {
          try {
            (clonedDoc as unknown as { fonts: { add: (f: FontFace) => void } }).fonts.add(font);
          } catch {
            // Non-critical
          }
        });
      }

      // 3. Pre-process SVG elements to guarantee stroke, fill, and xmlns
      clonedDoc.querySelectorAll("svg").forEach((svg) => {
        if (!svg.getAttribute("xmlns")) {
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        }
        const computed = window.getComputedStyle(svg);
        const color = computed.color || "#162B48";
        const stroke = svg.getAttribute("stroke");
        if (!stroke || stroke === "currentColor") {
          svg.setAttribute("stroke", color);
        }
        const fill = svg.getAttribute("fill");
        if (fill === "currentColor") {
          svg.setAttribute("fill", color);
        }
        svg.querySelectorAll("path, circle, rect, line, polyline, polygon").forEach((el) => {
          const elStroke = el.getAttribute("stroke");
          if (elStroke === "currentColor" || (!elStroke && (stroke === "currentColor" || !stroke))) {
            el.setAttribute("stroke", color);
          }
          const elFill = el.getAttribute("fill");
          if (elFill === "currentColor") {
            el.setAttribute("fill", color);
          }
        });
      });

      // 4. Force exact dimensions, font antialiasing and clean background layout
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
        p.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
        p.style.setProperty("-webkit-font-smoothing", "antialiased");
        p.style.setProperty("-moz-osx-font-smoothing", "grayscale");
        p.style.setProperty("text-rendering", "geometricPrecision");
      });

      clonedDoc.querySelectorAll<HTMLElement>(".escora-brochure-root").forEach((r) => {
        r.style.boxShadow = "none";
        r.style.margin = "0 auto";
        r.style.borderRadius = "0";
        r.style.border = "none";
        r.style.background = "#ffffff";
        r.style.width = "794px";
        r.style.maxWidth = "794px";
        r.style.minWidth = "794px";
        r.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
        r.style.setProperty("-webkit-font-smoothing", "antialiased");
        r.style.setProperty("-moz-osx-font-smoothing", "grayscale");
        r.style.setProperty("text-rendering", "geometricPrecision");
      });
    },
  };

  try {
    return await html2canvas(pageEl, options);
  } catch (firstErr) {
    if (preferredScale > 1.5) {
      console.warn("[Itinerary PDF] High-scale capture failed, falling back to scale 1.5...", firstErr);
      return await html2canvas(pageEl, { ...options, scale: 1.5 });
    }
    throw firstErr;
  }
}

export type PdfPageMode = "single-page" | "multi-page";

export interface DownloadPdfOptions {
  mode?: PdfPageMode;
  scale?: number;
}

/**
 * Converts a DOM element (specifically the itinerary document) into a PDF file
 * and triggers an immediate direct download without opening the browser print dialog.
 */
export async function downloadElementAsPdf(
  targetId: string,
  filename: string,
  options?: DownloadPdfOptions
): Promise<void> {
  const mode: PdfPageMode = options?.mode || "single-page";
  const preferredScale = options?.scale ?? 2.0;

  const target = document.getElementById(targetId);
  if (!target) {
    throw new Error(`PDF target container #${targetId} was not found in the DOM.`);
  }

  // Fast font readiness check
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-blocking
    }
  }

  // Save previous inline styles to restore cleanly
  const isAlreadyVisible =
    target.offsetWidth > 0 &&
    target.offsetHeight > 0 &&
    window.getComputedStyle(target).visibility !== "hidden" &&
    window.getComputedStyle(target).display !== "none";

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

  if (!isAlreadyVisible) {
    target.style.position = "fixed";
    target.style.left = "0";
    target.style.top = "0";
    target.style.zIndex = "-9999";
    target.style.opacity = "1";
    target.style.visibility = "visible";
    target.style.width = "794px";
    target.style.maxWidth = "794px";
    target.style.pointerEvents = "none";
  }

  try {
    // 1. Resolve mounted page elements
    const pages = await waitForPages(target);

    // 2. High-speed image pre-inlining (cached + offscreen canvas first)
    await preinlineImages(target, 1500);

    const elementsToRender = pages.length > 0 ? pages : [target];

    // Mode 1: Continuous Single-Page Digital Brochure
    if (mode === "single-page") {
      const pageEl = elementsToRender[0];
      const canvas = await renderPageToCanvas(pageEl, preferredScale);

      let imgData: string;
      try {
        imgData = canvas.toDataURL("image/jpeg", 0.95);
      } catch {
        imgData = canvas.toDataURL("image/png");
      }

      // Calculate continuous page height in mm proportional to 210mm width
      const pdfHeightMm = (canvas.height / canvas.width) * 210;

      // Note: compress: false is set because JPEG is already compressed DCTDecode.
      // Skipping redundant deflate avoids 2-3 seconds of CPU stall.
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [210, pdfHeightMm],
        compress: false,
      });

      pdf.addImage(imgData, "JPEG", 0, 0, 210, pdfHeightMm, undefined, "FAST");

      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      return;
    }

    // Mode 2: Multi-Page A4 with Smart Element-Aware Break Pagination
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: false,
    });

    // Allocate reusable slice canvas once to prevent memory churn
    const sliceCanvas = document.createElement("canvas");
    const sliceCtx = sliceCanvas.getContext("2d");

    for (let i = 0; i < elementsToRender.length; i++) {
      const pageEl = elementsToRender[i];
      const canvas = await renderPageToCanvas(pageEl, preferredScale);

      const pageRatio = 297 / 210;
      const singlePageCanvasH = canvas.width * pageRatio;

      if (canvas.height <= singlePageCanvasH * 1.05) {
        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }
        let imgData: string;
        try {
          imgData = canvas.toDataURL("image/jpeg", 0.95);
        } catch {
          imgData = canvas.toDataURL("image/png");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      } else {
        const elRect = pageEl.getBoundingClientRect();
        const scaleFactor = canvas.width / (pageEl.offsetWidth || 1);

        const avoidSelectors = [
          ".pdf-avoid-break",
          ".pdf-day-block",
          ".pdf-stay-card",
          "li",
          "tr",
          "header",
          "footer",
        ];
        const breakElements = Array.from(
          pageEl.querySelectorAll<HTMLElement>(avoidSelectors.join(", "))
        );

        interface BlockRange {
          top: number;
          bottom: number;
          height: number;
        }

        const blocks: BlockRange[] = [];
        for (const el of breakElements) {
          if (el.offsetParent === null && el.offsetHeight === 0) continue;
          const r = el.getBoundingClientRect();
          const top = Math.round((r.top - elRect.top) * scaleFactor);
          const bottom = Math.round((r.bottom - elRect.top) * scaleFactor);
          const height = bottom - top;
          if (height > 10 && height < singlePageCanvasH * 0.95) {
            blocks.push({ top, bottom, height });
          }
        }

        const usablePageH = singlePageCanvasH - 16 * scaleFactor;
        const slices: { startY: number; endY: number }[] = [];
        let curY = 0;

        while (curY < canvas.height) {
          const remainingH = canvas.height - curY;
          if (remainingH <= singlePageCanvasH * 1.05) {
            slices.push({ startY: curY, endY: canvas.height });
            break;
          }

          const targetY = curY + usablePageH;
          let breakY = targetY;

          const crossingBlocks = blocks.filter(
            (b) => b.top < targetY && b.bottom > targetY && b.top > curY
          );

          if (crossingBlocks.length > 0) {
            const bestBlock = crossingBlocks.reduce((prev, curr) =>
              curr.top > prev.top ? curr : prev
            );

            const candidate = bestBlock.top - 4;
            if (candidate > curY + 24) {
              breakY = candidate;
            }
          }

          slices.push({ startY: curY, endY: breakY });
          curY = breakY;
        }

        // Configure slice canvas dimensions once
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.round(singlePageCanvasH);

        for (let p = 0; p < slices.length; p++) {
          if (i > 0 || p > 0) {
            pdf.addPage("a4", "portrait");
          }
          const { startY, endY } = slices[p];
          const sliceH = endY - startY;

          if (sliceCtx) {
            sliceCtx.fillStyle = "#ffffff";
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sliceCtx.drawImage(
              canvas,
              0,
              startY,
              canvas.width,
              sliceH,
              0,
              0,
              sliceCanvas.width,
              sliceH
            );
          }

          let sliceData: string;
          try {
            sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
          } catch {
            sliceData = sliceCanvas.toDataURL("image/png");
          }
          pdf.addImage(sliceData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }
      }
    }

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
    if (!isAlreadyVisible) {
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
}
