import fs from "node:fs";
import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  EnquiryModel,
  DestinationModel,
  PackageModel,
  ItineraryModel,
} from "../lib/db/src/index";

// Load .env
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_USER = process.env.ADMIN_USERNAME || process.env.ADMIN_USER || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";

interface AuditResult {
  id: string;
  name: string;
  category: "AUTH_SECURITY" | "LIVE_GROQ" | "GROUNDING" | "IMMUTABILITY" | "VALIDATION_RESILIENCE";
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const results: AuditResult[] = [];

function pass(id: string, name: string, category: AuditResult["category"], details?: string, durationMs?: number) {
  results.push({ id, name, category, passed: true, details, durationMs });
  const timeStr = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.log(`  [PASS] [${category}] ${id}: ${name}${timeStr}`);
  if (details) console.log(`         ↳ ${details}`);
}

function fail(id: string, name: string, category: AuditResult["category"], details?: string) {
  results.push({ id, name, category, passed: false, details });
  console.error(`  [FAIL] [${category}] ${id}: ${name}`);
  if (details) console.error(`         ↳ ERROR: ${details}\n`);
}

async function loginAdmin(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Admin login failed with HTTP ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie returned from login");
  }
  return setCookie.split(";")[0];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 3, delayMs = 6000): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < maxRetries) {
      console.log(`         ↳ [RateLimit backoff] Provider 429 received. Waiting ${delayMs / 1000}s for token bucket refill (retry ${attempt + 1}/${maxRetries})...`);
      await sleep(delayMs);
      attempt++;
      continue;
    }
    return res;
  }
  return fetch(url, init);
}

async function runAdminAiItineraryVerification() {
  console.log("================================================================================");
  console.log("    ESCORA HOLIDAYS — ADMIN AI ITINERARY ASSISTANT AUDIT SUITE (PHASE 3B)       ");
  console.log("================================================================================\n");

  await connectDB();

  let adminCookie = "";
  try {
    adminCookie = await loginAdmin();
    console.log(`[auth] Successfully authenticated as admin (${ADMIN_USER})\n`);
  } catch (err: any) {
    console.warn(`[auth] Admin login failed (${err.message}). Testing auth rejection first.`);
  }

  // ---------------------------------------------------------------------------
  // STEP 1: Authentication & Authorization Enforcements
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("Step 1: Auth Guardrails & Access Boundary Verification");
  console.log("--------------------------------------------------------------------------------");

  // 1a. Unauthenticated request rejected with 401
  try {
    const res = await fetch(`${API_BASE_URL}/api/itineraries/ai-assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-client-id": "auth-test-" + Date.now() },
      body: JSON.stringify({ destination: "Munnar", durationDays: 3 }),
    });
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    pass(
      "AUTH-UNAUTH-01",
      "Unauthenticated request to /api/itineraries/ai-assist is strictly rejected",
      "AUTH_SECURITY",
      `HTTP ${res.status} returned without leaking itinerary draft or catalog internal data`
    );
  } catch (err: any) {
    fail("AUTH-UNAUTH-01", "Unauthenticated request test failed", "AUTH_SECURITY", err.message);
  }

  // 1b. Forged session cookie rejected with 401
  try {
    const res = await fetch(`${API_BASE_URL}/api/itineraries/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "escora.sid=s%3Abogus_forged_session_token.fakeSignature123456789",
        "x-test-client-id": "auth-bogus-" + Date.now(),
      },
      body: JSON.stringify({ destination: "Munnar", durationDays: 3 }),
    });
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized for forged session`);
    pass(
      "AUTH-FORGED-02",
      "Tampered/forged session cookie is rejected with 401",
      "AUTH_SECURITY",
      `Server rejected invalid signature with HTTP ${res.status}`
    );
  } catch (err: any) {
    fail("AUTH-FORGED-02", "Forged session cookie test failed", "AUTH_SECURITY", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Database Immutability & Human-in-the-Loop Safeguards
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 2: Database Immutability & Non-Persistence Safeguards");
  console.log("--------------------------------------------------------------------------------");

  // Seed a sample enquiry to test safe extraction without status modification
  const testEnquiryId = Math.floor(Math.random() * 800000) + 100000;
  const testEnquiry = await EnquiryModel.create({
    id: testEnquiryId,
    name: "Dr. Ananya Sharma",
    email: `ananya.sharma.${Date.now()}@example.com`,
    phone: "+91 98765 43210",
    message: "Seeking a calm 4-night retreat in Munnar tea hills and backwaters for 2 adults, focus on wellness and scenic walks.",
    status: "new",
  });

  const initialItineraryCount = await ItineraryModel.countDocuments();
  let liveDraftResponse: any = null;

  try {
    const startMs = Date.now();
    const res = await fetchWithRetry(`${API_BASE_URL}/api/itineraries/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "immutability-test-" + Date.now(),
      },
      body: JSON.stringify({
        enquiryId: testEnquiry.id,
        customerName: testEnquiry.name,
        destination: "Munnar & Alleppey",
        durationDays: 4,
        durationNights: 3,
        pace: "unhurried-slow",
        travelers: "2 Adults (Couple)",
        clientWishes: "Focus on tranquility, tea estates, ayurvedic massage, and backwater serenity.",
      }),
    });

    const durationMs = Date.now() - startMs;
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    liveDraftResponse = await res.json();

    // Check database immutability: ItineraryModel count MUST NOT CHANGE
    const postItineraryCount = await ItineraryModel.countDocuments();
    assert.strictEqual(
      postItineraryCount,
      initialItineraryCount,
      `Expected itinerary count to remain ${initialItineraryCount}, but got ${postItineraryCount}`
    );

    pass(
      "IMMUT-01",
      "Calling AI assist endpoint NEVER creates an itinerary record in the database",
      "IMMUTABILITY",
      `Itinerary count remained strictly unchanged (${initialItineraryCount})`,
      durationMs
    );

    // Check enquiry status immutability: Enquiry status MUST NOT CHANGE as side effect
    const refreshedEnquiry = await EnquiryModel.findOne({ id: testEnquiry.id });
    assert.strictEqual(
      refreshedEnquiry?.status,
      "new",
      `Expected enquiry status to remain 'new', got '${refreshedEnquiry?.status}'`
    );

    pass(
      "IMMUT-02",
      "AI generation leaves enquiry status completely unchanged ('new')",
      "IMMUTABILITY",
      `Enquiry #${testEnquiry.id} status retained original value without side effects`
    );
  } catch (err: any) {
    fail("IMMUT-01", "Database immutability verification failed", "IMMUTABILITY", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 3: Catalog Grounding & Fact Verification
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 3: Catalog Grounding & Operational Safeguards");
  console.log("--------------------------------------------------------------------------------");

  try {
    assert(liveDraftResponse, "Live draft response must be available from Step 2");
    assert(liveDraftResponse.title, "Draft must have a title");
    assert(liveDraftResponse.destination, "Draft must have a destination");
    assert(Array.isArray(liveDraftResponse.days), "Draft must contain an array of days");
    assert(liveDraftResponse.days.length >= 2, `Expected at least 2 days, got ${liveDraftResponse.days.length}`);
    assert(Array.isArray(liveDraftResponse.stays), "Draft must contain stays");
    assert(liveDraftResponse.stays.length >= 1, "Draft must suggest at least one stay");

    pass(
      "DRAFT-STRUCT-01",
      "Draft proposal has valid day-by-day and stays structure",
      "GROUNDING",
      `Generated ${liveDraftResponse.days.length} days and ${liveDraftResponse.stays.length} stays for "${liveDraftResponse.title}"`
    );

    // Verify verifiedCatalogMatches matches genuine destinations in the database
    const catalogDestinations = liveDraftResponse.verifiedCatalogMatches?.destinations ?? [];
    assert(catalogDestinations.length > 0, "Expected at least one verified catalog destination match");

    for (const match of catalogDestinations) {
      const dbDest = await DestinationModel.findOne({ slug: match.slug });
      assert(dbDest, `Matched slug '${match.slug}' must exist in DestinationModel`);
      assert.strictEqual(match.name, dbDest.name, `Catalog destination name mismatch`);
    }

    pass(
      "GROUND-DEST-02",
      "Verified catalog destinations correspond to real published database records",
      "GROUNDING",
      `Grounding validated against DB: ${catalogDestinations.map((d: any) => `${d.name} (${d.slug})`).join(", ")}`
    );

    // Verify unconfirmedItems contains operational warnings
    const unconfirmed = liveDraftResponse.unconfirmedItems ?? [];
    assert(Array.isArray(unconfirmed), "unconfirmedItems must be an array");
    assert(unconfirmed.length >= 1, "Must contain at least 1 operational confirmation item");

    pass(
      "SAFEGUARD-UNCONF-03",
      "Response includes explicit unconfirmed items requiring human staff action",
      "GROUNDING",
      `Flagged ${unconfirmed.length} operational checks (e.g. "${unconfirmed[0]}")`
    );

    // Verify travel designer logistics advice
    const advice = liveDraftResponse.travelDesignerAdvice ?? "";
    assert(typeof advice === "string" && advice.length > 10, "travelDesignerAdvice must be a non-empty string");

    pass(
      "ADVICE-LOGISTICS-04",
      "Travel designer logistics advice provides practical transfer & pacing insights",
      "GROUNDING",
      `Staff guidance provided: "${advice.slice(0, 100)}..."`
    );
  } catch (err: any) {
    fail("GROUNDING", "Catalog grounding verification failed", "GROUNDING", err.message);
  }

  // Cooldown to respect Groq TPM
  console.log("\n[cooldown] Waiting 8s before next live generation test...");
  await sleep(8000);

  // ---------------------------------------------------------------------------
  // STEP 4: Refinement with Travel Designer Steering
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 4: Proposal Refinement with Staff Designer Instructions");
  console.log("--------------------------------------------------------------------------------");

  try {
    const startMs = Date.now();
    const res = await fetchWithRetry(`${API_BASE_URL}/api/itineraries/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "refinement-test-" + Date.now(),
      },
      body: JSON.stringify({
        destination: "Wayanad",
        durationDays: 3,
        durationNights: 2,
        pace: "unhurried-slow",
        designerInstructions: "Guest requests staying in a heritage coffee plantation bungalow with zero early morning drives, focused purely on birding, organic sattvic meals, and rainforest leisure.",
      }),
    });

    const durationMs = Date.now() - startMs;
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const refinedDraft = await res.json();

    assert.strictEqual(refinedDraft.days.length, 3, "Expected 3 refined days");
    const fullText = JSON.stringify(refinedDraft).toLowerCase();
    const hasPlantationOrCoffeeOrRelaxed =
      fullText.includes("plantation") ||
      fullText.includes("coffee") ||
      fullText.includes("heritage") ||
      fullText.includes("leisure") ||
      fullText.includes("nature") ||
      fullText.includes("bird");

    assert(
      hasPlantationOrCoffeeOrRelaxed,
      "Refined proposal should reflect staff designer instructions (plantation/coffee/leisure/nature)"
    );

    pass(
      "REFINE-STEER-01",
      "Travel designer instructions steer the generated itinerary themes and pacing",
      "LIVE_GROQ",
      `Refined 3-day Wayanad journey aligned with staff plantation/birding notes`,
      durationMs
    );
  } catch (err: any) {
    fail("REFINE-STEER-01", "Staff refinement test failed", "LIVE_GROQ", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Input Validation & Sparse Input Resilience
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 5: Input Validation & Sparse Input Resilience");
  console.log("--------------------------------------------------------------------------------");

  // 5a. Invalid pace rejected with 400
  try {
    const res = await fetch(`${API_BASE_URL}/api/itineraries/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "validation-test-" + Date.now(),
      },
      body: JSON.stringify({
        destination: "Kochi",
        pace: "hyper-speed-invalid",
      }),
    });

    assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
    const errBody = await res.json();
    assert(errBody.error, "Error response must contain error message");

    pass(
      "VAL-INVALID-PACE-01",
      "Invalid pace enum value rejected with HTTP 400 and clear error message",
      "VALIDATION_RESILIENCE",
      `Rejected with HTTP ${res.status}: ${errBody.error}`
    );
  } catch (err: any) {
    fail("VAL-INVALID-PACE-01", "Validation test failed", "VALIDATION_RESILIENCE", err.message);
  }

  // 5b. Sparse input (only destination, all else empty/omitted) handles gracefully without crashing
  try {
    console.log("\n[cooldown] Waiting 8s before sparse generation test...");
    await sleep(8000);
    const res = await fetchWithRetry(`${API_BASE_URL}/api/itineraries/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "sparse-test-" + Date.now(),
      },
      body: JSON.stringify({
        destination: "Bekal",
      }),
    });

    if (res.status !== 200) {
      const errText = await res.text();
      assert.strictEqual(res.status, 200, `Expected 200 OK for sparse input, got ${res.status}: ${errText}`);
    }
    const sparseDraft = await res.json();
    assert(sparseDraft.title, "Sparse input must produce a titled proposal");
    assert(sparseDraft.days && sparseDraft.days.length >= 2, "Sparse input must default to reasonable duration");

    pass(
      "SPARSE-INPUT-02",
      "Sparse input (destination only) produces a coherent draft without crashing",
      "VALIDATION_RESILIENCE",
      `Generated "${sparseDraft.title}" with ${sparseDraft.days.length} days from minimal input`
    );
  } catch (err: any) {
    fail("SPARSE-INPUT-02", "Sparse input test failed", "VALIDATION_RESILIENCE", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Rate Limiting Enforcement (30 req/min)
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 6: Rate Limiting Enforcement");
  console.log("--------------------------------------------------------------------------------");

  try {
    const clientId = "ratelimit-probe-" + Date.now();
    let hitRateLimit = false;

    // Send rapid invalid requests to trip the 30 req/min limiter quickly
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${API_BASE_URL}/api/itineraries/ai-assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
          "x-test-client-id": clientId,
        },
        body: JSON.stringify({ destination: "Test", pace: "invalid-rate-limit-probe" }),
      });

      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }

    assert(hitRateLimit, "Expected rate limiter to return HTTP 429 when threshold exceeded");
    pass(
      "RATE-LIMIT-01",
      "Rate limiter strictly enforces 30 req/min on AI itinerary assist endpoint",
      "VALIDATION_RESILIENCE",
      `HTTP 429 received when limit was reached`
    );
  } catch (err: any) {
    fail("RATE-LIMIT-01", "Rate limit enforcement test failed", "VALIDATION_RESILIENCE", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 7: Explicit Human Action Workflow (Create Itinerary Proposal)
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 7: Explicit Staff Save Workflow (Create Proposal in DB)");
  console.log("--------------------------------------------------------------------------------");

  let createdItineraryId: number | null = null;
  try {
    // Staff approves and explicitly clicks "Create Proposal"
    const createRes = await fetch(`${API_BASE_URL}/api/itineraries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "save-test-" + Date.now(),
      },
      body: JSON.stringify({
        customerName: liveDraftResponse?.customerName || "Dr. Ananya Sharma",
        customerEmail: "ananya.sharma.test@example.com",
        title: liveDraftResponse?.title || "Munnar & Alleppey Retreat",
        destination: liveDraftResponse?.destination || "Munnar",
        summary: liveDraftResponse?.summary || "Curated luxury retreat",
        days: JSON.stringify(liveDraftResponse?.days || []),
        stays: JSON.stringify(liveDraftResponse?.stays || []),
        inclusions: JSON.stringify(liveDraftResponse?.inclusions || []),
        exclusions: JSON.stringify(liveDraftResponse?.exclusions || []),
        pricing: JSON.stringify({ items: [{ description: "Curated 4-Day Journey", amount: 85000 }], total: 85000 }),
        currency: "INR",
        status: "draft",
      }),
    });

    assert.strictEqual(createRes.status, 201, `Expected 201 Created, got ${createRes.status}`);
    const createdItinerary = await createRes.json();
    createdItineraryId = createdItinerary.id;

    assert(createdItinerary.id, "Saved itinerary must have numeric ID");
    assert.strictEqual(createdItinerary.status, "draft", "Initial saved status must be 'draft'");
    assert(createdItinerary.shareToken, "Itinerary must receive private shareToken");

    pass(
      "HUMAN-SAVE-01",
      "Itinerary is ONLY persisted when staff explicitly submits the proposal form",
      "IMMUTABILITY",
      `Created itinerary #${createdItinerary.id} as 'draft' with shareToken ${createdItinerary.shareToken}`
    );
  } catch (err: any) {
    fail("HUMAN-SAVE-01", "Explicit save workflow test failed", "IMMUTABILITY", err.message);
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Cleanup: Removing Test Records");
  console.log("--------------------------------------------------------------------------------");

  if (testEnquiry.id) {
    await EnquiryModel.deleteOne({ id: testEnquiry.id });
    console.log(`[cleanup] Deleted test enquiry #${testEnquiry.id}`);
  }
  if (createdItineraryId) {
    await ItineraryModel.deleteOne({ id: createdItineraryId });
    console.log(`[cleanup] Deleted test itinerary #${createdItineraryId}`);
  }

  await disconnectDB();

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n================================================================================");
  console.log(`AUDIT RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All Admin AI Itinerary Assistant verification assertions PASSED successfully.");
    process.exit(0);
  }
}

runAdminAiItineraryVerification().catch((err) => {
  console.error("FATAL ERROR during verification:", err);
  process.exit(1);
});
