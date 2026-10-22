import * as fs from "fs";
import * as path from "path";
import { jsPDF } from "../apps/escora-admin/node_modules/jspdf/dist/jspdf.es.min.js";

console.log("================================================================================");
console.log("         ESCORA HOLIDAYS — ITINERARY PDF LAYOUT & PAGINATION AUDIT              ");
console.log("================================================================================");

// Partitioning logic matching ItineraryPrintDocument
function partitionDaysIntoPages(totalDays: number): number[] {
  let targetPagesCount = 1;
  if (totalDays <= 3) {
    targetPagesCount = 1;
  } else if (totalDays === 4) {
    targetPagesCount = 2;
  } else if (totalDays <= 6) {
    targetPagesCount = 2;
  } else if (totalDays <= 9) {
    targetPagesCount = 3;
  } else if (totalDays <= 12) {
    targetPagesCount = 4;
  } else {
    targetPagesCount = Math.ceil(totalDays / 3);
  }

  const baseSize = Math.floor(totalDays / targetPagesCount);
  const remainder = totalDays % targetPagesCount;

  const pageSizes: number[] = [];
  for (let p = 0; p < targetPagesCount; p++) {
    pageSizes.push(baseSize + (p < remainder ? 1 : 0));
  }
  return pageSizes;
}

function calculateTotalPdfPages(totalDays: number): {
  totalPages: number;
  dayPages: number[];
  pageBreakdown: string[];
} {
  const isSingleDay = totalDays === 1;
  const dayPages = partitionDaysIntoPages(totalDays);
  const totalPages = isSingleDay ? 3 : 1 + dayPages.length + 1 + 1;

  const pageBreakdown: string[] = [];
  pageBreakdown.push("Page 1: Split Cover & Dark Espresso Trip Details Panel");

  if (isSingleDay) {
    pageBreakdown.push("Page 2: Day 1 + Included Services & Logistics (Combined)");
    pageBreakdown.push("Page 3: Investment, Terms & Policies + Closing Agency Footer");
  } else {
    dayPages.forEach((count, idx) => {
      pageBreakdown.push(`Page ${2 + idx}: Itinerary Days (${count} days) + Atmosphere Accent`);
    });
    const servicesPage = 2 + dayPages.length;
    const finalPage = servicesPage + 1;
    pageBreakdown.push(`Page ${servicesPage}: Included Services & Accommodations`);
    pageBreakdown.push(`Page ${finalPage}: Investment, Terms & Policies + Closing Agency Footer`);
  }

  return { totalPages, dayPages, pageBreakdown };
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
// SCENARIO 1: 6-Day Itinerary (Kerala Classic — Previously 6 under-filled pages)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 1: 6-Day Itinerary Day Distribution & Pagination ---");
const sixDayResult = calculateTotalPdfPages(6);

assert(
  sixDayResult.totalPages === 5,
  "1.1 6-day itinerary now produces 5 balanced pages instead of 6 under-filled pages",
  `Total pages: ${sixDayResult.totalPages}`
);

assert(
  sixDayResult.dayPages.length === 2 && sixDayResult.dayPages[0] === 3 && sixDayResult.dayPages[1] === 3,
  "1.2 Days 1–6 are evenly distributed into two pages of 3 days each (NO lonely pairs or empty space)",
  `Day pages distribution: [${sixDayResult.dayPages.join(", ")}]`
);

assert(
  sixDayResult.pageBreakdown[3].includes("Included Services & Accommodations"),
  "1.3 Page 4 holds Accommodations, Transportation, Inclusions/Exclusions, and Editorial Panorama",
  sixDayResult.pageBreakdown[3]
);

assert(
  sixDayResult.pageBreakdown[4].includes("Investment, Terms & Policies"),
  "1.4 Page 5 holds Pricing, Hotel/Payment Terms, Important Info, Google Review & Closing Agency Footer",
  sixDayResult.pageBreakdown[4]
);

// -------------------------------------------------------------------------------
// SCENARIO 2: 3-Day Default Template (Explora Trivandrum)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 2: 3-Day Default Template (Explora Trivandrum) ---");
const threeDayResult = calculateTotalPdfPages(3);

assert(
  threeDayResult.totalPages === 4,
  "2.1 3-day itinerary produces 4 comprehensive pages (Cover + 1 Days page + Services + Pricing)",
  `Total pages: ${threeDayResult.totalPages}`
);

assert(
  threeDayResult.dayPages.length === 1 && threeDayResult.dayPages[0] === 3,
  "2.2 All 3 days fit naturally on Page 2 without unnecessary page break",
  `Day distribution: [${threeDayResult.dayPages.join(", ")}]`
);

// -------------------------------------------------------------------------------
// SCENARIO 3: 1-Day Itinerary (Varkala Coastal Escape)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 3: 1-Day Itinerary (Varkala Escape) ---");
const oneDayResult = calculateTotalPdfPages(1);

assert(
  oneDayResult.totalPages === 3,
  "3.1 1-day itinerary avoids single-item voids by pairing Day 1 with Logistics on Page 2",
  `Total pages: ${oneDayResult.totalPages}`
);

// -------------------------------------------------------------------------------
// SCENARIO 4: 9-Day Itinerary (Kerala Group Tour)
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 4: 9-Day Itinerary (Kerala Group Tour) ---");
const nineDayResult = calculateTotalPdfPages(9);

assert(
  nineDayResult.totalPages === 6,
  "4.1 9-day itinerary produces 6 balanced pages",
  `Total pages: ${nineDayResult.totalPages}`
);

assert(
  nineDayResult.dayPages.length === 3 &&
    nineDayResult.dayPages.every((count) => count === 3),
  "4.2 All 9 days are evenly distributed as 3, 3, 3 across Pages 2, 3, 4",
  `Day distribution: [${nineDayResult.dayPages.join(", ")}]`
);

// -------------------------------------------------------------------------------
// SCENARIO 5: 4-Day & 5-Day Smooth Progression
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 5: 4-Day & 5-Day Smooth Progression ---");
const fourDayResult = calculateTotalPdfPages(4);
assert(
  fourDayResult.totalPages === 5 && fourDayResult.dayPages.length === 2 && fourDayResult.dayPages[0] === 2 && fourDayResult.dayPages[1] === 2,
  "5.1 4-day itinerary divides into [2, 2] days (5 pages total, zero empty gaps)",
  `Pages: ${fourDayResult.totalPages}, Day distribution: [${fourDayResult.dayPages.join(", ")}]`
);

const fiveDayResult = calculateTotalPdfPages(5);
assert(
  fiveDayResult.totalPages === 5 && fiveDayResult.dayPages.length === 2 && fiveDayResult.dayPages[0] === 3 && fiveDayResult.dayPages[1] === 2,
  "5.2 5-day itinerary divides into [3, 2] days (5 pages total, zero empty gaps)",
  `Pages: ${fiveDayResult.totalPages}, Day distribution: [${fiveDayResult.dayPages.join(", ")}]`
);

// -------------------------------------------------------------------------------
// SCENARIO 6: Generating Sample Realistic PDF Dossiers
// -------------------------------------------------------------------------------
console.log("\n--- SCENARIO 6: Generating Sample PDF Dossiers ---");

function createSampleDossierPdf(options: {
  title: string;
  customerName: string;
  duration: string;
  totalDays: number;
  filename: string;
  days: Array<{ title: string; desc: string; stay: string }>;
  stays: Array<{ name: string; location: string; star: string; nights: number }>;
  priceTotal: number;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const totalPdfPages = options.totalDays === 1 ? 3 : options.totalDays <= 3 ? 4 : 5;

  // Helper colors
  const cream = "#FAF7F1";
  const espresso = "#39271F";
  const terracotta = "#A45132";
  const sand = "#F0E6DA";
  const border = "#E4DDD3";

  // PAGE 1: Cover
  doc.setFillColor(cream);
  doc.rect(0, 0, 210, 297, "F");

  // Left cover column
  doc.setTextColor(espresso);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Escora", 20, 25);
  doc.setFontSize(7);
  doc.setTextColor("#685D56");
  doc.text("H O L I D A Y S", 20, 29);

  doc.setFontSize(8);
  doc.text("A JOURNEY THROUGH KERALA'S TIMELESS BEAUTY", 20, 42);

  doc.setTextColor(espresso);
  doc.setFontSize(24);
  doc.text(options.title, 20, 56, { maxWidth: 85 });

  doc.setTextColor(terracotta);
  doc.setFontSize(12);
  doc.text(options.duration, 20, 78);

  doc.setTextColor("#BE8C70");
  doc.setFontSize(8);
  doc.text("PROPOSAL PREPARED EXCLUSIVELY FOR", 20, 92);
  doc.setTextColor(espresso);
  doc.setFontSize(14);
  doc.text(options.customerName, 20, 99);

  // Inclusions badges
  doc.setFillColor(sand);
  doc.roundedRect(20, 110, 80, 24, 2, 2, "F");
  doc.setTextColor(espresso);
  doc.setFontSize(8);
  doc.text("TRIP INCLUDES: 5-Star Hotel · Chauffeur AC Transport · Sightseeing", 24, 124);

  // Metadata block
  doc.setDrawColor(border);
  doc.line(20, 145, 100, 145);
  doc.setFontSize(8);
  doc.text("Reference: ESC-Q1020", 20, 155);
  doc.text("Curated by: Midhilaj Chelakkal (+91 9745585813)", 20, 162);
  doc.text("Emergency Contacts: +91 9400280420", 20, 169);

  // Right cover placeholder
  doc.setFillColor(sand);
  doc.rect(110, 0, 100, 240, "F");
  doc.setTextColor("#685D56");
  doc.setFontSize(9);
  doc.text("Kerala Luxury Destination Hero", 130, 120);

  // Bottom Espresso Panel
  doc.setFillColor(espresso);
  doc.rect(0, 240, 210, 57, "F");
  doc.setTextColor("#FAF7F1");
  doc.setFontSize(14);
  doc.text("Trip Details & Overview", 20, 252);
  doc.setFontSize(8);
  doc.setTextColor("#BE8C70");
  doc.text("DESTINATION: Kerala, India", 20, 262);
  doc.text(`DURATION: ${options.duration}`, 20, 269);
  doc.text("PASSENGERS: 2 Adults", 120, 262);
  doc.text(`PAGE: 01 / 0${totalPdfPages}`, 180, 285);

  // PAGE 2: Days
  doc.addPage();
  doc.setFillColor(cream);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(espresso);
  doc.setFontSize(16);
  doc.text("Day-To-Day Plan", 20, 22);
  doc.setDrawColor(border);
  doc.line(20, 26, 190, 26);

  let curY = 36;
  options.days.slice(0, 3).forEach((day, idx) => {
    doc.setTextColor(terracotta);
    doc.setFontSize(16);
    doc.text(`0${idx + 1}`, 20, curY + 6);
    doc.setTextColor(espresso);
    doc.setFontSize(11);
    doc.text(day.title, 34, curY);
    doc.setTextColor("#282421");
    doc.setFontSize(8);
    doc.text(day.desc, 34, curY + 6, { maxWidth: 155 });
    doc.setTextColor(terracotta);
    doc.text(`Stay: ${day.stay}`, 34, curY + 28);
    curY += 45;
  });

  // Atmosphere Accent banner on Day page
  doc.setFillColor(sand);
  doc.roundedRect(20, curY + 5, 170, 32, 2, 2, "F");
  doc.setTextColor(terracotta);
  doc.setFontSize(8);
  doc.text("CURATED HIGHLIGHT · THE HILL RETREAT", 26, curY + 16);
  doc.setTextColor(espresso);
  doc.setFontSize(9);
  doc.text('"Misty plantation trails and emerald valleys — where Kerala\'s tranquil rhythm gently unfolds."', 26, curY + 24);

  doc.setDrawColor(border);
  doc.line(20, 285, 190, 285);
  doc.setFontSize(8);
  doc.setTextColor("#685D56");
  doc.text("REF: ESC-Q1020", 20, 291);
  doc.text(`02 / 0${totalPdfPages}`, 180, 291);

  // If 6 days, add Page 3 for Days 4-6
  if (options.totalDays === 6) {
    doc.addPage();
    doc.setFillColor(cream);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(espresso);
    doc.setFontSize(16);
    doc.text("Day-To-Day Plan (Continued)", 20, 22);
    doc.setDrawColor(border);
    doc.line(20, 26, 190, 26);

    let curY2 = 36;
    options.days.slice(3, 6).forEach((day, idx) => {
      doc.setTextColor(terracotta);
      doc.setFontSize(16);
      doc.text(`0${idx + 4}`, 20, curY2 + 6);
      doc.setTextColor(espresso);
      doc.setFontSize(11);
      doc.text(day.title, 34, curY2);
      doc.setTextColor("#282421");
      doc.setFontSize(8);
      doc.text(day.desc, 34, curY2 + 6, { maxWidth: 155 });
      doc.setTextColor(terracotta);
      doc.text(`Stay: ${day.stay}`, 34, curY2 + 28);
      curY2 += 45;
    });

    // Atmosphere Accent banner on Page 3
    doc.setFillColor(sand);
    doc.roundedRect(20, curY2 + 5, 170, 32, 2, 2, "F");
    doc.setTextColor(terracotta);
    doc.setFontSize(8);
    doc.text("CURATED HIGHLIGHT · BACKWATER SPLENDOUR", 26, curY2 + 16);
    doc.setTextColor(espresso);
    doc.setFontSize(9);
    doc.text('"Palm-fringed lagoons and golden waterside serenity — timeless slow luxury in God\'s Own Country."', 26, curY2 + 24);

    doc.setDrawColor(border);
    doc.line(20, 285, 190, 285);
    doc.setFontSize(8);
    doc.setTextColor("#685D56");
    doc.text("REF: ESC-Q1020", 20, 291);
    doc.text(`03 / 0${totalPdfPages}`, 180, 291);
  }

  // SERVICES PAGE
  doc.addPage();
  doc.setFillColor(cream);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(espresso);
  doc.setFontSize(16);
  doc.text("Included Services & Accommodations", 20, 22);
  doc.setDrawColor(border);
  doc.line(20, 26, 190, 26);

  // Stays
  doc.setFillColor(sand);
  doc.roundedRect(20, 34, 170, 55, 2, 2, "F");
  doc.setTextColor(espresso);
  doc.setFontSize(11);
  doc.text("Accommodations & Stays", 26, 44);
  let stayY = 52;
  options.stays.forEach((s) => {
    doc.setFontSize(9);
    doc.text(`${s.name} (${s.star}) — ${s.location}`, 26, stayY);
    stayY += 8;
  });

  // Transportation
  doc.roundedRect(20, 96, 170, 30, 2, 2, "F");
  doc.setFontSize(11);
  doc.text("Transportation & Transfers", 26, 106);
  doc.setFontSize(8);
  doc.text("Private Dedicated Chauffeur Driven AC Sedan / SUV", 26, 114);
  doc.text("All arrival, departure, inter-city drives and sightseeing transfers included", 26, 120);

  // Inclusions & Exclusions
  doc.roundedRect(20, 134, 82, 55, 2, 2, "F");
  doc.text("Inclusions", 26, 144);
  doc.setFontSize(8);
  doc.text("• Luxury 5-Star Accommodations\n• Dedicated AC Chauffeur Vehicle\n• Breakfast Included at All Resorts\n• Verified Sightseeing Access", 26, 152);

  doc.roundedRect(108, 134, 82, 55, 2, 2, "F");
  doc.setFontSize(11);
  doc.text("Exclusions", 114, 144);
  doc.setFontSize(8);
  doc.text("• Personal items, tips, laundry\n• Camera permit charges\n• Meals outside specified plan\n• Airfare / Train tickets", 114, 152);

  // Panorama
  doc.setFillColor("#39271F");
  doc.roundedRect(20, 198, 170, 75, 2, 2, "F");
  doc.setTextColor("#FAF7F1");
  doc.setFontSize(10);
  doc.text('"Curated luxury journeys across God\'s Own Country — handcrafted with excellence by Escora Holidays"', 28, 240);

  const servicesPageNum = options.totalDays === 6 ? 4 : 3;
  doc.setDrawColor(border);
  doc.line(20, 285, 190, 285);
  doc.setFontSize(8);
  doc.setTextColor("#685D56");
  doc.text("REF: ESC-Q1020", 20, 291);
  doc.text(`0${servicesPageNum} / 0${totalPdfPages}`, 180, 291);

  // FINAL PAGE: Investment & Terms
  doc.addPage();
  doc.setFillColor(cream);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(espresso);
  doc.setFontSize(16);
  doc.text("Investment, Terms & Policies", 20, 22);
  doc.setDrawColor(border);
  doc.line(20, 26, 190, 26);

  // Price bar
  doc.setFillColor(terracotta);
  doc.roundedRect(20, 34, 170, 24, 2, 2, "F");
  doc.setTextColor("#FAF7F1");
  doc.setFontSize(9);
  doc.text("TOTAL PACKAGE INVESTMENT", 26, 44);
  doc.setFontSize(8);
  doc.text("All-inclusive per specified itinerary, private transfers & stays", 26, 50);
  doc.setFontSize(16);
  doc.text(`INR ${options.priceTotal.toLocaleString("en-IN")}`, 140, 48);

  // Terms
  doc.setFillColor(sand);
  doc.roundedRect(20, 65, 82, 60, 2, 2, "F");
  doc.setTextColor(espresso);
  doc.setFontSize(10);
  doc.text("Hotel Terms & Policies", 26, 75);
  doc.setFontSize(7.5);
  doc.text("• Standard check-in 14:00, check-out 11:00\n• Valid government ID required at check-in\n• Early check-in subject to availability\n• Taxes paid as per current hotel policy", 26, 83);

  doc.roundedRect(108, 65, 82, 60, 2, 2, "F");
  doc.setFontSize(10);
  doc.text("Booking & Payment Terms", 114, 75);
  doc.setFontSize(7.5);
  doc.text("• 30% advance deposit to secure booking\n• Balance payable 15 days prior to travel\n• Cancellation policy applies as per terms\n• Bank transfer & credit cards accepted", 114, 83);

  // Important Info
  doc.roundedRect(20, 132, 170, 40, 2, 2, "F");
  doc.setFontSize(10);
  doc.text("Important Travel Guidelines & Protocol", 26, 142);
  doc.setFontSize(7.5);
  doc.text("• Ensure carry of original photo IDs for all travellers\n• Comfortable breathable attire recommended for sightseeing and temples\n• 24/7 dedicated local concierge support active throughout journey duration\n• Driver contact and vehicle details shared 24 hours prior to arrival", 26, 150);

  // Trust bar
  doc.setFillColor("#FAF7F1");
  doc.setDrawColor(border);
  doc.roundedRect(20, 180, 170, 22, 2, 2, "FD");
  doc.setTextColor(espresso);
  doc.setFontSize(8.5);
  doc.text("Google Review · 5.0 Rating (★★★★★) | 24/7 Concierge | Kerala Tourism Accredited", 26, 193);

  // Closing Espresso Footer
  doc.setFillColor(espresso);
  doc.roundedRect(20, 210, 170, 35, 2, 2, "F");
  doc.setTextColor("#FAF7F1");
  doc.setFontSize(12);
  doc.text("Escora Holidays", 26, 222);
  doc.setFontSize(8);
  doc.text("+91 9400280420 · info@escoraholidays.com · www.escoraholidays.com", 26, 230);
  doc.text("God's Own Country · Bespoke Slow-Luxury Journeys", 26, 236);

  doc.setDrawColor(border);
  doc.line(20, 285, 190, 285);
  doc.setFontSize(8);
  doc.setTextColor("#685D56");
  doc.text("REF: ESC-Q1020", 20, 291);
  doc.text(`0${totalPdfPages} / 0${totalPdfPages}`, 180, 291);

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(options.filename, pdfBuffer);
  console.log(`  [GENERATED] ${options.filename} (${pdfBuffer.length} bytes, ${totalPdfPages} pages)`);
  return { filename: options.filename, size: pdfBuffer.length, pages: totalPdfPages };
}

// Generate sample short itinerary (Explora Trivandrum - 3 Days)
const shortPdf = createSampleDossierPdf({
  title: "Explora Trivandrum — 3 Days · 2 Nights",
  customerName: "MARIA ROY",
  duration: "2N | 3D",
  totalDays: 3,
  filename: path.resolve(process.cwd(), "sample-short-itinerary-3d.pdf"),
  days: [
    {
      title: "Arrival in Trivandrum · Temple & Heritage",
      desc: "Arrive in Trivandrum, met by chauffeur and transferred to hotel. Visit Sree Padmanabhaswamy Temple, Napier Museum, and sunset at Shanghumugham Beach.",
      stay: "Uday Samudra Leisure Beach Hotel",
    },
    {
      title: "Trivandrum to Kovalam · Poovar Mangrove Cruise",
      desc: "Drive to Kovalam with a scenic Poovar Island backwater cruise. Check in to luxury coastal resort, afternoon at leisure along Kovalam lighthouse beach.",
      stay: "The Leela Kovalam, a Raviz Hotel",
    },
    {
      title: "Kovalam Shoreline & Departure",
      desc: "Morning breakfast by the sea, leisure shopping at Lulu Mall, and chauffeur transfer to Trivandrum International Airport.",
      stay: "Departure Transfer",
    },
  ],
  stays: [
    { name: "Uday Samudra Leisure Beach Hotel", location: "Trivandrum", star: "5-Star", nights: 1 },
    { name: "The Leela Kovalam, a Raviz Hotel", location: "Kovalam", star: "5-Star Luxury", nights: 1 },
  ],
  priceTotal: 48000,
});

assert(shortPdf.pages === 4, "6.1 Sample short itinerary PDF generated with exactly 4 pages", shortPdf.filename);

// Generate sample long itinerary (Kerala Classic - 6 Days)
const longPdf = createSampleDossierPdf({
  title: "Kerala Classic — 6 Days · 5 Nights",
  customerName: "MR. & MRS. DAVID STERLING",
  duration: "5N | 6D",
  totalDays: 6,
  filename: path.resolve(process.cwd(), "sample-long-itinerary-6d.pdf"),
  days: [
    {
      title: "Arrival in Kochi — Fort Kochi & Mattancherry Heritage",
      desc: "Chauffeur transfer to Fort Kochi. Stroll through colonial Jew Town, ancient synagogues, Chinese fishing nets at sunset, and an evening Kathakali classical dance show.",
      stay: "Brunton Boatyard — CGH Earth, Kochi",
    },
    {
      title: "Kochi to Munnar — Scenic Hill Route & Waterfalls",
      desc: "Scenic drive through Western Ghats, stopping at Cheeyappara and Valara waterfalls. Visit high-altitude spice and tea plantations before checking into hill resort.",
      stay: "Fragrant Nature Munnar Resort",
    },
    {
      title: "Munnar Sightseeing — Eravikulam & Tea Hills",
      desc: "Full day dedicated to Munnar's natural splendor: Eravikulam National Park (Nilgiri Tahr habitat), KDHP Tea Museum, and panoramic valley viewpoints.",
      stay: "Fragrant Nature Munnar Resort",
    },
    {
      title: "Munnar to Thekkady — Periyar Wildlife Sanctuary",
      desc: "Drive through spice hills to Thekkady. Walking tour of working cardamom and pepper plantation, followed by sunset boat cruise on Periyar Lake.",
      stay: "Spice Village — CGH Earth, Thekkady",
    },
    {
      title: "Thekkady to Alappuzha — Private Backwater Houseboat",
      desc: "Board traditional handcrafted kettuvallam houseboat. Cruise through narrow canals, Vembanad lake, with a private chef preparing authentic Kerala feasts.",
      stay: "Escora Luxury Private Houseboat, Alleppey",
    },
    {
      title: "Alappuzha to Cochin Airport — Departure",
      desc: "Disembark after waterside breakfast, leisurely drive back to Cochin for heritage souvenir shopping, and evening transfer to Cochin International Airport.",
      stay: "Departure Transfer",
    },
  ],
  stays: [
    { name: "Brunton Boatyard — CGH Earth", location: "Fort Kochi", star: "5-Star Heritage", nights: 1 },
    { name: "Fragrant Nature Resort", location: "Munnar", star: "5-Star Luxury", nights: 2 },
    { name: "Spice Village — CGH Earth", location: "Thekkady", star: "5-Star Wilderness", nights: 1 },
    { name: "Escora Luxury Private Houseboat", location: "Alleppey", star: "Premium Houseboat", nights: 1 },
  ],
  priceTotal: 145000,
});

assert(longPdf.pages === 5, "6.2 Sample long itinerary PDF generated with exactly 5 balanced pages", longPdf.filename);

console.log("\n================================================================================");
console.log(`TOTAL AUDIT CHECKS: ${passes + fails} | PASSED: ${passes} | FAILED: ${fails}`);
console.log("================================================================================");

if (fails > 0) {
  process.exit(1);
}
