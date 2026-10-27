import React, { useState, useEffect } from "react";
import {
  Bed,
  Car,
  Camera,
  FileText,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  MapPin,
  Check,
  X,
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
  DEFAULT_TRIP_INCLUDES,
  parseTripIncludes,
} from "@/lib/itinerary";

import alleppeyFallbackImg from "@assets/escora/destinations/alleppey.jpg";
import kumarakomFallbackImg from "@assets/escora/destinations/kumarakom.jpg";
import munnarFallbackImg from "@assets/escora/destinations/munnar.jpg";
import fortKochiFallbackImg from "@assets/escora/destinations/fort-kochi.jpg";
import padmanabhaswamyFallbackImg from "@assets/escora/destinations/padmanabhaswamy-temple.jpg";
import escoraOfficialLogo from "@assets/escora/escora-official-logo.png";
import escoraWhiteLogo from "@assets/escora/escora-logo-white.png";
import escoraFooterPlane from "@assets/escora/escora-footer-plane.png";

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
  weAlsoProvide?: string[] | null;
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
  const [useCors, setUseCors] = useState(true);

  useEffect(() => {
    // If the provided src is an Unsplash webpage link (not an image), use fallback directly
    if (src && /unsplash\.com\/photos\//i.test(src)) {
      if (fallback) {
        setCurrentSrc(fallback);
        setHasError(false);
      } else {
        setHasError(true);
      }
      return;
    }
    setCurrentSrc(src || fallback || "");
    setHasError(false);
    setUseCors(true);
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
      crossOrigin={useCors ? "anonymous" : undefined}
      onError={() => {
        // If image failed with CORS crossOrigin="anonymous", retry once without CORS
        if (useCors) {
          setUseCors(false);
          return;
        }
        if (fallback && currentSrc !== fallback) {
          setCurrentSrc(fallback);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

export function BrandLogo({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "white";
  className?: string;
}) {
  const isWhite = variant === "white";
  const logoSrc = isWhite ? escoraWhiteLogo : escoraOfficialLogo;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Escora Holidays"
        className="h-12 sm:h-14 w-auto object-contain"
        loading="eager"
        crossOrigin="anonymous"
      />
    </div>
  );
}

function renderRichDescription(htmlOrText?: string | null) {
  if (!htmlOrText) return null;
  const raw = String(htmlOrText).trim();
  if (!raw) return null;

  // Check if content contains HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(raw);

  if (hasHtml) {
    return (
      <div
        className="rich-text-content text-[13px] sm:text-[13.5px] leading-[1.7] text-[#28322B] mb-3"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    );
  }

  // Fallback for plain text: preserve line breaks
  return (
    <div
      className="rich-text-content text-[13px] sm:text-[13.5px] leading-[1.7] text-[#28322B] space-y-2 whitespace-pre-line mb-3"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {raw}
    </div>
  );
}

function SectionBanner({ title }: { title: string }) {
  return (
    <div
      className="w-full text-white text-center font-bold text-[15px] sm:text-[16px]"
      style={{
        backgroundColor: "#162B48",
        color: "#ffffff",
        textAlign: "center",
        paddingTop: "11px",
        paddingBottom: "11px",
        paddingLeft: "16px",
        paddingRight: "16px",
        lineHeight: "1.4",
        boxSizing: "border-box",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.04em",
        display: "block",
        width: "100%",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      {title}
    </div>
  );
}

export function planItineraryPages(
  days: ItineraryDay[],
  stays: ItineraryStay[],
  inclusions: string[],
  exclusions: string[],
  pricing: ItineraryPricing,
  parsedStartDate: Date | null
) {
  // Compatibility export
  return [
    { pageNumber: 1, type: "continuous", headerTitle: "Complete Itinerary" },
  ];
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
    (shareToken ? `L100021/${shareToken.slice(0, 6).toUpperCase()}` : "L100021/Q1020");
  const createdDate = formatDDMMYYYY(
    data.createdDate || startDate || "2026-10-01"
  );

  const destinationText =
    destination ||
    (stays[0]?.location ? `${stays[0].location}, Kerala` : "Trivandrum, Keralam, India | Kovalam, Keralam, India");

  const transportation: ItineraryTransportation = data.transportation || {
    origin: `ESCORA HOLIDAYS | ${destinationText.split("|")[0]?.trim() || "Trivandrum, Keralam, India"}`,
    destination: "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
    vehicleType: "Private Dedicated Chauffeur Driven AC Sedan / SUV",
  };

  const activeExclusions =
    exclusions && exclusions.length > 0 ? exclusions : DEFAULT_EXCLUSIONS;
  const activeInclusions = inclusions || [];
  const hotelTerms =
    data.hotelTerms && data.hotelTerms.length > 0 ? data.hotelTerms : DEFAULT_HOTEL_TERMS;
  const paymentTerms =
    data.paymentTerms && data.paymentTerms.length > 0 ? data.paymentTerms : DEFAULT_PAYMENT_TERMS;
  const importantInfo =
    data.importantInfo && data.importantInfo.length > 0 ? data.importantInfo : DEFAULT_IMPORTANT_INFO;

  const agencyPhone = data.agencyPhone || "9496933336";
  const agencyEmail = data.agencyEmail || "mc@escoraholidays.com";
  const agencyInstagram = data.agencyInstagram || "escora_holidays";
  const agencyWebsite = data.agencyWebsite || "http://www.escoraholidays.com";

  // Inclusions 4 boxes
  const parsedTripIncludes =
    typeof data.tripIncludes === "string"
      ? parseTripIncludes(data.tripIncludes)
      : data.tripIncludes ?? DEFAULT_TRIP_INCLUDES;

  const incConfig = parsedTripIncludes ?? {
    hotel: true,
    transport: true,
    sightseeing: true,
    transfer: true,
  };

  const rawWeAlso =
    Array.isArray(data.weAlsoProvide) && data.weAlsoProvide.length > 0
      ? data.weAlsoProvide
      : Array.isArray(parsedTripIncludes?.weAlsoProvide)
      ? parsedTripIncludes.weAlsoProvide
      : [];

  const weAlsoProvide = rawWeAlso.map((s) => String(s || "").trim()).filter(Boolean);

  // Pricing calculations
  const subtotal =
    pricing?.items && pricing.items.length > 0
      ? pricing.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : Number(pricing?.total) || 0;

  const hasTaxes = Boolean(
    pricing?.showTaxes ||
    (typeof pricing?.taxes === "number" && pricing.taxes > 0)
  );

  const taxAmount = Number(pricing?.taxes) || 0;
  const isTaxInclusive = Boolean(pricing?.taxInclusive);

  const computedPricingTotal =
    Number(pricing?.total) > 0
      ? Number(pricing.total)
      : hasTaxes && !isTaxInclusive
      ? subtotal + taxAmount
      : subtotal;

  const currencySymbol = currency === "INR" ? "₹" : `${currency} `;

  // Clean title for display (e.g. Explora Trivandrum)
  const displayTitle = title?.replace(/\s*[—–-]\s*\d+\s*(?:Days|Nights).*$/i, "") || "Explora Trivandrum";

  return (
    <div
      id={id}
      className="escora-brochure-root mx-auto text-[#1C2620] bg-white transition-all"
      style={{
        maxWidth: "794px",
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap");

        .escora-brochure-root,
        .escora-brochure-root * {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 12mm 10mm;
          }
          body, html, .pdf-preview-root, #sample-itinerary-print-wrapper {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #sample-itinerary-print-wrapper,
          .pdf-preview-canvas {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          .escora-brochure-root {
            display: block !important;
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .pdf-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            display: block !important;
            position: relative !important;
          }
          .pdf-day-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            display: block !important;
            position: relative !important;
          }
          .pdf-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            display: block !important;
            position: relative !important;
          }
          .pdf-stay-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            display: block !important;
            position: relative !important;
          }
          li {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .escora-brochure-root {
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            overflow: hidden;
            padding: 24px 28px 32px 28px;
            margin: 0 auto;
          }
        }
        /* Rich Text Formatting Styles for Preview & PDF Export */
        .rich-text-content {
          color: #28322B;
          word-break: break-word;
        }
        .rich-text-content h1 {
          font-size: 22px !important;
          font-weight: 800 !important;
          color: #1A3326 !important;
          margin: 12px 0 6px 0 !important;
          line-height: 1.25 !important;
        }
        .rich-text-content h2 {
          font-size: 18px !important;
          font-weight: 700 !important;
          color: #1A3326 !important;
          margin: 10px 0 5px 0 !important;
          line-height: 1.3 !important;
        }
        .rich-text-content h3 {
          font-size: 15px !important;
          font-weight: 700 !important;
          color: #1A3326 !important;
          margin: 8px 0 4px 0 !important;
          line-height: 1.35 !important;
        }
        .rich-text-content h4 {
          font-size: 13.5px !important;
          font-weight: 600 !important;
          color: #1A3326 !important;
          margin: 6px 0 3px 0 !important;
          line-height: 1.4 !important;
        }
        .rich-text-content p {
          margin: 0 0 8px 0;
          line-height: 1.7;
        }
        .rich-text-content p:last-child {
          margin-bottom: 0;
        }
        .rich-text-content b,
        .rich-text-content strong {
          font-weight: 700;
          color: #1A3326;
        }
        .rich-text-content i,
        .rich-text-content em {
          font-style: italic;
        }
        .rich-text-content u {
          text-decoration: underline;
        }
        .rich-text-content s,
        .rich-text-content strike {
          text-decoration: line-through;
        }
        .rich-text-content sup {
          vertical-align: super;
          font-size: 0.75em;
          line-height: 0;
        }
        .rich-text-content sub {
          vertical-align: sub;
          font-size: 0.75em;
          line-height: 0;
        }
        .rich-text-content ul {
          list-style-type: disc !important;
          margin: 6px 0 10px 22px !important;
          padding-left: 0 !important;
        }
        .rich-text-content ol {
          list-style-type: decimal !important;
          margin: 6px 0 10px 22px !important;
          padding-left: 0 !important;
        }
        .rich-text-content li {
          margin-bottom: 3px;
          line-height: 1.6;
        }
        .rich-text-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 10px 0 !important;
          border: 1px solid #D1D5DB !important;
          font-size: 12.5px !important;
        }
        .rich-text-content th {
          border: 1px solid #D1D5DB !important;
          padding: 6px 10px !important;
          font-weight: 700 !important;
          background-color: #F3F4F6 !important;
          color: #1A3326 !important;
          text-align: left !important;
        }
        .rich-text-content td {
          border: 1px solid #D1D5DB !important;
          padding: 6px 10px !important;
          color: #28322B !important;
        }
        .rich-text-content blockquote {
          border-left: 3.5px solid #1A3326 !important;
          padding: 6px 14px !important;
          margin: 10px 0 !important;
          background-color: #F8FAF8 !important;
          color: #3C4A42 !important;
          font-style: italic !important;
          border-radius: 0 4px 4px 0 !important;
        }
        .rich-text-content hr {
          border: none !important;
          border-top: 1px solid #D6DDD6 !important;
          margin: 14px 0 !important;
        }
        .rich-text-content a {
          color: #1A3326 !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }
      `}</style>

      {/* =========================================================================
          1. HEADER & BRAND LOGO
      ========================================================================= */}
      <header className="pdf-section flex justify-center pt-2 pb-5">
        <BrandLogo variant="dark" />
      </header>

      {/* =========================================================================
          2. LARGE FULL-WIDTH HERO IMAGE
      ========================================================================= */}
      <div className="pdf-section w-full rounded-xl overflow-hidden shadow-xs border border-neutral-200/60 bg-neutral-100">
        <ImageWithFallback
          src={coverImageUrl || padmanabhaswamyFallbackImg}
          fallback={padmanabhaswamyFallbackImg}
          alt={displayTitle}
          className="w-full h-[320px] sm:h-[390px] object-cover"
        />
      </div>

      {/* =========================================================================
          3. TITLE & OVERVIEW CARD
      ========================================================================= */}
      <div className="pdf-section mt-3.5 bg-[#F9FAF9] border border-[#E5E7EB] rounded-xl p-5 sm:p-6 text-center">
        {/* Main Title */}
        <h1
          className="text-[28px] sm:text-[32px] font-extrabold text-[#1A3326] tracking-tight leading-[1.2]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
        >
          {displayTitle}
        </h1>

        {/* Duration */}
        <div
          className="text-[13.5px] sm:text-[14.5px] font-semibold text-[#9E7B35] mt-1.5 tracking-wide"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {formattedDuration}
        </div>

        {/* Guest Name */}
        <div
          className="text-[17px] sm:text-[19px] font-bold text-[#1A3326] tracking-[0.05em] uppercase mt-2.5"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
        >
          {customerName}
        </div>

        {/* Trip Includes Heading */}
        <div
          className="text-[12px] font-bold text-[#2A4033] uppercase tracking-[0.08em] mt-4 mb-2.5"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Your Trip Includes
        </div>

        {/* 4 Icon Boxes in a Row */}
        <div
          style={{
            display: "table",
            width: "100%",
            maxWidth: "520px",
            margin: "0 auto",
            borderSpacing: "8px 0",
            borderCollapse: "separate",
          }}
        >
          <div style={{ display: "table-row" }}>
            {/* Hotel */}
            <div
              style={{
                display: "table-cell",
                width: "25%",
                verticalAlign: "top",
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "10px 4px 8px 4px",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  border: "1px solid #9CA3AF",
                  backgroundColor: "#EBF5EE",
                  margin: "0 auto 5px auto",
                  boxSizing: "border-box",
                }}
              >
                {incConfig.hotel && (
                  <Check
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "1px",
                      width: "12px",
                      height: "12px",
                      color: "#1A3326",
                      strokeWidth: 3,
                      display: "block",
                    }}
                  />
                )}
              </div>
              <Bed
                style={{
                  display: "block",
                  margin: "0 auto 4px auto",
                  width: "24px",
                  height: "24px",
                  color: "#1A3326",
                }}
              />
              <span className="text-[11.5px] font-medium text-[#1A3326] block leading-tight">Hotel</span>
            </div>

            {/* Transport */}
            <div
              style={{
                display: "table-cell",
                width: "25%",
                verticalAlign: "top",
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "10px 4px 8px 4px",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  border: "1px solid #9CA3AF",
                  backgroundColor: "#EBF5EE",
                  margin: "0 auto 5px auto",
                  boxSizing: "border-box",
                }}
              >
                {incConfig.transport && (
                  <Check
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "1px",
                      width: "12px",
                      height: "12px",
                      color: "#1A3326",
                      strokeWidth: 3,
                      display: "block",
                    }}
                  />
                )}
              </div>
              <Car
                style={{
                  display: "block",
                  margin: "0 auto 4px auto",
                  width: "24px",
                  height: "24px",
                  color: "#1A3326",
                }}
              />
              <span className="text-[11.5px] font-medium text-[#1A3326] block leading-tight">Transport</span>
            </div>

            {/* Sight-Seeing */}
            <div
              style={{
                display: "table-cell",
                width: "25%",
                verticalAlign: "top",
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "10px 4px 8px 4px",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  border: "1px solid #9CA3AF",
                  backgroundColor: "#EBF5EE",
                  margin: "0 auto 5px auto",
                  boxSizing: "border-box",
                }}
              >
                {incConfig.sightseeing && (
                  <Check
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "1px",
                      width: "12px",
                      height: "12px",
                      color: "#1A3326",
                      strokeWidth: 3,
                      display: "block",
                    }}
                  />
                )}
              </div>
              <Camera
                style={{
                  display: "block",
                  margin: "0 auto 4px auto",
                  width: "24px",
                  height: "24px",
                  color: "#1A3326",
                }}
              />
              <span className="text-[11.5px] font-medium text-[#1A3326] block leading-tight whitespace-nowrap">Sight-Seeing</span>
            </div>

            {/* Transfer */}
            <div
              style={{
                display: "table-cell",
                width: "25%",
                verticalAlign: "top",
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "10px 4px 8px 4px",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  border: "1px solid #9CA3AF",
                  backgroundColor: "#EBF5EE",
                  margin: "0 auto 5px auto",
                  boxSizing: "border-box",
                }}
              >
                {incConfig.transfer && (
                  <Check
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "1px",
                      width: "12px",
                      height: "12px",
                      color: "#1A3326",
                      strokeWidth: 3,
                      display: "block",
                    }}
                  />
                )}
              </div>
              <FileText
                style={{
                  display: "block",
                  margin: "0 auto 4px auto",
                  width: "24px",
                  height: "24px",
                  color: "#1A3326",
                }}
              />
              <span className="text-[11.5px] font-medium text-[#1A3326] block leading-tight">VISA</span>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mt-4 text-[13.5px] sm:text-[14px] font-bold text-[#1A3326] tracking-wide">
          Emergency Contacts {emergencyContacts}
        </div>

        {/* Divider Line */}
        <div className="w-full h-px bg-[#E5E7EB] my-3" />

        {/* 2-Column Curator & Reference Information */}
        <div style={{ display: "table", width: "100%" }} className="px-1">
          <div style={{ display: "table-row" }}>
            <div style={{ display: "table-cell", verticalAlign: "middle", textAlign: "left" }}>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Itinerary Curated By
              </div>
              <div className="text-[12.5px] sm:text-[13px] font-bold text-[#1A3326] mt-0.5">
                {curatorName} ( {curatorPhone} )
              </div>
            </div>
            <div style={{ display: "table-cell", verticalAlign: "middle", textAlign: "right" }}>
              <div className="text-[12px] font-bold text-[#1A3326]">
                Reference No. {referenceNumber}
              </div>
              <div className="text-[11px] font-medium text-neutral-500 mt-0.5">
                Created on. {createdDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. TRIP DETAILS SECTION
      ========================================================================= */}
      <section className="pdf-avoid-break mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
        <SectionBanner title="Trip Details" />
        <div className="bg-[#F9FAF9] text-[#1B221A] p-4 sm:p-5 border border-[#E5E7EB] border-t-0">
          {/* Row 1: Destination */}
          <div className="mb-3.5">
            <div className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#55685C]">
              DESTINATION
            </div>
            <div
              className="text-[15px] sm:text-[16px] font-bold text-[#111827] mt-0.5 leading-snug"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
            >
              {destinationText}
            </div>
          </div>

          {/* Row 2: 4 Columns Table with weighted spacing for Total Passengers */}
          <div
            style={{ display: "table", width: "100%", tableLayout: "fixed", boxSizing: "border-box" }}
            className="pt-2.5 border-t border-[#E5E7EB]"
          >
            <div style={{ display: "table-row" }}>
              <div style={{ display: "table-cell", width: "22%", verticalAlign: "top", boxSizing: "border-box", paddingRight: "8px" }}>
                <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#55685C" }}>
                  START DATE
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#111827", marginTop: "2px", whiteSpace: "nowrap" }}>
                  {startDateText}
                </div>
              </div>

              <div style={{ display: "table-cell", width: "22%", verticalAlign: "top", boxSizing: "border-box", paddingRight: "8px" }}>
                <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#55685C" }}>
                  END DATE
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#111827", marginTop: "2px", whiteSpace: "nowrap" }}>
                  {endDateText}
                </div>
              </div>

              <div style={{ display: "table-cell", width: "18%", verticalAlign: "top", boxSizing: "border-box", paddingRight: "8px" }}>
                <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#55685C" }}>
                  NIGHTS | DAYS
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#9E7B35", marginTop: "2px", whiteSpace: "nowrap" }}>
                  {formattedDuration}
                </div>
              </div>

              <div style={{ display: "table-cell", width: "38%", verticalAlign: "top", boxSizing: "border-box" }}>
                <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#55685C" }}>
                  TOTAL PASSENGER
                </div>
                <div className="text-[11.5px] sm:text-[12.5px] font-bold text-[#111827] mt-0.5 leading-snug">
                  <span className="whitespace-nowrap">{adults} Adults</span>
                  <span className="text-[#9CA3AF] mx-1">|</span>
                  <span className="whitespace-nowrap">{children} Children</span>
                  <span className="text-[#9CA3AF] mx-1">|</span>
                  <span className="whitespace-nowrap">{infants} Infants</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. DAY-TO-DAY PLAN SECTION
      ========================================================================= */}
      <section className="pdf-days-container mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="pdf-avoid-break">
          <SectionBanner title="Day-To-Day Plan" />
        </div>
        <div className="p-4 sm:p-5 space-y-6">
          {days && days.length > 0 ? (
            days.map((day, idx) => {
              const dayNum = day.day || idx + 1;
              const header = formatDayWeekdayDate(dayNum, day.date, parsedStartDate);

              // Gather images (clean list up to 3 non-empty unique photos)
              const rawImages = (day.imageUrls && day.imageUrls.length > 0
                ? day.imageUrls
                : day.imageUrl
                ? [day.imageUrl]
                : []).map((s) => String(s || "").trim()).filter(Boolean);
              const images: string[] = Array.from(new Set(rawImages)).slice(0, 3);

              return (
                <div key={idx} className="pdf-day-block pdf-avoid-break pb-5 border-b border-[#E6EBE6] last:border-b-0 last:pb-0">
                  {/* Day Header Line */}
                  <div
                    className="text-[12px] sm:text-[12.5px] font-bold text-[#1A3326] uppercase tracking-[0.08em]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Day {dayNum} | {header.weekday ? `${header.weekday} | ` : ""}
                    {header.dateText}
                  </div>

                  {/* Day Title */}
                  <h3
                    className="text-[17px] sm:text-[18.5px] font-bold text-[#1A3326] mt-0.5 mb-2 leading-snug"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
                  >
                    {day.subtitle || day.title || `Day ${dayNum} Journey`}
                  </h3>

                  {/* Day Narrative Description (Rich Text formatting preserved) */}
                  {day.description && renderRichDescription(day.description)}

                  {/* Optional Activities (on request) */}
                  {day.optionalActivities && (
                    <div className="text-[12.5px] sm:text-[13px] text-[#26352C] mt-2 mb-2 leading-relaxed">
                      <span className="font-bold block text-[#1A3326] mb-1">
                        Optional (on request):
                      </span>
                      {Array.isArray(day.optionalActivities) ? (
                        <div className="space-y-1.5 text-[#3C4A42] pl-0.5">
                          {day.optionalActivities.map((act, aIdx) => (
                            <div
                              key={aIdx}
                              className="text-[12.5px] sm:text-[13px] leading-relaxed"
                              style={{ display: "table", width: "100%" }}
                            >
                              <div style={{ display: "table-row" }}>
                                <div style={{ display: "table-cell", verticalAlign: "top", width: "14px", paddingTop: "7px" }}>
                                  <span
                                    style={{
                                      display: "block",
                                      width: "4.5px",
                                      height: "4.5px",
                                      borderRadius: "50%",
                                      backgroundColor: "#3C4A42",
                                    }}
                                  />
                                </div>
                                <div style={{ display: "table-cell", verticalAlign: "top" }}>
                                  {act.replace(/^Optional\s*\(on\s*request\)\s*:\s*/i, "")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#3C4A42]">{day.optionalActivities}</p>
                      )}
                    </div>
                  )}

                  {/* Dinner / Meals Note */}
                  {day.meals && (
                    <div className="text-[12.5px] sm:text-[13px] italic text-[#4D5C53] mt-2 mb-2 leading-relaxed">
                      {day.meals}
                    </div>
                  )}

                  {/* Stay Information with table layout to guarantee icon and text align */}
                  {day.stay && (
                    <div
                      className="mt-2.5 text-[13px] sm:text-[13.5px] font-bold text-[#1A3326]"
                      style={{ display: "table" }}
                    >
                      <div style={{ display: "table-row" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle", width: "22px" }}>
                          <Bed className="w-4 h-4 text-[#1A3326]" style={{ display: "block" }} />
                        </div>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                          {day.stay.startsWith("Stay:") ? day.stay : `Stay: ${day.stay}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Images Gallery: 1, 2, or 3 Photos in editorial row */}
                  {images.length > 0 && (
                    <div className="mt-3.5">
                      {images.length === 1 ? (
                        <div className="w-full h-48 sm:h-56 rounded-sm overflow-hidden bg-neutral-100 shadow-2xs">
                          <ImageWithFallback
                            src={images[0]}
                            alt={`${day.title || "Day"} photo`}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      ) : images.length === 2 ? (
                        <div className="grid grid-cols-2 gap-1.5 h-44 sm:h-48 rounded-sm overflow-hidden">
                          {images.slice(0, 2).map((imgSrc, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative h-full w-full overflow-hidden bg-neutral-100 rounded-sm shadow-2xs"
                            >
                              <ImageWithFallback
                                src={imgSrc}
                                alt={`${day.title || "Day"} photo ${imgIdx + 1}`}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5 h-44 sm:h-48 rounded-sm overflow-hidden">
                          {images.slice(0, 3).map((imgSrc, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative h-full w-full overflow-hidden bg-neutral-100 rounded-sm shadow-2xs"
                            >
                              <ImageWithFallback
                                src={imgSrc}
                                alt={`${day.title || "Day"} photo ${imgIdx + 1}`}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-neutral-500 text-sm italic">
              Day-by-day journey schedule to be advised upon confirmation.
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          6. TRANSPORTATION SECTION
      ========================================================================= */}
      <section className="pdf-section pdf-avoid-break mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
        <SectionBanner title="Transportation" />
        <div
          style={{ display: "table", width: "100%", boxSizing: "border-box" }}
          className="bg-[#F9FAF9] p-4 sm:p-5"
        >
          <div style={{ display: "table-row" }}>
            {/* Left: Origin & Agency */}
            <div style={{ display: "table-cell", width: "42%", verticalAlign: "middle" }}>
              <div className="text-[12.5px] sm:text-[13px] font-medium text-neutral-800 leading-snug max-w-[320px]">
                {transportation.origin || "ESCORA HOLIDAYS"}
              </div>
              {transportation.vehicleType && (
                <div className="text-[12px] text-neutral-600 mt-0.5">
                  {transportation.vehicleType}
                </div>
              )}
            </div>

            {/* Center: Car Transfer Icon */}
            <div style={{ display: "table-cell", width: "16%", verticalAlign: "middle", textAlign: "center" }}>
              <div
                className="rounded-full"
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "0 auto",
                  position: "relative",
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  backgroundColor: "rgba(22, 43, 72, 0.08)",
                  border: "1px solid rgba(22, 43, 72, 0.18)",
                }}
              >
                <Car
                  stroke="#1E40AF"
                  color="#1E40AF"
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    width: "18px",
                    height: "18px",
                    color: "#1E40AF",
                    display: "block",
                  }}
                />
              </div>
            </div>

            {/* Right: Destination / Drop */}
            <div style={{ display: "table-cell", width: "42%", verticalAlign: "middle", textAlign: "right" }}>
              <div className="text-[12.5px] sm:text-[13px] font-medium text-neutral-800 leading-snug max-w-[320px] ml-auto">
                {transportation.destination}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. INCLUSIONS & EXCLUSIONS SECTION
      ========================================================================= */}
      <section className="pdf-inclusions-exclusions-container pdf-avoid-break mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-xs">
        <SectionBanner title="Inclusions & Exclusions" />
        <div className="p-4 sm:p-5 space-y-4">
          {/* Inclusions (if specified) */}
          {activeInclusions.length > 0 && (
            <div className="space-y-2">
              <div className="text-[13px] font-bold text-[#1A3326] uppercase tracking-wide">
                Inclusions
              </div>
              <div className="space-y-2">
                {activeInclusions.map((item, idx) => (
                  <div key={idx} className="pdf-avoid-break">
                    <div
                      className="rounded-md bg-[#F4F9F5] border border-[#D5E8DA] px-3 py-2"
                      style={{ display: "table", width: "100%", boxSizing: "border-box" }}
                    >
                      <div style={{ display: "table-row" }}>
                        <div style={{ display: "table-cell", verticalAlign: "top", width: "24px", paddingTop: "2px" }}>
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "3px",
                              backgroundColor: "#E3F2E7",
                              border: "1px solid #2D5A43",
                              position: "relative",
                              boxSizing: "border-box",
                            }}
                          >
                            <Check
                              stroke="#1E743B"
                              color="#1E743B"
                              strokeWidth={3}
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: "2px",
                                width: "10px",
                                height: "10px",
                                color: "#1E743B",
                                display: "block",
                              }}
                            />
                          </div>
                        </div>
                        <div
                          style={{ display: "table-cell", verticalAlign: "top" }}
                          className="text-[13px] text-[#1F2937] leading-[1.5] font-medium pl-1.5"
                        >
                          {item}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exclusions */}
          <div className="space-y-2">
            <div className="text-[13px] font-bold text-[#1A3326] uppercase tracking-wide">
              Exclusions
            </div>
            <div className="space-y-2">
              {activeExclusions.map((item, idx) => (
                <div key={idx} className="pdf-avoid-break">
                  <div
                    className="rounded-md bg-[#FBF7F7] border border-[#EAE0E0] px-3 py-2"
                    style={{ display: "table", width: "100%", boxSizing: "border-box" }}
                  >
                    <div style={{ display: "table-row" }}>
                      <div style={{ display: "table-cell", verticalAlign: "top", width: "24px", paddingTop: "2px" }}>
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "3px",
                            backgroundColor: "#F2EBEB",
                            border: "1px solid #D4C4C4",
                            position: "relative",
                            boxSizing: "border-box",
                          }}
                        >
                          <X
                            stroke="#8C3B3B"
                            color="#8C3B3B"
                            strokeWidth={2.5}
                            style={{
                              position: "absolute",
                              top: "2px",
                              left: "2px",
                              width: "10px",
                              height: "10px",
                              color: "#8C3B3B",
                              display: "block",
                            }}
                          />
                        </div>
                      </div>
                      <div
                        style={{ display: "table-cell", verticalAlign: "top" }}
                        className="text-[13px] text-[#3A3030] leading-[1.5] font-medium pl-1.5"
                      >
                        {item}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional: We Also Provide */}
          {weAlsoProvide.length > 0 && (
            <div className="pdf-avoid-break pt-3 mt-1 border-t border-[#E5E7EB] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-[#1A3326] uppercase tracking-wide flex items-center gap-2">
                  <span>We Also Provide</span>
                  <span className="text-[10px] font-semibold text-[#855B14] bg-[#FDF8EE] border border-[#ECD9A8] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    On Request
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {weAlsoProvide.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-md bg-[#FAF8F5] border border-[#EAE3D2] px-3 py-2 flex items-center gap-2"
                    style={{ boxSizing: "border-box" }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "3px",
                        backgroundColor: "#F2EADB",
                        border: "1px solid #C4A768",
                        position: "relative",
                        flexShrink: 0,
                        boxSizing: "border-box",
                      }}
                    >
                      <Check
                        stroke="#855B14"
                        color="#855B14"
                        strokeWidth={3}
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: "2px",
                          width: "10px",
                          height: "10px",
                          color: "#855B14",
                          display: "block",
                        }}
                      />
                    </div>
                    <span className="text-[12.5px] text-[#2D2A26] font-semibold leading-tight">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          8. BUDGET & PRICING SECTION
      ========================================================================= */}
      <section className="pdf-pricing-container pdf-avoid-break mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-xs">
        <SectionBanner title="Budget & Pricing" />
        <div className="p-4 sm:p-5 space-y-4">
          {/* Package Stays Card matching Image 2 */}
          <div className="bg-[#F9FAF9] border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
            <div
              className="text-[17px] sm:text-[18px] font-bold text-[#161F18] mb-3.5"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
            >
              Package
            </div>

            {/* Stays List */}
            {stays && stays.length > 0 ? (
              <div>
                {stays.map((stay, idx) => (
                  <div key={idx} className="pdf-avoid-break">
                    {idx > 0 && (
                      <div
                        style={{
                          borderTop: "1px dashed #B8C2B9",
                          marginTop: "12px",
                          marginBottom: "12px",
                        }}
                      />
                    )}

                    {/* Stay Row Table matching Image 2 */}
                    <div style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
                      <div style={{ display: "table-row" }}>
                        {/* Left Column (50%) */}
                        <div
                          style={{
                            display: "table-cell",
                            width: "50%",
                            verticalAlign: "top",
                            paddingRight: "16px",
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Stays Left Column: Location & Place with Night & Room aligned underneath */}
                          <div style={{ display: "table", width: "100%" }}>
                            {/* Row 1: Location & Place */}
                            <div style={{ display: "table-row" }}>
                              <div
                                style={{
                                  display: "table-cell",
                                  width: "72px",
                                  verticalAlign: "top",
                                  color: "#69736C",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  paddingBottom: "7px",
                                }}
                              >
                                Location
                              </div>
                              <div
                                style={{
                                  display: "table-cell",
                                  verticalAlign: "top",
                                  color: "#161F18",
                                  fontSize: "13.5px",
                                  fontWeight: 700,
                                  paddingBottom: "7px",
                                }}
                              >
                                {stay.location || destinationText}
                              </div>
                            </div>

                            {/* Row 2: Night (under Location) & Room (under Place, next to Night) */}
                            <div style={{ display: "table-row" }}>
                              <div
                                style={{
                                  display: "table-cell",
                                  width: "72px",
                                  verticalAlign: "middle",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span style={{ color: "#69736C", fontSize: "13px", fontWeight: 600, marginRight: "8px" }}>
                                  Night
                                </span>
                                <span style={{ color: "#161F18", fontSize: "13.5px", fontWeight: 700 }}>
                                  {stay.nights || 1}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "table-cell",
                                  verticalAlign: "middle",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span style={{ color: "#69736C", fontSize: "13px", fontWeight: 600, marginRight: "8px" }}>
                                  Room
                                </span>
                                <span style={{ color: "#161F18", fontSize: "13.5px", fontWeight: 700 }}>
                                  {stay.rooms || 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column (50%) */}
                        <div
                          style={{
                            display: "table-cell",
                            width: "50%",
                            verticalAlign: "top",
                            paddingLeft: "16px",
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Row 1: Accommodation */}
                          <div style={{ display: "table", width: "100%", marginBottom: "7px" }}>
                            <div style={{ display: "table-row" }}>
                              <div
                                style={{
                                  display: "table-cell",
                                  width: "115px",
                                  verticalAlign: "top",
                                  color: "#69736C",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  lineHeight: "1.25",
                                  paddingRight: "10px",
                                }}
                              >
                                Accommodation
                              </div>
                              <div
                                style={{
                                  display: "table-cell",
                                  verticalAlign: "top",
                                  color: "#161F18",
                                  fontSize: "13.5px",
                                  fontWeight: 700,
                                  lineHeight: "1.25",
                                }}
                              >
                                {stay.name} {stay.starRating ? `| ${stay.starRating}` : ""}
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Meal Plan */}
                          <div style={{ display: "table", width: "100%" }}>
                            <div style={{ display: "table-row" }}>
                              <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                                <span style={{ color: "#69736C", fontSize: "13px", fontWeight: 600, marginRight: "10px" }}>
                                  Meal Plan
                                </span>
                                <span style={{ color: "#161F18", fontSize: "13.5px", fontWeight: 700 }}>
                                  {stay.mealPlan || "BreakFast"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-500 italic">
                Handpicked 5-Star luxury retreats and private heritage resorts included in package quote.
              </div>
            )}
          </div>

          {/* Optional: Pricing breakdown / Total if present */}
          {computedPricingTotal > 0 && (
            <div className="pt-1">
              <div className="bg-[#162B48] text-white p-3.5 rounded-lg flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#CAA052]">
                    Total Package Investment
                  </div>
                  <div className="text-[11px] text-white/80">
                    {hasTaxes
                      ? isTaxInclusive
                        ? `All-inclusive quote per specified itinerary · ${pricing?.taxLabel || "GST & Taxes"} included`
                        : `All-inclusive quote per specified itinerary & verified stays (+ ${pricing?.taxLabel || "GST & Taxes"})`
                      : "All-inclusive quote per specified itinerary & verified stays"}
                  </div>
                </div>
                <div className="flex flex-col items-end text-right">
                  {hasTaxes && !isTaxInclusive && subtotal > 0 && taxAmount > 0 && (
                    <div className="text-[11px] text-white/70 tabular-nums">
                      Subtotal: {currencySymbol}{subtotal.toLocaleString("en-IN")} + {pricing?.taxLabel || "Tax"}: {currencySymbol}{taxAmount.toLocaleString("en-IN")}
                    </div>
                  )}
                  {hasTaxes && isTaxInclusive && taxAmount > 0 && (
                    <div className="text-[10.5px] text-white/70 tabular-nums">
                      (Includes {pricing?.taxLabel || "GST"}: {currencySymbol}{taxAmount.toLocaleString("en-IN")})
                    </div>
                  )}
                  <span className="text-[18px] sm:text-[20px] font-bold tabular-nums text-white">
                    {currencySymbol}
                    {computedPricingTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              {pricing?.notes && (
                <div className="text-[11px] text-neutral-500 italic mt-2 px-1 leading-relaxed">
                  {pricing.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          9. ACCOMMODATION TERMS & CONDITIONS
      ========================================================================= */}
      <section className="pdf-terms-container pdf-avoid-break mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-xs">
        <SectionBanner title="Accommodation Terms & Conditions" />
        <div className="p-4 sm:p-5">
          <div>
            {hotelTerms.map((term, idx) => (
              <div
                key={idx}
                className="text-[12.5px] sm:text-[13px] leading-[1.6] text-[#242926]"
                style={{ display: "table", width: "100%", marginBottom: "8px" }}
              >
                <div style={{ display: "table-row" }}>
                  <div style={{ display: "table-cell", verticalAlign: "top", width: "18px", paddingTop: "7px" }}>
                    <span
                      style={{
                        display: "block",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor: "#1A3326",
                      }}
                    />
                  </div>
                  <div style={{ display: "table-cell", verticalAlign: "top" }}>
                    {term}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. PAYMENT TERMS & CONDITIONS
      ========================================================================= */}
      <section className="pdf-terms-container pdf-avoid-break mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-xs">
        <SectionBanner title="Payment Terms & Conditions" />
        <div className="p-4 sm:p-5">
          <div>
            {paymentTerms.map((term, idx) => (
              <div
                key={idx}
                className="text-[12.5px] sm:text-[13px] leading-[1.6] text-[#242926]"
                style={{ display: "table", width: "100%", marginBottom: "8px" }}
              >
                <div style={{ display: "table-row" }}>
                  <div style={{ display: "table-cell", verticalAlign: "top", width: "18px", paddingTop: "7px" }}>
                    <span
                      style={{
                        display: "block",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor: "#1A3326",
                      }}
                    />
                  </div>
                  <div style={{ display: "table-cell", verticalAlign: "top" }}>
                    {term}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. IMPORTANT INFORMATION
      ========================================================================= */}
      <section className="pdf-terms-container pdf-avoid-break mt-5 border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-xs">
        <SectionBanner title="Important Information" />
        <div className="p-4 sm:p-5">
          <div>
            {importantInfo.map((info, idx) => (
              <div
                key={idx}
                className="text-[12.5px] sm:text-[13px] leading-[1.6] text-[#242926]"
                style={{ display: "table", width: "100%", marginBottom: "8px" }}
              >
                <div style={{ display: "table-row" }}>
                  <div style={{ display: "table-cell", verticalAlign: "top", width: "18px", paddingTop: "7px" }}>
                    <span
                      style={{
                        display: "block",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor: "#1A3326",
                      }}
                    />
                  </div>
                  <div style={{ display: "table-cell", verticalAlign: "top" }}>
                    {info}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          12. FOOTER CARD & AGENCY BADGES
      ========================================================================= */}
      <footer className="pdf-section pdf-avoid-break mt-6 border border-[#E5E7EB] rounded-xl overflow-hidden bg-white shadow-xs">
        {/* Top Section with Escora Logo & Flight Graphic */}
        <div className="p-5 sm:p-6 text-center space-y-3 bg-gradient-to-b from-white to-[#F8FAF8]">
          <BrandLogo variant="dark" />

          {/* Authentic Escora Flight Aircraft Graphic */}
          <div className="flex items-center justify-center pt-2 pb-1">
            <img
              src={escoraFooterPlane}
              alt="Escora Flight Aircraft Graphic"
              className="w-48 sm:w-64 h-auto object-contain mx-auto drop-shadow-2xs"
              loading="eager"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Bottom Dark Navy Bar with Contact & Social Media matching brand identity */}
        <div
          style={{
            display: "table",
            width: "100%",
            backgroundColor: "#162B48",
            color: "#FFFFFF",
            boxSizing: "border-box",
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "table-row" }}>
            {/* Left: Contact */}
            <div style={{ display: "table-cell", width: "50%", verticalAlign: "top" }}>
              <div
                className="text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#CAA052" }}
              >
                Contact
              </div>

              {/* Phone */}
              <div style={{ display: "table", marginBottom: "8px" }}>
                <div style={{ display: "table-row" }}>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      width: "22px",
                      lineHeight: "1",
                    }}
                  >
                    <Phone
                      stroke="#CAA052"
                      color="#CAA052"
                      style={{
                        color: "#CAA052",
                        width: "14px",
                        height: "14px",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      lineHeight: "16px",
                    }}
                  >
                    {agencyPhone}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ display: "table" }}>
                <div style={{ display: "table-row" }}>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      width: "22px",
                      lineHeight: "1",
                    }}
                  >
                    <Mail
                      stroke="#CAA052"
                      color="#CAA052"
                      style={{
                        color: "#CAA052",
                        width: "14px",
                        height: "14px",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      lineHeight: "16px",
                    }}
                  >
                    {agencyEmail}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Social Media */}
            <div style={{ display: "table-cell", width: "50%", verticalAlign: "top", textAlign: "right" }}>
              <div
                className="text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#CAA052" }}
              >
                Social Media
              </div>

              {/* Instagram */}
              <div style={{ display: "table", marginLeft: "auto", marginBottom: "8px" }}>
                <div style={{ display: "table-row" }}>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      width: "22px",
                      lineHeight: "1",
                    }}
                  >
                    <Instagram
                      stroke="#CAA052"
                      color="#CAA052"
                      style={{
                        color: "#CAA052",
                        width: "14px",
                        height: "14px",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      lineHeight: "16px",
                    }}
                  >
                    {agencyInstagram}
                  </div>
                </div>
              </div>

              {/* Facebook */}
              <div style={{ display: "table", marginLeft: "auto", marginBottom: "8px" }}>
                <div style={{ display: "table-row" }}>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      width: "22px",
                      lineHeight: "1",
                    }}
                  >
                    <Facebook
                      stroke="#CAA052"
                      color="#CAA052"
                      style={{
                        color: "#CAA052",
                        width: "14px",
                        height: "14px",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      lineHeight: "16px",
                    }}
                  >
                    Escora Holidays
                  </div>
                </div>
              </div>

              {/* Globe / Website */}
              <div style={{ display: "table", marginLeft: "auto" }}>
                <div style={{ display: "table-row" }}>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      width: "22px",
                      lineHeight: "1",
                    }}
                  >
                    <Globe
                      stroke="#CAA052"
                      color="#CAA052"
                      style={{
                        color: "#CAA052",
                        width: "14px",
                        height: "14px",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      verticalAlign: "middle",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      lineHeight: "16px",
                    }}
                  >
                    {agencyWebsite}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
