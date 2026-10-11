export interface ItineraryActivity {
  time?: string;
  title: string;
  description?: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  activities: ItineraryActivity[];
}

export interface ItineraryStay {
  name: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  roomType?: string;
  notes?: string;
}

export interface ItineraryPriceItem {
  label: string;
  amount: number;
}

export interface ItineraryPricing {
  items: ItineraryPriceItem[];
  discount?: number;
  taxes?: number;
  total: number;
  notes?: string;
}

export const emptyPricing: ItineraryPricing = { items: [], total: 0 };

export function computePricingTotal(pricing: Pick<ItineraryPricing, "items" | "discount" | "taxes">): number {
  const subtotal = pricing.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return Math.max(0, subtotal - (Number(pricing.discount) || 0) + (Number(pricing.taxes) || 0));
}

function safeParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function parseDays(str: string | null | undefined): ItineraryDay[] {
  return safeParse(str, []);
}

export function parseStays(str: string | null | undefined): ItineraryStay[] {
  return safeParse(str, []);
}

export function parsePricing(str: string | null | undefined): ItineraryPricing {
  return safeParse(str, emptyPricing);
}

export function parseStringList(str: string | null | undefined): string[] {
  return safeParse(str, []);
}

export function formatMoney(amount: number, currency: string): string {
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN")}`;
  return `${currency} ${amount.toLocaleString()}`;
}
