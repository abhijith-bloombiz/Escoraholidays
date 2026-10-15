import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ItineraryDay, ItineraryStay, ItineraryPricing } from "@/lib/itinerary";
import { formatMoney } from "@/lib/itinerary";
import { PAGE_WIDTH_PX, PAGE_HEIGHT_PX, CONTENT_WIDTH_PX, USABLE_HEIGHT_PX } from "@/lib/measurePagination";

// Brand & Botanical Assets
import escoraLogoMarkPath from "@assets/escora/escora-logo-mark.png";
import palmCornerPath from "@assets/escora/escora-palm-frond-corner.png";
import palmTopLeftPath from "@assets/escora/palm-top-left.png";
import palmBottomLeftPath from "@assets/escora/palm-bottom-left.png";
import palmBottomRightPath from "@assets/escora/palm-bottom-right.png";
import goldDividerPath from "@assets/escora/gold-divider.svg";
import coastalWavePath from "@assets/escora/coastal-wave.svg";

// The letterhead's authentic paper tone (sampled from escora-letterhead.png)
const PAPER_BG = "#fff3d9";

// Reserve space for the footer (coastal wave + text + padding) so content never overlaps
const FOOTER_RESERVED_PX = 48;
const SAFE_PAGE_BUDGET_PX = USABLE_HEIGHT_PX - FOOTER_RESERVED_PX;

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
}

const REF_PREFIX = "ESC";

const type = {
  eyebrow: "text-[12px] font-mono tracking-[0.2em] uppercase font-semibold",
  label: "text-[11px] font-mono tracking-widest uppercase text-[#8a9389]",
  h2: "font-serif text-[24px] font-bold leading-tight text-[#143423]",
  h3: "font-serif text-xl font-bold leading-tight text-[#18201b]",
  small: "text-sm leading-relaxed text-[#4b5a4e]",
  meta: "text-[12px] font-mono text-[#9c7a3c]",
};

function refCode(shareToken: string) {
  return `${REF_PREFIX}-${shareToken.slice(0, 8).toUpperCase()}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function titleSizeClass(title: string) {
  if (title.length > 70) return "text-4xl";
  if (title.length > 45) return "text-5xl";
  return "text-6xl";
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <h2 className={type.h2}>{children}</h2>
        <span className="text-[#9c7a3c] text-[10px] font-mono uppercase tracking-[0.25em] flex items-center gap-1.5 font-semibold">
          <span className="text-[12px]">✦</span> Escora Signature
        </span>
      </div>
      <img src={goldDividerPath} alt="" className="w-full h-4 object-contain opacity-80" />
    </div>
  );
}

function DayCard({ day, index }: { day: ItineraryDay; index: number }) {
  return (
    <article className="rounded-xl bg-[#fffdf7] border border-[#e8dfcb] p-5 shadow-[0_2px_12px_rgba(20,52,35,0.03)]">
      {day.imageUrl && (
        <div className="relative overflow-hidden rounded-lg mb-4">
          <img src={day.imageUrl} alt={day.title} className="w-full h-32 object-cover" />
          <div className="absolute inset-0 border border-black/5 rounded-lg pointer-events-none" />
        </div>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`${type.label} !text-[#9c7a3c] font-semibold flex items-center gap-1.5`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#9c7a3c]" />
          Day {day.day ?? index + 1}{day.date ? ` · ${formatDate(day.date)}` : ""}
        </span>
      </div>
      <h3 className={type.h3}>{day.title}</h3>
      {day.description && <p className={`${type.small} mt-2`}>{day.description}</p>}
      {day.activities?.length > 0 && (
        <div className="space-y-2 mt-3.5 pt-3 border-t border-[#e8dfcb]/80">
          {day.activities.map((act, j) => (
            <div key={j} className="flex gap-2.5 items-baseline">
              <span className={`${type.meta} font-bold w-12 flex-shrink-0 text-[#9c7a3c]`}>
                {act.time || "•"}
              </span>
              <p className={`m-0 ${type.small}`}>
                <span className="font-semibold text-[#18201b]">{act.title}</span>
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
    <div className="p-5 rounded-xl bg-[#fffdf7] border border-[#e8dfcb] shadow-[0_2px_12px_rgba(20,52,35,0.03)] flex flex-col justify-between">
      <div>
        {stay.location && (
          <span className={`${type.label} block mb-1.5 !text-[#9c7a3c] font-semibold`}>
            {stay.location}{stay.nights ? ` · ${stay.nights} Nights` : ""}
          </span>
        )}
        <span className="font-serif font-bold block text-base text-[#18201b]">{stay.name}</span>
        {stay.roomType && <span className="text-xs block mt-1 text-[#4b5a4e]">{stay.roomType}</span>}
      </div>
      <div>
        {(stay.checkIn || stay.checkOut) && (
          <span className={`${type.meta} block mt-3 text-xs pt-2 border-t border-[#e8dfcb]/60`}>
            {formatDate(stay.checkIn) ?? "—"}{stay.checkOut ? ` → ${formatDate(stay.checkOut)}` : ""}
          </span>
        )}
        {stay.notes && <span className="text-[11px] block mt-1.5 text-[#8a9389] italic">{stay.notes}</span>}
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
        <div className="p-5 rounded-xl bg-[#fffdf7] border border-[#e8dfcb]">
          <div className="flex items-center gap-2 mb-3 text-[#143423] font-bold text-xs uppercase tracking-wider">
            <span className="text-[#9c7a3c] text-sm">✦</span>
            <span>Included in Experience</span>
          </div>
          <ul className={`space-y-2.5 ${type.small}`}>
            {inclusions.map((inc, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#153925] font-bold">✓</span>
                <span className="text-[#2c3e30]">{inc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {exclusions.length > 0 && (
        <div className="p-5 rounded-xl bg-[#fffdf7] border border-[#e8dfcb]">
          <div className="flex items-center gap-2 mb-3 text-[#143423] font-bold text-xs uppercase tracking-wider">
            <span className="text-[#8a9389] text-sm">✧</span>
            <span>Not Included</span>
          </div>
          <ul className="space-y-2.5 text-sm text-[#5c685e] leading-relaxed">
            {exclusions.map((exc, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#8a9389]">✗</span>
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
    <div className="rounded-xl border border-[#c29d59]/50 overflow-hidden bg-[#fffdf7] shadow-[0_2px_12px_rgba(20,52,35,0.03)]">
      <div className="px-5 py-3.5 bg-[#f5ede0] flex justify-between items-center text-xs uppercase font-bold tracking-wider text-[#143423] border-b border-[#e8dfcb]">
        <span>Investment Component</span>
        <span>Amount ({currency})</span>
      </div>
      <div className="divide-y divide-[#e8dfcb]/70 text-sm">
        {pricing.items.map((item, i) => (
          <div key={i} className="px-5 py-3 flex justify-between items-center">
            <span className="text-[#4b5a4e]">{item.label}</span>
            <span className="font-mono font-semibold text-[#18201b]">{formatMoney(item.amount, currency)}</span>
          </div>
        ))}
        {!!pricing.discount && (
          <div className="px-5 py-3 flex justify-between items-center bg-amber-50/40">
            <span className="text-[#9c7a3c] font-medium">Privileged Discount</span>
            <span className="font-mono font-semibold text-[#9c7a3c]">-{formatMoney(pricing.discount, currency)}</span>
          </div>
        )}
        {!!pricing.taxes && (
          <div className="px-5 py-3 flex justify-between items-center">
            <span className="text-[#8a9389]">Taxes &amp; Statutory Fees</span>
            <span className="font-mono font-semibold text-[#18201b]">{formatMoney(pricing.taxes, currency)}</span>
          </div>
        )}
        <div className="px-5 py-4 bg-[#f5ede0] flex justify-between items-center border-t border-[#c29d59]/50">
          <div>
            <span className="font-bold uppercase tracking-wider text-[#9c7a3c] text-sm block">Total Investment</span>
            <span className="text-[10px] text-[#4b5a4e] block">All-inclusive bespoke itinerary package</span>
          </div>
          <span className="font-mono font-bold text-2xl text-[#143423]">{formatMoney(pricing.total, currency)}</span>
        </div>
      </div>
      {pricing.notes && (
        <p className="text-[11px] text-[#5c685e] leading-relaxed px-5 py-3 border-t border-[#e8dfcb] bg-white/40">{pricing.notes}</p>
      )}
    </div>
  );
}

function CoverIntro({
  title, customerName, summary, destination, dateRange, dayCount, coverImageUrl,
}: {
  title: string; customerName: string; summary?: string | null; destination?: string | null; dateRange: string; dayCount: number; coverImageUrl?: string | null;
}) {
  return (
    <section className="space-y-6 mb-4">
      {coverImageUrl && (
        <div className="relative overflow-hidden rounded-xl shadow-md">
          <img src={coverImageUrl} alt={title} className="w-full h-56 object-cover" />
          <div className="absolute inset-0 border border-black/10 rounded-xl pointer-events-none" />
        </div>
      )}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#fffdf7] border border-[#c29d59]/60 text-[#143423] shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#9c7a3c]" />
        <span className={type.eyebrow}>Prepared exclusively for {customerName}</span>
      </div>
      <h1 className={`${titleSizeClass(title)} font-serif font-bold text-[#143423] tracking-tight leading-[1.1]`}>{title}</h1>

      <img src={goldDividerPath} alt="" className="w-full h-4 object-contain opacity-80" />

      {summary && <p className="text-base text-[#4b5a4e] leading-relaxed max-w-2xl font-serif italic">{summary}</p>}

      <div className="grid grid-cols-3 gap-px bg-[#e8dfcb] rounded-xl overflow-hidden border border-[#c29d59]/40 shadow-sm">
        <div className="bg-[#fffdf7] p-5">
          <span className={`${type.label} block mb-2`}>Destination</span>
          <span className="block text-lg font-serif font-semibold text-[#143423]">{destination || "—"}</span>
        </div>
        <div className="bg-[#fffdf7] p-5">
          <span className={`${type.label} block mb-2`}>Travel Dates</span>
          <span className="block text-lg font-serif font-semibold text-[#9c7a3c]">{dateRange || "—"}</span>
        </div>
        <div className="bg-[#fffdf7] p-5">
          <span className={`${type.label} block mb-2`}>Duration</span>
          <span className="block text-lg font-serif font-semibold text-[#143423]">{dayCount} {dayCount === 1 ? "Day" : "Days"}</span>
        </div>
      </div>
    </section>
  );
}

function PageChrome({ children, isFirstPage }: { children: ReactNode; isFirstPage: boolean }) {
  return (
    <section
      className="a4-page relative overflow-hidden"
      style={{
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
        minHeight: PAGE_HEIGHT_PX,
        maxHeight: PAGE_HEIGHT_PX,
        backgroundColor: PAPER_BG,
        boxSizing: "border-box",
      }}
    >
      {/* Decorative Botanical Foliage Assets */}
      {isFirstPage ? (
        <>
          {/* Cover: Rich top-right palm frond extending diagonally inward */}
          <img
            src={palmCornerPath}
            alt=""
            className="absolute -top-3 -right-3 w-[270px] h-auto pointer-events-none select-none z-0 opacity-95"
          />
          {/* Cover: Subtle bottom-left tropical foliage accent */}
          <img
            src={palmBottomLeftPath}
            alt=""
            className="absolute -bottom-6 -left-6 w-[210px] h-auto pointer-events-none select-none z-0 opacity-40"
          />
        </>
      ) : (
        <>
          {/* Interior Pages: Subtle corner palm frond in top-right */}
          <img
            src={palmCornerPath}
            alt=""
            className="absolute -top-6 -right-6 w-[140px] h-auto pointer-events-none select-none z-0 opacity-20"
          />
          {/* Subtle bottom-right accent */}
          <img
            src={palmBottomRightPath}
            alt=""
            className="absolute -bottom-6 -right-6 w-[110px] h-auto pointer-events-none select-none z-0 opacity-10"
          />
        </>
      )}
      <div className="relative p-14 h-full flex flex-col justify-between z-10">{children}</div>
    </section>
  );
}

function PageFooterMark({ refText, docLabel }: { refText: string; docLabel: string }) {
  return (
    <footer className="mt-auto pt-2 flex-shrink-0">
      <img src={coastalWavePath} alt="" className="w-full h-3.5 object-cover opacity-40 mb-2 pointer-events-none" />
      <div className="flex justify-between items-end text-neutral-400">
        <span className="text-[9px] font-mono tracking-widest uppercase text-[#9c7a3c]/90">
          Escora Holidays · Kerala Luxury Travel
        </span>
        <div className="text-right">
          <span className={`${type.meta} block font-semibold text-[#9c7a3c]`}>{refText}</span>
          <span className="block text-[9px] uppercase text-neutral-400">{docLabel}</span>
        </div>
      </div>
    </footer>
  );
}

type Block = { key: string; node: ReactNode };

export default function ItineraryPrintDocument({ data, id }: { data: ItineraryPrintData; id?: string }) {
  const {
    title, customerName, destination, startDate, endDate, coverImageUrl, summary,
    days, stays, inclusions, exclusions, pricing, currency, shareToken,
  } = data;

  const ref = refCode(shareToken);
  const dateRange = [formatDate(startDate), formatDate(endDate)].filter(Boolean).join(" – ");
  const showPricing = pricing.items.length > 0;
  const docLabel = "Official Travel Dossier";
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
      let pageBudget = SAFE_PAGE_BUDGET_PX;

      for (let i = 0; i < blocks.length; i++) {
        let h = heights[i] ?? 0;
        if (sectionStarts.has(i)) h += HEADING_HEIGHT;
        if (current.length > 0 && currentHeight + h > pageBudget) {
          grouped.push(current);
          current = [];
          currentHeight = 0;
          pageBudget = SAFE_PAGE_BUDGET_PX;
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
    <div id={id}>
      {/* Hidden measurement pass */}
      <div ref={measureRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", top: 0, left: -99999, width: CONTENT_WIDTH_PX }}>
        {blocks.map((b) => <div key={b.key} className="mb-4">{b.node}</div>)}
      </div>
      <div ref={headingMeasureRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", top: 0, left: -99999, width: CONTENT_WIDTH_PX }}>
        <SectionHeading>Journey Unfolds</SectionHeading>
      </div>
      <div ref={coverMeasureRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", top: 0, left: -99999, width: CONTENT_WIDTH_PX }}>
        <CoverIntro title={title} customerName={customerName} summary={summary} destination={destination} dateRange={dateRange} dayCount={days.length} coverImageUrl={coverImageUrl} />
      </div>

      {pages === null ? null : pages.map((pageBlocks, pageIdx) => {
        let globalIndex = 0;
        for (let p = 0; p < pageIdx; p++) globalIndex += pages[p].length;

        return (
          <PageChrome key={pageIdx} isFirstPage={pageIdx === 0}>
            {pageIdx === 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                {/* Brand Seal & Dossier Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <img src={escoraLogoMarkPath} alt="Escora" className="h-16 w-auto mb-2 drop-shadow-sm" />
                    <span className={`${type.meta} font-semibold block text-[#9c7a3c]`}>{ref}</span>
                    <span className="block text-[9px] uppercase tracking-widest text-[#8a9389]">{docLabel}</span>
                  </div>
                </div>

                <CoverIntro title={title} customerName={customerName} summary={summary} destination={destination} dateRange={dateRange} dayCount={days.length} coverImageUrl={coverImageUrl} />
              </div>
            ) : (
              <div className="space-y-4 flex-1">
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
