/**
 * Main Database Seeder Orchestrator
 * Runs initial foundation seed, index initialization, and additive Kerala destination seeding.
 */
import { initIndexes } from "./init-indexes";

export async function runAllSeeds(): Promise<void> {
  console.log("==========================================");
  console.log("   Escora Holidays: Database Seeder");
  console.log("==========================================");

  // 1. Sync indexes
  await initIndexes();

  // 2. Initial Foundation Seed
  console.log("\n[1/2] Checking foundation seed...");
  await import("./seed-initial");

  // 3. Additive Kerala Destinations Seed
  console.log("\n[2/2] Checking Kerala destinations seed...");
  await import("./seed-kerala");
}

if (process.argv[1]?.endsWith("seeds/index.ts") || process.argv[1]?.endsWith("seed.ts")) {
  runAllSeeds().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
