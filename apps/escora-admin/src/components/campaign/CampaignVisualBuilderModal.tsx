import React, { useState, useEffect, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Users,
  Eye,
  Check,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Palette,
  FileText,
  Save,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ImageUploadField from "@/components/ImageUploadField";
import {
  CAMPAIGN_TEMPLATES,
  CURATED_HERO_IMAGES,
  PERSONALIZATION_TAGS,
  type VisualCampaignFields,
  type CampaignTemplatePreset,
  generateCampaignHtml,
  extractFieldsFromExisting,
} from "./campaignTemplates";

interface CampaignVisualBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    subject: string;
    previewText?: string;
    contentHtml: string;
    audienceType: VisualCampaignFields["audienceType"];
    groupId?: string;
    groupIds?: string[];
  }) => void;
  isSaving?: boolean;
  initialCampaign?: {
    id: number;
    name: string;
    subject: string;
    previewText?: string | null;
    contentHtml: string;
    targetAudience: {
      type: VisualCampaignFields["audienceType"];
      groupId?: string;
      groupIds?: string[];
    };
  } | null;
}

type WorkflowStep = "details" | "template" | "customize" | "preview" | "save";

const STEPS: Array<{ id: WorkflowStep; label: string; number: number }> = [
  { id: "details", label: "Campaign Details", number: 1 },
  { id: "template", label: "Choose Template", number: 2 },
  { id: "customize", label: "Customize Email", number: 3 },
  { id: "preview", label: "Preview & Validate", number: 4 },
  { id: "save", label: "Save as Draft", number: 5 },
];

export default function CampaignVisualBuilderModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  initialCampaign = null,
}: CampaignVisualBuilderModalProps) {
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>("details");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [simulateSampleData, setSimulateSampleData] = useState(true);
  const [templateInspectModal, setTemplateInspectModal] = useState<CampaignTemplatePreset | null>(null);

  // Form Fields
  const [fields, setFields] = useState<VisualCampaignFields>(() => {
    const defaultTemplate = CAMPAIGN_TEMPLATES[0];
    return {
      ...defaultTemplate.defaultValues,
      name: "",
      audienceType: "all_contacts",
      templateId: defaultTemplate.id,
    };
  });

  // Track focused field for 1-click personalization merge tag insertion
  const [focusedField, setFocusedField] = useState<"subject" | "previewText" | "heading" | "lead" | "body" | "quote" | null>(
    null
  );

  // Re-initialize when modal opens or initialCampaign changes
  useEffect(() => {
    if (isOpen) {
      if (initialCampaign) {
        const extracted = extractFieldsFromExisting(
          initialCampaign.name,
          initialCampaign.subject,
          initialCampaign.previewText,
          initialCampaign.targetAudience.type,
          initialCampaign.contentHtml
        );
        setFields(extracted);
      } else {
        const defaultTemplate = CAMPAIGN_TEMPLATES[0];
        setFields({
          ...defaultTemplate.defaultValues,
          name: "",
          audienceType: "all_contacts",
          templateId: defaultTemplate.id,
        });
      }
      setCurrentStep("details");
    }
  }, [isOpen, initialCampaign]);

  // Query saved Audience Groups
  const { data: audienceGroups = [] } = useQuery<
    Array<{
      id: string;
      name: string;
      description?: string;
      type: "manual" | "dynamic";
      memberCount: number;
    }>
  >({
    queryKey: ["campaigns", "audiences"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/audiences", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
  });

  // Query live audience estimate based on selected audienceType and group
  const {
    data: audienceEstimate,
    isLoading: isAudienceLoading,
    refetch: refetchAudience,
  } = useQuery<{
    eligibleRecipients: number;
    activeSubscribers: number;
    unsubscribedCount: number;
    sampleRecipients: Array<{
      name: string;
      email: string;
      source: string;
      isSubscribed: boolean;
    }>;
  }>({
    queryKey: ["campaigns", "audience-estimate", fields.audienceType, fields.groupId],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/audience-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetAudience: {
            type: fields.audienceType,
            groupIds: fields.groupId ? [fields.groupId] : undefined,
          },
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to load audience estimate");
      }
      return res.json();
    },
    enabled: isOpen,
    staleTime: 15000,
  });

  // Insert personalization tag into the actively focused or target field
  const handleInsertTag = (tag: string, target?: "subject" | "previewText" | "heading" | "lead" | "body" | "quote") => {
    const fieldKey = target || focusedField || "body";
    setFields((prev) => {
      const currentVal = (prev[fieldKey] as string) || "";
      return {
        ...prev,
        [fieldKey]: currentVal ? `${currentVal} ${tag}` : tag,
      };
    });
    toast({
      title: "Tag Inserted",
      description: `Added ${tag} to ${fieldKey}.`,
    });
  };

  // Switch template
  const handleSelectTemplate = (preset: CampaignTemplatePreset) => {
    setFields((prev) => ({
      ...prev,
      templateId: preset.id,
      subject: prev.name ? prev.subject : preset.defaultValues.subject,
      previewText: prev.previewText || preset.defaultValues.previewText,
      eyebrow: preset.defaultValues.eyebrow,
      heading: preset.defaultValues.heading,
      lead: preset.defaultValues.lead,
      heroImage: preset.defaultValues.heroImage,
      body: preset.defaultValues.body,
      quote: preset.defaultValues.quote,
      highlights: preset.defaultValues.highlights,
      ctaText: preset.defaultValues.ctaText,
      ctaUrl: preset.defaultValues.ctaUrl,
      secondaryNote: preset.defaultValues.secondaryNote,
      accentColor: preset.accentColor,
    }));
  };

  // Compile HTML
  const compiledHtml = generateCampaignHtml(fields);

  // Render HTML preview with optional simulated personalization
  const previewHtml = simulateSampleData
    ? compiledHtml
        .replace(/\{\{\s*name\s*\}\}/gi, "Lady Eleanor")
        .replace(/\{\{\s*destination\s*\}\}/gi, "Munnar & Alleppey")
        .replace(/\{\{\s*email\s*\}\}/gi, "eleanor@example.com")
        .replace(/\{\{\s*year\s*\}\}/gi, new Date().getFullYear().toString())
        .replace(/\{\{\s*unsubscribeUrl\s*\}\}/gi, "#")
    : compiledHtml;

  // Validation
  const validationErrors: string[] = [];
  if (!fields.name.trim()) validationErrors.push("Campaign Internal Name is required.");
  if (!fields.subject.trim()) validationErrors.push("Email Subject Line is required.");
  if (!fields.heading.trim()) validationErrors.push("Email Heading is required.");
  if (!fields.body.trim()) validationErrors.push("Email Body content is required.");
  if (!fields.ctaText.trim()) validationErrors.push("CTA Button text is required.");
  if (!fields.ctaUrl.trim()) validationErrors.push("CTA Destination URL is required.");

  const isValid = validationErrors.length === 0;

  // Save handler
  const handleSaveDraft = () => {
    if (!isValid) {
      toast({
        title: "Validation Issues",
        description: validationErrors[0],
        variant: "destructive",
      });
      return;
    }

    onSave({
      name: fields.name.trim(),
      subject: fields.subject.trim(),
      previewText: fields.previewText.trim() || undefined,
      contentHtml: compiledHtml,
      audienceType: fields.audienceType,
      groupId: fields.groupId,
      groupIds: fields.groupId ? [fields.groupId] : undefined,
    });
  };

  // Step navigation helper
  const goToNextStep = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  };

  const goToPreviousStep = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id);
    }
  };

  const selectedTemplate =
    CAMPAIGN_TEMPLATES.find((t) => t.id === fields.templateId) || CAMPAIGN_TEMPLATES[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-6xl w-[95vw] h-[92vh] max-h-[92vh] p-0 flex flex-col bg-[#FAF7F1] dark:bg-card border-[#E5DDD0] shadow-2xl rounded-xl overflow-hidden"
        data-testid="campaign-visual-builder-modal"
      >
        {/* ============================================================
            BUILDER HEADER: Title & Guided 5-Step Workflow Bar
        ============================================================ */}
        <div className="shrink-0 px-6 py-4 border-b border-[#E5DDD0] bg-[#FFFDF9] dark:bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#24543D]/10 text-[#24543D] flex items-center justify-center font-serif text-lg font-semibold border border-[#24543D]/20">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-serif text-lg font-normal text-[#1A1410] dark:text-foreground">
                  {initialCampaign ? `Edit Campaign #${initialCampaign.id}` : "Create Campaign Draft"}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="bg-[#24543D]/10 text-[#24543D] border-[#24543D]/30 text-[10px] font-sans font-medium"
                >
                  Visual Email Builder
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Craft editorial travel emails with reusable presets and live recipient preview.
              </p>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPast =
                STEPS.findIndex((s) => s.id === currentStep) >
                STEPS.findIndex((s) => s.id === step.id);

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors shrink-0 ${
                    isActive
                      ? "bg-[#24543D] text-[#FAF7F1] font-medium shadow-xs"
                      : isPast
                      ? "bg-[#24543D]/10 text-[#24543D] hover:bg-[#24543D]/15"
                      : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? "bg-[#FAF7F1] text-[#24543D]"
                        : isPast
                        ? "bg-[#24543D] text-[#FAF7F1]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPast ? <Check className="h-2.5 w-2.5" /> : step.number}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            MAIN WORKSPACE AREA (SCROLLABLE STEP CONTENT)
        ============================================================ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: CAMPAIGN DETAILS */}
          {currentStep === "details" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
              <div className="bg-[#FFFDF9] dark:bg-card border border-[#E5DDD0] rounded-xl p-6 shadow-xs space-y-5">
                <div className="border-b border-[#E5DDD0] pb-3">
                  <h3 className="font-serif text-base font-medium text-[#1A1410] dark:text-foreground">
                    1. Campaign Internal Details & Audience
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define the campaign identifier, target audience segment, and inbox envelope lines.
                  </p>
                </div>

                {/* Internal Name & Audience Segment Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Campaign Internal Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Monsoon Sanctuary Invitation 2026"
                      value={fields.name}
                      onChange={(e) => setFields({ ...fields, name: e.target.value })}
                      className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Only visible to Escora staff in the admin panel.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Audience Segment <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fields.audienceType}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          audienceType: e.target.value as VisualCampaignFields["audienceType"],
                        })
                      }
                      className="w-full h-10 px-3 rounded-md bg-white dark:bg-background border border-[#E5DDD0] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                    >
                      <option value="all_contacts">All Contacts (Enquiries + Bookings)</option>
                      <option value="enquiries_only">Inquiries Prospects Only</option>
                      <option value="confirmed_guests">Confirmed Journey Guests Only</option>
                      <option value="custom_segment">Custom Destination Segment</option>
                      <option value="audience_group">Audience Group (Custom Segment)</option>
                    </select>
                    <span className="text-[11px] text-muted-foreground">
                      Selects active, subscribed contacts matching these criteria.
                    </span>

                    {fields.audienceType === "audience_group" && (
                      <div className="mt-2.5">
                        <select
                          value={fields.groupId || ""}
                          onChange={(e) =>
                            setFields({
                              ...fields,
                              groupId: e.target.value,
                              groupIds: e.target.value ? [e.target.value] : [],
                            })
                          }
                          className="w-full h-9 px-3 rounded-md bg-white dark:bg-background border border-[#E5DDD0] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                        >
                          <option value="">-- Choose an Audience Group --</option>
                          {audienceGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.type === "dynamic" ? "Dynamic Rule" : "Manual Members"} • {g.memberCount} members)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audience Estimate Info Box */}
                <div className="p-3.5 rounded-lg border border-[#24543D]/25 bg-[#24543D]/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-[#24543D]">
                    <Users className="h-4 w-4 shrink-0" />
                    <div>
                      <span className="font-semibold">Audience Reach:</span>{" "}
                      {isAudienceLoading ? (
                        <span className="text-muted-foreground">Calculating eligible recipients...</span>
                      ) : audienceEstimate ? (
                        <span>
                          <strong>{audienceEstimate.eligibleRecipients}</strong> eligible recipients (
                          {audienceEstimate.activeSubscribers} subscribed,{" "}
                          {audienceEstimate.unsubscribedCount} unsubscribed contacts automatically excluded)
                        </span>
                      ) : (
                        <span>Real-time audience calculation active.</span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchAudience()}
                    className="h-7 text-xs text-[#24543D] hover:bg-[#24543D]/10"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Re-check
                  </Button>
                </div>

                {/* Email Subject Line (Full-Width) with Quick Merge Tag helper */}
                <div className="space-y-1.5 pt-2 border-t border-[#E5DDD0]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Email Subject Line <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-medium">Insert Tag:</span>
                      {PERSONALIZATION_TAGS.slice(0, 3).map((tag) => (
                        <button
                          key={tag.tag}
                          type="button"
                          onClick={() => handleInsertTag(tag.tag, "subject")}
                          className="px-1.5 py-0.5 rounded bg-muted hover:bg-[#24543D]/10 hover:text-[#24543D] text-[10px] font-mono border border-border transition-colors"
                          title={`Insert ${tag.label}`}
                        >
                          {tag.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    placeholder="e.g., The Monsoon Sanctuary: Slow Days and Ayurvedic Rejuvenation in Kerala"
                    value={fields.subject}
                    onFocus={() => setFocusedField("subject")}
                    onChange={(e) => setFields({ ...fields, subject: e.target.value })}
                    className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    This is the main headline recipients see in their email inbox.
                  </span>
                </div>

                {/* Preview Text / Preheader (Full-Width) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Preview Text / Preheader
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-medium">Insert Tag:</span>
                      {PERSONALIZATION_TAGS.slice(0, 3).map((tag) => (
                        <button
                          key={tag.tag}
                          type="button"
                          onClick={() => handleInsertTag(tag.tag, "previewText")}
                          className="px-1.5 py-0.5 rounded bg-muted hover:bg-[#24543D]/10 hover:text-[#24543D] text-[10px] font-mono border border-border transition-colors"
                          title={`Insert ${tag.label}`}
                        >
                          {tag.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    placeholder="Brief teaser appearing after the subject line in modern email clients..."
                    value={fields.previewText}
                    onFocus={() => setFocusedField("previewText")}
                    onChange={(e) => setFields({ ...fields, previewText: e.target.value })}
                    className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Displayed alongside the subject line in Apple Mail, Gmail, and Outlook.
                  </span>
                </div>
              </div>

              {/* Bottom Navigation for Step 1 */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] gap-2 px-5"
                >
                  Continue to Template Selection <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE TEMPLATE */}
          {currentStep === "template" && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DDD0] pb-3">
                <div>
                  <h3 className="font-serif text-base font-medium text-[#1A1410] dark:text-foreground">
                    2. Select an Editorial Email Template
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose from 5 curated Escora visual layouts tailored for Kerala slow travel.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Currently active: <strong className="text-foreground">{selectedTemplate.title}</strong>
                </div>
              </div>

              {/* Gallery of 5 Selectable Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {CAMPAIGN_TEMPLATES.map((tmpl) => {
                  const isSelected = fields.templateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden flex flex-col bg-[#FFFDF9] dark:bg-card ${
                        isSelected
                          ? "border-[#24543D] ring-2 ring-[#24543D]/25 shadow-md"
                          : "border-[#E5DDD0] hover:border-[#24543D]/50 hover:shadow-xs"
                      }`}
                    >
                      {/* Template Mini Preview Banner */}
                      <div className="h-36 bg-[#F4EFE6] dark:bg-muted/40 relative overflow-hidden flex items-center justify-center p-4 border-b border-[#E5DDD0]">
                        <img
                          src={tmpl.defaultValues.heroImage}
                          alt={tmpl.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <Badge
                            className="bg-white/95 text-[#1A1410] border-none text-[10px] font-sans font-semibold shadow-xs"
                          >
                            {tmpl.badge}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left text-white">
                          <p className="text-[10px] uppercase tracking-wider text-amber-200/90 font-medium">
                            {tmpl.category}
                          </p>
                          <p className="text-xs font-serif font-medium line-clamp-1">
                            {tmpl.title}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-[#24543D] text-[#FAF7F1] flex items-center justify-center shadow-md">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Template Info Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h4 className="font-serif text-sm font-medium text-foreground line-clamp-1">
                            {tmpl.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {tmpl.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#E5DDD0] flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateInspectModal(tmpl);
                            }}
                            className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
                          >
                            <Eye className="h-3 w-3" /> Quick Look
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSelectTemplate(tmpl)}
                            className={`h-7 text-xs px-3 font-medium ${
                              isSelected
                                ? "bg-[#24543D] text-[#FAF7F1] hover:bg-[#1a3d2c]"
                                : "bg-muted/80 text-foreground hover:bg-muted"
                            }`}
                          >
                            {isSelected ? "Selected" : "Use Template"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Navigation for Step 2 */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous: Details
                </Button>
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] gap-2 px-5"
                >
                  Continue to Customize <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CUSTOMIZE EMAIL */}
          {currentStep === "customize" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DDD0] pb-3">
                <div>
                  <h3 className="font-serif text-base font-medium text-[#1A1410] dark:text-foreground">
                    3. Visual Email Customization
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customize your hero photography, editorial text, callouts, and call to action.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep("preview")}
                  className="text-xs gap-1.5 h-8 border-[#24543D]/30 text-[#24543D] hover:bg-[#24543D]/10"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview Changes
                </Button>
              </div>

              {/* Customization Form */}
              <div className="space-y-6 bg-[#FFFDF9] dark:bg-card border border-[#E5DDD0] rounded-xl p-6 shadow-xs">
                {/* 1. Hero Image Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-[#24543D]" /> Hero Photograph
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Pick a curated Kerala photograph or enter an image URL
                    </span>
                  </div>

                  {/* Preset Photos Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {CURATED_HERO_IMAGES.map((img) => {
                      const isImgSelected = fields.heroImage === img.url;
                      return (
                        <button
                          key={img.title}
                          type="button"
                          onClick={() => setFields({ ...fields, heroImage: img.url })}
                          className={`group relative rounded-lg overflow-hidden h-20 border text-left transition-all ${
                            isImgSelected
                              ? "border-[#24543D] ring-2 ring-[#24543D]/30"
                              : "border-[#E5DDD0] hover:border-[#24543D]/50"
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                          <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] text-white font-medium line-clamp-1 leading-tight drop-shadow-xs">
                            {img.title}
                          </span>
                          {isImgSelected && (
                            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#24543D] text-white flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Image URL Input or Upload */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      placeholder="Paste image URL (https://...)..."
                      value={fields.heroImage || ""}
                      onChange={(e) => setFields({ ...fields, heroImage: e.target.value })}
                      className="bg-white dark:bg-background border-[#E5DDD0] text-xs h-9"
                    />
                    {fields.heroImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFields({ ...fields, heroImage: "" })}
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2. Eyebrow & Main Heading */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E5DDD0]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Eyebrow Category
                    </label>
                    <Input
                      placeholder="e.g. Escora Holidays · Slow Sanctuaries"
                      value={fields.eyebrow}
                      onChange={(e) => setFields({ ...fields, eyebrow: e.target.value })}
                      className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10"
                    />
                    <span className="text-[11px] text-muted-foreground">Small gold header badge.</span>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Email Heading <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Tags:</span>
                        {PERSONALIZATION_TAGS.slice(0, 3).map((tag) => (
                          <button
                            key={tag.tag}
                            type="button"
                            onClick={() => handleInsertTag(tag.tag, "heading")}
                            className="px-1.5 py-0.5 rounded bg-muted hover:bg-[#24543D]/10 text-[10px] font-mono border"
                          >
                            {tag.tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      placeholder="e.g. Greetings, {{name}}."
                      value={fields.heading}
                      onFocus={() => setFocusedField("heading")}
                      onChange={(e) => setFields({ ...fields, heading: e.target.value })}
                      className="bg-white dark:bg-background border-[#E5DDD0] font-serif text-base h-10"
                    />
                  </div>
                </div>

                {/* 3. Subheading / Lead */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Subheading / Lead Reflection (Optional)
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Tags:</span>
                      {PERSONALIZATION_TAGS.slice(0, 2).map((tag) => (
                        <button
                          key={tag.tag}
                          type="button"
                          onClick={() => handleInsertTag(tag.tag, "lead")}
                          className="px-1.5 py-0.5 rounded bg-muted hover:bg-[#24543D]/10 text-[10px] font-mono border"
                        >
                          {tag.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    placeholder="e.g. When rain awakens the ancient forests and Ayurvedic traditions of Kerala."
                    value={fields.lead || ""}
                    onFocus={() => setFocusedField("lead")}
                    onChange={(e) => setFields({ ...fields, lead: e.target.value })}
                    className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10 italic"
                  />
                </div>

                {/* 4. Body Content with Full Merge Tags Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Editorial Body Text <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground font-medium">Quick Insert:</span>
                      {PERSONALIZATION_TAGS.map((tag) => (
                        <button
                          key={tag.tag}
                          type="button"
                          onClick={() => handleInsertTag(tag.tag, "body")}
                          className="px-2 py-0.5 rounded bg-muted hover:bg-[#24543D]/10 hover:text-[#24543D] text-[11px] font-mono border border-border transition-colors"
                          title={`Insert ${tag.label}`}
                        >
                          {tag.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    rows={6}
                    placeholder="Enter editorial paragraphs (use double line-breaks to separate paragraphs)..."
                    value={fields.body}
                    onFocus={() => setFocusedField("body")}
                    onChange={(e) => setFields({ ...fields, body: e.target.value })}
                    className="bg-white dark:bg-background border-[#E5DDD0] text-sm leading-relaxed"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Paragraphs are automatically styled with classic serif typography and spacing.
                  </span>
                </div>

                {/* 5. Highlight Quote / Callout Box */}
                <div className="space-y-1.5 pt-2 border-t border-[#E5DDD0]">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Featured Quote / Callout Box (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Slow travel is not an absence of movement, but an elevation of presence."
                    value={fields.quote || ""}
                    onFocus={() => setFocusedField("quote")}
                    onChange={(e) => setFields({ ...fields, quote: e.target.value })}
                    className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10 italic"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Rendered in a classic ivory-and-gold blockquote box.
                  </span>
                </div>

                {/* 6. Feature Highlights List (3 Bullet Points) */}
                <div className="space-y-2 pt-2 border-t border-[#E5DDD0]">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Curated Journey Highlights (Optional)
                  </label>
                  <div className="space-y-2">
                    {(fields.highlights || ["", "", ""]).map((hl, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground w-6 text-center">
                          {i + 1}.
                        </span>
                        <Input
                          placeholder={`Highlight #${i + 1} (e.g. Private lakeside dining)...`}
                          value={hl}
                          onChange={(e) => {
                            const updated = [...(fields.highlights || ["", "", ""])];
                            updated[i] = e.target.value;
                            setFields({ ...fields, highlights: updated });
                          }}
                          className="bg-white dark:bg-background border-[#E5DDD0] text-xs h-9 flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Call-to-Action Button & URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5DDD0]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Call-to-Action Button Label <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Inquire with a Concierge"
                      value={fields.ctaText}
                      onChange={(e) => setFields({ ...fields, ctaText: e.target.value })}
                      className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Destination Link URL <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="https://www.escoraholidays.com/plan"
                      value={fields.ctaUrl}
                      onChange={(e) => setFields({ ...fields, ctaUrl: e.target.value })}
                      className="bg-white dark:bg-background border-[#E5DDD0] text-sm h-10"
                    />
                  </div>
                </div>

                {/* 8. Secondary Note & Accent Color */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5DDD0]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Secondary Footer Note (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Limited private sanctuary suites available for upcoming season."
                      value={fields.secondaryNote || ""}
                      onChange={(e) => setFields({ ...fields, secondaryNote: e.target.value })}
                      className="bg-white dark:bg-background border-[#E5DDD0] text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-[#24543D]" /> Accent Theme Color
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      {[
                        { color: "#24543D", label: "Forest Green" },
                        { color: "#855A18", label: "Antique Gold" },
                        { color: "#304F7D", label: "Classic Navy" },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setFields({ ...fields, accentColor: item.color })}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                            fields.accentColor === item.color
                              ? "border-foreground ring-1 ring-foreground/20 font-medium"
                              : "border-[#E5DDD0] opacity-80 hover:opacity-100"
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation for Step 3 */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous: Templates
                </Button>
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] gap-2 px-5"
                >
                  Continue to Preview & Validate <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW & VALIDATE */}
          {currentStep === "preview" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
              {/* Preview Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DDD0] pb-3">
                <div>
                  <h3 className="font-serif text-base font-medium text-[#1A1410] dark:text-foreground">
                    4. Rendered Live Email Preview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    See exactly how this email renders in modern desktop and mobile email clients.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sample Personalization Toggle */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSimulateSampleData(!simulateSampleData)}
                    className="h-8 text-xs gap-1.5"
                    title="Toggle between real merge tags and sample customer data"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    {simulateSampleData ? "Sample: Lady Eleanor" : "Raw: {{name}}"}
                  </Button>

                  {/* Desktop / Mobile Toggle */}
                  <div className="flex items-center border border-[#E5DDD0] rounded-md p-0.5 bg-white dark:bg-card">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                        previewDevice === "desktop"
                          ? "bg-[#24543D] text-[#FAF7F1]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Desktop view (620px width)"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                        previewDevice === "mobile"
                          ? "bg-[#24543D] text-[#FAF7F1]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Mobile view (375px simulation)"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inbox Envelope Meta Preview */}
              <div className="p-4 rounded-xl border border-[#E5DDD0] bg-[#FFFDF9] dark:bg-card space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-16">From:</span>
                  <span className="text-foreground">Escora Holidays &lt;concierge@escoraholidays.com&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-16">Subject:</span>
                  <span className="text-foreground font-medium">
                    {simulateSampleData
                      ? fields.subject
                          .replace(/\{\{\s*name\s*\}\}/gi, "Lady Eleanor")
                          .replace(/\{\{\s*destination\s*\}\}/gi, "Munnar & Alleppey")
                      : fields.subject || "(No subject line)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-16">Preheader:</span>
                  <span className="text-muted-foreground">
                    {fields.previewText || "(No preview preheader text provided)"}
                  </span>
                </div>
              </div>

              {/* Rendered Email Simulator Container */}
              <div className="flex justify-center py-4 bg-[#F0ECE4] dark:bg-muted/30 rounded-2xl p-6 border border-[#E5DDD0]">
                <div
                  className={`transition-all duration-300 shadow-xl rounded-xl overflow-hidden bg-white ${
                    previewDevice === "mobile" ? "w-[380px] max-w-full" : "w-[640px] max-w-full"
                  }`}
                >
                  {/* Phone Notch Simulation Header when in mobile mode */}
                  {previewDevice === "mobile" && (
                    <div className="bg-[#1A1410] text-[#FAF7F1] py-1.5 px-4 text-[10px] flex items-center justify-between border-b border-zinc-700">
                      <span>9:41</span>
                      <div className="h-2 w-12 bg-zinc-600 rounded-full" />
                      <span>5G · 100%</span>
                    </div>
                  )}

                  {/* Rendered Email HTML Output */}
                  <div
                    className="p-4 overflow-x-auto text-[#1A1410]"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              </div>

              {/* Bottom Navigation for Step 4 */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous: Customize
                </Button>
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] gap-2 px-5"
                >
                  Review & Save Draft <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SAVE */}
          {currentStep === "save" && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-[#E5DDD0] pb-3">
                <h3 className="font-serif text-base font-medium text-[#1A1410] dark:text-foreground">
                  5. Review and Save Campaign Draft
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verify validation checks and finalize your campaign draft.
                </p>
              </div>

              {/* Validation Status Checklist */}
              <div
                className={`p-5 rounded-xl border ${
                  isValid
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                } space-y-3`}
              >
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                  <h4 className="text-sm font-semibold text-foreground">
                    {isValid
                      ? "Ready to Save: All Campaign Requirements Satisfied"
                      : "Validation Attention Required"}
                  </h4>
                </div>

                {!isValid && (
                  <ul className="text-xs text-destructive space-y-1 list-disc pl-5">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}

                {isValid && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This campaign will be saved in <strong>Draft</strong> status. Staff approval and optional scheduling can be completed afterwards from the campaigns dashboard.
                  </p>
                )}
              </div>

              {/* Summary Overview Card */}
              <div className="bg-[#FFFDF9] dark:bg-card border border-[#E5DDD0] rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Campaign Specification
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Internal Name:</span>
                    <strong className="text-foreground">{fields.name || "Untitled Campaign"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Audience Segment:</span>
                    <strong className="text-foreground capitalize">
                      {fields.audienceType.replace("_", " ")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Template Preset:</span>
                    <strong className="text-foreground">{selectedTemplate.title}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Estimated Reach:</span>
                    <strong className="text-foreground">
                      {audienceEstimate ? `${audienceEstimate.eligibleRecipients} eligible contacts` : "Pending calculation"}
                    </strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5DDD0] space-y-1 text-xs">
                  <span className="text-muted-foreground block">Subject Line:</span>
                  <p className="text-foreground font-serif italic text-sm">{fields.subject}</p>
                </div>
              </div>

              {/* Bottom Navigation for Step 5 */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous: Preview
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!isValid || isSaving}
                  className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] gap-2 px-6 font-medium shadow-sm"
                  data-testid="button-save-campaign-draft"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving Campaign..." : initialCampaign ? "Save Changes" : "Save as Draft"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            STICKY FOOTER ACTIONS (CANCEL · PREVIEW · SAVE)
        ============================================================ */}
        <div className="shrink-0 px-6 py-3.5 border-t border-[#E5DDD0] bg-[#FFFDF9] dark:bg-card flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(currentStep === "preview" ? "customize" : "preview")}
              className={`text-xs gap-1.5 h-9 ${
                currentStep === "preview"
                  ? "bg-[#24543D]/10 text-[#24543D] border-[#24543D]/40 font-medium"
                  : "text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {currentStep === "preview" ? "Back to Editor" : "Live Preview"}
            </Button>

            <Button
              type="button"
              onClick={handleSaveDraft}
              disabled={!isValid || isSaving}
              className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] gap-1.5 text-xs h-9 px-4 font-medium"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : initialCampaign ? "Save Changes" : "Save as Draft"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* QUICK LOOK TEMPLATE MODAL */}
      <Dialog
        open={templateInspectModal !== null}
        onOpenChange={(open) => !open && setTemplateInspectModal(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#855A18]" />
              {templateInspectModal?.title}
            </DialogTitle>
          </DialogHeader>

          {templateInspectModal && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {templateInspectModal.description}
              </p>

              <div className="p-4 rounded-xl border border-[#E5DDD0] bg-white overflow-hidden max-h-96 overflow-y-auto text-xs">
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateCampaignHtml({
                      ...templateInspectModal.defaultValues,
                      name: "Sample Campaign",
                      audienceType: "all_contacts",
                      templateId: templateInspectModal.id,
                    })
                      .replace(/\{\{\s*name\s*\}\}/gi, "Lady Eleanor")
                      .replace(/\{\{\s*destination\s*\}\}/gi, "Munnar & Alleppey")
                      .replace(/\{\{\s*unsubscribeUrl\s*\}\}/gi, "#"),
                  }}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateInspectModal(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    handleSelectTemplate(templateInspectModal);
                    setTemplateInspectModal(null);
                  }}
                  className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1]"
                >
                  Use This Template
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
