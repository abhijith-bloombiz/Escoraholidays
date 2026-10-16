import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distPath = path.resolve(rootDir, "apps/api-server/dist/index.mjs");

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string): void {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  [PASS] ${name}`);
  } else {
    const msg = details ? `${name} - ${details}` : name;
    results.push({ name, passed: false, error: details });
    console.error(`  [FAIL] ${msg}`);
  }
}

// Track IDs created during tests for guaranteed cleanup
const createdDestIds = new Set<number>();
const createdPkgIds = new Set<number>();
const createdOrderIds = new Set<number>();
const createdEnqIds = new Set<number>();
const createdItinIds = new Set<number>();
const createdMediaIds = new Set<number>();

// ---------------------------------------------------------------------------
// SUITE 1: PRODUCTION STARTUP FAIL-FAST VALIDATION
// ---------------------------------------------------------------------------
async function testProductionStartupFailFast(): Promise<void> {
  console.log("\n[Suite 1] Production Startup Fail-Fast Validation:");

  const validHash = "scrypt$" + "a".repeat(32) + "$" + "b".repeat(128);
  const validSecret = "c".repeat(32);
  const validUri = "mongodb://localhost:27017/escora_prod_test";

  async function runStartupCheck(
    name: string,
    envOverrides: Record<string, string>,
    shouldFail: boolean,
    expectedSnippet?: string
  ): Promise<void> {
    const child = spawn(process.execPath, [distPath], {
      env: { ...process.env, PORT: "8094", ...envOverrides },
      stdio: "pipe",
    });

    let output = "";
    child.stdout.on("data", (d) => { output += d; });
    child.stderr.on("data", (d) => { output += d; });

    const timeout = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        child.kill();
        resolve(!shouldFail);
      }, 2000);
    });

    const onExit = new Promise<boolean>((resolve) => {
      child.on("exit", (code) => {
        if (shouldFail) {
          const matched = code !== 0 && (!expectedSnippet || output.includes(expectedSnippet));
          resolve(matched);
        } else {
          resolve(code === 0);
        }
      });
    });

    const passed = await Promise.race([timeout, onExit]);
    assert(passed, name, shouldFail ? `Expected non-zero exit containing "${expectedSnippet}"` : "Expected clean startup");
  }

  await runStartupCheck(
    "Reject missing ADMIN_USER in production",
    { NODE_ENV: "production", ADMIN_USER: "", ADMIN_PASSWORD_HASH: validHash, SESSION_SECRET: validSecret, MONGODB_URI: validUri },
    true,
    "ADMIN_USER is missing or invalid"
  );

  await runStartupCheck(
    "Reject missing ADMIN_PASSWORD_HASH in production",
    { NODE_ENV: "production", ADMIN_USER: "Admin", ADMIN_PASSWORD_HASH: "", SESSION_SECRET: validSecret, MONGODB_URI: validUri },
    true,
    "ADMIN_PASSWORD_HASH is missing"
  );

  await runStartupCheck(
    "Reject malformed ADMIN_PASSWORD_HASH in production",
    { NODE_ENV: "production", ADMIN_USER: "Admin", ADMIN_PASSWORD_HASH: "plain_not_hash", SESSION_SECRET: validSecret, MONGODB_URI: validUri },
    true,
    "unsupported hash format"
  );

  await runStartupCheck(
    "Reject known development default SESSION_SECRET in production",
    { NODE_ENV: "production", ADMIN_USER: "Admin", ADMIN_PASSWORD_HASH: validHash, SESSION_SECRET: "escora-dev-secret-change-in-prod", MONGODB_URI: validUri },
    true,
    "insecure development default"
  );

  await runStartupCheck(
    "Reject short SESSION_SECRET (< 32 chars) in production",
    { NODE_ENV: "production", ADMIN_USER: "Admin", ADMIN_PASSWORD_HASH: validHash, SESSION_SECRET: "short_secret", MONGODB_URI: validUri },
    true,
    "too short"
  );

  await runStartupCheck(
    "Reject missing MONGODB_URI in production",
    { NODE_ENV: "production", ADMIN_USER: "Admin", ADMIN_PASSWORD_HASH: validHash, SESSION_SECRET: validSecret, MONGODB_URI: "" },
    true,
    "MONGODB_URI is missing"
  );
}

// ---------------------------------------------------------------------------
// SUITE 2: FUNCTIONAL API REGRESSION & INTEGRATION TESTS
// ---------------------------------------------------------------------------
async function runApiTests(BASE: string, serverProcess?: ChildProcess): Promise<void> {
  let adminCookie = "";

  try {
    // 1. Health
    console.log("\n[Suite 2] Health & Status:");
    const healthRes = await fetch(`${BASE}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === "ok", "GET /api/health returns 200 OK");

    // 2. Authentication & Session Invalidation
    console.log("\n[Suite 3] Authentication & Session Security:");
    const unauthStats = await fetch(`${BASE}/api/dashboard/stats`);
    assert(unauthStats.status === 401, "GET /api/dashboard/stats rejects unauthenticated with 401");

    const badLogin = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Admin", password: "WrongPasswordXYZ" }),
    });
    assert(badLogin.status === 401, "POST /api/auth/login rejects invalid password with 401");

    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Admin", password: "Admin" }),
    });
    assert(loginRes.status === 200, "POST /api/auth/login succeeds with 200");
    const rawCookie = loginRes.headers.get("set-cookie") || "";
    adminCookie = rawCookie.split(";")[0];
    assert(adminCookie.startsWith("escora.sid="), "POST /api/auth/login issues escora.sid session cookie");

    const authMeRes = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: adminCookie } });
    const authMeData = await authMeRes.json();
    assert(authMeRes.status === 200 && authMeData.authenticated === true, "GET /api/auth/me returns authenticated=true");

    const statsRes = await fetch(`${BASE}/api/dashboard/stats`, { headers: { Cookie: adminCookie } });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && typeof statsData.totalDestinations === "number", "GET /api/dashboard/stats returns stats");

    // 3. Error Contracts
    console.log("\n[Suite 4] Error Contracts & Lookups:");
    const nonDest = await fetch(`${BASE}/api/destinations/999999`);
    const nonDestData = await nonDest.json();
    assert(nonDest.status === 404, "GET nonexistent destination ID returns 404");
    assert(!nonDestData.stack, "404 Error response does not leak internal stack traces");

    const emptyFilterRes = await fetch(`${BASE}/api/packages?category=NonExistentCategoryFilter123`);
    const emptyFilterData = await emptyFilterRes.json();
    assert(emptyFilterRes.status === 200 && Array.isArray(emptyFilterData) && emptyFilterData.length === 0, "Legitimate empty filter returns 200 with empty array []");

    // 4. Destinations CRUD & Update Safety
    console.log("\n[Suite 5] Destinations Module (CRUD & Update Safety):");
    const destCreate = await fetch(`${BASE}/api/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Test Munnar Highlands",
        slug: "test-munnar-highlands",
        region: "Highlands",
        type: "Hill Station",
        shortDesc: "Initial pristine short description.",
        published: true,
      }),
    });
    const destData = await destCreate.json();
    assert(destCreate.status === 201 && typeof destData.id === "number", "POST /api/destinations creates destination");
    createdDestIds.add(destData.id);

    const destById = await fetch(`${BASE}/api/destinations/${destData.id}`);
    const destByIdData = await destById.json();
    assert(destById.status === 200 && destByIdData.slug === "test-munnar-highlands", "GET /api/destinations/:id resolves by numeric ID");

    const destBySlug = await fetch(`${BASE}/api/destinations/test-munnar-highlands`);
    const destBySlugData = await destBySlug.json();
    assert(destBySlug.status === 200 && destBySlugData.id === destData.id, "GET /api/destinations/:slug resolves by slug");

    // Invalid update safety: empty required name
    const badPatchDest = await fetch(`${BASE}/api/destinations/${destData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "   " }),
    });
    assert(badPatchDest.status === 400, "PATCH /api/destinations/:id rejects empty required name with 400");

    // Verify record remains untouched
    const verifyDest = await (await fetch(`${BASE}/api/destinations/${destData.id}`)).json();
    assert(verifyDest.name === "Test Munnar Highlands", "Database record remains unchanged after invalid update rejection");

    // Unpublish
    await fetch(`${BASE}/api/destinations/${destData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ published: false }),
    });
    const pubDests = await (await fetch(`${BASE}/api/destinations?published=true`)).json();
    assert(!pubDests.some((d: any) => d.id === destData.id), "Unpublished destination omitted from public published query");

    // Delete destination
    const delDest = await fetch(`${BASE}/api/destinations/${destData.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(delDest.status === 204 || delDest.status === 200, "DELETE /api/destinations/:id succeeds");
    createdDestIds.delete(destData.id);

    const destAfterDel = await fetch(`${BASE}/api/destinations/${destData.id}`);
    assert(destAfterDel.status === 404, "GET /api/destinations/:id returns 404 after deletion");

    // 5. Packages Module & Relational Deletion Guard
    console.log("\n[Suite 6] Packages & Orders Relational Integrity:");
    const pkgCreate = await fetch(`${BASE}/api/packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Test Cardamom Retreat",
        slug: "test-cardamom-retreat",
        shortDesc: "Private cardamom plantation journey.",
        category: "Luxury",
        durationNights: 4,
        priceFrom: 140000,
        published: true,
      }),
    });
    const pkgData = await pkgCreate.json();
    assert(pkgCreate.status === 201 && typeof pkgData.id === "number", "POST /api/packages creates package");
    createdPkgIds.add(pkgData.id);

    // Create booking order with all required fields including guestPhone
    const orderCreate = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: pkgData.id,
        packageName: "Test Cardamom Retreat",
        guestName: "Arun Test Guest",
        guestEmail: "guest.test@example.com",
        guestPhone: "+91 9123456789",
        guestCount: 2,
        travelDate: "2026-11-20",
        budgetRange: "₹1,50,000+",
      }),
    });
    const orderData = await orderCreate.json();
    assert(orderCreate.status === 201 && orderData.packageId === pkgData.id, "POST /api/orders creates booking order with required guestPhone");
    assert(orderData.status === "enquiry", "Order record status defaults to 'enquiry'");
    createdOrderIds.add(orderData.id);

    // Relational deletion guard: delete package while order exists
    const blockedPkgDel = await fetch(`${BASE}/api/packages/${pkgData.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(blockedPkgDel.status === 409, "DELETE /api/packages/:id blocked with 409 Conflict when referenced by active order");

    // Verify order and package are intact
    const orderCheck = await fetch(`${BASE}/api/orders/${orderData.id}`, { headers: { Cookie: adminCookie } });
    assert(orderCheck.status === 200, "Referenced order is preserved and intact after blocked package deletion");

    // Clean up order first, then package
    const delOrder = await fetch(`${BASE}/api/orders/${orderData.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(delOrder.status === 204 || delOrder.status === 200, "DELETE /api/orders/:id succeeds");
    createdOrderIds.delete(orderData.id);

    const cleanPkgDel = await fetch(`${BASE}/api/packages/${pkgData.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(cleanPkgDel.status === 204 || cleanPkgDel.status === 200, "DELETE /api/packages/:id succeeds after order deletion");
    createdPkgIds.delete(pkgData.id);

    // 6. Orders Export
    console.log("\n[Suite 7] Orders CSV Export:");
    const exportRes = await fetch(`${BASE}/api/orders/export`, { headers: { Cookie: adminCookie } });
    const exportText = await exportRes.text();
    assert(exportRes.status === 200 && exportRes.headers.get("content-type")?.includes("text/csv") === true, "GET /api/orders/export returns CSV content");
    assert(exportText.startsWith("ID,Guest Name,Email"), "CSV export contains standard headers");

    // 7. Enquiries Module
    console.log("\n[Suite 8] Enquiries Module:");
    const enqCreate = await fetch(`${BASE}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Enquiry Lead",
        email: "lead.test@example.com",
        phone: "+91 9888877777",
        message: "Looking for customized luxury houseboat itinerary.",
      }),
    });
    const enqData = await enqCreate.json();
    assert(enqCreate.status === 201 && enqData.status === "new", "POST /api/enquiries creates enquiry with default status 'new'");
    createdEnqIds.add(enqData.id);

    // Enquiry vs Order discrimination
    const enqInOrders = await fetch(`${BASE}/api/orders/${enqData.id}`, { headers: { Cookie: adminCookie } });
    assert(enqInOrders.status === 404, "Enquiry record does NOT appear in orders collection");

    // Patch status
    const patchEnq = await fetch(`${BASE}/api/enquiries/${enqData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ status: "replied" }),
    });
    assert(patchEnq.status === 200, "PATCH /api/enquiries/:id updates status to 'replied'");

    const delEnq = await fetch(`${BASE}/api/enquiries/${enqData.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(delEnq.status === 204 || delEnq.status === 200, "DELETE /api/enquiries/:id succeeds");
    createdEnqIds.delete(enqData.id);

    // 8. Journal Module
    console.log("\n[Suite 9] Journal Module (Draft Restrictions & Publishing):");
    const draftJournal = await fetch(`${BASE}/api/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        title: "Test Spice Trail Chronicles",
        slug: "test-spice-trail-chronicles",
        excerpt: "An inside look into Kerala spices.",
        content: "Story paragraphs.\n\nMore paragraphs.",
        category: "Culture",
        published: false,
      }),
    });
    const journalData = await draftJournal.json();
    assert(draftJournal.status === 201 && typeof journalData.id === "number", "POST /api/journal creates draft post");
    createdJournalIds.add(journalData.id);

    const pubJournalList = await (await fetch(`${BASE}/api/journal?published=true`)).json();
    assert(!pubJournalList.some((p: any) => p.id === journalData.id), "Draft journal post omitted from public published query");

    const directDraft = await fetch(`${BASE}/api/journal/${journalData.id}`);
    assert(directDraft.status === 404, "Direct unauthenticated lookup of draft article returns 404");

    // Publish
    await fetch(`${BASE}/api/journal/${journalData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ published: true }),
    });

    const directPublished = await fetch(`${BASE}/api/journal/${journalData.id}`);
    assert(directPublished.status === 200, "Direct lookup of published article returns 200 OK");

    const delJournal = await fetch(`${BASE}/api/journal/${journalData.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(delJournal.status === 204 || delJournal.status === 200, "DELETE /api/journal/:id succeeds");
    createdJournalIds.delete(journalData.id);

    // 9. Itineraries Module
    console.log("\n[Suite 10] Itineraries Module & Public Share Tokens:");
    const itinCreate = await fetch(`${BASE}/api/itineraries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        customerName: "Test Itinerary Traveler",
        title: "Test Kerala Journey 5D4N",
        destination: "Kochi, Munnar",
        status: "draft",
        days: JSON.stringify([{ day: 1, title: "Arrival" }]),
      }),
    });
    const itinData = await itinCreate.json();
    assert(itinCreate.status === 201 && typeof itinData.shareToken === "string", "POST /api/itineraries creates itinerary with shareToken");
    createdItinIds.add(itinData.id);

    // Draft itinerary share link returns 404 for unauthenticated public viewers
    const draftShareRes = await fetch(`${BASE}/api/itineraries/share/${itinData.shareToken}`);
    assert(draftShareRes.status === 404, "Draft itinerary share link returns 404 for unauthenticated public viewers");

    // Update status to 'shared'
    const patchItin = await fetch(`${BASE}/api/itineraries/${itinData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ status: "shared" }),
    });
    assert(patchItin.status === 200, "PATCH /api/itineraries/:id activates status to 'shared'");

    const shareRes = await fetch(`${BASE}/api/itineraries/share/${itinData.shareToken}`);
    assert(shareRes.status === 200, "GET /api/itineraries/share/:token retrieves shared itinerary publicly once activated");

    const badShareRes = await fetch(`${BASE}/api/itineraries/share/invalid_share_token_xyz`);
    assert(badShareRes.status === 404, "GET /api/itineraries/share/:token with invalid token returns 404");

    const delItin = await fetch(`${BASE}/api/itineraries/${itinData.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(delItin.status === 204 || delItin.status === 200, "DELETE /api/itineraries/:id succeeds");
    createdItinIds.delete(itinData.id);

    // 10. Media Upload Validation & Serving
    console.log("\n[Suite 11] Media Upload & File Serving:");
    // Test 1: Fake non-image file
    const fakeBuffer = Buffer.from("<?php echo 'malicious'; ?>");
    const fakeUpload = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: { Cookie: adminCookie, "content-type": "image/png", "x-filename": "exploit.png" },
      body: fakeBuffer,
    });
    assert(fakeUpload.status === 400, "POST /api/media/upload rejects non-image payload with 400 Unsupported file type");

    // Test 2: Oversize file (> 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0x41);
    const oversizeUpload = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: { Cookie: adminCookie, "content-type": "image/png", "x-filename": "oversized.png" },
      body: largeBuffer,
    });
    assert(oversizeUpload.status === 413, "POST /api/media/upload rejects 11MB payload with 413 File exceeds limit");

    // Test 3: Valid 1x1 PNG file
    const validPng = Buffer.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
      0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5,
      0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66,
      96, 130,
    ]);
    const validUpload = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: { Cookie: adminCookie, "content-type": "image/png", "x-filename": "valid-pixel.png" },
      body: validPng,
    });
    const validMedia = await validUpload.json();
    assert(validUpload.status === 201 && typeof validMedia.id === "number", "POST /api/media/upload succeeds for genuine PNG");
    createdMediaIds.add(validMedia.id);

    const savedName = path.basename(validMedia.url);
    const fileRes = await fetch(`${BASE}/api/media/files/${savedName}`);
    assert(fileRes.status === 200, "GET /api/media/files/:filename serves uploaded media file");

    const delMedia = await fetch(`${BASE}/api/media/${validMedia.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(delMedia.status === 204 || delMedia.status === 200, "DELETE /api/media/:id removes media record and disk file");
    createdMediaIds.delete(validMedia.id);

    // 11. Logout & Invalidation
    console.log("\n[Suite 12] Logout & Session Invalidation:");
    const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });
    assert(logoutRes.status === 200, "POST /api/auth/logout returns 200 OK");

    const meAfterLogout = await fetch(`${BASE}/api/auth/me`, {
      headers: { Cookie: adminCookie },
    });
    assert(meAfterLogout.status === 401, "GET /api/auth/me rejects invalidated session with 401");
  } finally {
    // -------------------------------------------------------------------------
    // GUARANTEED CLEANUP: Wipe ONLY tracked records created by this test run
    // -------------------------------------------------------------------------
    console.log("\n[Cleanup] Wiping only records created during this test run...");
    try {
      const login = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "Admin", password: "Admin" }),
      });
      const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";

      for (const id of createdOrderIds) {
        await fetch(`${BASE}/api/orders/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
      }
      for (const id of createdPkgIds) {
        await fetch(`${BASE}/api/packages/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
      }
      for (const id of createdDestIds) {
        await fetch(`${BASE}/api/destinations/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
      }
      for (const id of createdEnqIds) {
        await fetch(`${BASE}/api/enquiries/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
      }
      for (const id of createdJournalIds) {
        await fetch(`${BASE}/api/journal/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
      }
      for (const id of createdItinIds) {
        await fetch(`${BASE}/api/itineraries/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
      }
      for (const id of createdMediaIds) {
        await fetch(`${BASE}/api/media/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
      }

      await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
      console.log("  [PASS] Cleanup complete. Zero leftover test records.");
    } catch (cleanupErr) {
      console.error("  [WARN] Cleanup encountered error:", cleanupErr);
    }

    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
  }
}

const createdJournalIds = new Set<number>();

// ---------------------------------------------------------------------------
// MAIN EXECUTION ENTRYPOINT
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("================================================================================");
  console.log("          ESCORA HOLIDAYS — AUTOMATED API REGRESSION & AUDIT SUITE              ");
  console.log("================================================================================");

  // 1. Run production startup checks
  await testProductionStartupFailFast();

  // 2. Launch an isolated API server process on port 8089 to test newly compiled code
  const TEST_PORT = "8089";
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  console.log(`\nLaunching dedicated test API server process on port ${TEST_PORT}...`);
  const server = spawn(process.execPath, [
    "--env-file-if-exists=../../.env",
    "--env-file-if-exists=.env",
    distPath,
  ], {
    cwd: path.resolve(rootDir, "apps/api-server"),
    env: { ...process.env, PORT: TEST_PORT },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout?.on("data", (d) => {
    const str = d.toString();
    if (str.includes("fatal") || str.includes("error")) {
      process.stderr.write(`[SERVER] ${str}`);
    }
  });

  // Wait for server to become healthy
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (!ready) {
    server.kill();
    throw new Error(`Test server failed to start on port ${TEST_PORT}`);
  }

  console.log(`Test API server is ready at ${BASE_URL}`);

  // Run all functional tests
  await runApiTests(BASE_URL, server);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n================================================================================");
  console.log(`TOTAL AUDIT ASSERTIONS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${Math.round((passed / results.length) * 100)}%`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in test execution:", err);
  process.exit(1);
});
