export interface InvoiceItem {
  description: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch?: string;
  upiId?: string;
}

export interface InvoicePayment {
  id?: string;
  amount: number;
  date: string;
  method: "bank_transfer" | "upi" | "credit_card" | "cash" | "cheque" | "other" | string;
  reference?: string;
  notes?: string;
  recordedAt?: string;
}

export interface InvoiceAuditEntry {
  timestamp: string;
  action: string;
  user?: string;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface InvoiceData {
  id: number;
  invoiceNumber: string;
  orderId?: number | null;
  itineraryId?: number | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerGstin?: string | null;
  title: string;
  destination?: string | null;
  travelDates?: string | null;
  guestCount?: number | null;
  issueDate: string;
  dueDate?: string | null;
  status: "draft" | "issued" | "paid" | "partially_paid" | "overdue" | "cancelled" | string;
  currency: string;
  items: string | InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: "fixed" | "percentage" | string;
  taxType: "cgst_sgst" | "igst" | "exempt" | "none" | string;
  taxRate: number; // percentage e.g. 5, 12, 18, 28 or custom
  taxableAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  payments?: string | InvoicePayment[];
  paymentTerms?: string | null;
  bankDetails?: string | InvoiceBankDetails | null;
  notes?: string | null;
  terms?: string | null;
  auditTrail?: string | InvoiceAuditEntry[];
  revision?: number;
  cancellationReason?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_BANK_DETAILS: InvoiceBankDetails = {
  bankName: "HDFC Bank Ltd.",
  accountName: "ESCORA HOLIDAYS PRIVATE LIMITED",
  accountNumber: "50200088992211",
  ifsc: "HDFC0000123",
  branch: "Mavoor Road, Kozhikode, Kerala",
  upiId: "escoraholidays@okhdfcbank",
};

export const DEFAULT_TERMS = [
  "50% advance payment required to confirm journey and luxury reservations.",
  "Remaining 50% balance to be settled 15 days prior to arrival.",
  "Package includes private transfers, curated accommodations & specified experiences as outlined.",
  "Standard cancellation policy applies as detailed in the booking confirmation voucher.",
  "All dispute resolutions are subject to the exclusive jurisdiction of courts in Kozhikode, Kerala.",
].join("\n");

export const DEFAULT_NOTES =
  "Thank you for choosing Escora Holidays for your curated luxury journey. We look forward to hosting an unforgettable escape.";

// Legal Tax Advisory Note for admin reference
export const GST_ADVISORY_NOTE =
  "Tour operator services generally attract 5% GST without Input Tax Credit (ITC) under SAC 998555. Standalone accommodation or transportation services may attract 12% or 18% with ITC. Place of supply determines CGST+SGST (Kerala Intra-State) vs IGST (Inter-State). Please confirm specific tax treatments with your chartered accountant.";

export function round2(num: number): number {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
}

function safeParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  if (typeof str !== "string") return str as unknown as T;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function parseInvoiceItems(val: string | InvoiceItem[] | null | undefined): InvoiceItem[] {
  if (Array.isArray(val)) return val;
  const parsed = safeParse<InvoiceItem[]>(val, []);
  return parsed.map((item) => ({
    ...item,
    quantity: Math.max(0, Number(item.quantity) || 1),
    rate: Math.max(0, Number(item.rate) || 0),
    amount: round2((Math.max(0, Number(item.quantity) || 1)) * (Math.max(0, Number(item.rate) || 0))),
  }));
}

export function parseInvoiceBankDetails(val: string | InvoiceBankDetails | null | undefined): InvoiceBankDetails {
  if (val && typeof val === "object" && !Array.isArray(val)) return val as InvoiceBankDetails;
  if (typeof val === "string") return safeParse<InvoiceBankDetails>(val, DEFAULT_BANK_DETAILS);
  return DEFAULT_BANK_DETAILS;
}

export function parseInvoicePayments(val: string | InvoicePayment[] | null | undefined): InvoicePayment[] {
  if (Array.isArray(val)) return val;
  return safeParse<InvoicePayment[]>(val, []);
}

export function parseInvoiceAuditTrail(val: string | InvoiceAuditEntry[] | null | undefined): InvoiceAuditEntry[] {
  if (Array.isArray(val)) return val;
  return safeParse<InvoiceAuditEntry[]>(val, []);
}

export function formatMoney(amount: number, currency = "INR"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (currency === "INR") {
    return `₹${safe.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${safe.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export interface CalculationParams {
  items: InvoiceItem[];
  discount: number;
  discountType: "fixed" | "percentage" | string;
  taxRate: number;
  taxType?: "cgst_sgst" | "igst" | "exempt" | "none" | string;
  paidAmount?: number;
  payments?: InvoicePayment[];
  dueDate?: string | null;
  status?: string;
}

export interface CalculatedInvoiceTotals {
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxType: string;
  taxAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  advance50Amount: number;
  balance50Amount: number;
  derivedStatus: string;
}

/**
 * Pure calculation logic matching accountant standards and backend validation.
 */
export function calculateInvoiceTotals(params: CalculationParams): CalculatedInvoiceTotals {
  // 1. Recalculate each item row total
  const items: InvoiceItem[] = (params.items || []).map((it) => {
    const qty = Math.max(0, Number(it.quantity) || 1);
    const rate = Math.max(0, Number(it.rate) || 0);
    const amount = round2(qty * rate);
    return {
      description: it.description || "",
      hsnSac: it.hsnSac?.trim() || "998555",
      quantity: qty,
      rate,
      amount,
    };
  });

  // 2. Subtotal
  const subtotal = round2(items.reduce((sum, item) => sum + item.amount, 0));

  // 3. Discount calculation & validation
  const rawDiscount = Math.max(0, Number(params.discount) || 0);
  let discountAmount = 0;
  if (params.discountType === "percentage") {
    discountAmount = round2((subtotal * rawDiscount) / 100);
  } else {
    discountAmount = round2(rawDiscount);
  }
  // Discount cannot exceed subtotal
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  // 4. Taxable amount
  const taxableAmount = round2(Math.max(0, subtotal - discountAmount));

  // 5. Configurable Tax Rates and Tax Types
  const taxType = (params.taxType || "cgst_sgst").toLowerCase();
  const taxRate = taxType === "exempt" || taxType === "none" ? 0 : Math.max(0, Number(params.taxRate) || 0);

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let taxAmount = 0;

  if (taxRate > 0 && taxableAmount > 0) {
    if (taxType === "igst") {
      igstRate = taxRate;
      igstAmount = round2((taxableAmount * igstRate) / 100);
      taxAmount = igstAmount;
    } else {
      // Default: CGST + SGST (intra-state Kerala)
      cgstRate = round2(taxRate / 2);
      sgstRate = round2(taxRate / 2);
      cgstAmount = round2((taxableAmount * cgstRate) / 100);
      sgstAmount = round2((taxableAmount * sgstRate) / 100);
      taxAmount = round2(cgstAmount + sgstAmount);
    }
  }

  // 6. Grand Total (rounded to nearest integer Rupee, standard Indian commercial convention)
  const totalAmount = Math.round(round2(taxableAmount + taxAmount));

  // 7. Payments & Balance Due
  let calculatedPaid = 0;
  if (params.payments && params.payments.length > 0) {
    calculatedPaid = round2(
      params.payments.reduce((sum, p) => sum + Math.max(0, Number(p.amount) || 0), 0)
    );
  } else if (params.paidAmount !== undefined) {
    calculatedPaid = round2(Math.max(0, Number(params.paidAmount) || 0));
  }
  // Paid amount cannot exceed totalAmount
  const paidAmount = Math.max(0, calculatedPaid);
  const balanceDue = Math.max(0, round2(totalAmount - paidAmount));

  // 8. 50% Advance / 50% Balance Breakdown
  const advance50Amount = Math.round(totalAmount * 0.5);
  const balance50Amount = Math.max(0, totalAmount - advance50Amount);

  // 9. Derive Status
  const explicitStatus = params.status;
  let derivedStatus = explicitStatus || "issued";

  if (explicitStatus === "draft") {
    derivedStatus = "draft";
  } else if (explicitStatus === "cancelled") {
    derivedStatus = "cancelled";
  } else if (totalAmount === 0) {
    derivedStatus = "paid";
  } else if (paidAmount >= totalAmount) {
    derivedStatus = "paid";
  } else if (paidAmount > 0) {
    derivedStatus = "partially_paid";
  } else {
    // Zero paid: check due date
    const today = new Date().toISOString().slice(0, 10);
    if (params.dueDate && params.dueDate < today && balanceDue > 0) {
      derivedStatus = "overdue";
    } else {
      derivedStatus = "issued";
    }
  }

  return {
    items,
    subtotal,
    discountAmount,
    taxableAmount,
    taxRate,
    taxType,
    taxAmount,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
    paidAmount,
    balanceDue,
    advance50Amount,
    balance50Amount,
    derivedStatus,
  };
}

/**
 * Converts numbers into formal Indian Currency Words (Lakhs, Crores, Rupees & Paise).
 */
export function numberToIndianWords(num: number): string {
  const safeNum = Number(num);
  if (!safeNum || Number.isNaN(safeNum) || safeNum === 0) return "Zero Rupees Only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return `${b[Math.floor(n / 10)]}${digit ? ` ${a[digit]}` : ""}`;
  }

  function convertGroup(n: number): string {
    let str = "";
    if (n > 99) {
      str += `${a[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n > 0) {
      str += inWords(n);
    }
    return str.trim();
  }

  const integerPart = Math.floor(Math.abs(safeNum));
  const paisePart = Math.round((Math.abs(safeNum) - integerPart) * 100);

  let n = integerPart;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const rem = n;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertGroup(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertGroup(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertGroup(thousand)} Thousand`);
  if (rem > 0) parts.push(convertGroup(rem));

  const rupeesStr = parts.length > 0 ? parts.join(" ") : "Zero";
  const paiseStr = paisePart > 0 ? ` and ${convertGroup(paisePart)} Paise` : "";

  return `Indian Rupees ${rupeesStr}${paiseStr} Only`;
}
