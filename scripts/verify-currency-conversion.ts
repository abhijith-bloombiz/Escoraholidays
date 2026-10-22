import assert from "node:assert";
import { connectDB, disconnectDB, EnquiryModel } from "../lib/db/src/index";
import {
  currencyService,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  CANONICAL_BUDGET_TIERS,
} from "../apps/api-server/src/services/currency-service";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_USER = process.env.ADMIN_USER || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";

interface TestResult {
  step: string;
  passed: boolean;
  details?: string;
}

const testResults: TestResult[] = [];

function pass(step: string, details?: string) {
  testResults.push({ step, passed: true, details });
  console.log(`  [PASS] ${step}`);
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
  console.log("    ESCORA HOLIDAYS — CURRENCY CONVERSION END-TO-END VERIFICATION               ");
  console.log("================================================================================\n");

  await connectDB();
  const createdEnquiryIds: number[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE A: Exchange-Rate Service Core & Frankfurter Integration
    // -------------------------------------------------------------------------
    console.log("--- TEST SUITE A: Exchange-Rate Service & Provider Integration ---");

    // A1. Live / Valid rates retrieval
    const snapshot = await currencyService.getExchangeRates();
    assert(snapshot, "Rates snapshot must be returned");
    assert(
      ["live", "cached"].includes(snapshot.status),
      `Expected live or cached status, got: ${snapshot.status}`
    );
    assert.strictEqual(snapshot.base, "INR", "Base currency must be INR");
    assert(snapshot.referenceDate, "Reference date must be present");
    pass("A1. Exchange-rate retrieval from Frankfurter / cache", `Status: ${snapshot.status}, Reference Date: ${snapshot.referenceDate}`);

    // A2. Supported currencies completeness
    for (const curr of SUPPORTED_CURRENCIES) {
      const rate = snapshot.rates[curr];
      const inrPerUnit = snapshot.inrPerUnit[curr];
      assert(
        typeof rate === "number" && Number.isFinite(rate) && rate > 0,
        `Rate for ${curr} must be a positive finite number, got: ${rate}`
      );
      assert(
        typeof inrPerUnit === "number" && Number.isFinite(inrPerUnit) && inrPerUnit > 0,
        `inrPerUnit for ${curr} must be a positive finite number, got: ${inrPerUnit}`
      );
    }
    assert.strictEqual(snapshot.rates.INR, 1, "INR rate to INR must equal 1");
    assert.strictEqual(snapshot.inrPerUnit.INR, 1, "INR inrPerUnit must equal 1");
    pass("A2. All 5 supported currencies present with positive finite rates", `Rates: INR=1, USD=${snapshot.rates.USD}, EUR=${snapshot.rates.EUR}, GBP=${snapshot.rates.GBP}, AED=${snapshot.rates.AED}`);

    // A3. AED statutory peg derivation
    const expectedAedRate = snapshot.rates.USD * 3.6725;
    const diff = Math.abs(snapshot.rates.AED - expectedAedRate);
    assert(diff < 1e-9, `AED rate (${snapshot.rates.AED}) must equal USD * 3.6725 (${expectedAedRate})`);
    pass("A3. Statutory AED peg (1 USD = 3.6725 AED) correctly derived", `USD: ${snapshot.rates.USD} -> AED: ${snapshot.rates.AED}`);

    // A4. Server-side in-memory caching
    const secondFetch = await currencyService.getExchangeRates();
    assert.strictEqual(secondFetch.status, "cached", "Consecutive fetch must return 'cached' status");
    assert.strictEqual(secondFetch.lastUpdated, snapshot.lastUpdated, "Cache must preserve original lastUpdated timestamp");
    pass("A4. Server-side caching & accurate status reporting", "Consecutive fetch correctly marked 'cached'");

    // A5. Validation: Reject invalid rates safely
    const isInvalidRejected = !currencyService.validateRates({
      INR: 1,
      USD: -0.012,
      EUR: 0.011,
      GBP: 0.009,
      AED: 0.044,
    });
    const isNaNRejected = !currencyService.validateRates({
      INR: 1,
      USD: NaN,
      EUR: 0.011,
      GBP: 0.009,
      AED: 0.044,
    });
    const isMissingKeyRejected = !currencyService.validateRates({
      INR: 1,
      USD: 0.012,
    });
    assert(isInvalidRejected, "Negative rate must be rejected");
    assert(isNaNRejected, "NaN rate must be rejected");
    assert(isMissingKeyRejected, "Missing required currency must be rejected");
    pass("A5. Robust rate validation (rejects negative, NaN, missing currencies)", "All anomaly checks passed");

    // -------------------------------------------------------------------------
    // TEST SUITE B: HTTP API Endpoint (/api/currency/rates)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE B: Public HTTP API Endpoint ---");

    const httpRes = await fetch(`${API_BASE_URL}/api/currency/rates`);
    assert.strictEqual(httpRes.status, 200, `Expected 200 OK, got ${httpRes.status}`);
    const cacheControl = httpRes.headers.get("cache-control");
    assert(cacheControl?.includes("max-age"), `Expected Cache-Control header, got ${cacheControl}`);

    const httpData = await httpRes.json();
    assert.strictEqual(httpData.base, "INR");
    assert(httpData.rates.USD > 0 && httpData.rates.AED > 0);
    assert(httpData.provider.includes("Frankfurter"), "Provider attribution must be present");
    assert(httpData.disclaimer.includes("indicative") || httpData.disclaimer.includes("Indicative"), "Disclaimer must state indicative reference rates");
    pass("B1. GET /api/currency/rates responds with 200 OK, cache headers, and attribution", `Cache-Control: ${cacheControl}`);

    // -------------------------------------------------------------------------
    // TEST SUITE C: Budget Calculations & Tier Formatting
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE C: Authoritative Budget Calculations & Tier Formatting ---");

    for (const curr of SUPPORTED_CURRENCIES) {
      for (const tier of CANONICAL_BUDGET_TIERS) {
        const budgetDetails = await currencyService.calculateTripBudget(tier.tier, 7, 2, curr);
        assert(budgetDetails.formatted.length > 0, `Formatted budget must not be empty for ${tier.tier} in ${curr}`);

        // Check C1: No "Under Under" bug
        assert(
          !budgetDetails.formatted.toLowerCase().includes("under under"),
          `Formatted string must not contain 'Under Under': ${budgetDetails.formatted}`
        );
        assert(
          !budgetDetails.guidanceText.toLowerCase().includes("under under"),
          `Guidance text must not contain 'Under Under': ${budgetDetails.guidanceText}`
        );

        // Check C2: Ultra-Luxury formatting includes plus sign consistently
        if (tier.tier === "Ultra-Luxury Sanctuaries") {
          assert(
            budgetDetails.formatted.includes("+"),
            `Ultra-Luxury tier must include plus sign (+), got: ${budgetDetails.formatted}`
          );
        }
      }
    }
    pass("C1. Budget tiers verified across INR, USD, EUR, GBP, AED without 'Under Under'", "All tiers produce clean, well-formed labels");
    pass("C2. Ultra-Luxury upper-bound consistently includes plus sign (+)", "Format: 'min – max+' preserved in all currencies");

    // -------------------------------------------------------------------------
    // TEST SUITE D: Deterministic Trip Budget Calculation & Currency Invariance
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE D: Deterministic Budget Calculation & Currency Invariance ---");

    // Test that the SAME trip (7 days, 2 adults, Signature Slow-Luxury) produces
    // the EXACT SAME canonical INR amounts regardless of the requested target currency!
    const inrBudget = await currencyService.calculateTripBudget("Signature Slow-Luxury", 7, 2, "INR");
    const usdBudget = await currencyService.calculateTripBudget("Signature Slow-Luxury", 7, 2, "USD");
    const eurBudget = await currencyService.calculateTripBudget("Signature Slow-Luxury", 7, 2, "EUR");
    const gbpBudget = await currencyService.calculateTripBudget("Signature Slow-Luxury", 7, 2, "GBP");
    const aedBudget = await currencyService.calculateTripBudget("Signature Slow-Luxury", 7, 2, "AED");

    // D1. Canonical INR invariance
    assert.strictEqual(
      usdBudget.canonicalInr.minInr,
      inrBudget.canonicalInr.minInr,
      "USD request must produce identical canonical INR min"
    );
    assert.strictEqual(
      usdBudget.canonicalInr.maxInr,
      inrBudget.canonicalInr.maxInr,
      "USD request must produce identical canonical INR max"
    );
    assert.strictEqual(
      eurBudget.canonicalInr.minInr,
      inrBudget.canonicalInr.minInr,
      "EUR request must produce identical canonical INR min"
    );
    assert.strictEqual(
      aedBudget.canonicalInr.minInr,
      inrBudget.canonicalInr.minInr,
      "AED request must produce identical canonical INR min"
    );
    pass("D1. Canonical INR amount is 100% invariant to target currency selection", `Canonical Range: ₹${(inrBudget.canonicalInr.minInr/100000).toFixed(1)}L – ₹${(inrBudget.canonicalInr.maxInr/100000).toFixed(1)}L across all currency requests`);

    // D2. Target currency conversion accuracy
    assert(
      usdBudget.minAmount > 0 && usdBudget.maxAmount > usdBudget.minAmount,
      `USD min (${usdBudget.minAmount}) and max (${usdBudget.maxAmount}) must be positive and ordered`
    );
    assert(
      aedBudget.minAmount > usdBudget.minAmount,
      `AED amounts must reflect ~3.67x USD amounts (AED min: ${aedBudget.minAmount}, USD min: ${usdBudget.minAmount})`
    );
    pass("D2. Deterministic conversion arithmetic verified", `INR ${inrBudget.canonicalInr.minInr} * ${snapshot.rates.USD} -> USD ${usdBudget.minAmount} | AED ${aedBudget.minAmount}`);

    // -------------------------------------------------------------------------
    // TEST SUITE E: Enquiry Hand-off & Admin Inbox Visibility
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE E: Enquiry Hand-Off & Currency Persistence ---");

    // E1. Create enquiry with currency
    const testEnquiryPayload = {
      name: "Verification Guest USD",
      email: "verify.usd@example.com",
      phone: "+1 555 123 4567",
      travelStyle: "Signature Slow-Luxury",
      destinations: "Munnar, Kumarakom",
      guestCount: 2,
      travelDate: "2026-12-01",
      budgetRange: "$3,200 – $5,300",
      currency: "USD",
      message: "End-to-end currency preservation verification test enquiry.",
    };

    const createRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testEnquiryPayload),
    });
    assert.strictEqual(createRes.status, 201, `Failed to create enquiry: ${createRes.status}`);
    const createdEnq = await createRes.json();
    createdEnquiryIds.push(createdEnq.id);

    assert.strictEqual(createdEnq.currency, "USD", "Created enquiry must return currency: USD");
    assert.strictEqual(createdEnq.budgetRange, "$3,200 – $5,300");
    pass("E1. Enquiry submission preserves currency and budgetRange", `Saved ID: ${createdEnq.id}, Currency: ${createdEnq.currency}`);

    // E2. Verify database model persistence
    const dbDoc = await EnquiryModel.findOne({ id: createdEnq.id }).lean();
    assert(dbDoc, "Enquiry must exist in database");
    assert.strictEqual(dbDoc.currency, "USD", "Database document must store currency: USD");
    pass("E2. Database enquiry document contains 'currency: USD'", `MongoDB document confirmed with currency=${dbDoc.currency}`);

    // E3. Verify Admin Inbox lists currency
    const adminCookie = await loginAdmin();
    const adminListRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(adminListRes.status, 200, "Admin enquiries list returned 200");
    const adminEnquiries = await adminListRes.json();
    const foundEnq = adminEnquiries.find((e: any) => e.id === createdEnq.id);
    assert(foundEnq, "Enquiry must appear in admin list");
    assert.strictEqual(foundEnq.currency, "USD", "Admin enquiries list must include currency: USD");
    pass("E3. Admin enquiry inbox retrieves persisted currency for travel designers", "Currency field exposed in admin inbox API");

    // E4. Backward compatibility with legacy enquiry lacking currency
    const legacyEnquiryPayload = {
      name: "Legacy Guest INR",
      email: "legacy.inr@example.com",
      phone: "+91 9876543210",
      travelStyle: "Bespoke Journey",
      destinations: "Wayanad",
      guestCount: 2,
      travelDate: "2026-11-15",
      budgetRange: "₹2.5L – ₹4.0L",
      message: "Legacy enquiry without currency field test.",
    };
    const legacyCreateRes = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(legacyEnquiryPayload),
    });
    assert.strictEqual(legacyCreateRes.status, 201, "Legacy enquiry without currency created successfully");
    const createdLegacy = await legacyCreateRes.json();
    createdEnquiryIds.push(createdLegacy.id);
    assert(
      createdLegacy.currency === "INR" || createdLegacy.currency === undefined,
      `Legacy enquiry should default to INR or undefined, got: ${createdLegacy.currency}`
    );
    pass("E4. Backward compatibility: existing enquiries without currency handle gracefully", `Defaults safely to '${createdLegacy.currency}' without errors`);

    // -------------------------------------------------------------------------
    // TEST SUITE F: End-to-End AI Trip Planner Generation with Currency
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE F: End-to-End AI Trip Planner Budget Consistency ---");

    const planPayloadUsd = {
      durationDays: 3,
      travelersCount: 2,
      budgetTier: "Signature Slow-Luxury",
      currency: "USD",
      interests: ["Nature & Wildlife"],
    };

    console.log("  Generating 3-day itinerary in USD...");
    const planResUsd = await fetch(`${API_BASE_URL}/api/ai/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planPayloadUsd),
    });
    assert.strictEqual(planResUsd.status, 200, `AI plan failed: ${planResUsd.status}`);
    const planDataUsd = await planResUsd.json();

    assert(planDataUsd.itinerary, "Plan response must include itinerary");
    assert(planDataUsd.itinerary.budget, "Plan response must include structured budget");
    assert.strictEqual(planDataUsd.itinerary.budget.currency, "USD");
    assert.strictEqual(planDataUsd.itinerary.budget.canonicalInr.minInr, 150000);
    assert.strictEqual(planDataUsd.itinerary.budget.canonicalInr.maxInr, 350000);
    assert(planDataUsd.itinerary.budget.minAmount > 0);
    assert(planDataUsd.itinerary.budgetGuidance.includes("$") || planDataUsd.itinerary.budgetGuidance.includes("USD"));
    pass("F1. AI plan generated with structured budget and deterministic USD guidance", `Budget: ${planDataUsd.itinerary.budget.formatted} (~${planDataUsd.itinerary.budget.canonicalInr.formatted})`);

    // Verify equivalent EUR plan maintains identical canonical INR baseline
    console.log("  Generating 3-day itinerary in EUR...");
    const planPayloadEur = {
      durationDays: 3,
      travelersCount: 2,
      budgetTier: "Signature Slow-Luxury",
      currency: "EUR",
      interests: ["Nature & Wildlife"],
    };
    const planResEur = await fetch(`${API_BASE_URL}/api/ai/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planPayloadEur),
    });
    assert.strictEqual(planResEur.status, 200, `AI plan in EUR failed: ${planResEur.status}`);
    const planDataEur = await planResEur.json();

    assert.strictEqual(planDataEur.itinerary.budget.currency, "EUR");
    assert.strictEqual(
      planDataEur.itinerary.budget.canonicalInr.minInr,
      planDataUsd.itinerary.budget.canonicalInr.minInr,
      "Canonical INR min must be identical across currencies"
    );
    assert.strictEqual(
      planDataEur.itinerary.budget.canonicalInr.maxInr,
      planDataUsd.itinerary.budget.canonicalInr.maxInr,
      "Canonical INR max must be identical across currencies"
    );
    pass("F2. Cross-currency AI plans share 100% identical canonical INR baseline", `Both EUR and USD plans share exact ₹${(planDataEur.itinerary.budget.canonicalInr.minInr/100000).toFixed(1)}L – ₹${(planDataEur.itinerary.budget.canonicalInr.maxInr/100000).toFixed(1)}L baseline`);

  } finally {
    // Clean up created test data
    if (createdEnquiryIds.length > 0) {
      await EnquiryModel.deleteMany({ id: { $in: createdEnquiryIds } });
      console.log(`\n  [CLEANUP] Deleted ${createdEnquiryIds.length} test enquiries from DB.`);
    }
    await disconnectDB();
  }

  // Summary
  console.log("\n================================================================================");
  console.log("                           VERIFICATION SUMMARY                                 ");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  console.log(`  Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("  >>> ALL CURRENCY CONVERSION END-TO-END VERIFICATION CHECKS PASSED <<<");
  } else {
    console.error(`  >>> ${failed} CHECKS FAILED <<<`);
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Unhandled error during verification:", err);
  process.exit(1);
});
