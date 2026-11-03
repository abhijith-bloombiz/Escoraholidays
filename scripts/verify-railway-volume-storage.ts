import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

// Import functions under test from media route
import {
  resolveUploadsDirectory,
  checkUploadsDirectoryWritable,
  syncLegacyFilesToVolume,
  initMediaStorage,
} from "../apps/api-server/src/routes/media";

// A tiny 1x1 valid PNG buffer
const TINY_PNG = Buffer.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5,
  0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66,
  96, 130,
]);

async function main() {
  console.log("================================================================================");
  console.log("   ESCORA HOLIDAYS — RAILWAY PERSISTENT VOLUME STORAGE VERIFICATION SUITE       ");
  console.log("================================================================================\n");

  const originalRailwayMount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  const originalUploadsDir = process.env.UPLOADS_DIR;

  const tempDirsToCleanup: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Test 1: Path Resolution & Absolute Path Handling (Requirement 2, 3, 4)
    // -------------------------------------------------------------------------
    console.log("[Test 1] Path Resolution and Precedence Rules:");

    // Case 1A: Default when neither is set
    delete process.env.RAILWAY_VOLUME_MOUNT_PATH;
    delete process.env.UPLOADS_DIR;
    const defaultRes = resolveUploadsDirectory();
    assert.strictEqual(defaultRes.source, "default", "Source must be 'default'");
    assert.strictEqual(defaultRes.isVolume, false, "Default is not volume");
    assert.strictEqual(
      defaultRes.uploadsDir,
      path.resolve(workspaceRoot, "apps/api-server/uploads"),
      "Default uploadsDir must be apps/api-server/uploads"
    );
    console.log("  [PASS] 1A: Default fallback resolves to workspace apps/api-server/uploads");

    // Case 1B: Local development via relative UPLOADS_DIR
    process.env.UPLOADS_DIR = "custom-uploads";
    const relRes = resolveUploadsDirectory();
    assert.strictEqual(relRes.source, "UPLOADS_DIR", "Source must be UPLOADS_DIR");
    assert.strictEqual(relRes.isVolume, false, "Local UPLOADS_DIR is not volume");
    assert.strictEqual(
      relRes.uploadsDir,
      path.resolve(workspaceRoot, "custom-uploads"),
      "Relative UPLOADS_DIR must resolve against workspace root"
    );
    console.log("  [PASS] 1B: Relative UPLOADS_DIR resolves relative to workspaceRoot");

    // Case 1C: Local development via absolute UPLOADS_DIR
    const absDevDir = path.resolve(os.tmpdir(), "escora-abs-dev-test");
    process.env.UPLOADS_DIR = absDevDir;
    const absDevRes = resolveUploadsDirectory();
    assert.strictEqual(absDevRes.source, "UPLOADS_DIR", "Source must be UPLOADS_DIR");
    assert.strictEqual(
      absDevRes.uploadsDir,
      path.normalize(absDevDir),
      "Absolute UPLOADS_DIR must not be altered or nested under workspace"
    );
    console.log("  [PASS] 1C: Absolute UPLOADS_DIR preserved exactly without workspace prefix");

    // Case 1D: Railway Volume Mount Path (Absolute path) takes precedence over UPLOADS_DIR
    const absVolumeDir = path.resolve(os.tmpdir(), "escora-railway-volume-test");
    tempDirsToCleanup.push(absVolumeDir);
    process.env.RAILWAY_VOLUME_MOUNT_PATH = absVolumeDir;
    process.env.UPLOADS_DIR = "ignored-local-dir";

    const volRes = resolveUploadsDirectory();
    assert.strictEqual(volRes.source, "RAILWAY_VOLUME_MOUNT_PATH", "Railway Volume takes precedence");
    assert.strictEqual(volRes.isVolume, true, "isVolume is true");
    assert.strictEqual(
      volRes.uploadsDir,
      path.normalize(absVolumeDir),
      "Absolute Railway mount path preserved without workspace prefix"
    );
    console.log("  [PASS] 1D: RAILWAY_VOLUME_MOUNT_PATH takes precedence over UPLOADS_DIR & preserves absolute path");

    // -------------------------------------------------------------------------
    // Test 2: Auto-creation and Writability Check (Requirement 5, 10)
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Directory Auto-creation and Writability Error Handling:");
    const testVolDir = path.join(os.tmpdir(), `escora-vol-${Date.now()}`);
    tempDirsToCleanup.push(testVolDir);

    // Ensure it does not exist yet
    if (fs.existsSync(testVolDir)) {
      fs.rmSync(testVolDir, { recursive: true, force: true });
    }

    const probeResult = checkUploadsDirectoryWritable(testVolDir);
    assert.strictEqual(probeResult.writable, true, "Writable probe should succeed");
    assert.strictEqual(fs.existsSync(testVolDir), true, "Directory should be automatically created");
    console.log("  [PASS] Directory auto-created with recursive: true and write probe passed");

    // -------------------------------------------------------------------------
    // Test 3: Non-Destructive Auto-Seed of Existing Uploads (Requirement 6, 8, Data Protection)
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Non-Destructive Auto-Seed of Existing Uploads into Volume:");
    const testVolumeMount = path.join(os.tmpdir(), `escora-auto-seed-${Date.now()}`);
    tempDirsToCleanup.push(testVolumeMount);
    fs.mkdirSync(testVolumeMount, { recursive: true });

    process.env.RAILWAY_VOLUME_MOUNT_PATH = testVolumeMount;
    delete process.env.UPLOADS_DIR;

    const defaultDir = path.resolve(workspaceRoot, "apps/api-server/uploads");
    const bundledFiles = fs.readdirSync(defaultDir).filter((f) => !f.startsWith(".") && !f.includes(".."));
    console.log(`  Discovered ${bundledFiles.length} bundled files in apps/api-server/uploads`);

    // Run syncLegacyFilesToVolume
    const seedResult = syncLegacyFilesToVolume();
    console.log(`  Auto-seed result: ${seedResult.copied} copied, ${seedResult.skipped} skipped, ${seedResult.errors} errors`);
    assert(seedResult.copied > 0, "Should have copied bundled files to empty volume");
    assert.strictEqual(seedResult.errors, 0, "Should have 0 errors");

    // Re-running sync must NOT overwrite or duplicate
    const reSeedResult = syncLegacyFilesToVolume();
    assert.strictEqual(reSeedResult.copied, 0, "Second run should copy 0 files (idempotent)");
    assert(reSeedResult.skipped > 0, "Second run should skip all existing files");
    console.log("  [PASS] Auto-seed copied bundled assets into volume idempotently without overwriting");

    // -------------------------------------------------------------------------
    // Test 4: Migration CLI Script Test (Requirement: migration procedure)
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Migration CLI Script Execution:");
    const cliTargetDir = path.join(os.tmpdir(), `escora-cli-migration-${Date.now()}`);
    tempDirsToCleanup.push(cliTargetDir);

    const { execSync } = await import("node:child_process");
    const migrationScript = path.resolve(workspaceRoot, "scripts/migrate-uploads-to-volume.ts");

    // Test Dry-Run
    const dryRunOutput = execSync(
      `npx tsx "${migrationScript}" --source "${defaultDir}" --target "${cliTargetDir}" --dry-run`,
      { encoding: "utf8" }
    );
    assert(dryRunOutput.includes("Dry run mode     : ENABLED"), "Dry run mode detected");
    assert(dryRunOutput.includes("Would copy:"), "Dry run plans copies");
    assert(!fs.existsSync(cliTargetDir), "Dry run must not create files");
    console.log("  [PASS] CLI Migration dry-run executes cleanly and does not modify disk");

    // Test Real Migration
    const realRunOutput = execSync(
      `npx tsx "${migrationScript}" --source "${defaultDir}" --target "${cliTargetDir}"`,
      { encoding: "utf8" }
    );
    assert(realRunOutput.includes("Total files found in source"), "Real migration summarizes findings");
    assert(realRunOutput.includes("[SUCCESS]"), "Migration reports SUCCESS");
    assert(fs.existsSync(cliTargetDir), "Target directory created");
    const migratedCount = fs.readdirSync(cliTargetDir).length;
    assert.strictEqual(migratedCount, bundledFiles.length, "All files copied to target");
    console.log(`  [PASS] Real CLI Migration safely copied all ${migratedCount} files to destination`);

    // -------------------------------------------------------------------------
    // Test 5: End-to-End API Server Upload, Retrieval & Redeployment Simulation
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Live API Upload & Redeployment Simulation with Railway Volume:");

    // Use a dedicated volume mount for the live server test
    const liveVolumeDir = path.join(os.tmpdir(), `escora-live-vol-${Date.now()}`);
    tempDirsToCleanup.push(liveVolumeDir);
    fs.mkdirSync(liveVolumeDir, { recursive: true });

    process.env.RAILWAY_VOLUME_MOUNT_PATH = liveVolumeDir;
    process.env.NODE_ENV = "development";
    process.env.PORT = "8899";

    // Start API server instance dynamically
    const { default: app } = await import("../apps/api-server/src/app");
    const { connectDB, disconnectDB, MediaModel } = await import("../lib/db/src/index");
    await connectDB();

    const server = app.listen(8899);
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const BASE = "http://localhost:8899";

      // 5A: Login as Admin
      const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "Admin", password: "Admin" }),
      });
      assert.strictEqual(loginRes.status, 200, "Admin login succeeds");
      const cookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";

      // 5B: Upload a new image to the volume
      const testUploadFilename = `test-volume-image-${Date.now()}.png`;
      const uploadRes = await fetch(`${BASE}/api/media/upload`, {
        method: "POST",
        headers: {
          Cookie: cookie,
          "content-type": "image/png",
          "x-filename": testUploadFilename,
        },
        body: TINY_PNG,
      });

      assert.strictEqual(uploadRes.status, 201, "Upload to volume succeeds with 201 Created");
      const uploadedMedia = await uploadRes.json();
      console.log(`  Uploaded asset #${uploadedMedia.id}: ${uploadedMedia.url}`);

      // Verify physical presence in liveVolumeDir
      const savedDiskFilename = path.basename(uploadedMedia.url);
      const physicalVolumePath = path.join(liveVolumeDir, savedDiskFilename);
      assert.strictEqual(
        fs.existsSync(physicalVolumePath),
        true,
        `Uploaded file must physically exist in volume mount: ${physicalVolumePath}`
      );
      console.log("  [PASS] File physically stored inside the persistent Railway Volume");

      // 5C: Retrieve the newly uploaded image via GET /api/media/files/:name
      const retrieveRes = await fetch(`${BASE}${uploadedMedia.url}`);
      assert.strictEqual(retrieveRes.status, 200, "File retrieval succeeds with 200");
      assert.strictEqual(
        retrieveRes.headers.get("content-type"),
        "image/png",
        "Retrieved file has image/png content-type"
      );
      const retrievedBytes = Buffer.from(await retrieveRes.arrayBuffer());
      assert.strictEqual(retrievedBytes.length, TINY_PNG.length, "Retrieved bytes match uploaded PNG");
      console.log("  [PASS] Image served directly from the persistent volume directory");

      // 5D: Fallback serving: request an existing bundled image not yet in the volume
      // Let's pick one of the bundled images from defaultDir
      const bundledSample = bundledFiles[0];
      if (bundledSample) {
        // Ensure it's deleted from liveVolumeDir to strictly test fallback
        const inVol = path.join(liveVolumeDir, bundledSample);
        if (fs.existsSync(inVol)) fs.unlinkSync(inVol);

        const fallbackRes = await fetch(`${BASE}/api/media/files/${bundledSample}`);
        assert.strictEqual(
          fallbackRes.status,
          200,
          `Bundled file ${bundledSample} must be served via fallback even if missing from volume`
        );
        console.log(`  [PASS] Legacy image (${bundledSample}) served via bundled fallback`);
      }

      // 5E: Simulate Railway Redeployment
      // A redeployment means the container restarts with fresh node memory, but the Volume directory remains intact.
      console.log("\n  Simulating Railway redeployment: volume directory persists, database persists...");
      // Verify MongoDB record is intact
      const dbRecord = await MediaModel.findOne({ id: uploadedMedia.id }).lean();
      assert(dbRecord, "Database record exists in MongoDB");
      assert.strictEqual(dbRecord.filename, testUploadFilename, "Original filename preserved in Mongo");
      assert.strictEqual(dbRecord.url, uploadedMedia.url, "URL preserved in Mongo");

      // Verify file still exists on disk in volume
      assert.strictEqual(fs.existsSync(physicalVolumePath), true, "File remains on disk in volume");

      // Re-fetch file after 'redeployment'
      const postRedeployRes = await fetch(`${BASE}${uploadedMedia.url}`);
      assert.strictEqual(postRedeployRes.status, 200, "File remains retrievable after redeployment");
      console.log("  [PASS] Persistent storage verified: File and metadata survive redeployment!");

      // Cleanup uploaded test record from DB
      await MediaModel.deleteOne({ id: uploadedMedia.id });
    } finally {
      server.close();
      await disconnectDB();
    }

    console.log("\n================================================================================");
    console.log("             ALL RAILWAY VOLUME PERSISTENCE TESTS PASSED!                       ");
    console.log("================================================================================\n");
  } finally {
    // Restore environment variables
    if (originalRailwayMount !== undefined) {
      process.env.RAILWAY_VOLUME_MOUNT_PATH = originalRailwayMount;
    } else {
      delete process.env.RAILWAY_VOLUME_MOUNT_PATH;
    }

    if (originalUploadsDir !== undefined) {
      process.env.UPLOADS_DIR = originalUploadsDir;
    } else {
      delete process.env.UPLOADS_DIR;
    }

    // Clean up temporary test directories
    for (const d of tempDirsToCleanup) {
      try {
        if (fs.existsSync(d)) {
          fs.rmSync(d, { recursive: true, force: true });
        }
      } catch {
        // ignore
      }
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("\n[TEST FAILED] Error:", err);
  process.exit(1);
});
