import React, { useState, useEffect } from "react";
import {
  Bed,
  Car,
  Camera,
  Bus,
  Phone,
  User,
  FileText,
  Calendar,
  XCircle,
  Check,
  Info,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  MapPin,
  ShieldCheck,
  Award,
} from "lucide-react";
import type {
  ItineraryDay,
  ItineraryStay,
  ItineraryPricing,
  ItineraryTripIncludes,
  ItineraryTransportation,
} from "@/lib/itinerary";
import {
  DEFAULT_HOTEL_TERMS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_IMPORTANT_INFO,
  DEFAULT_EXCLUSIONS,
  DEFAULT_AGENCY_CONTACT,
} from "@/lib/itinerary";

import alleppeyFallbackImg from "@assets/escora/destinations/alleppey.jpg";
import kumarakomFallbackImg from "@assets/escora/destinations/kumarakom.jpg";
import munnarFallbackImg from "@assets/escora/destinations/munnar.jpg";
import fortKochiFallbackImg from "@assets/escora/destinations/fort-kochi.jpg";

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
  mode?: "package" | "itinerary";
  referenceNumber?: string | null;
  curatorName?: string | null;
  curatorPhone?: string | null;
  emergencyContacts?: string | null;
  createdDate?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  tripIncludes?: ItineraryTripIncludes | null;
  transportation?: ItineraryTransportation | null;
  hotelTerms?: string[] | null;
  paymentTerms?: string[] | null;
  importantInfo?: string[] | null;
  agencyPhone?: string | null;
  agencyEmail?: string | null;
  agencyInstagram?: string | null;
  agencyWebsite?: string | null;
}

function formatDDMMYYYY(iso?: string | null, fallback = "—"): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDayWeekdayDate(
  dayNum: number,
  dateStr?: string | null,
  fallbackBaseDate?: Date | null
): { weekday: string; dateText: string } {
  let targetDate: Date | null = null;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      targetDate = d;
    }
  } else if (fallbackBaseDate) {
    targetDate = new Date(fallbackBaseDate.getTime() + (dayNum - 1) * 86400000);
  }

  if (!targetDate) {
    return { weekday: "", dateText: `Day ${dayNum}` };
  }

  const weekday = targetDate.toLocaleDateString("en-IN", { weekday: "long" });
  const day = targetDate.toLocaleDateString("en-IN", { day: "numeric" });
  const month = targetDate.toLocaleDateString("en-IN", { month: "short" });
  const year = targetDate.toLocaleDateString("en-IN", { year: "numeric" });
  return { weekday, dateText: `${day} ${month} ${year}` };
}

export function computeItineraryDatesAndDuration(
  days: ItineraryDay[],
  stays: ItineraryStay[],
  startDate?: string | null,
  endDate?: string | null
): {
  daysCount: number;
  nightsCount: number;
  formattedDuration: string;
  startDateText: string;
  endDateText: string;
  parsedStartDate: Date | null;
} {
  const daysCount = days.length > 0 ? days.length : 1;

  let nightsFromStays = 0;
  if (stays && stays.length > 0) {
    nightsFromStays = stays.reduce((acc, s) => acc + (s.nights || 0), 0);
  }

  let nightsFromDates = 0;
  let parsedStart: Date | null = null;
  let parsedEnd: Date | null = null;

  if (startDate) {
    const s = new Date(startDate);
    if (!Number.isNaN(s.getTime())) {
      parsedStart = s;
    }
  }

  if (endDate) {
    const e = new Date(endDate);
    if (!Number.isNaN(e.getTime())) {
      parsedEnd = e;
    }
  }

  if (parsedStart && parsedEnd) {
    const diff = Math.round((parsedEnd.getTime() - parsedStart.getTime()) / 86400000);
    if (diff > 0) {
      nightsFromDates = diff;
    }
  }

  let finalNights = nightsFromStays;
  if (finalNights === 0 && nightsFromDates > 0) {
    finalNights = nightsFromDates;
  }
  if (finalNights === 0) {
    finalNights = Math.max(0, daysCount - 1);
  }

  let finalStartDateText = "Dates to be advised";
  let finalEndDateText = "Dates to be advised";

  if (parsedStart) {
    finalStartDateText = formatDDMMYYYY(parsedStart.toISOString());
    if (parsedEnd && nightsFromDates === daysCount - 1) {
      finalEndDateText = formatDDMMYYYY(parsedEnd.toISOString());
    } else {
      const derivedEnd = new Date(parsedStart.getTime() + (daysCount - 1) * 86400000);
      finalEndDateText = formatDDMMYYYY(derivedEnd.toISOString());
    }
  } else if (parsedEnd) {
    finalEndDateText = formatDDMMYYYY(parsedEnd.toISOString());
  }

  const formattedDuration = `${finalNights}N | ${daysCount}D`;

  return {
    daysCount,
    nightsCount: finalNights,
    formattedDuration,
    startDateText: finalStartDateText,
    endDateText: finalEndDateText,
    parsedStartDate: parsedStart,
  };
}

function splitTitle(title: string): { line1: string; line2?: string } {
  if (!title) return { line1: "Kerala", line2: "Slow-Luxury Journey" };
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 2) return { line1: title.trim() };
  if (parts.length <= 4) {
    const mid = Math.ceil(parts.length / 2);
    return {
      line1: parts.slice(0, mid).join(" "),
      line2: parts.slice(mid).join(" "),
    };
  }
  const dashMatch = title.match(/^(.*?)\s*([—–-])\s*(.*?)$/);
  if (dashMatch) {
    return { line1: dashMatch[1].trim(), line2: dashMatch[3].trim() };
  }
  const mid = Math.ceil(parts.length / 2);
  return {
    line1: parts.slice(0, mid).join(" "),
    line2: parts.slice(mid).join(" "),
  };
}

function formatPageNum(pageNum: number, total: number): string {
  const p = String(pageNum).padStart(2, "0");
  const t = String(total).padStart(2, "0");
  return `${p} / ${t}`;
}

function ImageWithFallback({
  src,
  fallback,
  alt,
  className = "",
  style = {},
}: {
  src?: string | null;
  fallback?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const initial = src || fallback || "";
  const [currentSrc, setCurrentSrc] = useState<string>(initial);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallback || "");
    setHasError(false);
  }, [src, fallback]);

  if (hasError || !currentSrc) {
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading="eager"
      crossOrigin="anonymous"
      onError={() => {
        if (fallback && currentSrc !== fallback) {
          setCurrentSrc(fallback);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

function BrandLogo({ variant = "dark" }: { variant?: "dark" | "white" }) {
  const isWhite = variant === "white";
  return (
    <div className="flex flex-col select-none">
      <div className="flex items-start">
        <span
          className="font-serif text-[24px] font-bold tracking-tight leading-none"
          style={{
            fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: isWhite ? "#FAF7F1" : "#39271F",
          }}
        >
          Escora
        </span>
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 -ml-0.5 -mt-1"
          fill={isWhite ? "#FAF7F1" : "#A45132"}
        >
          <path d="M12 2C9.5 5 5 7 2 7c3.5 1.5 6.5 4 8 8 1.5-4 4.5-6.5 8-8-3 0-7.5-2-6-5z" />
        </svg>
      </div>
      <span
        className="text-[7.5px] font-bold tracking-[0.28em] uppercase -mt-0.5"
        style={{
          color: isWhite ? "#BE8C70" : "#685D56",
          letterSpacing: "0.28em",
        }}
      >
        HOLIDAYS
      </span>
    </div>
  );
}

function EditorialHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2
        className="font-serif text-[18px] font-bold text-[#39271F] tracking-tight leading-none"
        style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {title}
      </h2>
      <div className="w-12 h-[1.5px] bg-[#BE8C70]" />
    </div>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="w-full mb-3 shrink-0">
      <div className="flex items-center justify-between pb-1">
        <EditorialHeading title={title} />
        <BrandLogo variant="dark" />
      </div>
      <div className="w-full h-px bg-[#E4DDD3] mt-2" />
    </div>
  );
}

function PageFooterIndicator({
  pageNum,
  totalPages,
  referenceNumber,
}: {
  pageNum: number;
  totalPages: number;
  referenceNumber?: string;
}) {
  return (
    <div className="w-full pt-1.5 border-t border-[#E4DDD3]/70 flex items-center justify-between text-[8.5px] text-[#685D56] shrink-0 mt-auto">
      <span className="font-mono tracking-wide">
        {referenceNumber ? `REF: ${referenceNumber}` : "ESCORA LUXURY TRAVEL DOSSIER"}
      </span>
      <span className="font-mono tabular-nums">
        {formatPageNum(pageNum, totalPages)}
      </span>
    </div>
  );
}

function ItineraryDayBlock({
  dayNumber,
  header,
  title,
  description,
  activities = [],
  optionalActivities,
  meals,
  stay,
  images = [],
  isLastOnPage = false,
}: {
  dayNumber: number;
  header: { weekday: string; dateText: string };
  title?: string | null;
  description?: string | null;
  activities?: Array<{ time?: string; title: string; description?: string }>;
  optionalActivities?: string[] | string | null;
  meals?: string | null;
  stay?: string | null;
  images?: string[];
  isLastOnPage?: boolean;
}) {
  const hasImages = images && images.length > 0;
  const hasActivities = activities && activities.length > 0;

  return (
    <div className="flex gap-4 relative w-full mb-3 last:mb-0">
      {/* Left Timeline Gutter */}
      <div className="w-11 shrink-0 flex flex-col items-center">
        <span
          className="font-serif text-[10px] text-[#685D56] uppercase tracking-wider leading-none"
          style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          Day
        </span>
        <span
          className="font-serif text-[28px] font-bold text-[#A45132] leading-none mt-0.5"
          style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          {dayNumber}
        </span>
        {!isLastOnPage && <div className="w-px bg-[#E4DDD3] flex-1 mt-2 mb-1" />}
      </div>

      {/* Right Content Column */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="text-[9px] font-semibold text-[#8C7A6B] tracking-wide uppercase">
          {header.weekday ? `${header.weekday} · ` : ""}
          {header.dateText}
        </div>
        <h3
          className="font-serif text-[14px] font-bold text-[#39271F] mt-0.5 mb-1 leading-snug"
          style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          {title ?? `Day ${dayNumber} Itinerary`}
        </h3>

        {description && (
          <div className="text-[8.75px] leading-[1.5] text-[#282421] space-y-1 mb-1.5 whitespace-pre-line">
            {description}
          </div>
        )}

        {hasActivities && (
          <div className="mb-2 space-y-1">
            {activities.map((act, aIdx) => (
              <div key={aIdx} className="flex items-center gap-2 text-[8.5px] text-[#39271F]">
                {act.time ? (
                  <span className="font-mono font-bold text-[#A45132] bg-[#F5EBE1] px-1.5 py-0.5 rounded text-[8px] shrink-0">
                    {act.time}
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BE8C70] shrink-0" />
                )}
                <span className="font-medium">{act.title}</span>
              </div>
            ))}
          </div>
        )}

        {optionalActivities && (
          <div className="bg-[#F0E6DA] rounded p-2 mb-1.5 text-[#39271F]">
            <span className="text-[8.5px] font-bold block mb-0.5">Optional (on request):</span>
            <ul className="text-[8px] text-[#5C524C] space-y-0.5 list-disc list-inside">
              {Array.isArray(optionalActivities) ? (
                optionalActivities.map((act, idx) => <li key={idx}>{act}</li>)
              ) : (
                <li>{optionalActivities}</li>
              )}
            </ul>
          </div>
        )}

        {meals && (
          <div className="text-[8.25px] italic text-[#685D56] mb-1 leading-relaxed">
            {meals}
          </div>
        )}

        {stay && (
          <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
            <Bed className="w-3.5 h-3.5 text-[#A45132] shrink-0" />
            <span>{stay.startsWith("Stay:") ? stay : `Stay: ${stay}`}</span>
          </div>
        )}

        {hasImages && (
          <div
            className={`w-full mt-1.5 rounded overflow-hidden ${
              images.length === 1 ? "h-[105px]" : "grid grid-cols-2 gap-2.5 h-[90px]"
            }`}
          >
            {images.slice(0, 2).map((imgSrc, idx) => (
              <div key={idx} className="w-full h-full rounded overflow-hidden relative">
                <ImageWithFallback
                  src={imgSrc}
                  alt={`${title ?? "Day"} photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayPageAtmosphereAccent({
  accentIndex = 0,
  heightPx = 130,
}: {
  accentIndex?: number;
  heightPx?: number;
}) {
  const accents = [
    {
      img: munnarFallbackImg,
      alt: "Munnar Tea Plantations",
      quote: "Misty plantation trails and emerald valleys — where Kerala's tranquil rhythm gently unfolds.",
      tag: "CURATED HIGHLIGHT · THE HILL RETREAT",
    },
    {
      img: alleppeyFallbackImg,
      alt: "Alleppey Backwaters Houseboat",
      quote: "Palm-fringed lagoons and golden waterside serenity — timeless slow luxury in God's Own Country.",
      tag: "CURATED HIGHLIGHT · BACKWATER SPLENDOUR",
    },
    {
      img: fortKochiFallbackImg,
      alt: "Fort Kochi Heritage Shoreline",
      quote: "Centuries of spice trading history, colonial avenues, and vibrant Kathakali classical traditions.",
      tag: "CURATED HIGHLIGHT · HERITAGE & CULTURE",
    },
  ];

  const accent = accents[accentIndex % accents.length];

  return (
    <div
      className="relative w-full rounded overflow-hidden mt-3 shrink-0 border border-[#E4DDD3]/60 shadow-xs"
      style={{ height: `${heightPx}px` }}
    >
      <ImageWithFallback
        src={accent.img}
        alt={accent.alt}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex flex-col justify-end p-3">
        <span className="text-[7.5px] font-bold tracking-widest uppercase text-[#BE8C70] mb-0.5">
          {accent.tag}
        </span>
        <span className="text-[9px] font-serif italic text-white/95 tracking-wide leading-snug">
          &ldquo;{accent.quote}&rdquo;
        </span>
      </div>
    </div>
  );
}

function AccommodationsSection({
  stays,
  destinationText,
}: {
  stays: ItineraryStay[];
  destinationText: string;
}) {
  return (
    <div className="shrink-0">
      <EditorialHeading title="Accommodations &amp; Stays" />
      <div className="bg-[#F0E6DA] rounded p-2.5 text-[#39271F] mt-1.5">
        {stays && stays.length > 0 ? (
          <div className="space-y-2">
            {stays.map((stay, idx) => (
              <div key={idx} className={idx > 0 ? "pt-2 border-t border-[#E2D7C8]" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-[#39271F] block leading-tight">
                      {stay.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[8px] text-[#685D56] mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-[#A45132] shrink-0" />
                      <span>{stay.location || destinationText}</span>
                    </div>
                  </div>
                  {stay.starRating && (
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#183D2E] bg-[#E2EDDE] px-2 py-0.5 rounded shrink-0">
                      {stay.starRating}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-5 text-[8px] text-[#4E463C] mt-1 pt-0.5 flex-wrap">
                  <div>
                    <span className="text-[#685D56]">Duration: </span>
                    <span className="font-bold">{stay.nights ?? 1} Night{(stay.nights ?? 1) > 1 ? "s" : ""}</span>
                  </div>
                  <div>
                    <span className="text-[#685D56]">Rooms: </span>
                    <span className="font-bold">{stay.rooms ?? 1}</span>
                  </div>
                  <div>
                    <span className="text-[#685D56]">Meal Plan: </span>
                    <span className="font-bold">{stay.mealPlan || "Breakfast"}</span>
                  </div>
                  {stay.roomType && (
                    <div>
                      <span className="text-[#685D56]">Category: </span>
                      <span className="font-bold">{stay.roomType}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[8.5px] text-[#685D56] italic">
            Handpicked 5-Star hotels, heritage boutique retreats and private backwater houseboats reserved according to client specification.
          </div>
        )}
      </div>
    </div>
  );
}

function TransportationSection({
  transportation,
}: {
  transportation: ItineraryTransportation;
}) {
  return (
    <div className="shrink-0">
      <EditorialHeading title="Transportation &amp; Transfers" />
      <div className="bg-[#FAF7F1] border border-[#E4DDD3] rounded p-2 flex items-center justify-between gap-4 mt-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#F0E6DA] flex items-center justify-center text-[#39271F] shrink-0">
            <Car className="w-3.5 h-3.5 text-[#A45132]" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[#39271F] block leading-snug">
              {transportation.origin}
            </span>
            <span className="text-[8px] text-[#685D56] block mt-0.5">
              {transportation.destination}
            </span>
          </div>
        </div>
        {transportation.vehicleType && (
          <div className="shrink-0 text-right">
            <span className="text-[8px] font-semibold text-[#A45132] bg-[#F5EBE1] px-2 py-0.5 rounded inline-block">
              {transportation.vehicleType}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InclusionsExclusionsSection({
  inclusions,
  exclusions,
}: {
  inclusions: string[];
  exclusions: string[];
}) {
  return (
    <div className="shrink-0">
      <EditorialHeading title="Inclusions &amp; Exclusions" />
      <div className="grid grid-cols-2 gap-3 mt-1.5">
        {/* Inclusions Card */}
        <div className="bg-[#F0E6DA] rounded p-2.5 text-[#39271F] flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#183D2E] block mb-1.5 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#183D2E]" /> Inclusions
            </span>
            <ul className="space-y-1">
              {inclusions.length > 0 ? (
                inclusions.map((inc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[8px] text-[#282421]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#183D2E] mt-1 shrink-0" />
                    <span className="leading-snug">{inc}</span>
                  </li>
                ))
              ) : (
                <li className="text-[8px] text-[#685D56] italic">
                  Luxury accommodations, private chauffeur AC transfers, sightseeing access and curated experiences as outlined in the proposal.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Exclusions Card */}
        <div className="bg-[#F0E6DA] rounded p-2.5 text-[#39271F] flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#A45132] block mb-1.5 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-[#A45132]" /> Exclusions
            </span>
            <ul className="space-y-1">
              {exclusions.length > 0 ? (
                exclusions.map((exc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[8px] text-[#282421]">
                    <XCircle className="w-2.5 h-2.5 text-[#A45132] shrink-0 mt-0.5" />
                    <span className="leading-snug">{exc}</span>
                  </li>
                ))
              ) : (
                DEFAULT_EXCLUSIONS.slice(0, 3).map((exc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[8px] text-[#282421]">
                    <XCircle className="w-2.5 h-2.5 text-[#A45132] shrink-0 mt-0.5" />
                    <span className="leading-snug">{exc}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvestmentPricingSection({
  pricing,
  currencySymbol,
  computedPricingTotal,
  discountAmount,
  taxesAmount,
  compact = false,
}: {
  pricing: ItineraryPricing;
  currencySymbol: string;
  computedPricingTotal: number;
  discountAmount: number;
  taxesAmount: number;
  compact?: boolean;
}) {
  const hasLineItems = pricing?.items && pricing.items.length > 0;
  const pad = compact ? "p-2" : "p-2.5";
  const itemPy = compact ? "py-0.5" : "py-1";

  return (
    <div className={`shrink-0 ${compact ? "space-y-1.5" : "space-y-2"}`}>
      {hasLineItems && (
        <div className={`bg-[#FAF7F1] border border-[#E4DDD3] rounded-t ${pad} text-[8px] space-y-0.5`}>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#685D56] block mb-1">
            Itemized Investment Breakdown
          </span>
          {pricing.items!.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between text-[#39271F] ${itemPy} border-b border-[#E4DDD3]/50 last:border-b-0`}
            >
              <span className="text-[#685D56]">{item.label}</span>
              <span className="font-sans font-bold tabular-nums">
                {currencySymbol}
                {Number(item.amount).toLocaleString("en-IN")}
              </span>
            </div>
          ))}

          {discountAmount > 0 && (
            <div className={`flex items-center justify-between text-[#183D2E] ${itemPy} pt-1 border-t border-[#E4DDD3]`}>
              <span className="font-medium">Special Applied Privilege / Discount</span>
              <span className="font-bold tabular-nums">- {currencySymbol}{discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}

          {taxesAmount > 0 && (
            <div className={`flex items-center justify-between text-[#685D56] ${itemPy}`}>
              <span className="font-medium">Applicable Taxes &amp; GST</span>
              <span className="font-bold tabular-nums">+ {currencySymbol}{taxesAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>
      )}

      {/* Total Package Investment Banner */}
      <div
        className={`bg-[#A45132] text-[#FAF7F1] ${compact ? "px-4 py-2" : "px-4 py-2.5"} ${
          hasLineItems ? "rounded-b" : "rounded"
        } flex items-center justify-between shadow-xs`}
      >
        <div>
          <span className="text-[9.5px] font-bold tracking-widest uppercase block">
            TOTAL PACKAGE INVESTMENT
          </span>
          <span className="text-[7.5px] text-[#F5EBE1] block mt-0.5">
            All-inclusive quote per specified itinerary, private transfers &amp; verified stays
          </span>
        </div>
        <span
          className="font-serif text-[20px] font-bold tracking-tight tabular-nums"
          style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          {computedPricingTotal > 0 ? (
            <>
              <span className="font-sans mr-0.5">{currencySymbol}</span>
              {Number(computedPricingTotal).toLocaleString("en-IN")}
            </>
          ) : (
            <span className="text-xs font-sans font-medium">Bespoke Quote on Request</span>
          )}
        </span>
      </div>

      {pricing?.notes && (
        <div className="text-[8px] italic text-[#685D56] leading-tight">
          * {pricing.notes}
        </div>
      )}
    </div>
  );
}

function TermsAndGuidelinesSection({
  hotelTerms,
  paymentTerms,
  importantInfo,
  compact = false,
}: {
  hotelTerms: string[];
  paymentTerms: string[];
  importantInfo: string[];
  compact?: boolean;
}) {
  const pad = compact ? "p-2" : "p-3";
  const limit = compact ? 4 : 6;
  const textSize = compact ? "text-[7.75px]" : "text-[8.25px]";
  const leading = compact ? "leading-[1.4]" : "leading-[1.45]";
  const itemSpace = compact ? "space-y-0.5" : "space-y-1";

  return (
    <div className={`shrink-0 ${compact ? "space-y-1.5" : "space-y-2.5"}`}>
      {/* Terms & Conditions (2 Columns) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Hotel Terms */}
        <div className={`bg-[#F0E6DA] rounded ${pad} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
              <Bed className="w-3.5 h-3.5 text-[#A45132]" />
              <span>Hotel Terms &amp; Policies</span>
            </div>
            <ul className={`${textSize} ${leading} text-[#4E463C] ${itemSpace} list-disc list-inside`}>
              {hotelTerms.slice(0, limit).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment Terms */}
        <div className={`bg-[#F0E6DA] rounded ${pad} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
              <FileText className="w-3.5 h-3.5 text-[#A45132]" />
              <span>Payment &amp; Booking Terms</span>
            </div>
            <ul className={`${textSize} ${leading} text-[#4E463C] ${itemSpace} list-disc list-inside`}>
              {paymentTerms.slice(0, limit).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Important Travel Guidelines */}
      <div className={`bg-[#F0E6DA] rounded ${pad}`}>
        <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
          <Info className="w-3.5 h-3.5 text-[#A45132]" />
          <span>Important Travel Guidelines &amp; Protocol</span>
        </div>
        <ul className={`${textSize} ${leading} text-[#4E463C] ${itemSpace} list-disc list-inside`}>
          {importantInfo.slice(0, limit).map((info, idx) => (
            <li key={idx}>{info}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TrustSafeguardsBar() {
  return (
    <div className="bg-[#FAF7F1] border border-[#E4DDD3] rounded p-2 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-[#39271F] leading-tight">Google Review · 5.0 Rating</span>
            <div className="flex items-center text-[#F59E0B] text-[10px] leading-none">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
          </div>
          <span className="text-[7.5px] text-[#685D56] block">Verified International Traveller Feedback</span>
        </div>
      </div>

      <div className="flex items-center gap-3 border-l border-[#E4DDD3] pl-3">
        <div className="flex items-center gap-1.5 text-[8px] text-[#183D2E]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#183D2E]" />
          <span className="font-semibold">24/7 On-Trip Concierge</span>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] text-[#A45132]">
          <Award className="w-3.5 h-3.5 text-[#A45132]" />
          <span className="font-semibold">Kerala Tourism Accredited</span>
        </div>
      </div>
    </div>
  );
}

function ClosingAgencyFooter({
  agencyPhone,
  agencyEmail,
  agencyWebsite,
  pageNum,
  totalPages,
}: {
  agencyPhone: string;
  agencyEmail: string;
  agencyWebsite: string;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <div className="w-full mt-auto pt-2 shrink-0">
      <div className="bg-[#39271F] text-[#FAF7F1] rounded px-4 py-2 flex items-center justify-between">
        <BrandLogo variant="white" />
        <div className="flex items-center gap-4 text-[8px]">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-[#BE8C70]" />
            <span>{agencyPhone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-[#BE8C70]" />
            <span>{agencyEmail}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-[#BE8C70]" />
            <span>{agencyWebsite.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#FAF7F1]">
            <div className="w-4 h-4 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center">
              <Facebook className="w-2 h-2" />
            </div>
            <div className="w-4 h-4 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center">
              <Instagram className="w-2 h-2" />
            </div>
            <div className="w-4 h-4 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center">
              <Twitter className="w-2 h-2" />
            </div>
            <div className="w-4 h-4 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center">
              <Linkedin className="w-2 h-2" />
            </div>
          </div>
          <span className="text-[8px] font-mono text-[#BE8C70] font-bold pl-2 border-l border-[#FAF7F1]/20">
            {formatPageNum(pageNum, totalPages)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface DayPageItem {
  day: ItineraryDay;
  dayNumber: number;
  header: { weekday: string; dateText: string };
  images: string[];
  estimatedHeight: number;
}

function estimateDayHeight(day: ItineraryDay): number {
  let h = 48;
  const desc = day.description || "";
  const descLines = Math.ceil(desc.length / 90);
  h += Math.max(1, descLines) * 14;

  if (day.activities && day.activities.length > 0) {
    h += day.activities.length * 16;
  }
  if (day.optionalActivities) {
    const count = Array.isArray(day.optionalActivities) ? day.optionalActivities.length : 1;
    h += count * 14 + 18;
  }
  if (day.meals) {
    h += 16;
  }
  if (day.stay) {
    h += 18;
  }
  const images = day.imageUrls && day.imageUrls.length > 0
    ? day.imageUrls
    : day.imageUrl ? [day.imageUrl] : [];
  if (images.length === 1) {
    h += 110;
  } else if (images.length >= 2) {
    h += 95;
  }
  return h;
}

export type PageLayoutType =
  | "cover"
  | "days"
  | "days-and-all"
  | "days-and-services"
  | "services"
  | "services-and-investment"
  | "investment";

export interface PlannedPage {
  pageNumber: number;
  type: PageLayoutType;
  headerTitle: string;
  dayItems?: DayPageItem[];
  accentIndex?: number;
  accentHeightPx?: number;
  showPanorama?: boolean;
  includeInclusionsExclusions?: boolean;
}

export function planItineraryPages(
  days: ItineraryDay[],
  stays: ItineraryStay[],
  inclusions: string[],
  exclusions: string[],
  pricing: ItineraryPricing,
  parsedStartDate: Date | null
): PlannedPage[] {
  const dayItems: DayPageItem[] = days.map((day, idx) => {
    const dayNumber = idx + 1;
    const header = formatDayWeekdayDate(dayNumber, day.date, parsedStartDate);
    const images =
      day.imageUrls && day.imageUrls.length > 0
        ? day.imageUrls
        : day.imageUrl
        ? [day.imageUrl]
        : [];
    const estimatedHeight = estimateDayHeight(day);
    return { day, dayNumber, header, images, estimatedHeight };
  });

  // Section Heights Estimation
  const staysCount = stays?.length || 0;
  const accommodationsHeight = staysCount > 0 ? 32 + 16 + staysCount * 46 : 50;
  const transportationHeight = 60;
  const incCount = Math.max(inclusions.length, exclusions.length);
  const inclusionsHeight = 32 + Math.max(1, incCount) * 15 + 24;
  const servicesHeight = accommodationsHeight + transportationHeight + inclusionsHeight;

  const lineItemsCount = pricing?.items?.length || 0;
  const pricingHeight = (lineItemsCount > 0 ? 28 + lineItemsCount * 17 + 20 : 0) + 48 + (pricing?.notes ? 16 : 0);
  const termsHeight = 110;
  const guidelinesHeight = 80;
  const trustHeight = 38;
  const closingFooterHeight = 52;
  const investmentHeight = pricingHeight + termsHeight + guidelinesHeight + trustHeight + closingFooterHeight + 20;

  const totalPostHeight = servicesHeight + investmentHeight + 30;

  const pages: PlannedPage[] = [];
  let pageCounter = 1;

  // 1. Cover Page
  pages.push({
    pageNumber: pageCounter++,
    type: "cover",
    headerTitle: "",
  });

  // 2. Single-Day Itinerary Special Case:
  if (dayItems.length === 1) {
    const day1Height = dayItems[0].estimatedHeight;
    const compactAllHeight = day1Height + accommodationsHeight + transportationHeight + inclusionsHeight + pricingHeight + 140 + 38 + 52 + 50;
    if (compactAllHeight <= 900) {
      // Perfect 2-page dossier
      pages.push({
        pageNumber: pageCounter++,
        type: "days-and-all",
        headerTitle: "Day-To-Day Plan & Complete Services",
        dayItems: [dayItems[0]],
      });
      return pages;
    } else {
      // 3 pages
      pages.push({
        pageNumber: pageCounter++,
        type: "days-and-services",
        headerTitle: "Day-To-Day Plan & Services",
        dayItems: [dayItems[0]],
      });
      pages.push({
        pageNumber: pageCounter++,
        type: "investment",
        headerTitle: "Investment, Terms & Policies",
        includeInclusionsExclusions: true,
      });
      return pages;
    }
  }

  // 3. Multi-Day Itineraries: Group days based on content height
  const MAX_PAGE_DAY_H = 840;
  const totalDaysH = dayItems.reduce((acc, it) => acc + it.estimatedHeight, 0);

  let dayGroups: DayPageItem[][] = [];

  if (totalDaysH <= MAX_PAGE_DAY_H) {
    // All days fit on 1 page!
    dayGroups = [dayItems];
  } else {
    // Check if days fit on 2 pages with balanced distribution
    let bestTwoPageSplit: number | null = null;
    let minDiff = Infinity;

    for (let k = 1; k < dayItems.length; k++) {
      const g1 = dayItems.slice(0, k);
      const g2 = dayItems.slice(k);
      const h1 = g1.reduce((acc, it) => acc + it.estimatedHeight, 0);
      const h2 = g2.reduce((acc, it) => acc + it.estimatedHeight, 0);

      if (h1 <= MAX_PAGE_DAY_H && h2 <= MAX_PAGE_DAY_H) {
        const diff = Math.abs(h1 - h2);
        if (diff < minDiff) {
          minDiff = diff;
          bestTwoPageSplit = k;
        }
      }
    }

    if (bestTwoPageSplit !== null) {
      dayGroups = [
        dayItems.slice(0, bestTwoPageSplit),
        dayItems.slice(bestTwoPageSplit),
      ];
    } else {
      // Check if days fit on 3 pages with balanced distribution
      let bestThreePageSplit: [number, number] | null = null;
      let minVariance = Infinity;

      for (let j = 1; j < dayItems.length - 1; j++) {
        for (let k = j + 1; k < dayItems.length; k++) {
          const g1 = dayItems.slice(0, j);
          const g2 = dayItems.slice(j, k);
          const g3 = dayItems.slice(k);
          const h1 = g1.reduce((acc, it) => acc + it.estimatedHeight, 0);
          const h2 = g2.reduce((acc, it) => acc + it.estimatedHeight, 0);
          const h3 = g3.reduce((acc, it) => acc + it.estimatedHeight, 0);

          if (h1 <= MAX_PAGE_DAY_H && h2 <= MAX_PAGE_DAY_H && h3 <= MAX_PAGE_DAY_H) {
            const avg = (h1 + h2 + h3) / 3;
            const variance = Math.pow(h1 - avg, 2) + Math.pow(h2 - avg, 2) + Math.pow(h3 - avg, 2);
            if (variance < minVariance) {
              minVariance = variance;
              bestThreePageSplit = [j, k];
            }
          }
        }
      }

      if (bestThreePageSplit !== null) {
        dayGroups = [
          dayItems.slice(0, bestThreePageSplit[0]),
          dayItems.slice(bestThreePageSplit[0], bestThreePageSplit[1]),
          dayItems.slice(bestThreePageSplit[1]),
        ];
      } else {
        // Fallback: Greedy packing with 840 threshold
        let currentGroup: DayPageItem[] = [];
        let currentH = 0;
        for (let i = 0; i < dayItems.length; i++) {
          const item = dayItems[i];
          const gap = currentGroup.length === 0 ? 0 : 12;
          if (currentGroup.length > 0 && currentH + gap + item.estimatedHeight > MAX_PAGE_DAY_H) {
            dayGroups.push(currentGroup);
            currentGroup = [item];
            currentH = item.estimatedHeight;
          } else {
            currentGroup.push(item);
            currentH += gap + item.estimatedHeight;
          }
        }
        if (currentGroup.length > 0) {
          dayGroups.push(currentGroup);
        }
      }
    }
  }

  // 4. Plan Pages from Day Groups and Logistics
  if (dayGroups.length === 1) {
    const daysTotalH = dayGroups[0].reduce((s, it) => s + it.estimatedHeight, 0);
    const hasPhotos = dayGroups[0].some((it) => it.images.length > 0);
    const residualOnDayPage = 880 - daysTotalH;

    pages.push({
      pageNumber: pageCounter++,
      type: "days",
      headerTitle: "Day-To-Day Plan",
      dayItems: dayGroups[0],
      accentIndex: 0,
      accentHeightPx: !hasPhotos && residualOnDayPage >= 160 ? Math.min(170, residualOnDayPage - 40) : 0,
    });

    if (totalPostHeight <= 880) {
      pages.push({
        pageNumber: pageCounter++,
        type: "services-and-investment",
        headerTitle: "Included Services & Investment",
      });
    } else {
      pages.push({
        pageNumber: pageCounter++,
        type: "services",
        headerTitle: "Included Accommodations & Logistics",
        showPanorama: true,
      });
      pages.push({
        pageNumber: pageCounter++,
        type: "investment",
        headerTitle: "Inclusions, Investment & Policies",
        includeInclusionsExclusions: true,
      });
    }
    return pages;
  }

  // Multi-day page groups (> 1 page of days)
  const lastGroup = dayGroups[dayGroups.length - 1];
  const lastGroupH = lastGroup.reduce((s, it) => s + it.estimatedHeight, 0);
  const canFitLogisticsOnLastDay = (lastGroupH + accommodationsHeight + transportationHeight <= 840) && (staysCount <= 4);

  for (let gIdx = 0; gIdx < dayGroups.length; gIdx++) {
    const isLastGroup = gIdx === dayGroups.length - 1;
    const groupItems = dayGroups[gIdx];
    const groupH = groupItems.reduce((s, it) => s + it.estimatedHeight, 0);
    const hasPhotos = groupItems.some((it) => it.images.length > 0);
    const residual = 880 - groupH;

    if (isLastGroup && canFitLogisticsOnLastDay) {
      pages.push({
        pageNumber: pageCounter++,
        type: "days-and-services",
        headerTitle: "Day-To-Day Plan & Logistics",
        dayItems: groupItems,
      });

      // The remaining page holds Inclusions, Investment, Terms & Closing Footer
      pages.push({
        pageNumber: pageCounter++,
        type: "investment",
        headerTitle: "Investment, Terms & Policies",
        includeInclusionsExclusions: true,
      });
      return pages;
    } else {
      pages.push({
        pageNumber: pageCounter++,
        type: "days",
        headerTitle: gIdx === 0 ? "Day-To-Day Plan" : "Day-To-Day Plan (Continued)",
        dayItems: groupItems,
        accentIndex: gIdx,
        accentHeightPx: !hasPhotos && residual >= 160 ? Math.min(170, residual - 40) : 0,
      });
    }
  }

  // Post-itinerary pages (when logistics did not fit on the last day page)
  if (totalPostHeight <= 880) {
    pages.push({
      pageNumber: pageCounter++,
      type: "services-and-investment",
      headerTitle: "Included Services & Investment",
    });
  } else {
    pages.push({
      pageNumber: pageCounter++,
      type: "services",
      headerTitle: "Included Accommodations & Logistics",
      showPanorama: true,
    });
    pages.push({
      pageNumber: pageCounter++,
      type: "investment",
      headerTitle: "Inclusions, Investment & Policies",
      includeInclusionsExclusions: true,
    });
  }

  return pages;
}

export default function ItineraryPrintDocument({
  data,
  id,
}: {
  data: ItineraryPrintData;
  id?: string;
}) {
  const {
    title,
    customerName,
    destination,
    startDate,
    endDate,
    coverImageUrl,
    summary,
    days = [],
    stays = [],
    inclusions = [],
    exclusions = [],
    pricing,
    currency = "INR",
    shareToken,
  } = data;

  const {
    daysCount,
    formattedDuration,
    startDateText,
    endDateText,
    parsedStartDate,
  } = computeItineraryDatesAndDuration(days, stays, startDate, endDate);

  const adults = data.adults ?? 1;
  const children = data.children ?? 0;
  const infants = data.infants ?? 0;

  const emergencyContacts =
    data.emergencyContacts || DEFAULT_AGENCY_CONTACT.emergencyContacts;
  const curatorName = data.curatorName || DEFAULT_AGENCY_CONTACT.curatorName;
  const curatorPhone = data.curatorPhone || DEFAULT_AGENCY_CONTACT.curatorPhone;
  const referenceNumber =
    data.referenceNumber ||
    (shareToken ? `ESC-${shareToken.slice(0, 6).toUpperCase()}` : "ESC-PROPOSAL");
  const createdDate = formatDDMMYYYY(
    data.createdDate || startDate || new Date().toISOString()
  );

  const destinationText =
    destination || (stays[0]?.location ? `${stays[0].location}, Kerala` : "Kerala, India");

  const transportation: ItineraryTransportation = data.transportation || {
    origin: `ESCORA HOLIDAYS | ${destinationText}`,
    destination: `Arrival & Departure Sightseeing Transfers (${destinationText})`,
    vehicleType: "Private Dedicated Chauffeur Driven AC Sedan / SUV",
  };

  const activeExclusions =
    exclusions && exclusions.length > 0 ? exclusions : DEFAULT_EXCLUSIONS;
  const hotelTerms =
    data.hotelTerms && data.hotelTerms.length > 0 ? data.hotelTerms : DEFAULT_HOTEL_TERMS;
  const paymentTerms =
    data.paymentTerms && data.paymentTerms.length > 0 ? data.paymentTerms : DEFAULT_PAYMENT_TERMS;
  const importantInfo =
    data.importantInfo && data.importantInfo.length > 0 ? data.importantInfo : DEFAULT_IMPORTANT_INFO;

  const agencyPhone = data.agencyPhone || DEFAULT_AGENCY_CONTACT.phone;
  const agencyEmail = data.agencyEmail || DEFAULT_AGENCY_CONTACT.email;
  const agencyWebsite = data.agencyWebsite || DEFAULT_AGENCY_CONTACT.website;

  const titleParts = splitTitle(title);

  // Compute pricing totals
  const subtotal =
    (pricing?.items && pricing.items.length > 0
      ? pricing.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : null) ?? (Number(pricing?.total) || 0);

  const discountAmount = Number(pricing?.discount) || 0;
  const taxesAmount = Number(pricing?.taxes) || 0;
  const computedPricingTotal =
    pricing?.total && Number(pricing.total) > 0
      ? Number(pricing.total)
      : Math.max(0, subtotal - discountAmount + taxesAmount);

  const currencySymbol = currency === "INR" ? "₹" : `${currency} `;

  // Inclusion icons on cover page
  const incConfig = data.tripIncludes ?? {
    hotel: true,
    transport: true,
    sightseeing: true,
    transfer: true,
  };

  const includedBadges = [
    { key: "hotel", label: "Hotel", icon: Bed, active: incConfig.hotel ?? true },
    { key: "transport", label: "Transport", icon: Car, active: incConfig.transport ?? true },
    { key: "sightseeing", label: "Sight-Seeing", icon: Camera, active: incConfig.sightseeing ?? true },
    { key: "transfer", label: "Transfer", icon: Bus, active: incConfig.transfer ?? true },
  ].filter((b) => b.active);

  // Plan pages using intelligent content packing
  const plannedPages = planItineraryPages(
    days,
    stays,
    inclusions,
    activeExclusions,
    pricing,
    parsedStartDate
  );

  const totalPages = plannedPages.length;

  return (
    <div
      id={id}
      className="escora-brochure-root mx-auto w-full text-[#282421]"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0;
          }
          body, html, .pdf-preview-root, #sample-itinerary-print-wrapper {
            background: #FAF7F1 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .escora-brochure-root {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #FAF7F1 !important;
          }
          .brochure-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            background: #FAF7F1 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
            position: relative !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .brochure-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
        @media screen {
          .escora-brochure-root {
            background: transparent !important;
            padding: 16px 0;
          }
          .brochure-page {
            width: 210mm;
            max-width: 100%;
            height: 297mm;
            min-height: 297mm;
            max-height: 297mm;
            box-sizing: border-box;
            background: #FAF7F1;
            position: relative;
            overflow: hidden;
            margin: 0 auto 32px auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border-radius: 2px;
          }
          .brochure-page:last-child {
            margin-bottom: 0;
          }
        }
      `}</style>

      {/* Render planned pages */}
      {plannedPages.map((pagePlan, pIdx) => {
        const pageNum = pagePlan.pageNumber;
        const isLastPage = pageNum === totalPages;

        if (pagePlan.type === "cover") {
          return (
            <section
              key={`page-${pageNum}`}
              className="brochure-page flex flex-col justify-between"
            >
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Left Column (52%) */}
                <div className="w-[52%] pl-[18mm] pr-6 pt-[16mm] pb-4 flex flex-col justify-between">
                  <div>
                    <BrandLogo variant="dark" />

                    <div className="text-[8.5px] font-bold tracking-[0.24em] uppercase text-[#685D56] mt-4 leading-relaxed">
                      A JOURNEY THROUGH
                      <br />
                      KERALA&apos;S TIMELESS BEAUTY
                    </div>

                    <h1
                      className="font-serif text-[32px] leading-[1.08] font-bold text-[#39271F] tracking-tight mt-3.5"
                      style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                    >
                      {titleParts.line1}
                      {titleParts.line2 && (
                        <>
                          <br />
                          {titleParts.line2}
                        </>
                      )}
                    </h1>

                    <div className="text-[9px] font-serif italic text-[#685D56] mt-2.5 leading-snug line-clamp-2">
                      {summary || "A bespoke slow-luxury journey curated with private chauffeur transfers, handpicked accommodations, and immersive cultural heritage."}
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className="font-serif text-[13px] font-semibold text-[#A45132] whitespace-nowrap"
                        style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                      >
                        {formattedDuration}
                      </span>
                      <div className="w-16 h-px bg-[#BE8C70]" />
                    </div>

                    {/* Customer Greeting */}
                    <div className="mt-4">
                      <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#BE8C70] block">
                        PROPOSAL PREPARED EXCLUSIVELY FOR
                      </span>
                      <span className="text-[14px] font-bold tracking-[0.08em] uppercase text-[#39271F] block mt-0.5">
                        {customerName}
                      </span>
                    </div>

                    {/* Included Badges */}
                    {includedBadges.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#685D56] mb-2">
                          YOUR TRIP INCLUDES
                        </div>
                        <div className="flex items-center gap-3">
                          {includedBadges.map((badge) => {
                            const IconComponent = badge.icon;
                            return (
                              <div key={badge.key} className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-[#F0E6DA] flex items-center justify-center text-[#39271F]">
                                  <IconComponent className="w-3 h-3 text-[#A45132]" />
                                </div>
                                <span className="text-[7.5px] font-bold text-[#39271F] mt-1">
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2-Column Metadata Grid */}
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-3.5 border-t border-[#E4DDD3]">
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[7.5px] tracking-wider uppercase text-[#685D56] block font-semibold">
                          Emergency Contacts
                        </span>
                        <span className="text-[8px] font-bold text-[#282421] block leading-tight mt-0.5">
                          {emergencyContacts}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[7.5px] tracking-wider uppercase text-[#685D56] block font-semibold">
                          Reference No.
                        </span>
                        <span className="text-[8px] font-bold text-[#282421] block leading-tight mt-0.5 font-mono">
                          {referenceNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[7.5px] tracking-wider uppercase text-[#685D56] block font-semibold">
                          Curated By
                        </span>
                        <span className="text-[8px] font-bold text-[#282421] block leading-tight mt-0.5">
                          {curatorName}
                        </span>
                        {curatorPhone && (
                          <span className="text-[7.5px] text-[#685D56] block">({curatorPhone})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[7.5px] tracking-wider uppercase text-[#685D56] block font-semibold">
                          Created on
                        </span>
                        <span className="text-[8px] font-bold text-[#282421] block leading-tight mt-0.5 tabular-nums">
                          {createdDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Hero Photograph */}
                <div className="w-[48%] relative h-full">
                  <ImageWithFallback
                    src={coverImageUrl || alleppeyFallbackImg}
                    fallback={alleppeyFallbackImg}
                    alt={title || "Kerala Destination Cover"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Bottom Deep Espresso Panel */}
              <div className="bg-[#39271F] text-[#FAF7F1] px-[18mm] py-3.5 relative overflow-hidden shrink-0">
                <svg
                  className="absolute right-0 bottom-0 h-full w-[45%] opacity-20 pointer-events-none"
                  viewBox="0 0 300 200"
                  preserveAspectRatio="none"
                >
                  <path d="M 0,200 C 100,120 180,60 300,10 L 300,200 Z" fill="none" stroke="#BE8C70" strokeWidth="1.5" />
                  <path d="M 50,200 C 130,130 200,80 300,30 L 300,200 Z" fill="none" stroke="#BE8C70" strokeWidth="1.5" />
                  <path d="M 100,200 C 170,140 230,100 300,60 L 300,200 Z" fill="none" stroke="#BE8C70" strokeWidth="1.5" />
                </svg>

                <h2
                  className="font-serif text-[17px] font-bold text-[#FAF7F1] tracking-tight relative z-10"
                  style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                >
                  Trip Details &amp; Overview
                </h2>

                <div className="grid grid-cols-3 gap-y-2 gap-x-6 relative z-10 text-xs mt-2 mb-0.5">
                  <div className="col-span-1">
                    <span className="text-[7.5px] font-sans tracking-widest uppercase text-[#BE8C70] block font-semibold">
                      DESTINATION
                    </span>
                    <span className="text-[9.5px] text-[#FAF7F1] block mt-0.5 leading-snug font-medium truncate" title={destinationText}>
                      {destinationText}
                    </span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-sans tracking-widest uppercase text-[#BE8C70] block font-semibold">
                      START DATE
                    </span>
                    <span className="text-[9.5px] text-[#FAF7F1] block mt-0.5 font-bold font-sans tabular-nums">
                      {startDateText}
                    </span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-sans tracking-widest uppercase text-[#BE8C70] block font-semibold">
                      END DATE
                    </span>
                    <span className="text-[9.5px] text-[#FAF7F1] block mt-0.5 font-bold font-sans tabular-nums">
                      {endDateText}
                    </span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-sans tracking-widest uppercase text-[#BE8C70] block font-semibold">
                      NIGHTS | DAYS
                    </span>
                    <span className="text-[9.5px] text-[#FAF7F1] block mt-0.5 font-bold font-sans tabular-nums">
                      {formattedDuration}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[7.5px] font-sans tracking-widest uppercase text-[#BE8C70] block font-semibold">
                      TOTAL PASSENGER
                    </span>
                    <span className="text-[9.5px] text-[#FAF7F1] block mt-0.5 font-bold">
                      {adults} Adult{adults > 1 ? "s" : ""}
                      {children > 0 ? ` · ${children} Child${children > 1 ? "ren" : ""}` : ""}
                      {infants > 0 ? ` · ${infants} Infant${infants > 1 ? "s" : ""}` : ""}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[8.5px] font-mono text-[#BE8C70] relative z-10 pt-0.5">
                  {formatPageNum(pageNum, totalPages)}
                </div>
              </div>
            </section>
          );
        }

        // Standard Interior Page Container
        return (
          <section
            key={`page-${pageNum}`}
            className="brochure-page px-[18mm] pt-[14mm] pb-[12mm] flex flex-col justify-between"
          >
            <div className="w-full flex-1 flex flex-col">
              <PageHeader title={pagePlan.headerTitle} />

              {/* A. DAYS ONLY PAGE */}
              {pagePlan.type === "days" && (
                <div className="flex-1 flex flex-col">
                  {pagePlan.dayItems!.map((item, idx) => (
                    <ItineraryDayBlock
                      key={`day-${item.dayNumber}`}
                      dayNumber={item.dayNumber}
                      header={item.header}
                      title={item.day.subtitle || item.day.title}
                      description={item.day.description}
                      activities={item.day.activities}
                      optionalActivities={item.day.optionalActivities}
                      meals={item.day.meals}
                      stay={item.day.stay}
                      images={item.images}
                      isLastOnPage={idx === pagePlan.dayItems!.length - 1}
                    />
                  ))}
                  {Boolean(pagePlan.accentHeightPx && pagePlan.accentHeightPx > 0) && (
                    <DayPageAtmosphereAccent
                      accentIndex={pagePlan.accentIndex || 0}
                      heightPx={pagePlan.accentHeightPx}
                    />
                  )}
                </div>
              )}

              {/* B. DAYS + ALL SERVICES (1-Day Journey Dossier) */}
              {pagePlan.type === "days-and-all" && (
                <div className="space-y-2.5">
                  <ItineraryDayBlock
                    dayNumber={1}
                    header={pagePlan.dayItems![0].header}
                    title={pagePlan.dayItems![0].day.subtitle || pagePlan.dayItems![0].day.title}
                    description={pagePlan.dayItems![0].day.description}
                    activities={pagePlan.dayItems![0].day.activities}
                    optionalActivities={pagePlan.dayItems![0].day.optionalActivities}
                    meals={pagePlan.dayItems![0].day.meals}
                    stay={pagePlan.dayItems![0].day.stay}
                    images={pagePlan.dayItems![0].images}
                    isLastOnPage={true}
                  />

                  {stays.length > 0 && (
                    <AccommodationsSection
                      stays={stays}
                      destinationText={destinationText}
                    />
                  )}

                  <TransportationSection transportation={transportation} />

                  <InclusionsExclusionsSection
                    inclusions={inclusions}
                    exclusions={activeExclusions}
                  />

                  <InvestmentPricingSection
                    pricing={pricing}
                    currencySymbol={currencySymbol}
                    computedPricingTotal={computedPricingTotal}
                    discountAmount={discountAmount}
                    taxesAmount={taxesAmount}
                  />

                  <TermsAndGuidelinesSection
                    hotelTerms={hotelTerms}
                    paymentTerms={paymentTerms}
                    importantInfo={importantInfo}
                    compact={true}
                  />

                  <TrustSafeguardsBar />
                </div>
              )}

              {/* C. DAYS + SERVICES (Multi-Day Itinerary Flow) */}
              {pagePlan.type === "days-and-services" && (
                <div className="space-y-2.5">
                  {pagePlan.dayItems!.map((item, idx) => (
                    <ItineraryDayBlock
                      key={`day-${item.dayNumber}`}
                      dayNumber={item.dayNumber}
                      header={item.header}
                      title={item.day.subtitle || item.day.title}
                      description={item.day.description}
                      activities={item.day.activities}
                      optionalActivities={item.day.optionalActivities}
                      meals={item.day.meals}
                      stay={item.day.stay}
                      images={item.images}
                      isLastOnPage={idx === pagePlan.dayItems!.length - 1}
                    />
                  ))}

                  <AccommodationsSection
                    stays={stays}
                    destinationText={destinationText}
                  />

                  <TransportationSection transportation={transportation} />
                </div>
              )}

              {/* D. UNIFIED SERVICES & INVESTMENT (High-efficiency 3-Day Dossier) */}
              {pagePlan.type === "services-and-investment" && (
                <div className="flex-1 flex flex-col justify-between pt-1">
                  <AccommodationsSection
                    stays={stays}
                    destinationText={destinationText}
                  />

                  <TransportationSection transportation={transportation} />

                  <InclusionsExclusionsSection
                    inclusions={inclusions}
                    exclusions={activeExclusions}
                  />

                  <InvestmentPricingSection
                    pricing={pricing}
                    currencySymbol={currencySymbol}
                    computedPricingTotal={computedPricingTotal}
                    discountAmount={discountAmount}
                    taxesAmount={taxesAmount}
                  />

                  <TermsAndGuidelinesSection
                    hotelTerms={hotelTerms}
                    paymentTerms={paymentTerms}
                    importantInfo={importantInfo}
                    compact={stays.length >= 4}
                  />

                  <TrustSafeguardsBar />
                </div>
              )}

              {/* E. STANDALONE SERVICES PAGE */}
              {pagePlan.type === "services" && (
                <div className="space-y-3.5">
                  <AccommodationsSection
                    stays={stays}
                    destinationText={destinationText}
                  />

                  <TransportationSection transportation={transportation} />

                  {pagePlan.showPanorama && (
                    <div className="relative w-full h-[185px] rounded overflow-hidden mt-3 shrink-0 border border-[#E4DDD3]/60 shadow-xs">
                      <ImageWithFallback
                        src={coverImageUrl || kumarakomFallbackImg}
                        fallback={kumarakomFallbackImg}
                        alt="Kerala Backwaters Destination View"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent flex items-end p-3.5">
                        <span className="text-[9.5px] font-serif italic text-white/95 tracking-wide">
                          Curated slow luxury across God&apos;s Own Country — handcrafted with excellence by Escora Holidays
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* F. STANDALONE INVESTMENT PAGE */}
              {pagePlan.type === "investment" && (
                <div className={`flex-1 flex flex-col ${pagePlan.includeInclusionsExclusions ? "space-y-2.5" : "space-y-4"}`}>
                  {pagePlan.includeInclusionsExclusions && (
                    <InclusionsExclusionsSection
                      inclusions={inclusions}
                      exclusions={activeExclusions}
                    />
                  )}

                  <InvestmentPricingSection
                    pricing={pricing}
                    currencySymbol={currencySymbol}
                    computedPricingTotal={computedPricingTotal}
                    discountAmount={discountAmount}
                    taxesAmount={taxesAmount}
                    compact={Boolean(pagePlan.includeInclusionsExclusions)}
                  />

                  <TermsAndGuidelinesSection
                    hotelTerms={hotelTerms}
                    paymentTerms={paymentTerms}
                    importantInfo={importantInfo}
                    compact={Boolean(pagePlan.includeInclusionsExclusions)}
                  />

                  <TrustSafeguardsBar />
                </div>
              )}
            </div>

            {/* Bottom Footer */}
            {isLastPage ? (
              <ClosingAgencyFooter
                agencyPhone={agencyPhone}
                agencyEmail={agencyEmail}
                agencyWebsite={agencyWebsite}
                pageNum={pageNum}
                totalPages={totalPages}
              />
            ) : (
              <PageFooterIndicator
                pageNum={pageNum}
                totalPages={totalPages}
                referenceNumber={referenceNumber}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
