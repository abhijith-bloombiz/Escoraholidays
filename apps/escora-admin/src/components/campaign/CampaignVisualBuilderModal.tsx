import React, { useState, useEffect, useId } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Send,
  Key,
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
import {
  SAMPLE_RECIPIENT_PROFILES,
  resolveMergeTagsClient,
  detectUnresolvedAndMalformedTags,
  type SampleRecipientProfile,
} from "./mergeTagResolver";

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
    status?: string;
    targetAudience: {
      type: VisualCampaignFields["audienceType"];
      groupId?: string | number | null;
      groupIds?: Array<string | number>;
      destinations?: string[];
      travelStyle?: string | null;
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
  const [selectedSampleProfile, setSelectedSampleProfile] = useState<SampleRecipientProfile>(
    SAMPLE_RECIPIENT_PROFILES[0]
  );
  const [templateInspectModal, setTemplateInspectModal] = useState<CampaignTemplatePreset | null>(null);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState("");

  // Authenticated email configuration query
  const { data: emailConfig } = useQuery<{
    provider: string;
    senderEmail: string;
    senderName: string;
    fullFrom: string;
    isConfigured: boolean;
    authMechanism: string;
    smtpHost?: string;
    smtpPort?: number;
  }>({
    queryKey: ["campaigns", "email-config"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/email-config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load email config");
      return res.json();
    },
    enabled: isOpen,
  });

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
          initialCampaign.contentHtml,
          {
            groupId: initialCampaign.targetAudience.groupId ?? undefined,
            groupIds: initialCampaign.targetAudience.groupIds,
            destinations: initialCampaign.targetAudience.destinations,
            travelStyle: initialCampaign.targetAudience.travelStyle,
          }
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
    totalSelected: number;
    eligibleRecipients: number;
    activeSubscribers: number;
    unsubscribedCount: number;
    excludedNotSubscribed: number;
    excludedUnsubscribed: number;
    excludedSuppressed: number;
    sampleRecipients: Array<{
      name: string;
      email: string;
      source: string;
      isSubscribed: boolean;
      isSuppressed?: boolean;
      consentStatus?: string;
    }>;
  }>({
    queryKey: ["campaigns", "audience-estimate", fields.audienceType, fields.groupId],
    queryFn: async () => {
      if ((fields.audienceType as string) === "custom_segment") {
        return {
          totalSelected: 0,
          eligibleRecipients: 0,
          activeSubscribers: 0,
          unsubscribedCount: 0,
          excludedNotSubscribed: 0,
          excludedUnsubscribed: 0,
          excludedSuppressed: 0,
          sampleRecipients: [],
        };
      }
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

  // Render HTML preview with centralized merge tag resolver & sample recipient
  const previewResolution = simulateSampleData
    ? resolveMergeTagsClient(compiledHtml, selectedSampleProfile)
    : {
        rendered: compiledHtml,
        tagValues: {},
        usedFallbacks: { name: false, destination: false },
        unresolvedTags: detectUnresolvedAndMalformedTags(compiledHtml).unresolved,
        malformedTags: detectUnresolvedAndMalformedTags(compiledHtml).malformed,
      };

  const previewHtml = previewResolution.rendered;

  // Render subject with personalization for envelope preview
  const previewSubjectResult = simulateSampleData
    ? resolveMergeTagsClient(fields.subject, selectedSampleProfile, { isHtml: false })
    : {
        rendered: fields.subject,
        tagValues: {},
        usedFallbacks: { name: false, destination: false },
        unresolvedTags: detectUnresolvedAndMalformedTags(fields.subject).unresolved,
        malformedTags: detectUnresolvedAndMalformedTags(fields.subject).malformed,
      };

  const previewSubject = previewSubjectResult.rendered;

  // Check for unresolved or malformed tags across entire template
  const fullTemplateText = `${fields.subject} ${fields.previewText} ${fields.heading} ${fields.lead || ""} ${fields.body} ${fields.quote || ""}`;
  const templateTagDetection = detectUnresolvedAndMalformedTags(fullTemplateText);
  const supportedTagPattern = /\{\{\s*(name|destination|year|email|unsubscribeurl)\s*\}\}/i;
  const invalidTemplateTags = templateTagDetection.unresolved.filter((t) => !supportedTagPattern.test(t));
  const malformedTemplateTags = templateTagDetection.malformed;

  // Validation
  const validationErrors: string[] = [];
  if (!fields.name.trim()) validationErrors.push("Campaign Internal Name is required.");
  if (!fields.subject.trim()) validationErrors.push("Email Subject Line is required.");
  if (!fields.heading.trim()) validationErrors.push("Email Heading is required.");
  if (!fields.body.trim()) validationErrors.push("Email Body content is required.");
  if (!fields.ctaText.trim()) validationErrors.push("CTA Button text is required.");
  if (!fields.ctaUrl.trim()) validationErrors.push("CTA Destination URL is required.");
  if (invalidTemplateTags.length > 0) {
    validationErrors.push(`Unresolved merge tags detected: ${invalidTemplateTags.join(", ")}. Please use supported tags.`);
  }
  if (malformedTemplateTags.length > 0) {
    validationErrors.push(`Malformed merge tag syntax detected: ${malformedTemplateTags.join(", ")}. Check for missing braces.`);
  }
  if ((fields.audienceType as string) === "custom_segment") {
    validationErrors.push(
      "The 'Custom Destination Segment' audience option has been retired. Please select one of the four supported audience segments (All Contacts, Inquiries Prospects Only, Confirmed Journey Guests Only, or Audience Group)."
    );
  }

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

  // Test email mutation (never touches audience groups)
  const sendTestMutation = useMutation({
    mutationFn: async (recipient: string) => {
      const res = await fetch("/api/campaigns/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientEmail: recipient,
          campaign: {
            name: fields.name || "Test Campaign",
            subject: fields.subject || "Escora Journeys Test Email",
            previewText: fields.previewText,
            contentHtml: compiledHtml,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to dispatch test email");
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Dispatched",
        description: data.message || `Test email dispatched to ${testRecipientEmail || emailConfig?.senderEmail}`,
      });
      setTestEmailDialogOpen(false);
      setTestRecipientEmail("");
    },
    onError: (err: any) => {
      toast({
        title: "Test Email Failed",
        description: err.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

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
                      <option value="subscribed_contacts">Subscribed Contacts Only</option>
                      <option value="audience_group">Audience Group (Custom Segment)</option>
                      {(fields.audienceType as string) === "custom_segment" && (
                        <option value="custom_segment" disabled>
                          -- Retired: Custom Destination Segment (Select a supported option) --
                        </option>
                      )}
                    </select>
                    <span className="text-[11px] text-muted-foreground">
                      Selects active, subscribed contacts matching these criteria.
                    </span>

                    {(fields.audienceType as string) === "custom_segment" && (
                      <div className="mt-2.5 p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-semibold block">Retired Audience Option</span>
                          This campaign was saved with the retired <strong>Custom Destination Segment</strong>. Please reassign the audience to one of the four supported segments above before saving.
                        </div>
                      </div>
                    )}

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

                {/* Audience Estimate & Consent Breakdown Box */}
                <div className="p-3.5 rounded-lg border border-[#24543D]/25 bg-[#24543D]/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#24543D]">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="font-semibold text-sm">Audience Membership & Consent Breakdown</span>
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

                  {isAudienceLoading ? (
                    <div className="text-muted-foreground py-2 text-center">Calculating audience breakdown...</div>
                  ) : audienceEstimate ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                        <div className="bg-white/80 p-2 rounded border border-[#E5DDD0]">
                          <span className="text-sm font-bold block text-foreground">{audienceEstimate.totalSelected}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Selected</span>
                        </div>
                        <div className="bg-emerald-50/80 p-2 rounded border border-emerald-200">
                          <span className="text-sm font-bold block text-emerald-800">{audienceEstimate.eligibleRecipients}</span>
                          <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">Eligible Marketing</span>
                        </div>
                        <div className="bg-slate-50/80 p-2 rounded border border-slate-200">
                          <span className="text-sm font-bold block text-slate-700">{audienceEstimate.excludedNotSubscribed}</span>
                          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Not Subscribed</span>
                        </div>
                        <div className="bg-amber-50/80 p-2 rounded border border-amber-200">
                          <span className="text-sm font-bold block text-amber-800">{audienceEstimate.excludedUnsubscribed}</span>
                          <span className="text-[10px] text-amber-700 uppercase tracking-wider">Unsubscribed</span>
                        </div>
                        <div className="bg-red-50/80 p-2 rounded border border-red-200">
                          <span className="text-sm font-bold block text-red-700">{audienceEstimate.excludedSuppressed}</span>
                          <span className="text-[10px] text-red-600 uppercase tracking-wider">Suppressed</span>
                        </div>
                      </div>

                      {audienceEstimate.eligibleRecipients === 0 ? (
                        <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span>
                            <strong>0 eligible marketing recipients:</strong> All selected contacts are either not subscribed, unsubscribed, or suppressed. Marketing emails require explicit marketing consent.
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">
                          ✓ <strong>{audienceEstimate.eligibleRecipients}</strong> out of <strong>{audienceEstimate.totalSelected}</strong> contacts have verified marketing consent and will receive this campaign.
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Real-time audience calculation active.</span>
                  )}
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
                  {/* Send Test Email Action */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTestRecipientEmail(emailConfig?.senderEmail || "arunopera7@gmail.com");
                      setTestEmailDialogOpen(true);
                    }}
                    className="h-8 text-xs gap-1.5 border-[#24543D]/40 text-[#24543D] hover:bg-[#24543D]/10 font-medium"
                    data-testid="button-open-test-email-modal"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Test Email
                  </Button>

                  {/* Sample Personalization Toggle & Recipient Selector */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSimulateSampleData(!simulateSampleData)}
                      className="h-8 text-xs gap-1.5"
                      title="Toggle between real merge tags and sample customer data"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      {simulateSampleData ? "Personalized Preview" : "Raw {{tags}}"}
                    </Button>

                    {simulateSampleData && (
                      <select
                        value={selectedSampleProfile.id}
                        onChange={(e) => {
                          const found = SAMPLE_RECIPIENT_PROFILES.find((p) => p.id === e.target.value);
                          if (found) setSelectedSampleProfile(found);
                        }}
                        className="h-8 text-xs px-2 rounded-md border border-[#E5DDD0] bg-white dark:bg-card text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                        title="Choose a realistic sample recipient profile to preview merge tag resolution"
                      >
                        {SAMPLE_RECIPIENT_PROFILES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

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

              {/* Tag Validation Alerts */}
              {(invalidTemplateTags.length > 0 || malformedTemplateTags.length > 0) && (
                <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/80 dark:bg-red-950/30 text-red-900 dark:text-red-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">Unresolved or Malformed Merge Tags Detected</p>
                    {invalidTemplateTags.length > 0 && (
                      <p>
                        The following placeholders cannot be resolved and will block campaign delivery:{" "}
                        <span className="font-mono font-medium">{invalidTemplateTags.join(", ")}</span>.
                        Supported tags are: <span className="font-mono">{"{{name}}, {{destination}}, {{year}}, {{email}}, {{unsubscribeUrl}}"}</span>.
                      </p>
                    )}
                    {malformedTemplateTags.length > 0 && (
                      <p>
                        Syntax error in merge tag braces:{" "}
                        <span className="font-mono font-medium">{malformedTemplateTags.join(", ")}</span>.
                        Ensure tags have double braces on both sides.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Personalization Tag Resolution Indicators */}
              {simulateSampleData && (
                <div className="p-3 rounded-xl border border-[#E5DDD0] bg-[#FFFDF9] dark:bg-card/60 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-medium text-[11px] flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-600" />
                    Resolved Tags:
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] py-0 h-5 gap-1 ${
                      previewResolution.usedFallbacks.name
                        ? "bg-amber-500/10 text-amber-800 border-amber-300"
                        : "bg-emerald-500/10 text-emerald-800 border-emerald-300"
                    }`}
                  >
                    <span>{"{{name}}"}</span> →{" "}
                    <strong>{previewResolution.tagValues["{{name}}"] || selectedSampleProfile.name || "Valued Guest"}</strong>
                    {previewResolution.usedFallbacks.name && (
                      <span className="text-[9px] opacity-75">(Fallback)</span>
                    )}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={`text-[10px] py-0 h-5 gap-1 ${
                      previewResolution.usedFallbacks.destination
                        ? "bg-amber-500/10 text-amber-800 border-amber-300"
                        : "bg-emerald-500/10 text-emerald-800 border-emerald-300"
                    }`}
                  >
                    <span>{"{{destination}}"}</span> →{" "}
                    <strong>{previewResolution.tagValues["{{destination}}"] || "Kerala"}</strong>
                    {previewResolution.usedFallbacks.destination && (
                      <span className="text-[9px] opacity-75">(Fallback)</span>
                    )}
                  </Badge>

                  <Badge variant="outline" className="text-[10px] py-0 h-5 bg-muted/60 text-muted-foreground">
                    <span>{"{{year}}"}</span> → {new Date().getFullYear()}
                  </Badge>

                  <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
                    Simulating: {selectedSampleProfile.description}
                  </span>
                </div>
              )}

              {/* Inbox Envelope Meta Preview */}
              <div className="p-4 rounded-xl border border-[#E5DDD0] bg-[#FFFDF9] dark:bg-card space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-16">From:</span>
                  <span className="text-foreground font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded">
                    {emailConfig?.fullFrom || '"Escora Journeys" <arunopera7@gmail.com>'}
                  </span>
                  {emailConfig && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 h-4.5 ${
                        emailConfig.isConfigured
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                          : "bg-amber-500/10 text-amber-700 border-amber-300"
                      }`}
                    >
                      {emailConfig.isConfigured
                        ? "Authenticated (Gmail SMTP)"
                        : "App Password Required"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-16">Subject:</span>
                  <span className="text-foreground font-medium">
                    {previewSubject || "(No subject line)"}
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

                {initialCampaign?.status === "approved" && (
                  <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Approval Safeguard:</strong>
                      Saving modifications to this approved campaign will automatically invalidate its existing approval and reset the status to <strong>Draft</strong>. It must be submitted and approved again before live sending.
                    </div>
                  </div>
                )}

                {initialCampaign?.status === "pending_approval" && (
                  <div className="p-3.5 rounded-lg border border-blue-500/40 bg-blue-500/10 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Review Queue Notice:</strong>
                      Saving edits will withdraw this campaign from the pending approval queue and return it to <strong>Draft</strong> status. You can resubmit it for review when ready.
                    </div>
                  </div>
                )}

                {initialCampaign?.status === "rejected" && (
                  <div className="p-3.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Revision Notice:</strong>
                      Saving your corrections will clear previous rejection remarks and reset the campaign to <strong>Draft</strong> status, ready for re-review.
                    </div>
                  </div>
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
                      {(fields.audienceType as string) === "custom_segment" ? (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          Custom Destination Segment (Retired — Action Required)
                        </span>
                      ) : (
                        fields.audienceType.replace("_", " ")
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Template Preset:</span>
                    <strong className="text-foreground">{selectedTemplate.title}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Audience Reach:</span>
                    <strong className="text-foreground">
                      {audienceEstimate ? (
                        <span>
                          {audienceEstimate.totalSelected} selected contacts ({audienceEstimate.eligibleRecipients} eligible for marketing)
                        </span>
                      ) : (
                        "Pending calculation"
                      )}
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

      {/* TEST EMAIL DISPATCH DIALOG */}
      <Dialog
        open={testEmailDialogOpen}
        onOpenChange={(open) => !open && setTestEmailDialogOpen(false)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Send className="h-4 w-4 text-[#24543D]" />
              Send Test Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Test Mode Only — Audience Protected</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                This dispatches a single test email exclusively to the email address entered below. 
                <strong> No audience members or contacts will be emailed</strong>, and the campaign status will remain in Draft.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-foreground block">
                Sender Identity (Authentic Gmail SMTP)
              </label>
              <div className="p-2.5 rounded border border-[#E5DDD0] bg-muted/30 font-mono text-[11px] space-y-1">
                <div>
                  <span className="text-muted-foreground">From: </span>
                  <strong className="text-foreground">
                    {emailConfig?.fullFrom || '"Escora Journeys" <arunopera7@gmail.com>'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Mechanism: </span>
                  <span className="text-foreground">
                    {emailConfig?.authMechanism || "Gmail SMTP (Google App Password / 2FA)"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span className={emailConfig?.isConfigured ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                    {emailConfig?.isConfigured ? "Ready to send" : "Pending GMAIL_APP_PASSWORD in .env"}
                  </span>
                </div>
              </div>
            </div>

            {!emailConfig?.isConfigured && (
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Key className="h-3.5 w-3.5 text-[#24543D]" />
                  <span>Required Setup for arunopera7@gmail.com</span>
                </div>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                  <li>Enable 2-Step Verification on Google Account (arunopera7@gmail.com).</li>
                  <li>Visit Google Account &gt; Security &gt; <strong>App Passwords</strong>.</li>
                  <li>Generate a 16-character password named &quot;Escora Admin&quot;.</li>
                  <li>Set <code className="bg-muted px-1 rounded">GMAIL_APP_PASSWORD=...</code> in server <code className="bg-muted px-1 rounded">.env</code>.</li>
                </ol>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                Recipient Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="e.g. arunopera7@gmail.com"
                value={testRecipientEmail}
                onChange={(e) => setTestRecipientEmail(e.target.value)}
                className="h-9 text-xs"
                data-testid="input-test-email-recipient"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter your own email to preview and verify the layout in your inbox.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTestEmailDialogOpen(false)}
                disabled={sendTestMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const target = testRecipientEmail.trim() || emailConfig?.senderEmail || "arunopera7@gmail.com";
                  sendTestMutation.mutate(target);
                }}
                disabled={sendTestMutation.isPending}
                className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] gap-1.5"
                data-testid="button-confirm-send-test-email"
              >
                <Send className="h-3.5 w-3.5" />
                {sendTestMutation.isPending ? "Sending Test..." : "Send Test Email"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
