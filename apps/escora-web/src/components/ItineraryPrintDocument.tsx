import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ItineraryDay, ItineraryStay, ItineraryPricing } from "@/lib/itinerary";
import { formatMoney, formatDate } from "@/lib/itinerary";
import { PAGE_WIDTH_PX, CONTENT_WIDTH_PX, USABLE_HEIGHT_PX } from "@/lib/measurePagination";
import escoraLogoMarkPath from "@assets/escora/escora-logo-mark.png";

export interface ItineraryPrintData {
  title: string;
  customerName: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImageUrl?: string | null;
  summary?: string | null;
  days: ItineraryDay[];
  stays: ItineraryStay[];
  inclusions: string[];
  exclusions: string[];
  pricing: ItineraryPricing;
  currency: string;
  shareToken: string;
  mode: "package" | "itinerary";
}

const REF_PREFIX = "ESC";

// The letterhead is a light cream paper with dark-green/gold branding, so the
// print document uses its own light-mode palette rather than the site's
// dark-theme --ink/--bg/--gold tokens (which are tuned for a near-black page
// and read as washed-out or as opaque blocks on cream paper). One shared
// type scale keeps every section — cover, days, stays, terms, pricing —
// visually consistent instead of drifting section to section.
const paper = {
  ink: "#1f2e22", // dark green-black, close to the letterhead wordmark
  inkSoft: "#4b5a4e",
  inkMute: "#8a9389",
  gold: "#9c7a3c",
  goldBright: "#b8934f",
  line: "#e4ddc9",
  card: "#fffdf7",
  // The letterhead's own flat paper tone (sampled from escora-letterhead.png,
  // away from its logo/watermark/footer graphics) — every page's flat
  // background, so pages 2+ read as the same "paper" as page 1 without the
  // full decorative letterhead image repeated on each one.
  bg: "#fff3d9",
};

const type = {
  eyebrow: "text-[12px] font-mono tracking-[0.2em] uppercase font-semibold",
  label: "text-[11px] font-mono tracking-widest uppercase",
  h1: "font-serif font-bold tracking-tight leading-[1.1]",
  h2: "font-serif text-[26px] font-bold leading-tight",
  h3: "font-serif text-xl font-bold leading-tight",
  body: "text-sm leading-relaxed",
  small: "text-sm leading-relaxed",
  meta: "text-[12px] font-mono",
};

function refCode(shareToken: string) {
  return `${REF_PREFIX}-${shareToken.slice(0, 8).toUpperCase()}`;
}

// Long titles get a smaller cover size so they don't crowd the overview grid.
function titleSizeClass(title: string) {
  if (title.length > 70) return "text-4xl";
  if (title.length > 45) return "text-5xl";
  return "text-6xl";
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b pb-3 mb-5" style={{ borderColor: paper.line }}>
      <h2 className={type.h2} style={{ color: paper.ink }}>{children}</h2>
    </div>
  );
}

function DayCard({ day, index }: { day: ItineraryDay; index: number }) {
  return (
    <article className="rounded-lg p-5" style={{ backgroundColor: paper.card }}>
      {day.imageUrl && (
        <img src={day.imageUrl} alt={day.title} className="w-full h-32 object-cover rounded-md mb-4" />
      )}
      <span className={`${type.label} block mb-1.5`} style={{ color: paper.gold }}>
        Day {day.day ?? index + 1}{day.date ? ` · ${formatDate(day.date)}` : ""}
      </span>
      <h3 className={type.h3} style={{ color: paper.ink }}>{day.title}</h3>
      {day.description && (
        <p className={`${type.small} mt-1.5`} style={{ color: paper.inkSoft }}>{day.description}</p>
      )}
      {day.activities?.length > 0 && (
        <div className="space-y-1.5 mt-3 pt-3 border-t" style={{ borderColor: paper.line }}>
          {day.activities.map((act, j) => (
            <div key={j} className="flex gap-2.5 items-baseline">
              <span className={`${type.meta} font-bold w-11 flex-shrink-0`} style={{ color: paper.gold }}>
                {act.time || "•"}
              </span>
              <p className={`m-0 ${type.small}`} style={{ color: paper.inkSoft }}>
                <span className="font-semibold" style={{ color: paper.ink }}>{act.title}</span>
                {act.description && <span> — {act.description}</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function StayCardInner({ stay }: { stay: ItineraryStay }) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: paper.card }}>
      {stay.location && (
        <span className={`${type.label} block mb-1`} style={{ color: paper.gold }}>
          {stay.location}{stay.nights ? ` · ${stay.nights}N` : ""}
        </span>
      )}
      <span className="font-bold block text-sm" style={{ color: paper.ink }}>{stay.name}</span>
      {stay.roomType && <span className="text-xs block mt-0.5" style={{ color: paper.inkSoft }}>{stay.roomType}</span>}
      {(stay.checkIn || stay.checkOut) && (
        <span className={`${type.meta} block mt-2`} style={{ color: paper.gold }}>
          {formatDate(stay.checkIn) ?? "—"}{stay.checkOut ? ` – ${formatDate(stay.checkOut)}` : ""}
        </span>
      )}
      {stay.notes && <span className="text-[11px] block mt-1.5" style={{ color: paper.inkMute }}>{stay.notes}</span>}
    </div>
  );
}

// Stays render two-up in a grid on screen, so they're paired into a single
// flowable block (rather than one block per stay) to keep that layout while
// still being measured and packed as a unit.
function StayPair({ pair }: { pair: ItineraryStay[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {pair.map((stay, i) => <StayCardInner key={i} stay={stay} />)}
    </div>
  );
}

function TermsBlock({ inclusions, exclusions }: { inclusions: string[]; exclusions: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {inclusions.length > 0 && (
        <div className="p-5 rounded-lg" style={{ backgroundColor: paper.card }}>
          <div className="flex items-center gap-2 mb-3 font-bold text-xs uppercase tracking-wider" style={{ color: paper.ink }}>
            <span style={{ color: paper.gold }}>✦</span>
            <span>Included</span>
          </div>
          <ul className={`space-y-2 ${type.small}`} style={{ color: paper.inkSoft }}>
            {inclusions.map((inc, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: paper.gold }}>✓</span>
                <span>{inc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {exclusions.length > 0 && (
        <div className="p-5 rounded-lg" style={{ backgroundColor: paper.card }}>
          <div className="flex items-center gap-2 mb-3 font-bold text-xs uppercase tracking-wider" style={{ color: paper.ink }}>
            <span style={{ color: paper.goldBright }}>✧</span>
            <span>Excluded</span>
          </div>
          <ul className={`space-y-2 ${type.small}`} style={{ color: paper.inkMute }}>
            {exclusions.map((exc, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: paper.inkMute }}>✗</span>
                <span>{exc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PricingBlock({ pricing, currency }: { pricing: ItineraryPricing; currency: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: paper.gold, backgroundColor: paper.card }}>
        <div className="px-5 py-3 flex justify-between items-center text-xs uppercase font-bold tracking-wider" style={{ backgroundColor: paper.line, color: paper.ink }}>
          <span>Investment Component</span>
          <span>Amount ({currency})</span>
        </div>
        <div className="text-sm">
          {pricing.items.map((item, i) => (
            <div key={i} className="px-5 py-3 flex justify-between items-center border-b" style={{ borderColor: paper.line }}>
              <span style={{ color: paper.inkSoft }}>{item.label}</span>
              <span className="font-mono font-semibold" style={{ color: paper.ink }}>{formatMoney(item.amount, currency)}</span>
            </div>
          ))}
          {!!pricing.discount && (
            <div className="px-5 py-3 flex justify-between items-center border-b" style={{ borderColor: paper.line }}>
              <span style={{ color: paper.gold }}>Discount</span>
              <span className="font-mono font-semibold" style={{ color: paper.gold }}>-{formatMoney(pricing.discount, currency)}</span>
            </div>
          )}
          {!!pricing.taxes && (
            <div className="px-5 py-3 flex justify-between items-center border-b" style={{ borderColor: paper.line }}>
              <span style={{ color: paper.inkMute }}>Taxes &amp; Fees</span>
              <span className="font-mono font-semibold" style={{ color: paper.ink }}>{formatMoney(pricing.taxes, currency)}</span>
            </div>
          )}
          <div className="px-5 py-4 flex justify-between items-center border-t" style={{ backgroundColor: paper.line, borderColor: paper.gold }}>
            <span className="font-bold uppercase tracking-wider text-sm" style={{ color: paper.goldBright }}>Total Investment</span>
            <span className="font-mono font-bold text-xl" style={{ color: paper.ink }}>{formatMoney(pricing.total, currency)}</span>
          </div>
        </div>
      </div>
      {pricing.notes && (
        <p className="text-[11px] leading-relaxed -mt-4" style={{ color: paper.inkMute }}>{pricing.notes}</p>
      )}

      <div className="p-5 rounded-lg border flex items-center justify-between gap-6 text-sm" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: paper.gold }}>To Confirm This Journey</span>
          <span className="block text-xs max-w-sm" style={{ color: paper.inkSoft }}>Reserve with a deposit, or pay the full amount via secure bank transfer or payment link sent by your Escora specialist.</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: paper.inkMute }}>Amount Due</span>
          <span className="font-mono font-bold text-xl" style={{ color: paper.goldBright }}>{formatMoney(pricing.total, currency)}</span>
        </div>
      </div>

      <div className="p-5 rounded-lg border flex items-center gap-4 text-sm" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
        <div
          className="w-12 h-12 rounded-full border flex items-center justify-center font-serif font-bold text-base flex-shrink-0"
          style={{ backgroundColor: paper.line, borderColor: paper.gold, color: paper.gold }}
        >
          ES
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: paper.gold }}>Dedicated Private Specialist</span>
          <span className="block font-bold text-sm" style={{ color: paper.ink }}>Escora Concierge Desk</span>
          <span className="block text-xs font-mono mt-0.5" style={{ color: paper.inkSoft }}>hello@escoraholidays.com · +91 8157 003 344</span>
        </div>
      </div>
    </div>
  );
}

function CoverIntro({
  title, customerName, summary, destination, dateRange, dayCount, coverImageUrl,
}: {
  title: string; customerName: string; summary?: string | null; destination?: string | null; dateRange: string; dayCount: number; coverImageUrl?: string | null;
}) {
  return (
    <section className="space-y-5 mb-8">
      {coverImageUrl && (
        <img src={coverImageUrl} alt={title} className="w-full h-56 object-cover rounded-lg" />
      )}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
        style={{ backgroundColor: paper.card, borderColor: paper.gold, color: paper.ink }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: paper.gold }} />
        <span className={type.eyebrow}>Prepared exclusively for {customerName}</span>
      </div>
      <h1 className={`${titleSizeClass(title)} ${type.h1}`} style={{ color: paper.ink }}>{title}</h1>
      {summary && <p className={`${type.body} text-base max-w-2xl`} style={{ color: paper.inkSoft }}>{summary}</p>}

      <div className="grid grid-cols-3 gap-px rounded-lg overflow-hidden border" style={{ backgroundColor: paper.line, borderColor: paper.line }}>
        <div className="p-5" style={{ backgroundColor: paper.card }}>
          <span className={`${type.label} block mb-2`} style={{ color: paper.inkMute }}>Destination</span>
          <span className="block text-lg font-serif font-semibold" style={{ color: paper.ink }}>{destination || "—"}</span>
        </div>
        <div className="p-5" style={{ backgroundColor: paper.card }}>
          <span className={`${type.label} block mb-2`} style={{ color: paper.inkMute }}>Travel Dates</span>
          <span className="block text-lg font-serif font-semibold" style={{ color: paper.goldBright }}>{dateRange || "—"}</span>
        </div>
        <div className="p-5" style={{ backgroundColor: paper.card }}>
          <span className={`${type.label} block mb-2`} style={{ color: paper.inkMute }}>Duration</span>
          <span className="block text-lg font-serif font-semibold" style={{ color: paper.ink }}>{dayCount} {dayCount === 1 ? "Day" : "Days"}</span>
        </div>
      </div>
    </section>
  );
}

function PageChrome({ children, isFirstPage }: { children: ReactNode; isFirstPage: boolean }) {
  return (
    <section className="a4-page relative overflow-hidden" style={{ width: PAGE_WIDTH_PX, backgroundColor: paper.bg }}>
      {isFirstPage && (
        <img
          src={escoraLogoMarkPath}
          alt="Escora"
          className="absolute top-10 right-14 h-16 w-auto"
        />
      )}
      <div className="relative p-14 h-full flex flex-col">{children}</div>
    </section>
  );
}

function PageFooterMark({ refText, docLabel }: { refText: string; docLabel: string }) {
  return (
    <footer className="mt-auto pt-2 text-right flex-shrink-0">
      <span className={`${type.meta} block`} style={{ color: paper.gold }}>{refText}</span>
      <span className="block text-[9px] uppercase" style={{ color: paper.inkMute }}>{docLabel}</span>
    </footer>
  );
}

// Every flowable block (day card, stay card, terms, pricing) becomes one
// entry here so they can all be measured and packed together — a page's
// leftover room after its day cards can be filled by a stay card, etc.,
// instead of each section always starting a fresh page regardless of how
// little room it needs.
type Block = { key: string; node: ReactNode };

export default function ItineraryPrintDocument({ data }: { data: ItineraryPrintData }) {
  const {
    title, customerName, destination, startDate, endDate, coverImageUrl, summary,
    days, stays, inclusions, exclusions, pricing, currency, shareToken, mode,
  } = data;

  const ref = refCode(shareToken);
  const dateRange = [formatDate(startDate), formatDate(endDate)].filter(Boolean).join(" – ");
  const showPricing = mode === "itinerary" && pricing.items.length > 0;
  const docLabel = mode === "package" ? "Package Overview" : "Official Travel Dossier";
  const hasTerms = inclusions.length > 0 || exclusions.length > 0;

  // Stays render two-up, so they're grouped into pairs before becoming
  // flowable blocks — each pair is one block, same as a single day card.
  const stayPairs: ItineraryStay[][] = [];
  for (let i = 0; i < stays.length; i += 2) stayPairs.push(stays.slice(i, i + 2));

  const dayBlockCount = days.length;
  const stayBlockCount = stayPairs.length;
  const daysStart = 0;
  const staysStart = dayBlockCount;
  const termsStart = staysStart + stayBlockCount;
  const pricingStart = termsStart + (hasTerms ? 1 : 0);

  const blocks: Block[] = [
    ...days.map((day, i): Block => ({ key: `day-${i}`, node: <DayCard day={day} index={i} /> })),
    ...stayPairs.map((pair, i): Block => ({ key: `stays-${i}`, node: <StayPair pair={pair} /> })),
    ...(hasTerms ? [{ key: "terms", node: <TermsBlock inclusions={inclusions} exclusions={exclusions} /> }] : []),
    ...(showPricing ? [{ key: "pricing", node: <PricingBlock pricing={pricing} currency={currency} /> }] : []),
  ];

  const measureRef = useRef<HTMLDivElement>(null);
  const coverMeasureRef = useRef<HTMLDivElement>(null);
  const headingMeasureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Block[][] | null>(null);

  useEffect(() => {
    const container = measureRef.current;
    const headingEl = headingMeasureRef.current;
    if (!container || blocks.length === 0) {
      setPages(blocks.length === 0 ? [[]] : null);
      return;
    }

    function measureAndPack() {
      // The print target (an ancestor of this component) starts as
      // display:none on screen and is only made visible right before
      // printing — printElementById() flips it to display:block via a
      // direct DOM mutation, not a React state change, so a normal mount-
      // time effect would only ever see it at 0×0 and never re-run. A
      // ResizeObserver instead fires exactly when the container's real
      // layout size becomes available (0×0 → its true content size),
      // regardless of what triggered that visibility change.
      const heights = Array.from(container!.children).map((el) => el.getBoundingClientRect().height);
      if (heights.every((h) => h === 0)) return; // still hidden — nothing to measure yet

      // Section headings ("Journey Unfolds", "Where You'll Rest", ...) are
      // added to whichever block starts that section's estimated height,
      // so a heading always stays attached to the content that follows it
      // rather than risking landing alone at the bottom of a page. Measured
      // for real (rather than a hardcoded guess) so a type-scale change
      // can't silently under-budget space for it and overflow a page.
      const HEADING_HEIGHT = headingEl?.getBoundingClientRect().height ?? 44;
      const sectionStarts = new Set([daysStart, staysStart, termsStart, pricingStart].filter((_, idx) =>
        [dayBlockCount > 0, stayBlockCount > 0, hasTerms, showPricing][idx],
      ));

      // The cover intro isn't itself a Block (it's rendered directly by the
      // pageIdx === 0 branch below) — the cover page is reserved for the
      // trip summary alone and never shares space with the day-by-day plan,
      // so "Journey Unfolds" (the first day block) always starts its own
      // page regardless of how much room is left over on the cover page.
      // An empty leading group models that reserved cover page: it forces
      // the first real block (day 1) to open a fresh page via the same
      // "start a new page" branch every later overflow uses, rather than
      // needing a separate one-off special case.
      const grouped: Block[][] = dayBlockCount > 0 ? [[]] : [];
      let current: Block[] = [];
      let currentHeight = 0;
      let pageBudget = USABLE_HEIGHT_PX;
      for (let i = 0; i < blocks.length; i++) {
        let h = heights[i] ?? 0;
        if (sectionStarts.has(i)) h += HEADING_HEIGHT;
        if (current.length > 0 && currentHeight + h > pageBudget) {
          grouped.push(current);
          current = [];
          currentHeight = 0;
          pageBudget = USABLE_HEIGHT_PX;
        }
        current.push(blocks[i]);
        currentHeight += h;
      }
      if (current.length > 0) grouped.push(current);
      setPages(grouped.length > 0 ? grouped : [[]]);
    }

    const observer = new ResizeObserver(measureAndPack);
    observer.observe(container);
    if (headingEl) observer.observe(headingEl);
    measureAndPack(); // in case the container is already visible (e.g. on-screen debugging)
    return () => observer.disconnect();
    // Re-measure whenever the underlying data changes shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayBlockCount, stayBlockCount, hasTerms, showPricing, title, summary]);

  function sectionHeadingFor(globalIndex: number): string | null {
    if (dayBlockCount > 0 && globalIndex === daysStart) return "Journey Unfolds";
    if (stayBlockCount > 0 && globalIndex === staysStart) return "Where You'll Rest";
    if (hasTerms && globalIndex === termsStart) return "Inclusions & Exclusions";
    if (showPricing && globalIndex === pricingStart) return "Investment & Payment";
    return null;
  }

  return (
    <div>
      {/* Hidden measurement pass: every block plus the cover intro rendered
          once at CONTENT_WIDTH_PX — the actual width content renders at
          inside a page (PAGE_WIDTH_PX minus PageChrome's own p-14 padding
          on both sides) — so the measured heights match reality. Measuring
          at the full page width instead would let text wrap onto fewer
          lines than it actually will inside the narrower padded content
          area, silently underestimating height and letting a page overflow
          past what was budgeted for it. */}
      <div ref={measureRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", top: 0, left: -99999, width: CONTENT_WIDTH_PX }}>
        {blocks.map((b) => <div key={b.key} className="mb-4">{b.node}</div>)}
      </div>
      <div ref={coverMeasureRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", top: 0, left: -99999, width: CONTENT_WIDTH_PX }}>
        <CoverIntro title={title} customerName={customerName} summary={summary} destination={destination} dateRange={dateRange} dayCount={days.length} coverImageUrl={coverImageUrl} />
      </div>
      <div ref={headingMeasureRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", top: 0, left: -99999, width: CONTENT_WIDTH_PX }}>
        <SectionHeading>Journey Unfolds</SectionHeading>
      </div>

      {pages === null ? null : pages.map((pageBlocks, pageIdx) => {
        let globalIndex = 0;
        for (let p = 0; p < pageIdx; p++) globalIndex += pages[p].length;

        return (
          <PageChrome key={pageIdx} isFirstPage={pageIdx === 0}>
            {pageIdx === 0 ? (
              // Page 1 is reserved for the cover alone (the day-by-day plan
              // always starts fresh on page 2), so its content is centered
              // in the available space rather than left pinned to the top
              // with a large empty gap above the footer.
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex-shrink-0 mb-2">
                  <span className={`${type.meta}`} style={{ color: paper.gold }}>{ref}</span>
                  <span className="block text-[9px] uppercase" style={{ color: paper.inkMute }}>{docLabel}</span>
                </div>
                <CoverIntro title={title} customerName={customerName} summary={summary} destination={destination} dateRange={dateRange} dayCount={days.length} coverImageUrl={coverImageUrl} />
              </div>
            ) : (
              <div className="space-y-5 flex-1">
                {pageBlocks.map((b, i) => {
                  const heading = sectionHeadingFor(globalIndex + i);
                  return (
                    <div key={b.key}>
                      {heading && <SectionHeading>{heading}</SectionHeading>}
                      {b.node}
                    </div>
                  );
                })}
              </div>
            )}
            <PageFooterMark refText={ref} docLabel={docLabel} />
          </PageChrome>
        );
      })}
    </div>
  );
}
