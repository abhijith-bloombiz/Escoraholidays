import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

interface MigrationOptions {
  sourceDir: string;
  targetDir: string;
  dryRun: boolean;
  verifyMongo: boolean;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  let customSource = "";
  let customTarget = "";
  let dryRun = false;
  let verifyMongo = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) {
      customSource = args[++i];
    } else if (args[i] === "--target" && args[i + 1]) {
      customTarget = args[++i];
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--verify-mongo") {
      verifyMongo = true;
    }
  }

  const defaultSource = path.resolve(workspaceRoot, "apps/api-server/uploads");
  const configuredTarget =
    customTarget ||
    process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    process.env.UPLOADS_DIR ||
    defaultSource;

  const resolvedSource = path.isAbsolute(customSource || defaultSource)
    ? path.normalize(customSource || defaultSource)
    : path.resolve(workspaceRoot, customSource || defaultSource);

  const resolvedTarget = path.isAbsolute(configuredTarget)
    ? path.normalize(configuredTarget)
    : path.resolve(workspaceRoot, configuredTarget);

  return {
    sourceDir: resolvedSource,
    targetDir: resolvedTarget,
    dryRun,
    verifyMongo,
  };
}

async function run() {
  console.log("================================================================================");
  console.log("     ESCORA HOLIDAYS — RAILWAY PERSISTENT VOLUME UPLOAD MIGRATION TOOL          ");
  console.log("================================================================================\n");

  const options = parseArgs();

  console.log(`[Configuration]`);
  console.log(`  Source directory : ${options.sourceDir}`);
  console.log(`  Target directory : ${options.targetDir}`);
  console.log(`  Dry run mode     : ${options.dryRun ? "ENABLED (no changes will be written)" : "DISABLED (files will be copied)"}`);
  console.log("");

  if (!fs.existsSync(options.sourceDir)) {
    console.error(`[ERROR] Source uploads directory does not exist: ${options.sourceDir}`);
    process.exit(1);
  }

  if (options.sourceDir === options.targetDir) {
    console.log(`[INFO] Source and target directories are identical: ${options.targetDir}`);
    console.log(`       No file copy necessary (volume is already mounted directly over the directory).`);
    return;
  }

  if (!options.dryRun && !fs.existsSync(options.targetDir)) {
    console.log(`[Setup] Creating target volume directory: ${options.targetDir}`);
    fs.mkdirSync(options.targetDir, { recursive: true });
  }

  const files = fs.readdirSync(options.sourceDir).filter((f) => !f.startsWith(".") && !f.includes(".."));
  console.log(`[Scan] Discovered ${files.length} file(s) in source directory.\n`);

  let copied = 0;
  let alreadyPresent = 0;
  let skippedDifference = 0;
  let errors = 0;

  for (const file of files) {
    const srcPath = path.join(options.sourceDir, file);
    const dstPath = path.join(options.targetDir, file);

    try {
      const srcStat = fs.statSync(srcPath);
      if (!srcStat.isFile()) continue;

      if (fs.existsSync(dstPath)) {
        const dstStat = fs.statSync(dstPath);
        if (dstStat.size === srcStat.size) {
          console.log(`  [EXISTS]  ${file} (${(srcStat.size / 1024).toFixed(1)} KB) — already verified in target`);
          alreadyPresent++;
          continue;
        } else {
          console.warn(`  [WARN]    ${file} exists in target but sizes differ (source: ${srcStat.size}B vs target: ${dstStat.size}B). Preserving target.`);
          skippedDifference++;
          continue;
        }
      }

      if (options.dryRun) {
        console.log(`  [PLAN]    Would copy: ${file} (${(srcStat.size / 1024).toFixed(1)} KB) -> ${dstPath}`);
        copied++;
      } else {
        fs.copyFileSync(srcPath, dstPath);
        console.log(`  [COPIED]  ${file} (${(srcStat.size / 1024).toFixed(1)} KB) -> target volume`);
        copied++;
      }
    } catch (err: any) {
      console.error(`  [FAILED]  ${file}: ${err?.message}`);
      errors++;
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("                           MIGRATION SUMMARY                                    ");
  console.log("--------------------------------------------------------------------------------");
  console.log(`  Total files found in source  : ${files.length}`);
  console.log(`  Files copied to volume       : ${copied}`);
  console.log(`  Files already present (kept) : ${alreadyPresent}`);
  if (skippedDifference > 0) {
    console.log(`  Files with size differences  : ${skippedDifference} (preserved target)`);
  }
  if (errors > 0) {
    console.log(`  Errors encountered           : ${errors}`);
  }
  console.log("--------------------------------------------------------------------------------\n");

  if (options.verifyMongo) {
    console.log("[Verification] Checking MongoDB media catalog against volume storage...");
    try {
      const { connectDB, disconnectDB, MediaModel } = await import("../lib/db/src/index");
      await connectDB();
      const dbMedia = await MediaModel.find().lean();
      let matched = 0;
      let missing = 0;

      for (const m of dbMedia) {
        if (!m.url.startsWith("/api/media/files/")) continue;
        const filename = path.basename(m.url);
        const onTarget = path.join(options.targetDir, filename);
        if (fs.existsSync(onTarget)) {
          matched++;
        } else {
          console.warn(`  [MISSING ON DISK] Record #${m.id} (${m.filename}) not in volume: ${filename}`);
          missing++;
        }
      }

      console.log(`[Mongo Verification Results]`);
      console.log(`  Total upload records in DB : ${matched + missing}`);
      console.log(`  Files present in volume    : ${matched}`);
      console.log(`  Files missing in volume    : ${missing}`);

      await disconnectDB();
    } catch (err: any) {
      console.warn(`[Mongo Verification] Skipped or failed: ${err?.message}`);
    }
  }

  if (errors > 0) {
    process.exit(1);
  }
  console.log("[SUCCESS] Persistent storage volume migration completed safely.\n");
}

run().catch((err) => {
  console.error("Migration tool error:", err);
  process.exit(1);
});

