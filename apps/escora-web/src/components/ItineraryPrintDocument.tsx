import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ItineraryDay, ItineraryStay, ItineraryPricing } from "@/lib/itinerary";
import { formatMoney, formatDate } from "@/lib/itinerary";
import { PAGE_WIDTH_PX, CONTENT_WIDTH_PX, USABLE_HEIGHT_PX } from "@/lib/measurePagination";

// Brand & Botanical Assets
import escoraLogoMarkPath from "@assets/escora/escora-logo-mark.png";
import palmCornerPath from "@assets/escora/escora-palm-frond-corner.png";
import palmTopLeftPath from "@assets/escora/palm-top-left.png";
import palmBottomLeftPath from "@assets/escora/palm-bottom-left.png";
import palmBottomRightPath from "@assets/escora/palm-bottom-right.png";
import goldDividerPath from "@assets/escora/gold-divider.svg";
import coastalWavePath from "@assets/escora/coastal-wave.svg";

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

const paper = {
  ink: "#143423", // deep luxury Kerala forest green
  inkSoft: "#4b5a4e",
  inkMute: "#8a9389",
  gold: "#9c7a3c",
  goldBright: "#b8934f",
  line: "#e8dfcb",
  card: "#fffdf7",
  bg: "#fff3d9",
};

const type = {
  eyebrow: "text-[12px] font-mono tracking-[0.2em] uppercase font-semibold",
  label: "text-[11px] font-mono tracking-widest uppercase",
  h1: "font-serif font-bold tracking-tight leading-[1.1]",
  h2: "font-serif text-[24px] font-bold leading-tight",
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
    <div className="space-y-2 mb-5">
      <div className="flex items-center justify-between">
        <h2 className={type.h2} style={{ color: paper.ink }}>{children}</h2>
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] flex items-center gap-1.5 font-semibold" style={{ color: paper.gold }}>
          <span className="text-[12px]">✦</span> Escora Signature
        </span>
      </div>
      <img src={goldDividerPath} alt="" className="w-full h-4 object-contain opacity-80" />
    </div>
  );
}

function DayCard({ day, index }: { day: ItineraryDay; index: number }) {
  return (
    <article className="rounded-xl p-5 border shadow-[0_2px_12px_rgba(20,52,35,0.03)]" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
      {day.imageUrl && (
        <div className="relative overflow-hidden rounded-lg mb-4">
          <img src={day.imageUrl} alt={day.title} className="w-full h-32 object-cover" />
          <div className="absolute inset-0 border border-black/5 rounded-lg pointer-events-none" />
        </div>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`${type.label} font-semibold flex items-center gap-1.5`} style={{ color: paper.gold }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: paper.gold }} />
          Day {day.day ?? index + 1}{day.date ? ` · ${formatDate(day.date)}` : ""}
        </span>
      </div>
      <h3 className={type.h3} style={{ color: paper.ink }}>{day.title}</h3>
      {day.description && (
        <p className={`${type.small} mt-2`} style={{ color: paper.inkSoft }}>{day.description}</p>
      )}
      {day.activities?.length > 0 && (
        <div className="space-y-2 mt-3.5 pt-3 border-t" style={{ borderColor: paper.line }}>
          {day.activities.map((act, j) => (
            <div key={j} className="flex gap-2.5 items-baseline">
              <span className={`${type.meta} font-bold w-12 flex-shrink-0`} style={{ color: paper.gold }}>
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
    <div className="p-5 rounded-xl border shadow-[0_2px_12px_rgba(20,52,35,0.03)] flex flex-col justify-between" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
      <div>
        {stay.location && (
          <span className={`${type.label} block mb-1.5 font-semibold`} style={{ color: paper.gold }}>
            {stay.location}{stay.nights ? ` · ${stay.nights} Nights` : ""}
          </span>
        )}
        <span className="font-serif font-bold block text-base" style={{ color: paper.ink }}>{stay.name}</span>
        {stay.roomType && <span className="text-xs block mt-1" style={{ color: paper.inkSoft }}>{stay.roomType}</span>}
      </div>
      <div>
        {(stay.checkIn || stay.checkOut) && (
          <span className={`${type.meta} block mt-3 text-xs pt-2 border-t`} style={{ color: paper.gold, borderColor: paper.line }}>
            {formatDate(stay.checkIn) ?? "—"}{stay.checkOut ? ` → ${formatDate(stay.checkOut)}` : ""}
          </span>
        )}
        {stay.notes && <span className="text-[11px] block mt-1.5 italic" style={{ color: paper.inkMute }}>{stay.notes}</span>}
      </div>
    </div>
  );
}

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
        <div className="p-5 rounded-xl border" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
          <div className="flex items-center gap-2 mb-3 font-bold text-xs uppercase tracking-wider" style={{ color: paper.ink }}>
            <span className="text-sm" style={{ color: paper.gold }}>✦</span>
            <span>Included in Experience</span>
          </div>
          <ul className={`space-y-2.5 ${type.small}`} style={{ color: paper.inkSoft }}>
            {inclusions.map((inc, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-bold" style={{ color: paper.ink }}>✓</span>
                <span style={{ color: paper.inkSoft }}>{inc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {exclusions.length > 0 && (
        <div className="p-5 rounded-xl border" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
          <div className="flex items-center gap-2 mb-3 font-bold text-xs uppercase tracking-wider" style={{ color: paper.ink }}>
            <span className="text-sm" style={{ color: paper.goldBright }}>✧</span>
            <span>Not Included</span>
          </div>
          <ul className={`space-y-2.5 ${type.small}`} style={{ color: paper.inkMute }}>
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
      <div className="rounded-xl border overflow-hidden shadow-[0_2px_12px_rgba(20,52,35,0.03)]" style={{ borderColor: paper.gold, backgroundColor: paper.card }}>
        <div className="px-5 py-3.5 flex justify-between items-center text-xs uppercase font-bold tracking-wider border-b" style={{ backgroundColor: "#f5ede0", color: paper.ink, borderColor: paper.line }}>
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
            <div className="px-5 py-3 flex justify-between items-center border-b bg-amber-50/40" style={{ borderColor: paper.line }}>
              <span style={{ color: paper.gold }}>Privileged Discount</span>
              <span className="font-mono font-semibold" style={{ color: paper.gold }}>-{formatMoney(pricing.discount, currency)}</span>
            </div>
          )}
          {!!pricing.taxes && (
            <div className="px-5 py-3 flex justify-between items-center border-b" style={{ borderColor: paper.line }}>
              <span style={{ color: paper.inkMute }}>Taxes &amp; Statutory Fees</span>
              <span className="font-mono font-semibold" style={{ color: paper.ink }}>{formatMoney(pricing.taxes, currency)}</span>
            </div>
          )}
          <div className="px-5 py-4 flex justify-between items-center border-t" style={{ backgroundColor: "#f5ede0", borderColor: paper.gold }}>
            <div>
              <span className="font-bold uppercase tracking-wider text-sm block" style={{ color: paper.goldBright }}>Total Investment</span>
              <span className="text-[10px] block" style={{ color: paper.inkSoft }}>All-inclusive bespoke itinerary package</span>
            </div>
            <span className="font-mono font-bold text-2xl" style={{ color: paper.ink }}>{formatMoney(pricing.total, currency)}</span>
          </div>
        </div>
      </div>
      {pricing.notes && (
        <p className="text-[11px] leading-relaxed -mt-3 italic" style={{ color: paper.inkMute }}>{pricing.notes}</p>
      )}

      <div className="p-5 rounded-xl border flex items-center justify-between gap-6 text-sm" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: paper.gold }}>To Confirm This Journey</span>
          <span className="block text-xs max-w-sm" style={{ color: paper.inkSoft }}>Reserve with a deposit, or pay the full amount via secure bank transfer or payment link sent by your Escora specialist.</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: paper.inkMute }}>Amount Due</span>
          <span className="font-mono font-bold text-xl" style={{ color: paper.goldBright }}>{formatMoney(pricing.total, currency)}</span>
        </div>
      </div>

      <div className="p-5 rounded-xl border flex items-center gap-4 text-sm" style={{ backgroundColor: paper.card, borderColor: paper.line }}>
        <div
          className="w-12 h-12 rounded-full border flex items-center justify-center font-serif font-bold text-base flex-shrink-0"
          style={{ backgroundColor: "#f5ede0", borderColor: paper.gold, color: paper.gold }}
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
    <section className="space-y-6 mb-8">
      {coverImageUrl && (
        <div className="relative overflow-hidden rounded-xl shadow-md">
          <img src={coverImageUrl} alt={title} className="w-full h-56 object-cover" />
          <div className="absolute inset-0 border border-black/10 rounded-xl pointer-events-none" />
        </div>
      )}
      <div
        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-sm"
        style={{ backgroundColor: paper.card, borderColor: paper.gold, color: paper.ink }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: paper.gold }} />
        <span className={type.eyebrow}>Prepared exclusively for {customerName}</span>
      </div>
      <h1 className={`${titleSizeClass(title)} ${type.h1}`} style={{ color: paper.ink }}>{title}</h1>

      <img src={goldDividerPath} alt="" className="w-full h-4 object-contain opacity-80" />

      {summary && <p className={`${type.body} text-base max-w-2xl font-serif italic`} style={{ color: paper.inkSoft }}>{summary}</p>}

      <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border shadow-sm" style={{ backgroundColor: paper.line, borderColor: paper.line }}>
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
      {/* Decorative Botanical Foliage Assets */}
      {isFirstPage ? (
        <>
          {/* Cover: Rich top-right palm frond extending diagonally inward */}
          <img
            src={palmCornerPath}
            alt=""
            className="absolute -top-4 -right-4 w-[280px] h-auto pointer-events-none select-none z-0 opacity-95"
          />
          {/* Cover: Subtle bottom-left tropical foliage accent */}
          <img
            src={palmBottomLeftPath}
            alt=""
            className="absolute -bottom-6 -left-6 w-[210px] h-auto pointer-events-none select-none z-0 opacity-40"
          />
          {/* Top Logo Seal */}
          <img
            src={escoraLogoMarkPath}
            alt="Escora"
            className="absolute top-10 right-14 h-16 w-auto z-10 drop-shadow-sm"
          />
        </>
      ) : (
        <>
          {/* Interior Pages: Subtle corner palm frond in top-right */}
          <img
            src={palmCornerPath}
            alt=""
            className="absolute -top-6 -right-6 w-[150px] h-auto pointer-events-none select-none z-0 opacity-25"
          />
          {/* Subtle bottom-right accent */}
          <img
            src={palmBottomRightPath}
            alt=""
            className="absolute -bottom-6 -right-6 w-[120px] h-auto pointer-events-none select-none z-0 opacity-15"
          />
        </>
      )}
      <div className="relative p-14 h-full flex flex-col z-10">{children}</div>
    </section>
  );
}

function PageFooterMark({ refText, docLabel }: { refText: string; docLabel: string }) {
  return (
    <footer className="mt-auto pt-3 flex-shrink-0">
      <img src={coastalWavePath} alt="" className="w-full h-3.5 object-cover opacity-40 mb-2 pointer-events-none" />
      <div className="flex justify-between items-end text-neutral-400">
        <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: paper.gold }}>
          Escora Holidays · Kerala Luxury Travel
        </span>
        <div className="text-right">
          <span className={`${type.meta} block font-semibold`} style={{ color: paper.gold }}>{refText}</span>
          <span className="block text-[9px] uppercase" style={{ color: paper.inkMute }}>{docLabel}</span>
        </div>
      </div>
    </footer>
  );
}

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
      const heights = Array.from(container!.children).map((el) => el.getBoundingClientRect().height);
      if (heights.every((h) => h === 0)) return;

      const HEADING_HEIGHT = headingEl?.getBoundingClientRect().height ?? 48;
      const sectionStarts = new Set([daysStart, staysStart, termsStart, pricingStart].filter((_, idx) =>
        [dayBlockCount > 0, stayBlockCount > 0, hasTerms, showPricing][idx],
      ));

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
    measureAndPack();
    return () => observer.disconnect();
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
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex-shrink-0 mb-3">
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
