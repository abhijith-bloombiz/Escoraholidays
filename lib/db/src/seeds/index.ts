/**
 * Main Database Seeder Orchestrator
 * Runs initial foundation seed, index initialization, and additive Kerala destination seeding.
 */
import { initIndexes } from "./init-indexes";
import { seedInitial } from "./seed-initial";
import { seedKerala } from "./seed-kerala";
import { seedPredefinedTemplates } from "./seed-templates";
import { seedCategories, seedTestimonials } from "./seed-categories-and-testimonials";
import { seedExperiences } from "./seed-experiences";
import { seedHero } from "./seed-hero";
import { disconnectDB } from "../connection";

export * from "./seed-templates";
export * from "./itinerary-templates-data";
export * from "./seed-categories-and-testimonials";
export * from "./seed-experiences";
export * from "./seed-hero";

export async function runAllSeeds(): Promise<void> {
  console.log("==========================================");
  console.log("   Escora Holidays: Database Seeder");
  console.log("==========================================");

  // 1. Sync indexes
  await initIndexes();

  // 2. Initial Foundation Seed
  console.log("\n[1/7] Checking foundation seed...");
  await seedInitial();

  // 3. Additive Kerala Destinations Seed
  console.log("\n[2/7] Checking Kerala destinations seed...");
  await seedKerala();

  // 4. Itinerary Templates Seed
  console.log("\n[3/7] Checking itinerary templates seed...");
  const seededTemplates = await seedPredefinedTemplates();
  console.log(`Seeded ${seededTemplates} new itinerary templates.`);

  // 5. Travel Categories Seed
  console.log("\n[4/7] Checking travel categories seed...");
  await seedCategories();

  // 6. Testimonials Seed
  console.log("\n[5/7] Checking testimonials seed...");
  await seedTestimonials();

  // 7. Experiences Seed
  console.log("\n[6/7] Checking experiences seed...");
  await seedExperiences();

  // 8. Hero Slides & Config Seed
  console.log("\n[7/7] Checking hero section seed...");
  await seedHero();

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

