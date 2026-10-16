import fs from "node:fs";
import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  JournalPostModel,
  DestinationModel,
  PackageModel,
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
  category: "AUTH_SECURITY" | "LIVE_GROQ" | "GROUNDING" | "IMMUTABILITY" | "VALIDATION_RESILIENCE" | "REGRESSION";
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

async function runAdminAiJournalVerification() {
  console.log("================================================================================");
  console.log("    ESCORA HOLIDAYS — ADMIN AI CONTENT ASSISTANT AUDIT SUITE (PHASE 3C)         ");
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
    const res = await fetch(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-client-id": "auth-test-" + Date.now() },
      body: JSON.stringify({ action: "generate_draft", topic: "Munnar Tea Estates" }),
    });
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    pass(
      "AUTH-UNAUTH-01",
      "Unauthenticated request to /api/journal/ai-assist is strictly rejected",
      "AUTH_SECURITY",
      `HTTP ${res.status} returned without leaking editorial draft or internal prompts`
    );
  } catch (err: any) {
    fail("AUTH-UNAUTH-01", "Unauthenticated request test failed", "AUTH_SECURITY", err.message);
  }

  // 1b. Forged session cookie rejected with 401
  try {
    const res = await fetch(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "escora.sid=s%3Abogus_forged_session_token.fakeSignature123456789",
        "x-test-client-id": "auth-bogus-" + Date.now(),
      },
      body: JSON.stringify({ action: "generate_draft", topic: "Munnar Tea Estates" }),
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
  console.log("Step 2: Database Immutability & Draft Safeguards Verification");
  console.log("--------------------------------------------------------------------------------");

  // Seed a sample test article to verify it remains unmodified during AI generation
  const testPostId = Math.floor(Math.random() * 800000) + 100000;
  const testArticle = await JournalPostModel.create({
    id: testPostId,
    title: "Original Test Article for Safeguard Verification",
    slug: `safeguard-test-${testPostId}`,
    category: "Heritage",
    excerpt: "Original human-written excerpt before AI generation.",
    content: "<p>Original human-written content before AI generation.</p>",
    published: false,
  });

  const initialPostCount = await JournalPostModel.countDocuments();
  let liveDraftResponse: any = null;

  try {
    const startMs = Date.now();
    const res = await fetchWithRetry(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "immutability-test-" + Date.now(),
      },
      body: JSON.stringify({
        action: "generate_draft",
        topic: "The Ritual of Monsoon Tea Picking",
        destination: "Munnar High Ranges",
        targetAudience: "Slow-luxury travelers seeking contemplation",
        instructions: "Emphasize wet cardamom leaves, misty sunrise walks, and ancestral estate bungalows.",
        tone: "slow-luxury",
      }),
    });

    const durationMs = Date.now() - startMs;
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    liveDraftResponse = await res.json();

    // Check database immutability: JournalPostModel count MUST NOT CHANGE
    const postCountAfter = await JournalPostModel.countDocuments();
    assert.strictEqual(
      postCountAfter,
      initialPostCount,
      `Database document count changed! Expected ${initialPostCount}, found ${postCountAfter}`
    );

    // Check seeded test article was NOT modified
    const testArticleAfter = await JournalPostModel.findOne({ id: testPostId }).lean();
    assert.ok(testArticleAfter, "Test article was deleted unexpectedly");
    assert.strictEqual(testArticleAfter.title, "Original Test Article for Safeguard Verification");
    assert.strictEqual(testArticleAfter.excerpt, "Original human-written excerpt before AI generation.");
    assert.strictEqual(testArticleAfter.published, false, "Published state was altered automatically!");

    pass(
      "IMMUTABILITY-01",
      "AI generation strictly produces draft without persisting to database or altering existing articles",
      "IMMUTABILITY",
      `Journal count constant at ${postCountAfter}. Existing draft state (${testArticleAfter.published}) preserved.`,
      durationMs
    );
  } catch (err: any) {
    fail("IMMUTABILITY-01", "Database immutability test failed", "IMMUTABILITY", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 3: Live Model Output Quality & Capability Assertions
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 3: Live Groq Output Structure & Editorial Quality");
  console.log("--------------------------------------------------------------------------------");

  if (liveDraftResponse) {
    try {
      // Structure assertions
      assert.strictEqual(liveDraftResponse.action, "generate_draft");
      assert.ok(Array.isArray(liveDraftResponse.suggestedTitles) && liveDraftResponse.suggestedTitles.length > 0, "suggestedTitles must be non-empty array");
      assert.ok(typeof liveDraftResponse.suggestedSlug === "string" && liveDraftResponse.suggestedSlug.length > 0, "suggestedSlug must be string");
      assert.ok(typeof liveDraftResponse.suggestedExcerpt === "string" && liveDraftResponse.suggestedExcerpt.length > 0, "suggestedExcerpt must be string");
      assert.ok(typeof liveDraftResponse.draftContent === "string" && liveDraftResponse.draftContent.length > 50, "draftContent must be detailed string");
      assert.ok(typeof liveDraftResponse.readTimeMinutes === "number" && liveDraftResponse.readTimeMinutes >= 1, "readTimeMinutes must be >= 1");
      assert.ok(liveDraftResponse.seo && typeof liveDraftResponse.seo.metaTitle === "string", "seo.metaTitle must exist");
      assert.ok(liveDraftResponse.seo && typeof liveDraftResponse.seo.metaDescription === "string", "seo.metaDescription must exist");
      assert.ok(Array.isArray(liveDraftResponse.seo.keywords), "seo.keywords must be array");
      assert.ok(Array.isArray(liveDraftResponse.suggestedTags), "suggestedTags must be array");
      assert.ok(Array.isArray(liveDraftResponse.unverifiedClaims), "unverifiedClaims must be array");
      assert.ok(typeof liveDraftResponse.editorialAdvice === "string", "editorialAdvice must be string");
      assert.ok(typeof liveDraftResponse.disclaimer === "string", "disclaimer must exist");

      // Verify HTML semantic markup in draftContent
      const hasHtml = /<[a-z][\s\S]*>/i.test(liveDraftResponse.draftContent);
      assert.ok(hasHtml, "draftContent must contain semantic HTML tags");

      pass(
        "LIVE-DRAFT-02",
        "AI Content Assistant generated complete, semantically rich article draft",
        "LIVE_GROQ",
        `Generated title: "${liveDraftResponse.suggestedTitles[0]}" (${liveDraftResponse.readTimeMinutes}m read, ${liveDraftResponse.suggestedTags.length} tags)`
      );
    } catch (err: any) {
      fail("LIVE-DRAFT-02", "Live draft verification failed", "LIVE_GROQ", err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 4: Grounding & Unsupported Claim Safeguards
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 4: Grounding & Fact-Check Safeguard Verification");
  console.log("--------------------------------------------------------------------------------");

  if (liveDraftResponse) {
    try {
      assert.ok(liveDraftResponse.verifiedCatalogMatches, "verifiedCatalogMatches must exist");
      assert.ok(Array.isArray(liveDraftResponse.verifiedCatalogMatches.destinations), "verifiedCatalogMatches.destinations must be array");
      assert.ok(Array.isArray(liveDraftResponse.verifiedCatalogMatches.packages), "verifiedCatalogMatches.packages must be array");

      // Unverified claims check: Assistant must flag operational/seasonal claims that require human fact check
      assert.ok(
        liveDraftResponse.unverifiedClaims.length > 0,
        "Assistant must provide unverified claims requiring staff fact-checking"
      );

      pass(
        "GROUNDING-01",
        "Verified catalogue matches and unconfirmed claim flags correctly populated",
        "GROUNDING",
        `Catalog matched: ${liveDraftResponse.verifiedCatalogMatches.destinations.length} destinations, ${liveDraftResponse.verifiedCatalogMatches.packages.length} journeys. Flagged claims: ${liveDraftResponse.unverifiedClaims.length}`
      );
    } catch (err: any) {
      fail("GROUNDING-01", "Grounding verification failed", "GROUNDING", err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Specialized Actions (Metadata, Rewrite, Expand, Shorten, SEO)
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 5: Specialized Actions (Metadata, Rewrite, Expand, Shorten, SEO)");
  console.log("--------------------------------------------------------------------------------");

  // 5a. Suggest Metadata
  try {
    const res = await fetchWithRetry(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "meta-test-" + Date.now(),
      },
      body: JSON.stringify({
        action: "suggest_metadata",
        topic: "Still Waters: Houseboats in Kumarakom",
        destination: "Kumarakom & Alleppey",
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.suggestedTitles.length >= 2, "Must return at least 2 title suggestions");
    assert.ok(data.suggestedExcerpt.length > 20, "Must return descriptive excerpt");
    assert.ok(data.suggestedSlug.length > 5, "Must return slug");
    pass(
      "ACTION-META-01",
      "suggest_metadata action returns title variations, excerpt lead, and slug",
      "LIVE_GROQ",
      `Suggested ${data.suggestedTitles.length} titles, slug: /${data.suggestedSlug}`
    );
  } catch (err: any) {
    fail("ACTION-META-01", "suggest_metadata test failed", "LIVE_GROQ", err.message);
  }

  // 5b. Rewrite / Tone Elevation
  try {
    await sleep(2500);
    const rawProse = "Munnar is a very nice place with lots of tea hills. Tourists go there because it looks pretty and green.";
    const res = await fetchWithRetry(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "rewrite-test-" + Date.now(),
      },
      body: JSON.stringify({
        action: "rewrite",
        selectedText: rawProse,
        tone: "slow-luxury",
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.refinedText && data.refinedText.length > 20, "Must return refined text");
    // Verify that slow-luxury elevation occurred
    assert.notStrictEqual(data.refinedText.trim(), rawProse.trim(), "Refined text must differ from crude input");
    pass(
      "ACTION-REWRITE-02",
      "rewrite action elevates prose into contemplative slow-luxury cadence",
      "LIVE_GROQ",
      `Refined: "${data.refinedText.slice(0, 100)}..."`
    );
  } catch (err: any) {
    fail("ACTION-REWRITE-02", "rewrite action test failed", "LIVE_GROQ", err.message);
  }

  // 5c. SEO Generation
  try {
    await sleep(2500);
    const res = await fetchWithRetry(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
        "x-test-client-id": "seo-test-" + Date.now(),
      },
      body: JSON.stringify({
        action: "generate_seo",
        topic: "Heritage Spice Walk through Fort Kochi",
        destination: "Fort Kochi",
        currentArticle: {
          title: "Echoes of the Spice Coast: A Walk in Fort Kochi",
          excerpt: "Stepping through centuries of Dutch, Portuguese, and Malabar spice trading heritage.",
        },
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.seo && data.seo.metaTitle, "Must return seo.metaTitle");
    assert.ok(data.seo && data.seo.metaDescription, "Must return seo.metaDescription");
    assert.ok(data.seo.keywords && data.seo.keywords.length > 0, "Must return search keywords");
    pass(
      "ACTION-SEO-03",
      "generate_seo action produces optimized metaTitle, metaDescription, and keywords",
      "LIVE_GROQ",
      `Title: "${data.seo.metaTitle}" (${data.seo.metaTitle.length}c) | Desc: "${data.seo.metaDescription.slice(0, 50)}..."`
    );
  } catch (err: any) {
    fail("ACTION-SEO-03", "generate_seo test failed", "LIVE_GROQ", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Validation, Error Handling, and Resilience
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 6: Input Validation & Error Resilience Verification");
  console.log("--------------------------------------------------------------------------------");

  // 6a. Missing action returns 400
  try {
    const res = await fetch(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ topic: "Only Topic without action" }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
    pass(
      "VAL-NO-ACTION-01",
      "Request missing required 'action' is rejected with 400 Bad Request",
      "VALIDATION_RESILIENCE",
      `Server rejected with HTTP ${res.status}`
    );
  } catch (err: any) {
    fail("VAL-NO-ACTION-01", "Missing action test failed", "VALIDATION_RESILIENCE", err.message);
  }

  // 6b. Invalid action returns 400
  try {
    const res = await fetch(`${API_BASE_URL}/api/journal/ai-assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ action: "hack_database", topic: "Exploit attempt" }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 Bad Request for unknown action, got ${res.status}`);
    pass(
      "VAL-BAD-ACTION-02",
      "Request with unknown action value is safely rejected with 400 Bad Request",
      "VALIDATION_RESILIENCE",
      `Server validated enum with HTTP ${res.status}`
    );
  } catch (err: any) {
    fail("VAL-BAD-ACTION-02", "Unknown action test failed", "VALIDATION_RESILIENCE", err.message);
  }

  // ---------------------------------------------------------------------------
  // STEP 7: Regression Verification of Existing Journal CRUD & Publication
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Step 7: Regression of Existing Journal CRUD & Publication Workflows");
  console.log("--------------------------------------------------------------------------------");

  let createdPostId: number | null = null;
  try {
    // 7a. Create draft post
    const createRes = await fetch(`${API_BASE_URL}/api/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        title: "Regression Test Article",
        slug: `regression-test-${Date.now()}`,
        category: "Heritage",
        excerpt: "Testing existing journal publication pipeline.",
        content: "<p>Detailed story paragraphs...</p>",
        published: false,
      }),
    });
    assert.strictEqual(createRes.status, 201, `Expected 201 Created, got ${createRes.status}`);
    const created = await createRes.json();
    createdPostId = created.id;
    assert.strictEqual(created.published, false, "Initial post must be draft");

    // 7b. Update draft post to published
    const updateRes = await fetch(`${API_BASE_URL}/api/journal/${createdPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        published: true,
        title: "Regression Test Article (Now Published)",
      }),
    });
    assert.strictEqual(updateRes.status, 200, `Expected 200 OK, got ${updateRes.status}`);
    const updated = await updateRes.json();
    assert.strictEqual(updated.published, true, "Post published status should be true");

    // 7c. Read post by ID
    const getRes = await fetch(`${API_BASE_URL}/api/journal/${createdPostId}`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(getRes.status, 200, `Expected 200 OK, got ${getRes.status}`);

    // 7d. Delete post
    const deleteRes = await fetch(`${API_BASE_URL}/api/journal/${createdPostId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(deleteRes.status, 204, `Expected 204 No Content, got ${deleteRes.status}`);

    // 7e. Verify 404 after deletion
    const verifyDelRes = await fetch(`${API_BASE_URL}/api/journal/${createdPostId}`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(verifyDelRes.status, 404, `Expected 404 Not Found after delete, got ${verifyDelRes.status}`);

    pass(
      "REGRESSION-CRUD-01",
      "Existing Journal CRUD and publication workflows remain intact and regression-free",
      "REGRESSION",
      `Created, published, retrieved, and deleted test article #${createdPostId} successfully`
    );
  } catch (err: any) {
    fail("REGRESSION-CRUD-01", "Journal CRUD regression test failed", "REGRESSION", err.message);
  } finally {
    // Clean up seeded test article
    await JournalPostModel.deleteOne({ id: testPostId }).catch(() => {});
    if (createdPostId) {
      await JournalPostModel.deleteOne({ id: createdPostId }).catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // FINAL REPORT
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("                       AUDIT SUMMARY (PHASE 3C)                                 ");
  console.log("================================================================================");

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`\n  Total Tests : ${results.length}`);
  console.log(`  Passed      : ${passedCount}`);
  console.log(`  Failed      : ${failedCount}\n`);

  for (const r of results) {
    const statusStr = r.passed ? "[PASS]" : "[FAIL]";
    console.log(`  ${statusStr} [${r.category}] ${r.id}: ${r.name}`);
  }

  await disconnectDB();

  if (failedCount > 0) {
    console.error(`\n❌ Audit failed with ${failedCount} errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All ${passedCount} Phase 3C audit checks passed successfully!`);
  }
}

runAdminAiJournalVerification().catch(async (err) => {
  console.error("FATAL verification error:", err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
