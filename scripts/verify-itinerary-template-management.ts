import fs from "node:fs";
import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  ItineraryTemplateModel,
  ItineraryModel,
  seedPredefinedTemplates,
} from "../lib/db/src/index";

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

interface TestStepResult {
  step: string;
  passed: boolean;
  details?: string;
}

const results: TestStepResult[] = [];

function recordResult(step: string, passed: boolean, details?: string) {
  results.push({ step, passed, details });
  if (passed) {
    console.log(`  [PASS] ${step}${details ? ` (${details})` : ""}`);
  } else {
    console.error(`  [FAIL] ${step}${details ? `: ${details}` : ""}`);
  }
}

async function runVerification() {
  console.log("===============================================================");
  console.log("   Escora Holidays: Itinerary Template Management Audit");
  console.log("===============================================================\n");

  await connectDB();

  let adminCookie = "";

  // 1. Auth check: unauthenticated requests must receive 401
  try {
    const unauthRes = await fetch(`${API_BASE_URL}/api/itinerary-templates`);
    const isProtected = unauthRes.status === 401 || unauthRes.status === 403;
    recordResult("1. API Authorization: Unauthenticated access blocked", isProtected, `Status: ${unauthRes.status}`);
  } catch (err: any) {
    recordResult("1. API Authorization: Unauthenticated access blocked", false, err.message);
  }

  // 2. Authenticate as Admin
  try {
    const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
    });

    if (loginRes.ok) {
      const rawCookie = loginRes.headers.get("set-cookie") || "";
      adminCookie = rawCookie.split(";")[0] || "";
      recordResult("2. Admin Authentication: Logged in successfully", true);
    } else {
      recordResult("2. Admin Authentication: Logged in successfully", false, `Status: ${loginRes.status}`);
      return;
    }
  } catch (err: any) {
    recordResult("2. Admin Authentication: Logged in successfully", false, err.message);
    return;
  }

  // 3. List templates and verify 7 predefined templates are seeded
  let initialTemplates: any[] = [];
  try {
    const listRes = await fetch(`${API_BASE_URL}/api/itinerary-templates`, {
      headers: { Cookie: adminCookie },
    });
    initialTemplates = await listRes.json();
    const hasAtLeast7 = Array.isArray(initialTemplates) && initialTemplates.length >= 7;
    recordResult(
      "3. Template Seeding: Initial list contains predefined templates",
      hasAtLeast7,
      `Found ${initialTemplates.length} templates`
    );
  } catch (err: any) {
    recordResult("3. Template Seeding: Initial list contains predefined templates", false, err.message);
  }

  // 4. Server-side validation: empty label or missing fields rejected
  try {
    const invalidRes = await fetch(`${API_BASE_URL}/api/itinerary-templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        label: "",
        title: "Test",
        destination: "Kerala",
        description: "",
      }),
    });
    const isRejected = invalidRes.status === 400;
    recordResult("4. Server-Side Validation: Invalid/empty fields rejected (400)", isRejected, `Status: ${invalidRes.status}`);
  } catch (err: any) {
    recordResult("4. Server-Side Validation: Invalid/empty fields rejected (400)", false, err.message);
  }

  // 5. Create a new template
  let createdTemplateId = "";
  const testTemplateLabel = `Automated Test Journey ${Date.now()}`;
  try {
    const createRes = await fetch(`${API_BASE_URL}/api/itinerary-templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        label: testTemplateLabel,
        title: `${testTemplateLabel} — 4 Days · 3 Nights`,
        destination: "Wayanad Highlands, Kerala",
        description: "Curated coffee estate retreat and wildlife excursions.",
        days: JSON.stringify([
          { day: 1, title: "Day 1 | Arrival in Wayanad", description: "Check in to plantation resort." },
          { day: 2, title: "Day 2 | Chembra Peak Trek", description: "Guided morning hike to heart-shaped lake." },
          { day: 3, title: "Day 3 | Edakkal Caves & Waterfalls", description: "Explore Neolithic rock carvings." },
          { day: 4, title: "Day 4 | Departure", description: "Transfer to Calicut Airport." },
        ]),
        stays: JSON.stringify([
          { name: "Vythiri Plantation Resort", location: "Wayanad", nights: 3, roomType: "Treehouse Villa" },
        ]),
        pricing: JSON.stringify({
          items: [{ label: "Luxury Treehouse Stay & Chauffeur", amount: 45000 }],
          total: 45000,
        }),
        inclusions: JSON.stringify(["Treehouse stay with breakfast", "Private AC SUV transfers"]),
        exclusions: JSON.stringify(["Flight tickets", "Personal tips"]),
      }),
    });

    if (createRes.status === 201) {
      const created = await createRes.json();
      createdTemplateId = created.id;
      recordResult("5. Template Creation: Successfully created new template", true, `ID: ${created.id}`);
    } else {
      const errBody = await createRes.text();
      recordResult("5. Template Creation: Successfully created new template", false, `Status ${createRes.status}: ${errBody}`);
    }
  } catch (err: any) {
    recordResult("5. Template Creation: Successfully created new template", false, err.message);
  }

  // 6. Persistence check: retrieve created template by ID
  try {
    const getRes = await fetch(`${API_BASE_URL}/api/itinerary-templates/${createdTemplateId}`, {
      headers: { Cookie: adminCookie },
    });
    if (getRes.ok) {
      const fetched = await getRes.json();
      const matches = fetched.id === createdTemplateId && fetched.label === testTemplateLabel;
      recordResult("6. Template Persistence: Retrieved template persists across requests", matches);
    } else {
      recordResult("6. Template Persistence: Retrieved template persists across requests", false, `Status: ${getRes.status}`);
    }
  } catch (err: any) {
    recordResult("6. Template Persistence: Retrieved template persists across requests", false, err.message);
  }

  // 7. Update Template: edit supported fields persistently
  const updatedTitle = `${testTemplateLabel} — Enhanced Slow Luxury Edition`;
  try {
    const patchRes = await fetch(`${API_BASE_URL}/api/itinerary-templates/${createdTemplateId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        title: updatedTitle,
        pricing: JSON.stringify({
          items: [{ label: "Upgraded Luxury Treehouse & Chauffeur", amount: 52000 }],
          total: 52000,
        }),
      }),
    });

    if (patchRes.ok) {
      const updated = await patchRes.json();
      const persists = updated.title === updatedTitle && JSON.parse(updated.pricing).total === 52000;
      recordResult("7. Template Editing: Successfully updated template and pricing", persists);
    } else {
      recordResult("7. Template Editing: Successfully updated template and pricing", false, `Status: ${patchRes.status}`);
    }
  } catch (err: any) {
    recordResult("7. Template Editing: Successfully updated template and pricing", false, err.message);
  }

  // 8. "Use Template" behavior: Create customer proposal from template
  let createdProposalId: number | null = null;
  try {
    const getTplRes = await fetch(`${API_BASE_URL}/api/itinerary-templates/${createdTemplateId}`, {
      headers: { Cookie: adminCookie },
    });
    const tpl = await getTplRes.json();

    const proposalRes = await fetch(`${API_BASE_URL}/api/itineraries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        customerName: "Audited Guest",
        customerEmail: "audit@escoraholidays.com",
        title: tpl.title,
        destination: tpl.destination,
        summary: tpl.description,
        days: tpl.days,
        stays: tpl.stays,
        pricing: tpl.pricing,
        currency: "INR",
        status: "draft",
        referenceNumber: `AUDIT-TPL-${Date.now()}`,
      }),
    });

    if (proposalRes.status === 201) {
      const proposal = await proposalRes.json();
      createdProposalId = proposal.id;
      recordResult(
        "8. Use Template Flow: Successfully instantiated independent proposal",
        true,
        `Proposal ID: ${proposal.id}`
      );
    } else {
      recordResult("8. Use Template Flow: Successfully instantiated independent proposal", false, `Status: ${proposalRes.status}`);
    }
  } catch (err: any) {
    recordResult("8. Use Template Flow: Successfully instantiated independent proposal", false, err.message);
  }

  // 9. Independence check: Modify template again and verify proposal was NOT modified
  try {
    await fetch(`${API_BASE_URL}/api/itinerary-templates/${createdTemplateId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        title: "Diverged Template Title (Should Not Alter Created Proposal)",
      }),
    });

    // Check proposal in DB
    const prop = await ItineraryModel.findOne({ id: createdProposalId }).lean();
    const isUnmodified = prop && prop.title === updatedTitle;
    recordResult(
      "9. Immutability & Independence: Proposal remained unchanged after subsequent template edit",
      Boolean(isUnmodified),
      `Proposal title retained: "${prop?.title}"`
    );
  } catch (err: any) {
    recordResult("9. Immutability & Independence: Proposal remained unchanged after subsequent template edit", false, err.message);
  }

  // 10. Deletion safety when referenced:
  // Since this template has a proposal referencing its label/title, deleting it should archive it to preserve history
  try {
    const delRes = await fetch(`${API_BASE_URL}/api/itinerary-templates/${createdTemplateId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });

    if (delRes.status === 204) {
      // Check in DB whether it was archived or preserved
      const tplInDb = await ItineraryTemplateModel.findOne({ id: createdTemplateId }).lean();
      const isArchived = tplInDb && tplInDb.status === "archived";

      // And verify proposal is still intact in DB
      const propStillExists = await ItineraryModel.findOne({ id: createdProposalId }).lean();

      recordResult(
        "10. Referenced Template Deletion Safety: Safely archived without cascading deletion of proposals",
        Boolean(isArchived && propStillExists),
        `Status: ${tplInDb?.status}, Proposal preserved: ${Boolean(propStillExists)}`
      );
    } else {
      recordResult("10. Referenced Template Deletion Safety: Safely archived without cascading deletion of proposals", false, `Status: ${delRes.status}`);
    }
  } catch (err: any) {
    recordResult("10. Referenced Template Deletion Safety: Safely archived without cascading deletion of proposals", false, err.message);
  }

  // 11. Unreferenced template deletion: clean removal for scratch templates
  try {
    const unrefLabel = `Scratch Template ${Date.now()}`;
    const unrefRes = await fetch(`${API_BASE_URL}/api/itinerary-templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        label: unrefLabel,
        title: `${unrefLabel} Title`,
        destination: "Munnar, Kerala",
        description: "Temporary scratch template for deletion test",
      }),
    });

    const unrefTpl = await unrefRes.json();
    const delUnrefRes = await fetch(`${API_BASE_URL}/api/itinerary-templates/${unrefTpl.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });

    const deletedFromDb = await ItineraryTemplateModel.findOne({ id: unrefTpl.id }).lean();
    recordResult(
      "11. Unreferenced Template Deletion: Hard-deleted cleanly when no business records link to it",
      delUnrefRes.status === 204 && deletedFromDb === null
    );
  } catch (err: any) {
    recordResult("11. Unreferenced Template Deletion: Hard-deleted cleanly when no business records link to it", false, err.message);
  }

  // 12. Verification of all 7 predefined templates
  try {
    const activeTemplatesRes = await fetch(`${API_BASE_URL}/api/itinerary-templates`, {
      headers: { Cookie: adminCookie },
    });
    const activeTemplates = await activeTemplatesRes.json();
    const predefinedIds = [
      "explora-trivandrum",
      "kerala-classic",
      "varkala",
      "kozhikode-wayanad",
      "kerala-group-quote",
      "jammu-kashmir",
      "thailand",
    ];

    const allPresent = predefinedIds.every((id) =>
      activeTemplates.some((t: any) => t.id === id)
    );

    recordResult(
      "12. Predefined Catalog Integrity: All 7 standard templates remain active and usable",
      allPresent,
      `Active templates count: ${activeTemplates.length}`
    );
  } catch (err: any) {
    recordResult("12. Predefined Catalog Integrity: All 7 standard templates remain active and usable", false, err.message);
  }

  // Clean up test proposal
  if (createdProposalId) {
    await ItineraryModel.deleteOne({ id: createdProposalId });
  }
  if (createdTemplateId) {
    await ItineraryTemplateModel.deleteOne({ id: createdTemplateId });
  }

  await disconnectDB();

  console.log("\n===============================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log(`Audit Summary: ${passed} / ${total} steps passed.`);
  console.log("===============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
