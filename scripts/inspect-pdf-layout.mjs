import { createRequire } from "module";
const require = createRequire(import.meta.url);
const puppeteer = require("../apps/escora-web/node_modules/puppeteer-core");
import * as fs from "fs";
import * as path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\9524cfd7-54d9-4ad4-9d79-1cc6f4553b3c\\scratch";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function inspectTemplate(templateId = "explora-trivandrum") {
  console.log(`\n=======================================================`);
  console.log(`  INSPECTING ITINERARY TEMPLATE: ${templateId}`);
  console.log(`=======================================================`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    const url = `http://localhost:3001/admin/preview-itinerary?template=${templateId}`;
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for ready flag
    await page.waitForFunction(() => window.__ITINERARY_READY === true, { timeout: 10000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1500));

    // Detailed DOM Inspection of .brochure-page elements
    const pageAnalysis = await page.evaluate(() => {
      const pages = Array.from(document.querySelectorAll(".brochure-page"));
      return pages.map((pageEl, idx) => {
        const rect = pageEl.getBoundingClientRect();
        const computed = window.getComputedStyle(pageEl);
        
        // Find all direct children
        const children = Array.from(pageEl.children).map((child) => {
          const cRect = child.getBoundingClientRect();
          const cStyle = window.getComputedStyle(child);
          return {
            tagName: child.tagName,
            className: child.className.slice(0, 80),
            top: cRect.top - rect.top,
            bottom: cRect.bottom - rect.top,
            height: cRect.height,
            marginTop: cStyle.marginTop,
            marginBottom: cStyle.marginBottom,
            paddingTop: cStyle.paddingTop,
            paddingBottom: cStyle.paddingBottom,
            textContentPreview: child.textContent ? child.textContent.trim().replace(/\s+/g, " ").slice(0, 60) : "",
          };
        });

        // Let's also inspect nested sections inside the main content container
        const mainContainer = pageEl.querySelector("div");
        let innerSections = [];
        if (mainContainer) {
          innerSections = Array.from(mainContainer.children).map((sec) => {
            const sRect = sec.getBoundingClientRect();
            const sStyle = window.getComputedStyle(sec);
            return {
              tagName: sec.tagName,
              className: sec.className.slice(0, 60),
              top: sRect.top - rect.top,
              bottom: sRect.bottom - rect.top,
              height: sRect.height,
              marginTop: sStyle.marginTop,
              marginBottom: sStyle.marginBottom,
              preview: sec.textContent ? sec.textContent.trim().replace(/\s+/g, " ").slice(0, 60) : "",
            };
          });
        }

        // Calculate unused space
        const lastChild = children[children.length - 1];
        const contentBottom = lastChild ? lastChild.bottom : 0;
        const totalHeight = rect.height;
        const unusedSpacePx = Math.max(0, totalHeight - contentBottom);

        return {
          pageIndex: idx + 1,
          height: rect.height,
          scrollHeight: pageEl.scrollHeight,
          clientHeight: pageEl.clientHeight,
          overflow: pageEl.scrollHeight > rect.height,
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
          childrenCount: children.length,
          children,
          innerSections,
          unusedSpacePx,
        };
      });
    });

    console.log(`Found ${pageAnalysis.length} pages:`);
    for (const p of pageAnalysis) {
      console.log(`\n--- PAGE ${p.pageIndex} ---`);
      console.log(`Height: ${p.height.toFixed(1)}px (scrollHeight: ${p.scrollHeight}px, overflow: ${p.overflow})`);
      console.log(`Padding: top=${p.paddingTop}, bottom=${p.paddingBottom}, left=${p.paddingLeft}, right=${p.paddingRight}`);
      console.log(`Unused space at bottom: ${p.unusedSpacePx.toFixed(1)}px`);
      console.log(`Top-level children (${p.children.length}):`);
      for (const c of p.children) {
        console.log(`   [${c.tagName}] h=${c.height.toFixed(1)}px top=${c.top.toFixed(1)} bottom=${c.bottom.toFixed(1)} | "${c.textContentPreview}"`);
      }
      if (p.innerSections.length > 0) {
        console.log(`Inner sections (${p.innerSections.length}):`);
        for (let i = 0; i < p.innerSections.length; i++) {
          const s = p.innerSections[i];
          const next = p.innerSections[i + 1];
          const gapToNext = next ? (next.top - s.bottom).toFixed(1) : "N/A";
          console.log(`   #${i + 1} h=${s.height.toFixed(1)}px (gap to next: ${gapToNext}px) | "${s.preview}"`);
        }
      }
    }

    // Save PDF
    const pdfPath = path.join(ARTIFACT_DIR, `${templateId}-raw.pdf`);
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    console.log(`\nSaved PDF to: ${pdfPath}`);

    // Screenshot each brochure page
    const pageElements = await page.$$(".brochure-page");
    for (let i = 0; i < pageElements.length; i++) {
      const imgPath = path.join(ARTIFACT_DIR, `${templateId}-page-${i + 1}.png`);
      await pageElements[i].screenshot({ path: imgPath });
      console.log(`Saved screenshot of Page ${i + 1} to: ${imgPath}`);
    }

    return pageAnalysis;
  } finally {
    await browser.close();
  }
}

async function main() {
  const t = process.argv[2];
  if (t) {
    await inspectTemplate(t);
  } else {
    await inspectTemplate("explora-trivandrum");
    await inspectTemplate("kerala-classic");
    await inspectTemplate("varkala");
    await inspectTemplate("kozhikode-wayanad");
    await inspectTemplate("kerala-group-quote");
  }
}

main().catch(console.error);
