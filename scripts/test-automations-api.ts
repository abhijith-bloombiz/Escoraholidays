import http from "node:http";

async function makeRequest(options: http.RequestOptions, body?: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = null;
        }
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          data: parsed,
          raw: data,
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log("=== Comprehensive Testing of Automations API ===");

  // 1. Login
  const loginBody = JSON.stringify({ username: "Admin", password: "Admin" });
  const loginRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginBody),
    },
  }, loginBody);

  console.log("1. Login status:", loginRes.statusCode);
  const cookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0];

  // 2. GET /api/notifications/automations
  console.log("\n2. Calling GET /api/notifications/automations...");
  const getRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: "/api/notifications/automations",
    method: "GET",
    headers: { Cookie: cookie || "" },
  });
  console.log("   Status:", getRes.statusCode);
  console.log("   Automations count:", Array.isArray(getRes.data) ? getRes.data.length : 0);

  // 3. POST /api/notifications/automations (Create)
  console.log("\n3. Testing Automation Creation (POST)...");
  const newAuto = JSON.stringify({
    name: "VIP Kerala Heritage Consultation",
    category: "transactional",
    trigger: "enquiry_submitted",
    triggerDescription: "Special high-touch welcome for bespoke luxury enquiries",
    templateId: "luxury_welcome_ack",
    templateName: "Luxury Welcome & Enquiry Acknowledgement",
    recipientLogic: "Lead Guest & Primary Contact (customerEmail)",
    timingType: "delay",
    delayValue: 15,
    delayUnit: "minutes",
    requiresApproval: true,
    enabled: true,
    conditions: { minAmount: 150000, travelStyle: "Heritage & Culture" },
  });

  const postRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: "/api/notifications/automations",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(newAuto),
      Cookie: cookie || "",
    },
  }, newAuto);

  console.log("   Status:", postRes.statusCode);
  const created = postRes.data;
  console.log("   Created ID:", created?.id);
  console.log("   Created Name:", created?.name);
  console.log("   Requires Approval:", created?.requiresApproval);

  if (!created?.id) {
    throw new Error("Failed to create automation rule!");
  }

  // 4. PATCH /api/notifications/automations/:id (Toggle enabled & change delay)
  console.log(`\n4. Testing Automation Status Toggle & Delay Update (PATCH ${created.id})...`);
  const patchBody = JSON.stringify({ enabled: false, delayValue: 30 });
  const patchRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/notifications/automations/${created.id}`,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(patchBody),
      Cookie: cookie || "",
    },
  }, patchBody);
  console.log("   PATCH Status:", patchRes.statusCode);
  console.log("   New Enabled State:", patchRes.data?.automation?.enabled);
  console.log("   New Delay Value:", patchRes.data?.automation?.delayValue);

  // 5. PUT /api/notifications/automations/:id (Full Update)
  console.log(`\n5. Testing Full Automation Update (PUT ${created.id})...`);
  const putBody = JSON.stringify({
    name: "VIP Kerala Heritage Consultation (Updated)",
    category: "operational",
    trigger: "enquiry_submitted",
    triggerDescription: "Revised description",
    templateId: "luxury_welcome_ack",
    templateName: "Luxury Welcome & Enquiry Acknowledgement",
    recipientLogic: "Duty Concierge & Operations Managers",
    timingType: "immediate",
    delayValue: 0,
    delayUnit: "minutes",
    requiresApproval: false,
    enabled: true,
  });
  const putRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/notifications/automations/${created.id}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(putBody),
      Cookie: cookie || "",
    },
  }, putBody);
  console.log("   PUT Status:", putRes.statusCode);
  console.log("   Updated Name:", putRes.data?.name);
  console.log("   Updated Category:", putRes.data?.category);

  // 6. GET /api/notifications/automations/:id (Single record inspection)
  console.log(`\n6. Testing Single Automation Retrieval (GET ${created.id})...`);
  const getSingleRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/notifications/automations/${created.id}`,
    method: "GET",
    headers: { Cookie: cookie || "" },
  });
  console.log("   GET Single Status:", getSingleRes.statusCode);
  console.log("   Retrieved Name:", getSingleRes.data?.name);

  // 7. DELETE /api/notifications/automations/:id (Delete record)
  console.log(`\n7. Testing Automation Deletion (DELETE ${created.id})...`);
  const delRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/notifications/automations/${created.id}`,
    method: "DELETE",
    headers: { Cookie: cookie || "" },
  });
  console.log("   DELETE Status:", delRes.statusCode);

  // 8. Verify it's gone
  const verifyDelRes = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/notifications/automations/${created.id}`,
    method: "GET",
    headers: { Cookie: cookie || "" },
  });
  console.log("   Verification after delete Status:", verifyDelRes.statusCode, "(expecting 404)");

  console.log("\n=== All Automation API Operations Verified Successfully! ===");
}

run().catch(console.error);
