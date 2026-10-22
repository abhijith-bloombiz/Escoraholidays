import { ItineraryTemplateModel } from "../models";
import { PREDEFINED_TEMPLATES } from "./itinerary-templates-data";

/**
 * Ensures all predefined itinerary templates are present in the database.
 * Does not overwrite existing customized templates.
 */
export async function seedPredefinedTemplates(): Promise<number> {
  let seededCount = 0;
  for (const tpl of PREDEFINED_TEMPLATES) {
    const existing = await ItineraryTemplateModel.findOne({ id: tpl.id });
    if (!existing) {
      await ItineraryTemplateModel.create(tpl);
      seededCount++;
    }
  }
  return seededCount;
}
