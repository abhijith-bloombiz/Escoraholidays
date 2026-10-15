import { useEffect, useState } from "react";
import ItineraryPrintDocument, { type ItineraryPrintData } from "@/components/itinerary/ItineraryPrintDocument";
import { itineraryTemplates } from "@/lib/itineraryTemplates";

const template = itineraryTemplates[0];

const sampleItineraryData: ItineraryPrintData = {
  title: template.title,
  customerName: template.customerName || "MARIA ROY",
  destination: template.destination,
  startDate: template.startDate || "2026-10-29",
  endDate: template.endDate || "2026-10-31",
  coverImageUrl: template.coverImageUrl,
  summary: template.summary,
  days: template.days,
  stays: template.stays,
  inclusions: template.inclusions,
  exclusions: template.exclusions,
  pricing: template.pricing,
  currency: "INR",
  shareToken: "Q1020",
  referenceNumber: template.referenceNumber || "L100021/Q1020",
  curatorName: template.curatorName || "Midhilaj Chelakkal",
  curatorPhone: template.curatorPhone || "+91 9745585813",
  emergencyContacts: template.emergencyContacts || "+91 9400280420 | +91 8157003344",
  createdDate: template.createdDate || "01-10-2026",
  adults: template.adults ?? 1,
  children: template.children ?? 0,
  infants: template.infants ?? 0,
  tripIncludes: template.tripIncludes,
  transportation: template.transportation,
  hotelTerms: template.hotelTerms,
  paymentTerms: template.paymentTerms,
  importantInfo: template.importantInfo,
};

export default function ItineraryPdfPreviewPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      (window as unknown as { __ITINERARY_READY?: boolean }).__ITINERARY_READY = true;
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pdf-preview-root min-h-screen bg-[#ececec]">
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }
        @media screen {
          .pdf-preview-canvas {
            margin: 24px auto !important;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
            border-radius: 8px;
            overflow: hidden;
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

      <div className="no-print p-4 bg-[#2b3b31] text-white flex justify-between items-center text-xs font-mono shadow-md">
        <span className="font-semibold tracking-wider uppercase">
          Escora Holidays · Master Itinerary Reference PDF Preview
        </span>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 bg-[#caa052] text-[#14261b] font-bold rounded hover:bg-[#d8b062] transition-colors shadow-sm"
        >
          Print / Save as PDF
        </button>
      </div>

      <div id="sample-itinerary-print-wrapper" className="pdf-preview-canvas py-6 px-4 md:px-0 flex justify-center">
        <ItineraryPrintDocument data={sampleItineraryData} id="itinerary-print-target" />
      </div>
    </div>
  );
}
