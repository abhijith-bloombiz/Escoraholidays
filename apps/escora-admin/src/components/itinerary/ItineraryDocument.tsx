import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  parseTripIncludes,
  parseTransportation,
  type ItineraryDay,
  type ItineraryStay,
  type ItineraryPricing,
  type ItineraryTripIncludes,
  type ItineraryTransportation,
} from "@/lib/itinerary";
import ItineraryPrintDocument, { type ItineraryPrintData } from "./ItineraryPrintDocument";

export interface ItineraryDocumentData {
  title: string;
  customerName: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImageUrl?: string | null;
  summary?: string | null;
  days: string | ItineraryDay[];
  stays: string | ItineraryStay[];
  inclusions?: string | string[] | null;
  exclusions?: string | string[] | null;
  pricing: string | ItineraryPricing;
  currency: string;
  shareToken?: string;
  referenceNumber?: string | null;
  curatorName?: string | null;
  curatorPhone?: string | null;
  emergencyContacts?: string | null;
  createdDate?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  tripIncludes?: string | ItineraryTripIncludes | null;
  transportation?: string | ItineraryTransportation | null;
  hotelTerms?: string | string[] | null;
  paymentTerms?: string | string[] | null;
  importantInfo?: string | string[] | null;
}

export default function ItineraryDocument({ data, id }: { data: ItineraryDocumentData; id?: string }) {
  const days = typeof data.days === "string" ? parseDays(data.days) : data.days;
  const stays = typeof data.stays === "string" ? parseStays(data.stays) : data.stays;
  const pricing = typeof data.pricing === "string" ? parsePricing(data.pricing) : data.pricing;
  const inclusions = Array.isArray(data.inclusions) ? data.inclusions : parseStringList(data.inclusions);
  const exclusions = Array.isArray(data.exclusions) ? data.exclusions : parseStringList(data.exclusions);
  const tripIncludes = typeof data.tripIncludes === "string" ? parseTripIncludes(data.tripIncludes) : data.tripIncludes;
  const transportation = typeof data.transportation === "string" ? parseTransportation(data.transportation) : data.transportation;
  const hotelTerms = Array.isArray(data.hotelTerms) ? data.hotelTerms : parseStringList(data.hotelTerms);
  const paymentTerms = Array.isArray(data.paymentTerms) ? data.paymentTerms : parseStringList(data.paymentTerms);
  const importantInfo = Array.isArray(data.importantInfo) ? data.importantInfo : parseStringList(data.importantInfo);

  const printData: ItineraryPrintData = {
    title: data.title,
    customerName: data.customerName,
    destination: data.destination,
    startDate: data.startDate,
    endDate: data.endDate,
    coverImageUrl: data.coverImageUrl,
    summary: data.summary,
    days,
    stays,
    inclusions,
    exclusions,
    pricing,
    currency: data.currency,
    shareToken: data.shareToken || "preview",
    referenceNumber: data.referenceNumber,
    curatorName: data.curatorName,
    curatorPhone: data.curatorPhone,
    emergencyContacts: data.emergencyContacts,
    createdDate: data.createdDate,
    adults: data.adults,
    children: data.children,
    infants: data.infants,
    tripIncludes,
    weAlsoProvide: tripIncludes?.weAlsoProvide,
    agencyPhone: tripIncludes?.agencyContact?.phone,
    agencyEmail: tripIncludes?.agencyContact?.email,
    agencyInstagram: tripIncludes?.agencyContact?.instagram,
    agencyFacebook: tripIncludes?.agencyContact?.facebook,
    agencyWebsite: tripIncludes?.agencyContact?.website,
    transportation,
    hotelTerms: hotelTerms.length > 0 ? hotelTerms : undefined,
    paymentTerms: paymentTerms.length > 0 ? paymentTerms : undefined,
    importantInfo: importantInfo.length > 0 ? importantInfo : undefined,
  };

  return <ItineraryPrintDocument data={printData} id={id} />;
}
