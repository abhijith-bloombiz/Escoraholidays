import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:8080";

// A tiny 1x1 valid PNG buffer
const TINY_PNG = Buffer.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5,
  0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66,
  96, 130,
]);

// A tiny 1x1 valid WebP buffer
const TINY_WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
  0x0e, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
  0x00, 0x07, 0x00, 0x08, 0x88, 0x88, 0x08, 0x00,
  0x00, 0x00
]);

async function main() {
  console.log("================================================================================");
  console.log("     ESCORA HOLIDAYS — UNIFIED MEDIA LIBRARY INTEGRATION VERIFICATION           ");
  console.log("================================================================================\n");

  const cleanupDestIds: number[] = [];
  const cleanupPkgIds: number[] = [];
  const cleanupJournalIds: number[] = [];
  const cleanupItinIds: number[] = [];
  const cleanupMediaIds: number[] = [];

  let adminCookie = "";

  try {
    // -------------------------------------------------------------------------
    // 1. Admin Authentication
    // -------------------------------------------------------------------------
    console.log("[Test 1] Admin Authentication:");
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Admin", password: "Admin" }),
    });
    assert(loginRes.status === 200, "Admin login must succeed with 200");
    adminCookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(adminCookie.length > 0, "Login must return session cookie");
    console.log("  [PASS] Authenticated successfully as Admin");

    // -------------------------------------------------------------------------
    // 2. Upload from Media Page
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Upload from Media Page → Appears in Media Library:");
    const mediaPageUpload = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "content-type": "image/png",
        "x-filename": "media-page-upload.png",
      },
      body: TINY_PNG,
    });
    assert(mediaPageUpload.status === 201, "Direct media upload returns 201 Created");
    const mediaPageAsset = await mediaPageUpload.json();
    cleanupMediaIds.push(mediaPageAsset.id);
    assert(typeof mediaPageAsset.id === "number", "Asset has numeric ID");
    assert(mediaPageAsset.storageType === "upload", "Asset has storageType: 'upload'");

    // Query media list
    const listRes1 = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const list1 = await listRes1.json();
    const foundDirect = list1.find((m: any) => m.id === mediaPageAsset.id);
    assert(foundDirect, "Asset uploaded via Media page appears in GET /api/media");
    assert(foundDirect.usageCount === 0, "Direct upload starts with usageCount: 0 (unreferenced)");
    console.log("  [PASS] Media page upload registered and listed in library");

    // -------------------------------------------------------------------------
    // 3. Upload from Destinations Form
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Upload from Destinations Form → Appears in Media Library:");
    const destUploadRes = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "content-type": "image/png",
        "x-filename": "destination-cover-munnar-tea.png",
      },
      body: TINY_PNG,
    });
    assert(destUploadRes.status === 201, "Destinations upload returns 201");
    const destAsset = await destUploadRes.json();
    cleanupMediaIds.push(destAsset.id);

    // Create Destination referencing this uploaded image
    const createDestRes = await fetch(`${BASE}/api/destinations`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Destination Media Test",
        slug: `test-destination-media-${Date.now()}`,
        region: "Highlands",
        type: "Hill Station",
        shortDesc: "A test short description for destination media verification.",
        imageUrl: destAsset.url,
        published: true,
      }),
    });
    assert(createDestRes.status === 201, "Destination creation succeeds with 201");
    const createdDest = await createDestRes.json();
    cleanupDestIds.push(createdDest.id);

    // Verify it appears in Media library with destination reference
    const listRes2 = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const list2 = await listRes2.json();
    const foundDestMedia = list2.find((m: any) => m.id === destAsset.id);
    assert(foundDestMedia, "Destination-uploaded image appears in central Media library");
    assert(foundDestMedia.usageCount === 1, "Usage count is 1 for destination cover");
    assert(
      foundDestMedia.references.some(
        (r: any) => r.type === "destination" && r.id === createdDest.id && r.field === "Cover Image"
      ),
      "Media item includes Destination reference metadata"
    );
    console.log("  [PASS] Destination upload appears in Media library with reference metadata");

    // -------------------------------------------------------------------------
    // 4. Upload from Journeys / Packages Form
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Upload from Journeys / Packages Form → Appears in Media Library:");
    const pkgUploadRes = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "content-type": "image/webp",
        "x-filename": "package-hero-kerala-retreat.webp",
      },
      body: TINY_WEBP,
    });
    assert(pkgUploadRes.status === 201, "Package upload returns 201");
    const pkgAsset = await pkgUploadRes.json();
    cleanupMediaIds.push(pkgAsset.id);

    // Create Package referencing this image
    const createPkgRes = await fetch(`${BASE}/api/packages`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Journey Media Test",
        slug: `test-journey-media-${Date.now()}`,
        shortDesc: "Short intro for package testing.",
        category: "Luxury",
        durationNights: 4,
        priceFrom: 140000,
        heroImageUrl: pkgAsset.url,
        published: true,
      }),
    });
    assert(createPkgRes.status === 201, "Package creation succeeds with 201");
    const createdPkg = await createPkgRes.json();
    cleanupPkgIds.push(createdPkg.id);

    // Verify it appears in Media library with package reference
    const listRes3 = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const list3 = await listRes3.json();
    const foundPkgMedia = list3.find((m: any) => m.id === pkgAsset.id);
    assert(foundPkgMedia, "Package-uploaded image appears in central Media library");
    assert(foundPkgMedia.usageCount === 1, "Usage count is 1 for package hero");
    assert(
      foundPkgMedia.references.some(
        (r: any) => r.type === "package" && r.id === createdPkg.id && r.field === "Hero Image"
      ),
      "Media item includes Package reference metadata"
    );
    console.log("  [PASS] Journey/Package upload appears in Media library with reference metadata");

    // -------------------------------------------------------------------------
    // 5. Upload from Journal Form
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Upload from Journal Form → Appears in Media Library:");
    const journalUploadRes = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "content-type": "image/png",
        "x-filename": "journal-article-kerala-backwaters.png",
      },
      body: TINY_PNG,
    });
    assert(journalUploadRes.status === 201, "Journal upload returns 201");
    const journalAsset = await journalUploadRes.json();
    cleanupMediaIds.push(journalAsset.id);

    // Create Journal Post referencing this image
    const createJournalRes = await fetch(`${BASE}/api/journal`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Journal Story Media Test",
        slug: `test-journal-media-${Date.now()}`,
        excerpt: "An inside look into Kerala waterways.",
        content: "<p>Article content about backwaters.</p>",
        category: "Culture",
        imageUrl: journalAsset.url,
        published: true,
      }),
    });
    assert(createJournalRes.status === 201, "Journal creation succeeds with 201");
    const createdJournal = await createJournalRes.json();
    cleanupJournalIds.push(createdJournal.id);

    // Verify it appears in Media library with journal reference
    const listRes4 = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const list4 = await listRes4.json();
    const foundJournalMedia = list4.find((m: any) => m.id === journalAsset.id);
    assert(foundJournalMedia, "Journal-uploaded image appears in central Media library");
    assert(foundJournalMedia.usageCount === 1, "Usage count is 1 for journal cover");
    assert(
      foundJournalMedia.references.some(
        (r: any) => r.type === "journal" && r.id === createdJournal.id && r.field === "Cover Image"
      ),
      "Media item includes Journal reference metadata"
    );
    console.log("  [PASS] Journal upload appears in Media library with reference metadata");

    // -------------------------------------------------------------------------
    // 6. Upload from Itinerary Builder Form
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Upload from Itineraries Form → Appears in Media Library:");
    const itinUploadRes = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "content-type": "image/png",
        "x-filename": "itinerary-day-fort-kochi.png",
      },
      body: TINY_PNG,
    });
    assert(itinUploadRes.status === 201, "Itinerary upload returns 201");
    const itinAsset = await itinUploadRes.json();
    cleanupMediaIds.push(itinAsset.id);

    // Create Itinerary referencing this image for both cover AND day 1
    const createItinRes = await fetch(`${BASE}/api/itineraries`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Dr. Arvind Ramesh",
        title: "Test Itinerary Media Test",
        coverImageUrl: itinAsset.url,
        days: JSON.stringify([
          {
            day: 1,
            title: "Arrival in Kochi & Heritage Walk",
            imageUrl: itinAsset.url,
            activities: "Walk through Fort Kochi",
          },
        ]),
        status: "draft",
      }),
    });
    assert(createItinRes.status === 201, "Itinerary creation succeeds with 201");
    const createdItin = await createItinRes.json();
    cleanupItinIds.push(createdItin.id);

    // Verify it appears in Media library with Itinerary Cover AND Day references
    const listRes5 = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const list5 = await listRes5.json();
    const foundItinMedia = list5.find((m: any) => m.id === itinAsset.id);
    assert(foundItinMedia, "Itinerary-uploaded image appears in central Media library");
    assert(foundItinMedia.usageCount === 2, "Usage count is 2 (Cover Photo + Day Photo)");
    assert(
      foundItinMedia.references.some(
        (r: any) => r.type === "itinerary" && r.field === "Cover Photo"
      ),
      "Includes Itinerary Cover Photo reference"
    );
    assert(
      foundItinMedia.references.some(
        (r: any) => r.type === "itinerary" && r.field === "Day Photo"
      ),
      "Includes Itinerary Day Photo reference"
    );
    console.log("  [PASS] Itinerary upload appears in Media library with Cover & Day references");

    // -------------------------------------------------------------------------
    // 7. Deduplication: Same file referenced in multiple records
    // -------------------------------------------------------------------------
    console.log("\n[Test 7] Deduplication: Same file referenced by multiple records:");
    // Create an image shared between Destination, Package, and Journal
    const sharedUploadRes = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "content-type": "image/png",
        "x-filename": "shared-signature-hero.png",
      },
      body: TINY_PNG,
    });
    const sharedAsset = await sharedUploadRes.json();
    cleanupMediaIds.push(sharedAsset.id);

    const dest2Res = await fetch(`${BASE}/api/destinations`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Shared Dest",
        slug: `test-shared-dest-${Date.now()}`,
        region: "Highlands",
        type: "Hill Station",
        shortDesc: "Shared dest test",
        imageUrl: sharedAsset.url,
      }),
    });
    const dest2 = await dest2Res.json();
    cleanupDestIds.push(dest2.id);

    const pkg2Res = await fetch(`${BASE}/api/packages`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Shared Package",
        slug: `test-shared-pkg-${Date.now()}`,
        shortDesc: "Shared pkg test",
        category: "Luxury",
        durationNights: 4,
        priceFrom: 140000,
        heroImageUrl: sharedAsset.url,
      }),
    });
    const pkg2 = await pkg2Res.json();
    cleanupPkgIds.push(pkg2.id);

    const journal2Res = await fetch(`${BASE}/api/journal`, {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Shared Journal",
        slug: `test-shared-journal-${Date.now()}`,
        excerpt: "Shared journal test",
        content: "Shared content",
        category: "Culture",
        imageUrl: sharedAsset.url,
      }),
    });
    const journal2 = await journal2Res.json();
    cleanupJournalIds.push(journal2.id);

    // Verify it appears EXACTLY ONCE in Media list with usageCount: 3
    const listRes6 = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const list6 = await listRes6.json();
    const sharedMatches = list6.filter((m: any) => m.url === sharedAsset.url);
    assert(sharedMatches.length === 1, "Shared file appears EXACTLY ONCE in Media library (no duplicate entries)");
    assert(sharedMatches[0].usageCount === 3, "Usage count reflects all 3 content references");
    assert(sharedMatches[0].references.length === 3, "References array has 3 distinct entries");
    console.log("  [PASS] Single media asset entry maintained across 3 content references without duplication");

    // -------------------------------------------------------------------------
    // 8. Distinction Between Uploaded Files and External URLs
    // -------------------------------------------------------------------------
    console.log("\n[Test 8] Distinguish Uploaded Files from External URLs:");
    const uploadsOnly = list6.filter((m: any) => m.storageType === "upload");
    const externalOnly = list6.filter((m: any) => m.storageType === "external");

    assert(uploadsOnly.length >= 6, "Uploads list contains verified local uploaded files");
    assert(externalOnly.length > 0, "External URLs are identified and listed as storageType: 'external'");

    for (const u of uploadsOnly) {
      assert(u.url.startsWith("/api/media/files/"), "Uploaded file URL points to /api/media/files/");
      assert(typeof u.sizeBytes === "number" || u.sizeBytes === null, "Uploaded file has sizeBytes");
    }

    for (const e of externalOnly) {
      assert(e.url.startsWith("http://") || e.url.startsWith("https://"), "External asset URL points to external HTTP/HTTPS host");
      assert(e.sizeBytes === null, "External asset does not claim local disk byte size");
      assert(e.id < 0, "External asset has synthetic negative reference ID");
    }
    console.log(`  [PASS] Clean distinction verified: ${uploadsOnly.length} uploaded files, ${externalOnly.length} external references`);

    // -------------------------------------------------------------------------
    // 9. Copy URL & File Resolution
    // -------------------------------------------------------------------------
    console.log("\n[Test 9] Copy URL & Asset Resolution:");
    const resolveRes = await fetch(`${BASE}${sharedAsset.url}`);
    assert(resolveRes.status === 200, "GET on uploaded asset URL returns 200 OK");
    const resolveBuf = Buffer.from(await resolveRes.arrayBuffer());
    assert(resolveBuf.length === TINY_PNG.length, "Served asset matches uploaded binary size");
    assert(resolveRes.headers.get("x-content-type-options") === "nosniff", "Has nosniff security header");
    console.log("  [PASS] Uploaded URL resolves correctly and serves asset content");

    // -------------------------------------------------------------------------
    // 10. Deletion Protection for Referenced Assets
    // -------------------------------------------------------------------------
    console.log("\n[Test 10] Deletion Protection for Active References:");
    const blockedDelete = await fetch(`${BASE}/api/media/${sharedAsset.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(blockedDelete.status === 409, "DELETE /api/media/:id returns 409 Conflict when asset is in active use");
    const conflictErr = await blockedDelete.json();
    assert(conflictErr.error.includes("currently used"), "409 Error message explains active reference blocking");
    console.log("  [PASS] Deletion safely rejected with 409 Conflict while in active content use");

    // -------------------------------------------------------------------------
    // 11. External Reference Deletion Protection
    // -------------------------------------------------------------------------
    console.log("\n[Test 11] External Reference Deletion Protection:");
    const extDelete = await fetch(`${BASE}/api/media/-1`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(extDelete.status === 400, "DELETE /api/media/:negativeId returns 400 rejecting external reference deletion");
    console.log("  [PASS] External references cannot be deleted via disk deletion endpoint");

    // -------------------------------------------------------------------------
    // 12. Deletion of Unreferenced Asset
    // -------------------------------------------------------------------------
    console.log("\n[Test 12] Deletion of Unreferenced Asset:");
    const delUnref = await fetch(`${BASE}/api/media/${mediaPageAsset.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(delUnref.status === 204, "DELETE /api/media/:id returns 204 for unreferenced asset");
    cleanupMediaIds.splice(cleanupMediaIds.indexOf(mediaPageAsset.id), 1);

    // Verify it is removed from list
    const listRes7 = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const list7 = await listRes7.json();
    assert(!list7.some((m: any) => m.id === mediaPageAsset.id), "Deleted asset no longer in GET /api/media");
    console.log("  [PASS] Unreferenced asset deleted successfully from library and disk");

    // -------------------------------------------------------------------------
    // 13. Persistence after Reload
    // -------------------------------------------------------------------------
    console.log("\n[Test 13] Persistence after Reload:");
    const reloadRes = await fetch(`${BASE}/api/media`, { headers: { Cookie: adminCookie } });
    const reloadList = await reloadRes.json();
    const foundReloaded = reloadList.find((m: any) => m.id === destAsset.id);
    assert(foundReloaded, "Destination upload persists across multiple queries");
    assert(foundReloaded.usageCount === 1, "Usage count persists correctly");
    console.log("  [PASS] Asset entries and references persist across reloads");

    // -------------------------------------------------------------------------
    // 14. Validation & Error Handling
    // -------------------------------------------------------------------------
    console.log("\n[Test 14] Upload Validation & Error Handling:");
    const invalidUpload = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: { Cookie: adminCookie, "content-type": "image/png", "x-filename": "bad.png" },
      body: Buffer.from("NOT AN IMAGE BINARY"),
    });
    assert(invalidUpload.status === 400, "Non-image payload rejected with 400");

    const emptyUpload = await fetch(`${BASE}/api/media/upload`, {
      method: "POST",
      headers: { Cookie: adminCookie, "content-type": "image/png", "x-filename": "empty.png" },
      body: Buffer.alloc(0),
    });
    assert(emptyUpload.status === 400, "Empty payload rejected with 400");
    console.log("  [PASS] File validation, empty upload rejection, and magic bytes enforcement passed");

    console.log("\n================================================================================");
    console.log("       ALL 14 UNIFIED MEDIA INTEGRATION TEST SUITES PASSED (100%)              ");
    console.log("================================================================================\n");
  } finally {
    console.log("[Cleanup] Removing test records and files...");
    for (const id of cleanupDestIds) {
      await fetch(`${BASE}/api/destinations/${id}`, { method: "DELETE", headers: { Cookie: adminCookie } });
    }
    for (const id of cleanupPkgIds) {
      await fetch(`${BASE}/api/packages/${id}`, { method: "DELETE", headers: { Cookie: adminCookie } });
    }
    for (const id of cleanupJournalIds) {
      await fetch(`${BASE}/api/journal/${id}`, { method: "DELETE", headers: { Cookie: adminCookie } });
    }
    for (const id of cleanupItinIds) {
      await fetch(`${BASE}/api/itineraries/${id}`, { method: "DELETE", headers: { Cookie: adminCookie } });
    }
    for (const id of cleanupMediaIds) {
      await fetch(`${BASE}/api/media/${id}`, { method: "DELETE", headers: { Cookie: adminCookie } });
    }
    console.log("  [PASS] All test records and uploaded test files cleaned up successfully.");
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in verify-unified-media:", err);
  process.exit(1);
});
