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
  taxRate?: number;
  taxType?: "percentage" | "fixed";
  taxInclusive?: boolean;
  taxLabel?: string;
  showTaxes?: boolean;
  total: number;
  notes?: string;
}

export interface ItineraryTripIncludes {
  hotel: boolean;
  transport: boolean;
  sightseeing: boolean;
  transfer: boolean;
  weAlsoProvide?: string[];
}

export const DEFAULT_WE_ALSO_PROVIDE_OPTIONS = [
  "Private Guide",
  "Photographer/ Videographer",
  "Flight Tickets",
] as const;

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

export const PLACEHOLDER_INCLUSIONS: string[] = [
  "Daily gourmet breakfast at all hotels and resorts",
  "Private dedicated chauffeur-driven AC vehicle for entire tour",
  "All fuel charges, toll taxes, parking fees, and driver allowances",
  "Handpicked luxury hotel and resort stays as per itinerary",
  "All inter-destination transfers and sightseeing excursions as outlined",
  "Exclusive private backwater houseboat day cruise with onboard meals",
  "Traditional non-alcoholic welcome drink upon arrival at resorts",
  "Guided spice plantation walk & local village cultural experiences",
  "24/7 dedicated local concierge and on-ground trip assistance",
  "All applicable luxury hotel taxes and resort service charges",
  "Complimentary high-speed Wi-Fi access at all accommodations",
  "Kathakali classical dance and martial arts cultural show",
];

export const PLACEHOLDER_EXCLUSIONS: string[] = [
  "Any item of personal nature like tips, laundry, telephone calls etc.",
  "Any other sightseeing other than those mentioned in the inclusions section.",
  "Any fee for video or camera permit.",
  "Domestic or international airfares and train tickets",
  "Meals and beverages not explicitly mentioned in the package inclusions",
  "Optional adventure activities, water sports, jeep safaris, and boating fees",
  "Personal travel insurance, luggage, and medical expenses",
  "Early check-in and late check-out charges at hotels",
  "Monument entrance fees, museum tickets, and local guide charges",
  "Expenses caused by factors beyond control like weather, flight delays, or natural calamities",
  "Vehicle usage beyond standard hours or outside agreed tour route",
  "Peak season, festive, or Gala dinner surcharges where applicable",
];

export const DEFAULT_AGENCY_CONTACT = {
  phone: "+91 9400280420",
  email: "info@escoraholidays.com",
  instagram: "escoraholidays",
  website: "www.escoraholidays.com",
  emergencyContacts: "+91 9400280420 | +91 8157003344",
  curatorName: "Midhilaj Chelakkal",
  curatorPhone: "+91 9745585813",
};

export const emptyPricing: ItineraryPricing = { items: [], total: 0 };

export function computePricingTotal(
  pricing: Pick<ItineraryPricing, "items"> & Partial<Pick<ItineraryPricing, "discount" | "taxes" | "taxRate" | "taxType" | "taxInclusive" | "showTaxes">>
): number {
  const subtotal = (pricing.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  if (!pricing.showTaxes) return subtotal;
  let taxAmount = 0;
  if (pricing.taxType === "fixed") {
    taxAmount = Number(pricing.taxes) || 0;
  } else {
    const rate = Number(pricing.taxRate ?? 5);
    taxAmount = pricing.taxInclusive
      ? Math.round(subtotal - subtotal / (1 + rate / 100))
      : Math.round((subtotal * rate) / 100);
  }
  return pricing.taxInclusive ? subtotal : subtotal + taxAmount;
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
  const parsed = safeParse<ItineraryPricing>(str, emptyPricing);
  if (!parsed || typeof parsed !== "object") return emptyPricing;
  return {
    items: Array.isArray(parsed.items) ? parsed.items.filter((item) => item && typeof item === "object") : [],
    discount: typeof parsed.discount === "number" ? parsed.discount : undefined,
    taxes: typeof parsed.taxes === "number" ? parsed.taxes : undefined,
    taxRate: typeof parsed.taxRate === "number" ? parsed.taxRate : undefined,
    taxType: parsed.taxType === "fixed" ? "fixed" : "percentage",
    taxInclusive: Boolean(parsed.taxInclusive),
    taxLabel: parsed.taxLabel || undefined,
    showTaxes: Boolean(parsed.showTaxes || (typeof parsed.taxes === "number" && parsed.taxes > 0)),
    total: Number(parsed.total) || 0,
    notes: parsed.notes || undefined,
  };
}

export function parseStringList(str: string | null | undefined): string[] {
  return safeParse(str, []);
}

export function parseTripIncludes(str: string | null | undefined): ItineraryTripIncludes {
  const parsed = safeParse<Partial<ItineraryTripIncludes>>(str, DEFAULT_TRIP_INCLUDES);
  if (!parsed || typeof parsed !== "object") return DEFAULT_TRIP_INCLUDES;
  return {
    hotel: parsed.hotel ?? true,
    transport: parsed.transport ?? true,
    sightseeing: parsed.sightseeing ?? true,
    transfer: parsed.transfer ?? true,
    weAlsoProvide: Array.isArray(parsed.weAlsoProvide)
      ? parsed.weAlsoProvide.map((s) => String(s || "").trim()).filter(Boolean)
      : [],
  };
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
