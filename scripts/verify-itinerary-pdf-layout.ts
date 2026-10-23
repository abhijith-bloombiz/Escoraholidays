import * as fs from "fs";
import * as path from "path";
import jsPDFPkg from "../apps/escora-admin/node_modules/jspdf/dist/jspdf.es.min.js";
const jsPDFClass: any = (jsPDFPkg as any).jsPDF || (jsPDFPkg as any).default || jsPDFPkg;

console.log("================================================================================");
console.log("         ESCORA HOLIDAYS — ITINERARY PDF LAYOUT & PAGINATION AUDIT              ");
console.log("================================================================================");

// Partitioning logic matching ItineraryPrintDocument
function partitionDaysIntoPages(
  days: Array<{ title: string; desc?: string; stay?: string }>
): number[][] {
  const totalDays = days.length;
  if (totalDays === 0) return [];
  if (totalDays === 1) return [[0]];

  const estimatedDayHeights = days.map((day) => {
    const titleLen = day.title?.length || 0;
    const descLen = day.desc?.length || 0;
    const titleH = titleLen > 40 ? 36 : 22;
    const descH = Math.max(34, Math.ceil(descLen / 78) * 15);
    const stayH = day.stay ? 24 : 0;
    return titleH + descH + stayH + 24;
  });

  const targetUsableHeight = 840;
  let targetPages = 1;
  const totalHeight = estimatedDayHeights.reduce((a, b) => a + b, 0);

  if (totalDays <= 3 && totalHeight <= targetUsableHeight) {
    targetPages = 1;
  } else if (totalDays <= 5 && totalHeight <= targetUsableHeight + 40) {
    targetPages = 1;
  } else if (totalDays <= 6) {
    targetPages = 2;
  } else if (totalDays <= 10) {
    targetPages = 2;
  } else {
    targetPages = Math.max(2, Math.ceil(totalHeight / targetUsableHeight));
  }

  let bestPartition: number[][] = [];
  let lowestVariance = Infinity;

  function findPartitions(dayIndex: number, currentPartition: number[][], currentHeights: number[]) {
    if (dayIndex === totalDays) {
      if (currentPartition.length === targetPages) {
        const mean = currentHeights.reduce((a, b) => a + b, 0) / currentHeights.length;
        const variance = currentHeights.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
        if (variance < lowestVariance) {
          lowestVariance = variance;
          bestPartition = currentPartition.map((b) => [...b]);
        }
      }
      return;
    }

    const currentDayHeight = estimatedDayHeights[dayIndex];

    if (currentPartition.length > 0) {
      const lastBatchIdx = currentPartition.length - 1;
      const newHeight = currentHeights[lastBatchIdx] + currentDayHeight;
      if (newHeight <= 950) {
        currentPartition[lastBatchIdx].push(dayIndex);
        currentHeights[lastBatchIdx] = newHeight;
        findPartitions(dayIndex + 1, currentPartition, currentHeights);
        currentPartition[lastBatchIdx].pop();
        currentHeights[lastBatchIdx] -= currentDayHeight;
      }
    }

    if (currentPartition.length < targetPages) {
      currentPartition.push([dayIndex]);
      currentHeights.push(currentDayHeight);
      findPartitions(dayIndex + 1, currentPartition, currentHeights);
      currentPartition.pop();
      currentHeights.pop();
    }
  }

  findPartitions(0, [], []);

  if (bestPartition.length === 0) {
    const baseSize = Math.floor(totalDays / targetPages);
    const remainder = totalDays % targetPages;
    let curr = 0;
    for (let p = 0; p < targetPages; p++) {
      const size = baseSize + (p < remainder ? 1 : 0);
      const batch: number[] = [];
      for (let i = 0; i < size && curr < totalDays; i++) {
        batch.push(curr++);
      }
      if (batch.length > 0) bestPartition.push(batch);
    }
  }

  return bestPartition;
}

interface PagePlan {
  type: "cover" | "days" | "days-and-services" | "services" | "investment" | "services-and-investment";
  title: string;
  dayIndices?: number[];
  includeAccommodations?: boolean;
  includeTransportation?: boolean;
  includeInclusionsExclusions?: boolean;
  includeInvestment?: boolean;
  showPanorama?: boolean;
}

function calculatePdfLayout(
  days: Array<{ title: string; desc?: string; stay?: string }>,
  staysCount: number,
  transportsCount: number
): {
  pagePlans: PagePlan[];
  totalPages: number;
} {
  const totalDays = days.length;
  const dayBatches = partitionDaysIntoPages(days);
  const pagePlans: PagePlan[] = [];

  pagePlans.push({ type: "cover", title: "Cover Page" });

  if (totalDays === 1) {
    pagePlans.push({
      type: "days-and-services",
      dayIndices: [0],
      title: "Day-To-Day Plan & Complete Services",
      includeAccommodations: true,
      includeTransportation: true,
      includeInclusionsExclusions: true,
      includeInvestment: true,
    });
  } else {
    dayBatches.forEach((batch, idx) => {
      const isFirstDayPage = idx === 0;
      const isLastDayBatch = idx === dayBatches.length - 1;

      if (dayBatches.length > 1 && isLastDayBatch && batch.length <= 3 && staysCount <= 4 && transportsCount <= 2) {
        pagePlans.push({
          type: "days-and-services",
          dayIndices: batch,
          title: dayBatches.length > 1 ? "Day-To-Day Plan (Continued) & Accommodations" : "Day-To-Day Plan & Accommodations",
          includeAccommodations: true,
          includeTransportation: true,
          includeInclusionsExclusions: false,
          includeInvestment: false,
        });
      } else {
        pagePlans.push({
          type: "days",
          dayIndices: batch,
          title: isFirstDayPage ? "Day-To-Day Plan" : "Day-To-Day Plan (Continued)",
        });
      }
    });

    const lastPlan = pagePlans[pagePlans.length - 1];
    if (lastPlan.type === "days-and-services") {
      pagePlans.push({
        type: "investment",
        title: "Inclusions, Investment & Policies",
        includeInclusionsExclusions: true,
      });
    } else {
      const canFitCombined = staysCount <= 4 && transportsCount <= 2;
      if (canFitCombined) {
        pagePlans.push({
          type: "services-and-investment",
          title: "Included Services & Investment",
        });
      } else {
        pagePlans.push({
          type: "services",
          title: "Included Accommodations & Logistics",
          showPanorama: true,
        });
        pagePlans.push({
          type: "investment",
          title: "Inclusions, Investment & Policies",
          includeInclusionsExclusions: true,
        });
      }
    }
  }

  return { pagePlans, totalPages: pagePlans.length };
}

let passes = 0;
let fails = 0;

function assert(condition: boolean, desc: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    if (details) console.log(`         ↳ ${details}`);
    passes++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    if (details) console.error(`         ↳ ${details}`);
    fails++;
  }
}

// -------------------------------------------------------------------------------
// SCENARIO 1: 1-Day Itinerary (Varkala Coastal Escape)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 1: 1-Day Itinerary (Varkala Escape) ---");
const varkalaDays = [
  {
    title: "Arrival in Varkala",
    desc: "Arrive in Varkala, check into the resort. Spend afternoon exploring cliff views and sunset at Papanasam Beach.",
    stay: "Gateway Varkala - IHCL SeleQtions",
  },
];
const varkalaResult = calculatePdfLayout(varkalaDays, 1, 1);

assert(
  varkalaResult.totalPages === 2,
  "1.1 1-day itinerary produces exactly 2 pages (Cover + Combined Day, Services & Investment)",
  `Total pages: ${varkalaResult.totalPages}`
);
assert(
  varkalaResult.pagePlans[1].type === "days-and-services" &&
    varkalaResult.pagePlans[1].includeInvestment === true,
  "1.2 Page 2 hosts Day 1 + Stays + Transport + Inclusions + Pricing without empty gaps",
  varkalaResult.pagePlans[1].title
);

// -------------------------------------------------------------------------------
// SCENARIO 2: 3-Day Template (Explora Trivandrum)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 2: 3-Day Template (Explora Trivandrum) ---");
const exploraDays = [
  {
    title: "Arrival in Trivandrum · Heritage & Coastal Transition",
    desc: "Private airport pickup and heritage sightseeing in Trivandrum city.",
    stay: "Uday Samudra Leisure Beach Hotel",
  },
  {
    title: "Trivandrum to Kovalam · Poovar Mangrove Cruise",
    desc: "Drive to Kovalam with a scenic Poovar Island backwater cruise.",
    stay: "The Leela Kovalam, a Raviz Hotel",
  },
  {
    title: "Kovalam Shoreline & Departure",
    desc: "Morning breakfast by the sea, leisure shopping, and airport chauffeur transfer.",
    stay: "Departure Transfer",
  },
];
const exploraResult = calculatePdfLayout(exploraDays, 2, 1);

assert(
  exploraResult.totalPages === 3,
  "2.1 3-day itinerary produces 3 balanced pages (Cover + 3 Days + Combined Services & Investment)",
  `Total pages: ${exploraResult.totalPages}`
);
assert(
  exploraResult.pagePlans[1].dayIndices?.length === 3,
  "2.2 Page 2 contains all 3 days together",
  `Days on Page 2: ${exploraResult.pagePlans[1].dayIndices?.length}`
);
assert(
  exploraResult.pagePlans[2].type === "services-and-investment",
  "2.3 Page 3 combines Services and Investment cleanly",
  exploraResult.pagePlans[2].title
);

// -------------------------------------------------------------------------------
// SCENARIO 3: 5-Day Template (Kozhikode & Wayanad)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 3: 5-Day Template (Kozhikode & Wayanad) ---");
const kozhikodeDays = [
  { title: "Arrival in Kozhikode — City & Beach Leisure", desc: "Arrival at Kozhikode airport and hotel check-in.", stay: "The Gateway Hotel Beach Road" },
  { title: "Kozhikode to Wayanad — Ghat Pass & Waterfalls", desc: "Drive up the scenic Thamarassery Churam pass to Wayanad.", stay: "Vythiri Resort" },
  { title: "Wayanad Heritage & Nature Trails", desc: "Visit Edakkal Caves and tea plantation viewpoints.", stay: "Vythiri Resort" },
  { title: "Banasura Sagar Dam & Spice Trails", desc: "Explore Banasura dam and spice markets.", stay: "Vythiri Resort" },
  { title: "Wayanad to Kozhikode — Departure", desc: "Disembark and return to Kozhikode for departure.", stay: "Departure Transfer" },
];
const kozhikodeResult = calculatePdfLayout(kozhikodeDays, 2, 1);

assert(
  kozhikodeResult.totalPages === 3,
  "3.1 5-day itinerary produces 3 balanced pages without overflowing a lone day onto an empty page",
  `Total pages: ${kozhikodeResult.totalPages}`
);
assert(
  kozhikodeResult.pagePlans[1].dayIndices?.length === 5,
  "3.2 All 5 days fit on Page 2 within the usable height budget",
  `Days: ${kozhikodeResult.pagePlans[1].dayIndices?.length}`
);
assert(
  kozhikodeResult.pagePlans[2].type === "services-and-investment",
  "3.3 Page 3 cleanly unites Services and Investment",
  kozhikodeResult.pagePlans[2].title
);

// -------------------------------------------------------------------------------
// SCENARIO 4: 6-Day Itinerary (Kerala Classic)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 4: 6-Day Itinerary (Kerala Classic) ---");
const keralaClassicDays = [
  { title: "Arrival in Kochi — Fort Kochi & Mattancherry Heritage", desc: "Chauffeur transfer to Fort Kochi colonial quarter.", stay: "Brunton Boatyard" },
  { title: "Kochi to Munnar — Scenic Hill Route & Waterfalls", desc: "Scenic drive through Western Ghats with waterfall stops.", stay: "Fragrant Nature Resort" },
  { title: "Munnar Sightseeing — Eravikulam & Tea Hills", desc: "Full day in Eravikulam National Park and tea gardens.", stay: "Fragrant Nature Resort" },
  { title: "Munnar to Thekkady — Periyar Wildlife Sanctuary", desc: "Drive to Thekkady, spice plantation tour and Periyar Lake cruise.", stay: "Spice Village" },
  { title: "Thekkady to Alappuzha — Private Backwater Houseboat", desc: "Board traditional luxury kettuvallam houseboat.", stay: "Escora Houseboat" },
  { title: "Alappuzha to Cochin Airport — Departure", desc: "Disembark after waterside breakfast, transfer to airport.", stay: "Departure Transfer" },
];
const keralaClassicResult = calculatePdfLayout(keralaClassicDays, 4, 1);

assert(
  keralaClassicResult.totalPages === 4,
  "4.1 6-day itinerary produces 4 comprehensive pages (Cover + Days 1-3 + Days 4-6 & Stays + Investment)",
  `Total pages: ${keralaClassicResult.totalPages}`
);
assert(
  keralaClassicResult.pagePlans[1].dayIndices?.length === 3 &&
    keralaClassicResult.pagePlans[2].dayIndices?.length === 3,
  "4.2 Days 1–6 split evenly 3 + 3 (no 4-2 or lonely day overflow)",
  `Distribution: [${keralaClassicResult.pagePlans[1].dayIndices?.length}, ${keralaClassicResult.pagePlans[2].dayIndices?.length}]`
);
assert(
  keralaClassicResult.pagePlans[2].type === "days-and-services" &&
    keralaClassicResult.pagePlans[2].includeAccommodations === true,
  "4.3 Page 3 absorbs Accommodations & Transport directly below Days 4–6",
  keralaClassicResult.pagePlans[2].title
);
assert(
  keralaClassicResult.pagePlans[3].type === "investment" &&
    keralaClassicResult.pagePlans[3].includeInclusionsExclusions === true,
  "4.4 Page 4 holds Inclusions/Exclusions, Investment Breakdown, and Full Terms",
  keralaClassicResult.pagePlans[3].title
);

// -------------------------------------------------------------------------------
// SCENARIO 5: 9-Day Itinerary (Kerala Group Quote)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 5: 9-Day Itinerary (Kerala Group Quote) ---");
const groupDays = [
  { title: "Cochin Arrival & Sightseeing", desc: "Pickup from Cochin Airport / Railway Station and transfer to hotel." },
  { title: "Cochin to Munnar", desc: "Morning drive to Munnar, scenic hills and waterfalls." },
  { title: "Munnar Sightseeing", desc: "Full day sightseeing in Munnar tea plantations." },
  { title: "Munnar to Thekkady", desc: "Scenic drive to Thekkady, spice plantations." },
  { title: "Thekkady to Alleppey", desc: "Transfer to Alleppey for day cruise." },
  { title: "Alleppey to Kovalam", desc: "Drive to Kovalam beach resort." },
  { title: "Kovalam & Kanyakumari Excursion", desc: "Day trip to Kanyakumari Vivekananda Rock." },
  { title: "Kovalam Beach Leisure", desc: "Relaxation by lighthouse beach." },
  { title: "Kovalam to Trivandrum Departure", desc: "Transfer to Trivandrum airport for departure." },
];
const groupResult = calculatePdfLayout(groupDays, 6, 1);

assert(
  groupResult.totalPages === 5,
  "5.1 9-day itinerary produces 5 balanced pages (Cover + Days 1-4 + Days 5-9 + Accommodations/Transport/Panorama + Inclusions/Investment/Terms)",
  `Total pages: ${groupResult.totalPages}`
);
assert(
  groupResult.pagePlans[3].type === "services" &&
    groupResult.pagePlans[3].showPanorama === true,
  "5.2 Page 4 holds 6 Stays + Transport + Destination Panorama",
  groupResult.pagePlans[3].title
);
assert(
  groupResult.pagePlans[4].type === "investment" &&
    groupResult.pagePlans[4].includeInclusionsExclusions === true,
  "5.3 Page 5 holds Inclusions/Exclusions + Investment + Terms + Safeguards + Closing Footer",
  groupResult.pagePlans[4].title
);

// -------------------------------------------------------------------------------
// SCENARIO 6: Generating jsPDF Sample Artifacts
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 6: Generating Sample PDF Dossiers ---");

function createSampleDossierPdf(options: {
  title: string;
  customerName: string;
  duration: string;
  totalDays: number;
  filename: string;
  staysCount: number;
  transportsCount: number;
}) {
  const doc = new jsPDFClass({ orientation: "portrait", unit: "mm", format: "a4" });
  const layout = calculatePdfLayout(
    Array.from({ length: options.totalDays }).map((_, i) => ({
      title: `Day ${i + 1} Itinerary Exploration`,
      desc: `Curated sightseeing and slow luxury travel across God's Own Country for Day ${i + 1}.`,
      stay: `Luxury Resort ${i + 1}`,
    })),
    options.staysCount,
    options.transportsCount
  );

  for (let p = 0; p < layout.totalPages; p++) {
    if (p > 0) doc.addPage();
    doc.setFillColor(p === 0 ? "#FAF7F1" : "#FAF7F1");
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor("#39271F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`ESCORA HOLIDAYS — ${layout.pagePlans[p].title}`, 20, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Client: ${options.customerName} | Package: ${options.title} | Page ${p + 1} of ${layout.totalPages}`, 20, 35);
  }

  doc.save(options.filename);
  return { pages: layout.totalPages, filename: options.filename };
}

const sample3DPdf = createSampleDossierPdf({
  title: "Explora Trivandrum",
  customerName: "MR. & MRS. ALEXANDER VANE",
  duration: "2N | 3D",
  totalDays: 3,
  staysCount: 2,
  transportsCount: 1,
  filename: path.resolve(process.cwd(), "sample-trivandrum-3d.pdf"),
});
assert(sample3DPdf.pages === 3, "6.1 Sample 3D PDF generated with 3 pages", sample3DPdf.filename);

const sample6DPdf = createSampleDossierPdf({
  title: "Kerala Classic",
  customerName: "MR. & MRS. DAVID STERLING",
  duration: "5N | 6D",
  totalDays: 6,
  staysCount: 4,
  transportsCount: 1,
  filename: path.resolve(process.cwd(), "sample-kerala-classic-6d.pdf"),
});
assert(sample6DPdf.pages === 4, "6.2 Sample 6D PDF generated with 4 pages", sample6DPdf.filename);

console.log("\n================================================================================");
console.log(`TOTAL AUDIT CHECKS: ${passes + fails} | PASSED: ${passes} | FAILED: ${fails}`);
console.log("================================================================================");

if (fails > 0) {
  process.exit(1);
}
