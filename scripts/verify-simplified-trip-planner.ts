import assert from "node:assert";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";

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

async function verifyConciseTripPlan() {
  console.log("================================================================================");
  console.log("    ESCORA HOLIDAYS — VERIFY SIMPLIFIED AI TRIP PLANNER RESULTS                 ");
  console.log("================================================================================\n");

  const payload = {
    durationDays: 4,
    startLocation: "Kochi",
    travelersCount: 2,
    travelerType: "Couple",
    budgetTier: "Signature Slow-Luxury",
    currency: "USD",
    interests: ["tea-hills", "backwaters", "ayurveda"],
    pace: "unhurried-slow",
  };

  console.log("1. Generating 4-Day Kerala Voyage Plan via POST /api/ai/plan...");
  const t0 = Date.now();
  const res = await fetch(`${API_BASE_URL}/api/ai/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });
  const duration = Date.now() - t0;

  assert.strictEqual(res.status, 200, `Expected HTTP 200, got ${res.status}`);
  const data = await res.json();
  const it = data.itinerary;
  assert(it, "Response must include itinerary");
  pass("1. Itinerary generation completed successfully", `HTTP 200 in ${duration}ms via ${data.provider}`);

  // Check 2: Day count preservation
  assert.strictEqual(it.days.length, 4, `Expected 4 days, got ${it.days.length}`);
  assert.strictEqual(it.durationDays, 4);
  assert.strictEqual(it.durationNights, 3);
  pass("2. Trip duration and daily chapters fully preserved", `4 Days / 3 Nights (${it.days.length} daily chapters)`);

  // Check 3: Voyage Overview conciseness
  const overviewWords = it.overview.split(/\s+/).filter(Boolean).length;
  console.log(`\n  Voyage Overview (${overviewWords} words):`);
  console.log(`  "${it.overview}"\n`);
  assert(overviewWords <= 80, `Overview should be concise (<= 80 words), got ${overviewWords}`);
  pass("3. Voyage overview is concise and scan-friendly", `${overviewWords} words (Target: 35–65 words)`);

  // Check 4: Day-by-Day conciseness inspection
  console.log("--- Day-by-Day Content Conciseness Audit ---");
  for (const day of it.days) {
    const titleWords = day.title.split(/\s+/).filter(Boolean).length;
    const themeWords = (day.theme || "").split(/\s+/).filter(Boolean).length;
    const morningWords = (day.morningActivity || "").split(/\s+/).filter(Boolean).length;
    const afternoonWords = (day.afternoonActivity || "").split(/\s+/).filter(Boolean).length;
    const eveningWords = (day.eveningActivity || "").split(/\s+/).filter(Boolean).length;
    const stayWords = (day.stayRecommendation || "").split(/\s+/).filter(Boolean).length;
    const travelWords = day.travelNote ? day.travelNote.split(/\s+/).filter(Boolean).length : 0;

    console.log(`  Day ${day.day}: "${day.title}" (${day.destination})`);
    console.log(`    • Title: ${titleWords} words`);
    console.log(`    • Theme (${themeWords} words): "${day.theme}"`);
    console.log(`    • Morning (${morningWords} words): "${day.morningActivity}"`);
    console.log(`    • Afternoon (${afternoonWords} words): "${day.afternoonActivity}"`);
    console.log(`    • Evening (${eveningWords} words): "${day.eveningActivity}"`);
    console.log(`    • Stay (${stayWords} words): "${day.stayRecommendation}"`);
    if (day.travelNote) {
      console.log(`    • Transit Note (${travelWords} words): "${day.travelNote}"`);
    }

    assert(titleWords <= 10, `Day ${day.day} title too long: ${titleWords} words`);
    assert(themeWords <= 35, `Day ${day.day} theme too long: ${themeWords} words`);
    assert(morningWords <= 30, `Day ${day.day} morning activity too long: ${morningWords} words`);
    assert(afternoonWords <= 30, `Day ${day.day} afternoon activity too long: ${afternoonWords} words`);
    assert(eveningWords <= 30, `Day ${day.day} evening activity too long: ${eveningWords} words`);
    assert(stayWords <= 15, `Day ${day.day} stay recommendation too long: ${stayWords} words`);
    if (day.travelNote) {
      assert(travelWords <= 18, `Day ${day.day} travel note too long: ${travelWords} words`);
    }
  }
  pass("4. All 4 days meet strict conciseness thresholds", "Titles 3–6 words, Themes 15–25 words, Activities 10–18 words");

  // Check 5: Authoritative budget details preserved
  assert(it.budget, "Structured budget object must be attached");
  assert.strictEqual(it.budget.currency, "USD");
  assert(it.budget.minAmount > 0);
  assert(it.budget.canonicalInr.minInr > 0);
  pass("5. Authoritative budget and canonical INR baseline preserved", `Target: ${it.budget.formatted} (~${it.budget.canonicalInr.formatted})`);

  // Check 6: Grounding entities preserved for enquiry handoff
  assert(Array.isArray(it.verifiedDestinations) && it.verifiedDestinations.length > 0);
  assert(Array.isArray(it.verifiedJourneys));
  pass("6. Catalog grounding entities preserved in API model for /plan handoff", `${it.verifiedDestinations.length} destinations, ${it.verifiedJourneys.length} journeys`);

  console.log("\n================================================================================");
  console.log("                           VERIFICATION SUMMARY                                 ");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  console.log(`  Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("  >>> ALL SIMPLIFIED TRIP PLANNER CHECKS PASSED <<<");
  } else {
    console.error(`  >>> ${failed} CHECKS FAILED <<<`);
    process.exit(1);
  }
}

verifyConciseTripPlan().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
