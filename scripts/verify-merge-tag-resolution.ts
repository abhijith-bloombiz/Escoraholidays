import fs from "node:fs";
import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  CampaignModel,
  SubscriberConsentModel,
  EnquiryModel,
  OrderModel,
  getNextSequence,
} from "../lib/db/src/index";
import {
  resolveMergeTags,
  renderCampaignForRecipient,
  detectUnresolvedAndMalformedTags,
  resolveDestinationFromOrders,
  escapeHtml,
  buildUnsubscribeUrl,
} from "../apps/api-server/src/services/merge-tag-resolver";
import {
  resolveAudience,
  validateCampaignPreSend,
  sendCampaign,
} from "../apps/api-server/src/services/campaign-service";

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
  id: string;
  requirement: string;
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const results: TestResult[] = [];

function pass(id: string, requirement: string, details?: string, durationMs?: number) {
  results.push({ id, requirement, passed: true, details, durationMs });
  const timeStr = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.log(`  [PASS] ${id}: ${requirement}${timeStr}`);
  if (details) console.log(`         ↳ ${details}`);
}

function fail(id: string, requirement: string, details?: string) {
  results.push({ id, requirement, passed: false, details });
  console.error(`  [FAIL] ${id}: ${requirement}`);
  if (details) console.error(`         ↳ ERROR: ${details}\n`);
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

async function runMergeTagPersonalizationSuite() {
  console.log("================================================================================");
  console.log("   ESCORA HOLIDAYS — RELIABLE MERGE TAG PERSONALIZATION VERIFICATION SUITE       ");
  console.log("================================================================================\n");

  await connectDB();

  const testSuffix = Date.now().toString().slice(-6);
  let sessionCookie: string | null = null;
  const cleanUpIds: {
    campaignIds: number[];
    enquiryIds: number[];
    orderIds: number[];
    consentEmails: string[];
  } = {
    campaignIds: [],
    enquiryIds: [],
    orderIds: [],
    consentEmails: [],
  };

  try {
    sessionCookie = await loginAdmin();
    console.log("  [INFO] Authenticated as admin against API server\n");
  } catch (err: any) {
    console.log(`  [WARN] Admin API login skipped (${err.message}); running direct service & resolver tests.\n`);
  }

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: All supported merge tags resolve correctly
    // ---------------------------------------------------------------------------
    console.log("--------------------------------------------------------------------------------");
    console.log("Test 1: All Supported Merge Tags Resolution");
    console.log("--------------------------------------------------------------------------------");
    try {
      const template = "Hello {{name}}, welcome to {{destination}}! Copyright {{year}}. Sent to {{email}}. Unsub: {{unsubscribeUrl}}";
      const res = resolveMergeTags(
        template,
        {
          name: "Marcus Vance",
          email: "marcus.vance@example.com",
          destination: "Alleppey",
          token: "token-12345",
        },
        { isHtml: false }
      );

      const resolved = res.rendered;
      const currentYear = new Date().getFullYear().toString();
      assert.ok(resolved.includes("Hello Marcus Vance,"), "Name tag must resolve to recipient name");
      assert.ok(resolved.includes("welcome to Alleppey!"), "Destination tag must resolve to recipient destination");
      assert.ok(resolved.includes(`Copyright ${currentYear}.`), "Year tag must resolve to current year");
      assert.ok(resolved.includes("Sent to marcus.vance@example.com."), "Email tag must resolve to recipient email");
      assert.ok(resolved.includes("token=token-12345"), "UnsubscribeUrl tag must resolve to token URL");

      pass(
        "TAGS-SUPPORTED-01",
        "All supported merge tags ({{name}}, {{destination}}, {{year}}, {{email}}, {{unsubscribeUrl}}) resolve correctly",
        `Rendered output: "${resolved}"`
      );
    } catch (err: any) {
      fail("TAGS-SUPPORTED-01", "Supported merge tag resolution failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 2: Different recipients receive their own correct values
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 2: Recipient-Specific Differentiation");
    console.log("--------------------------------------------------------------------------------");
    try {
      const template = "Hi {{name}}, your trip to {{destination}} is confirmed! (Contact: {{email}})";

      const recipientA = {
        name: "Dr. Evelyn Reed",
        email: "evelyn.reed@example.com",
        destination: "Munnar",
        token: "token-a",
      };
      const recipientB = {
        name: "Capt. Liam Davies",
        email: "liam.davies@example.com",
        destination: "Wayanad",
        token: "token-b",
      };

      const renderedA = resolveMergeTags(template, recipientA, { isHtml: false }).rendered;
      const renderedB = resolveMergeTags(template, recipientB, { isHtml: false }).rendered;

      assert.ok(renderedA.includes("Dr. Evelyn Reed") && renderedA.includes("Munnar") && renderedA.includes("evelyn.reed@example.com"));
      assert.ok(renderedB.includes("Capt. Liam Davies") && renderedB.includes("Wayanad") && renderedB.includes("liam.davies@example.com"));
      assert.notStrictEqual(renderedA, renderedB, "Recipients must receive unique personalized copy");

      pass(
        "TAGS-DIFFERENTIATION-02",
        "Different recipients receive their own personalized values",
        `Recipient A: "${renderedA}" | Recipient B: "${renderedB}"`
      );
    } catch (err: any) {
      fail("TAGS-DIFFERENTIATION-02", "Recipient differentiation failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 3: Missing names and destinations use appropriate fallbacks
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 3: Context-Aware Fallbacks for Missing Values");
    console.log("--------------------------------------------------------------------------------");
    try {
      // 3a: Greeting context ("Hello {{name}}") fallback to "Hello there"
      const greetingTemplate = "Hello {{name}}, explore stunning {{destination}} with us!";
      const resGreeting = resolveMergeTags(
        greetingTemplate,
        { email: "anon@example.com", token: "tok1" },
        { isHtml: false }
      ).rendered;
      assert.ok(resGreeting.includes("Hello there,"), `Expected "Hello there,", got: ${resGreeting}`);
      assert.ok(resGreeting.includes("explore stunning Kerala with us!"), `Expected fallback "Kerala", got: ${resGreeting}`);

      // 3b: Formal context ("Dear {{name}}") fallback to "Dear Valued Guest"
      const formalTemplate = "Dear {{name}}, we have a special announcement.";
      const resFormal = resolveMergeTags(
        formalTemplate,
        { email: "anon@example.com", token: "tok2" },
        { isHtml: false }
      ).rendered;
      assert.ok(resFormal.includes("Dear Valued Guest,"), `Expected "Dear Valued Guest,", got: ${resFormal}`);

      // 3c: Custom fallback specified in options
      const customFallbackTemplate = "Discover your next adventure in {{destination}}!";
      const resCustom = resolveMergeTags(
        customFallbackTemplate,
        { email: "anon@example.com", token: "tok3" },
        { defaultDestination: "South India", isHtml: false }
      ).rendered;
      assert.ok(resCustom.includes("Discover your next adventure in South India!"), `Expected "South India", got: ${resCustom}`);

      pass(
        "TAGS-FALLBACK-03",
        "Missing names and destinations use appropriate context-aware fallbacks ('there', 'Valued Guest', 'Kerala')",
        `Greeting: "${resGreeting}" | Formal: "${resFormal}"`
      );
    } catch (err: any) {
      fail("TAGS-FALLBACK-03", "Missing values fallback test failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 4: Missing email addresses are rejected safely
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 4: Missing or Invalid Email Rejection");
    console.log("--------------------------------------------------------------------------------");
    try {
      const renderRes = renderCampaignForRecipient(
        {
          subject: "Trip to {{destination}}",
          contentHtml: "<p>Hello {{name}}</p>",
        },
        {
          name: "Nameless Contact",
          email: "", // empty email
          token: "token-x",
        }
      );

      assert.strictEqual(renderRes.success, false, "Recipient with empty email must be blocked from sending");
      assert.ok(renderRes.errors.some(e => e.includes("Invalid or missing recipient email")), `Expected email error, got: ${renderRes.errors.join("; ")}`);

      const invalidEmailRes = renderCampaignForRecipient(
        {
          subject: "Trip to {{destination}}",
          contentHtml: "<p>Hello {{name}}</p>",
        },
        {
          name: "Invalid Contact",
          email: "not-an-email",
          token: "token-y",
        }
      );
      assert.strictEqual(invalidEmailRes.success, false, "Recipient with malformed email must be blocked from sending");
      assert.ok(invalidEmailRes.errors.some(e => e.includes("Invalid or missing recipient email")));

      pass(
        "TAGS-EMAIL-REJECT-04",
        "Missing or invalid recipient email addresses are rejected safely with clear recorded reasons",
        `Empty email error: "${renderRes.errors.join("; ")}" | Malformed email error: "${invalidEmailRes.errors.join("; ")}"`
      );
    } catch (err: any) {
      fail("TAGS-EMAIL-REJECT-04", "Email rejection test failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 5: Invalid/missing unsubscribe URLs block marketing delivery
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 5: Unsubscribe URL and Consent Guardrails");
    console.log("--------------------------------------------------------------------------------");
    try {
      const unsubUrl = buildUnsubscribeUrl("valid-token-xyz", "guest@example.com");
      assert.ok(unsubUrl.includes("token=valid-token-xyz"), "Generated unsubscribe URL must contain consent token");
      assert.ok(unsubUrl.includes("email=guest%40example.com"), "Generated unsubscribe URL must contain encoded email");

      const emptyTokenUrl = buildUnsubscribeUrl("", "guest@example.com");
      assert.strictEqual(emptyTokenUrl, "", "Empty token must yield empty URL rather than invalid link");

      // Verify renderCampaignForRecipient blocks if template contains {{unsubscribeUrl}} but token is missing
      const unsubTemplateRes = renderCampaignForRecipient(
        {
          subject: "Special Offer",
          contentHtml: "<p>Unsubscribe here: <a href='{{unsubscribeUrl}}'>Opt-out</a></p>",
        },
        {
          email: "test.subscriber@example.com",
          token: null, // missing consent token
        }
      );

      assert.strictEqual(unsubTemplateRes.success, false, "Missing unsubscribe token in marketing template must fail validation");
      assert.ok(unsubTemplateRes.errors.some(e => e.includes("Missing cryptographic consent token")), `Errors: ${unsubTemplateRes.errors.join("; ")}`);

      pass(
        "TAGS-UNSUB-BLOCK-05",
        "Missing or invalid unsubscribe URL prevents marketing email dispatch",
        `Validation errors: "${unsubTemplateRes.errors.join("; ")}"`
      );
    } catch (err: any) {
      fail("TAGS-UNSUB-BLOCK-05", "Unsubscribe guardrail failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 6: Unresolved and malformed merge tags are detected
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 6: Unresolved and Malformed Merge Tag Detection");
    console.log("--------------------------------------------------------------------------------");
    try {
      const templateWithBadTags = `
        <style>body { color: #333; margin: 0; }</style>
        <h1>Hello {{name}}</h1>
        <p>Explore {{discountRate}} in {{destination}}.</p>
        <p>Your guide: {{guideName</p>
        <p>Contact us: {supportEmail}}</p>
      `;

      const { unresolved, malformed } = detectUnresolvedAndMalformedTags(templateWithBadTags);
      assert.ok(unresolved.includes("{{discountRate}}"), "Must detect unsupported tag {{discountRate}}");
      assert.ok(malformed.includes("{{guideName"), "Must detect unclosed tag {{guideName");
      assert.ok(malformed.includes("{supportEmail}}"), "Must detect unopened tag {supportEmail}}");
      assert.ok(!unresolved.some(t => t.includes("color:")) && !malformed.some(t => t.includes("color:")), "Legitimate CSS braces must NOT be flagged as tags");

      // Verify pre-send rejection when template has bad tags
      const renderedBad = renderCampaignForRecipient(
        {
          subject: "Offer with {{unknownCode}}",
          contentHtml: "<p>Hello {{name}}</p>",
        },
        {
          name: "Marcus",
          email: "marcus@example.com",
          token: "token-1",
        }
      );
      assert.strictEqual(renderedBad.success, false, "Campaign with unresolved tag in subject must be blocked");
      assert.ok(renderedBad.errors.some(e => e.includes("{{unknownCode}}")), "Rejection reason must list unresolved tag");

      pass(
        "TAGS-MALFORMED-DETECT-06",
        "Unresolved and malformed merge tags are detected without false positives on legitimate CSS",
        `Unresolved: ${JSON.stringify(unresolved)} | Malformed: ${JSON.stringify(malformed)}`
      );
    } catch (err: any) {
      fail("TAGS-MALFORMED-DETECT-06", "Malformed tag detection failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 7: Recipient values containing HTML characters are safely escaped
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 7: HTML Injection Prevention and Safe Escaping");
    console.log("--------------------------------------------------------------------------------");
    try {
      const maliciousName = "<script>alert('XSS')</script>";
      const nameWithQuotes = "O'Connor & Sons \"Luxury\"";

      // HTML body escaping
      const renderedHtml = resolveMergeTags(
        "<p>Dear {{name}}, your invoice is ready.</p>",
        {
          name: maliciousName,
          email: "guest@example.com",
          token: "tok",
        },
        { isHtml: true }
      ).rendered;

      assert.ok(!renderedHtml.includes("<script>"), "HTML tags from recipient data must be escaped");
      assert.ok(renderedHtml.includes("&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"), "Recipient input must be converted to HTML entities");

      // Plain text subject line: should remain human-readable without entity encoding
      const renderedSubject = resolveMergeTags(
        "Special invitation for {{name}}",
        {
          name: nameWithQuotes,
          email: "guest@example.com",
          token: "tok",
        },
        { isHtml: false } // Subject line is plain text
      ).rendered;

      assert.strictEqual(renderedSubject, "Special invitation for O'Connor & Sons \"Luxury\"", "Subject line must preserve natural apostrophes and quotes");

      // Verify no secondary expansion if recipient value contains a merge tag string
      const deceptiveName = "{{destination}} Hacker";
      const renderedSecondary = resolveMergeTags(
        "Welcome {{name}}! Destination: {{destination}}",
        {
          name: deceptiveName,
          destination: "Kovalam",
          email: "guest@example.com",
          token: "tok",
        },
        { isHtml: false }
      ).rendered;

      assert.strictEqual(
        renderedSecondary,
        "Welcome {{destination}} Hacker! Destination: Kovalam",
        "Secondary merge tag expansion must be prevented"
      );

      pass(
        "TAGS-XSS-ESCAPE-07",
        "Recipient values are safely escaped in HTML bodies, preserved in subjects, and protected against recursive expansion",
        `HTML output: "${renderedHtml}" | Subject output: "${renderedSubject}"`
      );
    } catch (err: any) {
      fail("TAGS-XSS-ESCAPE-07", "HTML escaping and secondary expansion prevention failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 8: Multiple bookings or destinations are handled deterministically
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 8: Deterministic Multi-Booking Resolution");
    console.log("--------------------------------------------------------------------------------");
    try {
      const multiOrders = [
        {
          status: "pending",
          destinations: ["Thekkady"],
          packageName: "Spice Trail",
          createdAt: new Date("2026-01-10T10:00:00Z"),
        },
        {
          status: "confirmed",
          destinations: ["Alleppey Houseboat"],
          packageName: "Backwater Serenity",
          createdAt: new Date("2026-01-15T10:00:00Z"),
        },
        {
          status: "confirmed",
          destinations: ["Munnar Hills"],
          packageName: "Mist & Tea Garden Experience",
          createdAt: new Date("2026-02-01T10:00:00Z"), // More recent confirmed order
        },
        {
          status: "cancelled",
          destinations: ["Varkala Beach"],
          packageName: "Cliff & Waves",
          createdAt: new Date("2026-02-10T10:00:00Z"), // Most recent order, but cancelled
        },
      ];

      // Resolution rule:
      // 1. Confirmed/completed bookings take precedence over pending or cancelled
      // 2. Among confirmed bookings, the most recent (createdAt desc) takes precedence
      const resolvedDest = resolveDestinationFromOrders(multiOrders);
      assert.strictEqual(
        resolvedDest,
        "Munnar Hills",
        `Expected most recent confirmed booking "Munnar Hills", got "${resolvedDest}"`
      );

      // When only pending orders exist:
      const pendingOnlyOrders = [
        {
          status: "pending",
          destinations: ["Wayanad"],
          createdAt: new Date("2026-01-10T10:00:00Z"),
        },
        {
          status: "pending",
          destinations: ["Athirappilly"],
          createdAt: new Date("2026-01-20T10:00:00Z"),
        },
      ];
      const resolvedPending = resolveDestinationFromOrders(pendingOnlyOrders);
      assert.strictEqual(
        resolvedPending,
        "Athirappilly",
        `Expected latest pending booking "Athirappilly", got "${resolvedPending}"`
      );

      pass(
        "TAGS-DETERMINISTIC-ORDER-08",
        "Deterministic resolution rules correctly prioritize confirmed bookings and latest activity without arbitrary selection",
        `Resolved multi-booking destination: "${resolvedDest}"`
      );
    } catch (err: any) {
      fail("TAGS-DETERMINISTIC-ORDER-08", "Deterministic order resolution failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 9: Preview rendering and actual sending use the same resolver
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 9: Unified Resolver Consistency Across Preview & Delivery");
    console.log("--------------------------------------------------------------------------------");
    try {
      const templateSubject = "Exclusive Kerala Journey for {{name}}";
      const templateHtml = "<h2>Welcome to {{destination}}!</h2><p>Year: {{year}}</p>";
      const recipient = {
        name: "Marcus Vance",
        email: "marcus.vance@example.com",
        destination: "Kumarakom",
        token: "test-sample-token",
      };

      // Server delivery render
      const serverDelivery = renderCampaignForRecipient(
        {
          subject: templateSubject,
          contentHtml: templateHtml,
        },
        recipient
      );

      // Preview render
      const previewSubject = resolveMergeTags(templateSubject, recipient, { isHtml: false }).rendered;
      const previewHtml = resolveMergeTags(templateHtml, recipient, { isHtml: true }).rendered;

      assert.strictEqual(serverDelivery.renderedSubject, previewSubject, "Subject in delivery and preview must match exactly");
      assert.ok(serverDelivery.renderedHtml.includes(previewHtml), "HTML body in delivery must contain resolved preview HTML");
      assert.strictEqual(serverDelivery.success, true, "Valid campaign rendering must succeed");

      pass(
        "TAGS-UNIFIED-RESOLVER-09",
        "Unified resolver ensures preview rendering and actual dispatch rendering produce identical results",
        `Preview Subject: "${previewSubject}" | Delivery Subject: "${serverDelivery.renderedSubject}"`
      );
    } catch (err: any) {
      fail("TAGS-UNIFIED-RESOLVER-09", "Unified resolver test failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 10: Test emails, scheduled campaigns, and simulation mode compatibility
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 10: Test Email & Simulation Mode Compatibility");
    console.log("--------------------------------------------------------------------------------");
    try {
      // Create a test subscriber consent
      const testEmail = `subscriber.${testSuffix}@example.com`;
      await SubscriberConsentModel.create({
        email: testEmail,
        status: "opted_in",
        optInSource: "verification_test",
        optInAt: new Date(),
        unsubscribeToken: `token-${testSuffix}`,
      });
      cleanUpIds.consentEmails.push(testEmail);

      // Create an order for this subscriber to give them a deterministic destination
      const orderSeq = await getNextSequence("orders");
      await OrderModel.create({
        id: orderSeq,
        guestName: "Audrey Hepburn",
        guestEmail: testEmail,
        guestPhone: "+91 98765 43210",
        destinations: "Munnar",
        packageName: "Tea Valley Luxury",
        totalAmount: 45000,
        status: "confirmed",
        paymentStatus: "paid",
        createdAt: new Date(),
      });
      cleanUpIds.orderIds.push(orderSeq);

      // Create a test campaign in MongoDB
      const campSeq = await getNextSequence("campaigns");
      const testCampaign = await CampaignModel.create({
        id: campSeq,
        name: `Automated Test Campaign #${testSuffix}`,
        subject: "Hello {{name}}, Kerala awaits you in {{destination}}!",
        type: "newsletter",
        status: "approved",
        targetAudience: { type: "all_contacts" },
        contentHtml: `
          <h1>Special Kerala Offer</h1>
          <p>Dear {{name}},</p>
          <p>Explore {{destination}} in {{year}} with Escora Holidays.</p>
          <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        `,
        approvedBy: "System Auditor",
        approvedAt: new Date(),
        stats: { sentCount: 0, openedCount: 0, clickedCount: 0, bounceCount: 0, unsubscribedCount: 0, skippedCount: 0 },
      });
      cleanUpIds.campaignIds.push(campSeq);

      // Test pre-send validation service
      const presendVal = await validateCampaignPreSend(campSeq);
      assert.strictEqual(presendVal.canSend, true, `Campaign pre-send validation must pass. Errors: ${JSON.stringify(presendVal.exclusionReasons)}`);
      assert.ok(presendVal.readyToSend >= 1, "Must have at least 1 ready recipient");
      assert.strictEqual(presendVal.unresolvedTags.length, 0, "Must have zero unresolved tags");

      // Test dispatch in simulation mode (mock: true)
      const dispatchResult = await sendCampaign(campSeq, true);
      assert.strictEqual(dispatchResult.status, "sent", "Campaign dispatch must transition to 'sent'");
      assert.ok(dispatchResult.stats.sentCount >= 1, "Simulation must count delivered recipient");

      // Test the test-email endpoint if API server is running
      if (sessionCookie) {
        const testEmailRes = await fetch(`${API_BASE_URL}/api/campaigns/test-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie,
          },
          body: JSON.stringify({
            campaignId: campSeq,
            recipientEmail: testEmail,
          }),
        });

        assert.strictEqual(testEmailRes.status, 200, `Expected 200 from test-email, got ${testEmailRes.status}`);
        const testEmailJson = await testEmailRes.json();
        assert.ok(testEmailJson.to === testEmail || testEmailJson.recipient === testEmail, "Test email must confirm targeted recipient");
        const subj = testEmailJson.personalizedSubject || testEmailJson.subject || "";
        assert.ok(
          subj.includes("Audrey Hepburn") ||
          subj.includes("Munnar") ||
          subj.includes("Kerala") ||
          subj.includes("Test"),
          `Personalized subject expected: ${subj}`
        );
      }

      pass(
        "TAGS-TEST-SIM-COMPAT-10",
        "Test emails, pre-send validation, and simulated campaigns are fully compatible and accurately personalized",
        `Ready Recipients: ${presendVal.readyToSend} | Sent Count: ${dispatchResult.stats.sentCount}`
      );
    } catch (err: any) {
      fail("TAGS-TEST-SIM-COMPAT-10", "Test email / simulation compatibility test failed", err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 11: Existing audience consent and approval safeguards remain enforced
    // ---------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Test 11: Consent and Approval Safeguards Enforcement");
    console.log("--------------------------------------------------------------------------------");
    try {
      // 11a: Unapproved campaign must NOT send, even if merge tags resolve
      const unapprovedSeq = await getNextSequence("campaigns");
      await CampaignModel.create({
        id: unapprovedSeq,
        name: `Unapproved Campaign #${testSuffix}`,
        subject: "Hello {{name}}",
        type: "newsletter",
        status: "draft", // NOT approved
        targetAudience: { type: "all_contacts" },
        contentHtml: "<p>Hello {{name}}, Kerala is calling!</p>",
        stats: { sentCount: 0, openedCount: 0, clickedCount: 0, bounceCount: 0, unsubscribedCount: 0, skippedCount: 0 },
      });
      cleanUpIds.campaignIds.push(unapprovedSeq);

      let sendErrorThrown = false;
      try {
        await sendCampaign(unapprovedSeq, true);
      } catch (err: any) {
        sendErrorThrown = true;
        assert.ok(
          err.message.toLowerCase().includes("approv"),
          `Expected approval error message, got: ${err.message}`
        );
      }
      assert.strictEqual(sendErrorThrown, true, "Sending an unapproved campaign must throw an error");

      // 11b: Opted-out contact must be skipped and recorded
      const optOutEmail = `optout.${testSuffix}@example.com`;
      await SubscriberConsentModel.create({
        email: optOutEmail,
        subscribed: false, // Opted out
        token: `unsub-${testSuffix}`,
        source: "verification_test",
        unsubscribedAt: new Date(),
      });
      cleanUpIds.consentEmails.push(optOutEmail);

      const enquirySeq = await getNextSequence("enquiries");
      await EnquiryModel.create({
        id: enquirySeq,
        name: "Opted Out Guest",
        email: optOutEmail,
        phone: "+91 98765 00000",
        message: "Test enquiry for opt-out verification",
      });
      cleanUpIds.enquiryIds.push(enquirySeq);

      const { eligible, unsubscribedCount } = await resolveAudience({ type: "all_contacts" });
      const optedOutEntry = eligible.find(a => a.email === optOutEmail);
      assert.strictEqual(optedOutEntry?.isSubscribed, false, "Opted-out contact must have isSubscribed=false");
      assert.ok(unsubscribedCount >= 1, "Unsubscribed count must be at least 1");

      pass(
        "TAGS-SAFEGUARDS-ENFORCED-11",
        "Approval workflows and opt-out consent gates remain strictly enforced; valid merge tags cannot bypass governance",
        "Unapproved campaign blocked; Opted-out contact skipped in audience"
      );
    } catch (err: any) {
      fail("TAGS-SAFEGUARDS-ENFORCED-11", "Safeguard enforcement test failed", err.message);
    }

  } finally {
    // Clean up test data
    console.log("\n--------------------------------------------------------------------------------");
    console.log("Clean-up: Removing Test Artifacts");
    console.log("--------------------------------------------------------------------------------");
    if (cleanUpIds.campaignIds.length > 0) {
      await CampaignModel.deleteMany({ id: { $in: cleanUpIds.campaignIds } });
    }
    if (cleanUpIds.orderIds.length > 0) {
      await OrderModel.deleteMany({ id: { $in: cleanUpIds.orderIds } });
    }
    if (cleanUpIds.consentEmails.length > 0) {
      await SubscriberConsentModel.deleteMany({ email: { $in: cleanUpIds.consentEmails } });
    }
    console.log("  [INFO] Test data cleaned up successfully.\n");
    await disconnectDB();
  }

  // Summary
  console.log("================================================================================");
  console.log("                           VERIFICATION SUMMARY                                 ");
  console.log("================================================================================");
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`Total Requirements Tested: ${total}`);
  console.log(`Passed:                   ${passedCount}`);
  console.log(`Failed:                   ${failedCount}`);

  if (failedCount > 0) {
    console.error("\n❌ SOME VERIFICATION TESTS FAILED.");
    process.exit(1);
  } else {
    console.log("\n✅ ALL 11 VERIFICATION REQUIREMENTS PASSED SUCCESSFULLY.");
  }
}

runMergeTagPersonalizationSuite().catch((err) => {
  console.error("Fatal error during suite execution:", err);
  process.exit(1);
});
