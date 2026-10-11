async function runTests() {
  const BASE = "http://localhost:8080";
  console.log("=== Testing Escora API on MongoDB ===");

  // 1. Health
  console.log("\n[1] Health Check:");
  const healthRes = await fetch(`${BASE}/api/health`);
  const health = await healthRes.json();
  console.log("  Status:", healthRes.status, health);

  // 2. Destinations List
  console.log("\n[2] Destinations List:");
  const destsRes = await fetch(`${BASE}/api/destinations`);
  const dests = await destsRes.json();
  console.log(`  Status: ${destsRes.status}, Count: ${Array.isArray(dests) ? dests.length : 0}`);
  if (Array.isArray(dests) && dests.length > 0) {
    console.log(`  Sample: id=${dests[0].id}, name=${dests[0].name}, slug=${dests[0].slug}`);
  }

  // 3. Destination by ID
  console.log("\n[3] Single Destination (ID 1):");
  const dest1Res = await fetch(`${BASE}/api/destinations/1`);
  const dest1 = await dest1Res.json();
  console.log(`  Status: ${dest1Res.status}, Name: ${dest1.name}, ID type: ${typeof dest1.id}`);

  // 4. Packages List
  console.log("\n[4] Packages List:");
  const pkgsRes = await fetch(`${BASE}/api/packages`);
  const pkgs = await pkgsRes.json();
  console.log(`  Status: ${pkgsRes.status}, Count: ${Array.isArray(pkgs) ? pkgs.length : 0}`);
  if (Array.isArray(pkgs) && pkgs.length > 0) {
    console.log(`  Sample: id=${pkgs[0].id}, name=${pkgs[0].name}, priceFrom=${pkgs[0].priceFrom}`);
  }

  // 5. Journal Posts List
  console.log("\n[5] Journal Posts List:");
  const journalRes = await fetch(`${BASE}/api/journal`);
  const journal = await journalRes.json();
  console.log(`  Status: ${journalRes.status}, Count: ${Array.isArray(journal) ? journal.length : 0}`);

  // 6. Public Enquiry Creation
  console.log("\n[6] Create Enquiry (Public):");
  const enqRes = await fetch(`${BASE}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Deepak Sharma",
      email: "deepak@example.com",
      phone: "+91 9999988888",
      message: "Interested in Kerala monsoon packages for July.",
    }),
  });
  const enq = await enqRes.json();
  console.log(`  Status: ${enqRes.status}, ID: ${enq.id}, Name: ${enq.name}`);

  // 7. Public Order Creation
  console.log("\n[7] Create Order / Booking (Public):");
  const orderRes = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestName: "Ananya Iyer",
      guestEmail: "ananya@example.com",
      guestPhone: "+91 9123456789",
      guestCount: 2,
      travelStyle: "Luxury",
      destinations: "Munnar, Alleppey",
      travelDate: "2026-11-15",
      budgetRange: "₹1,50,000+",
      specialRequests: "Anniversary surprise cake",
    }),
  });
  const order = await orderRes.json();
  console.log(`  Status: ${orderRes.status}, ID: ${order.id}, Guest: ${order.guestName}`);

  // 8. Auth Flow & Protected Endpoints
  console.log("\n[8] Auth Verification:");
  const unauthRes = await fetch(`${BASE}/api/auth/me`);
  console.log("  Unauthenticated GET /api/auth/me status:", unauthRes.status);

  console.log("  Logging in as Admin...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Admin", password: "Admin" }),
  });
  const rawCookie = loginRes.headers.get("set-cookie") || "";
  const cookie = rawCookie.split(";")[0];
  console.log(`  Login status: ${loginRes.status}, Cookie: ${cookie.slice(0, 25)}...`);

  const authMeRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  const authMe = await authMeRes.json();
  console.log("  Authenticated GET /api/auth/me:", authMe);

  // 9. Dashboard Stats (Protected)
  console.log("\n[9] Dashboard Stats (Admin Protected):");
  const statsRes = await fetch(`${BASE}/api/dashboard/stats`, {
    headers: { Cookie: cookie },
  });
  const stats = await statsRes.json();
  console.log(`  Status: ${statsRes.status}`);
  console.log(`  Total Destinations: ${stats.totalDestinations}`);
  console.log(`  Total Packages:     ${stats.totalPackages}`);
  console.log(`  Total Journal Posts:${stats.totalJournalPosts}`);
  console.log(`  Total Orders:       ${stats.totalOrders}`);
  console.log(`  Recent Orders:      ${stats.recentOrders.length}`);

  // 10. Create Itinerary (Protected) & Share Token (Public)
  console.log("\n[10] Itineraries Workflow:");
  const itinCreateRes = await fetch(`${BASE}/api/itineraries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerName: "Siddharth Rao",
      customerEmail: "siddharth@example.com",
      title: "Southern Splendour 6D5N",
      destination: "Kerala",
      days: JSON.stringify([{ day: 1, title: "Kochi Arrival" }]),
      stays: JSON.stringify([{ name: "Brunton Boatyard" }]),
    }),
  });
  const itin = await itinCreateRes.json();
  console.log(`  Created Itinerary: ID=${itin.id}, Token=${itin.shareToken}`);

  console.log(`  Accessing Public Share URL: /api/itineraries/share/${itin.shareToken}`);
  const shareRes = await fetch(`${BASE}/api/itineraries/share/${itin.shareToken}`);
  const sharedItin = await shareRes.json();
  console.log(`  Share status: ${shareRes.status}, Title: "${sharedItin.title}"`);

  // 11. Orders CSV Export (Protected)
  console.log("\n[11] Orders Export CSV (Admin Protected):");
  const csvRes = await fetch(`${BASE}/api/orders/export`, {
    headers: { Cookie: cookie },
  });
  const csvText = await csvRes.text();
  console.log(`  Status: ${csvRes.status}, Content-Type: ${csvRes.headers.get("content-type")}`);
  console.log(`  CSV Header: ${csvText.split("\r\n")[0]}`);
  console.log(`  CSV Rows Count: ${csvText.split("\r\n").length}`);

  // 12. Update Destination (Protected)
  console.log("\n[12] Patch Destination (Admin Protected):");
  const patchRes = await fetch(`${BASE}/api/destinations/1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ shortDesc: "Updated via MongoDB test suite." }),
  });
  const patched = await patchRes.json();
  console.log(`  Status: ${patchRes.status}, Updated shortDesc: "${patched.shortDesc}"`);

  // 13. Logout
  console.log("\n[13] Logout:");
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  console.log("  Status:", logoutRes.status);

  console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
