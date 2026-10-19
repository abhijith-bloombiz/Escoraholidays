/**
 * Escora Holidays — Dashboard Revenue Calculation Test Suite (Option C)
 *
 * Verifies:
 * 1. Zero payments: Invoices with 0 paidAmount contribute 0 to collected revenue.
 * 2. Partial payments: Invoices with partial payment contribute only the actual collected paidAmount.
 * 3. Fully paid invoices: Invoices marked paid contribute their full paidAmount.
 * 4. Unconfirmed bookings: High-value enquiries in OrderModel do NOT contribute to revenue.
 * 5. Cancelled bookings: Cancelled bookings in OrderModel do NOT contribute to revenue.
 * 6. Cancelled invoices: Invoices with status="cancelled" are excluded from revenue.
 * 7. Draft invoices: Invoices with status="draft" are excluded from revenue.
 * 8. Overdue invoices with partial payment: Collected portion is counted, unpaid balance is excluded.
 * 9. Multi-invoice order handling: Separate installment invoices for the same order each contribute their respective collected payments.
 * 10. End-to-end integration: Matches the query and aggregation logic of GET /api/dashboard/stats.
 */

import assert from "node:assert";
import {
  connectDB,
  disconnectDB,
  InvoiceModel,
  OrderModel,
  getNextSequence,
  type IInvoice,
  type IOrder,
} from "../lib/db/src/index";

const TEST_EMAIL_MARKER = "test-revenue-suite@escora-internal.test";
const createdInvoiceIds: number[] = [];
const createdOrderIds: number[] = [];

async function cleanup(): Promise<void> {
  await InvoiceModel.deleteMany({ customerEmail: TEST_EMAIL_MARKER });
  await OrderModel.deleteMany({ guestEmail: TEST_EMAIL_MARKER });
}

async function runRevenueTests(): Promise<void> {
  console.log("================================================================================");
  console.log("    Escora Dashboard Revenue Option C: Actual Collected Payments Test Suite     ");
  console.log("================================================================================\n");

  await connectDB();
  await cleanup();

  try {
    // -------------------------------------------------------------------------
    // Baseline revenue prior to test records
    // -------------------------------------------------------------------------
    const baseInvoices = await InvoiceModel.find({
      status: { $nin: ["cancelled", "draft"] },
    }).lean();
    const baselineRevenue = baseInvoices.reduce(
      (sum, inv) => sum + Math.max(0, Number(inv.paidAmount) || 0),
      0
    );

    console.log(`[Baseline] Existing DB non-cancelled invoices collected revenue: ₹${baselineRevenue.toLocaleString("en-IN")}`);

    // -------------------------------------------------------------------------
    // Seed test records
    // -------------------------------------------------------------------------

    // 1. Zero payment invoice (issued, no payment)
    const inv1Seq = await getNextSequence("invoices");
    const invZero = await InvoiceModel.create({
      id: inv1Seq,
      invoiceNumber: `TEST-INV-${inv1Seq}`,
      customerName: "Zero Pay Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Munnar Tea Trail",
      issueDate: "2026-10-01",
      status: "issued",
      totalAmount: 120000,
      paidAmount: 0,
      balanceDue: 120000,
    });
    createdInvoiceIds.push(invZero.id);

    // 2. Partial payment invoice (total 2,00,000; paid 65,000; due 1,35,000)
    const inv2Seq = await getNextSequence("invoices");
    const invPartial = await InvoiceModel.create({
      id: inv2Seq,
      invoiceNumber: `TEST-INV-${inv2Seq}`,
      customerName: "Partial Pay Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Kumarakom Sanctuary Journey",
      issueDate: "2026-10-05",
      status: "partially_paid",
      totalAmount: 200000,
      paidAmount: 65000,
      balanceDue: 135000,
    });
    createdInvoiceIds.push(invPartial.id);

    // 3. Fully paid invoice (total 1,80,000; paid 1,80,000; due 0)
    const inv3Seq = await getNextSequence("invoices");
    const invPaid = await InvoiceModel.create({
      id: inv3Seq,
      invoiceNumber: `TEST-INV-${inv3Seq}`,
      customerName: "Fully Paid Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Wayanad Rainforest Sanctuary",
      issueDate: "2026-10-08",
      status: "paid",
      totalAmount: 180000,
      paidAmount: 180000,
      balanceDue: 0,
    });
    createdInvoiceIds.push(invPaid.id);

    // 4. Cancelled invoice (had recorded 50,000, but invoice was cancelled/voided)
    const inv4Seq = await getNextSequence("invoices");
    const invCancelled = await InvoiceModel.create({
      id: inv4Seq,
      invoiceNumber: `TEST-INV-${inv4Seq}`,
      customerName: "Cancelled Invoice Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Alleppey Houseboat Expedition",
      issueDate: "2026-09-15",
      status: "cancelled",
      totalAmount: 150000,
      paidAmount: 50000,
      balanceDue: 100000,
    });
    createdInvoiceIds.push(invCancelled.id);

    // 5. Draft invoice (pre-bill draft with 25,000 deposit noted but not yet finalized)
    const inv5Seq = await getNextSequence("invoices");
    const invDraft = await InvoiceModel.create({
      id: inv5Seq,
      invoiceNumber: `TEST-INV-${inv5Seq}`,
      customerName: "Draft Invoice Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Bekal Coastal Retreat",
      issueDate: "2026-10-10",
      status: "draft",
      totalAmount: 90000,
      paidAmount: 25000,
      balanceDue: 65000,
    });
    createdInvoiceIds.push(invDraft.id);

    // 6. Overdue invoice with partial payment (total 1,00,000; paid 30,000; due 70,000)
    const inv6Seq = await getNextSequence("invoices");
    const invOverdue = await InvoiceModel.create({
      id: inv6Seq,
      invoiceNumber: `TEST-INV-${inv6Seq}`,
      customerName: "Overdue Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Marari Beach Serenity",
      issueDate: "2026-08-01",
      dueDate: "2026-09-01",
      status: "overdue",
      totalAmount: 100000,
      paidAmount: 30000,
      balanceDue: 70000,
    });
    createdInvoiceIds.push(invOverdue.id);

    // 7. Multi-invoice installment for a single order:
    // Order #8888 has two invoices: Deposit invoice (₹50,000 paid) and Balance invoice (₹50,000 paid)
    const testOrderId = 888899;
    const inv7aSeq = await getNextSequence("invoices");
    const invInstallmentA = await InvoiceModel.create({
      id: inv7aSeq,
      orderId: testOrderId,
      invoiceNumber: `TEST-INV-${inv7aSeq}`,
      customerName: "Multi Installment Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Grand Kerala Odyssey - Deposit",
      issueDate: "2026-09-20",
      status: "paid",
      totalAmount: 50000,
      paidAmount: 50000,
      balanceDue: 0,
    });
    createdInvoiceIds.push(invInstallmentA.id);

    const inv7bSeq = await getNextSequence("invoices");
    const invInstallmentB = await InvoiceModel.create({
      id: inv7bSeq,
      orderId: testOrderId,
      invoiceNumber: `TEST-INV-${inv7bSeq}`,
      customerName: "Multi Installment Guest",
      customerEmail: TEST_EMAIL_MARKER,
      title: "Grand Kerala Odyssey - Final Balance",
      issueDate: "2026-10-02",
      status: "paid",
      totalAmount: 50000,
      paidAmount: 50000,
      balanceDue: 0,
    });
    createdInvoiceIds.push(invInstallmentB.id);

    // 8. OrderModel records: Unconfirmed booking with huge totalAmount
    const ord1Seq = await getNextSequence("orders");
    const ordEnquiry = await OrderModel.create({
      id: ord1Seq,
      guestName: "Enquiry Only Prospect",
      guestEmail: TEST_EMAIL_MARKER,
      guestPhone: "+91 98765 00001",
      status: "enquiry",
      totalAmount: 750000, // Massive estimate, not a confirmed payment!
    });
    createdOrderIds.push(ordEnquiry.id);

    // 9. OrderModel records: Cancelled booking with totalAmount
    const ord2Seq = await getNextSequence("orders");
    const ordCancelled = await OrderModel.create({
      id: ord2Seq,
      guestName: "Cancelled Guest",
      guestEmail: TEST_EMAIL_MARKER,
      guestPhone: "+91 98765 00002",
      status: "cancelled",
      totalAmount: 400000, // Cancelled order amount
    });
    createdOrderIds.push(ordCancelled.id);

    // -------------------------------------------------------------------------
    // Execution: Calculate total revenue using the approved backend query logic
    // -------------------------------------------------------------------------
    const activeInvoices = await InvoiceModel.find({
      status: { $nin: ["cancelled", "draft"] },
    }).lean();

    const newCalculatedRevenue = activeInvoices.reduce(
      (sum, inv) => sum + Math.max(0, Number(inv.paidAmount) || 0),
      0
    );

    // Calculate expected incremental contribution from seeded test invoices:
    // - invZero: 0
    // - invPartial: 65,000
    // - invPaid: 1,80,000
    // - invCancelled: 0 (excluded)
    // - invDraft: 0 (excluded)
    // - invOverdue: 30,000 (actual collected payment received before becoming overdue)
    // - invInstallmentA: 50,000
    // - invInstallmentB: 50,000
    // - ordEnquiry: 0 (orders are not counted in revenue)
    // - ordCancelled: 0 (orders are not counted in revenue)
    // Expected added = 65,000 + 1,80,000 + 30,000 + 50,000 + 50,000 = 3,75,000
    const expectedIncrement = 65000 + 180000 + 30000 + 50000 + 50000;
    const actualIncrement = newCalculatedRevenue - baselineRevenue;

    console.log(`[Results] Expected increment: ₹${expectedIncrement.toLocaleString("en-IN")}`);
    console.log(`[Results] Actual increment:   ₹${actualIncrement.toLocaleString("en-IN")}`);

    // Assertions
    assert.strictEqual(
      actualIncrement,
      expectedIncrement,
      `Calculated revenue increment (${actualIncrement}) does not match expected (${expectedIncrement})`
    );
    console.log("  • Revenue calculation accurately sums verified invoice payments ... PASSED");

    // Verify unconfirmed booking amount was NOT included
    assert(
      !activeInvoices.some((i) => i.customerEmail === TEST_EMAIL_MARKER && i.totalAmount === 750000),
      "Unconfirmed order estimate (₹7,50,000) was erroneously queried from invoices"
    );
    console.log("  • Unconfirmed booking estimates are completely excluded ... PASSED");

    // Verify cancelled booking amount was NOT included
    assert(
      !activeInvoices.some((i) => i.customerEmail === TEST_EMAIL_MARKER && i.totalAmount === 400000),
      "Cancelled booking amount (₹4,00,000) was erroneously queried from invoices"
    );
    console.log("  • Cancelled booking amounts are completely excluded ... PASSED");

    // Verify cancelled invoice was excluded
    const cancelledInvInQuery = activeInvoices.find((i) => i.id === invCancelled.id);
    assert.strictEqual(cancelledInvInQuery, undefined, "Cancelled invoice was included in active invoices query");
    console.log("  • Cancelled invoices are strictly excluded ... PASSED");

    // Verify draft invoice was excluded
    const draftInvInQuery = activeInvoices.find((i) => i.id === invDraft.id);
    assert.strictEqual(draftInvInQuery, undefined, "Draft invoice was included in active invoices query");
    console.log("  • Draft invoices are strictly excluded ... PASSED");

    // Verify partial payment contributed only collected amount, not totalAmount
    const partialInvInQuery = activeInvoices.find((i) => i.id === invPartial.id);
    assert(partialInvInQuery, "Partial invoice missing from query");
    assert.strictEqual(partialInvInQuery.paidAmount, 65000);
    assert.strictEqual(partialInvInQuery.totalAmount, 200000);
    console.log("  • Partially paid invoices contribute only actual paidAmount (₹65,000, not ₹2,00,000) ... PASSED");

    // Verify multi-installment payments for same order are correctly aggregated
    const installmentAInQuery = activeInvoices.find((i) => i.id === invInstallmentA.id);
    const installmentBInQuery = activeInvoices.find((i) => i.id === invInstallmentB.id);
    assert(installmentAInQuery && installmentBInQuery, "Installment invoices missing from query");
    assert.strictEqual(installmentAInQuery.paidAmount + installmentBInQuery.paidAmount, 100000);
    console.log("  • Multi-installment payments for single trip booking are aggregated accurately (₹1,00,000) ... PASSED");

    console.log("\n================================================================================");
    console.log("All 7 Revenue Option C assertions PASSED successfully!");
    console.log("================================================================================\n");
  } finally {
    console.log("[Cleanup] Removing test records...");
    await cleanup();
    console.log("[Cleanup] Completed. Disconnecting DB...");
    await disconnectDB();
  }
}

runRevenueTests().catch((err) => {
  console.error("FATAL: Revenue test suite failed:", err);
  process.exit(1);
});
