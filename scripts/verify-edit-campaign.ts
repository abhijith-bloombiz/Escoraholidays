import fs from "node:fs";
import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  CampaignModel,
  AudienceGroupModel,
  getNextSequence,
} from "../lib/db/src/index";
import { extractFieldsFromExisting } from "../apps/escora-admin/src/components/campaign/campaignTemplates";

// Load .env
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_USER = process.env.ADMIN_USERNAME || process.env.ADMIN_USER || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin";

interface TestResult {
  scenario: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function pass(scenario: string, details: string) {
  results.push({ scenario, passed: true, details });
  console.log(`  [PASS] ${scenario}`);
  console.log(`         ↳ ${details}`);
}

function fail(scenario: string, details: string) {
  results.push({ scenario, passed: false, details });
  console.error(`  [FAIL] ${scenario}`);
  console.error(`         ↳ ERROR: ${details}\n`);
}

async function loginAdmin(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Admin login failed with HTTP ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie returned from login");
  }
  return setCookie.split(";")[0];
}

async function runEditCampaignVerification() {
  console.log("================================================================================");
  console.log("     ESCORA HOLIDAYS — EDIT CAMPAIGN FUNCTIONALITY VERIFICATION                ");
  console.log("================================================================================\n");

  await connectDB();
  const sessionCookie = await loginAdmin();
  const createdCampaignIds: number[] = [];

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Edit and save a draft
    // -------------------------------------------------------------------------
    console.log("--> Scenario 1: Edit and save a draft campaign...");
    const draftId = await getNextSequence("campaigns");
    createdCampaignIds.push(draftId);

    const initialDraft = await CampaignModel.create({
      id: draftId,
      name: "Original Draft Journey",
      subject: "Original Subject: Discover Kerala",
      previewText: "Original preheader text",
      contentHtml: "<h1>Original Kerala Journey</h1><p>Original body text</p>",
      targetAudience: { type: "all_contacts", destinations: ["Munnar"] },
      status: "draft",
      stats: { totalRecipients: 0, sentCount: 0, failedCount: 0, skippedCount: 0 },
      deliveries: [],
    });

    const updateRes1 = await fetch(`${API_BASE_URL}/api/campaigns/${draftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        name: "Updated Draft Journey (Edited)",
        subject: "Updated Subject: Enchanting Kerala Escapes",
        previewText: "Updated preheader text",
        contentHtml: "<h1>Updated Kerala Journey</h1><p>Updated editorial text</p>",
        targetAudience: { type: "enquiries_only", destinations: ["Alleppey"] },
      }),
    });

    assert.strictEqual(updateRes1.status, 200, `Expected 200, got ${updateRes1.status}`);
    const updatedDraftJson = await updateRes1.json();
    assert.strictEqual(updatedDraftJson.id, draftId, "Campaign ID must be preserved");
    assert.strictEqual(updatedDraftJson.name, "Updated Draft Journey (Edited)");
    assert.strictEqual(updatedDraftJson.subject, "Updated Subject: Enchanting Kerala Escapes");
    assert.strictEqual(updatedDraftJson.targetAudience.type, "enquiries_only");

    const draftInDb = await CampaignModel.findOne({ id: draftId }).lean();
    assert.strictEqual(draftInDb?.name, "Updated Draft Journey (Edited)");
    assert.strictEqual(draftInDb?.status, "draft");
    pass("Scenario 1: Edit Draft", `Campaign #${draftId} updated and saved successfully. ID retained.`);

    // -------------------------------------------------------------------------
    // SCENARIO 2: Edit a rejected campaign and resubmit it for approval
    // -------------------------------------------------------------------------
    console.log("\n--> Scenario 2: Edit a rejected campaign and resubmit for approval...");
    const rejId = await getNextSequence("campaigns");
    createdCampaignIds.push(rejId);

    await CampaignModel.create({
      id: rejId,
      name: "Campaign to Reject",
      subject: "Old Subject",
      contentHtml: "<p>Incomplete pricing content</p>",
      targetAudience: { type: "all_contacts" },
      status: "rejected",
      rejectionReason: "Please provide accurate seasonal houseboat pricing",
      rejectedBy: "Editorial Reviewer",
      rejectedAt: new Date(),
      stats: { totalRecipients: 0, sentCount: 0, failedCount: 0, skippedCount: 0 },
      deliveries: [],
    });

    // Edit the rejected campaign
    const editRejRes = await fetch(`${API_BASE_URL}/api/campaigns/${rejId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        name: "Campaign Revised (Houseboat Pricing Fixed)",
        subject: "Exclusive Houseboat Journeys with Clear Seasonal Rates",
        contentHtml: "<p>Updated content with full pricing clarity</p>",
      }),
    });
    assert.strictEqual(editRejRes.status, 200, `Expected 200, got ${editRejRes.status}`);

    const afterEditRej = await CampaignModel.findOne({ id: rejId }).lean();
    assert.strictEqual(afterEditRej?.status, "draft", "Status must reset to draft on edit");
    assert.strictEqual(afterEditRej?.rejectionReason, null, "Rejection reason must be cleared");

    // Resubmit for approval
    const submitRes = await fetch(`${API_BASE_URL}/api/campaigns/${rejId}/submit-approval`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(submitRes.status, 200, `Expected 200, got ${submitRes.status}`);
    const submittedJson = await submitRes.json();
    assert.strictEqual(submittedJson.status, "pending_approval", "Status must become pending_approval");

    pass("Scenario 2: Edit Rejected & Resubmit", `Rejected campaign #${rejId} edited to draft, rejectionReason cleared, and resubmitted to pending_approval.`);

    // -------------------------------------------------------------------------
    // SCENARIO 3: Change an approved campaign and verify approval is invalidated
    // -------------------------------------------------------------------------
    console.log("\n--> Scenario 3: Change an approved campaign and verify approval invalidation...");
    const approvedId = await getNextSequence("campaigns");
    createdCampaignIds.push(approvedId);

    await CampaignModel.create({
      id: approvedId,
      name: "Approved Monsoon Expedition",
      subject: "Monsoon Serenity",
      contentHtml: "<p>Approved body</p>",
      targetAudience: { type: "all_contacts" },
      status: "approved",
      approvedBy: "Head of Marketing",
      approvedAt: new Date(),
      stats: { totalRecipients: 0, sentCount: 0, failedCount: 0, skippedCount: 0 },
      deliveries: [],
    });

    // Admin edits the approved campaign content
    const editAppRes = await fetch(`${API_BASE_URL}/api/campaigns/${approvedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        subject: "Monsoon Serenity — Modified Special Offer Added",
        contentHtml: "<p>Modified body with newly added promo code</p>",
      }),
    });
    assert.strictEqual(editAppRes.status, 200, `Expected 200, got ${editAppRes.status}`);

    const afterEditApp = await CampaignModel.findOne({ id: approvedId }).lean();
    assert.strictEqual(afterEditApp?.status, "draft", "Approved campaign must revert to draft");
    assert.strictEqual(afterEditApp?.approvedBy, null, "approvedBy must be reset to null");
    assert.strictEqual(afterEditApp?.approvedAt, null, "approvedAt must be reset to null");

    pass("Scenario 3: Invalidate Approved Campaign", `Approval invalidated on Campaign #${approvedId}. Reset to Draft, approvedBy & approvedAt cleared.`);

    // -------------------------------------------------------------------------
    // SCENARIO 4: Restrictions for pending_approval, scheduled, sending, sent
    // -------------------------------------------------------------------------
    console.log("\n--> Scenario 4: Verify status-aware editing rules & restrictions...");

    // 4a. Pending approval: editing resets to draft (withdraws from queue)
    const pendingId = await getNextSequence("campaigns");
    createdCampaignIds.push(pendingId);
    await CampaignModel.create({
      id: pendingId,
      name: "Pending Review Journey",
      subject: "Subject in Review",
      contentHtml: "<p>Under review</p>",
      targetAudience: { type: "all_contacts" },
      status: "pending_approval",
      submittedForApprovalAt: new Date(),
      stats: { totalRecipients: 0, sentCount: 0, failedCount: 0, skippedCount: 0 },
      deliveries: [],
    });

    const editPendingRes = await fetch(`${API_BASE_URL}/api/campaigns/${pendingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ subject: "Withdrawn and Updated Subject" }),
    });
    assert.strictEqual(editPendingRes.status, 200);
    const afterEditPending = await CampaignModel.findOne({ id: pendingId }).lean();
    assert.strictEqual(afterEditPending?.status, "draft", "Pending approval resets to draft upon editing");

    // 4b. Scheduled: direct edit is blocked
    const schedId = await getNextSequence("campaigns");
    createdCampaignIds.push(schedId);
    await CampaignModel.create({
      id: schedId,
      name: "Scheduled Campaign",
      subject: "Scheduled Delivery",
      contentHtml: "<p>Scheduled</p>",
      targetAudience: { type: "all_contacts" },
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86400000),
      stats: { totalRecipients: 0, sentCount: 0, failedCount: 0, skippedCount: 0 },
      deliveries: [],
    });

    const directEditSchedRes = await fetch(`${API_BASE_URL}/api/campaigns/${schedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ subject: "Sneaky alteration" }),
    });
    assert.strictEqual(directEditSchedRes.status, 400, "Direct edit of scheduled campaign must be rejected (400)");
    const schedErr = await directEditSchedRes.json();
    assert.strictEqual(schedErr.code, "SCHEDULED_CAMPAIGN");

    // Unschedule via cancel endpoint
    const cancelSchedRes = await fetch(`${API_BASE_URL}/api/campaigns/${schedId}/cancel`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(cancelSchedRes.status, 200);

    // Now edit succeeds
    const editAfterUnscheduleRes = await fetch(`${API_BASE_URL}/api/campaigns/${schedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ subject: "Safely Edited After Unschedule" }),
    });
    assert.strictEqual(editAfterUnscheduleRes.status, 200);

    // 4c. Sending: edit is disallowed
    const sendingId = await getNextSequence("campaigns");
    createdCampaignIds.push(sendingId);
    await CampaignModel.create({
      id: sendingId,
      name: "Dispatching Now",
      subject: "Active Dispatch",
      contentHtml: "<p>Dispatching</p>",
      targetAudience: { type: "all_contacts" },
      status: "sending",
      stats: { totalRecipients: 10, sentCount: 2, failedCount: 0, skippedCount: 0 },
      deliveries: [],
    });

    const editSendingRes = await fetch(`${API_BASE_URL}/api/campaigns/${sendingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ subject: "Alter Active Dispatch" }),
    });
    assert.strictEqual(editSendingRes.status, 400, "Edit of sending campaign must be rejected (400)");

    // 4d. Sent: edit is disallowed
    const sentId = await getNextSequence("campaigns");
    createdCampaignIds.push(sentId);
    await CampaignModel.create({
      id: sentId,
      name: "Historical Journey 2026",
      subject: "Completed Journey",
      contentHtml: "<p>Historical content</p>",
      targetAudience: { type: "all_contacts" },
      status: "sent",
      sentAt: new Date(),
      stats: { totalRecipients: 50, sentCount: 48, failedCount: 2, skippedCount: 0 },
      deliveries: [
        { recipientEmail: "guest@example.com", recipientName: "Guest", status: "sent" },
      ],
    });

    const editSentRes = await fetch(`${API_BASE_URL}/api/campaigns/${sentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ subject: "Alter Historical Records" }),
    });
    assert.strictEqual(editSentRes.status, 400, "Edit of sent campaign must be rejected (400)");
    const sentErr = await editSentRes.json();
    assert.strictEqual(sentErr.code, "CANNOT_EDIT_SENT");

    pass("Scenario 4: Status Restrictions Enforced", "Pending returns to draft; Scheduled blocks direct edits; Sending & Sent are strictly locked.");

    // -------------------------------------------------------------------------
    // SCENARIO 5: Duplicating a sent campaign creates an editable draft
    // -------------------------------------------------------------------------
    console.log("\n--> Scenario 5: Duplicate sent campaign to create editable draft...");
    const dupRes = await fetch(`${API_BASE_URL}/api/campaigns/${sentId}/duplicate`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(dupRes.status, 201, `Expected 201, got ${dupRes.status}`);
    const dupJson = await dupRes.json();
    createdCampaignIds.push(dupJson.id);

    assert.notStrictEqual(dupJson.id, sentId, "Duplicated campaign must have a new ID");
    assert.strictEqual(dupJson.status, "draft", "Duplicated campaign must be in draft status");
    assert.strictEqual(dupJson.stats.sentCount, 0, "Stats must be reset on duplicate");

    // Edit duplicated draft
    const editDupRes = await fetch(`${API_BASE_URL}/api/campaigns/${dupJson.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        name: "Fresh Journey Based on 2026 Sent Campaign",
        subject: "Fresh Autumn Escapes 2026",
      }),
    });
    assert.strictEqual(editDupRes.status, 200);

    // Verify original sent campaign is completely intact
    const originalSentDb = await CampaignModel.findOne({ id: sentId }).lean();
    assert.strictEqual(originalSentDb?.status, "sent");
    assert.strictEqual(originalSentDb?.stats.sentCount, 48);
    assert.strictEqual(originalSentDb?.deliveries.length, 1);

    pass("Scenario 5: Duplicate Sent Campaign", `Sent campaign #${sentId} duplicated to editable draft #${dupJson.id}. Original records preserved.`);

    // -------------------------------------------------------------------------
    // SCENARIO 6: Restore audience, template, and all visual content fields
    // -------------------------------------------------------------------------
    console.log("\n--> Scenario 6: Verify field extraction & restoration in visual builder...");

    const sampleHtml = `
      <div style="font-family: serif; color: #1a1410;">
        <span style="letter-spacing: 0.15em; text-transform: uppercase;">Wanderlust Dispatches</span>
        <h1 style="color: #24543d;">The Backwaters of Kumarakom</h1>
        <p style="font-size: 18px; line-height: 1.6;">Drift through serene canals lined with coconut palms and tranquil lagoons.</p>
        <img src="https://images.unsplash.com/photo-1593693397690-362cb9666fc2" alt="Hero" />
        <p>Kumarakom offers an unmatched sanctuary for mindful travelers seeking peace.</p>
        <p>From heritage houseboats to ayurvedic wellness rituals, each moment is unforgettable.</p>
        <blockquote style="border-left: 3px solid #24543d;">A gentle glide across Vembanad Lake will heal your very soul.</blockquote>
        <ul>
          <li>Private sunset cruise aboard authentic kettuvallam</li>
          <li>Ayurvedic herbal massage at lakeside retreat</li>
          <li>Bird sanctuary exploration at dawn</li>
        </ul>
        <a href="https://escoraholidays.com/journeys/kumarakom" style="background-color: #855A18; color: #ffffff;">Reserve Your Haven</a>
        <p style="font-size: 12px; color: #8c827a;">Complimentary high tea served daily at the lakeside jetty.</p>
      </div>
    `;

    const extracted = extractFieldsFromExisting(
      "Kumarakom Luxury Escape",
      "Discover Tranquil Backwaters {{name}}",
      "Your private invitation to Kerala's most serene waters",
      "audience_group",
      sampleHtml,
      {
        groupId: 42,
        groupIds: [42],
        destinations: ["Kumarakom", "Alleppey"],
        travelStyle: "luxury",
      }
    );

    assert.strictEqual(extracted.name, "Kumarakom Luxury Escape");
    assert.strictEqual(extracted.subject, "Discover Tranquil Backwaters {{name}}");
    assert.strictEqual(extracted.eyebrow, "Wanderlust Dispatches");
    assert.strictEqual(extracted.heading, "The Backwaters of Kumarakom");
    assert.strictEqual(extracted.lead, "Drift through serene canals lined with coconut palms and tranquil lagoons.");
    assert.strictEqual(extracted.heroImage, "https://images.unsplash.com/photo-1593693397690-362cb9666fc2");
    assert.ok(extracted.body.includes("sanctuary for mindful travelers"));
    assert.strictEqual(extracted.quote, "A gentle glide across Vembanad Lake will heal your very soul.");
    assert.strictEqual(extracted.highlights.length, 3);
    assert.strictEqual(extracted.ctaText, "Reserve Your Haven");
    assert.strictEqual(extracted.ctaUrl, "https://escoraholidays.com/journeys/kumarakom");
    assert.strictEqual(extracted.accentColor, "#855A18");
    assert.strictEqual(extracted.secondaryNote, "Complimentary high tea served daily at the lakeside jetty.");
    assert.strictEqual(extracted.audienceType, "audience_group");
    assert.strictEqual(extracted.groupId, "42");

    pass("Scenario 6: Visual Field Restoration", "Every supported content field, quote, highlight, CTA, accent, and audience group restored accurately.");

    // -------------------------------------------------------------------------
    // SCENARIO 7: Persistence across page refresh (GET /api/campaigns/:id)
    // -------------------------------------------------------------------------
    console.log("\n--> Scenario 7: Verify campaign persistence via GET /api/campaigns/:id...");
    const getRes = await fetch(`${API_BASE_URL}/api/campaigns/${draftId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(getRes.status, 200);
    const fetchedCamp = await getRes.json();
    assert.strictEqual(fetchedCamp.id, draftId);
    assert.strictEqual(fetchedCamp.name, "Updated Draft Journey (Edited)");
    assert.strictEqual(fetchedCamp.subject, "Updated Subject: Enchanting Kerala Escapes");
    assert.strictEqual(fetchedCamp.targetAudience.type, "enquiries_only");

    pass("Scenario 7: Persistence Verified", `Complete campaign record #${draftId} persisted in database and re-fetched cleanly.`);

    // -------------------------------------------------------------------------
    // SCENARIO 8: Preview, Send Test, Duplicate, Delete regressions
    // -------------------------------------------------------------------------
    console.log("\n--> Scenario 8: Verify Preview, Send Test, Duplicate, and Delete actions...");

    // Test send email (isolated single-recipient)
    const testEmailRes = await fetch(`${API_BASE_URL}/api/campaigns/${draftId}/test-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        recipientEmail: "tester@escoraholidays.com",
        recipientName: "Test Traveler",
      }),
    });
    assert.strictEqual(testEmailRes.status, 200, `Test email dispatch failed: ${testEmailRes.status}`);
    const testEmailData = await testEmailRes.json();
    assert.strictEqual(testEmailData.success, true);

    // Duplicate
    const dupActionRes = await fetch(`${API_BASE_URL}/api/campaigns/${draftId}/duplicate`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(dupActionRes.status, 201);
    const dupActionJson = await dupActionRes.json();
    createdCampaignIds.push(dupActionJson.id);

    // Delete duplicated campaign
    const deleteRes = await fetch(`${API_BASE_URL}/api/campaigns/${dupActionJson.id}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(deleteRes.status, 204);

    const checkDeleted = await CampaignModel.findOne({ id: dupActionJson.id }).lean();
    assert.strictEqual(checkDeleted, null, "Deleted campaign must be removed from DB");

    pass("Scenario 8: Action Regressions", "Preview, Send Test, Duplicate, and Delete actions all work flawlessly.");

  } catch (err: any) {
    fail("Verification Suite Execution", err.message || String(err));
  } finally {
    // Clean up created test campaigns
    if (createdCampaignIds.length > 0) {
      await CampaignModel.deleteMany({ id: { $in: createdCampaignIds } });
      console.log(`\n[Cleanup] Removed ${createdCampaignIds.length} test campaign records.`);
    }
    await disconnectDB();
  }

  // Summary
  console.log("\n================================================================================");
  console.log("                           VERIFICATION SUMMARY                                 ");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`Total Scenarios Tested : ${total}`);
  console.log(`Passed                 : ${passed}`);
  console.log(`Failed                 : ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runEditCampaignVerification().catch((err) => {
  console.error("Fatal error running verification:", err);
  process.exit(1);
});
