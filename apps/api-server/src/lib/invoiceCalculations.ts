import type {
  IInvoiceItem,
  IInvoicePayment,
  IInvoiceAuditEntry,
} from "@workspace/db";

export function round2(num: number): number {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
}

export function safeParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  if (typeof str !== "string") return str as unknown as T;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function parseInvoiceItems(val: string | IInvoiceItem[] | null | undefined): IInvoiceItem[] {
  if (Array.isArray(val)) {
    return val.map((it) => ({
      description: String(it.description || "").trim(),
      hsnSac: it.hsnSac?.trim() || "998555",
      quantity: Math.max(0, Number(it.quantity) || 1),
      rate: Math.max(0, Number(it.rate) || 0),
      amount: round2((Math.max(0, Number(it.quantity) || 1)) * (Math.max(0, Number(it.rate) || 0))),
    }));
  }
  const parsed = safeParse<IInvoiceItem[]>(val, []);
  return parsed.map((it) => ({
    description: String(it.description || "").trim(),
    hsnSac: it.hsnSac?.trim() || "998555",
    quantity: Math.max(0, Number(it.quantity) || 1),
    rate: Math.max(0, Number(it.rate) || 0),
    amount: round2((Math.max(0, Number(it.quantity) || 1)) * (Math.max(0, Number(it.rate) || 0))),
  }));
}

export function parseInvoicePayments(
  val: string | IInvoicePayment[] | null | undefined
): IInvoicePayment[] {
  if (Array.isArray(val)) return val;
  return safeParse<IInvoicePayment[]>(val, []);
}

export function parseInvoiceAuditTrail(
  val: string | IInvoiceAuditEntry[] | null | undefined
): IInvoiceAuditEntry[] {
  if (Array.isArray(val)) return val;
  return safeParse<IInvoiceAuditEntry[]>(val, []);
}

export interface CalculationParams {
  items: IInvoiceItem[] | string;
  discount: number;
  discountType: "fixed" | "percentage" | string;
  taxRate: number;
  taxType?: "cgst_sgst" | "igst" | "exempt" | "none" | string;
  paidAmount?: number;
  payments?: IInvoicePayment[] | string;
  dueDate?: string | null;
  status?: string;
}

export interface CalculatedInvoiceTotals {
  items: IInvoiceItem[];
  itemsJson: string;
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
  payments: IInvoicePayment[];
  paymentsJson: string;
  advance50Amount: number;
  balance50Amount: number;
  derivedStatus: string;
}

/**
 * Authoritative backend calculations for invoices.
 * Never trust client totals; recalculate line item rows, discounts, tax, totals, and balances.
 */
export function calculateAuthoritativeTotals(params: CalculationParams): CalculatedInvoiceTotals {
  // 1. Process items
  const items = parseInvoiceItems(params.items);

  // 2. Subtotal = sum of quantity * rate
  const subtotal = round2(items.reduce((sum, item) => sum + item.amount, 0));

  // 3. Discount calculation & validation (cannot be negative or exceed subtotal)
  const rawDiscount = Math.max(0, Number(params.discount) || 0);
  let discountAmount = 0;
  if (params.discountType === "percentage") {
    discountAmount = round2((subtotal * rawDiscount) / 100);
  } else {
    discountAmount = round2(rawDiscount);
  }
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  // 4. Taxable amount
  const taxableAmount = round2(Math.max(0, subtotal - discountAmount));

  // 5. Taxes (support configurable tax rate and tax types: CGST+SGST or IGST or exempt)
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
      // Default: Intra-state Kerala (CGST + SGST split 50/50)
      cgstRate = round2(taxRate / 2);
      sgstRate = round2(taxRate / 2);
      cgstAmount = round2((taxableAmount * cgstRate) / 100);
      sgstAmount = round2((taxableAmount * sgstRate) / 100);
      taxAmount = round2(cgstAmount + sgstAmount);
    }
  }

  // 6. Grand total (standard nearest Rupee integer)
  const totalAmount = Math.round(round2(taxableAmount + taxAmount));

  // 7. Payments & Balance Due
  const payments = parseInvoicePayments(params.payments);
  let calculatedPaid = 0;
  if (payments.length > 0) {
    calculatedPaid = round2(
      payments.reduce((sum, p) => sum + Math.max(0, Number(p.amount) || 0), 0)
    );
  } else if (params.paidAmount !== undefined) {
    calculatedPaid = round2(Math.max(0, Number(params.paidAmount) || 0));
  }
  const paidAmount = Math.max(0, calculatedPaid);
  const balanceDue = Math.max(0, round2(totalAmount - paidAmount));

  // 8. 50% Advance / 50% Balance Breakdown
  const advance50Amount = Math.round(totalAmount * 0.5);
  const balance50Amount = Math.max(0, totalAmount - advance50Amount);

  // 9. Payment Status Derivation
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
    const today = new Date().toISOString().slice(0, 10);
    if (params.dueDate && params.dueDate < today && balanceDue > 0) {
      derivedStatus = "overdue";
    } else {
      derivedStatus = "issued";
    }
  }

  return {
    items,
    itemsJson: JSON.stringify(items),
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
    payments,
    paymentsJson: JSON.stringify(payments),
    advance50Amount,
    balance50Amount,
    derivedStatus,
  };
}

export function validateInvoicePayload(body: any): { isValid: boolean; error?: string } {
  if (!body.customerName || typeof body.customerName !== "string" || !body.customerName.trim()) {
    return { isValid: false, error: "Customer name is required" };
  }
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return { isValid: false, error: "Invoice title / package name is required" };
  }
  if (!body.issueDate || typeof body.issueDate !== "string" || !body.issueDate.trim()) {
    return { isValid: false, error: "Valid date of issue is required" };
  }

  const items = parseInvoiceItems(body.items);
  if (items.length === 0) {
    return { isValid: false, error: "At least one line item is required" };
  }

  for (let i = 0; i < items.length; i++) {
    if (!items[i].description.trim()) {
      return { isValid: false, error: `Item #${i + 1} must have a description` };
    }
    if (items[i].quantity < 0) {
      return { isValid: false, error: `Item #${i + 1} quantity cannot be negative` };
    }
    if (items[i].rate < 0) {
      return { isValid: false, error: `Item #${i + 1} unit rate cannot be negative` };
    }
  }

  if (body.discount !== undefined && Number(body.discount) < 0) {
    return { isValid: false, error: "Discount amount cannot be negative" };
  }
  if (body.taxRate !== undefined && (Number(body.taxRate) < 0 || Number(body.taxRate) > 100)) {
    return { isValid: false, error: "Tax rate must be between 0% and 100%" };
  }

  return { isValid: true };
}
