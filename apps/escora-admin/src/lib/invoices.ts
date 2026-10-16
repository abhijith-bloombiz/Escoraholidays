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
  taxRate: number; // e.g. 5 for 5%
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentTerms?: string | null;
  bankDetails?: string | InvoiceBankDetails | null;
  notes?: string | null;
  terms?: string | null;
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

export const DEFAULT_NOTES = "Thank you for choosing Escora Holidays for your curated luxury journey. We look forward to hosting an unforgettable escape.";

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
  return safeParse<InvoiceItem[]>(val, []);
}

export function parseInvoiceBankDetails(val: string | InvoiceBankDetails | null | undefined): InvoiceBankDetails {
  if (val && typeof val === "object" && !Array.isArray(val)) return val as InvoiceBankDetails;
  if (typeof val === "string") return safeParse<InvoiceBankDetails>(val, DEFAULT_BANK_DETAILS);
  return DEFAULT_BANK_DETAILS;
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

export function calculateInvoiceTotals(params: {
  items: InvoiceItem[];
  discount: number;
  discountType: string;
  taxRate: number;
  paidAmount: number;
}) {
  const subtotal = params.items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.rate || 0)), 0);
  
  let discountAmount = 0;
  if (params.discountType === "percentage") {
    discountAmount = (subtotal * (Number(params.discount) || 0)) / 100;
  } else {
    discountAmount = Number(params.discount) || 0;
  }
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(params.taxRate) || 0)) / 100;
  const totalAmount = Math.round(taxableAmount + taxAmount);
  const paidAmount = Number(params.paidAmount) || 0;
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
    paidAmount,
    balanceDue,
  };
}

export function numberToIndianWords(num: number): string {
  if (!num || num === 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
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

  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let rem = Math.floor(num);

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertGroup(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertGroup(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertGroup(thousand)} Thousand`);
  if (rem > 0) parts.push(convertGroup(rem));

  return `Indian Rupees ${parts.join(" ")} Only`;
}
