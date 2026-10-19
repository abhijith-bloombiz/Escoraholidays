import { useEffect, useState } from "react";
import ItineraryPrintDocument, { type ItineraryPrintData } from "@/components/itinerary/ItineraryPrintDocument";
import { itineraryTemplates, type ItineraryTemplate } from "@/lib/itineraryTemplates";

function templateToPrintData(t: ItineraryTemplate): ItineraryPrintData {
  return {
    title: t.title,
    customerName: t.customerName || "MARIA ROY",
    destination: t.destination,
    startDate: t.startDate || "2026-10-29",
    endDate: t.endDate,
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
    emergencyContacts: t.emergencyContacts || "+91 9400280420 | +91 8157003344",
    createdDate: t.createdDate || "29-10-2026",
    adults: t.adults ?? 2,
    children: t.children ?? 0,
    infants: t.infants ?? 0,
    tripIncludes: t.tripIncludes,
    transportation: t.transportation,
    hotelTerms: t.hotelTerms,
    paymentTerms: t.paymentTerms,
    importantInfo: t.importantInfo,
  };
}

export default function ItineraryPdfPreviewPage() {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("template") || itineraryTemplates[0]?.id || "explora-trivandrum";
  });
  const [ready, setReady] = useState(false);

  const activeTemplate =
    itineraryTemplates.find((t) => t.id === selectedId) || itineraryTemplates[0];

  const printData = templateToPrintData(activeTemplate);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      (window as unknown as { __ITINERARY_READY?: boolean }).__ITINERARY_READY = true;
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedId]);

  return (
    <div className="pdf-preview-root min-h-screen bg-[#ececec]">
      <style>{`
        @page {
          size: 210mm 297mm;
          margin: 0;
        }
        @media screen {
          .pdf-preview-canvas {
            margin: 24px auto !important;
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
          }
          .no-print {
            display: none !important;
          }
          .pdf-preview-canvas {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className="no-print p-4 bg-[#2b3b31] text-white flex flex-wrap justify-between items-center gap-3 text-xs shadow-md">
        <div className="flex items-center gap-4">
          <span className="font-semibold tracking-wider uppercase">
            Escora Holidays · PDF Preview
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[#BE8C70]">Template:</span>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                const url = new URL(window.location.href);
                url.searchParams.set("template", e.target.value);
                window.history.replaceState({}, "", url.toString());
              }}
              className="bg-[#1e2a23] text-white border border-[#3d5244] px-2.5 py-1 rounded text-xs focus:outline-none focus:border-[#caa052]"
            >
              {itineraryTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.days.length} Days)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#BE8C70]">
            {activeTemplate.days.length} Days · {activeTemplate.stays.length} Stays
          </span>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-[#caa052] text-[#14261b] font-bold rounded hover:bg-[#d8b062] transition-colors shadow-sm"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div id="sample-itinerary-print-wrapper" className="pdf-preview-canvas py-6 px-4 md:px-0 flex justify-center">
        <ItineraryPrintDocument data={printData} id="itinerary-print-target" />
      </div>
    </div>
  );
}
