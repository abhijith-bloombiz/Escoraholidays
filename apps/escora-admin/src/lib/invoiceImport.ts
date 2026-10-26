import type { InvoiceItem } from "./invoices";

export interface ImportedCustomerData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerGstin?: string;
  destination: string;
  title: string;
  travelDates: string;
  guestCount: number;
  orderId?: number | null;
  itineraryId?: number | null;
}

export interface ImportedFinancialData {
  items: InvoiceItem[];
  discount: number;
  discountType: "fixed" | "percentage";
  currency: string;
}

export interface ItineraryImportResult {
  customerData: ImportedCustomerData;
  financialData: ImportedFinancialData;
}

export interface BookingImportResult {
  customerData: ImportedCustomerData;
  financialData?: ImportedFinancialData;
  requiresTaxConfirmation?: boolean;
  totalAmount?: number;
  sourceCurrency?: string;
}

/**
 * Parses an itinerary object into standardized customer and financial data.
 * Correctly extracts line items, promotional discounts, currency, and handles flat-rate package totals.
 */
export function parseItineraryForInvoice(it: any): ItineraryImportResult {
  const customerName = (it?.customerName || "").trim();
  const customerEmail = (it?.customerEmail || "").trim();
  const customerPhone = (it?.customerPhone || "").trim();
  const destination = (it?.destination || "").trim();
  const title = (it?.title || "Custom Itinerary").trim();

  let travelDates = "";
  if (it?.startDate || it?.endDate) {
    travelDates = `${it?.startDate || ""} – ${it?.endDate || ""}`.trim();
  }

  const guestCount = Number(it?.guestCount) || (it?.adults ? Number(it?.adults) + (Number(it?.children) || 0) : 2);
  const currency = String(it?.currency || "INR").toUpperCase();

  let pricingObj: any = null;
  if (it?.pricing) {
    try {
      pricingObj = typeof it.pricing === "string" ? JSON.parse(it.pricing) : it.pricing;
    } catch {
      pricingObj = null;
    }
  }

  let items: InvoiceItem[] = [];

  // Case 1: Itemized services in itinerary pricing
  if (pricingObj?.items && Array.isArray(pricingObj.items) && pricingObj.items.length > 0) {
    items = pricingObj.items.map((p: any) => ({
      description: String(p.label || "Curated Service Experience").trim(),
      hsnSac: "998555",
      quantity: 1,
      rate: Math.max(0, Number(p.amount) || 0),
      amount: Math.max(0, Number(p.amount) || 0),
    }));
  }
  // Case 2: Package total with empty or omitted items array
  else if (pricingObj?.total && Number(pricingObj.total) > 0) {
    const pkgTotal = Number(pricingObj.total);
    items = [
      {
        description: `${title} — Comprehensive Tour Package (${destination || "Kerala, India"})`,
        hsnSac: "998555",
        quantity: 1,
        rate: pkgTotal,
        amount: pkgTotal,
      },
    ];
  }
  // Case 3: Fallback empty line item
  else {
    items = [
      {
        description: `${title} — Tour Package`,
        hsnSac: "998555",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ];
  }

  // Extract promotional discount
  const discount = Math.max(0, Number(pricingObj?.discount) || 0);

  return {
    customerData: {
      itineraryId: it?.id || null,
      customerName,
      customerEmail,
      customerPhone,
      destination,
      title,
      travelDates,
      guestCount,
    },
    financialData: {
      items,
      discount,
      discountType: "fixed",
      currency,
    },
  };
}

/**
 * Parses a booking/order object into standardized customer and financial data.
 * Inspects order.pricingDetails for itemized services & discounts.
 * When only a lump-sum order.totalAmount exists, checks taxOption to prevent double-taxation.
 */
export function parseBookingForInvoice(
  order: any,
  taxOption?: "inclusive" | "exclusive",
  currentTaxRate: number = 5
): BookingImportResult {
  const customerName = (order?.guestName || "").trim();
  const customerEmail = (order?.guestEmail || "").trim();
  const customerPhone = (order?.guestPhone || "").trim();
  const destination = (order?.destinations || "").trim();
  const title = (order?.packageName || "Curated Journey Package").trim();

  let travelDates = "";
  if (order?.travelDate) {
    travelDates = `${order.travelDate}${order.departureDate ? ` – ${order.departureDate}` : ""}`.trim();
  }
  const guestCount = Number(order?.guestCount) || 2;
  const currency = String(order?.currency || "INR").toUpperCase();

  const customerData: ImportedCustomerData = {
    orderId: order?.id || null,
    customerName,
    customerEmail,
    customerPhone,
    destination,
    title,
    travelDates,
    guestCount,
  };

  // 1. Check if order has itemized pricingDetails
  let pricingDetailsObj: any = null;
  if (order?.pricingDetails) {
    try {
      pricingDetailsObj =
        typeof order.pricingDetails === "string"
          ? JSON.parse(order.pricingDetails)
          : order.pricingDetails;
    } catch {
      pricingDetailsObj = null;
    }
  }

  if (
    pricingDetailsObj?.items &&
    Array.isArray(pricingDetailsObj.items) &&
    pricingDetailsObj.items.length > 0
  ) {
    const items: InvoiceItem[] = pricingDetailsObj.items.map((p: any) => ({
      description: String(p.label || "Curated Journey Experience").trim(),
      hsnSac: "998555",
      quantity: 1,
      rate: Math.max(0, Number(p.amount) || 0),
      amount: Math.max(0, Number(p.amount) || 0),
    }));

    const discount = Math.max(0, Number(pricingDetailsObj.discount) || 0);

    return {
      customerData,
      financialData: {
        items,
        discount,
        discountType: "fixed",
        currency,
      },
    };
  }

  // 2. If no itemized pricing, check lump-sum totalAmount
  const totalAmount = Number(order?.totalAmount) || 0;
  if (totalAmount <= 0) {
    return {
      customerData,
    };
  }

  // If tax treatment is unknown, require confirmation instead of guessing
  if (!taxOption) {
    return {
      customerData,
      requiresTaxConfirmation: true,
      totalAmount,
      sourceCurrency: currency,
    };
  }

  let rate = totalAmount;
  if (taxOption === "inclusive" && currentTaxRate > 0) {
    // Reverse-calculate pre-tax rate: rate + (rate * currentTaxRate / 100) = totalAmount
    rate = Math.round((totalAmount / (1 + currentTaxRate / 100)) * 100) / 100;
  }

  const items: InvoiceItem[] = [
    {
      description: `${title} - ${destination || "Kerala, India"}`,
      hsnSac: "998555",
      quantity: 1,
      rate,
      amount: rate,
    },
  ];

  return {
    customerData,
    financialData: {
      items,
      discount: 0,
      discountType: "fixed",
      currency,
    },
  };
}
