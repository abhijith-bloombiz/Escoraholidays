/**
 * Main Database Seeder Orchestrator
 * Runs initial foundation seed, index initialization, and additive Kerala destination seeding.
 */
import { initIndexes } from "./init-indexes";
import { seedInitial } from "./seed-initial";
import { seedKerala } from "./seed-kerala";
import { seedPredefinedTemplates } from "./seed-templates";
import { seedCategories, seedTestimonials } from "./seed-categories-and-testimonials";
import { disconnectDB } from "../connection";

export * from "./seed-templates";
export * from "./itinerary-templates-data";
export * from "./seed-categories-and-testimonials";

export async function runAllSeeds(): Promise<void> {
  console.log("==========================================");
  console.log("   Escora Holidays: Database Seeder");
  console.log("==========================================");

  // 1. Sync indexes
  await initIndexes();

  // 2. Initial Foundation Seed
  console.log("\n[1/5] Checking foundation seed...");
  await seedInitial();

  // 3. Additive Kerala Destinations Seed
  console.log("\n[2/5] Checking Kerala destinations seed...");
  await seedKerala();

  // 4. Itinerary Templates Seed
  console.log("\n[3/5] Checking itinerary templates seed...");
  const seededTemplates = await seedPredefinedTemplates();
  console.log(`Seeded ${seededTemplates} new itinerary templates.`);

  // 5. Travel Categories Seed
  console.log("\n[4/5] Checking travel categories seed...");
  await seedCategories();

  // 6. Testimonials Seed
  console.log("\n[5/5] Checking testimonials seed...");
  await seedTestimonials();

  console.log("\n✅ Database seeding process complete.");
  await disconnectDB();
}

const scriptPath = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (scriptPath.endsWith("seeds/index.ts") || scriptPath.endsWith("seed.ts")) {
  runAllSeeds().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}

