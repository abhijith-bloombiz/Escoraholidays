import { useEffect, useState } from "react";
import ItineraryPrintDocument, { type ItineraryPrintData } from "@/components/itinerary/ItineraryPrintDocument";
import { itineraryTemplates } from "@/lib/itineraryTemplates";

const template = itineraryTemplates[0];

const sampleItineraryData: ItineraryPrintData = {
  title: template.title,
  customerName: "Lord & Lady Harrington",
  destination: template.destination,
  startDate: "2026-11-10",
  endDate: "2026-11-15",
  coverImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80",
  summary: "A private, bespoke journey through the royal heritage of Fort Kochi, misty tea terraces of the Western Ghats, and the tranquil labyrinth of the Alleppey backwaters.",
  days: template.days,
  stays: template.stays,
  inclusions: [
    "5 Nights in luxury heritage hotel, mountain resort & private kettuvallam houseboat",
    "Daily artisan breakfast & all gourmet meals aboard the private houseboat",
    "Private air-conditioned chauffeur-driven luxury SUV throughout all transfers",
    "All toll fees, fuel, parking charges, interstate permits & driver allowances",
    "Dedicated Escora Concierge & 24/7 personal travel specialist support",
    "Exclusive private backwater cruise through Vembanad Lake & Alleppey canals",
    "Guided spice plantation walk in Thekkady with master naturalist",
    "Kathakali cultural dance performance reserved VIP seating in Fort Kochi",
  ],
  exclusions: [
    "International and domestic flight airfares",
    "Personal expenses, telephone, laundry, and alcoholic beverages",
    "Optional adventure sports (Jeep safari, zipline, kayaking)",
    "Gratuities and tips for guides and drivers",
    "Comprehensive travel and medical insurance",
  ],
  pricing: {
    items: [
      { label: "Luxury Heritage & Resort Accommodations (5 Nights)", amount: 165000 },
      { label: "Private Luxury Transport & Chauffeur Services", amount: 48000 },
      { label: "Curated Guided Experiences, Forest Permits & Private Boat Cruises", amount: 32000 },
    ],
    discount: 15000,
    taxes: 12250,
    total: 242250,
    notes: "Pricing valid for travel dates specified. Includes all statutory Goods & Services Tax (GST).",
  },
  currency: "INR",
  shareToken: "kerala-luxury-preview-2026",
};

export default function ItineraryPdfPreviewPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      (window as unknown as { __ITINERARY_READY?: boolean }).__ITINERARY_READY = true;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pdf-preview-root">
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media screen {
          body {
            margin: 0;
            padding: 0;
            background: #d8d0c2;
            font-family: 'Playfair Display', Georgia, serif;
          }
          .a4-page {
            margin: 20px auto !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          }
        }
        @media print {
          html, body, .pdf-preview-root, #sample-itinerary-print-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff3d9 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-page {
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            break-after: page !important;
            break-inside: avoid !important;
          }
          .a4-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div className="no-print p-4 bg-[#143423] text-[#fff3d9] flex justify-between items-center text-xs font-mono">
        <span>Escora Holidays · Luxury PDF Dossier Preview</span>
        <button
          onClick={() => window.print()}
          className="px-3 py-1 bg-[#b8934f] text-[#143423] font-bold rounded hover:bg-[#c29d59]"
        >
          Print / Save as PDF
        </button>
      </div>

      <div id="sample-itinerary-print-wrapper">
        <ItineraryPrintDocument data={sampleItineraryData} id="itinerary-print-target" />
      </div>
    </div>
  );
}
