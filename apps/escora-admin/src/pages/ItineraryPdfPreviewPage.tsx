import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ItineraryPrintDocument, { type ItineraryPrintData } from "@/components/itinerary/ItineraryPrintDocument";
import { itineraryTemplates, type ItineraryTemplate } from "@/lib/itineraryTemplates";
import { downloadElementAsPdf, formatItineraryPdfFilename, type PdfPageMode } from "@/lib/pdfDownload";
import {
  useGetItinerary,
  getGetItineraryQueryKey,
} from "@workspace/api-client-react";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  parseTripIncludes,
  parseTransportation,
  DEFAULT_WE_ALSO_PROVIDE_OPTIONS,
} from "@/lib/itinerary";
import { Loader2, Download, Printer, ArrowLeft, Layers, ChevronDown } from "lucide-react";

function templateToPrintData(t: ItineraryTemplate): ItineraryPrintData {
  return {
    title: t.title,
    customerName: t.customerName || "MARIA ROY",
    destination: t.destination,
    startDate: t.startDate || "2026-10-29",
    endDate: t.endDate || "2026-10-31",
    coverImageUrl: t.coverImageUrl,
    summary: t.summary,
    days: t.days,
    stays: t.stays,
    inclusions: t.inclusions,
    exclusions: t.exclusions,
    pricing: t.pricing,
    currency: "INR",
    shareToken: "Q1020",
    referenceNumber: t.referenceNumber || "L100021/Q1020",
    curatorName: t.curatorName || "Midhilaj Chelakkal",
    curatorPhone: t.curatorPhone || "+91 9745585813",
    emergencyContacts: t.emergencyContacts || "+91 9400 280 420 | +91 8157 003 344",
    createdDate: t.createdDate || "01-10-2026",
    adults: t.adults ?? 1,
    children: t.children ?? 0,
    infants: t.infants ?? 0,
    tripIncludes: t.tripIncludes || {
      hotel: true,
      transport: true,
      sightseeing: true,
      transfer: true,
      weAlsoProvide: [...DEFAULT_WE_ALSO_PROVIDE_OPTIONS],
    },
    weAlsoProvide: t.tripIncludes?.weAlsoProvide || [...DEFAULT_WE_ALSO_PROVIDE_OPTIONS],
    transportation: t.transportation,
    hotelTerms: t.hotelTerms,
    paymentTerms: t.paymentTerms,
    importantInfo: t.importantInfo,
  };
}

export default function ItineraryPdfPreviewPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  const itineraryId = idParam ? Number(idParam) : undefined;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    return params.get("template") || itineraryTemplates[0]?.id || "explora-trivandrum";
  });
  const [downloading, setDownloading] = useState(false);
  const [ready, setReady] = useState(false);
  const [pdfMode, setPdfMode] = useState<PdfPageMode>("single-page");

  const { data: dbItinerary, isLoading: isLoadingDb } = useGetItinerary(
    itineraryId!,
    {
      query: {
        enabled: Boolean(itineraryId && !Number.isNaN(itineraryId)),
        queryKey: itineraryId ? getGetItineraryQueryKey(itineraryId) : ["itinerary-disabled"],
        staleTime: 0,
        refetchOnMount: "always",
      },
    }
  );

  const activeTemplate =
    itineraryTemplates.find((t) => t.id === selectedTemplateId) || itineraryTemplates[0];

  let printData: ItineraryPrintData;

  if (dbItinerary) {
    const parsedTripInc = parseTripIncludes(dbItinerary.tripIncludes);
    printData = {
      title: dbItinerary.title,
      customerName: dbItinerary.customerName,
      destination: dbItinerary.destination,
      startDate: dbItinerary.startDate,
      endDate: dbItinerary.endDate,
      coverImageUrl: dbItinerary.coverImageUrl,
      summary: dbItinerary.summary,
      days: parseDays(dbItinerary.days),
      stays: parseStays(dbItinerary.stays),
      inclusions: parseStringList(dbItinerary.inclusions),
      exclusions: parseStringList(dbItinerary.exclusions),
      pricing: parsePricing(dbItinerary.pricing),
      currency: dbItinerary.currency || "INR",
      shareToken: dbItinerary.shareToken,
      referenceNumber: dbItinerary.referenceNumber,
      curatorName: dbItinerary.curatorName,
      curatorPhone: dbItinerary.curatorPhone,
      emergencyContacts: dbItinerary.emergencyContacts,
      createdDate: dbItinerary.createdAt ? String(dbItinerary.createdAt) : undefined,
      adults: dbItinerary.adults,
      children: dbItinerary.children,
      infants: dbItinerary.infants,
      tripIncludes: parsedTripInc,
      weAlsoProvide: parsedTripInc.weAlsoProvide,
      transportation: parseTransportation(dbItinerary.transportation),
      hotelTerms: parseStringList(dbItinerary.hotelTerms),
      paymentTerms: parseStringList(dbItinerary.paymentTerms),
      importantInfo: parseStringList(dbItinerary.importantInfo),
      agencyPhone: parsedTripInc.agencyContact?.phone,
      agencyEmail: parsedTripInc.agencyContact?.email,
      agencyInstagram: parsedTripInc.agencyContact?.instagram,
      agencyFacebook: parsedTripInc.agencyContact?.facebook,
      agencyWebsite: parsedTripInc.agencyContact?.website,
    };
  } else {
    printData = templateToPrintData(activeTemplate);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      (window as unknown as { __ITINERARY_READY?: boolean }).__ITINERARY_READY = true;
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedTemplateId, dbItinerary]);

  async function handleDownloadPdf() {
    try {
      setDownloading(true);
      const filename = formatItineraryPdfFilename(printData.title);
      await downloadElementAsPdf("itinerary-print-target", filename, { mode: pdfMode });
    } catch (err) {
      console.error("[PDF Preview] Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="pdf-preview-root min-h-screen bg-[#F4F5F6] text-neutral-900">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        @media screen {
          .pdf-preview-canvas {
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
        }
        @media print {
          html, body, .pdf-preview-root, #sample-itinerary-print-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .pdf-preview-canvas,
          .pdf-preview-canvas > div {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Top Action Header Bar (Standard Clean Neutral Toolbar) */}
      <header className="no-print sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-2xs">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sm:gap-4 flex-nowrap">
          {/* Left Group: Back Button, Title, and Proposal / Template details */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {/* Back Button */}
            <button
              onClick={() => {
                navigate("/itineraries");
              }}
              className="inline-flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 bg-neutral-50 border border-neutral-200 transition-colors text-xs font-medium cursor-pointer shrink-0"
              title="Return to Itineraries"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-4 w-px bg-neutral-200 shrink-0" />

            {/* Page Title */}
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 shrink-0 tracking-tight">
              Itinerary Preview
            </span>

            {/* Proposal Badge (when viewing a specific DB itinerary) */}
            {dbItinerary && (
              <div
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-xs min-w-0 max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl truncate"
                title={`Proposal #${dbItinerary.id}: ${dbItinerary.title}`}
              >
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-white text-neutral-700 border border-neutral-200 shrink-0">
                  #{dbItinerary.id}
                </span>
                <span className="truncate text-neutral-700 font-medium text-[11.5px]">
                  {dbItinerary.title}
                </span>
              </div>
            )}

            {/* Template Selector (when viewing sample templates) */}
            {!itineraryId && (
              <div className="flex items-center gap-1.5 text-xs shrink-0">
                <span className="text-neutral-500 text-xs font-medium hidden sm:inline">Template:</span>
                <div className="relative flex items-center">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      const url = new URL(window.location.href);
                      url.searchParams.set("template", e.target.value);
                      window.history.replaceState({}, "", url.toString());
                    }}
                    className="bg-white text-neutral-800 font-medium text-xs border border-neutral-300 hover:border-neutral-400 rounded-md pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer shadow-2xs transition-colors appearance-none"
                  >
                    {itineraryTemplates.map((t) => (
                      <option key={t.id} value={t.id} className="bg-white text-neutral-900">
                        {t.label} ({t.days.length} Days)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Right Group: Format Picker, Print, and Download PDF Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Format Selector */}
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-neutral-500 text-xs font-medium hidden md:inline">Format:</span>
              <div className="relative flex items-center">
                <select
                  value={pdfMode}
                  onChange={(e) => setPdfMode(e.target.value as PdfPageMode)}
                  className="bg-white text-neutral-800 font-medium text-xs border border-neutral-300 hover:border-neutral-400 rounded-md pl-7 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer shadow-2xs transition-colors appearance-none"
                >
                  <option value="single-page">1-Page Continuous (Reference style)</option>
                  <option value="multi-page">Multi-Page A4 (Standard sheets)</option>
                </select>
                <Layers className="w-3.5 h-3.5 text-neutral-500 absolute left-2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 pointer-events-none" />
              </div>
            </div>

            {/* Print / Save as PDF Button */}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-700 hover:text-neutral-900 font-medium rounded-md text-xs transition-all flex items-center gap-1.5 border border-neutral-300 shadow-2xs cursor-pointer"
              title="Open system print dialog"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3.5 sm:px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-medium rounded-md text-xs transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              title="Directly download high-resolution PDF"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas Display */}
      <main
        id="sample-itinerary-print-wrapper"
        className="pdf-preview-canvas py-8 sm:py-10 px-3 sm:px-6 flex justify-center"
      >
        <div className="w-full max-w-[794px] bg-white rounded-lg shadow-sm border border-neutral-200/80 overflow-hidden transition-all duration-300">
          <ItineraryPrintDocument data={printData} id="itinerary-print-target" />
        </div>
      </main>
    </div>
  );
}
