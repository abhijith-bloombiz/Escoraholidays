import { connectDB, disconnectDB } from "../lib/db/src/connection";
import { CampaignModel } from "../lib/db/src/models/campaign.model";
import { config } from "../apps/api-server/src/config/env";

async function inspectCampaigns() {
  await connectDB();
  console.log("=== RUNTIME CONFIG FOR CAMPAIGN SENDING ===");
  console.log("CAMPAIGN_SENDING_ENABLED:", config.campaignSendingEnabled);
  console.log("EMAIL_PROVIDER:", config.emailProvider);
  console.log("GMAIL_USER:", config.gmailUser ? "[CONFIGURED]" : "[MISSING]");
  console.log("GMAIL_APP_PASSWORD:", config.gmailAppPassword ? "[CONFIGURED]" : "[MISSING]");

  console.log("\n=== INSPECTING ALL CAMPAIGNS IN MONGODB ===");
  const campaigns = await CampaignModel.find().sort({ updatedAt: -1 }).limit(3).lean();
  console.log(`Latest ${campaigns.length} campaigns in DB:`);

  for (const c of campaigns) {
    console.log("\n------------------------------------------------------------");
    console.log(`Campaign #${c.id}: "${c.name}"`);
    console.log(`  Subject: "${c.subject}"`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Delivery Mode: ${(c as any).deliveryMode || "N/A"}`);
    console.log(`  Sent At: ${c.sentAt}`);
    console.log(`  Audience Type: ${c.audienceType}`);
    console.log(`  Stats:`, c.stats);
    console.log(`  Deliveries count: ${c.deliveries?.length || 0}`);
    if (c.deliveries && c.deliveries.length > 0) {
      for (const d of c.deliveries) {
        console.log(`    - Recipient: ${d.recipientEmail} (${d.recipientName})`);
        console.log(`      Status: ${d.status}`);
        console.log(`      DeliveryStatus: ${d.deliveryStatus || "N/A"}`);
        console.log(`      MessageID: ${d.messageId}`);
        console.log(`      SentAt: ${d.sentAt}`);
        console.log(`      Error: ${d.error || "None"}`);
      }
    }
  }

  await disconnectDB();
  process.exit(0);
}

inspectCampaigns().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
