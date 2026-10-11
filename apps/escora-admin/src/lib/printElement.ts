const PRINT_STYLE_ID = "print-isolate-style";
const PRINT_HIDDEN_CLASS = "print-isolate-hidden-sibling";
const PRINT_UNCLIP_CLASS = "print-isolate-ancestor";

function ensurePrintStyle(targetId: string) {
  let style = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
    @media print {
      /* Zero page margin so each .a4-page section's own background paints
         edge-to-edge — @page margin boxes render blank regardless of the
         document's own background, and (verified empirically with an
         isolated minimal repro) Chrome only honors a non-zero @page margin
         on the FIRST page of a print job anyway, not every page, so it
         can't be used to reserve a safe top/bottom zone on every page of a
         long document. Real per-page safe margins instead come from every
         .a4-page being its own sized container with that padding built in
         (see PageChrome in ItineraryPrintDocument.tsx), and from packing
         each page's content by real measured height (see
         lib/measurePagination.ts) so a page is never forced to hold more
         than actually fits within that safe area. */
      @page { margin: 0; size: A4; }

      html, body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }

      /* display:none removes an element from layout entirely — unlike
         visibility:hidden, it can't be out-argued by a min-height rule
         (e.g. a layout's min-h-[100dvh]) that would otherwise keep
         reserving a full screen's worth of blank space and cause the
         browser to paginate an extra empty sheet after the dossier's own
         content. tagHiddenSiblings() below walks the DOM and tags the real
         siblings of the print target with this class, since which elements
         those are varies by page. */
      .${PRINT_HIDDEN_CLASS} {
        display: none !important;
      }

      /* App shells commonly wrap pages in a fixed-viewport, scrollable
         container (h-screen/overflow-auto, e.g. this admin's sidebar
         layout) so the page never itself scrolls. That clips the print
         target's rendered height to the viewport instead of letting it
         grow to its full multi-page size, which truncates the PDF to a
         single page; the same container's own padding (e.g. <main
         className="p-6 md:p-8">) also offsets the letterhead away from
         the real paper edge. Every ancestor of the print target gets its
         own height/overflow/spacing constraints lifted here. */
      .${PRINT_UNCLIP_CLASS} {
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        /* A dark-themed ancestor's own background (e.g. this site's near-
           black page background) would otherwise show through the print
           target for a frame or two — most visibly on a slow first load,
           before the target's own letterhead background-image has decoded.
           Forcing white here means there is never a colored flash, only
           ever a brief plain-white one while the letterhead finishes. */
        background: #fff !important;
      }

      #${targetId} {
        margin: 0;
      }
      #${targetId} * {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      /* Keep a heading attached to what follows it, and never split a
         table row across a page break. Each .a4-page is already sized to
         exactly one sheet with break-after:page, so pagination beyond that
         is purely the JS-side measured packing in measurePagination.ts —
         Chrome's own pagination never needs to guess where content
         doesn't fit, since every page's content was already sized to fit. */
      #${targetId} h2, #${targetId} h3 {
        break-after: avoid;
      }
      #${targetId} tr {
        break-inside: avoid;
      }
      #${targetId} .a4-page {
        width: 210mm;
        height: 297mm;
        margin: 0;
        break-after: page;
        break-inside: avoid;
        overflow: hidden;
      }
      #${targetId} .a4-page:last-child {
        break-after: auto;
      }
    }
  `;
}

/**
 * Tags every element that is a sibling of `target` at any level of the DOM
 * (i.e. everything that isn't an ancestor of, or contained within, target)
 * with a class that @media print hides via display:none, and tags every
 * ancestor of `target` with a class that lifts height/overflow clipping —
 * both are necessary for a print target buried inside a fixed-viewport app
 * shell to render at its full (possibly multi-page) height. Walking the
 * real DOM, rather than assuming a fixed nesting depth or a particular
 * layout's class names, keeps this working across different page shells.
 */
function tagAncestorsAndSiblings(target: HTMLElement) {
  const tagged: HTMLElement[] = [];
  let node: HTMLElement | null = target;
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (parent) {
      parent.classList.add(PRINT_UNCLIP_CLASS);
      tagged.push(parent);
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== node && sibling instanceof HTMLElement) {
          sibling.classList.add(PRINT_HIDDEN_CLASS);
          tagged.push(sibling);
        }
      }
    }
    node = parent;
  }
  return tagged;
}

/**
 * Resolves once every image the print target depends on has finished
 * loading — both real <img> elements and any CSS background-image (the
 * letterhead) set via inline style. On a first print, before the browser
 * has these cached, window.print() would otherwise capture whatever was
 * already painted (nothing, or a plain-color fallback) rather than waiting,
 * so a naive "print immediately" call intermittently shows a stale/unstyled
 * page — fixed here, not papered over with an arbitrary setTimeout delay.
 */
async function waitForImages(target: HTMLElement): Promise<void> {
  const urls = new Set<string>();

  for (const el of target.querySelectorAll("*")) {
    const bg = (el as HTMLElement).style?.backgroundImage;
    const match = bg?.match(/url\((['"]?)(.*?)\1\)/);
    if (match?.[2]) urls.add(match[2]);
  }

  const bgLoads = Array.from(urls).map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // don't block printing on a broken image
        img.src = src;
      }),
  );

  const imgLoads = Array.from(target.querySelectorAll("img")).map((img) =>
    img.complete ? Promise.resolve() : img.decode().catch(() => undefined),
  );

  // Never block printing indefinitely on a slow/broken asset.
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
  await Promise.race([Promise.all([...bgLoads, ...imgLoads]), timeout]);
}

/**
 * Waits until the print target has at least one .a4-page section rendered.
 * ItineraryPrintDocument.tsx computes its page groupings from a hidden
 * measurement pass (real getBoundingClientRect heights, not guessed counts)
 * inside a useLayoutEffect, so on the very first render there are zero
 * .a4-page sections yet — printing before that effect has committed would
 * capture a blank or half-built document. Polls via requestAnimationFrame
 * rather than a fixed delay, since the measurement pass's timing isn't
 * otherwise observable from here.
 */
async function waitForPagination(target: HTMLElement, timeoutMs = 3000): Promise<void> {
  const start = performance.now();
  while (target.querySelectorAll(".a4-page").length === 0) {
    if (performance.now() - start > timeoutMs) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

/**
 * Prints only the element with the given id via the browser's native print dialog,
 * hiding the rest of the page (header, download button, etc). Avoids html2canvas,
 * which cannot parse modern CSS color functions (e.g. oklch) that Tailwind v4 emits.
 */
export async function printElementById(targetId: string): Promise<void> {
  const target = document.getElementById(targetId);
  if (!target) {
    window.print();
    return;
  }

  ensurePrintStyle(targetId);
  const tagged = tagAncestorsAndSiblings(target);

  // The print target is normally `display:none` on screen (only shown via
  // `@media print`), so ItineraryPrintDocument.tsx's measurement pass —
  // which needs the target actually laid out to read real element heights
  // — can't run before window.print() makes @media print active. Forcing
  // it visible here (an inline style, so it doesn't depend on print media)
  // lets that measurement + pagination effect run first, off-screen via
  // position:fixed + a negative inset well outside the viewport so the
  // user never sees a flash of it while pagination is still computing.
  const previousStyleText = target.getAttribute("style") ?? "";
  target.style.display = "block";
  target.style.position = "fixed";
  target.style.top = "0";
  target.style.left = "-99999px";

  const restoreVisibility = () => {
    target.setAttribute("style", previousStyleText);
  };

  const cleanup = () => {
    for (const el of tagged) el.classList.remove(PRINT_HIDDEN_CLASS, PRINT_UNCLIP_CLASS);
    restoreVisibility();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  await waitForPagination(target);
  await waitForImages(target);

  // Return the target to normal document flow before printing. Chrome's
  // print/PDF pagination (both window.print() and Playwright's page.pdf())
  // is driven by the document's actual flow height — a position:fixed
  // element is excluded from that flow entirely, so body/html measure as
  // 0 tall and only a single (mostly blank) page gets printed even though
  // the fixed element visually contains many pages' worth of content.
  // tagAncestorsAndSiblings() has already hidden every other element on
  // the page via display:none, so putting the target back in normal flow
  // here doesn't reveal anything else — it just makes its real height
  // count again.
  target.style.position = "static";
  target.style.top = "";
  target.style.left = "";

  window.print();
}
