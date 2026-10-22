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
  Clock,
  MapPin,
  ShieldCheck,
  Award,
  Sparkles,
  Star,
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
  // Reference PDF fields
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
  // If there's an en-dash or em-dash or hyphen separator, split by separator
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

/**
 * Robust image component with fallback: never breaks the PDF layout
 */
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

/**
 * Escora Brand Logo: authentic wordmark with flying bird accent
 */
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

/**
 * Editorial section heading: Large serif title with terracotta divider line
 */
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

/**
 * Standard Page Header for interior pages
 */
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

/**
 * Page Footer with reference number on left and page indicator on right
 */
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
    <div className="w-full pt-1.5 border-t border-[#E4DDD3]/70 flex items-center justify-between text-[8.5px] text-[#685D56] shrink-0">
      <span className="font-mono tracking-wide">
        {referenceNumber ? `REF: ${referenceNumber}` : "ESCORA LUXURY TRAVEL DOSSIER"}
      </span>
      <span className="font-mono tabular-nums">
        {formatPageNum(pageNum, totalPages)}
      </span>
    </div>
  );
}

/**
 * Reusable two-column itinerary day item
 */
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
    <div className="flex gap-4 relative w-full mb-2.5 last:mb-0">
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
          <div className="text-[8.75px] leading-[1.48] text-[#282421] space-y-1 mb-1.5 whitespace-pre-line">
            {description}
          </div>
        )}

        {/* Scheduled Activities with timestamps */}
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

        {/* Optional activities */}
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

        {/* Meals note */}
        {meals && (
          <div className="text-[8.25px] italic text-[#685D56] mb-1 leading-relaxed">
            {meals}
          </div>
        )}

        {/* Stay row */}
        {stay && (
          <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
            <Bed className="w-3.5 h-3.5 text-[#A45132] shrink-0" />
            <span>{stay.startsWith("Stay:") ? stay : `Stay: ${stay}`}</span>
          </div>
        )}

        {/* Verified Day Images */}
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

/**
 * Editorial Landscape Accent: Fills residual space on Day pages with slow-luxury Kerala atmosphere
 */
function DayPageAtmosphereAccent({
  accentIndex = 0,
}: {
  accentIndex?: number;
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
    <div className="relative w-full h-[110px] rounded overflow-hidden mt-2 shrink-0 border border-[#E4DDD3]/60 shadow-xs">
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

/**
 * Accommodations & Stay Breakdown Section
 */
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

                <div className="flex items-center gap-5 text-[8px] text-[#4E463C] mt-1 pt-0.5">
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

/**
 * Transportation Section
 */
function TransportationSection({
  transportation,
}: {
  transportation: ItineraryTransportation;
}) {
  return (
    <div className="shrink-0">
      <EditorialHeading title="Transportation &amp; Transfers" />
      <div className="bg-[#FAF7F1] border border-[#E4DDD3] rounded p-2.5 flex items-center justify-between gap-4 mt-1.5">
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

/**
 * Inclusions & Exclusions Section
 */
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

interface DayPageItem {
  day: ItineraryDay;
  dayNumber: number;
  header: { weekday: string; dateText: string };
  images: string[];
}

interface DayPageGroup {
  items: DayPageItem[];
}

/**
 * Intelligently partitions itinerary days across pages:
 * - Fits 3 days per page as standard editorial density (or 2 if heavily detailed/imaged)
 * - Balances days evenly so pages don't have awkward single-item overflows
 * - Eliminates excessive empty space while preventing page-break collisions
 */
function partitionDaysIntoPages(
  days: ItineraryDay[],
  parsedStartDate: Date | null
): DayPageGroup[] {
  const total = days.length;
  if (total === 0) return [];

  const items: DayPageItem[] = days.map((day, idx) => {
    const dayNumber = idx + 1;
    const header = formatDayWeekdayDate(dayNumber, day.date, parsedStartDate);
    const images =
      day.imageUrls && day.imageUrls.length > 0
        ? day.imageUrls
        : day.imageUrl
        ? [day.imageUrl]
        : [];
    return { day, dayNumber, header, images };
  });

  let targetPagesCount = 1;
  if (total <= 3) {
    targetPagesCount = 1;
  } else if (total === 4) {
    targetPagesCount = 2;
  } else if (total <= 6) {
    targetPagesCount = 2;
  } else if (total <= 9) {
    targetPagesCount = 3;
  } else if (total <= 12) {
    targetPagesCount = 4;
  } else {
    targetPagesCount = Math.ceil(total / 3);
  }

  const baseSize = Math.floor(total / targetPagesCount);
  const remainder = total % targetPagesCount;

  const pageSizes: number[] = [];
  for (let p = 0; p < targetPagesCount; p++) {
    pageSizes.push(baseSize + (p < remainder ? 1 : 0));
  }

  let itemIdx = 0;
  const pages: DayPageGroup[] = [];

  for (const size of pageSizes) {
    const pageItems = items.slice(itemIdx, itemIdx + size);
    pages.push({ items: pageItems });
    itemIdx += size;
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
    nightsCount,
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

  // Balanced pagination calculation
  const isSingleDay = daysCount === 1;
  const dayPages = partitionDaysIntoPages(days, parsedStartDate);

  const totalPages = isSingleDay
    ? 3
    : 1 + dayPages.length + 1 + 1;

  let currentPageNum = 1;

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

      {/* ==================================================================== */}
      {/* PAGE 1: Split Cover & Dark Espresso Trip Details Panel               */}
      {/* ==================================================================== */}
      <section className="brochure-page flex flex-col justify-between">
        {/* Top Split: Information Column (Left) + Tall Photograph (Right) */}
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

              {/* Editorial Summary or Brand Lead-in */}
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

              {/* YOUR TRIP INCLUDES */}
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

            {/* 2-Column Info Grid */}
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

          {/* Right Column (48%): Hero Photograph */}
          <div className="w-[48%] relative h-full">
            <ImageWithFallback
              src={coverImageUrl || alleppeyFallbackImg}
              fallback={alleppeyFallbackImg}
              alt={title || "Kerala Destination Cover"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Full-width Deep Espresso Trip Details Panel */}
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
            {formatPageNum(currentPageNum++, totalPages)}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* ITINERARY DAY PAGES (Dynamically balanced, zero empty voids)         */}
      {/* ==================================================================== */}
      {isSingleDay ? (
        /* 1-DAY ITINERARY: Day 1 + Logistics + Scenic Accent on Page 2 */
        (() => {
          const firstDay = days[0];
          const firstHeader = formatDayWeekdayDate(1, firstDay?.date, parsedStartDate);
          const firstImages =
            firstDay?.imageUrls && firstDay.imageUrls.length > 0
              ? firstDay.imageUrls
              : firstDay?.imageUrl
              ? [firstDay.imageUrl]
              : [];
          const thisPageNum = currentPageNum++;

          return (
            <section className="brochure-page px-[18mm] pt-[15mm] pb-[12mm] flex flex-col justify-between">
              <div>
                <PageHeader title="Day-To-Day Plan &amp; Services" />

                <ItineraryDayBlock
                  dayNumber={1}
                  header={firstHeader}
                  title={firstDay?.subtitle || firstDay?.title}
                  description={firstDay?.description}
                  activities={firstDay?.activities}
                  optionalActivities={firstDay?.optionalActivities}
                  meals={firstDay?.meals}
                  stay={firstDay?.stay}
                  images={firstImages}
                  isLastOnPage={true}
                />

                <div className="mt-3 pt-2.5 border-t border-[#E4DDD3] space-y-2.5">
                  <TransportationSection transportation={transportation} />
                  <InclusionsExclusionsSection
                    inclusions={inclusions}
                    exclusions={activeExclusions}
                  />
                  <DayPageAtmosphereAccent accentIndex={0} />
                </div>
              </div>

              <PageFooterIndicator
                pageNum={thisPageNum}
                totalPages={totalPages}
                referenceNumber={referenceNumber}
              />
            </section>
          );
        })()
      ) : (
        /* STANDARD MULTI-DAY PAGES */
        dayPages.map((pageGroup, pageIdx) => {
          const thisPageNum = currentPageNum++;
          // If days on this page have concise text/fewer images, include scenic accent to balance vertical space
          const totalDaysOnPage = pageGroup.items.length;
          const hasManyImages = pageGroup.items.some((i) => i.images.length > 0);
          const needsBalancing = totalDaysOnPage <= 2 || (!hasManyImages && totalDaysOnPage === 3);

          return (
            <section
              key={`day-page-${pageIdx}`}
              className="brochure-page px-[18mm] pt-[15mm] pb-[12mm] flex flex-col justify-between"
            >
              <div>
                <PageHeader title="Day-To-Day Plan" />

                {pageGroup.items.map((item, itemIdx) => {
                  const isLast = itemIdx === pageGroup.items.length - 1;
                  return (
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
                      isLastOnPage={isLast}
                    />
                  );
                })}

                {/* Intelligent space balancer: anchors page and eliminates dead bottom space */}
                {needsBalancing && (
                  <DayPageAtmosphereAccent accentIndex={pageIdx} />
                )}
              </div>

              <PageFooterIndicator
                pageNum={thisPageNum}
                totalPages={totalPages}
                referenceNumber={referenceNumber}
              />
            </section>
          );
        })
      )}

      {/* ==================================================================== */}
      {/* INCLUDED SERVICES & ACCOMMODATIONS PAGE                              */}
      {/* ==================================================================== */}
      {!isSingleDay &&
        (() => {
          const thisPageNum = currentPageNum++;
          return (
            <section className="brochure-page px-[18mm] pt-[15mm] pb-[12mm] flex flex-col justify-between">
              <div className="space-y-3">
                <PageHeader title="Included Services &amp; Accommodations" />

                <AccommodationsSection
                  stays={stays}
                  destinationText={destinationText}
                />

                <TransportationSection transportation={transportation} />

                <InclusionsExclusionsSection
                  inclusions={inclusions}
                  exclusions={activeExclusions}
                />

                {/* Editorial Destination Panorama */}
                <div className="relative w-full h-[145px] rounded overflow-hidden mt-2 shrink-0 border border-[#E4DDD3]/60 shadow-xs">
                  <ImageWithFallback
                    src={coverImageUrl || kumarakomFallbackImg}
                    fallback={kumarakomFallbackImg}
                    alt="Kerala Backwaters Destination View"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent flex items-end p-3">
                    <span className="text-[9px] font-serif italic text-white/95 tracking-wide">
                      Curated slow luxury across God&apos;s Own Country — handcrafted with excellence by Escora Holidays
                    </span>
                  </div>
                </div>
              </div>

              <PageFooterIndicator
                pageNum={thisPageNum}
                totalPages={totalPages}
                referenceNumber={referenceNumber}
              />
            </section>
          );
        })()}

      {/* ==================================================================== */}
      {/* FINAL PAGE: Budget & Pricing, Terms, Trust Guarantees & Closing Bar */}
      {/* ==================================================================== */}
      {(() => {
        const thisPageNum = currentPageNum++;
        const hasLineItems = pricing?.items && pricing.items.length > 0;

        return (
          <section className="brochure-page px-[18mm] pt-[15mm] pb-[12mm] flex flex-col justify-between">
            <div className="space-y-2.5">
              <PageHeader title="Investment, Terms &amp; Policies" />

              {/* Itemized Pricing Breakdown Table (if line items present) */}
              {hasLineItems && (
                <div className="bg-[#FAF7F1] border border-[#E4DDD3] rounded-t p-2.5 text-[8px] space-y-1">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#685D56] block mb-1">
                    Itemized Investment Breakdown
                  </span>
                  {pricing.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[#39271F] py-0.5 border-b border-[#E4DDD3]/50 last:border-b-0"
                    >
                      <span className="text-[#685D56]">{item.label}</span>
                      <span className="font-sans font-bold tabular-nums">
                        {currencySymbol}
                        {Number(item.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[#183D2E] py-0.5 pt-1 border-t border-[#E4DDD3]">
                      <span className="font-medium">Special Applied Privilege / Discount</span>
                      <span className="font-bold tabular-nums">- {currencySymbol}{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {taxesAmount > 0 && (
                    <div className="flex items-center justify-between text-[#685D56] py-0.5">
                      <span className="font-medium">Applicable Taxes &amp; GST</span>
                      <span className="font-bold tabular-nums">+ {currencySymbol}{taxesAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Package Investment Banner */}
              <div
                className={`bg-[#A45132] text-[#FAF7F1] px-4 py-2.5 ${
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

              {/* Terms & Conditions (2 Columns) */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {/* Hotel Terms */}
                <div className="bg-[#F0E6DA] rounded p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
                      <Bed className="w-3.5 h-3.5 text-[#A45132]" />
                      <span>Hotel Terms &amp; Policies</span>
                    </div>
                    <ul className="text-[7.75px] leading-[1.38] text-[#4E463C] space-y-1 list-disc list-inside">
                      {hotelTerms.slice(0, 4).map((term, idx) => (
                        <li key={idx}>{term}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="bg-[#F0E6DA] rounded p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
                      <FileText className="w-3.5 h-3.5 text-[#A45132]" />
                      <span>Payment &amp; Booking Terms</span>
                    </div>
                    <ul className="text-[7.75px] leading-[1.38] text-[#4E463C] space-y-1 list-disc list-inside">
                      {paymentTerms.slice(0, 4).map((term, idx) => (
                        <li key={idx}>{term}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Important Travel Guidelines */}
              <div className="bg-[#F0E6DA] rounded p-2.5">
                <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-[#39271F] mb-1">
                  <Info className="w-3.5 h-3.5 text-[#A45132]" />
                  <span>Important Travel Guidelines &amp; Protocol</span>
                </div>
                <ul className="text-[7.75px] leading-[1.38] text-[#4E463C] space-y-0.5 list-disc list-inside">
                  {importantInfo.slice(0, 4).map((info, idx) => (
                    <li key={idx}>{info}</li>
                  ))}
                </ul>
              </div>

              {/* Escora Trust, Google Review & Concierge Safeguards Bar */}
              <div className="bg-[#FAF7F1] border border-[#E4DDD3] rounded p-2 flex items-center justify-between gap-4">
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
            </div>

            {/* Closing Deep Espresso Agency Footer */}
            <div className="w-full mt-2.5 shrink-0">
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
                    {formatPageNum(thisPageNum, totalPages)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
