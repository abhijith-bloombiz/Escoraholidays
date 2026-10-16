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
  Info,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
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
  DEFAULT_TRIP_INCLUDES,
  DEFAULT_AGENCY_CONTACT,
  formatMoney,
} from "@/lib/itinerary";

import escoraLogoDarkPath from "@assets/escora/escora-logo-dark.png";
import alleppeyFallbackImg from "@assets/escora/destinations/alleppey.jpg";
import kovalamFallbackImg from "@assets/escora/destinations/kovalam-clean.jpg";
import kumarakomFallbackImg from "@assets/escora/destinations/kumarakom.jpg";
import varkalaFallbackImg from "@assets/escora/destinations/varkala.jpg";
import padmanabhaswamyFallbackImg from "@assets/escora/destinations/padmanabhaswamy-temple.jpg";

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

function formatDDMMYYYY(iso?: string | null, fallback?: string): string {
  if (!iso) return fallback || "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDayWeekdayDate(dayNum: number, dateStr?: string | null): { weekday: string; dateText: string } {
  if (!dateStr) return { weekday: "", dateText: `Day ${dayNum}` };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return { weekday: "", dateText: dateStr };
  }
  const weekday = d.toLocaleDateString("en-IN", { weekday: "long" });
  const day = d.toLocaleDateString("en-IN", { day: "numeric" });
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  const year = d.toLocaleDateString("en-IN", { year: "numeric" });
  return { weekday, dateText: `${day} ${month} ${year}` };
}

function computeDurationText(
  daysCount: number,
  startDate?: string | null,
  endDate?: string | null,
): { nights: number; days: number; text: string } {
  let days = daysCount || 1;
  let nights = Math.max(0, days - 1);

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!Number.isNaN(s.getTime())) {
      const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        nights = diffDays;
        days = Math.max(daysCount, diffDays + 1);
      }
    }
  }
  return { nights, days, text: `${nights}N | ${days}D` };
}

function splitTitle(title: string): { line1: string; line2?: string } {
  if (!title) return { line1: "Explora", line2: "Trivandrum" };
  const parts = title.trim().split(/\s+/);
  if (parts.length === 1) return { line1: parts[0] };
  if (parts.length === 2) return { line1: parts[0], line2: parts[1] };
  const mid = Math.ceil(parts.length / 2);
  return {
    line1: parts.slice(0, mid).join(" "),
    line2: parts.slice(mid).join(" "),
  };
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
  fallback: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallback);

  useEffect(() => {
    setCurrentSrc(src || fallback);
  }, [src, fallback]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading="eager"
      onError={() => {
        if (currentSrc !== fallback) {
          setCurrentSrc(fallback);
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
            fontFamily: "'Playfair Display', Georgia, serif",
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
        className="font-serif text-[20px] font-bold text-[#39271F] tracking-tight leading-none"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {title}
      </h2>
      <div className="w-12 h-[1.5px] bg-[#BE8C70]" />
    </div>
  );
}

/**
 * Standard Page Header for interior pages (Pages 2, 3, 4)
 * Ensures consistent visual boundary, logo alignment, and thin divider across all pages.
 */
function PageHeader({ title }: { title: string }) {
  return (
    <div className="w-full mb-3.5">
      <div className="flex items-center justify-between pb-1">
        <EditorialHeading title={title} />
        <BrandLogo variant="dark" />
      </div>
      <div className="w-full h-px bg-[#E4DDD3] mt-2" />
    </div>
  );
}

/**
 * Reusable two-column itinerary day item
 * Left column: Day label, large serif numeral, vertical timeline
 * Right column: Date, title, full description, optional activities, meals, stay, images
 */
function ItineraryDayBlock({
  dayNumber,
  header,
  title,
  description,
  optionalActivities,
  meals,
  stay,
  images = [],
  isLastDay = false,
  fallbackImages = [],
}: {
  dayNumber: number;
  header: { weekday: string; dateText: string };
  title?: string | null;
  description?: string | null;
  optionalActivities?: string[] | string | null;
  meals?: string | null;
  stay?: string | null;
  images?: string[];
  isLastDay?: boolean;
  fallbackImages?: string[];
}) {
  return (
    <div className="flex gap-4 relative w-full mb-2.5">
      {/* Left Timeline Gutter (Fixed width, strictly aligned) */}
      <div className="w-12 shrink-0 flex flex-col items-center">
        <span
          className="font-serif text-[11px] text-[#39271F] leading-none"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Day
        </span>
        <span
          className="font-serif text-[34px] font-bold text-[#A45132] leading-none mt-0.5"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {dayNumber}
        </span>
        {!isLastDay && <div className="w-px bg-[#E4DDD3] flex-1 mt-2 mb-1" />}
      </div>

      {/* Right Content Column */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="text-[10px] font-semibold text-[#8C7A6B] tracking-wide uppercase">
          {header.weekday} | {header.dateText}
        </div>
        <h3
          className="font-serif text-[16px] font-bold text-[#39271F] mt-0.5 mb-1 leading-snug"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title ?? "—"}
        </h3>
        {description && (
          <div className="text-[9px] leading-[1.46] text-[#282421] space-y-1 mb-2 whitespace-pre-line">
            {description}
          </div>
        )}

        {/* Optional activities */}
        {optionalActivities && (
          <div className="bg-[#F0E6DA] rounded p-2 mb-2 text-[#39271F]">
            <span className="text-[9px] font-bold block mb-0.5">Optional (on request):</span>
            <ul className="text-[8.5px] text-[#5C524C] space-y-0.5 list-disc list-inside">
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
          <div className="text-[8.5px] italic text-[#685D56] mb-1.5 leading-relaxed">
            {meals}
          </div>
        )}

        {/* Stay row */}
        {stay && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#39271F] mb-2">
            <Bed className="w-3.5 h-3.5 text-[#39271F] shrink-0" />
            <span>{stay.startsWith("Stay:") ? stay : `Stay: ${stay}`}</span>
          </div>
        )}

        {/* Two side-by-side images (Day 1) - strictly equal heights & aligned within content */}
        {images && images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 w-full h-[100px] mt-2">
            {images.map((imgSrc, idx) => (
              <div key={idx} className="w-full h-full rounded overflow-hidden relative">
                <ImageWithFallback
                  src={imgSrc}
                  fallback={fallbackImages[idx] || padmanabhaswamyFallbackImg}
                  alt={`${title ?? "Photo"} ${idx + 1}`}
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

export default function ItineraryPrintDocument({ data, id }: { data: ItineraryPrintData; id?: string }) {
  const {
    title,
    customerName,
    destination,
    startDate,
    endDate,
    coverImageUrl,
    days = [],
    stays = [],
    exclusions = [],
    pricing,
    currency = "INR",
    shareToken,
  } = data;

  const duration = computeDurationText(days.length, startDate, endDate);
  const adults = data.adults ?? 1;
  const children = data.children ?? 0;
  const infants = data.infants ?? 0;

  const emergencyContacts = data.emergencyContacts || DEFAULT_AGENCY_CONTACT.emergencyContacts;
  const curatorName = data.curatorName || DEFAULT_AGENCY_CONTACT.curatorName;
  const curatorPhone = data.curatorPhone || DEFAULT_AGENCY_CONTACT.curatorPhone;
  const referenceNumber =
    data.referenceNumber ||
    (shareToken ? `L100021/Q${shareToken.slice(0, 4).toUpperCase()}` : "L100021/Q1020");
  const createdDate = data.createdDate || "29-10-2026";

  const transportation: ItineraryTransportation = data.transportation || {
    origin: `ESCORA HOLIDAYS | ${destination || "Trivandrum, Keralam, India | Kovalam, Keralam, India"}`,
    destination: "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
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

  // Day distribution
  const day1 = days[0] || {
    day: 1,
    date: startDate || "2026-10-29",
    title: "Arrival in Trivandrum",
    subtitle: "Arrival in Trivandrum",
    description:
      "Arrive in Trivandrum, where you will be met and transferred to your hotel for check-in. Begin sightseeing with a visit to the magnificent Sree Padmanabhaswamy Temple, one of the richest and most revered temples in India. From there, head to Trivandrum Zoo, a peaceful, green stretch that makes for an easy family-friendly stop.\n\nIn the afternoon, visit the Napier Museum and the nearby Kuthiramalika Palace Museum to explore Kerala's art and royal heritage.\n\nIn the evening, stroll along Shanghumugham Beach and watch the sun set over the Arabian Sea.",
    optionalActivities: ["Optional (on request): an evening Kathakali performance at Margi."],
    meals: "Dinner at leisure. Trivandrum offers a good mix of local Kerala cuisine and multi-cuisine dining options around the city.",
    stay: "Stay: Uday Samudra Leisure Beach Hotel",
    imageUrls: [],
  };

  const day2 = days[1] || {
    day: 2,
    date: "2026-10-30",
    title: "Trivandrum to Kovalam",
    subtitle: "Trivandrum to Kovalam",
    description:
      "After breakfast, check out and drive to Kovalam, stopping at Poovar Island on the way. Enjoy a relaxed boat ride where the backwaters, the sea and the golden sand meet. On arrival in Kovalam, check into your resort and spend the afternoon at leisure.\n\nIn the late afternoon, make your way to Kovalam Beach, known for its iconic lighthouse and crescent-shaped shoreline. It is a relaxed spot to unwind as the day winds down.",
    optionalActivities: [
      "A wellness or Ayurveda session at one of the area's reputed retreat centres",
      "Kayaking at Thiruvallam with the Rovers Kayaking Club",
    ],
    meals: "Dinner at leisure. Kovalam has a wide choice of seafood and multi-cuisine restaurants along the coast.",
    stay: "Stay: The Leela Kovalam, a Raviz Hotel",
    imageUrls: [],
  };

  const day3 = days[2] || {
    day: 3,
    date: endDate || "2026-10-31",
    title: "Kovalam to Departure",
    subtitle: "Kovalam to Departure",
    description:
      "After a leisurely breakfast, enjoy a final stroll along the shoreline. Check out of your resort and if time permits, enjoy some shopping at Lulu Mall before proceeding to the airport, departing with beautiful memories of Kerala.",
    imageUrls: [],
  };

  const day1Header = formatDayWeekdayDate(1, day1.date);
  const day2Header = formatDayWeekdayDate(2, day2.date);
  const day3Header = formatDayWeekdayDate(3, day3.date);

  const day1Images =
    day1.imageUrls && day1.imageUrls.length > 0
      ? day1.imageUrls
      : [day1.imageUrl || padmanabhaswamyFallbackImg, varkalaFallbackImg];

  const day3Images =
    day3.imageUrls && day3.imageUrls.length > 0
      ? day3.imageUrls
      : [day3.imageUrl || kovalamFallbackImg];

  const totalAmount = pricing?.total || 48000;

  return (
    <div
      id={id}
      className="escora-brochure-root mx-auto w-full text-[#282421]"
      style={{
        fontFamily: "'Manrope', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
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
      {/* PAGE 1: Split Cover & Dark Espresso Trip Details Panel */}
      {/* ==================================================================== */}
      <section className="brochure-page flex flex-col justify-between">
        {/* Top Split: Information Column (Left) + Tall Photograph (Right) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Column (52%) - strictly starts at 18mm left margin */}
          <div className="w-[52%] pl-[18mm] pr-6 pt-[16mm] pb-4 flex flex-col justify-between">
            <div>
              {/* Brand Logo */}
              <BrandLogo variant="dark" />

              {/* Tagline */}
              <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#685D56] mt-5 leading-relaxed">
                A JOURNEY THROUGH<br />KERALA'S TIMELESS BEAUTY
              </div>

              {/* Trip Title in Large Serif */}
              <h1
                className="font-serif text-[38px] leading-[1.08] font-bold text-[#39271F] tracking-tight mt-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {titleParts.line1}
                {titleParts.line2 && <><br />{titleParts.line2}</>}
              </h1>

              {/* Duration line */}
              <div className="flex items-center gap-3 mt-3.5">
                <span
                  className="font-serif text-sm font-semibold text-[#39271F] whitespace-nowrap"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {duration.text}
                </span>
                <div className="w-16 h-px bg-[#BE8C70]" />
              </div>

              {/* Customer Name */}
              <div className="text-[15px] font-bold tracking-[0.22em] uppercase text-[#39271F] mt-5">
                {customerName}
              </div>

              {/* YOUR TRIP INCLUDES */}
              <div className="mt-5">
                <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#39271F] mb-2.5">
                  YOUR TRIP INCLUDES
                </div>
                <div className="flex items-center gap-3">
                  {/* Hotel */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-[#F0E6DA] flex items-center justify-center text-[#39271F]">
                      <Bed className="w-4 h-4" />
                    </div>
                    <span className="text-[8.5px] font-bold text-[#39271F] mt-1">Hotel</span>
                  </div>
                  {/* Transport */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-[#F0E6DA] flex items-center justify-center text-[#39271F]">
                      <Car className="w-4 h-4" />
                    </div>
                    <span className="text-[8.5px] font-bold text-[#39271F] mt-1">Transport</span>
                  </div>
                  {/* Sight-Seeing */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-[#F0E6DA] flex items-center justify-center text-[#39271F]">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-[8.5px] font-bold text-[#39271F] mt-1">Sight-Seeing</span>
                  </div>
                  {/* Transfer */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-[#F0E6DA] flex items-center justify-center text-[#39271F]">
                      <Bus className="w-4 h-4" />
                    </div>
                    <span className="text-[8.5px] font-bold text-[#39271F] mt-1">Transfer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Info Grid */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-4 border-t border-[#E4DDD3]">
              {/* Emergency Contacts */}
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[8px] font-mono tracking-wider uppercase text-[#685D56] block font-semibold">
                    Emergency Contacts
                  </span>
                  <span className="text-[8.5px] font-bold text-[#282421] block leading-tight mt-0.5">
                    {emergencyContacts}
                  </span>
                </div>
              </div>

              {/* Reference No */}
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[8px] font-mono tracking-wider uppercase text-[#685D56] block font-semibold">
                    Reference No.
                  </span>
                  <span className="text-[8.5px] font-bold text-[#282421] block leading-tight mt-0.5 font-mono">
                    {referenceNumber}
                  </span>
                </div>
              </div>

              {/* Curator */}
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[8px] font-mono tracking-wider uppercase text-[#685D56] block font-semibold">
                    Itinerary Curated By
                  </span>
                  <span className="text-[8.5px] font-bold text-[#282421] block leading-tight mt-0.5">
                    {curatorName}
                  </span>
                  {curatorPhone && (
                    <span className="text-[8px] text-[#685D56] block">({curatorPhone})</span>
                  )}
                </div>
              </div>

              {/* Created On */}
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#BE8C70] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[8px] font-mono tracking-wider uppercase text-[#685D56] block font-semibold">
                    Created on
                  </span>
                  <span className="text-[8.5px] font-bold text-[#282421] block leading-tight mt-0.5 font-mono">
                    {createdDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (48%): Tall Photograph */}
          <div className="w-[48%] relative h-full">
            <ImageWithFallback
              src={coverImageUrl || alleppeyFallbackImg}
              fallback={alleppeyFallbackImg}
              alt="Kerala Houseboat Backwaters"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Full-width Deep Espresso Trip Details Panel - strictly aligned to 18mm grid */}
        <div className="bg-[#39271F] text-[#FAF7F1] px-[18mm] py-4 relative overflow-hidden shrink-0">
          {/* Subtle copper accent wave lines */}
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
            className="font-serif text-[20px] font-bold text-[#FAF7F1] tracking-tight relative z-10"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Trip Details
          </h2>

          <div className="grid grid-cols-3 gap-y-2.5 gap-x-6 relative z-10 text-xs mt-2.5 mb-1">
            <div className="col-span-1">
              <span className="text-[8px] font-mono tracking-widest uppercase text-[#BE8C70] block font-semibold">
                DESTINATION
              </span>
              <span className="text-[10px] text-[#FAF7F1] block mt-0.5 leading-snug font-medium">
                {destination || "Trivandrum, Keralam, India | Kovalam, Keralam, India"}
              </span>
            </div>
            <div>
              <span className="text-[8px] font-mono tracking-widest uppercase text-[#BE8C70] block font-semibold">
                START DATE
              </span>
              <span className="text-[10.5px] text-[#FAF7F1] block mt-0.5 font-bold font-mono">
                {formatDDMMYYYY(startDate, "29-10-2026")}
              </span>
            </div>
            <div>
              <span className="text-[8px] font-mono tracking-widest uppercase text-[#BE8C70] block font-semibold">
                END DATE
              </span>
              <span className="text-[10.5px] text-[#FAF7F1] block mt-0.5 font-bold font-mono">
                {formatDDMMYYYY(endDate, "31-10-2026")}
              </span>
            </div>
            <div>
              <span className="text-[8px] font-mono tracking-widest uppercase text-[#BE8C70] block font-semibold">
                NIGHTS | DAYS
              </span>
              <span className="text-[10.5px] text-[#FAF7F1] block mt-0.5 font-bold font-mono">
                {duration.text}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[8px] font-mono tracking-widest uppercase text-[#BE8C70] block font-semibold">
                TOTAL PASSENGER
              </span>
              <span className="text-[10.5px] text-[#FAF7F1] block mt-0.5 font-bold">
                {adults} Adults | {children} Children | {infants} Infants
              </span>
            </div>
          </div>

          <div className="text-right text-[9px] font-mono text-[#BE8C70] relative z-10 pt-1">
            01 / 04
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PAGE 2: Day-To-Day Plan (Day 1 & Day 2) */}
      {/* ==================================================================== */}
      <section className="brochure-page px-[18mm] pt-[16mm] pb-[12mm] flex flex-col justify-between">
        <div>
          {/* Consistent Page Header */}
          <PageHeader title="Day-To-Day Plan" />

          {/* Day 1 Block */}
          <ItineraryDayBlock
            dayNumber={1}
            header={day1Header}
            title={day1.subtitle || day1.title}
            description={day1.description}
            optionalActivities={day1.optionalActivities}
            meals={day1.meals}
            stay={day1.stay}
            images={day1Images}
            fallbackImages={[padmanabhaswamyFallbackImg, varkalaFallbackImg]}
            isLastDay={false}
          />

          {/* Day 2 Block */}
          <ItineraryDayBlock
            dayNumber={2}
            header={day2Header}
            title={day2.subtitle || day2.title}
            description={day2.description}
            optionalActivities={day2.optionalActivities}
            meals={day2.meals}
            stay={day2.stay}
            images={[]}
            isLastDay={false}
          />
        </div>

        {/* Page indicator */}
        <div className="text-right text-[9px] font-mono text-[#685D56] pt-1 border-t border-[#E4DDD3]/50">
          02 / 04
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PAGE 3: Day 3, Wide Kovalam Photo, Transportation & Exclusions */}
      {/* ==================================================================== */}
      <section className="brochure-page px-[18mm] pt-[16mm] pb-[12mm] flex flex-col justify-between">
        <div>
          {/* Consistent Page Header */}
          <PageHeader title="Day-To-Day Plan" />

          {/* Day 3 Block */}
          <ItineraryDayBlock
            dayNumber={3}
            header={day3Header}
            title={day3.subtitle || day3.title}
            description={day3.description}
            optionalActivities={day3.optionalActivities}
            meals={day3.meals}
            stay={day3.stay}
            images={[]}
            isLastDay={true}
          />

          {/* Prominent Wide Destination Photo (Kovalam Beach & Lighthouse) */}
          <div className="w-full h-[205px] rounded overflow-hidden my-3.5">
            <ImageWithFallback
              src={day3Images[0]}
              fallback={kovalamFallbackImg}
              alt="Kovalam Lighthouse and Shoreline"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Transportation Section */}
          <div className="mt-4">
            <EditorialHeading title="Transportation" />
            <div className="bg-[#FAF7F1] border border-[#E4DDD3] rounded p-3.5 flex items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#F0E6DA] flex items-center justify-center text-[#39271F] shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#39271F] block">{transportation.origin}</span>
                  <span className="text-[9px] text-[#685D56] block mt-0.5">{transportation.destination}</span>
                </div>
              </div>
              {transportation.vehicleType && (
                <div className="shrink-0 text-right">
                  <span className="text-[8.5px] font-semibold text-[#A45132] bg-[#F5EBE1] px-2.5 py-1 rounded inline-block">
                    {transportation.vehicleType}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Inclusions & Exclusions Section */}
          <div className="mt-4">
            <EditorialHeading title="Inclusions & Exclusions" />
            <div className="bg-[#F0E6DA] rounded p-3.5 mt-2">
              <span className="text-[9.5px] font-bold tracking-wider uppercase text-[#39271F] block mb-2.5">
                EXCLUSIONS
              </span>
              <ul className="space-y-2">
                {activeExclusions.map((exc, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[9px] text-[#282421]">
                    <XCircle className="w-3.5 h-3.5 text-[#A45132] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Page indicator */}
        <div className="text-right text-[9px] font-mono text-[#685D56] pt-1 border-t border-[#E4DDD3]/50">
          03 / 04
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PAGE 4: Budget & Pricing, Terms, Review, and Closing Espresso Footer */}
      {/* ==================================================================== */}
      <section className="brochure-page px-[18mm] pt-[16mm] pb-[12mm] flex flex-col justify-between">
        <div>
          {/* Consistent Page Header */}
          <PageHeader title="Budget & Pricing" />

          {/* Package Table Card */}
          <div className="bg-[#F0E6DA] rounded-t p-3 text-[#39271F]">
            <span className="text-[10.5px] font-bold text-[#39271F] block mb-2">Package</span>
            {stays.map((stay, idx) => (
              <div key={idx}>
                {idx > 0 && <div className="border-t border-[#E2D7C8] my-2" />}
                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  <div>
                    <span className="text-[#685D56]">Location  </span>
                    <span className="font-bold text-[#39271F]">{stay.location || "Kerala, India"}</span>
                  </div>
                  <div>
                    <span className="text-[#685D56]">Hotel Name  </span>
                    <span className="font-bold text-[#39271F]">{stay.name} | {stay.starRating || "5 Star"}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-6 text-[9px]">
                    <div><span className="text-[#685D56]">Night  </span><span className="font-bold">{stay.nights ?? 1}</span></div>
                    <div><span className="text-[#685D56]">Rooms  </span><span className="font-bold">{stay.rooms ?? 1}</span></div>
                    <div><span className="text-[#685D56]">Meal Plan  </span><span className="font-bold">{stay.mealPlan || "Breakfast"}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Package Price Bar */}
          <div className="bg-[#A45132] text-[#FAF7F1] px-4 py-2.5 rounded-b flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-widest uppercase">
              TOTAL PACKAGE PRICE
            </span>
            <span
              className="font-serif text-[20px] font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              <span style={{ fontFamily: "Arial, sans-serif" }}>₹</span>{Number(totalAmount).toLocaleString("en-IN")}
            </span>
          </div>

          {/* Terms & Conditions (2 Columns) */}
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            {/* Hotel Terms */}
            <div className="bg-[#F0E6DA] rounded p-2.5">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#39271F] mb-1.5">
                <Bed className="w-3 h-3 text-[#39271F]" />
                <span>Hotel Terms &amp; Conditions</span>
              </div>
              <ul className="text-[7.5px] leading-[1.35] text-[#4E463C] space-y-0.5 list-disc list-inside">
                {hotelTerms.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))}
              </ul>
            </div>

            {/* Payment Terms */}
            <div className="bg-[#F0E6DA] rounded p-2.5">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#39271F] mb-1.5">
                <FileText className="w-3 h-3 text-[#39271F]" />
                <span>Payment Terms &amp; Conditions</span>
              </div>
              <ul className="text-[7.5px] leading-[1.35] text-[#4E463C] space-y-0.5 list-disc list-inside">
                {paymentTerms.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-[#F0E6DA] rounded p-2.5 mt-2">
            <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#39271F] mb-1.5">
              <Info className="w-3 h-3 text-[#39271F]" />
              <span>Important Information</span>
            </div>
            <ul className="text-[7.5px] leading-[1.35] text-[#4E463C] space-y-0.5 list-disc list-inside">
              {importantInfo.map((info, idx) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>

          {/* Destination Photo Strip + Google Review Overlay */}
          <div className="relative h-[70px] rounded overflow-hidden mt-2.5">
            <ImageWithFallback
              src={kumarakomFallbackImg}
              fallback={kumarakomFallbackImg}
              alt="Kerala Backwaters Sunrise"
              className="w-full h-full object-cover"
            />
            {/* Google Review Badge Overlay */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#39271F] leading-tight">Google Review</span>
                <div className="flex items-center text-[#F59E0B] text-[12px] leading-none mt-0.5 tracking-tight">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Espresso Footer - perfectly aligned to 18mm content boundaries */}
        <div className="w-full">
          <div className="bg-[#39271F] text-[#FAF7F1] rounded px-4 py-2.5 flex items-center justify-between">
            <BrandLogo variant="white" />
            <div className="flex items-center gap-4 text-[9px]">
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
              <div className="flex items-center gap-1.5 text-[#FAF7F1]">
                <div className="w-5 h-5 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center"><Facebook className="w-2.5 h-2.5" /></div>
                <div className="w-5 h-5 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center"><Instagram className="w-2.5 h-2.5" /></div>
                <div className="w-5 h-5 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center"><Twitter className="w-2.5 h-2.5" /></div>
                <div className="w-5 h-5 rounded-full bg-[#FAF7F1]/10 flex items-center justify-center"><Linkedin className="w-2.5 h-2.5" /></div>
              </div>
              <span className="text-[9px] font-mono text-[#BE8C70] font-bold pl-2 border-l border-[#FAF7F1]/20">
                04 / 04
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
