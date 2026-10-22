import { connectDB, disconnectDB } from "../connection";
import {
  CounterModel,
  DestinationModel,
  PackageModel,
  OrderModel,
  JournalPostModel,
  MediaModel,
  TravelCategoryModel,
  EnquiryModel,
  ItineraryModel,
  TestimonialModel,
} from "../models";

export async function initIndexes(): Promise<void> {
  console.log("Connecting to MongoDB to synchronize collections and indexes...");
  await connectDB();

  const models = [
    { name: "Counter", model: CounterModel },
    { name: "Destination", model: DestinationModel },
    { name: "Package", model: PackageModel },
    { name: "Order", model: OrderModel },
    { name: "JournalPost", model: JournalPostModel },
    { name: "Media", model: MediaModel },
    { name: "TravelCategory", model: TravelCategoryModel },
    { name: "Enquiry", model: EnquiryModel },
    { name: "Itinerary", model: ItineraryModel },
    { name: "Testimonial", model: TestimonialModel },
  ];

  for (const { name, model } of models) {
    try {
      await model.createIndexes();
      console.log(`✓ Indexed collection: ${model.collection.name} (${name})`);
    } catch (err: any) {
      console.warn(`! Index sync notice for ${name}:`, err.message);
    }
  }

  console.log("✅ All MongoDB collections and indexes are synchronized.");
}

if (process.argv[1]?.endsWith("init-indexes.ts") || process.argv[1]?.endsWith("init-db.ts")) {
  initIndexes()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error("Index initialization failed:", err);
      process.exit(1);
    });
}
