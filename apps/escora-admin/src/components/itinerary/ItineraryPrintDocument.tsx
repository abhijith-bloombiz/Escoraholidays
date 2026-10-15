import React from "react";
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
  mode?: "package" | "itinerary";
  // Reference PDF fields with automatic fallbacks for backward compatibility
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

function formatDayHeader(dayNum: number, dateStr?: string | null): string {
  if (!dateStr) return `Day ${dayNum}`;
  // If dateStr is already formatted like "Day 1 | Thursday | 29 Oct 2026"
  if (dateStr.includes("|")) return dateStr;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return `Day ${dayNum} | ${dateStr}`;
  const weekday = d.toLocaleDateString("en-IN", { weekday: "long" });
  const day = d.toLocaleDateString("en-IN", { day: "numeric" });
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  const year = d.toLocaleDateString("en-IN", { year: "numeric" });
  return `Day ${dayNum} | ${weekday} | ${day} ${month} ${year}`;
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
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
      const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        nights = diffDays;
        days = Math.max(daysCount, diffDays + 1);
      }
    }
  }
  return { nights, days, text: `${nights}N | ${days}D` };
}

/**
 * Section Header Banner:
 * The signature dark charcoal/deep forest-green rounded banner from the reference PDF
 */
function SectionBanner({ title }: { title: string }) {
  return (
    <div className="w-full my-4 section-banner-break">
      <div
        className="w-full py-2 px-4 rounded-md text-center text-white font-bold tracking-wide text-sm md:text-base shadow-sm"
        style={{ backgroundColor: "#2b3b31", letterSpacing: "0.04em" }}
      >
        {title}
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
    summary,
    days = [],
    stays = [],
    inclusions = [],
    exclusions = [],
    pricing,
    currency = "INR",
    shareToken,
  } = data;

  const duration = computeDurationText(days.length, startDate, endDate);
  const adults = data.adults ?? 1;
  const children = data.children ?? 0;
  const infants = data.infants ?? 0;

  const emergencyContacts =
    data.emergencyContacts || DEFAULT_AGENCY_CONTACT.emergencyContacts;
  const curatorName = data.curatorName || DEFAULT_AGENCY_CONTACT.curatorName;
  const curatorPhone = data.curatorPhone || DEFAULT_AGENCY_CONTACT.curatorPhone;
  const referenceNumber =
    data.referenceNumber ||
    (shareToken ? `L100021/Q${shareToken.slice(0, 4).toUpperCase()}` : "L100021/Q1020");
  const createdDate = data.createdDate || formatDDMMYYYY(startDate, "01-10-2026");

  const tripIncludes: ItineraryTripIncludes = {
    ...DEFAULT_TRIP_INCLUDES,
    ...(data.tripIncludes || {}),
  };

  const transportation: ItineraryTransportation = data.transportation || {
    origin: `ESCORA HOLIDAYS | ${destination || "Trivandrum, Keralam, India"}`,
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
  const agencyInstagram = data.agencyInstagram || DEFAULT_AGENCY_CONTACT.instagram;
  const agencyWebsite = data.agencyWebsite || DEFAULT_AGENCY_CONTACT.website;

  return (
    <div
      id={id}
      className="escora-pdf-document bg-white text-[#1f2922] mx-auto w-full max-w-[800px] shadow-sm font-sans"
      style={{
        boxSizing: "border-box",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @media print {
          .escora-pdf-document {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #1f2922 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pdf-page-container {
            padding: 24px 28px !important;
          }
          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .section-banner-break {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      <div className="pdf-page-container p-6 md:p-8 space-y-4">
        {/* ==================================================================== */}
        {/* SECTION 1: Escora Holidays branding and cover/trip summary */}
        {/* ==================================================================== */}
        <header className="flex flex-col items-center text-center space-y-4 avoid-break">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <img
              src={escoraLogoMarkPath}
              alt="Escora Holidays"
              className="h-14 md:h-16 w-auto object-contain"
            />
          </div>

          {/* Hero Image */}
          {coverImageUrl && (
            <div className="w-full h-56 md:h-64 rounded-xl overflow-hidden shadow-sm border border-neutral-200">
              <img
                src={coverImageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Trip title & duration */}
          <div className="space-y-1">
            <h1
              className="text-2xl md:text-3xl font-serif font-bold text-[#14261b] tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {title}
            </h1>
            <p className="text-sm font-semibold tracking-widest uppercase text-neutral-600">
              {duration.text}
            </p>
          </div>

          {/* Customer Name Banner */}
          <div className="w-full max-w-sm">
            <div
              className="py-1.5 px-6 rounded-md text-white font-bold tracking-wider text-sm md:text-base text-center uppercase shadow-sm"
              style={{ backgroundColor: "#2b3b31" }}
            >
              {customerName}
            </div>
          </div>

          {/* Your Trip Includes: 4 Cards */}
          <div className="w-full pt-1">
            <p className="text-xs uppercase font-semibold text-neutral-600 tracking-wider mb-2">
              Your Trip Includes
            </p>
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {/* Hotel */}
              <div
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors ${
                  tripIncludes.hotel
                    ? "bg-[#f4f6f4] border-[#dbe2dc] text-[#1b2b20]"
                    : "bg-neutral-50 border-neutral-200 text-neutral-400 opacity-60"
                }`}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded border border-neutral-400 text-xs font-bold mb-1 bg-white text-[#2b3b31]">
                  {tripIncludes.hotel ? "✓" : ""}
                </div>
                <svg className="w-6 h-6 mb-1 text-[#2b3b31]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10V19M3 14H21M21 10V19M3 14L7 6H17L21 14M7 10H17" />
                </svg>
                <span className="text-[11px] font-semibold">Hotel</span>
              </div>

              {/* Transport */}
              <div
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors ${
                  tripIncludes.transport
                    ? "bg-[#f4f6f4] border-[#dbe2dc] text-[#1b2b20]"
                    : "bg-neutral-50 border-neutral-200 text-neutral-400 opacity-60"
                }`}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded border border-neutral-400 text-xs font-bold mb-1 bg-white text-[#2b3b31]">
                  {tripIncludes.transport ? "✓" : ""}
                </div>
                <svg className="w-6 h-6 mb-1 text-[#2b3b31]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 11l2-4h14l2 4M3 11v6h18v-6M5 7h14" />
                </svg>
                <span className="text-[11px] font-semibold">Transport</span>
              </div>

              {/* Sight-Seeing */}
              <div
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors ${
                  tripIncludes.sightseeing
                    ? "bg-[#f4f6f4] border-[#dbe2dc] text-[#1b2b20]"
                    : "bg-neutral-50 border-neutral-200 text-neutral-400 opacity-60"
                }`}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded border border-neutral-400 text-xs font-bold mb-1 bg-white text-[#2b3b31]">
                  {tripIncludes.sightseeing ? "✓" : ""}
                </div>
                <svg className="w-6 h-6 mb-1 text-[#2b3b31]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] font-semibold">Sight-Seeing</span>
              </div>

              {/* Transfer */}
              <div
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors ${
                  tripIncludes.transfer
                    ? "bg-[#f4f6f4] border-[#dbe2dc] text-[#1b2b20]"
                    : "bg-neutral-50 border-neutral-200 text-neutral-400 opacity-60"
                }`}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded border border-neutral-400 text-xs font-bold mb-1 bg-white text-[#2b3b31]">
                  {tripIncludes.transfer ? "✓" : ""}
                </div>
                <svg className="w-6 h-6 mb-1 text-[#2b3b31]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h2m8 0h4m0 0l3-4V9a1 1 0 00-1-1h-6v8z" />
                </svg>
                <span className="text-[11px] font-semibold">Transfer</span>
              </div>
            </div>
          </div>

          {/* Emergency contacts, curator, reference number, creation date */}
          <div className="w-full pt-1 text-center border-t border-neutral-200 mt-2 space-y-1.5 text-xs text-neutral-700">
            <p className="font-semibold text-neutral-800">
              Emergency Contacts{" "}
              <span className="font-bold text-[#14261b]">{emergencyContacts}</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-600 px-1 pt-0.5">
              <div className="text-left">
                <span className="block font-medium">Itinerary Curated By</span>
                <span className="font-semibold text-neutral-900">
                  {curatorName} ( {curatorPhone} )
                </span>
              </div>
              <div className="text-right mt-1 sm:mt-0">
                <span className="block font-medium">Reference No. {referenceNumber}</span>
                <span className="text-neutral-500">Created on. {createdDate}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* SECTION 2: Trip Details */}
        {/* ==================================================================== */}
        <section className="avoid-break">
          <SectionBanner title="Trip Details" />
          <div
            className="rounded-lg p-4 text-[#331c0a] shadow-sm"
            style={{
              background: "linear-gradient(135deg, #cfa24e 0%, #caa052 50%, #be9442 100%)",
            }}
          >
            {/* Destination row */}
            <div className="mb-3 pb-2.5 border-b border-[#b58b38]/40">
              <span className="block text-[10px] font-bold tracking-widest text-[#7b1f13] uppercase">
                Destination
              </span>
              <span className="text-sm font-bold text-[#2a1b10] block mt-0.5">
                {destination || "Trivandrum, Keralam, India | Kovalam, Keralam, India"}
              </span>
            </div>

            {/* 4 columns: Start, End, Nights/Days, Total Passengers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#7b1f13] uppercase">
                  Start Date
                </span>
                <span className="font-bold text-[#2a1b10] mt-0.5 block">
                  {formatDDMMYYYY(startDate, "29-10-2026")}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#7b1f13] uppercase">
                  End Date
                </span>
                <span className="font-bold text-[#2a1b10] mt-0.5 block">
                  {formatDDMMYYYY(endDate, "31-10-2026")}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#7b1f13] uppercase">
                  Nights | Days
                </span>
                <span className="font-bold text-[#2a1b10] mt-0.5 block">
                  {duration.text}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#7b1f13] uppercase">
                  Total Passenger
                </span>
                <span className="font-bold text-[#2a1b10] mt-0.5 block">
                  {adults} Adults | {children} Children | {infants} Infants
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: Day-To-Day Plan */}
        {/* ==================================================================== */}
        {days.length > 0 && (
          <section className="space-y-4">
            <SectionBanner title="Day-To-Day Plan" />

            <div className="space-y-6">
              {days.map((day, i) => {
                const dayNum = day.day ?? i + 1;
                const headerText = formatDayHeader(dayNum, day.date || day.title);
                const displayTitle = day.subtitle || (day.title !== headerText ? day.title : "");
                const images = day.imageUrls && day.imageUrls.length > 0
                  ? day.imageUrls
                  : day.imageUrl ? [day.imageUrl] : [];

                return (
                  <article
                    key={i}
                    className="avoid-break bg-[#fcfcfc] border border-neutral-200/90 rounded-lg p-4 md:p-5 space-y-2.5 shadow-sm"
                  >
                    {/* Day Header */}
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-[#14261b]">
                        {headerText}
                      </h2>
                      {displayTitle && (
                        <h3 className="text-xs md:text-sm font-semibold text-[#1f3525] mt-0.5">
                          {displayTitle}
                        </h3>
                      )}
                    </div>

                    {/* Description Paragraphs */}
                    {day.description && (
                      <div className="text-xs md:text-sm text-neutral-700 leading-relaxed space-y-2 whitespace-pre-line">
                        {day.description}
                      </div>
                    )}

                    {/* Optional Activities */}
                    {day.optionalActivities && (
                      <div className="text-xs md:text-sm text-neutral-800 pt-1">
                        <span className="font-semibold block text-neutral-900">
                          Optional (on request):
                        </span>
                        {Array.isArray(day.optionalActivities) ? (
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-neutral-700">
                            {day.optionalActivities.map((opt, oIdx) => (
                              <li key={oIdx}>{opt}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-neutral-700 mt-0.5">{day.optionalActivities}</p>
                        )}
                      </div>
                    )}

                    {/* Activities List (backward compatibility) */}
                    {day.activities && day.activities.length > 0 && (
                      <div className="space-y-1 pt-1 text-xs text-neutral-700">
                        {day.activities.map((act, aIdx) => (
                          <div key={aIdx} className="flex items-baseline gap-2">
                            {act.time && (
                              <span className="font-semibold text-neutral-900 w-12 flex-shrink-0">
                                {act.time}
                              </span>
                            )}
                            <span>
                              <span className="font-medium text-neutral-900">{act.title}</span>
                              {act.description && <span> — {act.description}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Meals */}
                    {day.meals && (
                      <p className="text-xs text-neutral-700 pt-0.5 italic">
                        {day.meals}
                      </p>
                    )}

                    {/* Stay */}
                    {day.stay && (
                      <p className="text-xs md:text-sm font-bold text-[#1a2e22] pt-0.5">
                        {day.stay.startsWith("Stay:") ? day.stay : `Stay: ${day.stay}`}
                      </p>
                    )}

                    {/* Photos Gallery */}
                    {images.length > 0 && (
                      <div className={`grid gap-2.5 pt-2 ${
                        images.length === 1
                          ? "grid-cols-1"
                          : images.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-3"
                      }`}>
                        {images.slice(0, 3).map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="rounded-lg overflow-hidden border border-neutral-200/80 shadow-sm h-28 md:h-32"
                          >
                            <img
                              src={imgUrl}
                              alt={`Day ${dayNum} photo ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================================================================== */}
        {/* SECTION 4: Transportation */}
        {/* ==================================================================== */}
        <section className="avoid-break">
          <SectionBanner title="Transportation" />
          <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm text-neutral-800">
            {/* Origin */}
            <div className="flex-1 text-center md:text-left">
              <span className="font-bold block text-[#14261b]">
                {transportation.origin}
              </span>
            </div>

            {/* Car Icon Connector */}
            <div className="flex items-center justify-center gap-2 px-3 flex-shrink-0 text-[#2b3b31]">
              <div className="h-px w-6 bg-neutral-300 hidden md:block" />
              <div className="p-2 rounded-full bg-white border border-neutral-300 shadow-sm">
                <svg className="w-5 h-5 text-[#2b3b31]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 11l2-4h14l2 4M3 11v6h18v-6M5 7h14" />
                </svg>
              </div>
              <div className="h-px w-6 bg-neutral-300 hidden md:block" />
            </div>

            {/* Destination */}
            <div className="flex-1 text-center md:text-right">
              <span className="font-medium text-neutral-700 block">
                {transportation.destination}
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 5: Inclusions & Exclusions */}
        {/* ==================================================================== */}
        <section className="avoid-break">
          <SectionBanner title="Inclusions & Exclusions" />
          <div className="space-y-3">
            {/* Inclusions if present */}
            {inclusions.length > 0 && (
              <div className="border border-neutral-200 rounded-lg p-3.5 bg-[#fbfdfb]">
                <span className="text-xs font-bold text-[#1b3d26] uppercase tracking-wider block mb-2">
                  Inclusions
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold text-xs mt-0.5">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Exclusions */}
            <div className="border border-neutral-200 rounded-lg p-3.5 bg-white">
              <span className="text-xs font-bold text-[#7b1f13] uppercase tracking-wider block mb-2">
                Exclusions
              </span>
              <ul className="space-y-2 text-xs text-neutral-700">
                {activeExclusions.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-red-200">
                      ✕
                    </span>
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 6: Budget & Pricing */}
        {/* ==================================================================== */}
        <section className="avoid-break">
          <SectionBanner title="Budget & Pricing" />
          <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-[#f4f6f4] px-4 py-2 border-b border-neutral-300 font-bold text-xs md:text-sm text-[#14261b]">
              Package
            </div>
            <div className="divide-y divide-neutral-200 text-xs">
              {stays.length > 0 ? (
                stays.map((stay, sIdx) => (
                  <div key={sIdx} className="p-3.5 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-semibold text-neutral-800">
                      <div>
                        <span className="text-neutral-500 font-normal">Location </span>
                        <span>{stay.location || "Kerala, India"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-normal">Hotel Name </span>
                        <span className="font-bold text-[#14261b]">{stay.name}</span>
                        {stay.starRating && (
                          <span className="text-neutral-600 font-medium"> | {stay.starRating}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-neutral-600 pt-0.5 text-[11px]">
                      <div>
                        <span className="text-neutral-500">Night </span>
                        <span className="font-semibold text-neutral-800">{stay.nights ?? 1}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Rooms </span>
                        <span className="font-semibold text-neutral-800">{stay.rooms ?? 1}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Meal Plan </span>
                        <span className="font-semibold text-neutral-800">{stay.mealPlan || "BreakFast"}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 text-neutral-600 italic">
                  Accommodations included as per bespoke luxury itinerary package.
                </div>
              )}
            </div>

            {/* Total Pricing Row if pricing items or total exist */}
            {pricing && pricing.total > 0 && (
              <div className="bg-[#f9faf9] border-t border-neutral-300 p-3.5 flex justify-between items-center text-xs">
                <span className="font-bold text-[#14261b] uppercase tracking-wider">
                  Total Package Price
                </span>
                <span className="text-base font-bold text-[#14261b]">
                  {formatMoney(pricing.total, currency)}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 7: Hotel Terms & Conditions */}
        {/* ==================================================================== */}
        <section className="avoid-break">
          <SectionBanner title="Hotel Terms & Conditions" />
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <ul className="list-disc list-inside space-y-1.5 text-xs text-neutral-700 leading-relaxed">
              {hotelTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 8: Payment Terms & Conditions */}
        {/* ==================================================================== */}
        <section className="avoid-break">
          <SectionBanner title="Payment Terms & Conditions" />
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <ul className="list-disc list-inside space-y-1.5 text-xs text-neutral-700 leading-relaxed">
              {paymentTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 9: Important Information */}
        {/* ==================================================================== */}
        <section className="avoid-break">
          <SectionBanner title="Important Information" />
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <ul className="list-disc list-inside space-y-1.5 text-xs text-neutral-700 leading-relaxed">
              {importantInfo.map((info, i) => (
                <li key={i}>{info}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 10 & 11: Google Review, Rating, and Contact Footer */}
        {/* ==================================================================== */}
        <section className="avoid-break pt-2">
          {/* Review Card */}
          <div className="border border-neutral-300 rounded-t-xl bg-[#fbfdfb] p-6 text-center space-y-3 relative overflow-hidden">
            {/* Escora Logo */}
            <div className="flex justify-center">
              <img
                src={escoraLogoMarkPath}
                alt="Escora"
                className="h-10 w-auto object-contain"
              />
            </div>

            {/* Flight illustration */}
            <div className="relative py-2 flex items-center justify-center">
              <svg className="w-48 h-8 text-[#0d9488]" viewBox="0 0 200 30" fill="none">
                <path
                  d="M10 25 C 60 10, 140 10, 180 15"
                  stroke="#14b8a6"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {/* Airplane */}
                <g transform="translate(180, 13) rotate(15)">
                  <path
                    d="M0 0 L-8 -4 L-6 0 L-8 4 Z"
                    fill="#0d9488"
                  />
                </g>
              </svg>
            </div>

            {/* Google Review Title with G logo */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-bold text-sm text-neutral-800">Google Review</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 text-sm">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span className="text-xs text-neutral-600 font-medium ml-1">Rating</span>
              </div>
            </div>
          </div>

          {/* Contact & Social Footer */}
          <footer
            className="rounded-b-xl text-white p-4 text-xs"
            style={{ backgroundColor: "#2b3b31" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact */}
              <div className="space-y-1">
                <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-300 block mb-1">
                  Contact
                </span>
                <p className="flex items-center gap-2">
                  <span className="opacity-75">📞</span>
                  <span>{agencyPhone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="opacity-75">✉️</span>
                  <span>{agencyEmail}</span>
                </p>
              </div>

              {/* Social Media */}
              <div className="space-y-1 sm:text-right">
                <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-300 block mb-1">
                  Social Media
                </span>
                <p className="flex items-center sm:justify-end gap-1.5">
                  <span className="opacity-75">📷</span>
                  <span>{agencyInstagram}</span>
                </p>
                <p className="flex items-center sm:justify-end gap-1.5">
                  <span className="opacity-75">🌐</span>
                  <span>{agencyWebsite}</span>
                </p>
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
