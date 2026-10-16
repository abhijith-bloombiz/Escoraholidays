import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  computePricingTotal,
  type ItineraryDay,
  type ItineraryStay,
  type ItineraryPricing,
} from "@/lib/itinerary";
import { itineraryTemplates, type ItineraryTemplate } from "@/lib/itineraryTemplates";
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
  days: [],
  stays: [],
  pricing: { items: [], total: 0 },
  inclusions: [],
  exclusions: [],
};

function templateToFormValues(template: ItineraryTemplate): BuilderForm {
  return {
    ...emptyForm,
    title: template.title,
    destination: template.destination,
    days: JSON.parse(JSON.stringify(template.days)),
    stays: JSON.parse(JSON.stringify(template.stays)),
    pricing: JSON.parse(JSON.stringify(template.pricing)),
    inclusions: [...template.inclusions],
    exclusions: [...template.exclusions],
  };
}

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
    formState: { isDirty },
  } = useForm<BuilderForm>({
    defaultValues: emptyForm,
  });

  const [templateChoice, setTemplateChoice] = useState<"blank" | string | null>(isEdit ? "blank" : null);
  const [previewTemplate, setPreviewTemplate] = useState<ItineraryTemplate | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // AI Assistant modal state (Phase 3B)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiEnquiryId, setAiEnquiryId] = useState<number | undefined>(undefined);

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
  const watchedInclusions = watch("inclusions") ?? [];
  const watchedExclusions = watch("exclusions") ?? [];
  const watchedDays = watch("days") ?? [];
  const watchedStays = watch("stays") ?? [];

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
        days: parseDays(existing.days),
        stays: parseStays(existing.stays),
        pricing: parsePricing(existing.pricing),
        inclusions: parseStringList(existing.inclusions),
        exclusions: parseStringList(existing.exclusions),
      });
    }
  }, [existing, reset]);

  // Handle URL query parameters (e.g. ?ai=true or ?enquiryId=123)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const aiParam = searchParams.get("ai");
    const enqParam = searchParams.get("enquiryId");
    const nameParam = searchParams.get("customerName");
    const emailParam = searchParams.get("customerEmail");
    const phoneParam = searchParams.get("customerPhone");

    if (nameParam) setValue("customerName", nameParam, { shouldDirty: true });
    if (emailParam) setValue("customerEmail", emailParam, { shouldDirty: true });
    if (phoneParam) setValue("customerPhone", phoneParam, { shouldDirty: true });

    if (aiParam === "true" || enqParam) {
      if (enqParam) {
        setAiEnquiryId(Number(enqParam));
      }
      setShowAiModal(true);
      if (!isEdit && templateChoice === null) {
        setTemplateChoice("blank");
      }
    }
  }, [setValue, isEdit, templateChoice]);

  const handleApplyAiDraft = (draft: ItineraryAiAssistResponse) => {
    setValue("title", draft.title, { shouldDirty: true });
    setValue("destination", draft.destination, { shouldDirty: true });
    setValue("summary", draft.summary, { shouldDirty: true });
    if (draft.coverImageUrl) {
      setValue("coverImageUrl", draft.coverImageUrl, { shouldDirty: true });
    }

    const start = watchedStartDate ? new Date(watchedStartDate) : null;
    const formattedDays: ItineraryDay[] = draft.days.map((d, idx) => {
      let dateStr = d.date || "";
      if (!dateStr && start && !Number.isNaN(start.getTime())) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + idx);
        dateStr = dayDate.toISOString().split("T")[0];
      }
      return {
        day: d.day,
        date: dateStr,
        title: d.title,
        description: d.description || "",
        activities: d.activities.map((a) => ({
          time: a.time,
          title: a.title,
          description: a.description || "",
        })),
      };
    });
    setValue("days", formattedDays, { shouldDirty: true });

    const formattedStays: ItineraryStay[] = draft.stays.map((s) => ({
      name: s.name,
      location: s.location || draft.destination,
      checkIn: s.checkIn || "",
      checkOut: s.checkOut || "",
      nights: s.nights || 2,
      roomType: s.roomType || "Signature Heritage Suite",
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

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
    if (itineraryId) {
      qc.invalidateQueries({ queryKey: getGetItineraryQueryKey(itineraryId) });
    }
  }

  const onSubmit = (form: BuilderForm) => {
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
    const data = {
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
      days: JSON.stringify(form.days.map((d, i) => ({ ...d, day: i + 1 }))),
      stays: JSON.stringify(form.stays),
      pricing: JSON.stringify({ ...form.pricing, total }),
      inclusions: JSON.stringify((form.inclusions || []).map((s) => s.trim()).filter(Boolean)),
      exclusions: JSON.stringify((form.exclusions || []).map((s) => s.trim()).filter(Boolean)),
    };

    if (isEdit && itineraryId) {
      updateMutation.mutate(
        { id: itineraryId, data },
        {
          onSuccess: () => {
            invalidate();
            toast({ title: "Itinerary proposal updated successfully" });
            navigate("/itineraries");
          },
          onError: () => toast({ title: "Failed to update itinerary", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: (created) => {
            invalidate();
            toast({ title: "Itinerary created successfully", description: `Reference: ${created.shareToken.slice(0, 8).toUpperCase()}` });
            navigate("/itineraries");
          },
          onError: () => toast({ title: "Failed to create itinerary", variant: "destructive" }),
        }
      );
    }
  };

  function handleCancel() {
    if (isDirty) {
      setPendingNavigation("/itineraries");
      setShowDiscardDialog(true);
    } else {
      navigate("/itineraries");
    }
  }

  function scrollToSection(id: string) {
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

  const total = computePricingTotal(watchedPricing ?? { items: [], total: 0 });

  // -------------------------------------------------------------
  // TEMPLATE SELECTION SCREEN (When creating new itinerary)
  // -------------------------------------------------------------
  if (!isEdit && templateChoice === null) {
    return (
      <div data-testid="itinerary-builder-page" className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/itineraries")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif text-foreground">Choose Itinerary Template</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start with a battle-tested signature route or begin with an empty blank proposal.
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* AI Itinerary Assistant Card */}
          <Card
            className="group relative border-2 border-emerald-600/40 hover:border-emerald-600 transition-all flex flex-col justify-between cursor-pointer bg-gradient-to-b from-emerald-500/10 to-card hover:shadow-lg"
            onClick={() => {
              setTemplateChoice("blank");
              setShowAiModal(true);
            }}
            data-testid="template-card-ai"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-600/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  Slow-Luxury AI
                </Badge>
              </div>
              <CardTitle className="text-lg font-serif group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                Design with AI Assistant
              </CardTitle>
              <CardDescription className="text-xs">
                Generate a bespoke, day-by-day Kerala itinerary proposal from customer dates, wishes, or an existing inquiry.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button type="button" className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5">
                <Sparkles className="h-4 w-4" /> Launch Assistant ✨
              </Button>
            </CardContent>
          </Card>

          {/* Start Blank Card */}
          <Card
            className="group relative border-2 border-dashed border-border hover:border-primary/60 transition-all flex flex-col justify-between cursor-pointer bg-card/60 hover:bg-card hover:shadow-md"
            onClick={() => setTemplateChoice("blank")}
            data-testid="template-card-blank"
          >
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-serif">Start Blank</CardTitle>
              <CardDescription className="text-xs">
                Build a tailored custom itinerary from scratch with empty day cards, accommodation stays, and pricing.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button type="button" variant="outline" className="w-full mt-4 group-hover:border-primary group-hover:bg-primary/5">
                Start From Scratch
              </Button>
            </CardContent>
          </Card>

          {/* Curated Templates */}
          {itineraryTemplates.map((template) => {
            const dayCount = template.days.length;
            const stayCount = template.stays.length;
            return (
              <Card
                key={template.id}
                className="group relative border border-border hover:border-primary/60 transition-all flex flex-col justify-between bg-card hover:shadow-md"
                data-testid={`template-card-${template.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-primary/5 text-primary border-primary/20">
                      {template.destination}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {dayCount} {dayCount === 1 ? "Day" : "Days"} · {stayCount} {stayCount === 1 ? "Stay" : "Stays"}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-serif group-hover:text-primary transition-colors">{template.label}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">{template.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-2 space-y-3">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 border-t border-border/60 pt-2.5">
                    <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="truncate">Includes {template.days[0]?.title}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        reset(templateToFormValues(template));
                        setTemplateChoice(template.id);
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Template Preview Dialog */}
        <Dialog open={previewTemplate !== null} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-serif text-xl flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    {previewTemplate?.label}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">{previewTemplate?.description}</DialogDescription>
                </div>
                {previewTemplate && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {previewTemplate.destination}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {previewTemplate && (
              <div className="p-6">
                <ItineraryDocument
                  data={{
                    title: previewTemplate.title,
                    customerName: "Preview Guest",
                    destination: previewTemplate.destination,
                    days: previewTemplate.days,
                    stays: previewTemplate.stays,
                    inclusions: previewTemplate.inclusions,
                    exclusions: previewTemplate.exclusions,
                    pricing: previewTemplate.pricing,
                    currency: "INR",
                  }}
                />
              </div>
            )}

            <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </Button>
              {previewTemplate && (
                <Button
                  onClick={() => {
                    const t = previewTemplate;
                    setPreviewTemplate(null);
                    reset(templateToFormValues(t));
                    setTemplateChoice(t.id);
                  }}
                >
                  <Check className="h-4 w-4 mr-1.5" /> Use This Template
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phase 3B: AI Itinerary Assistant Modal (Accessible from template screen) */}
        <AiItineraryAssistantModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
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
  // BUILDER FORM SCREEN (6 Visual Sections + Sticky Navigator)
  // -------------------------------------------------------------
  return (
    <div data-testid="itinerary-builder-page" className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif text-foreground">{isEdit ? "Edit Itinerary Proposal" : "New Itinerary Proposal"}</h1>
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

      {/* Integration & Public Usage Guide */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-serif text-base font-medium">Itinerary Proposal Builder</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <p>
            This proposal is shared with clients via <code className="text-foreground">/itinerary/:token</code> and in package mode at{" "}
            <code className="text-foreground">/package/:token</code>.
          </p>
          <p>
            <strong>Publishing requirement:</strong> Ensure status is set to <strong>Shared</strong> or <strong>Confirmed</strong> for the public link to resolve. <strong>Draft</strong> proposals return 404 to guests.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Customer email and phone are internal booking records and never displayed on public share pages.
          </p>
        </AlertDescription>
      </Alert>

      {/* Sticky Section Navigator & Action Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border py-2.5 px-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium py-1">
          <button
            type="button"
            onClick={() => scrollToSection("section-details")}
            className="px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            1. Trip Details
          </button>
          <span className="text-muted-foreground/40">›</span>
          <button
            type="button"
            onClick={() => scrollToSection("section-days")}
            className="px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            2. Days ({daysArray.fields.length})
          </button>
          <span className="text-muted-foreground/40">›</span>
          <button
            type="button"
            onClick={() => scrollToSection("section-stays")}
            className="px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            3. Stays ({staysArray.fields.length})
          </button>
          <span className="text-muted-foreground/40">›</span>
          <button
            type="button"
            onClick={() => scrollToSection("section-terms")}
            className="px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            4. Inclusions ({watchedInclusions.length})
          </button>
          <span className="text-muted-foreground/40">›</span>
          <button
            type="button"
            onClick={() => scrollToSection("section-pricing")}
            className="px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            5. Pricing ({priceItemsArray.fields.length})
          </button>
          <span className="text-muted-foreground/40">›</span>
          <button
            type="button"
            onClick={() => scrollToSection("section-publishing")}
            className="px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            6. Status &amp; Save
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block">Investment</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
              {total.toLocaleString("en-IN")}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAiModal(true)}
            className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
            data-testid="button-ai-assistant"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Assistant ✨
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit-itinerary"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : isEdit
              ? "Save Changes"
              : "Create Proposal"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
              <CardDescription className="text-xs">
                Client identity, proposal heading, travel dates and executive trip summary.
              </CardDescription>
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
                  <p className="text-[11px] text-muted-foreground">
                    Rendered as &ldquo;Prepared exclusively for [Name]&rdquo; in web proposal header.
                  </p>
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
                  <p className="text-[11px] text-muted-foreground">
                    Internal CRM record. Never shown on public share link or PDF dossier.
                  </p>
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
                  <p className="text-[11px] text-muted-foreground">
                    Internal CRM record. Kept confidential.
                  </p>
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
                  <p className="text-[11px] text-muted-foreground">
                    Main heading featured in client hero section, WhatsApp links, and PDF dossier title page.
                  </p>
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
                  <p className="text-[11px] text-muted-foreground">
                    Displayed in the proposal summary tag and PDF cover badge.
                  </p>
                </div>
              </div>

              {/* Row 3: Travel Dates & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="font-medium text-xs">
                    Start Date
                  </Label>
                  <Input id="startDate" type="date" {...register("startDate")} />
                  <p className="text-[11px] text-muted-foreground">Proposal start / arrival date.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="font-medium text-xs">
                    End Date
                  </Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                  <p className="text-[11px] text-muted-foreground">Proposal departure date.</p>
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
                  <p className="text-[11px] text-muted-foreground">Applied across all pricing line items.</p>
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
                      helperText="High-resolution hero banner for the online proposal and PDF dossier cover page."
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
                  placeholder="A bespoke luxury escape through Kochi's colonial alleys, mist-clad Munnar tea hills, and a private backwater cruise in Alleppey."
                />
                <p className="text-[11px] text-muted-foreground">
                  Executive summary displayed beneath the title on web proposals and printable dossier.
                </p>
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
                <CardDescription className="text-xs">
                  Chronological day schedule with day titles, photos, descriptions, and itemized timed activities.
                </CardDescription>
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

                          <Badge variant="outline" className="font-mono text-xs font-semibold bg-background">
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
                <CardDescription className="text-xs">
                  Resorts, heritage hotels, and houseboats selected for the client&apos;s itinerary.
                </CardDescription>
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

                          <Badge variant="outline" className="font-mono text-xs font-semibold bg-background">
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
              <CardDescription className="text-xs">
                Line-by-line inclusions and exclusions rendered with distinctive icons on public proposals and PDF dossiers.
              </CardDescription>
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
              <div>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  5. Investment &amp; Pricing
                </CardTitle>
                <CardDescription className="text-xs">
                  Line items breakdown, applicable taxes, discounts, and terms displayed to the client.
                </CardDescription>
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
                <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-foreground px-1">
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
                          className="pl-8 text-right font-mono"
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
                      className="pl-8 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Deducted from line items subtotal.</p>
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
                      className="pl-8 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Added to net investment (e.g. 5% GST).</p>
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
                <p className="text-[11px] text-muted-foreground">
                  Displays beneath the total investment card on web proposals and PDF dossiers.
                </p>
              </div>

              {/* Summary Calculation Box */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Line Items Subtotal:</span>
                  <span className="font-mono">
                    {watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                    {(
                      (watchedPricing?.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
                {!!watchedPricing?.discount && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">
                      -{watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                      {Number(watchedPricing.discount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {!!watchedPricing?.taxes && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Taxes &amp; Fees:</span>
                    <span className="font-mono">
                      +{watchedCurrency === "INR" ? "₹" : watchedCurrency + " "}
                      {Number(watchedPricing.taxes).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-primary/20 font-serif">
                  <span className="text-base font-semibold text-foreground">Total Proposal Investment:</span>
                  <span className="text-2xl font-mono font-bold text-primary">
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
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                6. Status, Publishing &amp; Client Access
              </CardTitle>
              <CardDescription className="text-xs">
                Control proposal visibility and access client share links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Status Selector */}
              <div className="space-y-2">
                <Label className="font-medium text-xs">Proposal Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full sm:w-80">
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

                <div className="text-xs text-muted-foreground space-y-1 mt-1">
                  {watchedStatus === "draft" && (
                    <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Status is Draft: Client links return a 404 error until status is changed to &apos;Shared&apos; or &apos;Confirmed&apos;.
                    </p>
                  )}
                  {watchedStatus === "shared" && (
                    <p className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Status is Shared: The proposal is active and clients can view it online or proceed to payment via WhatsApp.
                    </p>
                  )}
                  {watchedStatus === "confirmed" && (
                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Status is Confirmed: Booking is officially locked.
                    </p>
                  )}
                </div>
              </div>

              {/* Share links display (when editing existing) */}
              {isEdit && existing && (
                <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                  <h4 className="font-serif text-sm font-semibold flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    Public Share URLs
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Itinerary Link */}
                    <div className="border rounded-md p-3 bg-background space-y-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Client Dossier URL
                      </span>
                      <code className="text-[11px] block truncate text-foreground">
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
                    <div className="border rounded-md p-3 bg-background space-y-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Package Mode URL
                      </span>
                      <code className="text-[11px] block truncate text-foreground">
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
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-itinerary-bottom"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving Proposal..."
                    : isEdit
                    ? "Save Changes"
                    : "Create Proposal"}
                </Button>
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
            <DialogDescription className="text-xs">
              Enter one item per line. Useful when pasting from client emails or proposal notes.
            </DialogDescription>
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
        onClose={() => setShowAiModal(false)}
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
                  className="w-24 text-xs font-mono h-8"
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
