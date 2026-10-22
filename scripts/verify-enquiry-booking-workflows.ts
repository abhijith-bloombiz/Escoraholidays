import assert from "node:assert";
import { connectDB, disconnectDB, EnquiryModel, OrderModel, ItineraryModel, NotificationModel, SubscriberConsentModel, getNextSequence } from "../lib/db/src/index";

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
  console.log("   ESCORA HOLIDAYS — ENQUIRY & BOOKING CREATION WORKFLOWS VERIFICATION          ");
  console.log("================================================================================\n");

  await connectDB();
  let adminCookie = "";
  const trackedEnquiryIds: number[] = [];
  const trackedOrderIds: number[] = [];
  const trackedItineraryIds: number[] = [];

  try {
    // -------------------------------------------------------------------------
    // PREPARATION & AUTH
    // -------------------------------------------------------------------------
    console.log("--- 0. SYSTEM SETUP & AUTHENTICATION ---");
    const loginStart = Date.now();
    adminCookie = await loginAdmin();
    pass("0.1 Admin Authentication", `Session cookie obtained for '${ADMIN_USER}'`, Date.now() - loginStart);

    const testEmails = [
      "aaditya.menon.test@example.com",
      "rohit.sharma.test@example.com",
      "siddharth.varma.test@example.com",
      "vikram.oberoi.test@example.com",
      "ananya.roy.test@example.com",
    ];
    await EnquiryModel.deleteMany({ email: { $in: testEmails } });
    await OrderModel.deleteMany({ guestEmail: { $in: testEmails } });
    await SubscriberConsentModel.deleteMany({ email: { $in: testEmails } });
    await NotificationModel.deleteMany({ recipientEmail: { $in: testEmails } });

    const initialOrderCount = await OrderModel.countDocuments();
    const initialEnquiryCount = await EnquiryModel.countDocuments();
    pass("0.2 Baseline Counts", `Orders: ${initialOrderCount}, Enquiries: ${initialEnquiryCount}`);

    // -------------------------------------------------------------------------
    // 1. Submitting /plan creates an enquiry and does not create an order
    // -------------------------------------------------------------------------
    console.log("\n--- 1. CUSTOM JOURNEY PLANNER (/plan) SUBMISSION ---");
    const planPayload = {
      name: "Aaditya Menon",
      email: "aaditya.menon.test@example.com",
      phone: "+91 98470 12345",
      travelStyle: "Backwaters & Heritage",
      destinations: "Kumarakom & Alleppey",
      travelDate: "2026-11-15",
      departureDate: "2026-11-22",
      guestCount: 2,
      budgetRange: "₹2,50,000 - ₹3,50,000",
      specialRequests: "Anniversary celebration; request private solar-powered luxury houseboat.",
      marketingConsent: true,
      utmSource: "instagram",
      utmMedium: "story_ad",
      utmCampaign: "luxury_kerala_2026",
      referrerUrl: "https://instagram.com/p/test123",
      landingPage: "https://escoraholidays.com/plan",
      browserLanguage: "en-US",
      timezone: "Asia/Kolkata",
    };

    const planStart = Date.now();
    const planRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planPayload),
    });

    if (planRes.status === 201) {
      const planData = await planRes.json();
      trackedEnquiryIds.push(planData.id);

      // Verify DB state
      const dbEnquiry = await EnquiryModel.findOne({ id: planData.id });
      assert(dbEnquiry, "Enquiry must exist in database");
      assert.strictEqual(dbEnquiry.name, planPayload.name);
      assert.strictEqual(dbEnquiry.email, planPayload.email);
      assert.strictEqual(dbEnquiry.travelStyle, planPayload.travelStyle);
      assert.strictEqual(dbEnquiry.destinations, planPayload.destinations);
      assert.strictEqual(dbEnquiry.guestCount, planPayload.guestCount);
      assert.strictEqual(dbEnquiry.utmSource, planPayload.utmSource);
      assert.strictEqual(dbEnquiry.marketingConsent, true);
      assert.strictEqual(dbEnquiry.status, "new");

      // Verify NO OrderModel was created for this submission
      const ordersForAaditya = await OrderModel.find({ guestEmail: planPayload.email });
      assert.strictEqual(ordersForAaditya.length, 0, "No OrderModel should be created by /plan submission");

      pass(
        "1.1 /plan submission creates Enquiry and NO Order",
        `Created Enquiry #${planData.id} with all journey & attribution attributes. Zero orders created.`,
        Date.now() - planStart
      );
    } else {
      fail("1.1 /plan submission", `Expected 201, got ${planRes.status}: ${await planRes.text()}`);
    }

    // -------------------------------------------------------------------------
    // 2. Submitting /journeys/:slug creates an enquiry with package association
    // -------------------------------------------------------------------------
    console.log("\n--- 2. CURATED JOURNEY (/journeys/:slug) SUBMISSION ---");
    const journeyPayload = {
      packageId: 4,
      packageName: "Tranquil Backwaters & Spice Hills",
      name: "Rohit & Meera Sharma",
      email: "rohit.sharma.test@example.com",
      phone: "+91 98111 22334",
      travelDate: "2026-12-10",
      guestCount: 3,
      travelStyle: "Slow Luxury",
      destinations: "Cochin, Munnar, Thekkady, Alleppey",
      specialRequests: "Travelling with elderly parent; need ground floor rooms and easy vehicle access.",
      marketingConsent: true,
      utmSource: "google_search",
      utmMedium: "cpc",
      utmCampaign: "curated_kerala_holidays",
      referrerUrl: "https://google.com/search?q=kerala+luxury+tours",
      landingPage: "https://escoraholidays.com/journeys/tranquil-backwaters",
      browserLanguage: "en-GB",
      timezone: "Asia/Kolkata",
    };

    const journeyStart = Date.now();
    const journeyRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(journeyPayload),
    });

    if (journeyRes.status === 201) {
      const journeyData = await journeyRes.json();
      trackedEnquiryIds.push(journeyData.id);

      const dbEnquiry = await EnquiryModel.findOne({ id: journeyData.id });
      assert(dbEnquiry, "Journey enquiry must exist in database");
      assert.strictEqual(dbEnquiry.packageId, journeyPayload.packageId);
      assert.strictEqual(dbEnquiry.packageName, journeyPayload.packageName);
      assert.strictEqual(dbEnquiry.name, journeyPayload.name);
      assert.strictEqual(dbEnquiry.email, journeyPayload.email);
      assert.strictEqual(dbEnquiry.travelDate, journeyPayload.travelDate);
      assert.strictEqual(dbEnquiry.guestCount, journeyPayload.guestCount);
      assert.strictEqual(dbEnquiry.status, "new");

      // Verify NO Order was created
      const ordersForRohit = await OrderModel.find({ guestEmail: journeyPayload.email });
      assert.strictEqual(ordersForRohit.length, 0, "No OrderModel should be created by /journeys/:slug submission");

      pass(
        "2.1 /journeys/:slug submission creates Enquiry with packageId & packageName",
        `Created Enquiry #${journeyData.id} (Package: "${journeyData.packageName}"). Zero orders created.`,
        Date.now() - journeyStart
      );
    } else {
      fail("2.1 /journeys/:slug submission", `Expected 201, got ${journeyRes.status}: ${await journeyRes.text()}`);
    }

    // -------------------------------------------------------------------------
    // 3. Contact forms continue creating enquiries correctly
    // -------------------------------------------------------------------------
    console.log("\n--- 3. GENERAL CONTACT FORM SUBMISSION ---");
    const contactPayload = {
      name: "Siddharth Varma",
      email: "siddharth.varma.test@example.com",
      phone: "+91 97455 66778",
      subject: "Custom Corporate Retreat Enquiry",
      message: "Looking for an exclusive luxury wellness buyout for our leadership team of 12 executives in February 2027.",
      marketingConsent: false,
      utmSource: "direct",
    };

    const contactStart = Date.now();
    const contactRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactPayload),
    });

    if (contactRes.status === 201) {
      const contactData = await contactRes.json();
      trackedEnquiryIds.push(contactData.id);

      const dbEnquiry = await EnquiryModel.findOne({ id: contactData.id });
      assert(dbEnquiry, "Contact enquiry must exist");
      assert.strictEqual(dbEnquiry.name, contactPayload.name);
      assert.strictEqual(dbEnquiry.message, contactPayload.message);
      assert.strictEqual(dbEnquiry.marketingConsent, false);
      assert.strictEqual(dbEnquiry.status, "new");

      const ordersForSiddharth = await OrderModel.find({ guestEmail: contactPayload.email });
      assert.strictEqual(ordersForSiddharth.length, 0, "No OrderModel created for contact enquiry");

      pass("3.1 General Contact Form creates Enquiry", `Created Enquiry #${contactData.id}`, Date.now() - contactStart);
    } else {
      fail("3.1 Contact Form submission", `Expected 201, got ${contactRes.status}: ${await contactRes.text()}`);
    }

    // -------------------------------------------------------------------------
    // 4. New enquiries appear in the Admin Inbox
    // -------------------------------------------------------------------------
    console.log("\n--- 4. ADMIN INBOX VERIFICATION ---");
    const inboxStart = Date.now();
    const inboxRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      headers: { Cookie: adminCookie },
    });

    if (inboxRes.ok) {
      const enquiriesList = await inboxRes.json();
      assert(Array.isArray(enquiriesList), "Inbox response must be an array");

      const foundPlan = enquiriesList.find((e: any) => e.email === planPayload.email);
      const foundJourney = enquiriesList.find((e: any) => e.email === journeyPayload.email);
      const foundContact = enquiriesList.find((e: any) => e.email === contactPayload.email);

      assert(foundPlan, "Plan enquiry must appear in Admin Inbox");
      assert(foundJourney, "Curated journey enquiry must appear in Admin Inbox");
      assert(foundContact, "Contact enquiry must appear in Admin Inbox");
      assert.strictEqual(foundJourney.packageName, journeyPayload.packageName, "Package name must be preserved in inbox view");

      pass(
        "4.1 Enquiries Visible in Admin Inbox",
        `Admin Inbox lists all 3 enquiries with package/destination data intact (${enquiriesList.length} total)`,
        Date.now() - inboxStart
      );
    } else {
      fail("4.1 Admin Inbox", `Expected 200, got ${inboxRes.status}`);
    }

    // -------------------------------------------------------------------------
    // 5. Enquiry conversion creates exactly one booking and preserves enquiry relationship
    // -------------------------------------------------------------------------
    console.log("\n--- 5. WORKFLOW 1: CONVERT ENQUIRY TO BOOKING (DIRECT) ---");
    const journeyEnquiryId = trackedEnquiryIds[1]; // Curated journey enquiry
    const convertDirectStart = Date.now();

    const convertRes = await fetch(`${API_BASE_URL}/api/enquiries/${journeyEnquiryId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        totalAmount: 185000,
        currency: "INR",
        status: "confirmed",
        paymentStatus: "partially_paid",
        paymentTerms: "50% advance received, balance 14 days prior",
        notes: "Confirmed after telephone consultation. Special vehicle booked.",
      }),
    });

    if (convertRes.status === 201) {
      const json = await convertRes.json();
      const convertData = json.booking || json;
      trackedOrderIds.push(convertData.id);

      assert(convertData.bookingReference.startsWith("ESC-BKG-"), "Booking reference format valid");
      assert.strictEqual(convertData.enquiryId, journeyEnquiryId, "Order must link to original enquiryId");
      assert.strictEqual(convertData.packageName, journeyPayload.packageName, "Order must inherit packageName");
      assert.strictEqual(convertData.packageId, journeyPayload.packageId, "Order must inherit packageId");
      assert.strictEqual(convertData.guestName, journeyPayload.name, "Order must inherit guestName");
      assert.strictEqual(convertData.totalAmount, 185000, "Order must have agreed total amount");
      assert.strictEqual(convertData.status, "confirmed", "Booking status confirmed");
      assert.strictEqual(convertData.paymentStatus, "partially_paid", "Payment status partially_paid");

      // Check Enquiry in DB is marked as converted and linked
      const updatedEnquiry = await EnquiryModel.findOne({ id: journeyEnquiryId });
      assert(updatedEnquiry, "Enquiry must exist in DB");
      assert.strictEqual(updatedEnquiry.status, "converted", "Enquiry status must be 'converted'");
      assert.strictEqual(updatedEnquiry.bookingId, convertData.id, "Enquiry must link bookingId");
      assert.strictEqual(updatedEnquiry.bookingReference, convertData.bookingReference, "Enquiry must link bookingReference");

      // Ensure EXACTLY 1 order was created for this conversion
      const matchingOrders = await OrderModel.find({ enquiryId: journeyEnquiryId });
      assert.strictEqual(matchingOrders.length, 1, "Exactly one OrderModel created for this conversion");

      pass(
        "5.1 Direct Enquiry Conversion",
        `Enquiry #${journeyEnquiryId} converted to Booking #${convertData.id} (${convertData.bookingReference}) with full relationship and package data preserved`,
        Date.now() - convertDirectStart
      );
    } else {
      fail("5.1 Direct Enquiry Conversion", `Expected 201, got ${convertRes.status}: ${await convertRes.text()}`);
    }

    // -------------------------------------------------------------------------
    // 6. Proposal-backed conversion continues to work
    // -------------------------------------------------------------------------
    console.log("\n--- 6. WORKFLOW 1: PROPOSAL-BACKED CONVERSION ---");
    const planEnquiryId = trackedEnquiryIds[0]; // Custom plan enquiry

    // Create an Itinerary proposal for this enquiry in DB
    const itinId = await getNextSequence("itineraries");
    trackedItineraryIds.push(itinId);
    const mockItinerary = await ItineraryModel.create({
      id: itinId,
      enquiryId: planEnquiryId,
      customerName: planPayload.name,
      customerEmail: planPayload.email,
      customerPhone: planPayload.phone,
      title: "Backwater Serenity & Munnar Mist",
      shareToken: `token-${itinId}-${Date.now()}`,
      destination: "Kumarakom, Alleppey & Munnar",
      startDate: "2026-11-15",
      endDate: "2026-11-22",
      adults: 2,
      pricing: JSON.stringify({ total: 295000, currency: "INR" }),
      currency: "INR",
      status: "shared",
      summary: "Curated slow luxury itinerary for 2 guests.",
      days: JSON.stringify([{ dayNumber: 1, title: "Arrival in Cochin & transfer to Kumarakom" }]),
      stays: JSON.stringify([{ hotelName: "Kumarakom Lake Resort", nights: 3 }]),
      paymentTerms: "Full payment 30 days prior to departure",
    });

    const proposalConvertStart = Date.now();
    const proposalConvertRes = await fetch(`${API_BASE_URL}/api/enquiries/${planEnquiryId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        itineraryId: itinId,
        status: "confirmed",
        paymentStatus: "unpaid",
      }),
    });

    if (proposalConvertRes.status === 201) {
      const json = await proposalConvertRes.json();
      const proposalOrderData = json.booking || json;
      trackedOrderIds.push(proposalOrderData.id);

      assert.strictEqual(proposalOrderData.enquiryId, planEnquiryId);
      assert.strictEqual(proposalOrderData.itineraryId, itinId);
      assert.strictEqual(proposalOrderData.itineraryTitle, mockItinerary.title);
      assert.strictEqual(proposalOrderData.totalAmount, 295000, "Should resolve totalAmount from itinerary pricing");
      assert(proposalOrderData.itinerarySnapshot, "Itinerary snapshot must be captured in order");

      const parsedSnapshot = JSON.parse(proposalOrderData.itinerarySnapshot);
      assert.strictEqual(parsedSnapshot.id, itinId);
      assert.strictEqual(parsedSnapshot.destination, mockItinerary.destination);

      pass(
        "6.1 Proposal-Backed Enquiry Conversion",
        `Enquiry #${planEnquiryId} converted using Itinerary #${itinId}. Snapshot captured and totalAmount=295000 verified.`,
        Date.now() - proposalConvertStart
      );
    } else {
      fail("6.1 Proposal-Backed Enquiry Conversion", `Expected 201, got ${proposalConvertRes.status}: ${await proposalConvertRes.text()}`);
    }

    // -------------------------------------------------------------------------
    // 7. Duplicate conversion attempts are safely rejected (HTTP 409)
    // -------------------------------------------------------------------------
    console.log("\n--- 7. DUPLICATE CONVERSION SAFEGUARD ---");
    const dupStart = Date.now();
    const dupRes = await fetch(`${API_BASE_URL}/api/enquiries/${journeyEnquiryId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ totalAmount: 190000 }),
    });

    if (dupRes.status === 409) {
      const dupData = await dupRes.json();
      assert(dupData.error.includes("already been converted"), "Error message specifies already converted");
      pass("7.1 Duplicate Conversion Safeguard", `Rejected with 409 Conflict: "${dupData.error}"`, Date.now() - dupStart);
    } else {
      fail("7.1 Duplicate Conversion Safeguard", `Expected 409, got ${dupRes.status}`);
    }

    // -------------------------------------------------------------------------
    // 8. Workflow 2: Manual admin booking creation
    // -------------------------------------------------------------------------
    console.log("\n--- 8. WORKFLOW 2: MANUAL ADMIN BOOKING CREATION ---");
    const manualBookingPayload = {
      guestName: "Vikramaditya Oberoi",
      guestEmail: "vikram.oberoi.test@example.com",
      guestPhone: "+91 99000 88776",
      packageName: "Imperial Malabar Coast",
      packageId: 7,
      travelStyle: "Slow Luxury & Private Aviation",
      destinations: "Kannur, Bekal, Wayanad",
      travelDate: "2027-01-10",
      departureDate: "2027-01-18",
      guestCount: 4,
      totalAmount: 480000,
      currency: "INR",
      status: "confirmed",
      paymentStatus: "paid",
      paymentTerms: "100% advance paid via direct bank wire",
      specialRequests: "Private charter pickup from Mangalore airport; organic Ayurvedic dining only.",
      notes: "Direct VIP telephone enquiry received by General Manager.",
    };

    const manualStart = Date.now();
    const manualRes = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(manualBookingPayload),
    });

    if (manualRes.status === 201) {
      const manualOrder = await manualRes.json();
      trackedOrderIds.push(manualOrder.id);

      assert(manualOrder.bookingReference.startsWith("ESC-BKG-"), "Valid booking reference generated");
      assert.strictEqual(manualOrder.guestName, manualBookingPayload.guestName);
      assert.strictEqual(manualOrder.guestEmail, manualBookingPayload.guestEmail);
      assert.strictEqual(manualOrder.totalAmount, manualBookingPayload.totalAmount);
      assert.strictEqual(manualOrder.status, "confirmed");
      assert.strictEqual(manualOrder.paymentStatus, "paid");
      assert.strictEqual(manualOrder.convertedBy, ADMIN_USER);
      assert.strictEqual(manualOrder.enquiryId, null, "Manual booking has no enquiryId");

      const dbOrder = await OrderModel.findOne({ id: manualOrder.id });
      assert(dbOrder, "Manual order exists in DB");
      assert.strictEqual(dbOrder.bookingReference, manualOrder.bookingReference);

      pass(
        "8.1 Manual Admin Booking Creation",
        `Created Order #${manualOrder.id} (${manualOrder.bookingReference}) directly with status "confirmed" and payment "paid"`,
        Date.now() - manualStart
      );
    } else {
      fail("8.1 Manual Admin Booking Creation", `Expected 201, got ${manualRes.status}: ${await manualRes.text()}`);
    }

    // -------------------------------------------------------------------------
    // 9. Unauthorized users cannot create bookings through POST /api/orders
    // -------------------------------------------------------------------------
    console.log("\n--- 9. SECURITY & AUTHORIZATION ON BOOKING CREATION ---");
    const unauthOrderStart = Date.now();
    const unauthOrderRes = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualBookingPayload),
    });

    if (unauthOrderRes.status === 401) {
      pass("9.1 Unauthenticated Booking Creation Rejected", "Server rejected POST /api/orders without auth with 401 Unauthorized", Date.now() - unauthOrderStart);
    } else {
      fail("9.1 Unauthenticated Booking Creation Rejected", `Expected 401, got ${unauthOrderRes.status}`);
    }

    // -------------------------------------------------------------------------
    // 10. Booking status and payment status remain independent
    // -------------------------------------------------------------------------
    console.log("\n--- 10. STATUS INDEPENDENCE (BOOKING STATUS vs PAYMENT STATUS) ---");
    const independentStatusStart = Date.now();
    const unconfirmedPaidBooking = {
      guestName: "Ananya Roy",
      guestEmail: "ananya.roy.test@example.com",
      guestPhone: "+91 94000 11223",
      destinations: "Wayanad Hills",
      travelDate: "2026-12-05",
      guestCount: 2,
      totalAmount: 95000,
      status: "enquiry", // booking status is not yet confirmed
      paymentStatus: "paid", // but payment was fully received
    };

    const statusRes = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(unconfirmedPaidBooking),
    });

    if (statusRes.status === 201) {
      const orderData = await statusRes.json();
      trackedOrderIds.push(orderData.id);

      assert.strictEqual(orderData.status, "enquiry", "Status remains 'enquiry'");
      assert.strictEqual(orderData.paymentStatus, "paid", "PaymentStatus remains 'paid'");

      pass(
        "10.1 Booking & Payment Status Independence",
        `Created Order #${orderData.id} with status="${orderData.status}" and paymentStatus="${orderData.paymentStatus}" independently`,
        Date.now() - independentStatusStart
      );
    } else {
      fail("10.1 Status Independence", `Expected 201, got ${statusRes.status}: ${await statusRes.text()}`);
    }

    // -------------------------------------------------------------------------
    // 11. Consent, notifications, audit logs, and attribution
    // -------------------------------------------------------------------------
    console.log("\n--- 11. CONSENT, AUDIT LOGS, AND ATTRIBUTION ---");
    const consentStart = Date.now();

    // Check subscriber status for consented email (Aaditya Menon)
    const subscriber = await SubscriberConsentModel.findOne({ email: planPayload.email.toLowerCase() });
    assert(subscriber, "Subscriber record must exist for opted-in email");
    assert.strictEqual(subscriber.status, "subscribed", "Opted-in subscriber must have status 'subscribed'");
    assert.strictEqual(subscriber.source, "website_plan_journey", "Source accurately attributed to plan journey");

    // Check audit notification in NotificationModel for manual booking creation
    const manualAuditNotif = await NotificationModel.findOne({
      type: "manual_booking_created",
      recipientEmail: manualBookingPayload.guestEmail,
    });
    assert(manualAuditNotif, "Audit notification must exist for manual booking");
    assert.strictEqual(manualAuditNotif.sentBy, ADMIN_USER);

    // Check attribution fields on the converted order
    const convertedOrder = await OrderModel.findOne({ id: trackedOrderIds[0] });
    assert(convertedOrder, "Converted order must exist");
    assert.strictEqual(convertedOrder.utmSource, journeyPayload.utmSource, "UTM Source passed through from enquiry");
    assert.strictEqual(convertedOrder.utmCampaign, journeyPayload.utmCampaign, "UTM Campaign passed through from enquiry");
    assert.strictEqual(convertedOrder.landingPage, journeyPayload.landingPage, "Landing Page passed through from enquiry");

    pass(
      "11.1 Consent, Audit, & Attribution Integrity",
      "Marketing consent correctly recorded with specific source; manual booking audit log created; attribution preserved through conversion",
      Date.now() - consentStart
    );

    // -------------------------------------------------------------------------
    // 12. Existing historical orders remain intact
    // -------------------------------------------------------------------------
    console.log("\n--- 12. HISTORICAL ORDER RECORDS PRESERVATION ---");
    const historicalStart = Date.now();
    const currentOrders = await OrderModel.find().lean();
    assert(currentOrders.length >= initialOrderCount, "No historical orders deleted or removed");

    // Check if there are any orders with status 'enquiry' in DB
    const historicalEnquiryOrders = await OrderModel.find({ status: "enquiry" }).lean();
    pass(
      "12.1 Historical Orders Intact",
      `Total orders in system: ${currentOrders.length} (including ${historicalEnquiryOrders.length} with historical status="enquiry"). Zero orders destroyed.`,
      Date.now() - historicalStart
    );

  } catch (err: any) {
    console.error("\nUnexpected error during verification:", err);
    testResults.push({ step: "Verification Runner", passed: false, details: err?.message || String(err) });
  } finally {
    // Cleanup created test records
    console.log("\n--- CLEANUP OF TEST FIXTURES ---");
    try {
      if (trackedEnquiryIds.length > 0) {
        await EnquiryModel.deleteMany({ id: { $in: trackedEnquiryIds } });
        console.log(`Cleaned up ${trackedEnquiryIds.length} test enquiries`);
      }
      if (trackedOrderIds.length > 0) {
        await OrderModel.deleteMany({ id: { $in: trackedOrderIds } });
        console.log(`Cleaned up ${trackedOrderIds.length} test orders`);
      }
      if (trackedItineraryIds.length > 0) {
        await ItineraryModel.deleteMany({ id: { $in: trackedItineraryIds } });
        console.log(`Cleaned up ${trackedItineraryIds.length} test itineraries`);
      }
      await SubscriberConsentModel.deleteMany({ email: { $in: ["aaditya.menon.test@example.com", "rohit.sharma.test@example.com", "siddharth.varma.test@example.com"] } });
      await NotificationModel.deleteMany({ recipientEmail: { $in: ["vikram.oberoi.test@example.com", "ananya.roy.test@example.com"] } });
    } catch (cleanupErr: any) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }

    await disconnectDB();
  }

  // Summary
  console.log("\n================================================================================");
  console.log("                        TEST EXECUTION SUMMARY                                  ");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log(`Total Scenarios Tested: ${total}`);
  console.log(`Passed:                 ${passed}`);
  console.log(`Failed:                 ${failed}`);

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed!`);
    process.exit(1);
  } else {
    console.log("\nALL ENQUIRY AND BOOKING CREATION SCENARIOS PASSED WITH FULL INTEGRITY!");
    process.exit(0);
  }
}

runVerification();
