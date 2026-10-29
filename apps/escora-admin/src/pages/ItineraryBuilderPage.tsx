import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useGetItinerary,
  useCreateItinerary,
  useUpdateItinerary,
  getListItinerariesQueryKey,
  getGetItineraryQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Calendar,
  Sparkles,
  Eye,
  Check,
  X,
  Copy,
  ExternalLink,
  Clock,
  MapPin,
  Building,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  MoveUp,
  MoveDown,
  Layers,
  Loader2,
  RefreshCw,
  CheckCircle2,
  CheckSquare,
  UserCheck,
  Phone,
  User,
  Users,
  Car,
  RotateCcw,
  Download,
  Images,
  Star,
  Pencil,
  Compass,
  Camera,
  FileCheck,
  Plane,
} from "lucide-react";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  parseTripIncludes,
  parseTransportation,
  computePricingTotal,
  DEFAULT_HOTEL_TERMS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_IMPORTANT_INFO,
  DEFAULT_EXCLUSIONS,
  PLACEHOLDER_INCLUSIONS,
  PLACEHOLDER_EXCLUSIONS,
  DEFAULT_TRIP_INCLUDES,
  DEFAULT_AGENCY_CONTACT,
  DEFAULT_WE_ALSO_PROVIDE_OPTIONS,
  generateProposalReferenceNumber,
  sanitizeRichDescriptionHtml,
  type ItineraryDay,
  type ItineraryStay,
  type ItineraryPricing,
} from "@/lib/itinerary";
import ImageUploadField from "@/components/ImageUploadField";
import ItineraryDocument from "@/components/itinerary/ItineraryDocument";
import AiItineraryAssistantModal from "@/components/itinerary/AiItineraryAssistantModal";
import type { ItineraryAiAssistResponse } from "@workspace/api-client-react";

const SHARE_BASE_URL = "https://www.escoraholidays.com";

interface BuilderForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  summary: string;
  currency: string;
  status: string;
  referenceNumber: string;
  curatorName: string;
  curatorPhone: string;
  emergencyContacts: string;
  agencyPhone: string;
  agencyEmail: string;
  agencyInstagram: string;
  agencyFacebook: string;
  agencyWebsite: string;
  adults: number;
  children: number;
  infants: number;
  hotelIncluded: boolean;
  transportIncluded: boolean;
  sightseeingIncluded: boolean;
  transferIncluded: boolean;
  flightsIncluded: boolean;
  weAlsoProvide?: string[];
  transportOrigin: string;
  transportDestination: string;
  transportVehicle: string;
  days: ItineraryDay[];
  stays: ItineraryStay[];
  pricing: ItineraryPricing;
  inclusions: string[];
  exclusions: string[];
  hotelTerms: string[];
  paymentTerms: string[];
  importantInfo: string[];
}

const emptyForm: BuilderForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  coverImageUrl: "",
  summary: "",
  currency: "INR",
  status: "draft",
  referenceNumber: "",
  curatorName: DEFAULT_AGENCY_CONTACT.curatorName,
  curatorPhone: DEFAULT_AGENCY_CONTACT.curatorPhone,
  emergencyContacts: DEFAULT_AGENCY_CONTACT.emergencyContacts,
  agencyPhone: DEFAULT_AGENCY_CONTACT.phone,
  agencyEmail: DEFAULT_AGENCY_CONTACT.email,
  agencyInstagram: DEFAULT_AGENCY_CONTACT.instagram,
  agencyFacebook: DEFAULT_AGENCY_CONTACT.facebook,
  agencyWebsite: DEFAULT_AGENCY_CONTACT.website,
  adults: 1,
  children: 0,
  infants: 0,
  hotelIncluded: true,
  transportIncluded: true,
  sightseeingIncluded: true,
  transferIncluded: true,
  flightsIncluded: true,
  weAlsoProvide: [],
  transportOrigin: "ESCORA HOLIDAYS | Trivandrum, Keralam, India",
  transportDestination: "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
  transportVehicle: "Private Dedicated Chauffeur Driven AC Sedan / SUV",
  days: [],
  stays: [],
  pricing: { items: [], total: 0 },
  inclusions: [],
  exclusions: DEFAULT_EXCLUSIONS,
  hotelTerms: DEFAULT_HOTEL_TERMS,
  paymentTerms: DEFAULT_PAYMENT_TERMS,
  importantInfo: DEFAULT_IMPORTANT_INFO,
};

export default function ItineraryBuilderPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const itineraryId = params.id ? Number(params.id) : undefined;

  const { data: existing, isLoading } = useGetItinerary(itineraryId!, {
    query: {
      enabled: isEdit,
      queryKey: getGetItineraryQueryKey(itineraryId!),
      staleTime: 0,
      refetchOnMount: "always",
    },
  });
  const createMutation = useCreateItinerary();
  const updateMutation = useUpdateItinerary();

  const initialDefaultValues = useMemo<BuilderForm>(
    () => ({
      ...emptyForm,
      referenceNumber: generateProposalReferenceNumber(),
    }),
    []
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { isDirty, dirtyFields },
  } = useForm<BuilderForm>({
    defaultValues: initialDefaultValues,
  });

  const [templateChoice, setTemplateChoice] = useState<"blank" | string | null>(() => {
    if (isEdit) return "blank";
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (
        sp.get("blank") === "true" ||
        sp.get("aiDraft") === "true" ||
        sp.get("fromEnquiry") ||
        sp.get("linkedEnquiryId") ||
        sp.get("enquiryId") ||
        sp.get("ai") === "true"
      ) {
        return "blank";
      }
    }
    return null;
  });
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // AI Assistant modal state (Phase 3B)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiEnquiryId, setAiEnquiryId] = useState<number | undefined>(undefined);
  const [linkedEnquiryId, setLinkedEnquiryId] = useState<number | null>(null);
  const [returnToInboxEnquiryId, setReturnToInboxEnquiryId] = useState<number | null>(null);
  const openedFromUrlAi = useRef(false);
  const hasInitializedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const loadedItineraryVersionRef = useRef<string | null>(null);
  const userHasEditedRef = useRef(false);

  // Clear loaded version cache on itinerary ID change or unmount
  useEffect(() => {
    return () => {
      loadedItineraryVersionRef.current = null;
      userHasEditedRef.current = false;
    };
  }, [itineraryId]);

  // Register controlled contact fields in React Hook Form
  useEffect(() => {
    register("curatorName");
    register("curatorPhone");
    register("emergencyContacts");
    register("agencyPhone");
    register("agencyEmail");
    register("agencyInstagram");
    register("agencyFacebook");
    register("agencyWebsite");
  }, [register]);

  // Fetch official sequential next proposal reference number for new proposals
  const { data: serverNextRef } = useQuery<{ referenceNumber: string }>({
    queryKey: ["itineraries", "next-reference", linkedEnquiryId],
    queryFn: async () => {
      const url = `/api/itineraries/next-reference${linkedEnquiryId ? `?enquiryId=${linkedEnquiryId}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) return res.json();
      throw new Error("Failed to fetch next proposal reference");
    },
    enabled: !isEdit,
    staleTime: 30000,
  });

  // When official server sequential proposal reference arrives, sync it if field hasn't been manually edited
  useEffect(() => {
    if (!isEdit && serverNextRef?.referenceNumber && !dirtyFields.referenceNumber) {
      setValue("referenceNumber", serverNextRef.referenceNumber);
    }
  }, [isEdit, serverNextRef?.referenceNumber, dirtyFields.referenceNumber, setValue]);

  // Collapsible days and stays state
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});
  const [collapsedStays, setCollapsedStays] = useState<Record<number, boolean>>({});

  // Bulk edit modal state for inclusions, exclusions, terms
  const [bulkTermsModal, setBulkTermsModal] = useState<"inclusions" | "exclusions" | "hotelTerms" | "paymentTerms" | "importantInfo" | null>(null);
  const [bulkTermsText, setBulkTermsText] = useState("");

  // Prefilled Common Inclusions & Exclusions Options (Persisted in localStorage)
  const [presetInclusions, setPresetInclusions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("escora_preset_inclusions_list");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load preset inclusions:", e);
    }
    return [...PLACEHOLDER_INCLUSIONS];
  });

  const [presetExclusions, setPresetExclusions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("escora_preset_exclusions_list");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load preset exclusions:", e);
    }
    return [...PLACEHOLDER_EXCLUSIONS];
  });

  const [customServiceInput, setCustomServiceInput] = useState("");

  // Persisted Custom Services List for "We Also Provide" section
  const [customServicesList, setCustomServicesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("escora_custom_services_list");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load custom services list:", e);
    }
    return [];
  });

  // Inline editing state for a single option
  const [inlineEditing, setInlineEditing] = useState<{
    type: "inclusions" | "exclusions";
    index: number;
    text: string;
  } | null>(null);

  // Manage Presets Modal state
  const [managePresetsModal, setManagePresetsModal] = useState<"inclusions" | "exclusions" | null>(null);
  const [modalPresetsList, setModalPresetsList] = useState<string[]>([]);
  const [modalNewItemText, setModalNewItemText] = useState("");
  const [modalBulkText, setModalBulkText] = useState("");
  const [modalTab, setModalTab] = useState<"list" | "bulk">("list");

  const daysArray = useFieldArray({ control, name: "days" });
  const staysArray = useFieldArray({ control, name: "stays" });
  const priceItemsArray = useFieldArray({ control, name: "pricing.items" });

  const watchedPricing = watch("pricing");
  const watchedCurrency = watch("currency");
  const watchedStartDate = watch("startDate");
  const watchedEndDate = watch("endDate");
  const watchedStatus = watch("status");
  const watchedTitle = watch("title");
  const watchedInclusions = watch("inclusions") ?? [];
  const watchedExclusions = watch("exclusions") ?? [];
  const watchedHotelTerms = watch("hotelTerms") ?? [];
  const watchedPaymentTerms = watch("paymentTerms") ?? [];
  const watchedImportantInfo = watch("importantInfo") ?? [];
  const watchedDays = watch("days") ?? [];
  const watchedStays = watch("stays") ?? [];
  const watchedCustomerName = watch("customerName");
  const watchedCustomerEmail = watch("customerEmail");
  const watchedCustomerPhone = watch("customerPhone");
  const watchedDestination = watch("destination");
  const watchedHotelIncluded = watch("hotelIncluded");
  const watchedTransportIncluded = watch("transportIncluded");
  const watchedSightseeingIncluded = watch("sightseeingIncluded");
  const watchedTransferIncluded = watch("transferIncluded");
  const watchedFlightsIncluded = watch("flightsIncluded");
  const watchedWeAlsoProvide = watch("weAlsoProvide") ?? [];
  const watchedAdults = watch("adults") ?? 1;
  const watchedChildren = watch("children") ?? 0;
  const watchedInfants = watch("infants") ?? 0;
  const watchedCuratorName = watch("curatorName") ?? "";
  const watchedCuratorPhone = watch("curatorPhone") ?? "";
  const watchedEmergencyContacts = watch("emergencyContacts") ?? "";
  const watchedAgencyPhone = watch("agencyPhone") ?? "";
  const watchedAgencyEmail = watch("agencyEmail") ?? "";
  const watchedAgencyInstagram = watch("agencyInstagram") ?? "";
  const watchedAgencyFacebook = watch("agencyFacebook") ?? "";
  const watchedAgencyWebsite = watch("agencyWebsite") ?? "";

  // Warn before browser refresh/close if form has unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Load existing itinerary data into form (updates whenever fresh itinerary arrives)
  useEffect(() => {
    if (existing) {
      const dataVersion = `${existing.id}_${existing.updatedAt || ""}`;
      if (loadedItineraryVersionRef.current === dataVersion) return;
      // Only protect if the user has actively made manual edits during this session
      if (loadedItineraryVersionRef.current !== null && userHasEditedRef.current) return;

      loadedItineraryVersionRef.current = dataVersion;
      userHasEditedRef.current = false;
      const tripInc = parseTripIncludes(existing.tripIncludes);
      const transport = parseTransportation(existing.transportation);
      const hTerms = parseStringList(existing.hotelTerms);
      const pTerms = parseStringList(existing.paymentTerms);
      const iInfo = parseStringList(existing.importantInfo);

      const resolvedCuratorName =
        (existing.curatorName !== undefined && existing.curatorName !== null && existing.curatorName !== "")
          ? existing.curatorName
          : (tripInc.agencyContact?.curatorName || DEFAULT_AGENCY_CONTACT.curatorName);
      const resolvedCuratorPhone =
        (existing.curatorPhone !== undefined && existing.curatorPhone !== null && existing.curatorPhone !== "")
          ? existing.curatorPhone
          : (tripInc.agencyContact?.curatorPhone || DEFAULT_AGENCY_CONTACT.curatorPhone);
      const resolvedEmergencyContacts =
        (existing.emergencyContacts !== undefined && existing.emergencyContacts !== null && existing.emergencyContacts !== "")
          ? existing.emergencyContacts
          : (tripInc.agencyContact?.emergencyContacts || DEFAULT_AGENCY_CONTACT.emergencyContacts);

      reset({
        customerName: existing.customerName,
        customerEmail: existing.customerEmail ?? "",
        customerPhone: existing.customerPhone ?? "",
        title: existing.title,
        destination: existing.destination ?? "",
        startDate: existing.startDate ?? "",
        endDate: existing.endDate ?? "",
        coverImageUrl: existing.coverImageUrl ?? "",
        summary: existing.summary ?? "",
        currency: existing.currency,
        status: existing.status,
        referenceNumber:
          existing.referenceNumber?.trim() ||
          generateProposalReferenceNumber({
            enquiryId: (existing as any).enquiryId,
            proposalId: existing.id,
          }),
        curatorName: resolvedCuratorName,
        curatorPhone: resolvedCuratorPhone,
        emergencyContacts: resolvedEmergencyContacts,
        agencyPhone: tripInc.agencyContact?.phone ?? (existing as any).agencyPhone ?? DEFAULT_AGENCY_CONTACT.phone,
        agencyEmail: tripInc.agencyContact?.email ?? (existing as any).agencyEmail ?? DEFAULT_AGENCY_CONTACT.email,
        agencyInstagram: tripInc.agencyContact?.instagram ?? (existing as any).agencyInstagram ?? DEFAULT_AGENCY_CONTACT.instagram,
        agencyFacebook: tripInc.agencyContact?.facebook ?? (existing as any).agencyFacebook ?? DEFAULT_AGENCY_CONTACT.facebook,
        agencyWebsite: tripInc.agencyContact?.website ?? (existing as any).agencyWebsite ?? DEFAULT_AGENCY_CONTACT.website,
        adults: existing.adults ?? 1,
        children: existing.children ?? 0,
        infants: existing.infants ?? 0,
        hotelIncluded: tripInc.hotel,
        transportIncluded: tripInc.transport,
        sightseeingIncluded: tripInc.sightseeing,
        transferIncluded: tripInc.transfer,
        flightsIncluded: tripInc.flights ?? true,
        weAlsoProvide: tripInc.weAlsoProvide ?? [],
        transportOrigin: transport?.origin ?? "ESCORA HOLIDAYS | Trivandrum, Keralam, India",
        transportDestination: transport?.destination ?? "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
        transportVehicle: transport?.vehicleType ?? "Private Dedicated Chauffeur Driven AC Sedan / SUV",
        days: parseDays(existing.days),
        stays: parseStays(existing.stays),
        pricing: parsePricing(existing.pricing),
        inclusions: parseStringList(existing.inclusions),
        exclusions: parseStringList(existing.exclusions).length > 0 ? parseStringList(existing.exclusions) : DEFAULT_EXCLUSIONS,
        hotelTerms: hTerms.length > 0 ? hTerms : DEFAULT_HOTEL_TERMS,
        paymentTerms: pTerms.length > 0 ? pTerms : DEFAULT_PAYMENT_TERMS,
        importantInfo: iInfo.length > 0 ? iInfo : DEFAULT_IMPORTANT_INFO,
      });

      // Merge any custom services saved in this itinerary into customServicesList
      const existingWeAlso = tripInc.weAlsoProvide ?? [];
      const extraServices = existingWeAlso.filter(
        (s) => !DEFAULT_WE_ALSO_PROVIDE_OPTIONS.includes(s as any)
      );
      if (extraServices.length > 0) {
        setCustomServicesList((prev) => Array.from(new Set([...prev, ...extraServices])));
      }
    }
  }, [existing, reset, isDirty]);

  // Handle URL query parameters (e.g. ?ai=true or ?enquiryId=123) and pending AI drafts
  useEffect(() => {
    if (typeof window === "undefined" || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const aiParam = searchParams.get("ai");
    const aiDraftParam = searchParams.get("aiDraft");
    const blankParam = searchParams.get("blank");
    const fromEnqParam = searchParams.get("fromEnquiry");
    const linkedEnqParam = searchParams.get("linkedEnquiryId") || searchParams.get("enquiryId");
    const nameParam = searchParams.get("customerName");
    const emailParam = searchParams.get("customerEmail");
    const phoneParam = searchParams.get("customerPhone");

    // If opened directly from an Inbox inquiry ("Build Manually" or proposal edit from Inbox)
    if (fromEnqParam) {
      const parsedFromId = Number(fromEnqParam);
      if (!Number.isNaN(parsedFromId)) {
        setLinkedEnquiryId(parsedFromId);
        setAiEnquiryId(parsedFromId);
        // Only return to Inbox if initiated directly from Inbox inquiry workflow
        if (aiDraftParam !== "true") {
          setReturnToInboxEnquiryId(parsedFromId);
        }
        if (!isEdit && !dirtyFields.referenceNumber) {
          setValue("referenceNumber", generateProposalReferenceNumber({ enquiryId: parsedFromId }));
        }
      }
    } else if (linkedEnqParam) {
      const parsedLinkedId = Number(linkedEnqParam);
      if (!Number.isNaN(parsedLinkedId)) {
        setLinkedEnquiryId(parsedLinkedId);
        setAiEnquiryId(parsedLinkedId);
        if (!isEdit && !dirtyFields.referenceNumber) {
          setValue("referenceNumber", generateProposalReferenceNumber({ enquiryId: parsedLinkedId }));
        }
      }
    }

    // Check for pending AI draft handed off via sessionStorage
    const pendingDraftStr = sessionStorage.getItem("escoraholidays_pending_ai_draft");
    if (pendingDraftStr) {
      try {
        const parsed = JSON.parse(pendingDraftStr);
        sessionStorage.removeItem("escoraholidays_pending_ai_draft");
        if (parsed?.extra?.enquiryId) {
          setLinkedEnquiryId(parsed.extra.enquiryId);
          setAiEnquiryId(parsed.extra.enquiryId);
        }
        if (parsed?.draft) {
          handleApplyAiDraft(parsed.draft, parsed.extra);
        } else if (parsed) {
          handleApplyAiDraft(parsed);
        }
        return;
      } catch (err) {
        console.error("Failed to parse pending AI draft", err);
      }
    }

    if (nameParam) setValue("customerName", nameParam, { shouldDirty: true });
    if (emailParam) setValue("customerEmail", emailParam, { shouldDirty: true });
    if (phoneParam) setValue("customerPhone", phoneParam, { shouldDirty: true });

    if (blankParam === "true") {
      setTemplateChoice("blank");
    }

    // Only open AI modal on mount if explicitly requested via ?ai=true and not starting blank or with draft
    if (aiParam === "true" && blankParam !== "true" && aiDraftParam !== "true") {
      openedFromUrlAi.current = true;
      setShowAiModal(true);
    }

    if (!isEdit && !aiParam && !aiDraftParam && !blankParam && !fromEnqParam && templateChoice === null) {
      navigate("/itineraries/create", { replace: true });
    }
  }, [setValue, isEdit, templateChoice, navigate]);

  const handleApplyAiDraft = (
    draft: ItineraryAiAssistResponse,
    extra?: { customerName?: string; customerEmail?: string; customerPhone?: string; startDate?: string; enquiryId?: number }
  ) => {
    openedFromUrlAi.current = false;
    setShowAiModal(false);

    if (extra?.enquiryId) {
      setLinkedEnquiryId(extra.enquiryId);
      setAiEnquiryId(extra.enquiryId);
      if (!dirtyFields.referenceNumber) {
        setValue("referenceNumber", generateProposalReferenceNumber({ enquiryId: extra.enquiryId }), { shouldDirty: true });
      }
    }
    if (extra?.customerName) {
      setValue("customerName", extra.customerName, { shouldDirty: true });
    } else if (!getValues("customerName")) {
      setValue("customerName", "Valued Guest", { shouldDirty: true });
    }
    if (extra?.customerEmail) {
      setValue("customerEmail", extra.customerEmail, { shouldDirty: true });
    }
    if (extra?.customerPhone) {
      setValue("customerPhone", extra.customerPhone, { shouldDirty: true });
    }
    if (extra?.startDate) {
      setValue("startDate", extra.startDate, { shouldDirty: true });
    }

    setValue("title", draft.title, { shouldDirty: true });
    setValue("destination", draft.destination, { shouldDirty: true });
    setValue("summary", draft.summary, { shouldDirty: true });
    if (draft.coverImageUrl) {
      setValue("coverImageUrl", draft.coverImageUrl, { shouldDirty: true });
    }

    const start = extra?.startDate ? new Date(extra.startDate) : (watchedStartDate ? new Date(watchedStartDate) : null);
    const formattedDays: ItineraryDay[] = (draft.days || []).map((d, idx) => {
      let dateStr = d.date || "";
      if (!dateStr && start && !Number.isNaN(start.getTime())) {
        const dayDate = new Date(start);
        dayDate.setDate(dayDate.getDate() + idx);
        dateStr = dayDate.toISOString().split("T")[0];
      }
      return {
        day: d.day || idx + 1,
        date: dateStr,
        title: d.title,
        description: d.description || "",
        imageUrl: d.imageUrl || (d.imageUrls && d.imageUrls[0]) || "",
        imageUrls: d.imageUrls && d.imageUrls.length > 0 ? d.imageUrls : (d.imageUrl ? [d.imageUrl] : []),
        activities: (d.activities || []).map((a) => ({
          time: a.time,
          title: a.title,
          description: a.description || "",
        })),
      };
    });
    setValue("days", formattedDays, { shouldDirty: true });

    if (start && !Number.isNaN(start.getTime()) && formattedDays.length > 0 && !getValues("endDate")) {
      const endD = new Date(start);
      endD.setDate(endD.getDate() + formattedDays.length - 1);
      setValue("endDate", endD.toISOString().split("T")[0], { shouldDirty: true });
    }

    const formattedStays: ItineraryStay[] = (draft.stays || []).map((s) => ({
      name: s.name,
      location: s.location || draft.destination,
      checkIn: s.checkIn || "",
      checkOut: s.checkOut || "",
      nights: s.nights || 2,
      roomType: s.roomType || "",
      notes: s.notes || "",
    }));
    setValue("stays", formattedStays, { shouldDirty: true });

    if (draft.inclusions && draft.inclusions.length > 0) {
      setValue("inclusions", draft.inclusions, { shouldDirty: true });
    }
    if (draft.exclusions && draft.exclusions.length > 0) {
      setValue("exclusions", draft.exclusions, { shouldDirty: true });
    }

    setTemplateChoice("ai-draft");
  };



  const handleCloseAiModal = () => {
    setShowAiModal(false);
    if (openedFromUrlAi.current && !isEdit && templateChoice !== "ai-draft") {
      if (returnToInboxEnquiryId) {
        navigate(`/enquiries?viewEnquiry=${returnToInboxEnquiryId}`);
      } else {
        navigate("/itineraries/create");
      }
    }
  };

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
    if (itineraryId) {
      qc.invalidateQueries({ queryKey: getGetItineraryQueryKey(itineraryId) });
    }
  }

  const handleRegenerateReference = () => {
    const enq = linkedEnquiryId || aiEnquiryId || (existing as any)?.enquiryId;
    const newRef = generateProposalReferenceNumber({
      enquiryId: enq,
      proposalId: itineraryId,
    });
    setValue("referenceNumber", newRef, { shouldDirty: true });
    toast({
      title: "Proposal Reference Auto-filled",
      description: `Assigned reference: ${newRef}`,
    });
  };

  const onSubmit = (form: BuilderForm) => {
    if (isSubmittingRef.current || createMutation.isPending || updateMutation.isPending) return;

    // Validate required fields
    if (!form.customerName.trim()) {
      toast({ title: "Customer Name is required", variant: "destructive" });
      scrollToSection("section-details");
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Itinerary Title is required", variant: "destructive" });
      scrollToSection("section-details");
      return;
    }

    const subtotal = (form.pricing.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxRate = Number(form.pricing.taxRate ?? 5);
    const isTaxInclusive = Boolean(form.pricing.taxInclusive);
    const isFixedTax = form.pricing.taxType === "fixed";
    const calculatedTax = form.pricing.showTaxes
      ? isFixedTax
        ? Number(form.pricing.taxes) || 0
        : isTaxInclusive
        ? Math.round(subtotal - subtotal / (1 + taxRate / 100))
        : Math.round((subtotal * taxRate) / 100)
      : 0;
    const total = form.pricing.showTaxes && !isTaxInclusive
      ? subtotal + calculatedTax
      : subtotal;

    const data: any = {
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      customerPhone: form.customerPhone.trim() || undefined,
      title: form.title.trim(),
      destination: form.destination.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      summary: form.summary.trim() || undefined,
      currency: form.currency,
      status: form.status,
      referenceNumber: form.referenceNumber?.trim() || undefined,
      curatorName: form.curatorName !== undefined ? form.curatorName.trim() : (getValues("curatorName")?.trim() || undefined),
      curatorPhone: form.curatorPhone !== undefined ? form.curatorPhone.trim() : (getValues("curatorPhone")?.trim() || undefined),
      emergencyContacts: form.emergencyContacts !== undefined ? form.emergencyContacts.trim() : (getValues("emergencyContacts")?.trim() || undefined),
      adults: form.adults ?? 1,
      children: form.children ?? 0,
      infants: form.infants ?? 0,
      days: JSON.stringify(
        form.days.map((d, i) => {
          const rawImages: string[] = Array.isArray(d.imageUrls)
            ? d.imageUrls
            : d.imageUrl
            ? [d.imageUrl]
            : [];
          const sanitizedImages = rawImages
            .map((s) => String(s || "").trim())
            .filter(Boolean)
            .slice(0, 3);
          return {
            ...d,
            day: i + 1,
            description: d.description ? sanitizeRichDescriptionHtml(d.description) : undefined,
            imageUrl: sanitizedImages[0] || undefined,
            imageUrls: sanitizedImages.length > 0 ? sanitizedImages : undefined,
          };
        })
      ),
      stays: JSON.stringify(form.stays),
      pricing: JSON.stringify({
        ...form.pricing,
        taxes: calculatedTax,
        total,
      }),
      inclusions: JSON.stringify((form.inclusions || []).map((s) => s.trim()).filter(Boolean)),
      exclusions: JSON.stringify((form.exclusions || []).map((s) => s.trim()).filter(Boolean)),
      tripIncludes: JSON.stringify({
        hotel: form.hotelIncluded ?? getValues("hotelIncluded"),
        transport: form.transportIncluded ?? getValues("transportIncluded"),
        sightseeing: form.sightseeingIncluded ?? getValues("sightseeingIncluded"),
        transfer: form.transferIncluded ?? getValues("transferIncluded"),
        flights: form.flightsIncluded ?? getValues("flightsIncluded"),
        weAlsoProvide: (() => {
          const customPending = customServiceInput.trim();
          const currentWeAlso = getValues("weAlsoProvide") || watchedWeAlsoProvide || form.weAlsoProvide || [];
          const combined = Array.isArray(currentWeAlso) ? [...currentWeAlso] : [];
          if (customPending && !combined.includes(customPending)) {
            combined.push(customPending);
          }
          return Array.from(new Set(combined))
            .map((s) => String(s || "").trim())
            .filter((s) => s && s.toLowerCase() !== "flight tickets");
        })(),
        agencyContact: {
          phone: (form.agencyPhone !== undefined && form.agencyPhone !== null ? form.agencyPhone : (getValues("agencyPhone") ?? DEFAULT_AGENCY_CONTACT.phone)).trim(),
          email: (form.agencyEmail !== undefined && form.agencyEmail !== null ? form.agencyEmail : (getValues("agencyEmail") ?? DEFAULT_AGENCY_CONTACT.email)).trim(),
          instagram: (form.agencyInstagram !== undefined && form.agencyInstagram !== null ? form.agencyInstagram : (getValues("agencyInstagram") ?? DEFAULT_AGENCY_CONTACT.instagram)).trim(),
          facebook: (form.agencyFacebook !== undefined && form.agencyFacebook !== null ? form.agencyFacebook : (getValues("agencyFacebook") ?? DEFAULT_AGENCY_CONTACT.facebook)).trim(),
          website: (form.agencyWebsite !== undefined && form.agencyWebsite !== null ? form.agencyWebsite : (getValues("agencyWebsite") ?? DEFAULT_AGENCY_CONTACT.website)).trim(),
          curatorName: (form.curatorName !== undefined ? form.curatorName : getValues("curatorName"))?.trim() || undefined,
          curatorPhone: (form.curatorPhone !== undefined ? form.curatorPhone : getValues("curatorPhone"))?.trim() || undefined,
          emergencyContacts: (form.emergencyContacts !== undefined ? form.emergencyContacts : getValues("emergencyContacts"))?.trim() || undefined,
        },
      }),
      transportation: JSON.stringify({
        origin: form.transportOrigin,
        destination: form.transportDestination,
        vehicleType: form.transportVehicle,
      }),
      hotelTerms: JSON.stringify((form.hotelTerms || []).map((s) => s.trim()).filter(Boolean)),
      paymentTerms: JSON.stringify((form.paymentTerms || []).map((s) => s.trim()).filter(Boolean)),
      importantInfo: JSON.stringify((form.importantInfo || []).map((s) => s.trim()).filter(Boolean)),
      enquiryId: linkedEnquiryId ?? (existing as any)?.enquiryId ?? undefined,
    };

    isSubmittingRef.current = true;

    if (isEdit && itineraryId) {
      updateMutation.mutate(
        { id: itineraryId, data },
        {
          onSuccess: (updated) => {
            isSubmittingRef.current = false;
            qc.setQueryData(getGetItineraryQueryKey(itineraryId), updated);
            qc.setQueryData(
              getListItinerariesQueryKey(),
              (old: any[] | undefined) => {
                if (!Array.isArray(old)) return old;
                return old.map((item) => (item.id === itineraryId ? { ...item, ...updated } : item));
              }
            );
            loadedItineraryVersionRef.current = `${updated.id}_${updated.updatedAt || ""}`;
            userHasEditedRef.current = false;
            invalidate();
            toast({ title: "Itinerary proposal updated successfully" });
            if (returnToInboxEnquiryId) {
              navigate(`/enquiries?viewEnquiry=${returnToInboxEnquiryId}`);
            } else {
              navigate("/itineraries");
            }
          },
          onError: (err: any) => {
            isSubmittingRef.current = false;
            toast({ title: "Failed to update itinerary", description: err?.message, variant: "destructive" });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: (created) => {
            isSubmittingRef.current = false;
            qc.setQueryData(getGetItineraryQueryKey(created.id), created);
            loadedItineraryVersionRef.current = `${created.id}_${created.updatedAt || ""}`;
            userHasEditedRef.current = false;
            invalidate();
            toast({
              title: "Proposal created successfully",
              description: `Reference: ${created.shareToken.slice(0, 8).toUpperCase()}`,
            });
            if (returnToInboxEnquiryId) {
              navigate(`/enquiries?viewEnquiry=${returnToInboxEnquiryId}&createdProposalId=${created.id}`);
            } else {
              navigate("/itineraries");
            }
          },
          onError: (err: any) => {
            isSubmittingRef.current = false;
            toast({ title: "Failed to create itinerary", description: err?.message, variant: "destructive" });
          },
        }
      );
    }
  };

  const onInvalid = (errors: any) => {
    console.warn("Form validation errors:", errors);
    const firstError = Object.values(errors)[0] as any;
    toast({
      title: "Please complete required fields",
      description: firstError?.message || "Customer name and proposal title are required.",
      variant: "destructive",
    });
    scrollToSection("section-details");
  };

  function handleCancel() {
    const returnTarget = returnToInboxEnquiryId
      ? `/enquiries?viewEnquiry=${returnToInboxEnquiryId}`
      : isEdit
      ? "/itineraries"
      : "/itineraries/create";
    if (isDirty) {
      setPendingNavigation(returnTarget);
      setShowDiscardDialog(true);
    } else {
      navigate(returnTarget);
    }
  }

  const [activeSection, setActiveSection] = useState<string>("section-details");
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Section Scrollspy: Automatically highlight the current section in the sticky nav on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sectionIds = [
      "section-details",
      "section-days",
      "section-transport",
      "section-inclusions",
      "section-budget",
      "section-terms",
      "section-publishing",
    ];

    const determineActiveSection = (): string => {
      const mainEl = document.querySelector("main");

      // Check if user is scrolled near the very bottom of the scrollable container
      if (mainEl && mainEl.scrollHeight > mainEl.clientHeight + 120) {
        const distanceFromBottom = mainEl.scrollHeight - mainEl.scrollTop - mainEl.clientHeight;
        if (distanceFromBottom < 40) {
          return "section-publishing";
        }
      }

      // Calculate sticky nav bottom edge dynamically so threshold adjusts to responsive navbar height
      const stickyNav = document.querySelector(".sticky");
      const stickyBottom = stickyNav ? stickyNav.getBoundingClientRect().bottom : 100;
      const threshold = stickyBottom + 45;

      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold) {
          current = id;
        } else {
          break;
        }
      }

      return current;
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!isProgrammaticScrollRef.current) {
            const next = determineActiveSection();
            setActiveSection((prev) => (prev !== next ? next : prev));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Run initial determination once content mounts
    const timer = setTimeout(handleScroll, 120);

    return () => {
      clearTimeout(timer);
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [templateChoice, isLoading, isEdit]);

  // Keep the active step pill centered and smoothly scrolled into view in the horizontal navbar
  useEffect(() => {
    if (!navContainerRef.current) return;
    const navContainer = navContainerRef.current;
    const navBtn = navContainer.querySelector<HTMLElement>(`[data-testid="step-nav-${activeSection}"]`);
    if (navBtn) {
      const btnLeft = navBtn.offsetLeft;
      const btnWidth = navBtn.offsetWidth;
      const containerWidth = navContainer.clientWidth;
      const targetScrollLeft = btnLeft - (containerWidth / 2) + (btnWidth / 2);

      navContainer.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }
  }, [activeSection]);

  function scrollToSection(id: string) {
    setActiveSection(id);
    isProgrammaticScrollRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    const el = document.getElementById(id);
    const mainEl = document.querySelector("main");
    if (el && mainEl) {
      const stickyNav = document.querySelector(".sticky");
      const stickyHeight = stickyNav ? stickyNav.getBoundingClientRect().height : 90;
      const elRect = el.getBoundingClientRect();
      const mainRect = mainEl.getBoundingClientRect();
      const targetScrollTop = mainEl.scrollTop + (elRect.top - mainRect.top) - stickyHeight - 16;
      mainEl.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 750);
  }

  // Auto-fill dates sequentially from trip start date
  function autoFillDatesFromStart() {
    if (!watchedStartDate) {
      toast({
        title: "No start date set",
        description: "Please enter a Start Date in Trip Details first.",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(watchedStartDate);
    if (Number.isNaN(start.getTime())) return;

    watchedDays.forEach((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      const iso = d.toISOString().split("T")[0];
      setValue(`days.${idx}.date`, iso, { shouldDirty: true });
    });

    // If endDate is empty and we have days, set endDate to final day
    if (!watchedEndDate && watchedDays.length > 0) {
      const lastDate = new Date(start);
      lastDate.setDate(start.getDate() + watchedDays.length - 1);
      setValue("endDate", lastDate.toISOString().split("T")[0], { shouldDirty: true });
    }

    toast({
      title: "Dates auto-filled",
      description: `Assigned sequential dates to ${watchedDays.length} days starting from ${watchedStartDate}.`,
    });
  }

  function toggleAllDays(collapse: boolean) {
    const next: Record<number, boolean> = {};
    daysArray.fields.forEach((_, idx) => {
      next[idx] = collapse;
    });
    setCollapsedDays(next);
  }

  function toggleAllStays(collapse: boolean) {
    const next: Record<number, boolean> = {};
    staysArray.fields.forEach((_, idx) => {
      next[idx] = collapse;
    });
    setCollapsedStays(next);
  }

  // Row helpers for inclusions, exclusions, and terms
  type TermField = "inclusions" | "exclusions" | "hotelTerms" | "paymentTerms" | "importantInfo";

  function addTerm(type: TermField) {
    const current = (watch(type) as string[]) || [];
    setValue(type, [...current, ""], { shouldDirty: true });
  }

  function updateTerm(type: TermField, index: number, value: string) {
    const current = [...((watch(type) as string[]) || [])];
    current[index] = value;
    setValue(type, current, { shouldDirty: true });
  }

  function removeTerm(type: TermField, index: number) {
    const current = [...((watch(type) as string[]) || [])];
    current.splice(index, 1);
    setValue(type, current, { shouldDirty: true });
  }

  function moveTerm(type: TermField, index: number, direction: "up" | "down") {
    const current = [...((watch(type) as string[]) || [])];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const temp = current[index];
    current[index] = current[target];
    current[target] = temp;
    setValue(type, current, { shouldDirty: true });
  }

  function openBulkEdit(type: TermField) {
    const current = (watch(type) as string[]) || [];
    setBulkTermsText(current.join("\n"));
    setBulkTermsModal(type);
  }

  function resetToDefaults(type: "hotelTerms" | "paymentTerms" | "importantInfo" | "exclusions") {
    if (type === "hotelTerms") setValue("hotelTerms", [...DEFAULT_HOTEL_TERMS], { shouldDirty: true });
    if (type === "paymentTerms") setValue("paymentTerms", [...DEFAULT_PAYMENT_TERMS], { shouldDirty: true });
    if (type === "importantInfo") setValue("importantInfo", [...DEFAULT_IMPORTANT_INFO], { shouldDirty: true });
    if (type === "exclusions") setValue("exclusions", [...DEFAULT_EXCLUSIONS], { shouldDirty: true });
    toast({ title: `Reset ${type} to standard agency defaults` });
  }

  function togglePresetOption(type: "inclusions" | "exclusions", option: string, isChecked: boolean) {
    const current = ((watch(type) as string[]) || []).map((s) => s.trim());
    if (isChecked) {
      if (!current.some((item) => item.toLowerCase() === option.trim().toLowerCase())) {
        setValue(type, [...current, option.trim()], { shouldDirty: true });
      }
    } else {
      setValue(
        type,
        current.filter((item) => item.toLowerCase() !== option.trim().toLowerCase()),
        { shouldDirty: true }
      );
    }
  }

  function savePresetInclusions(next: string[]) {
    setPresetInclusions(next);
    try {
      localStorage.setItem("escora_preset_inclusions_list", JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save preset inclusions:", e);
    }
  }

  function savePresetExclusions(next: string[]) {
    setPresetExclusions(next);
    try {
      localStorage.setItem("escora_preset_exclusions_list", JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save preset exclusions:", e);
    }
  }



  function handleDeletePresetOption(type: "inclusions" | "exclusions", index: number) {
    if (type === "inclusions") {
      const next = [...presetInclusions];
      next.splice(index, 1);
      savePresetInclusions(next);
      toast({ title: "Removed option from common inclusions" });
    } else {
      const next = [...presetExclusions];
      next.splice(index, 1);
      savePresetExclusions(next);
      toast({ title: "Removed option from common exclusions" });
    }
  }

  function handleSaveInlineEdit() {
    if (!inlineEditing) return;
    const { type, index, text } = inlineEditing;
    const trimmed = text.trim();
    if (!trimmed) {
      setInlineEditing(null);
      return;
    }

    if (type === "inclusions") {
      const oldVal = presetInclusions[index];
      const next = [...presetInclusions];
      next[index] = trimmed;
      savePresetInclusions(next);

      const current = ((watch("inclusions") as string[]) || []).map((s) => s.trim());
      if (current.some((item) => item.toLowerCase() === oldVal.trim().toLowerCase())) {
        setValue(
          "inclusions",
          current.map((item) => (item.toLowerCase() === oldVal.trim().toLowerCase() ? trimmed : item)),
          { shouldDirty: true }
        );
      }
      toast({ title: "Updated common inclusion option" });
    } else {
      const oldVal = presetExclusions[index];
      const next = [...presetExclusions];
      next[index] = trimmed;
      savePresetExclusions(next);

      const current = ((watch("exclusions") as string[]) || []).map((s) => s.trim());
      if (current.some((item) => item.toLowerCase() === oldVal.trim().toLowerCase())) {
        setValue(
          "exclusions",
          current.map((item) => (item.toLowerCase() === oldVal.trim().toLowerCase() ? trimmed : item)),
          { shouldDirty: true }
        );
      }
      toast({ title: "Updated common exclusion option" });
    }

    setInlineEditing(null);
  }

  function openManagePresets(type: "inclusions" | "exclusions") {
    setManagePresetsModal(type);
    const list = type === "inclusions" ? presetInclusions : presetExclusions;
    setModalPresetsList([...list]);
    setModalBulkText(list.join("\n"));
    setModalNewItemText("");
    setModalTab("list");
  }

  function handleSaveManagePresetsModal() {
    if (!managePresetsModal) return;
    let finalList: string[] = [];
    if (modalTab === "bulk") {
      finalList = modalBulkText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    } else {
      finalList = modalPresetsList.map((l) => l.trim()).filter(Boolean);
    }

    if (managePresetsModal === "inclusions") {
      savePresetInclusions(finalList);
      toast({ title: `Saved ${finalList.length} common inclusions` });
    } else {
      savePresetExclusions(finalList);
      toast({ title: `Saved ${finalList.length} common exclusions` });
    }
    setManagePresetsModal(null);
  }

  function handleResetPresetsModalToDefaults() {
    if (!managePresetsModal) return;
    const defaults = managePresetsModal === "inclusions" ? PLACEHOLDER_INCLUSIONS : PLACEHOLDER_EXCLUSIONS;
    setModalPresetsList([...defaults]);
    setModalBulkText(defaults.join("\n"));
    toast({ title: `Reset options to agency defaults` });
  }

  function handleAddModalPresetItem() {
    const text = modalNewItemText.trim();
    if (!text) return;
    if (modalPresetsList.some((p) => p.toLowerCase() === text.toLowerCase())) {
      toast({ title: "Option already exists in list", variant: "destructive" });
      return;
    }
    const next = [...modalPresetsList, text];
    setModalPresetsList(next);
    setModalBulkText(next.join("\n"));
    setModalNewItemText("");
  }

  function selectAllPresets(type: "inclusions" | "exclusions") {
    const presets = type === "inclusions" ? presetInclusions : presetExclusions;
    const current = ((watch(type) as string[]) || []).map((s) => s.trim());
    const toAdd = presets.filter(
      (p) => !current.some((item) => item.toLowerCase() === p.trim().toLowerCase())
    );
    setValue(type, [...current, ...toAdd], { shouldDirty: true });
    toast({ title: `Added all common ${type} to proposal` });
  }

  function clearPresetOptions(type: "inclusions" | "exclusions") {
    const presets = type === "inclusions" ? presetInclusions : presetExclusions;
    const current = ((watch(type) as string[]) || []).map((s) => s.trim());
    const remaining = current.filter(
      (item) => !presets.some((p) => p.trim().toLowerCase() === item.toLowerCase())
    );
    setValue(type, remaining, { shouldDirty: true });
    toast({ title: `Cleared common ${type}` });
  }

  function applyBulkEdit() {
    if (!bulkTermsModal) return;
    const lines = bulkTermsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    setValue(bulkTermsModal, lines, { shouldDirty: true });
    setBulkTermsModal(null);
    toast({ title: `Updated ${lines.length} items` });
  }

  if (isEdit && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isEdit && !isLoading && !existing) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (returnToInboxEnquiryId ? navigate(`/enquiries?viewEnquiry=${returnToInboxEnquiryId}`) : navigate("/itineraries"))}
          className="gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> {returnToInboxEnquiryId ? "Back to Inquiry" : "Back to Itineraries"}
        </Button>
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-semibold text-foreground">Itinerary Proposal Not Found</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Could not retrieve itinerary proposal #{itineraryId} for editing. The record may have been deleted or the identifier is invalid.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => (returnToInboxEnquiryId ? navigate(`/enquiries?viewEnquiry=${returnToInboxEnquiryId}`) : navigate("/itineraries"))}
                className="cursor-pointer"
              >
                {returnToInboxEnquiryId ? "Return to Inquiry" : "Return to Itineraries List"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = (watchedPricing?.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxRate = Number(watchedPricing?.taxRate ?? 5);
  const isTaxInclusive = Boolean(watchedPricing?.taxInclusive);
  const isFixedTax = watchedPricing?.taxType === "fixed";
  const calculatedTaxAmount = watchedPricing?.showTaxes
    ? isFixedTax
      ? Number(watchedPricing?.taxes) || 0
      : isTaxInclusive
      ? Math.round(subtotal - subtotal / (1 + taxRate / 100))
      : Math.round((subtotal * taxRate) / 100)
    : 0;
  const total = watchedPricing?.showTaxes && !isTaxInclusive
    ? subtotal + calculatedTaxAmount
    : subtotal;

  const calculatedDuration = (() => {
    if (!watchedStartDate || !watchedEndDate) {
      return watchedDays.length > 0 ? `${watchedDays.length} Days` : null;
    }
    const start = new Date(watchedStartDate);
    const end = new Date(watchedEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return watchedDays.length > 0 ? `${watchedDays.length} Days` : null;
    }
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays <= 0) return watchedDays.length > 0 ? `${watchedDays.length} Days` : null;
    const nights = Math.max(0, diffDays - 1);
    return `${diffDays} Days · ${nights} Nights`;
  })();

  const verificationChecks = [
    {
      label: "Customer & Lead Info",
      passed: Boolean(watchedCustomerName && watchedCustomerName.trim().length > 0),
      hint: watchedCustomerName?.trim() ? watchedCustomerName : "Customer name is required",
    },
    {
      label: "Proposal Title",
      passed: Boolean(watchedTitle && watchedTitle.trim().length > 0),
      hint: watchedTitle?.trim() ? watchedTitle : "Itinerary title is required",
    },
    {
      label: "Day-by-Day Plans",
      passed: watchedDays.length > 0,
      hint: watchedDays.length > 0 ? `${watchedDays.length} day(s) configured` : "No day plans added yet",
    },
    {
      label: "Accommodations",
      passed: watchedStays.length > 0,
      hint: watchedStays.length > 0 ? `${watchedStays.length} stay(s) scheduled` : "No stays added (optional)",
      optional: true,
    },
    {
      label: "Pricing & Investment",
      passed: total > 0,
      hint: total > 0 ? `${watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}${total.toLocaleString("en-IN")}` : "Total is ₹0",
    },
  ];

  if (!isEdit && templateChoice === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        {showAiModal && (
          <AiItineraryAssistantModal
            isOpen={showAiModal}
            onClose={handleCloseAiModal}
            onApplyDraft={handleApplyAiDraft}
            initialEnquiryId={aiEnquiryId}
            currentFormData={{
              customerName: watch("customerName"),
              customerEmail: watch("customerEmail"),
              customerPhone: watch("customerPhone"),
              destination: watch("destination"),
              startDate: watch("startDate"),
              endDate: watch("endDate"),
              title: watch("title"),
              summary: watch("summary"),
              days: watchedDays,
              stays: watchedStays,
              inclusions: watchedInclusions,
              exclusions: watchedExclusions,
            }}
            isEdit={isEdit}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // BUILDER FORM SCREEN (6 Visual Sections + Sticky Navigator)
  // -------------------------------------------------------------
  return (
    <div data-testid="itinerary-builder-page" className="relative space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            title={returnToInboxEnquiryId ? "Back to Inquiry" : isEdit ? "Back to Itineraries" : "Back to Templates"}
            data-testid="button-back-itinerary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-semibold text-foreground">{isEdit ? "Edit Itinerary Proposal" : "New Itinerary Proposal"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Structured proposal editor with day plans, resort stays, transparent pricing, and public share links.
            </p>
          </div>
        </div>

        {!isEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const target = linkedEnquiryId || returnToInboxEnquiryId
                ? `/itineraries/create?enquiryId=${linkedEnquiryId || returnToInboxEnquiryId}`
                : "/itineraries/create";
              if (isDirty) {
                setPendingNavigation(target);
                setShowDiscardDialog(true);
              } else {
                navigate(target);
              }
            }}
            data-testid="button-change-template"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Change Template
          </Button>
        )}
      </div>

      {/* Sticky Section Navigator & Action Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border border-border/80 p-2 sm:px-4 rounded-lg shadow-xs flex flex-col gap-2 transition-all">
        {/* Row 1: Proposal Title (Left) & Actions (Right) */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif text-sm font-semibold text-foreground tracking-tight truncate">
              {watchedTitle ? watchedTitle : isEdit ? "Edit Proposal" : "New Itinerary Proposal"}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Direct PDF Preview in New Tab (only shown in edit mode for saved itineraries) */}
            {isEdit && itineraryId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
                  const target = `${basePath}/preview-itinerary?id=${itineraryId}`;
                  window.open(target, "_blank");
                }}
                className="h-8 text-xs font-medium border-border hover:bg-muted text-foreground gap-1.5 shrink-0"
                title="Preview standard Itinerary PDF Dossier"
                data-testid="button-pdf-preview"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">PDF Preview</span>
              </Button>
            )}

            {/* AI Assistant Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAiModal(true)}
              className="h-8 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 gap-1.5 shrink-0"
              data-testid="button-ai-assistant"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">AI Assistant ✨</span>
              <span className="sm:hidden">AI ✨</span>
            </Button>



            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
              data-testid="button-cancel-itinerary"
            >
              Cancel
            </Button>

            {/* Create Proposal / Save Changes Primary Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit(onSubmit, onInvalid)}
              disabled={isSubmittingRef.current || createMutation.isPending || updateMutation.isPending}
              className="h-8 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0 gap-1.5"
              data-testid="button-submit-itinerary"
            >
              {isSubmittingRef.current || createMutation.isPending || updateMutation.isPending ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Proposal"
              )}
            </Button>
          </div>
        </div>

        {/* Row 2: Seven Workflow Steps Matching the PDF Structure */}
        <div
          ref={navContainerRef}
          className="pt-1.5 border-t border-border/50 w-full overflow-x-auto no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <nav
            aria-label="Itinerary proposal sections"
            className="flex items-center gap-1 sm:gap-1.5 min-w-max scroll-smooth"
          >
            {[
              { id: "section-details", num: 1, label: "Trip & Customer Details" },
              { id: "section-days", num: 2, label: "Day-to-Day Plan", count: daysArray.fields.length },
              { id: "section-transport", num: 3, label: "Transportation" },
              { id: "section-inclusions", num: 4, label: "Inclusions & Exclusions", count: watchedInclusions.length + watchedExclusions.length },
              { id: "section-budget", num: 5, label: "Budget & Pricing", count: staysArray.fields.length },
              { id: "section-terms", num: 6, label: "Terms & Conditions" },
              { id: "section-publishing", num: 7, label: "Status & PDF" },
            ].map((step, idx, arr) => {
              const isActive = activeSection === step.id;
              return (
                <div key={step.id} className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollToSection(step.id)}
                    aria-current={isActive ? "step" : undefined}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium"
                    }`}
                    data-testid={`step-nav-${step.id}`}
                  >
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0 ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.num}
                    </span>
                    <span>{step.label}</span>
                    {step.count !== undefined && (
                      <span
                        className={`text-[11px] font-normal tabular-nums ${
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground/70"
                        }`}
                      >
                        ({step.count})
                      </span>
                    )}
                  </button>
                  {idx < arr.length - 1 && (
                    <ChevronRight
                      className="h-3 w-3 text-muted-foreground/30 shrink-0 select-none"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        {/* ============================================================
            SECTION 1: TRIP & CUSTOMER DETAILS (Split into Clear Cards)
        ============================================================ */}
        <section id="section-details" className="scroll-mt-24 space-y-6">
          {/* Card 1A: Customer & Passenger Details */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  1A. Customer &amp; Passenger Details
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    PDF Header &amp; Table
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
                    Private CRM Fields
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Primary traveler details and traveling party breakdown. Visual badges clarify which data appears on the customer-facing proposal versus internal agency records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Row 1: Primary Guest & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customerName" className="font-medium text-xs">
                      Guest / Customer Name *
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF Header
                    </Badge>
                  </div>
                  <Input
                    id="customerName"
                    {...register("customerName", { required: true })}
                    placeholder="e.g. MARIA ROY"
                    data-testid="input-customer-name"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Rendered in bold in the PDF header card ("Prepared for MARIA ROY").
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customerEmail" className="font-medium text-xs">
                      Customer Email
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-muted-foreground border-border bg-muted/40">
                      Private CRM · Not on PDF
                    </Badge>
                  </div>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register("customerEmail")}
                    placeholder="client@example.com"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Private contact for booking confirmations and CRM tracking.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customerPhone" className="font-medium text-xs">
                      Customer Phone
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-muted-foreground border-border bg-muted/40">
                      Private CRM · Not on PDF
                    </Badge>
                  </div>
                  <Input
                    id="customerPhone"
                    {...register("customerPhone")}
                    placeholder="+91 98765 43210"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Used for WhatsApp itinerary sharing and concierge coordination.
                  </p>
                </div>
              </div>

              {/* Row 2: Total Passengers Breakdown */}
              <div className="space-y-2.5 p-4 bg-muted/20 rounded-lg border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <Label className="font-semibold text-xs text-foreground">
                      Total Passengers (Traveling Party)
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF Trip Details Table
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Displays in the PDF 'Trip Details' banner as 'X Adults | Y Children | Z Infants'
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="adults" className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Adults (Age 12+)</span>
                      <span className="text-[10px] font-mono text-muted-foreground/80">Primary</span>
                    </Label>
                    <Input
                      id="adults"
                      type="number"
                      min="1"
                      {...register("adults", { valueAsNumber: true })}
                      placeholder="1"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="children" className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Children (Age 2-11)</span>
                      <span className="text-[10px] font-mono text-muted-foreground/80">Child rate</span>
                    </Label>
                    <Input
                      id="children"
                      type="number"
                      min="0"
                      {...register("children", { valueAsNumber: true })}
                      placeholder="0"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="infants" className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Infants (Under 2)</span>
                      <span className="text-[10px] font-mono text-muted-foreground/80">Complimentary</span>
                    </Label>
                    <Input
                      id="infants"
                      type="number"
                      min="0"
                      {...register("infants", { valueAsNumber: true })}
                      placeholder="0"
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 1B: Trip & Journey Overview */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  1B. Trip &amp; Journey Overview
                </CardTitle>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    PDF Cover, Header &amp; Highlights
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Itinerary branding, dates, destination region, feature badges, cover photo, and journey summary. All fields appear on the client PDF proposal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Row 1: Title, Destination & Reference Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="font-medium text-xs">
                      Itinerary Title *
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      Main PDF Title
                    </Badge>
                  </div>
                  <Input
                    id="title"
                    {...register("title", { required: true })}
                    placeholder="e.g. Explora Trivandrum"
                    data-testid="input-title"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Hero headline on the proposal cover and overview section.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="destination" className="font-medium text-xs">
                      Destination Region
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF Banner
                    </Badge>
                  </div>
                  <Input
                    id="destination"
                    {...register("destination")}
                    placeholder="e.g. Trivandrum, Keralam, India | Kovalam, Keralam, India"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Renders in the green destination bar under Trip Details.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="referenceNumber" className="font-medium text-xs flex items-center gap-1.5">
                      Reference Number
                    </Label>
                    <button
                      type="button"
                      onClick={handleRegenerateReference}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-normal cursor-pointer"
                      title="Generate a new reference number"
                    >
                      <RefreshCw className="h-3 w-3" /> Auto-fill New
                    </button>
                  </div>
                  <Input
                    id="referenceNumber"
                    {...register("referenceNumber")}
                    placeholder="e.g. L100021/Q1020"
                    className="font-mono text-xs uppercase"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Quotation reference displayed in the top right header (e.g. Ref: ESC-1020).
                  </p>
                </div>
              </div>

              {/* Row 2: Travel Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="startDate" className="font-medium text-xs">
                      Start Date
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF Start Date
                    </Badge>
                  </div>
                  <Input id="startDate" type="date" {...register("startDate")} />
                  <p className="text-[10.5px] text-muted-foreground">
                    First day of travel (used for sequential day plan dates).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="endDate" className="font-medium text-xs">
                      End Date
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF End Date &amp; Duration
                    </Badge>
                  </div>
                  <Input id="endDate" type="date" {...register("endDate")} />
                  <p className="text-[10.5px] text-muted-foreground">
                    Calculates total trip duration (e.g. 6N | 7D) across the PDF.
                  </p>
                </div>
              </div>

              {/* Row 3: "Your Trip Includes" 4 Checkbox Cards */}
              <div className="space-y-2 p-3.5 bg-muted/20 rounded-lg border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label className="font-semibold text-xs text-foreground">
                      Your Trip Includes (Top PDF Feature Badges)
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF Overview Card
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Checked badges show with green checkmarks in the top summary card
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                  <label className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${watch("hotelIncluded") ? "bg-primary/10 border-primary/40 text-foreground" : "bg-card border-border text-muted-foreground opacity-60"}`}>
                    <input type="checkbox" {...register("hotelIncluded")} className="rounded text-primary focus:ring-primary h-4 w-4" />
                    <div>
                      <span className="text-xs font-semibold block">Hotel</span>
                      <span className="text-[10px] text-muted-foreground">Stay bookings</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${watch("transportIncluded") ? "bg-primary/10 border-primary/40 text-foreground" : "bg-card border-border text-muted-foreground opacity-60"}`}>
                    <input type="checkbox" {...register("transportIncluded")} className="rounded text-primary focus:ring-primary h-4 w-4" />
                    <div>
                      <span className="text-xs font-semibold block">Transport</span>
                      <span className="text-[10px] text-muted-foreground">Dedicated vehicle</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${watch("sightseeingIncluded") ? "bg-primary/10 border-primary/40 text-foreground" : "bg-card border-border text-muted-foreground opacity-60"}`}>
                    <input type="checkbox" {...register("sightseeingIncluded")} className="rounded text-primary focus:ring-primary h-4 w-4" />
                    <div>
                      <span className="text-xs font-semibold block">Sight-Seeing</span>
                      <span className="text-[10px] text-muted-foreground">Guided tours</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${watch("transferIncluded") ? "bg-primary/10 border-primary/40 text-foreground" : "bg-card border-border text-muted-foreground opacity-60"}`}>
                    <input type="checkbox" {...register("transferIncluded")} className="rounded text-primary focus:ring-primary h-4 w-4" />
                    <div>
                      <span className="text-xs font-semibold block">VISA</span>
                      <span className="text-[10px] text-muted-foreground">Visa assistance</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${watch("flightsIncluded") ? "bg-primary/10 border-primary/40 text-foreground" : "bg-card border-border text-muted-foreground opacity-60"}`}>
                    <input type="checkbox" {...register("flightsIncluded")} className="rounded text-primary focus:ring-primary h-4 w-4" />
                    <div>
                      <span className="text-xs font-semibold block">Flight Tickets</span>
                      <span className="text-[10px] text-muted-foreground">Flight bookings</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Row 4: Cover photo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-xs">Proposal Cover Photo</Label>
                  <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                    PDF Hero Image
                  </Badge>
                </div>
                <Controller
                  control={control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <ImageUploadField
                      value={field.value}
                      onChange={field.onChange}
                      label="Cover photo"
                      size="wide"
                    />
                  )}
                />
                <p className="text-[10.5px] text-muted-foreground">
                  High-resolution photo displayed across the top hero header of the PDF proposal.
                </p>
              </div>

              {/* Row 5: Summary */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="summary" className="font-medium text-xs">
                    Journey Overview &amp; Summary
                  </Label>
                  <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-muted-foreground border-border bg-muted/40">
                    PDF Intro Section
                  </Badge>
                </div>
                <Textarea
                  id="summary"
                  {...register("summary")}
                  rows={3}
                  placeholder="A curated route through Kerala's historic quarters, temples, and coastal retreats."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 1C: Curator & Agency Contacts */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  1C. Curator &amp; Agency Contacts
                </CardTitle>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    PDF Header &amp; Footer
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Personal concierge credit, 24/7 emergency hotline, and agency contact channels printed on the proposal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Row 1: Curator & Emergency Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="curatorName" className="font-medium text-xs">
                      Itinerary Curated By
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF Header
                    </Badge>
                  </div>
                  <Input
                    id="curatorName"
                    value={watchedCuratorName}
                    onChange={(e) => {
                      userHasEditedRef.current = true;
                      setValue("curatorName", e.target.value, { shouldDirty: true });
                    }}
                    placeholder="e.g. Midhilaj Chelakkal"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Curator name credited under 'Itinerary Curated By'.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="curatorPhone" className="font-medium text-xs">
                    Curator Contact Number
                  </Label>
                  <Input
                    id="curatorPhone"
                    value={watchedCuratorPhone}
                    onChange={(e) => {
                      userHasEditedRef.current = true;
                      setValue("curatorPhone", e.target.value, { shouldDirty: true });
                    }}
                    placeholder="+91 9745585813"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Direct phone number shown alongside curator name.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emergencyContacts" className="font-medium text-xs">
                      Emergency Contacts
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
                      PDF Header Banner
                    </Badge>
                  </div>
                  <Input
                    id="emergencyContacts"
                    value={watchedEmergencyContacts}
                    onChange={(e) => {
                      userHasEditedRef.current = true;
                      setValue("emergencyContacts", e.target.value, { shouldDirty: true });
                    }}
                    placeholder="+91 9400280420 | +91 8157003344"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    24/7 hotline numbers printed in the top proposal card.
                  </p>
                </div>
              </div>

              {/* Row 2: Agency Footer Contact & Social Media */}
              <div className="space-y-3 p-3.5 bg-muted/20 rounded-lg border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <Label className="font-semibold text-xs text-foreground">
                      Agency Contact &amp; Social Media (PDF Footer Bar)
                    </Label>
                    <Badge variant="outline" className="text-[9.5px] uppercase font-mono tracking-wider text-muted-foreground border-border bg-muted/40">
                      PDF Footer
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Customizes the bottom contact bar on the dossier
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="agencyPhone" className="text-[11px] font-medium text-foreground">
                      Contact Phone
                    </Label>
                    <Input
                      id="agencyPhone"
                      value={watchedAgencyPhone}
                      onChange={(e) => {
                        userHasEditedRef.current = true;
                        setValue("agencyPhone", e.target.value, { shouldDirty: true });
                      }}
                      placeholder="9496933336"
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="agencyEmail" className="text-[11px] font-medium text-foreground">
                      Contact Email
                    </Label>
                    <Input
                      id="agencyEmail"
                      value={watchedAgencyEmail}
                      onChange={(e) => {
                        userHasEditedRef.current = true;
                        setValue("agencyEmail", e.target.value, { shouldDirty: true });
                      }}
                      placeholder="mc@escoraholidays.com"
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="agencyInstagram" className="text-[11px] font-medium text-foreground">
                      Instagram Handle
                    </Label>
                    <Input
                      id="agencyInstagram"
                      value={watchedAgencyInstagram}
                      onChange={(e) => {
                        userHasEditedRef.current = true;
                        setValue("agencyInstagram", e.target.value, { shouldDirty: true });
                      }}
                      placeholder="escora_holidays"
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="agencyFacebook" className="text-[11px] font-medium text-foreground">
                      Facebook Name
                    </Label>
                    <Input
                      id="agencyFacebook"
                      value={watchedAgencyFacebook}
                      onChange={(e) => {
                        userHasEditedRef.current = true;
                        setValue("agencyFacebook", e.target.value, { shouldDirty: true });
                      }}
                      placeholder="Escora Holidays"
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="agencyWebsite" className="text-[11px] font-medium text-foreground">
                      Website URL
                    </Label>
                    <Input
                      id="agencyWebsite"
                      value={watchedAgencyWebsite}
                      onChange={(e) => {
                        userHasEditedRef.current = true;
                        setValue("agencyWebsite", e.target.value, { shouldDirty: true });
                      }}
                      placeholder="http://www.escoraholidays.com"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION 2: DAY-BY-DAY PLAN
        ============================================================ */}
        <section id="section-days" className="scroll-mt-24">
          <Card>
            <CardHeader className="border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  2. Day-by-Day Plan ({daysArray.fields.length} {daysArray.fields.length === 1 ? "Day" : "Days"})
                </CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {daysArray.fields.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={autoFillDatesFromStart}
                      className="text-xs h-8"
                      title="Auto-fill dates starting from trip start date"
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" /> Auto-fill Dates
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllDays(false)}
                      className="text-xs h-8 text-muted-foreground"
                    >
                      Expand All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllDays(true)}
                      className="text-xs h-8 text-muted-foreground"
                    >
                      Collapse All
                    </Button>
                  </>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newIndex = daysArray.fields.length;
                    let defaultDate = "";
                    if (watchedStartDate) {
                      const d = new Date(watchedStartDate);
                      d.setDate(d.getDate() + newIndex);
                      if (!Number.isNaN(d.getTime())) {
                        defaultDate = d.toISOString().split("T")[0];
                      }
                    }
                    daysArray.append({
                      day: newIndex + 1,
                      title: "",
                      date: defaultDate,
                      description: "",
                      activities: [],
                    });
                  }}
                  className="h-8"
                  data-testid="button-add-day"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Day
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {daysArray.fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                  <p className="font-medium text-foreground text-sm">No days added yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click &ldquo;Add Day&rdquo; to build the day-by-day experience.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => daysArray.append({ day: 1, title: "", activities: [] })}
                    className="mt-3"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Day 1
                  </Button>
                </div>
              ) : (
                daysArray.fields.map((field, dayIndex) => {
                  const isCollapsed = Boolean(collapsedDays[dayIndex]);
                  const dayData = watchedDays[dayIndex] || {};
                  const activitiesCount = dayData.activities?.length ?? 0;

                  return (
                    <div
                      key={field.id}
                      data-testid={`day-card-${dayIndex}`}
                      className="border border-border rounded-lg bg-card overflow-hidden shadow-xs transition-all hover:border-border/80"
                    >
                      {/* Day Header Bar */}
                      <div className="bg-muted/40 p-3.5 flex items-center justify-between gap-3 border-b border-border">
                        <div
                          className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                          onClick={() =>
                            setCollapsedDays((prev) => ({ ...prev, [dayIndex]: !prev[dayIndex] }))
                          }
                        >
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            aria-label={isCollapsed ? "Expand day" : "Collapse day"}
                          >
                            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                          </button>

                          <Badge variant="outline" className="text-xs font-semibold bg-background">
                            Day {dayIndex + 1}
                          </Badge>

                          <div className="font-medium text-sm text-foreground truncate max-w-md">
                            {dayData.title || <span className="text-muted-foreground italic">Untitled Day</span>}
                          </div>

                          {dayData.date && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              · {new Date(dayData.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>

                        {/* Reordering & Delete Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={dayIndex === 0}
                            onClick={() => daysArray.swap(dayIndex, dayIndex - 1)}
                            title="Move Day Up"
                          >
                            <MoveUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={dayIndex === daysArray.fields.length - 1}
                            onClick={() => daysArray.swap(dayIndex, dayIndex + 1)}
                            title="Move Day Down"
                          >
                            <MoveDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => daysArray.remove(dayIndex)}
                            title="Remove Day"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Day Card Body */}
                      {!isCollapsed && (
                        <DayCardBody
                          control={control}
                          register={register}
                          dayIndex={dayIndex}
                          tripStartDate={watchedStartDate}
                          tripEndDate={watchedEndDate}
                          setValue={setValue}
                          watch={watch}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION 3: TRANSPORTATION (Matching PDF Transportation Banner)
        ============================================================ */}
        <section id="section-transport" className="scroll-mt-24">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                3. Transportation Services (PDF Route)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Displays the Origin &amp; Destination route boxes with dedicated chauffeur icon in the Transportation banner on the PDF dossier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="transportOrigin" className="font-medium text-xs">
                    Origin / Agency Pickup Point (Left Box)
                  </Label>
                  <Input
                    id="transportOrigin"
                    {...register("transportOrigin")}
                    placeholder="e.g. ESCORA HOLIDAYS | Trivandrum, Keralam, India"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transportDestination" className="font-medium text-xs">
                    Drop-off / Departure Terminal (Right Box)
                  </Label>
                  <Input
                    id="transportDestination"
                    {...register("transportDestination")}
                    placeholder="e.g. Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transportVehicle" className="font-medium text-xs">
                  Dedicated Chauffeur &amp; Vehicle Specification
                </Label>
                <Input
                  id="transportVehicle"
                  {...register("transportVehicle")}
                  placeholder="e.g. Private Dedicated Chauffeur Driven AC Sedan / SUV"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION 4: INCLUSIONS & EXCLUSIONS
        ============================================================ */}
        <section id="section-inclusions" className="scroll-mt-24">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                4. Inclusions &amp; Exclusions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Clearly define what is covered in the bespoke quote and any independent guest expenditures. Matches the Inclusions &amp; Exclusions banner on the PDF dossier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inclusions */}
              <div className="space-y-4">
                {/* Quick-Select Common Inclusions Checkboxes */}
                <div className="border border-border/70 rounded-lg p-3 bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-foreground">Common Inclusions (Check to Add)</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                        {
                          watchedInclusions.filter((item) =>
                            presetInclusions.some((p) => p.toLowerCase() === item.trim().toLowerCase())
                          ).length
                        }
                        /{presetInclusions.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openManagePresets("inclusions")}
                        className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer flex items-center gap-1"
                        title="Edit and manage common inclusions"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit Options
                      </button>
                      <span className="text-muted-foreground/40 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => selectAllPresets("inclusions")}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground/40 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => clearPresetOptions("inclusions")}
                        className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                    {presetInclusions.map((option, optIdx) => {
                      const isChecked = watchedInclusions.some(
                        (item) => item.trim().toLowerCase() === option.trim().toLowerCase()
                      );

                      if (inlineEditing?.type === "inclusions" && inlineEditing.index === optIdx) {
                        return (
                          <div
                            key={optIdx}
                            className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md border border-primary/50 shadow-xs"
                          >
                            <Input
                              value={inlineEditing.text}
                              onChange={(e) => setInlineEditing({ ...inlineEditing, text: e.target.value })}
                              className="h-7 text-xs flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveInlineEdit();
                                } else if (e.key === "Escape") {
                                  setInlineEditing(null);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              onClick={handleSaveInlineEdit}
                              title="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => setInlineEditing(null)}
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={option + optIdx}
                          className={cn(
                            "group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors border",
                            isChecked
                              ? "bg-emerald-500/10 border-emerald-500/30 text-foreground font-medium"
                              : "border-transparent hover:bg-muted/60 text-muted-foreground"
                          )}
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer select-none flex-1 min-w-0 pr-1">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => togglePresetOption("inclusions", option, !!checked)}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <span className="leading-snug break-words">{option}</span>
                          </label>
                          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 opacity-80 hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setInlineEditing({ type: "inclusions", index: optIdx, text: option });
                              }}
                              className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-foreground"
                              title="Edit this option"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeletePresetOption("inclusions", optIdx);
                              }}
                              className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                              title="Delete option"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Inclusions in Proposal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <Label className="font-medium text-sm">Inclusions in Proposal ({watchedInclusions.length})</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openBulkEdit("inclusions")}
                        className="text-xs h-7 text-muted-foreground"
                      >
                        Paste / Bulk
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTerm("inclusions")}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Custom
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 border rounded-md p-3 bg-muted/10 min-h-[160px]">
                    {watchedInclusions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No inclusions added yet. Check common options above or click &ldquo;Add Custom&rdquo;.
                      </p>
                    ) : (
                      watchedInclusions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-emerald-600 font-bold text-xs flex-shrink-0">✓</span>
                          <Input
                            value={item}
                            onChange={(e) => updateTerm("inclusions", idx, e.target.value)}
                            placeholder="e.g. Daily gourmet breakfast at resort"
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={idx === 0}
                            onClick={() => moveTerm("inclusions", idx, "up")}
                            title="Move Up"
                          >
                            <MoveUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={idx === watchedInclusions.length - 1}
                            onClick={() => moveTerm("inclusions", idx, "down")}
                            title="Move Down"
                          >
                            <MoveDown className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeTerm("inclusions", idx)}
                            title="Remove item"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Exclusions */}
              <div className="space-y-4">
                {/* Quick-Select Common Exclusions Checkboxes */}
                <div className="border border-border/70 rounded-lg p-3 bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs font-semibold text-foreground">Common Exclusions (Check to Add)</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                        {
                          watchedExclusions.filter((item) =>
                            presetExclusions.some((p) => p.toLowerCase() === item.trim().toLowerCase())
                          ).length
                        }
                        /{presetExclusions.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openManagePresets("exclusions")}
                        className="text-[11px] text-destructive hover:underline font-medium cursor-pointer flex items-center gap-1"
                        title="Edit and manage common exclusions"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit Options
                      </button>
                      <span className="text-muted-foreground/40 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => selectAllPresets("exclusions")}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground/40 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => clearPresetOptions("exclusions")}
                        className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                    {presetExclusions.map((option, optIdx) => {
                      const isChecked = watchedExclusions.some(
                        (item) => item.trim().toLowerCase() === option.trim().toLowerCase()
                      );

                      if (inlineEditing?.type === "exclusions" && inlineEditing.index === optIdx) {
                        return (
                          <div
                            key={optIdx}
                            className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md border border-primary/50 shadow-xs"
                          >
                            <Input
                              value={inlineEditing.text}
                              onChange={(e) => setInlineEditing({ ...inlineEditing, text: e.target.value })}
                              className="h-7 text-xs flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveInlineEdit();
                                } else if (e.key === "Escape") {
                                  setInlineEditing(null);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              onClick={handleSaveInlineEdit}
                              title="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => setInlineEditing(null)}
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={option + optIdx}
                          className={cn(
                            "group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors border",
                            isChecked
                              ? "bg-destructive/10 border-destructive/30 text-foreground font-medium"
                              : "border-transparent hover:bg-muted/60 text-muted-foreground"
                          )}
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer select-none flex-1 min-w-0 pr-1">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => togglePresetOption("exclusions", option, !!checked)}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <span className="leading-snug break-words">{option}</span>
                          </label>
                          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 opacity-80 hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setInlineEditing({ type: "exclusions", index: optIdx, text: option });
                              }}
                              className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-foreground"
                              title="Edit this option"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeletePresetOption("exclusions", optIdx);
                              }}
                              className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                              title="Delete option"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Exclusions in Proposal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">
                        ✕
                      </span>
                      <Label className="font-medium text-sm">Exclusions in Proposal ({watchedExclusions.length})</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => resetToDefaults("exclusions")}
                        className="text-xs h-7 text-muted-foreground"
                        title="Reset standard agency exclusions"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Reset
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openBulkEdit("exclusions")}
                        className="text-xs h-7 text-muted-foreground"
                      >
                        Paste / Bulk
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTerm("exclusions")}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Custom
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 border rounded-md p-3 bg-muted/10 min-h-[160px]">
                    {watchedExclusions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No exclusions added yet. Check common options above or click &ldquo;Add Custom&rdquo;.
                      </p>
                    ) : (
                      watchedExclusions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-destructive/10 text-destructive flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            ✕
                          </span>
                          <Input
                            value={item}
                            onChange={(e) => updateTerm("exclusions", idx, e.target.value)}
                            placeholder="e.g. Any domestic or international airfare"
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={idx === 0}
                            onClick={() => moveTerm("exclusions", idx, "up")}
                            title="Move Up"
                          >
                            <MoveUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={idx === watchedExclusions.length - 1}
                            onClick={() => moveTerm("exclusions", idx, "down")}
                            title="Move Down"
                          >
                            <MoveDown className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeTerm("exclusions", idx)}
                            title="Remove item"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Section: We Also Provide */}
            <div className="pt-6 border-t border-border space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <h4 className="text-sm font-semibold text-foreground">
                        We Also Provide (Optional Add-on Services)
                      </h4>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
                        Optional · PDF
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Check any additional concierge services your agency can arrange. Checked items display in a dedicated &ldquo;We Also Provide&rdquo; block on the PDF dossier and web proposal.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const extraServices = Array.from(
                          new Set([
                            ...customServicesList,
                            ...watchedWeAlsoProvide.filter(
                              (item) => !DEFAULT_WE_ALSO_PROVIDE_OPTIONS.includes(item as any)
                            ),
                          ])
                        );
                        const allLabels = [
                          ...DEFAULT_WE_ALSO_PROVIDE_OPTIONS,
                          ...extraServices,
                        ];
                        setValue("weAlsoProvide", allLabels, { shouldDirty: true });
                      }}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground/40 text-[10px]">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("weAlsoProvide", [], { shouldDirty: true });
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Service Option Cards (Standard + Custom Services) */}
                {(() => {
                  const standardServices = [
                    {
                      label: "Private Guide",
                      num: "1",
                      desc: "Dedicated licensed local tour guide",
                      icon: Compass,
                      isCustom: false,
                    },
                    {
                      label: "Photographer/ Videographer",
                      num: "2",
                      desc: "Professional photoshoot & holiday reels",
                      icon: Camera,
                      isCustom: false,
                    },
                  ];

                  const extraServices = Array.from(
                    new Set([
                      ...customServicesList,
                      ...watchedWeAlsoProvide.filter(
                        (item) => !DEFAULT_WE_ALSO_PROVIDE_OPTIONS.includes(item as any)
                      ),
                    ])
                  );

                  const allServices = [
                    ...standardServices,
                    ...extraServices.map((customName, idx) => ({
                      label: customName,
                      num: String(5 + idx),
                      desc: "Custom agency concierge service",
                      icon: Sparkles,
                      isCustom: true,
                    })),
                  ];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {allServices.map((service) => {
                        const isChecked = watchedWeAlsoProvide.includes(service.label);
                        const ServiceIcon = service.icon;

                        return (
                          <div
                            key={service.label}
                            className="relative flex items-start gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer select-none transition-all hover:bg-muted/30 shadow-2xs"
                            onClick={() => {
                              const current = getValues("weAlsoProvide") || watchedWeAlsoProvide || [];
                              const updated = isChecked
                                ? current.filter((item) => item !== service.label)
                                : Array.from(new Set([...current, service.label]));
                              setValue("weAlsoProvide", updated, { shouldDirty: true });
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const current = getValues("weAlsoProvide") || watchedWeAlsoProvide || [];
                                const updated = checked
                                  ? Array.from(new Set([...current, service.label]))
                                  : current.filter((item) => item !== service.label);
                                setValue("weAlsoProvide", updated, { shouldDirty: true });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 data-[state=checked]:text-white"
                            />
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <ServiceIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="text-xs font-semibold leading-tight text-foreground truncate">
                                  {service.num}. {service.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                                {service.desc}
                              </p>
                            </div>
                            {service.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updatedCustom = customServicesList.filter((s) => s !== service.label);
                                  setCustomServicesList(updatedCustom);
                                  try {
                                    localStorage.setItem("escora_custom_services_list", JSON.stringify(updatedCustom));
                                  } catch {}
                                  const current = getValues("weAlsoProvide") || watchedWeAlsoProvide || [];
                                  setValue(
                                    "weAlsoProvide",
                                    current.filter((item) => item !== service.label),
                                    { shouldDirty: true }
                                  );
                                }}
                                className="text-muted-foreground/60 hover:text-destructive p-0.5 rounded cursor-pointer shrink-0 -mr-1 -mt-1 transition-colors"
                                title="Delete custom service"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Custom Service Input Bar */}
                <div className="flex items-center gap-2 max-w-md pt-1">
                  <Input
                    value={customServiceInput}
                    onChange={(e) => setCustomServiceInput(e.target.value)}
                    placeholder="+ Add other custom service (e.g. Travel Insurance)..."
                    className="h-8 text-xs bg-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customServiceInput.trim()) {
                          const trimmed = customServiceInput.trim();
                          if (!customServicesList.includes(trimmed) && !DEFAULT_WE_ALSO_PROVIDE_OPTIONS.includes(trimmed as any)) {
                            const updatedCustom = [...customServicesList, trimmed];
                            setCustomServicesList(updatedCustom);
                            try {
                              localStorage.setItem("escora_custom_services_list", JSON.stringify(updatedCustom));
                            } catch {}
                          }
                          const current = getValues("weAlsoProvide") || watchedWeAlsoProvide || [];
                          if (!current.includes(trimmed)) {
                            setValue("weAlsoProvide", [...current, trimmed], { shouldDirty: true });
                          }
                          setCustomServiceInput("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    disabled={!customServiceInput.trim()}
                    onClick={() => {
                      if (customServiceInput.trim()) {
                        const trimmed = customServiceInput.trim();
                        if (!customServicesList.includes(trimmed) && !DEFAULT_WE_ALSO_PROVIDE_OPTIONS.includes(trimmed as any)) {
                          const updatedCustom = [...customServicesList, trimmed];
                          setCustomServicesList(updatedCustom);
                          try {
                            localStorage.setItem("escora_custom_services_list", JSON.stringify(updatedCustom));
                          } catch {}
                        }
                        const current = getValues("weAlsoProvide") || watchedWeAlsoProvide || [];
                        if (!current.includes(trimmed)) {
                          setValue("weAlsoProvide", [...current, trimmed], { shouldDirty: true });
                        }
                        setCustomServiceInput("");
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION 5: BUDGET & PRICING (Package Stays Table & Investment)
        ============================================================ */}
        <section id="section-budget" className="scroll-mt-24 space-y-6">
          {/* Part 5A: Package Accommodations & Stays Table */}
          <Card>
            <CardHeader className="border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  5A. Package Accommodations ({staysArray.fields.length} {staysArray.fields.length === 1 ? "Stay" : "Stays"})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Populates the Package Stays table (Destinations, Accommodation/Hotels, Star Rating, No. of Nights, No. of Rooms, Meal Plan) on the PDF dossier.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {staysArray.fields.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllStays(false)}
                      className="text-xs h-8 text-muted-foreground"
                    >
                      Expand All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllStays(true)}
                      className="text-xs h-8 text-muted-foreground"
                    >
                      Collapse All
                    </Button>
                  </>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const idx = staysArray.fields.length;
                    staysArray.append({
                      name: "",
                      location: watchedDestination || "",
                      starRating: "5 Star",
                      checkIn: "",
                      checkOut: "",
                      nights: 1,
                      rooms: 1,
                      mealPlan: "BreakFast",
                      notes: "",
                    });
                    setCollapsedStays((prev) => ({ ...prev, [idx]: false }));
                  }}
                  className="text-xs h-8"
                  data-testid="button-add-stay"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Accommodation
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {staysArray.fields.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/10">
                  <Building className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">No accommodations added</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Add resorts, heritage villas, or houseboats to generate the Package Accommodations table in the Budget &amp; Pricing section.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      staysArray.append({
                        name: "",
                        location: watchedDestination || "",
                        starRating: "5 Star",
                        checkIn: "",
                        checkOut: "",
                        nights: 1,
                        rooms: 1,
                        mealPlan: "BreakFast",
                        notes: "",
                      });
                      setCollapsedStays({ 0: false });
                    }}
                    className="mt-3 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add First Stay
                  </Button>
                </div>
              ) : (
                staysArray.fields.map((field, stayIndex) => {
                  const stayData = watchedStays[stayIndex] || {};
                  const isCollapsed = Boolean(collapsedStays[stayIndex]);

                  return (
                    <div
                      key={field.id}
                      data-testid={`stay-card-${stayIndex}`}
                      className="border border-border rounded-lg bg-card overflow-hidden shadow-xs transition-all hover:border-border/80"
                    >
                      {/* Stay Header Bar */}
                      <div className="bg-muted/40 p-3.5 flex items-center justify-between gap-3 border-b border-border">
                        <div
                          className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                          onClick={() =>
                            setCollapsedStays((prev) => ({ ...prev, [stayIndex]: !prev[stayIndex] }))
                          }
                        >
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            aria-label={isCollapsed ? "Expand stay" : "Collapse stay"}
                          >
                            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                          </button>

                          <Badge variant="outline" className="text-xs font-semibold bg-background">
                            Stay {stayIndex + 1}
                          </Badge>

                          <div className="font-medium text-sm text-foreground truncate max-w-xs sm:max-w-md">
                            {stayData.name || <span className="text-muted-foreground italic">Untitled Accommodation</span>}
                          </div>

                          {stayData.starRating && (
                            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 hidden sm:inline-flex items-center gap-0.5">
                              ★ {stayData.starRating}
                            </Badge>
                          )}

                          {stayData.location && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              · {stayData.location}
                            </span>
                          )}

                          {stayData.nights && (
                            <Badge variant="secondary" className="text-[10px] hidden md:inline-flex">
                              {stayData.nights} {stayData.nights === 1 ? "night" : "nights"}
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={stayIndex === 0}
                            onClick={() => staysArray.swap(stayIndex, stayIndex - 1)}
                            title="Move Stay Up"
                          >
                            <MoveUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={stayIndex === staysArray.fields.length - 1}
                            onClick={() => staysArray.swap(stayIndex, stayIndex + 1)}
                            title="Move Stay Down"
                          >
                            <MoveDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => staysArray.remove(stayIndex)}
                            title="Remove Stay"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Stay Card Body */}
                      {!isCollapsed && (
                        <StayCardBody
                          register={register}
                          stayIndex={stayIndex}
                          setValue={setValue}
                          watch={watch}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Part 5B: Package Investment & Pricing Breakdown */}
          <Card>
            <CardHeader className="border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  5B. Total Investment &amp; Pricing Breakdown
                </CardTitle>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary tabular-nums">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total:</span>
                  <span>{watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => priceItemsArray.append({ label: "", amount: 0 })}
                className="h-8"
                data-testid="button-add-price-item"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Line Item
              </Button>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Currency & Tax Configuration Bar */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Proposal Currency */}
                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="font-medium text-xs flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                      Proposal Currency
                    </Label>
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="currency" className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹) — Indian Rupee</SelectItem>
                            <SelectItem value="USD">USD ($) — US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR (€) — Euro</SelectItem>
                            <SelectItem value="GBP">GBP (£) — British Pound</SelectItem>
                            <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* GST & TAX Toggle */}
                  <div className="space-y-1.5">
                    <Label className="font-medium text-xs block">
                      GST &amp; Taxes Option
                    </Label>
                    <div className="flex items-center h-9">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium">
                        <Checkbox
                          checked={Boolean(watchedPricing?.showTaxes)}
                          onCheckedChange={(checked) => {
                            setValue("pricing.showTaxes", !!checked, { shouldDirty: true });
                            if (checked && !watchedPricing?.taxRate) {
                              setValue("pricing.taxRate", 5, { shouldDirty: true });
                              setValue("pricing.taxType", "percentage", { shouldDirty: true });
                              setValue("pricing.taxLabel", "5% GST", { shouldDirty: true });
                            }
                          }}
                        />
                        <span>Display GST &amp; Taxes in Proposal / PDF</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Expanded GST & TAX Options when enabled */}
                {watchedPricing?.showTaxes && (
                  <div className="pt-3 border-t border-border/60 space-y-3 bg-background/60 p-3 rounded-md">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Tax Rate / Type */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">GST Rate / Amount</Label>
                        <div className="flex items-center gap-1.5">
                          {watchedPricing?.taxType === "fixed" ? (
                            <Input
                              type="number"
                              min="0"
                              value={watchedPricing?.taxes || 0}
                              onChange={(e) =>
                                setValue("pricing.taxes", Number(e.target.value) || 0, { shouldDirty: true })
                              }
                              placeholder="0"
                              className="h-8 text-xs bg-background"
                            />
                          ) : (
                            <div className="relative flex-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={watchedPricing?.taxRate ?? 5}
                                onChange={(e) => {
                                  const rate = Number(e.target.value) || 0;
                                  setValue("pricing.taxRate", rate, { shouldDirty: true });
                                  setValue("pricing.taxLabel", `${rate}% GST`, { shouldDirty: true });
                                }}
                                className="h-8 text-xs bg-background pr-6"
                              />
                              <span className="absolute right-2 top-2 text-xs text-muted-foreground">%</span>
                            </div>
                          )}
                          <Select
                            value={watchedPricing?.taxType || "percentage"}
                            onValueChange={(val: "percentage" | "fixed") => {
                              setValue("pricing.taxType", val, { shouldDirty: true });
                              if (val === "percentage") {
                                setValue("pricing.taxRate", 5, { shouldDirty: true });
                                setValue("pricing.taxLabel", "5% GST", { shouldDirty: true });
                              } else {
                                setValue("pricing.taxLabel", "GST & Taxes", { shouldDirty: true });
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-24 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tax Label */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Display Label on PDF</Label>
                        <Input
                          value={watchedPricing?.taxLabel || "5% GST"}
                          onChange={(e) =>
                            setValue("pricing.taxLabel", e.target.value, { shouldDirty: true })
                          }
                          placeholder="e.g. 5% GST"
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      {/* Tax Mode: Added to Subtotal vs Included in Quote */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Calculation Mode</Label>
                        <Select
                          value={watchedPricing?.taxInclusive ? "inclusive" : "exclusive"}
                          onValueChange={(val) =>
                            setValue("pricing.taxInclusive", val === "inclusive", { shouldDirty: true })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exclusive">Add to Subtotal (+ GST)</SelectItem>
                            <SelectItem value="inclusive">Included in Quote (GST included)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Quick Preset Buttons for GST */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                      <span className="font-medium">Quick Rates:</span>
                      {[
                        { label: "5% GST (Tour Package)", rate: 5 },
                        { label: "12% GST", rate: 12 },
                        { label: "18% GST (Hotel/Services)", rate: 18 },
                      ].map((preset) => (
                        <button
                          key={preset.rate}
                          type="button"
                          onClick={() => {
                            setValue("pricing.taxType", "percentage", { shouldDirty: true });
                            setValue("pricing.taxRate", preset.rate, { shouldDirty: true });
                            setValue("pricing.taxLabel", `${preset.rate}% GST`, { shouldDirty: true });
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors",
                            watchedPricing?.taxType !== "fixed" && watchedPricing?.taxRate === preset.rate
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted text-foreground border-border"
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Line items list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground px-1">
                  <span>Component / Item Label</span>
                  <span className="w-48 text-right">Amount ({watchedCurrency})</span>
                </div>

                {priceItemsArray.fields.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-md">
                    <p className="text-xs text-muted-foreground">No pricing line items added yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => priceItemsArray.append({ label: "Total Package Investment", amount: 0 })}
                      className="mt-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Package Price
                    </Button>
                  </div>
                ) : (
                  priceItemsArray.fields.map((field, i) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        {...register(`pricing.items.${i}.label` as const, { required: true })}
                        placeholder="e.g. Deluxe Resorts & Chauffeur Package"
                        className="flex-1 text-sm"
                      />
                      <div className="relative w-44">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                          {watchedCurrency === "INR" ? "₹" : watchedCurrency}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          {...register(`pricing.items.${i}.amount` as const, { valueAsNumber: true })}
                          placeholder="0"
                          className="pl-8 text-right"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        disabled={i === 0}
                        onClick={() => priceItemsArray.swap(i, i - 1)}
                        title="Move Up"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        disabled={i === priceItemsArray.fields.length - 1}
                        onClick={() => priceItemsArray.swap(i, i + 1)}
                        title="Move Down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => priceItemsArray.remove(i)}
                        title="Remove line item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Notes */}
              <div className="pt-4 border-t border-border space-y-1.5">
                <Label htmlFor="pricingNotes" className="font-medium text-xs">
                  Pricing Notes &amp; Quote Validity
                </Label>
                <Input
                  id="pricingNotes"
                  {...register("pricing.notes")}
                  placeholder="e.g. Price valid for travel completed before March 31, 2027."
                />
              </div>

              {/* Summary Calculation Box */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Line Items Subtotal:</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                    {subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {watchedPricing?.showTaxes && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {watchedPricing.taxLabel || "GST & Taxes"}
                      {watchedPricing.taxInclusive ? " (Included in Quote)" : " (Added to Subtotal)"}:
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {watchedPricing.taxInclusive ? "" : "+ "}
                      {watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                      {calculatedTaxAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-primary/20 font-serif">
                  <span className="text-base font-semibold text-foreground">Total Proposal Investment:</span>
                  <span className="text-2xl font-bold text-primary tabular-nums">
                    {watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                    {total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION 6: TERMS & CONDITIONS (Hotel, Payment & Important Info)
        ============================================================ */}
        <section id="section-terms" className="scroll-mt-24 space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                6. Terms, Policies &amp; Important Information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                These 3 policy categories are rendered on dedicated dark-banner sections in the PDF dossier matching official Escora travel standards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* 6A: Accommodation Terms & Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    <Label className="font-medium text-sm">Accommodation Terms &amp; Conditions ({watchedHotelTerms.length})</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => resetToDefaults("hotelTerms")}
                      className="text-xs h-7 text-muted-foreground"
                      title="Reset standard accommodation terms"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openBulkEdit("hotelTerms")}
                      className="text-xs h-7 text-muted-foreground"
                    >
                      Paste / Bulk
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTerm("hotelTerms")}
                      className="text-xs h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Term
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border rounded-md p-3 bg-muted/10 min-h-[140px]">
                  {watchedHotelTerms.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No accommodation terms added. Click &ldquo;Reset&rdquo; to populate standard terms.
                    </p>
                  ) : (
                    watchedHotelTerms.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-primary font-bold text-xs flex-shrink-0">▪</span>
                        <Input
                          value={item}
                          onChange={(e) => updateTerm("hotelTerms", idx, e.target.value)}
                          placeholder="e.g. Children below 12 years are considered children..."
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === 0}
                          onClick={() => moveTerm("hotelTerms", idx, "up")}
                          title="Move Up"
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === watchedHotelTerms.length - 1}
                          onClick={() => moveTerm("hotelTerms", idx, "down")}
                          title="Move Down"
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTerm("hotelTerms", idx)}
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 6B: Payment Terms & Conditions */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <Label className="font-medium text-sm">Payment Terms &amp; Conditions ({watchedPaymentTerms.length})</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => resetToDefaults("paymentTerms")}
                      className="text-xs h-7 text-muted-foreground"
                      title="Reset standard payment terms"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openBulkEdit("paymentTerms")}
                      className="text-xs h-7 text-muted-foreground"
                    >
                      Paste / Bulk
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTerm("paymentTerms")}
                      className="text-xs h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Term
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border rounded-md p-3 bg-muted/10 min-h-[100px]">
                  {watchedPaymentTerms.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No payment terms added. Click &ldquo;Reset&rdquo; to populate standard terms.
                    </p>
                  ) : (
                    watchedPaymentTerms.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-primary font-bold text-xs flex-shrink-0">▪</span>
                        <Input
                          value={item}
                          onChange={(e) => updateTerm("paymentTerms", idx, e.target.value)}
                          placeholder="e.g. Any payment delays may lead to the cancellation of the booking..."
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === 0}
                          onClick={() => moveTerm("paymentTerms", idx, "up")}
                          title="Move Up"
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === watchedPaymentTerms.length - 1}
                          onClick={() => moveTerm("paymentTerms", idx, "down")}
                          title="Move Down"
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTerm("paymentTerms", idx)}
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 6C: Important Information */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <Label className="font-medium text-sm">Important Information &amp; Travel Guidelines ({watchedImportantInfo.length})</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => resetToDefaults("importantInfo")}
                      className="text-xs h-7 text-muted-foreground"
                      title="Reset standard important guidelines"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openBulkEdit("importantInfo")}
                      className="text-xs h-7 text-muted-foreground"
                    >
                      Paste / Bulk
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTerm("importantInfo")}
                      className="text-xs h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Guideline
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border rounded-md p-3 bg-muted/10 min-h-[140px]">
                  {watchedImportantInfo.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No important guidelines added. Click &ldquo;Reset&rdquo; to populate standard guidelines.
                    </p>
                  ) : (
                    watchedImportantInfo.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-primary font-bold text-xs flex-shrink-0">▪</span>
                        <Input
                          value={item}
                          onChange={(e) => updateTerm("importantInfo", idx, e.target.value)}
                          placeholder="e.g. Ensure your travel insurance covers medical emergencies..."
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === 0}
                          onClick={() => moveTerm("importantInfo", idx, "up")}
                          title="Move Up"
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === watchedImportantInfo.length - 1}
                          onClick={() => moveTerm("importantInfo", idx, "down")}
                          title="Move Down"
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTerm("importantInfo", idx)}
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION 7: STATUS, PUBLISHING & PDF DOSSIER
        ============================================================ */}
        <section id="section-publishing" className="scroll-mt-24">
          <Card className="border border-border shadow-xs">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  7. Status, Publishing &amp; Concierge
                </CardTitle>
                <span className="text-xs font-sans font-medium text-muted-foreground hidden sm:inline">
                  Step 7 of 7 · Proposal Finalization
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Configure proposal visibility, dedicated journey curator contacts, and perform pre-flight verification before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Status and Curator & Concierge */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Proposal Status Selection */}
                  <div className="space-y-3">
                    <Label className="font-medium text-xs">Proposal Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                                <span>Draft (Internal — Inaccessible to guests)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="shared">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Shared (Active — Viewable via client link)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="confirmed">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Confirmed (Accepted &amp; Confirmed booking)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    <div className="text-xs text-muted-foreground space-y-1">
                      {watchedStatus === "draft" && (
                        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-amber-700 dark:text-amber-400 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                          <div>
                            <span className="font-semibold block">Draft Mode (Private)</span>
                            <span className="text-[11px] leading-relaxed block text-amber-700/90 dark:text-amber-400/90">
                              Client public links return a 404 error until status is changed to &apos;Shared&apos; or &apos;Confirmed&apos;. Only authenticated admin staff can preview this itinerary proposal.
                            </span>
                          </div>
                        </div>
                      )}
                      {watchedStatus === "shared" && (
                        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3 text-blue-700 dark:text-blue-400 flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                          <div>
                            <span className="font-semibold block">Shared Mode (Active Link)</span>
                            <span className="text-[11px] leading-relaxed block text-blue-700/90 dark:text-blue-400/90">
                              The proposal is published. Guests can view the responsive presentation online, inspect day-by-day plans and resort stays, and proceed to booking/payment via WhatsApp.
                            </span>
                          </div>
                        </div>
                      )}
                      {watchedStatus === "confirmed" && (
                        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                          <div>
                            <span className="font-semibold block">Confirmed Booking</span>
                            <span className="text-[11px] leading-relaxed block text-emerald-700/90 dark:text-emerald-400/90">
                              Proposal has been confirmed and accepted. The itinerary serves as the official client trip dossier and booking reference.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Journey Curator & 24/7 Concierge Contacts */}
                  <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                    <div>
                      <h4 className="font-serif text-sm font-semibold flex items-center gap-2 text-foreground">
                        <UserCheck className="h-4 w-4 text-primary" />
                        Dedicated Journey Curator &amp; 24/7 Concierge
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        These contacts appear on client web itineraries, downloadable PDFs, and confirmation emails.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="step7-curatorName" className="font-medium text-xs flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          Curator Name
                        </Label>
                        <Input
                          id="step7-curatorName"
                          value={watchedCuratorName}
                          onChange={(e) => {
                            userHasEditedRef.current = true;
                            setValue("curatorName", e.target.value, { shouldDirty: true });
                          }}
                          placeholder="e.g. Midhilaj Chelakkal"
                          className="bg-background text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="step7-curatorPhone" className="font-medium text-xs flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          Curator Phone / WhatsApp
                        </Label>
                        <Input
                          id="step7-curatorPhone"
                          value={watchedCuratorPhone}
                          onChange={(e) => {
                            userHasEditedRef.current = true;
                            setValue("curatorPhone", e.target.value, { shouldDirty: true });
                          }}
                          placeholder="e.g. +91 75929 98800"
                          className="bg-background text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="step7-emergencyContacts" className="font-medium text-xs flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                          24/7 Escora Guest Concierge &amp; Helpline
                        </Label>
                        <Input
                          id="step7-emergencyContacts"
                          value={watchedEmergencyContacts}
                          onChange={(e) => {
                            userHasEditedRef.current = true;
                            setValue("emergencyContacts", e.target.value, { shouldDirty: true });
                          }}
                          placeholder="e.g. 24/7 Escora Guest Concierge: +91 75929 98800"
                          className="bg-background text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Pre-Flight Summary & Verification */}
                <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
                  <div className="space-y-5">
                    {/* Pre-Flight Proposal Summary Card */}
                    <div className="rounded-lg border border-border bg-card p-4 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="font-serif text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-primary" />
                          Proposal Overview
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                          {watchedStatus}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-muted-foreground shrink-0">Client:</span>
                          <span className="font-medium text-foreground text-right truncate">
                            {watchedCustomerName || "—"}
                          </span>
                        </div>
                        {(watchedCustomerPhone || watchedCustomerEmail) && (
                          <div className="flex justify-between items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Contact:</span>
                            <span className="truncate text-right">
                              {watchedCustomerPhone} {watchedCustomerEmail ? `(${watchedCustomerEmail})` : ""}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-muted-foreground shrink-0">Destination:</span>
                          <span className="font-medium text-foreground text-right truncate">
                            {watchedDestination || "Kerala & Beyond"}
                          </span>
                        </div>
                        {calculatedDuration && (
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium text-foreground">{calculatedDuration}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
                          <div className="rounded bg-muted/40 p-2">
                            <span className="text-[10px] text-muted-foreground block uppercase font-medium">Days</span>
                            <span className="font-serif text-sm font-semibold text-foreground">{watchedDays.length}</span>
                          </div>
                          <div className="rounded bg-muted/40 p-2">
                            <span className="text-[10px] text-muted-foreground block uppercase font-medium">Stays</span>
                            <span className="font-serif text-sm font-semibold text-foreground">{watchedStays.length}</span>
                          </div>
                          <div className="rounded bg-muted/40 p-2">
                            <span className="text-[10px] text-muted-foreground block uppercase font-medium">Inclusions</span>
                            <span className="font-serif text-sm font-semibold text-foreground">{watchedInclusions.length}</span>
                          </div>
                        </div>

                        {/* Total Investment Display */}
                        <div className="pt-2.5 border-t border-border/80 flex items-baseline justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Total Investment:</span>
                          <span className="font-serif text-lg font-bold text-primary tabular-nums">
                            {watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                            {total.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pre-Save Verification Checklist */}
                    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2.5">
                      <span className="text-xs font-semibold text-foreground block">
                        Pre-Save Quality Checklist
                      </span>
                      <div className="space-y-1.5">
                        {verificationChecks.map((chk, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-0.5">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              {chk.passed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              ) : chk.optional ? (
                                <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              )}
                              <span>{chk.label}</span>
                            </span>
                            <span
                              className={`text-[11px] truncate max-w-[150px] text-right ${
                                chk.passed
                                  ? "text-emerald-700 dark:text-emerald-400 font-medium"
                                  : chk.optional
                                  ? "text-muted-foreground"
                                  : "text-amber-600 dark:text-amber-400 font-medium"
                              }`}
                            >
                              {chk.hint}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step Navigation & Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmittingRef.current || createMutation.isPending || updateMutation.isPending}
                      className="w-full h-10 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2"
                      data-testid="button-submit-itinerary-bottom"
                    >
                      {isSubmittingRef.current || createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving Proposal...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>{isEdit ? "Save Changes" : "Create Proposal ✨"}</span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => scrollToSection("section-terms")}
                        className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back to Terms
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </form>

      {/* Discard Unsaved Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg">Discard Unsaved Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in this itinerary proposal. If you leave now, your edits will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiscardDialog(false);
                if (pendingNavigation) {
                  navigate(pendingNavigation);
                  setPendingNavigation(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Terms Edit Modal */}
      <Dialog open={bulkTermsModal !== null} onOpenChange={(open) => !open && setBulkTermsModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg capitalize">
              Paste or Edit {bulkTermsModal}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              rows={10}
              value={bulkTermsText}
              onChange={(e) => setBulkTermsText(e.target.value)}
              placeholder="Airport transfers in private A/C Innova Crysta&#10;Daily buffet breakfast&#10;Periyar boat safari tickets"
              className="font-sans text-xs leading-relaxed"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkTermsModal(null)}>
              Cancel
            </Button>
            <Button onClick={applyBulkEdit}>Apply Items</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Preset Checkbox Options Modal */}
      <Dialog
        open={managePresetsModal !== null}
        onOpenChange={(open) => !open && setManagePresetsModal(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-2 border-b">
            <div className="flex items-center gap-2">
              <CheckSquare
                className={cn(
                  "h-5 w-5",
                  managePresetsModal === "inclusions" ? "text-emerald-600" : "text-destructive"
                )}
              />
              <DialogTitle className="font-serif text-lg">
                Manage Common {managePresetsModal === "inclusions" ? "Inclusions" : "Exclusions"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Customize the prefilled checkboxes available when composing itineraries. Changes are saved to your browser so they remain available for future itineraries.
            </DialogDescription>
          </DialogHeader>

          {/* Tab Selector: List View vs Bulk Paste */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md text-xs">
              <button
                type="button"
                onClick={() => setModalTab("list")}
                className={cn(
                  "px-3 py-1 rounded font-medium transition-colors",
                  modalTab === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Item List ({modalPresetsList.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalBulkText(modalPresetsList.join("\n"));
                  setModalTab("bulk");
                }}
                className={cn(
                  "px-3 py-1 rounded font-medium transition-colors",
                  modalTab === "bulk"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bulk Paste / Edit
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetPresetsModalToDefaults}
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
              title="Restore standard default options"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Defaults
            </Button>
          </div>

          {modalTab === "list" ? (
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-[260px] max-h-[380px]">
              {/* Add New Option at Top */}
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border">
                <Input
                  value={modalNewItemText}
                  onChange={(e) => setModalNewItemText(e.target.value)}
                  placeholder={`+ Add new common ${managePresetsModal === "inclusions" ? "inclusion" : "exclusion"}...`}
                  className="h-8 text-xs bg-background flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddModalPresetItem();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddModalPresetItem}
                  disabled={!modalNewItemText.trim()}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                {modalPresetsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No options in this list. Add one above or click Reset Defaults.
                  </p>
                ) : (
                  modalPresetsList.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 rounded-md border border-border/70 bg-card hover:border-border transition-colors"
                    >
                      <span className="text-[11px] font-mono text-muted-foreground/60 w-5 text-right flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const updated = [...modalPresetsList];
                          updated[idx] = e.target.value;
                          setModalPresetsList(updated);
                        }}
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        disabled={idx === 0}
                        onClick={() => {
                          const updated = [...modalPresetsList];
                          const temp = updated[idx - 1];
                          updated[idx - 1] = updated[idx];
                          updated[idx] = temp;
                          setModalPresetsList(updated);
                        }}
                        title="Move Up"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        disabled={idx === modalPresetsList.length - 1}
                        onClick={() => {
                          const updated = [...modalPresetsList];
                          const temp = updated[idx + 1];
                          updated[idx + 1] = updated[idx];
                          updated[idx] = temp;
                          setModalPresetsList(updated);
                        }}
                        title="Move Down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const updated = [...modalPresetsList];
                          updated.splice(idx, 1);
                          setModalPresetsList(updated);
                        }}
                        title="Delete option"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 py-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                Paste or type one option per line. Each line becomes a prefilled checkbox.
              </p>
              <Textarea
                rows={12}
                value={modalBulkText}
                onChange={(e) => setModalBulkText(e.target.value)}
                placeholder="Daily gourmet breakfast at all hotels and resorts&#10;Private dedicated chauffeur-driven AC vehicle"
                className="font-sans text-xs leading-relaxed"
              />
            </div>
          )}

          <DialogFooter className="gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setManagePresetsModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveManagePresetsModal}>
              Save Options
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase 3B: AI Itinerary Assistant Modal */}
      <AiItineraryAssistantModal
        isOpen={showAiModal}
        onClose={handleCloseAiModal}
        onApplyDraft={handleApplyAiDraft}
        initialEnquiryId={aiEnquiryId}
        currentFormData={{
          customerName: watch("customerName"),
          customerEmail: watch("customerEmail"),
          customerPhone: watch("customerPhone"),
          destination: watch("destination"),
          startDate: watch("startDate"),
          endDate: watch("endDate"),
          title: watch("title"),
          summary: watch("summary"),
          days: watchedDays,
          stays: watchedStays,
          inclusions: watchedInclusions,
          exclusions: watchedExclusions,
        }}
        isEdit={isEdit}
      />
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: DAY CARD BODY
// -------------------------------------------------------------
function DayCardBody({
  control,
  register,
  dayIndex,
  tripStartDate,
  tripEndDate,
  setValue,
  watch,
}: {
  control: any;
  register: any;
  dayIndex: number;
  tripStartDate?: string;
  tripEndDate?: string;
  setValue?: any;
  watch?: any;
}) {
  const watchedImageUrl = watch ? watch(`days.${dayIndex}.imageUrl`) : undefined;
  const watchedImageUrls = watch ? watch(`days.${dayIndex}.imageUrls`) : undefined;

  const photoList: string[] = useMemo(() => {
    if (Array.isArray(watchedImageUrls) && watchedImageUrls.length > 0) {
      return watchedImageUrls.map((s: any) => String(s || "").trim()).filter(Boolean);
    }
    if (watchedImageUrl && typeof watchedImageUrl === "string" && watchedImageUrl.trim()) {
      return [watchedImageUrl.trim()];
    }
    return [];
  }, [watchedImageUrl, watchedImageUrls]);

  const photo0 = photoList[0] || "";
  const photo1 = photoList[1] || "";
  const photo2 = photoList[2] || "";

  const handlePhotoUpdate = (slotIndex: number, newUrl: string) => {
    const current = [photo0, photo1, photo2];
    current[slotIndex] = (newUrl || "").trim();
    const compacted = current.filter(Boolean).slice(0, 3);

    if (setValue) {
      setValue(`days.${dayIndex}.imageUrls`, compacted, { shouldDirty: true, shouldValidate: true });
      setValue(`days.${dayIndex}.imageUrl`, compacted[0] || "", { shouldDirty: true, shouldValidate: true });
    }
  };



  return (
    <div className="p-4 space-y-4">
      {/* Day Basic Fields */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs font-medium">Day Title *</Label>
            <Input
              {...register(`days.${dayIndex}.title` as const, { required: true })}
              placeholder="e.g. Arrival in Trivandrum — Heritage Walk & Kovalam Beach"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Travel Date</Label>
            <Input type="date" {...register(`days.${dayIndex}.date` as const)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Day Overview / Narrative</Label>
            <span className="text-[10.5px] text-muted-foreground font-medium">
              Rich Text &amp; Formatting Toolbar
            </span>
          </div>
          {control ? (
            <Controller
              control={control}
              name={`days.${dayIndex}.description` as const}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Describe the day's journey, scenic drives, cultural stops, and evening leisure with rich formatting..."
                  minHeight="140px"
                />
              )}
            />
          ) : (
            <RichTextEditor
              value={watch ? watch(`days.${dayIndex}.description`) : ""}
              onChange={(val) =>
                setValue &&
                setValue(`days.${dayIndex}.description`, val, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              placeholder="Describe the day's journey, scenic drives, cultural stops, and evening leisure with rich formatting..."
              minHeight="140px"
            />
          )}
        </div>
      </div>

      {/* Up to 3 Day Photos Section */}
      <div className="space-y-2.5 p-3.5 bg-muted/20 rounded-md border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Images className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Day Photos (Up to 3 Photos — Arranged Side-by-Side in PDF)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-mono">
              {photoList.length} of 3 photos added
            </span>
            {photoList.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                {photoList.length === 1 ? "1 Full Width" : `${photoList.length} Side-by-Side`}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-normal">
          Upload up to 3 destination or activity photos. Photos maintain their optimal visual ratio with centered cropping and render in a balanced horizontal row without distorting or shifting the PDF layout.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Photo Slot 1 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground">
                Photo 1 <span className="text-primary font-semibold">(Primary / Cover)</span>
              </span>
              {photo0 ? (
                <Badge variant="outline" className="text-[9px] py-0 px-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                  Active
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground italic">Required for cover</span>
              )}
            </div>
            <ImageUploadField
              value={photo0}
              onChange={(url) => handlePhotoUpdate(0, url)}
              label="Day Photo 1"
              size="compact"
              helperText="Main featured photo for Day."
            />
          </div>

          {/* Photo Slot 2 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground">
                Photo 2 <span className="text-muted-foreground font-normal">(Optional)</span>
              </span>
              {photo1 ? (
                <Badge variant="outline" className="text-[9px] py-0 px-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                  Active
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground italic">Optional</span>
              )}
            </div>
            <ImageUploadField
              value={photo1}
              onChange={(url) => handlePhotoUpdate(1, url)}
              label="Day Photo 2"
              size="compact"
              helperText="Side-by-side gallery photo."
            />
          </div>

          {/* Photo Slot 3 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground">
                Photo 3 <span className="text-muted-foreground font-normal">(Optional)</span>
              </span>
              {photo2 ? (
                <Badge variant="outline" className="text-[9px] py-0 px-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                  Active
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground italic">Optional</span>
              )}
            </div>
            <ImageUploadField
              value={photo2}
              onChange={(url) => handlePhotoUpdate(2, url)}
              label="Day Photo 3"
              size="compact"
              helperText="Side-by-side gallery photo."
            />
          </div>
        </div>
      </div>

    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: STAY CARD BODY
// -------------------------------------------------------------
function StayCardBody({
  register,
  stayIndex,
  setValue,
  watch,
}: {
  register: any;
  stayIndex: number;
  setValue?: any;
  watch?: any;
}) {
  const currentRating = watch ? watch(`stays.${stayIndex}.starRating`) : undefined;

  return (
    <div className="p-4 space-y-4">
      {/* Row 1: Name, Rating & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 space-y-1">
          <Label className="text-xs font-medium">Accommodation Name *</Label>
          <Input
            {...register(`stays.${stayIndex}.name` as const, { required: true })}
            placeholder="e.g. Fragrant Nature Resort & Spa"
          />
        </div>
        <div className="sm:col-span-3 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              Accommodation Rating
            </Label>
            <div className="flex items-center gap-1">
              {["5★", "4★", "3★"].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setValue &&
                    setValue(`stays.${stayIndex}.starRating`, `${star.replace("★", "")} Star`, {
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    "text-[10px] px-1 py-0.2 rounded cursor-pointer transition-colors",
                    currentRating?.startsWith(star.replace("★", ""))
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-semibold"
                      : "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  )}
                  title={`Set to ${star.replace("★", "")} Star`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>
          <Input
            {...register(`stays.${stayIndex}.starRating` as const)}
            placeholder="e.g. 5 Star"
            list="star-ratings-list"
          />
          <datalist id="star-ratings-list">
            <option value="5 Star" />
            <option value="5 Star Deluxe" />
            <option value="5 Star Luxury" />
            <option value="4 Star" />
            <option value="4 Star Premium" />
            <option value="3 Star" />
            <option value="Luxury Heritage" />
            <option value="Premium Boutique" />
            <option value="Luxury Houseboat" />
          </datalist>
        </div>
        <div className="sm:col-span-3 space-y-1">
          <Label className="text-xs font-medium">Destination / Location</Label>
          <Input
            {...register(`stays.${stayIndex}.location` as const)}
            placeholder="e.g. Munnar, Kerala"
          />
        </div>
      </div>

      {/* Row 2: Nights, Rooms, Meal Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium">No. of Nights</Label>
          <Input
            type="number"
            min="1"
            {...register(`stays.${stayIndex}.nights` as const, { valueAsNumber: true })}
            placeholder="1"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">No. of Rooms</Label>
          <Input
            type="number"
            min="1"
            {...register(`stays.${stayIndex}.rooms` as const, { valueAsNumber: true })}
            placeholder="1"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Meal Plan</Label>
          <Input
            {...register(`stays.${stayIndex}.mealPlan` as const)}
            placeholder="e.g. BreakFast"
          />
        </div>
      </div>
    </div>
  );
}
