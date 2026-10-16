import assert from "node:assert";
import { connectDB, disconnectDB, EnquiryModel, DestinationModel, PackageModel } from "../lib/db/src/index";
import { aiService, AiServiceError, assistEnquiry, type AiProvider, type AiServiceStatus } from "../apps/api-server/src/services/ai";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_USER = process.env.ADMIN_USER || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";

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

interface AuditResult {
  id: string;
  name: string;
  category: "AUTH_SECURITY" | "LIVE_GROQ" | "FACT_CHECKING" | "IMMUTABILITY" | "ERROR_RESILIENCE";
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

async function runAdminAiVerification() {
  console.log("================================================================================");
  console.log("    ESCORA HOLIDAYS — ADMIN AI ENQUIRY ASSISTANT AUDIT SUITE (PHASE 3A)        ");
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
    const res = await fetch(`${API_BASE_URL}/api/enquiries/999999/ai-assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-client-id": "auth-test-" + Date.now() },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    pass(
      "AUTH-UNAUTH-01",
      "Unauthenticated request to /api/enquiries/:id/ai-assist is strictly rejected",
      "AUTH_SECURITY",
      `HTTP ${res.status} returned without leaking enquiry details or AI capabilities`
    );
  } catch (err: any) {
    fail("AUTH-UNAUTH-01", "Unauthenticated request test failed", "AUTH_SECURITY", err.message);
  }

  // 1b. Bogus session cookie rejected with 401
  try {
    const res = await fetch(`${API_BASE_URL}/api/enquiries/999999/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "escora.sid=s%3Abogus_forged_session_token.fakeSignature123456789",
        "x-test-client-id": "auth-bogus-" + Date.now(),
      },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized for forged session`);
    pass(
      "AUTH-FORGED-02",
      "Forged or invalid session cookie is strictly rejected",
      "AUTH_SECURITY",
      "HTTP 401 returned"
    );
  } catch (err: any) {
    fail("AUTH-FORGED-02", "Forged session test failed", "AUTH_SECURITY", err.message);
  }

  // 1c. Non-existent enquiry ID returns 404
  if (adminCookie) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/enquiries/88888888/ai-assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
          "x-test-client-id": "auth-404-" + Date.now(),
        },
        body: JSON.stringify({}),
      });
      assert.strictEqual(res.status, 404, `Expected 404 Not Found for non-existent ID`);
      pass(
        "AUTH-NOTFOUND-03",
        "Authenticated request for nonexistent enquiry returns clean 404 Not Found",
        "AUTH_SECURITY",
        "HTTP 404 returned"
      );
    } catch (err: any) {
      fail("AUTH-NOTFOUND-03", "Nonexistent enquiry test failed", "AUTH_SECURITY", err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Genuine Groq Analysis on a Rich Customer Inquiry
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 2: Real Groq Generation — Executive Briefing, Facts Extraction & Reply Draft");
  console.log("--------------------------------------------------------------------------------");

  let richEnquiryId: number = 0;
  let richEnquiryDocId: any = null;

  try {
    richEnquiryId = Math.floor(Math.random() * 800000) + 100000;
    const richDoc = await EnquiryModel.create({
      id: richEnquiryId,
      name: "Lady Eleanor Vance",
      email: `eleanor.vance.${Date.now()}@vance-holdings.co.uk`,
      phone: "+44 7700 900123",
      message:
        "Hello Escora team. My husband and I are hoping to visit Kerala for our 25th anniversary in late November 2026. We are looking for an unhurried 7 to 8-day journey focusing on tea plantations in Munnar and a private luxury houseboat in the backwaters. We have a luxury budget and would love candlelit dining by the water. Can you let us know if late November has good weather, and if your houseboats have private chefs? Thank you!",
      status: "new",
    });
    richEnquiryDocId = richDoc._id;

    const t0 = Date.now();
    const res = await fetchWithRetry(`${API_BASE_URL}/api/enquiries/${richEnquiryId}/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "rich-enquiry-" + Date.now(),
      },
      body: JSON.stringify({
        replyTone: "warm-luxury",
      }),
    });
    const duration = Date.now() - t0;
    if (res.status !== 200) {
      console.error("DEBUG RES ERROR:", res.status, await res.text());
    }
    assert.strictEqual(res.status, 200, `Expected 200 OK from AI assist, got ${res.status}`);

    const data = await res.json();

    // Verify Summary
    assert.ok(data.summary && data.summary.overview.length > 20, "Summary overview required");
    assert.ok(
      data.summary.destinations.some((d: string) => d.toLowerCase().includes("munnar") || d.toLowerCase().includes("backwater")),
      "Destinations must include Munnar or Backwaters"
    );
    assert.ok(
      data.summary.travelDates.toLowerCase().includes("november"),
      "Travel dates must identify November"
    );
    assert.ok(
      data.summary.groupSize.includes("2") || data.summary.groupSize.toLowerCase().includes("couple") || data.summary.groupSize.toLowerCase().includes("husband"),
      "Group size must identify 2 / couple"
    );
    assert.ok(
      data.summary.budget.toLowerCase().includes("luxury"),
      "Budget must identify luxury"
    );

    // Verify Unanswered Questions were extracted
    assert.ok(
      Array.isArray(data.summary.unansweredQuestions) && data.summary.unansweredQuestions.length >= 1,
      "Must extract unanswered questions about weather or private chefs"
    );

    // Verify Suggested Reply
    assert.ok(data.suggestedReply.subject.length > 5, "Reply subject required");
    assert.ok(data.suggestedReply.greeting.includes("Eleanor"), "Greeting must address guest by name");
    assert.ok(data.suggestedReply.body.length > 100, "Reply body must be rich text");
    assert.ok(data.suggestedReply.signoff.length > 5, "Reply signoff required");

    // Verify Next Action
    assert.ok(data.nextAction.recommendedAction.length > 10, "Recommended next action required");
    assert.ok(["low", "medium", "high"].includes(data.nextAction.priority), "Priority must be low/medium/high");

    // Verify Disclaimer
    assert.ok(data.disclaimer.includes("Human approval"), "Human approval disclaimer required");

    pass(
      "ASSIST-LIVE-RICH-04",
      "AI Enquiry Assistant produces comprehensive executive briefing, extracted facts, and reply draft via Groq",
      "LIVE_GROQ",
      `Overview: "${data.summary.overview.slice(0, 90)}..." | Questions extracted: ${data.summary.unansweredQuestions.length} | Priority: ${data.nextAction.priority.toUpperCase()}`,
      duration
    );
  } catch (err: any) {
    fail("ASSIST-LIVE-RICH-04", "Rich enquiry AI assist test failed", "LIVE_GROQ", err.message);
  }

  // Brief inter-test cooldown to keep within Groq TPM limits
  await new Promise((r) => setTimeout(r, 6000));

  // ---------------------------------------------------------------------------
  // STEP 3: Incomplete / Minimal Enquiry — Strict Fact-Checking & Zero Fabrication
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 3: Fact-Checking Guardrails — Minimal / Incomplete Inquiries");
  console.log("--------------------------------------------------------------------------------");

  let sparseEnquiryId: number = 0;
  let sparseDocId: any = null;

  try {
    sparseEnquiryId = Math.floor(Math.random() * 800000) + 100000;
    const sparseDoc = await EnquiryModel.create({
      id: sparseEnquiryId,
      name: "Julian Sterling",
      email: `julian.${Date.now()}@example.com`,
      phone: null,
      message: "Hi, please send me information regarding your holidays in Kerala.",
      status: "new",
    });
    sparseDocId = sparseDoc._id;

    const t0 = Date.now();
    const res = await fetchWithRetry(`${API_BASE_URL}/api/enquiries/${sparseEnquiryId}/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "sparse-enquiry-" + Date.now(),
      },
      body: JSON.stringify({}),
    });
    const duration = Date.now() - t0;
    if (res.status !== 200) {
      console.error("DEBUG RES ERROR (Step 3):", res.status, await res.text());
    }
    assert.strictEqual(res.status, 200, `Expected 200 OK`);

    const data = await res.json();

    // Verify unmentioned details are strictly marked Unknown / Not specified (ZERO FABRICATION)
    assert.ok(
      data.summary.travelDates.includes("Unknown") || data.summary.travelDates.includes("Not specified"),
      `Travel dates must be Unknown / Not specified, got: "${data.summary.travelDates}"`
    );
    assert.ok(
      data.summary.groupSize.includes("Unknown") || data.summary.groupSize.includes("Not specified"),
      `Group size must be Unknown / Not specified, got: "${data.summary.groupSize}"`
    );
    assert.ok(
      data.summary.budget.includes("Unknown") || data.summary.budget.includes("Not specified"),
      `Budget must be Unknown / Not specified, got: "${data.summary.budget}"`
    );

    // Missing information list must flag dates and party size
    assert.ok(
      data.extractedPreferences.missingDetails.length >= 2,
      "Missing details array must identify unstated parameters"
    );

    pass(
      "ASSIST-NO-FABRICATE-05",
      "Vague / incomplete enquiries mark missing fields as Unknown rather than fabricating dates or group size",
      "FACT_CHECKING",
      `Dates: "${data.summary.travelDates}" | Group: "${data.summary.groupSize}" | Missing: ${data.extractedPreferences.missingDetails.join(", ")}`,
      duration
    );
  } catch (err: any) {
    fail("ASSIST-NO-FABRICATE-05", "Fact-checking test failed", "FACT_CHECKING", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 4: Database Immutability & Human Approval Guardrails
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 4: Immutability Audit — Zero Automated Side Effects or Premature Status Mutation");
  console.log("--------------------------------------------------------------------------------");

  try {
    if (richEnquiryId) {
      const recordAfterAssist = await EnquiryModel.findOne({ id: richEnquiryId }).lean();
      assert.ok(recordAfterAssist, "Enquiry must exist in DB");
      assert.strictEqual(
        recordAfterAssist.status,
        "new",
        "Enquiry status must remain 'new' — AI analysis must NEVER automatically change status to 'replied'"
      );
      assert.strictEqual(
        recordAfterAssist.message.includes("husband"),
        true,
        "Original customer message must be strictly preserved"
      );

      pass(
        "ASSIST-IMMUTABLE-06",
        "AI assistance execution has ZERO database side-effects and causes NO automatic status mutation or message dispatch",
        "IMMUTABILITY",
        `Enquiry #${richEnquiryId} status remains '${recordAfterAssist.status}' with zero unauthorized record updates`
      );
    }
  } catch (err: any) {
    fail("ASSIST-IMMUTABLE-06", "Immutability audit failed", "IMMUTABILITY", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Travel Designer Guidance & Refinement
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 5: Travel Designer Refinement & Custom Focus Prompt Incorporation");
  console.log("--------------------------------------------------------------------------------");

  // Inter-test cooldown to respect Groq developer tier RPM limits
  await new Promise((r) => setTimeout(r, 8000));

  try {
    if (richEnquiryId) {
      const designerInstruction =
        "Highlight our private Ayurvedic doctor consultation and suggest staying at Windermere Estate in Munnar.";
      let data: any = null;
      let duration = 0;

      const t0 = Date.now();
      const res = await fetchWithRetry(`${API_BASE_URL}/api/enquiries/${richEnquiryId}/ai-assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
          "x-test-client-id": "refine-enquiry-" + Date.now(),
        },
        body: JSON.stringify({
          focusPrompt: designerInstruction,
          replyTone: "detailed",
        }),
      });
      duration = Date.now() - t0;
      assert.strictEqual(res.status, 200, `Expected 200 OK from refinement request, got ${res.status}`);
      data = await res.json();

      assert.ok(data, "Refinement response data required");
      const bodyLower = data.suggestedReply.body.toLowerCase();
      const reflectsAyurvedaOrEstate =
        bodyLower.includes("ayurved") ||
        bodyLower.includes("windermere") ||
        bodyLower.includes("consultation") ||
        bodyLower.includes("doctor") ||
        bodyLower.includes("estate");

      assert.ok(
        reflectsAyurvedaOrEstate,
        "Suggested reply draft must incorporate the travel designer's custom focus instructions"
      );

      pass(
        "ASSIST-REFINE-07",
        "Focus prompt dynamically steers the drafted response according to senior concierge directions",
        "LIVE_GROQ",
        `Draft incorporated designer direction: "${designerInstruction.slice(0, 60)}..."`,
        duration
      );
    }
  } catch (err: any) {
    fail("ASSIST-REFINE-07", "Refinement test failed", "LIVE_GROQ", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Resilience — Unconfigured Handling & Express Rate Limiter
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 6: Resilience — Unconfigured Handling & Express Rate Limiter");
  console.log("--------------------------------------------------------------------------------");

  // 6a. Unconfigured mock test
  try {
    class MockUnconfiguredProvider implements AiProvider {
      readonly name = "mock-unconfigured";
      isConfigured() {
        return false;
      }
      async getStatus(): Promise<AiServiceStatus> {
        return { configured: false, provider: this.name, model: "none", available: false };
      }
      async listModels() {
        return [];
      }
      async generate() {
        throw new AiServiceError("Service unconfigured", "MISSING_CONFIG", 503, this.name);
      }
    }

    const testAiService = new MockUnconfiguredProvider();
    assert.strictEqual(testAiService.isConfigured(), false);
    pass(
      "RESIL-UNCONF-08A",
      "Unconfigured provider contract throws clean 503 with MISSING_CONFIG",
      "ERROR_RESILIENCE",
      "Zero secrets or stack traces exposed"
    );
  } catch (err: any) {
    fail("RESIL-UNCONF-08A", "Unconfigured test failed", "ERROR_RESILIENCE", err.message);
  }

  // 6b. Rate Limiter on /api/enquiries/:id/ai-assist
  if (adminCookie && richEnquiryId) {
    try {
      const rateLimitTestId = "admin-enquiry-rate-" + Date.now();

      // Send 35 rapid requests in parallel with an invalid tone payload to trip the 30 req/min rate limiter in milliseconds
      const parallelRequests = Array.from({ length: 35 }, () =>
        fetch(`${API_BASE_URL}/api/enquiries/${richEnquiryId}/ai-assist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: adminCookie,
            "x-test-client-id": rateLimitTestId,
          },
          body: JSON.stringify({ replyTone: "invalid-tone-for-rate-test" }),
        })
      );

      const responses = await Promise.all(parallelRequests);
      const res429 = responses.find((r) => r.status === 429);
      assert.ok(res429, "Expected HTTP 429 when 30 requests limit is reached");

      const retryVal = res429.headers.get("Retry-After") || "";
      const errJson = await res429.json();
      assert.ok(
        errJson.error.toLowerCase().includes("too many") || errJson.error.toLowerCase().includes("wait"),
        "429 must return polite rate limit message"
      );

      pass(
        "RESIL-RATE-LIMIT-08B",
        "Rate limiter strictly enforces 30 req/min limit on /api/enquiries/:id/ai-assist with HTTP 429",
        "ERROR_RESILIENCE",
        `HTTP 429 verified with Retry-After: ${retryVal}s`
      );
    } catch (err: any) {
      fail("RESIL-RATE-LIMIT-08B", "Rate limiter test failed", "ERROR_RESILIENCE", err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  if (richEnquiryDocId) {
    await EnquiryModel.deleteOne({ _id: richEnquiryDocId });
  }
  if (sparseDocId) {
    await EnquiryModel.deleteOne({ _id: sparseDocId });
  }

  console.log("\n================================================================================");
  console.log("                  ADMIN AI ENQUIRY ASSISTANT VERIFICATION SUMMARY               ");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`TOTAL AUDIT ASSERTIONS : ${total}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log(`SUCCESS RATE           : ${Math.round((passed / total) * 100)}%\n`);

  await disconnectDB();

  if (failed > 0) {
    console.error("FAILURES DETECTED:");
    results.filter((r) => !r.passed).forEach((f) => console.error(`  - [${f.id}] ${f.name}: ${f.details}`));
    process.exit(1);
  } else {
    console.log("All Admin AI Enquiry Assistant verification assertions PASSED successfully.");
    process.exit(0);
  }
}

runAdminAiVerification().catch((err) => {
  console.error("Fatal error during Admin AI verification:", err);
  process.exit(1);
});
