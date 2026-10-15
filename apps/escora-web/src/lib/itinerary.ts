export interface ItineraryActivity {
  time?: string;
  title: string;
  description?: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  subtitle?: string;
  description?: string;
  optionalActivities?: string[] | string;
  meals?: string;
  stay?: string;
  imageUrl?: string;
  imageUrls?: string[];
  activities?: ItineraryActivity[];
}

export interface ItineraryStay {
  name: string;
  location?: string;
  starRating?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  rooms?: number;
  mealPlan?: string;
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

export interface ItineraryTripIncludes {
  hotel: boolean;
  transport: boolean;
  sightseeing: boolean;
  transfer: boolean;
}

export interface ItineraryTransportation {
  origin: string;
  destination: string;
  vehicleType?: string;
  description?: string;
}

export const DEFAULT_TRIP_INCLUDES: ItineraryTripIncludes = {
  hotel: true,
  transport: true,
  sightseeing: true,
  transfer: true,
};

export const DEFAULT_HOTEL_TERMS: string[] = [
  "Children below 12 years are considered children, while those 12 and above are considered adults.",
  "Some hotels may require a security deposit, either in cash or credit card.",
  "Local taxes are to be paid directly to the hotel by the guest.",
  "Early check-in and late check-out are subject to availability and may incur additional charges.",
  "Third persons in triple rooms may be accommodated on rollaway beds or sofa beds.",
];

export const DEFAULT_PAYMENT_TERMS: string[] = [
  "Any payment delays may lead to the cancellation of the booking, as per the cancellation policy.",
  "Payments can be made via bank transfer, credit card, or other accepted methods as specified by the agency.",
];

export const DEFAULT_IMPORTANT_INFO: string[] = [
  "Make sure you have enough blank pages for visa stamps.",
  "Ensure your travel insurance covers medical emergencies, trip cancellations, and loss of belongings.",
  "Carry a copy of your travel insurance policy.",
  "Carry an additional government-issued ID (e.g., Aadhar card, driving license).",
  "Some countries may require proof of COVID-19 vaccination.",
];

export const DEFAULT_EXCLUSIONS: string[] = [
  "Any item of personal nature like tips, laundry, telephone calls etc.",
  "Any other sightseeing other than those mentioned in the inclusions section.",
  "Any fee for video or camera permit.",
];

export const DEFAULT_AGENCY_CONTACT = {
  phone: "9496933336",
  email: "mc@escoraholidays.com",
  instagram: "escora_holidays",
  website: "http://www.escoraholidays.com",
  emergencyContacts: "+91 9400280420 | +91 8157003344",
  curatorName: "Midhilaj Chelakkal",
  curatorPhone: "+91 9745585813",
};

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
  const parsed = safeParse<any[]>(str, []);
  return parsed.map((d, i) => {
    const dayNum = Number(d.day) || i + 1;
    const images: string[] = [];
    if (Array.isArray(d.imageUrls)) {
      images.push(...d.imageUrls.filter(Boolean));
    }
    if (d.imageUrl && !images.includes(d.imageUrl)) {
      images.unshift(d.imageUrl);
    }
    return {
      day: dayNum,
      date: d.date,
      title: d.title || `Day ${dayNum}`,
      subtitle: d.subtitle,
      description: d.description,
      optionalActivities: d.optionalActivities,
      meals: d.meals,
      stay: d.stay,
      imageUrl: images[0] || d.imageUrl,
      imageUrls: images.length > 0 ? images : undefined,
      activities: Array.isArray(d.activities) ? d.activities : [],
    };
  });
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

export function parseTripIncludes(str: string | null | undefined): ItineraryTripIncludes {
  return safeParse(str, DEFAULT_TRIP_INCLUDES);
}

export function parseTransportation(str: string | null | undefined): ItineraryTransportation | null {
  return safeParse(str, null);
}

export function formatMoney(amount: number, currency: string): string {
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN")}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatDate(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDayDateHeader(dayNum: number, dateStr?: string | null): string {
  if (!dateStr) return `Day ${dayNum}`;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return `Day ${dayNum} | ${dateStr}`;
  const weekday = d.toLocaleDateString("en-IN", { weekday: "long" });
  const day = d.toLocaleDateString("en-IN", { day: "numeric" });
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  const year = d.toLocaleDateString("en-IN", { year: "numeric" });
  return `Day ${dayNum} | ${weekday} | ${day} ${month} ${year}`;
}
