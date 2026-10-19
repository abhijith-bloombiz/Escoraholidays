import assert from "node:assert";
import { connectDB, disconnectDB, EnquiryModel, OrderModel, ItineraryModel, NotificationModel } from "../lib/db/src/index";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_USER = process.env.ADMIN_USER || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";

interface TestResult {
  step: string;
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const testResults: TestResult[] = [];

function pass(step: string, details?: string, durationMs?: number) {
  testResults.push({ step, passed: true, details, durationMs });
  const dur = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.log(`  [PASS] ${step}${dur}`);
  if (details) console.log(`         ↳ ${details}`);
}

function fail(step: string, details?: string) {
  testResults.push({ step, passed: false, details });
  console.error(`  [FAIL] ${step}`);
  if (details) console.error(`         ↳ ERROR: ${details}\n`);
}

async function loginAdmin(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Admin login failed with status ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie returned from login");
  }
  return setCookie.split(";")[0];
}

async function runVerification() {
  console.log("================================================================================");
  console.log("    ESCORA HOLIDAYS — MANUAL ENQUIRY-TO-BOOKING CONVERSION VERIFICATION       ");
  console.log("================================================================================\n");

  await connectDB();
  let adminCookie = "";
  const createdEnquiryIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdItineraryIds: number[] = [];

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Authentication & Role Verification
    // -------------------------------------------------------------------------
    console.log("--- TEST GROUP 1: AUTHENTICATION & ACCESS CONTROL ---");

    // 1.1 Unauthenticated request must return 401
    const unauthStart = Date.now();
    const unauthRes = await fetch(`${API_BASE_URL}/api/enquiries/1/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (unauthRes.status === 401) {
      pass("1.1 Unauthenticated Access Rejection", "Server rejected conversion request with 401 Unauthorized", Date.now() - unauthStart);
    } else {
      fail("1.1 Unauthenticated Access Rejection", `Expected 401, got ${unauthRes.status}`);
    }

    // 1.2 Authorized admin login
    const loginStart = Date.now();
    adminCookie = await loginAdmin();
    pass("1.2 Authorized Admin Login", `Obtained admin session cookie for user '${ADMIN_USER}'`, Date.now() - loginStart);

    // -------------------------------------------------------------------------
    // STEP 2: Input Validation & Pre-conditions
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: ELIGIBILITY & VALIDATION ---");

    // 2.1 Non-existent enquiry must return 404
    const notFoundStart = Date.now();
    const notFoundRes = await fetch(`${API_BASE_URL}/api/enquiries/99999999/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ destinations: "Kerala", totalAmount: 50000 }),
    });
    if (notFoundRes.status === 404) {
      const data = await notFoundRes.json();
      pass("2.1 Non-Existent Enquiry", `Returned 404: "${data.error}"`, Date.now() - notFoundStart);
    } else {
      fail("2.1 Non-Existent Enquiry", `Expected 404, got ${notFoundRes.status}`);
    }

    // Create a fresh test enquiry in DB
    const testEnquiry1 = await EnquiryModel.create({
      id: Math.floor(Date.now() / 1000) % 1000000 + 10000,
      name: "Lady Eleanor Vance",
      email: "eleanor.vance@example.co.uk",
      phone: "+44 7911 123456",
      message: "We are seeking a 7-day tranquil Ayurvedic escape in Kumarakom and Munnar this November for two guests.",
      status: "new",
    });
    createdEnquiryIds.push(testEnquiry1.id);

    // 2.2 Missing destination validation (when no proposal linked and no destination in input)
    const missDestStart = Date.now();
    const missDestRes = await fetch(`${API_BASE_URL}/api/enquiries/${testEnquiry1.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ destinations: "" }),
    });
    if (missDestRes.status === 400) {
      const data = await missDestRes.json();
      pass("2.2 Destination Requirement Validation", `Rejected missing destination with 400: "${data.error}"`, Date.now() - missDestStart);
    } else {
      fail("2.2 Destination Requirement Validation", `Expected 400, got ${missDestRes.status}`);
    }

    // 2.3 Invalid guest count validation (guestCount < 1)
    const invGuestsStart = Date.now();
    const invGuestsRes = await fetch(`${API_BASE_URL}/api/enquiries/${testEnquiry1.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ destinations: "Kumarakom", guestCount: 0 }),
    });
    if (invGuestsRes.status === 400) {
      pass("2.3 Guest Count Bounds Validation", "Rejected guestCount < 1 with 400", Date.now() - invGuestsStart);
    } else {
      fail("2.3 Guest Count Bounds Validation", `Expected 400, got ${invGuestsRes.status}`);
    }

    // -------------------------------------------------------------------------
    // STEP 3: Direct Enquiry-to-Booking Conversion (Without Proposal)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: DIRECT CONVERSION WORKFLOW ---");

    const conv1Start = Date.now();
    const conv1Payload = {
      destinations: "Kumarakom Backwaters & Munnar Hills",
      travelDate: "2026-11-10",
      departureDate: "2026-11-17",
      guestCount: 2,
      travelStyle: "Bespoke Slow-Luxury",
      totalAmount: 145000,
      currency: "INR",
      paymentTerms: "50% advance deposit upon confirmation, balance 15 days prior to arrival",
      bookingStatus: "enquiry", // Pending Confirmation per Escora policy
      paymentStatus: "unpaid",  // Unpaid - independent of conversion
      specialRequests: "Private lakeside villa with private plunge pool and daily yoga",
      internalNotes: "Converted by admin after phone consultation. Client confirmed dates.",
    };

    const conv1Res = await fetch(`${API_BASE_URL}/api/enquiries/${testEnquiry1.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(conv1Payload),
    });

    if (conv1Res.status === 201) {
      const conv1Data = await conv1Res.json();
      createdOrderIds.push(conv1Data.booking.id);

      assert.strictEqual(conv1Data.booking.enquiryId, testEnquiry1.id, "Booking enquiryId must match");
      assert.ok(conv1Data.booking.bookingReference.startsWith("ESC-BKG-"), "Booking reference format");
      assert.strictEqual(conv1Data.booking.guestName, testEnquiry1.name, "Guest name preserved");
      assert.strictEqual(conv1Data.booking.status, "enquiry", "Initial booking status is enquiry (Pending Confirmation)");
      assert.strictEqual(conv1Data.booking.paymentStatus, "unpaid", "Initial payment status is unpaid");
      assert.strictEqual(conv1Data.booking.totalAmount, 145000, "Agreed price preserved");
      assert.strictEqual(conv1Data.booking.currency, "INR", "Currency preserved");
      assert.strictEqual(conv1Data.enquiry.status, "converted", "Enquiry status updated to converted");
      assert.strictEqual(conv1Data.enquiry.bookingId, conv1Data.booking.id, "Enquiry points to created booking ID");

      pass(
        "3.1 Successful Direct Conversion",
        `Created Booking #${conv1Data.booking.id} (${conv1Data.booking.bookingReference}) linked to Enquiry #${testEnquiry1.id}`,
        Date.now() - conv1Start
      );
    } else {
      const err = await conv1Res.json();
      fail("3.1 Successful Direct Conversion", `Expected 201, got ${conv1Res.status}: ${JSON.stringify(err)}`);
    }

    // 3.2 Database Verification of Linked Enquiry State
    const dbEnquiry1 = await EnquiryModel.findOne({ id: testEnquiry1.id }).lean();
    if (
      dbEnquiry1?.status === "converted" &&
      dbEnquiry1?.bookingId &&
      dbEnquiry1?.bookingReference &&
      dbEnquiry1?.convertedAt &&
      dbEnquiry1?.convertedBy
    ) {
      pass(
        "3.2 Enquiry Persistence Verification",
        `Enquiry #${testEnquiry1.id} has status='converted', bookingRef='${dbEnquiry1.bookingReference}', convertedBy='${dbEnquiry1.convertedBy}'`
      );
    } else {
      fail("3.2 Enquiry Persistence Verification", `Enquiry DB state mismatch: ${JSON.stringify(dbEnquiry1)}`);
    }

    // 3.3 Activity Log & Audit Notification Creation
    const conversionAuditLog = await NotificationModel.findOne({
      type: "enquiry_conversion",
      relatedId: testEnquiry1.id,
    }).lean();

    if (conversionAuditLog) {
      pass(
        "3.3 Activity Audit Logging",
        `Recorded Notification audit log '${conversionAuditLog.subject}' (Notification #${conversionAuditLog.id})`
      );
    } else {
      fail("3.3 Activity Audit Logging", "Audit log record of type 'enquiry_conversion' not found");
    }

    // -------------------------------------------------------------------------
    // STEP 4: Duplicate Conversion Safeguard (Idempotency & Concurrency)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: DUPLICATE CONVERSION PREVENTION ---");

    const dupStart = Date.now();
    const dupRes = await fetch(`${API_BASE_URL}/api/enquiries/${testEnquiry1.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(conv1Payload),
    });

    if (dupRes.status === 409) {
      const dupData = await dupRes.json();
      assert.ok(dupData.error.includes("already been converted"), "Error message explains duplicate status");
      assert.ok(dupData.bookingId, "Returned existing booking ID");
      pass(
        "4.1 Duplicate Conversion Blocked (409 Conflict)",
        `Rejected repeated conversion attempt with 409 Conflict: "${dupData.error}"`,
        Date.now() - dupStart
      );
    } else {
      fail("4.1 Duplicate Conversion Blocked", `Expected 409, got ${dupRes.status}`);
    }

    // -------------------------------------------------------------------------
    // STEP 5: Proposal-Backed Conversion (Accepted Quotation Snapshot)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: PROPOSAL-BACKED CONVERSION & SNAPSHOT ---");

    // 5.1 Create a new enquiry and a linked bespoke itinerary proposal
    const testEnquiry2 = await EnquiryModel.create({
      id: Math.floor(Date.now() / 1000) % 1000000 + 20000,
      name: "Marcus Aurelius Sterling",
      email: "marcus.sterling@heritage-travel.com",
      phone: "+91 98401 23456",
      message: "Please prepare a curated 5-day journey through the tea estates of Munnar with luxury heritage plantation stays.",
      status: "read",
    });
    createdEnquiryIds.push(testEnquiry2.id);

    const testProposal = await ItineraryModel.create({
      id: Math.floor(Date.now() / 1000) % 1000000 + 30000,
      enquiryId: testEnquiry2.id,
      title: "Mist-Veiled Munnar & Colonial Tea Sanctuaries",
      customerName: testEnquiry2.name,
      customerEmail: testEnquiry2.email,
      customerPhone: testEnquiry2.phone,
      destination: "Munnar & High Ranges",
      startDate: "2026-12-15",
      endDate: "2026-12-20",
      adults: 2,
      children: 0,
      infants: 0,
      status: "shared",
      shareToken: `esc_token_${Date.now()}`,
      summary: "An exclusive private retreat through lush historic estates with private tea-tasting sessions.",
      days: JSON.stringify([
        { dayNumber: 1, title: "Arrival into Cochin & Scenic Ascend to Munnar", activities: ["Private chauffeured transfer", "Evening tea tasting"] },
        { dayNumber: 2, title: "Private Estate Walk & Rare Flora Trails", activities: ["Colonial plantation tour", "Secret waterfall picnic"] },
      ]),
      stays: JSON.stringify([
        { name: "Windermere Estate", location: "Munnar", roomType: "Planter's Villa", nights: 4 },
      ]),
      pricing: JSON.stringify({
        basePrice: 180000,
        taxes: 9000,
        total: 189000,
      }),
      currency: "INR",
      paymentTerms: JSON.stringify([
        "25% non-refundable advance on reservation",
        "75% balance payable 3 weeks prior to check-in",
      ]),
    });
    createdItineraryIds.push(testProposal.id);

    // Convert enquiry using the proposal
    const conv2Start = Date.now();
    const conv2Res = await fetch(`${API_BASE_URL}/api/enquiries/${testEnquiry2.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        itineraryId: testProposal.id,
        bookingStatus: "confirmed",
        paymentStatus: "partially_paid",
        specialRequests: "High floor villa with panoramic estate views",
      }),
    });

    if (conv2Res.status === 201) {
      const conv2Data = await conv2Res.json();
      createdOrderIds.push(conv2Data.booking.id);

      assert.strictEqual(conv2Data.booking.enquiryId, testEnquiry2.id, "Linked enquiryId matches");
      assert.strictEqual(conv2Data.booking.itineraryId, testProposal.id, "Linked itineraryId matches");
      assert.strictEqual(conv2Data.booking.itineraryTitle, testProposal.title, "Itinerary title saved");
      assert.strictEqual(conv2Data.booking.totalAmount, 189000, "Agreed proposal price preserved");
      assert.strictEqual(conv2Data.booking.status, "confirmed", "Booking status reflects admin choice");
      assert.strictEqual(conv2Data.booking.paymentStatus, "partially_paid", "Payment status reflects partially_paid");
      assert.ok(conv2Data.booking.itinerarySnapshot, "Itinerary snapshot object exists");
      const snapshotObj = typeof conv2Data.booking.itinerarySnapshot === "string"
        ? JSON.parse(conv2Data.booking.itinerarySnapshot)
        : conv2Data.booking.itinerarySnapshot;
      assert.strictEqual(snapshotObj.title, testProposal.title, "Snapshot contains proposal title");

      pass(
        "5.1 Proposal-Backed Conversion with Snapshot",
        `Created Booking #${conv2Data.booking.id} (${conv2Data.booking.bookingReference}) with frozen itinerary snapshot and confirmed proposal`,
        Date.now() - conv2Start
      );
    } else {
      const err = await conv2Res.json();
      fail("5.1 Proposal-Backed Conversion", `Expected 201, got ${conv2Res.status}: ${JSON.stringify(err)}`);
    }

    // 5.2 Verify Proposal status updated to "confirmed"
    const dbProposal = await ItineraryModel.findOne({ id: testProposal.id }).lean();
    if (dbProposal?.status === "confirmed") {
      pass("5.2 Proposal Status Update", `Proposal #${testProposal.id} marked as 'confirmed' upon booking conversion`);
    } else {
      fail("5.2 Proposal Status Update", `Expected status='confirmed', got '${dbProposal?.status}'`);
    }

    // -------------------------------------------------------------------------
    // STEP 6: Bookings Section & List Accessibility
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: BOOKINGS LISTING & RELATIONS ---");

    // 6.1 Booking appears in GET /api/orders (Bookings section)
    const listOrdersStart = Date.now();
    const ordersRes = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { Cookie: adminCookie },
    });
    if (ordersRes.ok) {
      const orders = await ordersRes.json();
      const foundOrder1 = orders.find((o: any) => o.id === createdOrderIds[0]);
      const foundOrder2 = orders.find((o: any) => o.id === createdOrderIds[1]);

      assert.ok(foundOrder1, "Order 1 appears in bookings list");
      assert.ok(foundOrder2, "Order 2 appears in bookings list");
      assert.strictEqual(foundOrder1.enquiryId, testEnquiry1.id, "Order 1 retains enquiryId link");
      assert.strictEqual(foundOrder2.enquiryId, testEnquiry2.id, "Order 2 retains enquiryId link");
      assert.ok(foundOrder1.bookingReference, "Order 1 displays bookingReference");

      pass(
        "6.1 Converted Bookings in Orders Pipeline",
        `Both converted bookings appear in GET /api/orders with references '${foundOrder1.bookingReference}' and '${foundOrder2.bookingReference}'`,
        Date.now() - listOrdersStart
      );
    } else {
      fail("6.1 Converted Bookings in Orders Pipeline", `GET /api/orders returned ${ordersRes.status}`);
    }

    // 6.2 Enquiries list marks records as converted and provides booking ID
    const listEnqStart = Date.now();
    const enqRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      headers: { Cookie: adminCookie },
    });
    if (enqRes.ok) {
      const enqs = await enqRes.json();
      const e1 = enqs.find((e: any) => e.id === testEnquiry1.id);
      const e2 = enqs.find((e: any) => e.id === testEnquiry2.id);

      assert.strictEqual(e1?.status, "converted", "Enquiry 1 status is converted");
      assert.strictEqual(e2?.status, "converted", "Enquiry 2 status is converted");
      assert.strictEqual(e1?.bookingId, createdOrderIds[0], "Enquiry 1 links to booking 1");
      assert.strictEqual(e2?.bookingId, createdOrderIds[1], "Enquiry 2 links to booking 2");

      pass(
        "6.2 Enquiries List Reflects Converted State",
        `Enquiries list correctly marks both enquiries as 'converted' with linked booking references`,
        Date.now() - listEnqStart
      );
    } else {
      fail("6.2 Enquiries List Reflects Converted State", `GET /api/enquiries returned ${enqRes.status}`);
    }

  } catch (err: any) {
    fail("Unexpected Exception during verification", err?.stack || err?.message);
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP TEST RECORDS
    // -------------------------------------------------------------------------
    console.log("\n--- CLEANUP ---");
    try {
      if (createdEnquiryIds.length > 0) {
        await EnquiryModel.deleteMany({ id: { $in: createdEnquiryIds } });
      }
      if (createdOrderIds.length > 0) {
        await OrderModel.deleteMany({ id: { $in: createdOrderIds } });
      }
      if (createdItineraryIds.length > 0) {
        await ItineraryModel.deleteMany({ id: { $in: createdItineraryIds } });
      }
      if (createdEnquiryIds.length > 0) {
        await NotificationModel.deleteMany({ relatedId: { $in: createdEnquiryIds } });
      }
      console.log(`  [CLEANUP] Cleaned up ${createdEnquiryIds.length} enquiries, ${createdOrderIds.length} orders, and ${createdItineraryIds.length} proposals.`);
    } catch (e: any) {
      console.warn("  [CLEANUP WARNING]", e?.message);
    }

    await disconnectDB();
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n================================================================================");
  console.log(`    VERIFICATION SUMMARY: ${passed}/${total} CHECKS PASSED (${failed} FAILED)`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
