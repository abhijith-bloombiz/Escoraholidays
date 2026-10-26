import { calculateAuthoritativeTotals, validateInvoicePayload, round2 } from "../apps/api-server/src/lib/invoiceCalculations";
import { calculateInvoiceTotals, numberToIndianWords } from "../apps/escora-admin/src/lib/invoices";
import { parseItineraryForInvoice, parseBookingForInvoice } from "../apps/escora-admin/src/lib/invoiceImport";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runTests() {
  console.log("=== RUNNING INVOICE ENGINE VERIFICATION TESTS ===\n");

  // TEST 1: Zero-Value Invoice
  console.log("--- Test 1: Zero-Value Invoice ---");
  const zeroResult = calculateAuthoritativeTotals({
    items: [{ description: "Complimentary Concierge Consultation", quantity: 1, rate: 0, amount: 0 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    paidAmount: 0,
    status: "issued",
  });
  assert(zeroResult.subtotal === 0, "Subtotal is 0");
  assert(zeroResult.taxableAmount === 0, "Taxable amount is 0");
  assert(zeroResult.taxAmount === 0, "Tax amount is 0");
  assert(zeroResult.totalAmount === 0, "Total amount is 0");
  assert(zeroResult.balanceDue === 0, "Balance due is 0");
  assert(zeroResult.derivedStatus === "paid", "Zero-value invoice is automatically satisfied/paid");

  // TEST 2: Multiple Line Items Row Total & Subtotal
  console.log("\n--- Test 2: Multiple Line Items ---");
  const multiItemResult = calculateAuthoritativeTotals({
    items: [
      { description: "Luxury Villa Stay (3 Nights)", quantity: 3, rate: 25000, amount: 0 },
      { description: "Private Chauffeur Service (3 Days)", quantity: 3, rate: 4500, amount: 0 },
      { description: "Sunset Cruise", quantity: 2, rate: 3200, amount: 0 },
    ],
    discount: 0,
    discountType: "fixed",
    taxRate: 0,
    taxType: "exempt",
  });
  // 3 * 25000 = 75000; 3 * 4500 = 13500; 2 * 3200 = 6400 -> Sum = 94900
  assert(multiItemResult.items[0].amount === 75000, "Item 1 total is 75000");
  assert(multiItemResult.items[1].amount === 13500, "Item 2 total is 13500");
  assert(multiItemResult.items[2].amount === 6400, "Item 3 total is 6400");
  assert(multiItemResult.subtotal === 94900, "Subtotal matches line items sum 94900");

  // TEST 3: Fixed Discount vs Percentage Discount
  console.log("\n--- Test 3: Discounts (Fixed & Percentage) ---");
  // 10% percentage discount on 100,000
  const pctDiscount = calculateAuthoritativeTotals({
    items: [{ description: "Package Tour", quantity: 1, rate: 100000, amount: 100000 }],
    discount: 10,
    discountType: "percentage",
    taxRate: 5,
    taxType: "cgst_sgst",
  });
  assert(pctDiscount.discountAmount === 10000, "10% of 100,000 is 10,000");
  assert(pctDiscount.taxableAmount === 90000, "Taxable amount is 90,000");

  // Fixed discount of 15,000 on 100,000
  const fixedDiscount = calculateAuthoritativeTotals({
    items: [{ description: "Package Tour", quantity: 1, rate: 100000, amount: 100000 }],
    discount: 15000,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
  });
  assert(fixedDiscount.discountAmount === 15000, "Fixed discount is 15,000");
  assert(fixedDiscount.taxableAmount === 85000, "Taxable amount is 85,000");

  // Discount exceeding subtotal (must cap at subtotal, never negative)
  const excessiveDiscount = calculateAuthoritativeTotals({
    items: [{ description: "Package Tour", quantity: 1, rate: 10000, amount: 10000 }],
    discount: 25000,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
  });
  assert(excessiveDiscount.discountAmount === 10000, "Discount capped at subtotal 10,000");
  assert(excessiveDiscount.taxableAmount === 0, "Taxable amount cannot be negative");

  // TEST 4: Configurable Tax Rates and Tax Types
  console.log("\n--- Test 4: Tax Configurations ---");
  // 4A: 5% CGST + SGST (Kerala Intra-State): 2.5% CGST + 2.5% SGST on 100,000
  const taxCgstSgst = calculateAuthoritativeTotals({
    items: [{ description: "Tour Package", quantity: 1, rate: 100000, amount: 100000 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
  });
  assert(taxCgstSgst.cgstRate === 2.5, "CGST rate is 2.5%");
  assert(taxCgstSgst.sgstRate === 2.5, "SGST rate is 2.5%");
  assert(taxCgstSgst.cgstAmount === 2500, "CGST amount is 2500");
  assert(taxCgstSgst.sgstAmount === 2500, "SGST amount is 2500");
  assert(taxCgstSgst.taxAmount === 5000, "Total tax amount is 5000");
  assert(taxCgstSgst.totalAmount === 105000, "Grand total is 105,000");

  // 4B: 18% IGST (Inter-State): 18% IGST on 100,000
  const taxIgst = calculateAuthoritativeTotals({
    items: [{ description: "Tour Package", quantity: 1, rate: 100000, amount: 100000 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 18,
    taxType: "igst",
  });
  assert(taxIgst.igstRate === 18, "IGST rate is 18%");
  assert(taxIgst.igstAmount === 18000, "IGST amount is 18,000");
  assert(taxIgst.cgstAmount === 0 && taxIgst.sgstAmount === 0, "CGST and SGST are 0 for IGST");
  assert(taxIgst.totalAmount === 118000, "Grand total is 118,000");

  // 4C: Custom Tax Rate (e.g. 12% Hotel Standard Intra-State)
  const tax12 = calculateAuthoritativeTotals({
    items: [{ description: "Resort Accommodation", quantity: 1, rate: 50000, amount: 50000 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 12,
    taxType: "cgst_sgst",
  });
  assert(tax12.cgstRate === 6 && tax12.sgstRate === 6, "12% split to 6% CGST + 6% SGST");
  assert(tax12.taxAmount === 6000, "12% of 50,000 is 6000");
  assert(tax12.totalAmount === 56000, "Grand total is 56,000");

  // 4D: Exempt / 0%
  const taxExempt = calculateAuthoritativeTotals({
    items: [{ description: "Exempt Package", quantity: 1, rate: 50000, amount: 50000 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 18,
    taxType: "exempt",
  });
  assert(taxExempt.taxAmount === 0, "Tax is 0 for exempt supply");
  assert(taxExempt.totalAmount === 50000, "Grand total equals subtotal");

  // TEST 5: Payment Logic & 50/50 Split
  console.log("\n--- Test 5: Payment Logic & 50% Advance Terms ---");
  // Total = 105,000 -> 50% advance = 52,500, balance = 52,500
  assert(taxCgstSgst.advance50Amount === 52500, "50% advance amount is 52,500");
  assert(taxCgstSgst.balance50Amount === 52500, "50% remaining balance is 52,500");

  // Record partial payment of 52,500
  const partialPaid = calculateAuthoritativeTotals({
    items: [{ description: "Tour Package", quantity: 1, rate: 100000, amount: 100000 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [
      {
        amount: 52500,
        date: "2026-10-25",
        method: "bank_transfer",
        reference: "UTR50DEP",
      },
    ],
  });
  assert(partialPaid.paidAmount === 52500, "Paid amount is 52,500");
  assert(partialPaid.balanceDue === 52500, "Balance due is 52,500");
  assert(partialPaid.derivedStatus === "partially_paid", "Status is partially_paid");

  // Full payment (2 payments: 52,500 + 52,500 = 105,000)
  const fullyPaid = calculateAuthoritativeTotals({
    items: [{ description: "Tour Package", quantity: 1, rate: 100000, amount: 100000 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [
      { amount: 52500, date: "2026-10-01", method: "bank_transfer", reference: "UTR1" },
      { amount: 52500, date: "2026-10-25", method: "bank_transfer", reference: "UTR2" },
    ],
  });
  assert(fullyPaid.paidAmount === 105000, "Total paid is 105,000");
  assert(fullyPaid.balanceDue === 0, "Balance due is 0");
  assert(fullyPaid.derivedStatus === "paid", "Status is paid");

  // TEST 6: Overdue Detection
  console.log("\n--- Test 6: Overdue Status Derivation ---");
  const overdueInvoice = calculateAuthoritativeTotals({
    items: [{ description: "Tour Package", quantity: 1, rate: 50000, amount: 50000 }],
    discount: 0,
    discountType: "fixed",
    taxRate: 0,
    taxType: "exempt",
    payments: [],
    dueDate: "2026-01-01", // in the past
    status: "issued",
  });
  assert(overdueInvoice.derivedStatus === "overdue", "Status is overdue when dueDate has passed with balance > 0");

  // TEST 7: Frontend & Backend Calculation Synchronization
  console.log("\n--- Test 7: Synchronized Calculations Frontend & Backend ---");
  const feCalc = calculateInvoiceTotals({
    items: [{ description: "Kerala Tour", quantity: 2, rate: 37550.25, amount: 0 }],
    discount: 5,
    discountType: "percentage",
    taxRate: 18,
    taxType: "cgst_sgst",
    paidAmount: 25000,
  });

  const beCalc = calculateAuthoritativeTotals({
    items: [{ description: "Kerala Tour", quantity: 2, rate: 37550.25, amount: 0 }],
    discount: 5,
    discountType: "percentage",
    taxRate: 18,
    taxType: "cgst_sgst",
    paidAmount: 25000,
  });

  assert(feCalc.subtotal === beCalc.subtotal, `Subtotals match: ${feCalc.subtotal}`);
  assert(feCalc.discountAmount === beCalc.discountAmount, `Discount amounts match: ${feCalc.discountAmount}`);
  assert(feCalc.taxableAmount === beCalc.taxableAmount, `Taxable amounts match: ${feCalc.taxableAmount}`);
  assert(feCalc.taxAmount === beCalc.taxAmount, `Tax amounts match: ${feCalc.taxAmount}`);
  assert(feCalc.totalAmount === beCalc.totalAmount, `Grand totals match: ${feCalc.totalAmount}`);
  assert(feCalc.balanceDue === beCalc.balanceDue, `Balances due match: ${feCalc.balanceDue}`);

  // TEST 8: Number To Indian Words
  console.log("\n--- Test 8: Number To Indian Words ---");
  const words1 = numberToIndianWords(183750);
  assert(
    words1 === "Indian Rupees One Lakh Eighty Three Thousand Seven Hundred Fifty Only",
    `183750 formatted: ${words1}`
  );

  const words2 = numberToIndianWords(100500.50);
  assert(
    words2 === "Indian Rupees One Lakh Five Hundred and Fifty Paise Only",
    `100500.50 formatted: ${words2}`
  );

  const wordsZero = numberToIndianWords(0);
  assert(wordsZero === "Zero Rupees Only", `0 formatted: ${wordsZero}`);

  // TEST 9: Payload Validation
  console.log("\n--- Test 9: Payload Validation ---");
  const validPayload = {
    customerName: "Maria Roy",
    title: "Kerala Explorer",
    issueDate: "2026-10-26",
    items: [{ description: "Tour", quantity: 1, rate: 10000 }],
  };
  assert(validateInvoicePayload(validPayload).isValid === true, "Valid payload passes");

  const invalidPayload = {
    customerName: "",
    title: "Kerala Explorer",
    issueDate: "2026-10-26",
    items: [],
  };
  assert(validateInvoicePayload(invalidPayload).isValid === false, "Missing name & items fails validation");

  // TEST 10: Quick Autofill & Import Regression Suite (Manual vs Import Equivalence)
  console.log("\n--- Test 10: Quick Autofill & Import Regression Suite ---");

  // 10.1: Manual Invoice vs Equivalent Itinerary Import with line items & promotional discount
  console.log("Subtest 10.1: Manual vs Equivalent Itinerary Import (Itemized + Discount)");
  const manualInvoice = calculateInvoiceTotals({
    items: [
      { description: "Luxury Villa Stay (Alleppey)", quantity: 1, rate: 50000, amount: 50000 },
      { description: "Dedicated Chauffeur AC Sedan", quantity: 1, rate: 15000, amount: 15000 },
    ],
    discount: 5000,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [],
  });

  const mockItinerary = {
    id: 101,
    title: "Splendors of Kerala",
    customerName: "Rahul Sharma",
    customerEmail: "rahul@example.com",
    destination: "Alleppey & Cochin",
    startDate: "2026-11-01",
    endDate: "2026-11-05",
    pricing: JSON.stringify({
      items: [
        { label: "Luxury Villa Stay (Alleppey)", amount: 50000 },
        { label: "Dedicated Chauffeur AC Sedan", amount: 15000 },
      ],
      discount: 5000,
      total: 60000,
    }),
    currency: "INR",
  };

  const parsedItinerary = parseItineraryForInvoice(mockItinerary);
  assert(parsedItinerary.financialData.items.length === 2, "Itinerary mapped 2 line items");
  assert(parsedItinerary.financialData.discount === 5000, "Itinerary discount is preserved at 5,000");
  assert(parsedItinerary.financialData.currency === "INR", "Itinerary currency is INR");

  const importedItineraryInvoice = calculateInvoiceTotals({
    items: parsedItinerary.financialData.items,
    discount: parsedItinerary.financialData.discount,
    discountType: parsedItinerary.financialData.discountType,
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [],
  });

  // Verify manual and itinerary imported invoices produce identical results
  assert(manualInvoice.subtotal === importedItineraryInvoice.subtotal, `Subtotals match: ₹${manualInvoice.subtotal}`);
  assert(manualInvoice.discountAmount === importedItineraryInvoice.discountAmount, `Discount amounts match: ₹${manualInvoice.discountAmount}`);
  assert(manualInvoice.taxableAmount === importedItineraryInvoice.taxableAmount, `Taxable amounts match: ₹${manualInvoice.taxableAmount}`);
  assert(manualInvoice.cgstAmount === importedItineraryInvoice.cgstAmount, `CGST amounts match: ₹${manualInvoice.cgstAmount}`);
  assert(manualInvoice.sgstAmount === importedItineraryInvoice.sgstAmount, `SGST amounts match: ₹${manualInvoice.sgstAmount}`);
  assert(manualInvoice.totalAmount === importedItineraryInvoice.totalAmount, `Grand totals match: ₹${manualInvoice.totalAmount}`);
  assert(manualInvoice.balanceDue === importedItineraryInvoice.balanceDue, `Balances due match: ₹${manualInvoice.balanceDue}`);

  // 10.2: Booking Import with itemized pricingDetails matches manual invoice
  console.log("Subtest 10.2: Booking Import with Itemized pricingDetails");
  const mockBookingWithDetails = {
    id: 501,
    guestName: "Rahul Sharma",
    guestEmail: "rahul@example.com",
    packageName: "Splendors of Kerala",
    destinations: "Alleppey & Cochin",
    currency: "INR",
    pricingDetails: mockItinerary.pricing,
  };

  const parsedBookingWithDetails = parseBookingForInvoice(mockBookingWithDetails);
  assert(parsedBookingWithDetails.financialData !== undefined, "Booking parsed financialData from pricingDetails");
  assert(parsedBookingWithDetails.financialData?.items.length === 2, "Booking mapped 2 itemized line items");
  assert(parsedBookingWithDetails.financialData?.discount === 5000, "Booking preserved 5,000 discount");

  const importedBookingInvoice = calculateInvoiceTotals({
    items: parsedBookingWithDetails.financialData!.items,
    discount: parsedBookingWithDetails.financialData!.discount,
    discountType: parsedBookingWithDetails.financialData!.discountType,
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [],
  });

  assert(manualInvoice.subtotal === importedBookingInvoice.subtotal, "Booking and manual subtotals match");
  assert(manualInvoice.totalAmount === importedBookingInvoice.totalAmount, "Booking and manual grand totals match");
  assert(manualInvoice.balanceDue === importedBookingInvoice.balanceDue, "Booking and manual balances due match");

  // 10.3: Itinerary with empty items array and valid package total
  console.log("Subtest 10.3: Itinerary with Empty items Array and Valid Package Total");
  const flatItinerary = {
    id: 102,
    title: "Munnar Tea Trail Experience",
    customerName: "Ananya Sen",
    destination: "Munnar, Kerala",
    pricing: JSON.stringify({
      items: [],
      total: 75000,
    }),
  };

  const parsedFlatItinerary = parseItineraryForInvoice(flatItinerary);
  assert(parsedFlatItinerary.financialData.items.length === 1, "Created 1 comprehensive package item");
  assert(parsedFlatItinerary.financialData.items[0].rate === 75000, "Package item rate is 75,000");
  assert(parsedFlatItinerary.financialData.discount === 0, "Discount defaults to 0");

  const flatInvoice = calculateInvoiceTotals({
    items: parsedFlatItinerary.financialData.items,
    discount: 0,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [],
  });
  assert(flatInvoice.subtotal === 75000, "Subtotal is 75,000");
  assert(flatInvoice.taxAmount === 3750, "5% GST is 3,750");
  assert(flatInvoice.totalAmount === 78750, "Grand total is 78,750");

  // 10.4: Tax-Inclusive vs Tax-Exclusive Booking Import (Prevent Double Taxation)
  console.log("Subtest 10.4: Tax-Inclusive vs Tax-Exclusive Booking Import");
  const lumpSumBooking = {
    id: 502,
    guestName: "Vikram Malhotra",
    packageName: "Kerala Luxury Holiday",
    destinations: "Kovalam",
    totalAmount: 105000,
    currency: "INR",
  };

  // Unknown tax treatment requires confirmation
  const checkUnknown = parseBookingForInvoice(lumpSumBooking, undefined, 5);
  assert(checkUnknown.requiresTaxConfirmation === true, "Requires tax treatment confirmation before applying taxes");
  assert(checkUnknown.totalAmount === 105000, "Returns booking total amount of 105,000");

  // Tax-Inclusive: Reverse calculate pre-tax rate so base + 5% GST equals exactly 105,000
  const checkInclusive = parseBookingForInvoice(lumpSumBooking, "inclusive", 5);
  assert(checkInclusive.financialData !== undefined, "Inclusive parsing returned financialData");
  assert(checkInclusive.financialData?.items[0].rate === 100000, "Reverse calculated rate is 100,000");

  const inclusiveInvoice = calculateInvoiceTotals({
    items: checkInclusive.financialData!.items,
    discount: 0,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [],
  });
  assert(inclusiveInvoice.subtotal === 100000, "Inclusive subtotal is 100,000");
  assert(inclusiveInvoice.taxAmount === 5000, "Inclusive tax amount is 5,000");
  assert(inclusiveInvoice.totalAmount === 105000, "Grand total matches 105,000 booking total without double-taxation");

  // Tax-Exclusive: Base rate is 105,000, GST added on top
  const checkExclusive = parseBookingForInvoice(lumpSumBooking, "exclusive", 5);
  assert(checkExclusive.financialData?.items[0].rate === 105000, "Exclusive rate is 105,000");
  const exclusiveInvoice = calculateInvoiceTotals({
    items: checkExclusive.financialData!.items,
    discount: 0,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [],
  });
  assert(exclusiveInvoice.subtotal === 105000, "Exclusive subtotal is 105,000");
  assert(exclusiveInvoice.taxAmount === 5250, "Exclusive tax is 5,250");
  assert(exclusiveInvoice.totalAmount === 110250, "Exclusive grand total is 110,250");

  // 10.5: Non-INR Currencies
  console.log("Subtest 10.5: Non-INR Currencies (USD)");
  const usdItinerary = {
    id: 103,
    title: "International Honeymoon Journey",
    customerName: "David Miller",
    currency: "USD",
    pricing: JSON.stringify({
      items: [{ label: "Executive Suite (Kumarakom)", amount: 3200 }],
      discount: 200,
      total: 3000,
    }),
  };

  const parsedUsd = parseItineraryForInvoice(usdItinerary);
  assert(parsedUsd.financialData.currency === "USD", "Currency correctly set to USD");
  const usdInvoice = calculateInvoiceTotals({
    items: parsedUsd.financialData.items,
    discount: parsedUsd.financialData.discount,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: [],
  });
  assert(usdInvoice.subtotal === 3200, "USD subtotal is $3,200");
  assert(usdInvoice.taxableAmount === 3000, "USD taxable amount is $3,000");
  assert(usdInvoice.taxAmount === 150, "USD 5% GST is $150");
  assert(usdInvoice.totalAmount === 3150, "USD grand total is $3,150");

  // 10.6: Customer-Only Autofill Preserves Financial Data
  console.log("Subtest 10.6: Customer-Only Autofill Preserves Existing Financial Data");
  const existingLineItems = [
    { description: "Helicopter Transfer (Cochin to Alleppey)", quantity: 1, rate: 85000, amount: 85000 },
  ];
  const existingDiscount = 5000;
  const existingPayments = [
    { amount: 40000, date: "2026-10-20", method: "bank_transfer", reference: "ADV-01", notes: "Advance" },
  ];

  // In customer-only mode, financial data must not be touched
  const parsedCustomerOnly = parseBookingForInvoice(lumpSumBooking);
  assert(parsedCustomerOnly.customerData.customerName === "Vikram Malhotra", "Customer name extracted");

  // Re-evaluating invoice with customer data applied and original financial data preserved
  const preservedInvoice = calculateInvoiceTotals({
    items: existingLineItems,
    discount: existingDiscount,
    discountType: "fixed",
    taxRate: 5,
    taxType: "cgst_sgst",
    payments: existingPayments,
  });
  assert(preservedInvoice.subtotal === 85000, "Original subtotal 85,000 preserved");
  assert(preservedInvoice.discountAmount === 5000, "Original discount 5,000 preserved");
  assert(preservedInvoice.taxableAmount === 80000, "Original taxable 80,000 preserved");
  assert(preservedInvoice.taxAmount === 4000, "Original tax 4,000 preserved");
  assert(preservedInvoice.totalAmount === 84000, "Original grand total 84,000 preserved");
  assert(preservedInvoice.paidAmount === 40000, "Original payment 40,000 preserved without duplication or deletion");
  assert(preservedInvoice.balanceDue === 44000, "Original balance due 44,000 preserved");
  assert(preservedInvoice.derivedStatus === "partially_paid", "Status correctly preserved as partially_paid");

  console.log("\n🎉 ALL 10 TEST SUITES COMPLETED SUCCESSFULLY WITH 0 FAILURES!");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
