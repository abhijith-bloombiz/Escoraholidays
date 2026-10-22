import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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
  RefreshCw,
  CheckCircle2,
  UserCheck,
  Phone,
  User,
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
  DEFAULT_TRIP_INCLUDES,
  DEFAULT_AGENCY_CONTACT,
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
  adults: number;
  children: number;
  infants: number;
  hotelIncluded: boolean;
  transportIncluded: boolean;
  sightseeingIncluded: boolean;
  transferIncluded: boolean;
  transportOrigin: string;
  transportDestination: string;
  transportVehicle: string;
  days: ItineraryDay[];
  stays: ItineraryStay[];
  pricing: ItineraryPricing;
  inclusions: string[];
  exclusions: string[];
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
  adults: 1,
  children: 0,
  infants: 0,
  hotelIncluded: true,
  transportIncluded: true,
  sightseeingIncluded: true,
  transferIncluded: true,
  transportOrigin: "ESCORA HOLIDAYS | Trivandrum, Keralam, India",
  transportDestination: "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
  transportVehicle: "Private Dedicated Chauffeur Driven AC Sedan / SUV",
  days: [],
  stays: [],
  pricing: { items: [], total: 0 },
  inclusions: [],
  exclusions: [],
};

export default function ItineraryBuilderPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const itineraryId = params.id ? Number(params.id) : undefined;

  const { data: existing, isLoading } = useGetItinerary(itineraryId!, {
    query: { enabled: isEdit, queryKey: getGetItineraryQueryKey(itineraryId!) },
  });
  const createMutation = useCreateItinerary();
  const updateMutation = useUpdateItinerary();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<BuilderForm>({
    defaultValues: emptyForm,
  });

  const [templateChoice, setTemplateChoice] = useState<"blank" | string | null>(isEdit ? "blank" : null);
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

  // Collapsible days and stays state
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});
  const [collapsedStays, setCollapsedStays] = useState<Record<number, boolean>>({});

  // Bulk edit modal state for inclusions & exclusions
  const [bulkTermsModal, setBulkTermsModal] = useState<"inclusions" | "exclusions" | null>(null);
  const [bulkTermsText, setBulkTermsText] = useState("");

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
  const watchedDays = watch("days") ?? [];
  const watchedStays = watch("stays") ?? [];
  const watchedCustomerName = watch("customerName");
  const watchedCustomerEmail = watch("customerEmail");
  const watchedCustomerPhone = watch("customerPhone");
  const watchedDestination = watch("destination");

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

  // Load existing itinerary data into form
  useEffect(() => {
    if (existing) {
      const tripInc = parseTripIncludes(existing.tripIncludes);
      const transport = parseTransportation(existing.transportation);
      const hTerms = parseStringList(existing.hotelTerms);
      const pTerms = parseStringList(existing.paymentTerms);
      const iInfo = parseStringList(existing.importantInfo);

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
        referenceNumber: existing.referenceNumber ?? "",
        curatorName: existing.curatorName ?? DEFAULT_AGENCY_CONTACT.curatorName,
        curatorPhone: existing.curatorPhone ?? DEFAULT_AGENCY_CONTACT.curatorPhone,
        emergencyContacts: existing.emergencyContacts ?? DEFAULT_AGENCY_CONTACT.emergencyContacts,
        adults: existing.adults ?? 1,
        children: existing.children ?? 0,
        infants: existing.infants ?? 0,
        hotelIncluded: tripInc.hotel,
        transportIncluded: tripInc.transport,
        sightseeingIncluded: tripInc.sightseeing,
        transferIncluded: tripInc.transfer,
        transportOrigin: transport?.origin ?? "ESCORA HOLIDAYS | Trivandrum, Keralam, India",
        transportDestination: transport?.destination ?? "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
        transportVehicle: transport?.vehicleType ?? "Private AC Vehicle",
        days: parseDays(existing.days),
        stays: parseStays(existing.stays),
        pricing: parsePricing(existing.pricing),
        inclusions: parseStringList(existing.inclusions),
        exclusions: parseStringList(existing.exclusions),
      });
    }
  }, [existing, reset]);

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
      }
    } else if (linkedEnqParam) {
      const parsedLinkedId = Number(linkedEnqParam);
      if (!Number.isNaN(parsedLinkedId)) {
        setLinkedEnquiryId(parsedLinkedId);
        setAiEnquiryId(parsedLinkedId);
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
      roomType: s.roomType || "Heritage Suite",
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

    const total = computePricingTotal(form.pricing);
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
      curatorName: form.curatorName?.trim() || undefined,
      curatorPhone: form.curatorPhone?.trim() || undefined,
      emergencyContacts: form.emergencyContacts?.trim() || undefined,
      adults: form.adults ?? 1,
      children: form.children ?? 0,
      infants: form.infants ?? 0,
      days: JSON.stringify(form.days.map((d, i) => ({ ...d, day: i + 1 }))),
      stays: JSON.stringify(form.stays),
      pricing: JSON.stringify({ ...form.pricing, total }),
      inclusions: JSON.stringify((form.inclusions || []).map((s) => s.trim()).filter(Boolean)),
      exclusions: JSON.stringify((form.exclusions || []).map((s) => s.trim()).filter(Boolean)),
      tripIncludes: JSON.stringify({
        hotel: form.hotelIncluded,
        transport: form.transportIncluded,
        sightseeing: form.sightseeingIncluded,
        transfer: form.transferIncluded,
      }),
      transportation: JSON.stringify({
        origin: form.transportOrigin,
        destination: form.transportDestination,
        vehicleType: form.transportVehicle,
      }),
      hotelTerms: (existing as any)?.hotelTerms ?? JSON.stringify(DEFAULT_HOTEL_TERMS),
      paymentTerms: (existing as any)?.paymentTerms ?? JSON.stringify(DEFAULT_PAYMENT_TERMS),
      importantInfo: (existing as any)?.importantInfo ?? JSON.stringify(DEFAULT_IMPORTANT_INFO),
      enquiryId: linkedEnquiryId ?? (existing as any)?.enquiryId ?? undefined,
    };

    isSubmittingRef.current = true;

    if (isEdit && itineraryId) {
      updateMutation.mutate(
        { id: itineraryId, data },
        {
          onSuccess: () => {
            isSubmittingRef.current = false;
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
            invalidate();
            toast({
              title: "Proposal created successfully",
              description: `Reference: ${created.shareToken.slice(0, 8).toUpperCase()}`,
            });
            if (returnToInboxEnquiryId) {
              navigate(`/enquiries?viewEnquiry=${returnToInboxEnquiryId}&createdProposalId=${created.id}`);
            } else {
              navigate("/itineraries/create");
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
    const returnTarget = returnToInboxEnquiryId ? `/enquiries?viewEnquiry=${returnToInboxEnquiryId}` : "/itineraries/create";
    if (isDirty) {
      setPendingNavigation(returnTarget);
      setShowDiscardDialog(true);
    } else {
      navigate(returnTarget);
    }
  }

  const [activeSection, setActiveSection] = useState<string>("section-details");

  // Track active section as user scrolls through the proposal editor
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sectionIds = [
      "section-details",
      "section-days",
      "section-stays",
      "section-terms",
      "section-pricing",
      "section-publishing",
    ];

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - 80) - Math.abs(b.boundingClientRect.top - 80)
          );
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -30% 0px",
        threshold: [0, 0.1, 0.3],
      }
    );

    elements.forEach((el) => observer.observe(el));

    // Handle scroll to highlight section 6 when scrolled near bottom of main container
    const handleScroll = () => {
      const main = document.querySelector("main");
      if (main) {
        const atBottom = main.scrollHeight - main.scrollTop - main.clientHeight < 60;
        if (atBottom) {
          setActiveSection("section-publishing");
        }
      }
    };

    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      observer.disconnect();
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  function scrollToSection(id: string) {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

  // Inclusion / Exclusion row helpers
  function addTerm(type: "inclusions" | "exclusions") {
    const current = type === "inclusions" ? watchedInclusions : watchedExclusions;
    setValue(type, [...current, ""], { shouldDirty: true });
  }

  function updateTerm(type: "inclusions" | "exclusions", index: number, value: string) {
    const current = [...(type === "inclusions" ? watchedInclusions : watchedExclusions)];
    current[index] = value;
    setValue(type, current, { shouldDirty: true });
  }

  function removeTerm(type: "inclusions" | "exclusions", index: number) {
    const current = [...(type === "inclusions" ? watchedInclusions : watchedExclusions)];
    current.splice(index, 1);
    setValue(type, current, { shouldDirty: true });
  }

  function moveTerm(type: "inclusions" | "exclusions", index: number, direction: "up" | "down") {
    const current = [...(type === "inclusions" ? watchedInclusions : watchedExclusions)];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const temp = current[index];
    current[index] = current[target];
    current[target] = temp;
    setValue(type, current, { shouldDirty: true });
  }

  function openBulkEdit(type: "inclusions" | "exclusions") {
    const current = type === "inclusions" ? watchedInclusions : watchedExclusions;
    setBulkTermsText(current.join("\n"));
    setBulkTermsModal(type);
  }

  function applyBulkEdit() {
    if (!bulkTermsModal) return;
    const lines = bulkTermsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    setValue(bulkTermsModal, lines, { shouldDirty: true });
    setBulkTermsModal(null);
    toast({ title: `Updated ${lines.length} ${bulkTermsModal}` });
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

  const total = computePricingTotal(watchedPricing ?? { items: [], total: 0 });

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
          <Button variant="ghost" size="icon" onClick={handleCancel}>
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
              if (isDirty) {
                setPendingNavigation("__change_template__");
                setShowDiscardDialog(true);
              } else {
                setTemplateChoice(null);
                reset(emptyForm);
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

        {/* Row 2: Six Workflow Steps */}
        <div className="pt-1.5 border-t border-border/50 w-full overflow-x-auto no-scrollbar">
          <nav
            aria-label="Itinerary proposal sections"
            className="flex items-center gap-1 sm:gap-1.5 min-w-max scroll-smooth"
          >
            {[
              { id: "section-details", num: 1, label: "Trip Details" },
              { id: "section-days", num: 2, label: "Days", count: daysArray.fields.length },
              { id: "section-stays", num: 3, label: "Stays", count: staysArray.fields.length },
              { id: "section-terms", num: 4, label: "Inclusions", count: watchedInclusions.length },
              { id: "section-pricing", num: 5, label: "Pricing", count: priceItemsArray.fields.length },
              { id: "section-publishing", num: 6, label: "Status & Save" },
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
            SECTION 1: TRIP & CUSTOMER DETAILS
        ============================================================ */}
        <section id="section-details" className="scroll-mt-24">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                1. Trip &amp; Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Row 1: Customer details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName" className="font-medium text-xs">
                    Customer Name *
                  </Label>
                  <Input
                    id="customerName"
                    {...register("customerName", { required: true })}
                    placeholder="e.g. Mr. & Mrs. Iyer"
                    data-testid="input-customer-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerEmail" className="font-medium text-xs">
                    Customer Email (Private)
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register("customerEmail")}
                    placeholder="client@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerPhone" className="font-medium text-xs">
                    Customer Phone (Private)
                  </Label>
                  <Input
                    id="customerPhone"
                    {...register("customerPhone")}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Row 2: Title & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="font-medium text-xs">
                    Itinerary Title *
                  </Label>
                  <Input
                    id="title"
                    {...register("title", { required: true })}
                    placeholder="e.g. 7 Nights Kerala — The Spice & Backwaters Escape"
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="destination" className="font-medium text-xs">
                    Destination Region
                  </Label>
                  <Input
                    id="destination"
                    {...register("destination")}
                    placeholder="e.g. Kerala, India"
                  />
                </div>
              </div>

              {/* Row 3: Travel Dates & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="font-medium text-xs">
                    Start Date
                  </Label>
                  <Input id="startDate" type="date" {...register("startDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="font-medium text-xs">
                    End Date
                  </Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="font-medium text-xs">
                    Proposal Currency
                  </Label>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="currency">
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
              </div>

              {/* Row 4: Cover photo */}
              <div className="space-y-1.5">
                <Label className="font-medium text-xs">Proposal Cover Photo</Label>
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
              </div>

              {/* Row 5: Summary */}
              <div className="space-y-1.5">
                <Label htmlFor="summary" className="font-medium text-xs">
                  Journey Overview &amp; Summary
                </Label>
                <Textarea
                  id="summary"
                  {...register("summary")}
                  rows={3}
                  placeholder="A route through Kochi's historic quarters, Munnar tea hills, and a backwater cruise in Alleppey."
                />
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

                          <Badge variant="secondary" className="text-[10px] hidden md:inline-flex">
                            {activitiesCount} {activitiesCount === 1 ? "activity" : "activities"}
                          </Badge>
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
            SECTION 3: ACCOMMODATION STAYS
        ============================================================ */}
        <section id="section-stays" className="scroll-mt-24">
          <Card>
            <CardHeader className="border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  3. Accommodation Stays ({staysArray.fields.length})
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
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
                  onClick={() =>
                    staysArray.append({
                      name: "",
                      location: "",
                      nights: 1,
                      roomType: "Deluxe Room",
                    })
                  }
                  className="h-8"
                  data-testid="button-add-stay"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Stay
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {staysArray.fields.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                  <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                  <p className="font-medium text-foreground text-sm">No stays added yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add resort, villa, or houseboat details for this itinerary.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => staysArray.append({ name: "", location: "", nights: 1 })}
                    className="mt-3"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add First Stay
                  </Button>
                </div>
              ) : (
                staysArray.fields.map((field, i) => {
                  const isCollapsed = Boolean(collapsedStays[i]);
                  const stayData = watchedStays[i] || {};

                  return (
                    <div
                      key={field.id}
                      data-testid={`stay-card-${i}`}
                      className="border border-border rounded-lg bg-card overflow-hidden shadow-xs transition-all hover:border-border/80"
                    >
                      {/* Stay Header */}
                      <div className="bg-muted/40 p-3.5 flex items-center justify-between gap-3 border-b border-border">
                        <div
                          className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                          onClick={() =>
                            setCollapsedStays((prev) => ({ ...prev, [i]: !prev[i] }))
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
                            Stay {i + 1}
                          </Badge>

                          <div className="font-medium text-sm text-foreground truncate max-w-md">
                            {stayData.name || <span className="text-muted-foreground italic">Untitled Hotel / Resort</span>}
                          </div>

                          {stayData.location && (
                            <span className="text-xs text-muted-foreground hidden sm:inline flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {stayData.location}
                            </span>
                          )}

                          {stayData.nights ? (
                            <Badge variant="secondary" className="text-[10px] hidden md:inline-flex">
                              {stayData.nights} {stayData.nights === 1 ? "Night" : "Nights"}
                            </Badge>
                          ) : null}
                        </div>

                        {/* Reorder and Delete */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={i === 0}
                            onClick={() => staysArray.swap(i, i - 1)}
                            title="Move Stay Up"
                          >
                            <MoveUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={i === staysArray.fields.length - 1}
                            onClick={() => staysArray.swap(i, i + 1)}
                            title="Move Stay Down"
                          >
                            <MoveDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => staysArray.remove(i)}
                            title="Remove Stay"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Stay Form Fields */}
                      {!isCollapsed && (
                        <StayCardBody
                          register={register}
                          stayIndex={i}
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
            SECTION 4: INCLUSIONS & EXCLUSIONS
        ============================================================ */}
        <section id="section-terms" className="scroll-mt-24">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                4. Inclusions &amp; Exclusions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Inclusions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <Label className="font-medium text-sm">Inclusions ({watchedInclusions.length})</Label>
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
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border rounded-md p-3 bg-muted/10 min-h-[160px]">
                  {watchedInclusions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No inclusions added yet. Click &ldquo;Add&rdquo; or paste a list.
                    </p>
                  ) : (
                    watchedInclusions.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-emerald-600 text-xs flex-shrink-0">✦</span>
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

              {/* Exclusions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">
                      ✕
                    </span>
                    <Label className="font-medium text-sm">Exclusions ({watchedExclusions.length})</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
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
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border rounded-md p-3 bg-muted/10 min-h-[160px]">
                  {watchedExclusions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No exclusions added yet. Click &ldquo;Add&rdquo; or paste a list.
                    </p>
                  ) : (
                    watchedExclusions.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs flex-shrink-0">✧</span>
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
            </CardContent>
          </Card>
        </section>

        {/* ============================================================
            SECTION 5: INVESTMENT & PRICING
        ============================================================ */}
        <section id="section-pricing" className="scroll-mt-24">
          <Card>
            <CardHeader className="border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  5. Investment &amp; Pricing
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

              {/* Discount, taxes and notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <Label htmlFor="pricingDiscount" className="font-medium text-xs">
                    Promotional Discount (Optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                      {watchedCurrency === "INR" ? "₹" : watchedCurrency}
                    </span>
                    <Input
                      id="pricingDiscount"
                      type="number"
                      min="0"
                      step="1"
                      {...register("pricing.discount", { valueAsNumber: true })}
                      placeholder="0"
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pricingTaxes" className="font-medium text-xs">
                    Taxes &amp; Statutory Fees (Optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                      {watchedCurrency === "INR" ? "₹" : watchedCurrency}
                    </span>
                    <Input
                      id="pricingTaxes"
                      type="number"
                      min="0"
                      step="1"
                      {...register("pricing.taxes", { valueAsNumber: true })}
                      placeholder="0"
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="pricingNotes" className="font-medium text-xs">
                  Pricing Notes &amp; Quote Validity
                </Label>
                <Input
                  id="pricingNotes"
                  {...register("pricing.notes")}
                  placeholder="e.g. Price valid for travel completed before March 31, 2027. 5% GST included."
                />
              </div>

              {/* Summary Calculation Box */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Line Items Subtotal:</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                    {(
                      (watchedPricing?.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
                {!!watchedPricing?.discount && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-medium tabular-nums">
                      -{watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                      {Number(watchedPricing.discount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {!!watchedPricing?.taxes && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Taxes &amp; Fees:</span>
                    <span className="font-medium text-foreground tabular-nums">
                      +{watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                      {Number(watchedPricing.taxes).toLocaleString("en-IN")}
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
            SECTION 6: STATUS, PUBLISHING & SHARING
        ============================================================ */}
        <section id="section-publishing" className="scroll-mt-24">
          <Card className="border border-border shadow-xs">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  6. Status, Publishing &amp; Client Access
                </CardTitle>
                <span className="text-xs font-sans font-medium text-muted-foreground hidden sm:inline">
                  Step 6 of 6 · Proposal Finalization
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Configure proposal visibility, client sharing access, dedicated journey curator contacts, and perform pre-flight verification before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Status, Client Access, and Curator & Concierge */}
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

                  {/* Client Access & Sharing URLs */}
                  <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-sm font-semibold flex items-center gap-2 text-foreground">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        Client Sharing &amp; Access URLs
                      </h4>
                      {isEdit && existing ? (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Ref: {existing.shareToken.slice(0, 8).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                          Token generated on save
                        </span>
                      )}
                    </div>

                    {isEdit && existing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Itinerary Link */}
                        <div className="border rounded-md p-3 bg-background space-y-1.5 shadow-2xs">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                            Client Dossier URL
                          </span>
                          <code className="text-[11px] block truncate text-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">
                            {SHARE_BASE_URL}/itinerary/{existing.shareToken}
                          </code>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              onClick={() => {
                                const url = `${SHARE_BASE_URL}/itinerary/${existing.shareToken}`;
                                navigator.clipboard.writeText(url);
                                toast({ title: "Copied Client Itinerary URL" });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const isLocal =
                                  typeof window !== "undefined" &&
                                  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
                                const base = isLocal ? "http://localhost:3000" : SHARE_BASE_URL;
                                window.open(`${base}/itinerary/${existing.shareToken}`, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> Open
                            </Button>
                          </div>
                        </div>

                        {/* Package Link */}
                        <div className="border rounded-md p-3 bg-background space-y-1.5 shadow-2xs">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                            Package Mode URL
                          </span>
                          <code className="text-[11px] block truncate text-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">
                            {SHARE_BASE_URL}/package/{existing.shareToken}
                          </code>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              onClick={() => {
                                const url = `${SHARE_BASE_URL}/package/${existing.shareToken}`;
                                navigator.clipboard.writeText(url);
                                toast({ title: "Copied Package URL" });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const isLocal =
                                  typeof window !== "undefined" &&
                                  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
                                const base = isLocal ? "http://localhost:3000" : SHARE_BASE_URL;
                                window.open(`${base}/package/${existing.shareToken}`, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> Open
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span>Instant Client Portal &amp; WhatsApp Integration</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          When you save this proposal, Escora automatically generates a cryptographically secure, permanent guest token. You will receive direct links for both the interactive luxury web dossier and the streamlined package summary, ready for WhatsApp and email dispatch.
                        </p>
                      </div>
                    )}
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
                        <Label htmlFor="curatorName" className="font-medium text-xs flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          Curator Name
                        </Label>
                        <Input
                          id="curatorName"
                          {...register("curatorName")}
                          placeholder="e.g. Midhilaj Chelakkal"
                          className="bg-background text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="curatorPhone" className="font-medium text-xs flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          Curator Phone / WhatsApp
                        </Label>
                        <Input
                          id="curatorPhone"
                          {...register("curatorPhone")}
                          placeholder="e.g. +91 75929 98800"
                          className="bg-background text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="emergencyContacts" className="font-medium text-xs flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                          24/7 Escora Guest Concierge &amp; Helpline
                        </Label>
                        <Input
                          id="emergencyContacts"
                          {...register("emergencyContacts")}
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
                        onClick={() => scrollToSection("section-pricing")}
                        className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back to Pricing
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
                if (pendingNavigation === "__change_template__") {
                  setTemplateChoice(null);
                  reset(emptyForm);
                } else if (pendingNavigation) {
                  navigate(pendingNavigation);
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
}: {
  control: any;
  register: any;
  dayIndex: number;
  tripStartDate?: string;
  tripEndDate?: string;
}) {
  const activitiesArray = useFieldArray({ control, name: `days.${dayIndex}.activities` });

  return (
    <div className="p-4 space-y-4">
      {/* Day Photo & Basic Fields */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="w-full md:w-56 flex-shrink-0">
          <Controller
            control={control}
            name={`days.${dayIndex}.imageUrl` as const}
            render={({ field }) => (
              <ImageUploadField
                value={field.value}
                onChange={field.onChange}
                label="Day photo"
                size="default"
                helperText="Shown on client web proposal & PDF dossier."
              />
            )}
          />
        </div>

        <div className="flex-1 space-y-3 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs font-medium">Day Title *</Label>
              <Input
                {...register(`days.${dayIndex}.title` as const, { required: true })}
                placeholder="e.g. Arrival in Kochi — Fort Kochi & Mattancherry Heritage Walk"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Travel Date</Label>
              <Input type="date" {...register(`days.${dayIndex}.date` as const)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Day Overview / Narrative</Label>
            <Textarea
              {...register(`days.${dayIndex}.description` as const)}
              rows={2}
              placeholder="Describe the day's journey, scenic drives, cultural stops, and evening leisure..."
            />
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="border-t border-border pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Timed Activities &amp; Highlights ({activitiesArray.fields.length})
          </Label>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => activitiesArray.append({ time: "", title: "", description: "" })}
            className="text-xs h-7"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Activity
          </Button>
        </div>

        {activitiesArray.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            No specific activities added for this day. Click &ldquo;Add Activity&rdquo; to add timed highlights.
          </p>
        ) : (
          <div className="space-y-2">
            {activitiesArray.fields.map((field, actIndex) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(`days.${dayIndex}.activities.${actIndex}.time` as const)}
                  placeholder="e.g. 09:30"
                  className="w-24 text-xs h-8"
                />
                <Input
                  {...register(`days.${dayIndex}.activities.${actIndex}.title` as const, { required: true })}
                  placeholder="Activity Name (e.g. Kathakali Dance Performance)"
                  className="flex-1 text-xs h-8"
                />
                <Input
                  {...register(`days.${dayIndex}.activities.${actIndex}.description` as const)}
                  placeholder="Details / Notes (optional)"
                  className="flex-1 text-xs h-8 hidden sm:block"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  disabled={actIndex === 0}
                  onClick={() => activitiesArray.swap(actIndex, actIndex - 1)}
                  title="Move Up"
                >
                  <MoveUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  disabled={actIndex === activitiesArray.fields.length - 1}
                  onClick={() => activitiesArray.swap(actIndex, actIndex + 1)}
                  title="Move Down"
                >
                  <MoveDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => activitiesArray.remove(actIndex)}
                  title="Remove activity"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
  setValue: any;
  watch: any;
}) {
  const checkIn = watch(`stays.${stayIndex}.checkIn`);
  const checkOut = watch(`stays.${stayIndex}.checkOut`);
  const nights = watch(`stays.${stayIndex}.nights`);

  // Auto calculate nights when checkIn and checkOut are selected
  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
        if (diffDays > 0 && nights !== diffDays) {
          setValue(`stays.${stayIndex}.nights`, diffDays, { shouldDirty: true });
        }
      }
    }
  }, [checkIn, checkOut, nights, setValue, stayIndex]);

  const hasInvalidDateRange = Boolean(checkIn && checkOut && checkOut <= checkIn);

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Hotel / Resort / Houseboat Name *</Label>
          <Input
            {...register(`stays.${stayIndex}.name` as const, { required: true })}
            placeholder="e.g. Fragrant Nature Resort & Spa"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Location / Destination</Label>
          <Input
            {...register(`stays.${stayIndex}.location` as const)}
            placeholder="e.g. Munnar, Kerala"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Check-in Date</Label>
          <Input type="date" {...register(`stays.${stayIndex}.checkIn` as const)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Check-out Date</Label>
          <Input type="date" {...register(`stays.${stayIndex}.checkOut` as const)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Duration (Nights)</Label>
          <Input
            type="number"
            min="1"
            {...register(`stays.${stayIndex}.nights` as const, { valueAsNumber: true })}
            placeholder="1"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Room Type</Label>
          <Input
            {...register(`stays.${stayIndex}.roomType` as const)}
            placeholder="e.g. Deluxe Lake View"
          />
        </div>
      </div>

      {hasInvalidDateRange && (
        <p className="text-xs text-destructive flex items-center gap-1 font-medium">
          <AlertTriangle className="h-3.5 w-3.5" />
          Check-out date must be after check-in date.
        </p>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-medium">Stay Notes &amp; Special Arrangements</Label>
        <Input
          {...register(`stays.${stayIndex}.notes` as const)}
          placeholder="e.g. Daily breakfast included · 2 Extra beds requested for children"
        />
        <p className="text-[11px] text-muted-foreground">
          Displayed beneath room type on client web view and printable dossier.
        </p>
      </div>
    </div>
  );
}
