import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Filter,
  RefreshCw,
} from "lucide-react";

export interface AutomationFormData {
  id?: string;
  name: string;
  category: "transactional" | "scheduled" | "operational";
  trigger: string;
  triggerDescription: string;
  templateId: string;
  templateName: string;
  recipientLogic: string;
  timingType: "immediate" | "delay" | "scheduled_offset";
  delayValue: number;
  delayUnit: "minutes" | "hours" | "days";
  requiresApproval: boolean;
  enabled: boolean;
  conditions?: {
    minAmount?: number;
    travelStyle?: string;
  };
}

export const PREDEFINED_TRIGGERS = [
  {
    trigger: "enquiry_submitted",
    label: "Enquiry Acknowledgement",
    category: "transactional" as const,
    description: "Dispatched immediately when a guest submits a website inquiry or concierge request.",
    defaultTemplateId: "luxury_welcome_ack",
    defaultTemplateName: "Luxury Welcome & Enquiry Acknowledgement",
    defaultRecipient: "Direct to guest email from Enquiry record",
    defaultTimingType: "immediate" as const,
    defaultDelayValue: 0,
    defaultDelayUnit: "minutes" as const,
    defaultApproval: false,
  },
  {
    trigger: "booking_confirmed",
    label: "Booking Confirmation",
    category: "transactional" as const,
    description: "Dispatched when booking status transitions to Confirmed.",
    defaultTemplateId: "royal_booking_confirmation",
    defaultTemplateName: "Royal Booking Confirmation & Sanctuary Summary",
    defaultRecipient: "Lead guest email from Order record",
    defaultTimingType: "immediate" as const,
    defaultDelayValue: 0,
    defaultDelayUnit: "minutes" as const,
    defaultApproval: false,
  },
  {
    trigger: "payment_succeeded",
    label: "Payment Confirmation & Receipt",
    category: "transactional" as const,
    description: "Dispatched upon verified receipt of deposit or full invoice payment.",
    defaultTemplateId: "payment_receipt_ledger",
    defaultTemplateName: "Escora Official Payment Receipt & Ledger Statement",
    defaultRecipient: "Payer contact email address",
    defaultTimingType: "immediate" as const,
    defaultDelayValue: 0,
    defaultDelayUnit: "minutes" as const,
    defaultApproval: false,
  },
  {
    trigger: "payment_reminder_due",
    label: "Payment Deadline Reminder",
    category: "scheduled" as const,
    description: "Automated schedule triggered ahead of invoice due date for unpaid balances.",
    defaultTemplateId: "payment_deadline_notice",
    defaultTemplateName: "Gentle Balance Settlement Reminder",
    defaultRecipient: "Guest on pending balance order",
    defaultTimingType: "delay" as const,
    defaultDelayValue: 48,
    defaultDelayUnit: "hours" as const,
    defaultApproval: false,
  },
  {
    trigger: "trip_completed",
    label: "Post-Trip Thank-You & Review Request",
    category: "scheduled" as const,
    description: "Dispatched 24 hours after completion of tour requesting feedback and private review.",
    defaultTemplateId: "post_trip_review_feedback",
    defaultTemplateName: "Welcome Home & Private Experience Review Request",
    defaultRecipient: "Completed journey guests",
    defaultTimingType: "delay" as const,
    defaultDelayValue: 24,
    defaultDelayUnit: "hours" as const,
    defaultApproval: false,
  },
];

export const AVAILABLE_TEMPLATES = [
  { id: "luxury_welcome_ack", name: "Luxury Welcome & Enquiry Acknowledgement", tag: "Transactional" },
  { id: "royal_booking_confirmation", name: "Royal Booking Confirmation & Sanctuary Summary", tag: "Transactional" },
  { id: "payment_receipt_ledger", name: "Escora Official Payment Receipt & Ledger Statement", tag: "Financial" },
  { id: "payment_deadline_notice", name: "Gentle Balance Settlement Reminder", tag: "Financial" },
  { id: "post_trip_review_feedback", name: "Welcome Home & Private Experience Review Request", tag: "Lifecycle" },
  { id: "custom_template", name: "Custom / Bespoke Notification Layout", tag: "Custom" },
];

const RECIPIENT_OPTIONS = [
  "Direct to guest email from Enquiry record",
  "Lead guest email from Order record",
  "Payer contact email address",
  "Guest on pending balance order",
  "Completed journey guests",
  "Custom Recipient List",
];

interface AutomationConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: any | null; // existing automation when editing, or null for new
  onSave: (data: AutomationFormData) => Promise<void>;
  isSaving: boolean;
}

export default function AutomationConfigModal({
  open,
  onOpenChange,
  automation,
  onSave,
  isSaving,
}: AutomationConfigModalProps) {
  const isEditing = Boolean(automation?.id);

  const [formData, setFormData] = useState<AutomationFormData>({
    name: "",
    category: "transactional",
    trigger: "enquiry_submitted",
    triggerDescription: "",
    templateId: "luxury_welcome_ack",
    templateName: "Luxury Welcome & Enquiry Acknowledgement",
    recipientLogic: "Enquiring Guest primary email (guestEmail)",
    timingType: "immediate",
    delayValue: 0,
    delayUnit: "hours",
    requiresApproval: false,
    enabled: true,
    conditions: {
      minAmount: undefined,
      travelStyle: "",
    },
  });

  const [customRecipient, setCustomRecipient] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Populate form data when modal opens or automation changes
  useEffect(() => {
    setServerError(null);
    if (automation) {
      const templateMatch = AVAILABLE_TEMPLATES.find(
        (t) => t.id === automation.templateId || t.name === automation.template || t.name === automation.templateName
      );
      setFormData({
        id: automation.id,
        name: automation.name || "",
        category: automation.category || "transactional",
        trigger: automation.trigger || "enquiry_submitted",
        triggerDescription: automation.triggerDescription || "",
        templateId: automation.templateId || templateMatch?.id || "custom_template",
        templateName: automation.templateName || automation.template || templateMatch?.name || "Standard Notification",
        recipientLogic: automation.recipientLogic || "Lead Guest & Primary Contact (customerEmail)",
        timingType: automation.timingType || (automation.delayValue ? "delay" : "immediate"),
        delayValue: automation.delayValue ?? 0,
        delayUnit: (automation.delayUnit as any) || "hours",
        requiresApproval: Boolean(automation.requiresApproval),
        enabled: automation.enabled !== false,
        conditions: automation.conditions || { minAmount: undefined, travelStyle: "" },
      });
      setCustomRecipient(!RECIPIENT_OPTIONS.includes(automation.recipientLogic));
    } else {
      // Default to first predefined trigger
      const firstTrigger = PREDEFINED_TRIGGERS[0];
      setFormData({
        name: "New Guest Enquiry Welcome",
        category: firstTrigger.category,
        trigger: firstTrigger.trigger,
        triggerDescription: firstTrigger.description,
        templateId: firstTrigger.defaultTemplateId,
        templateName: firstTrigger.defaultTemplateName,
        recipientLogic: firstTrigger.defaultRecipient,
        timingType: firstTrigger.defaultTimingType,
        delayValue: firstTrigger.defaultDelayValue,
        delayUnit: firstTrigger.defaultDelayUnit,
        requiresApproval: firstTrigger.defaultApproval,
        enabled: true,
        conditions: { minAmount: undefined, travelStyle: "" },
      });
      setCustomRecipient(false);
    }
    setFormErrors({});
  }, [automation, open]);

  // Handle trigger change to auto-fill sensible defaults
  const handleTriggerChange = (newTrigger: string) => {
    const predefined = PREDEFINED_TRIGGERS.find((t) => t.trigger === newTrigger);
    if (predefined) {
      setFormData((prev) => ({
        ...prev,
        trigger: newTrigger,
        name: prev.name.startsWith("New ") || !prev.name ? predefined.label : prev.name,
        category: predefined.category,
        triggerDescription: predefined.description,
        templateId: predefined.defaultTemplateId,
        templateName: predefined.defaultTemplateName,
        recipientLogic: predefined.defaultRecipient,
        timingType: predefined.defaultTimingType,
        delayValue: predefined.defaultDelayValue,
        delayUnit: predefined.defaultDelayUnit,
        requiresApproval: predefined.defaultApproval,
      }));
    } else {
      setFormData((prev) => ({ ...prev, trigger: newTrigger }));
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const match = AVAILABLE_TEMPLATES.find((t) => t.id === templateId);
    setFormData((prev) => ({
      ...prev,
      templateId,
      templateName: match ? match.name : prev.templateName,
    }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Automation name is required.";
    if (!formData.trigger.trim()) errors.trigger = "Trigger event is required.";
    if (!formData.templateName.trim()) errors.template = "Email template selection is required.";
    if (!formData.recipientLogic.trim()) errors.recipient = "Recipient logic is required.";
    if (formData.timingType !== "immediate" && (formData.delayValue === undefined || formData.delayValue < 0)) {
      errors.delay = "Please specify a non-negative delay value.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    try {
      await onSave(formData);
    } catch (err: any) {
      setServerError(err.message || "Failed to persist automation configuration.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-card border-[#E5DDD0]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#24543D]">
            <Zap className="h-5 w-5" />
            <DialogTitle className="font-serif text-lg text-foreground">
              {isEditing ? `Edit Automation: ${formData.name}` : "Create New Email Automation Rule"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure automated event triggers, timing delays, templates, and recipient routing for Escora's email engine.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2 text-xs">
          {/* 1. Basic Identity */}
          <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1]/60">
            <h4 className="font-serif font-semibold text-foreground text-sm flex items-center justify-between">
              <span>1. Automation Rule Details</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-normal text-muted-foreground">Active State:</span>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, enabled: checked }))}
                />
                <Badge
                  variant="outline"
                  className={formData.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-zinc-100 text-zinc-500"}
                >
                  {formData.enabled ? "Live" : "Paused"}
                </Badge>
              </div>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-medium text-foreground">Automation Rule Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Booking Confirmation Notice"
                  className={`h-8 text-xs bg-white ${formErrors.name ? "border-red-500" : "border-[#E5DDD0]"}`}
                />
                {formErrors.name && <p className="text-[10px] text-red-600">{formErrors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Workflow Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as any }))}
                  className="w-full h-8 px-2 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                >
                  <option value="transactional">Transactional</option>
                  <option value="scheduled">Scheduled / Lifecycle</option>
                  <option value="operational">Operational / Internal</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Trigger Event Selection */}
          <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD0] bg-white">
            <h4 className="font-serif font-semibold text-foreground text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#24543D]" />
              2. Trigger Event & Conditions
            </h4>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-foreground">Trigger Event *</label>
              <select
                value={formData.trigger}
                onChange={(e) => handleTriggerChange(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
              >
                <optgroup label="Supported Predefined Triggers">
                  {PREDEFINED_TRIGGERS.map((pt) => (
                    <option key={pt.trigger} value={pt.trigger}>
                      {pt.label} ({pt.category})
                    </option>
                  ))}
                </optgroup>
                <option value="custom">Custom Event Trigger...</option>
              </select>
            </div>

            <div className="p-2.5 rounded-lg border border-[#E5DDD0]/70 bg-[#FAF7F1] text-[11px] text-muted-foreground">
              <strong className="text-foreground">Trigger Behavior:</strong>{" "}
              {formData.triggerDescription || "Dispatched when configured application event fires."}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Custom Trigger Description / Documentation</label>
              <Textarea
                rows={2}
                value={formData.triggerDescription}
                onChange={(e) => setFormData((p) => ({ ...p, triggerDescription: e.target.value }))}
                placeholder="Describe when and why this automation fires..."
                className="text-xs bg-white border-[#E5DDD0]"
              />
            </div>
          </div>

          {/* 3. Email Template & Recipient Routing */}
          <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1]/60">
            <h4 className="font-serif font-semibold text-foreground text-sm flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#24543D]" />
              3. Email Template & Recipient Routing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Email Template Layout *</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                >
                  {AVAILABLE_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} [{tmpl.tag}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Custom Template Name</label>
                <Input
                  value={formData.templateName}
                  onChange={(e) => setFormData((p) => ({ ...p, templateName: e.target.value }))}
                  placeholder="Template display title"
                  className="h-8 text-xs bg-white border-[#E5DDD0]"
                />
              </div>
            </div>

            {/* Recipient Logic */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-foreground">Recipient Resolution Logic *</label>
                <button
                  type="button"
                  onClick={() => setCustomRecipient(!customRecipient)}
                  className="text-[10px] text-[#24543D] hover:underline"
                >
                  {customRecipient ? "Choose standard pattern" : "Enter custom logic"}
                </button>
              </div>

              {customRecipient ? (
                <Input
                  value={formData.recipientLogic}
                  onChange={(e) => setFormData((p) => ({ ...p, recipientLogic: e.target.value }))}
                  placeholder="e.g. Lead Guest and Booking Co-traveler (emails separated by comma)"
                  className="h-8 text-xs bg-white border-[#E5DDD0]"
                />
              ) : (
                <select
                  value={formData.recipientLogic}
                  onChange={(e) => setFormData((p) => ({ ...p, recipientLogic: e.target.value }))}
                  className="w-full h-8 px-2 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                >
                  {RECIPIENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {formErrors.recipient && <p className="text-[10px] text-red-600">{formErrors.recipient}</p>}
            </div>
          </div>

          {/* 4. Timing & Delay Controls */}
          <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD0] bg-white">
            <h4 className="font-serif font-semibold text-foreground text-sm flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#24543D]" />
              4. Individual Timing & Delay Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Timing Model</label>
                <select
                  value={formData.timingType}
                  onChange={(e) => setFormData((p) => ({ ...p, timingType: e.target.value as any }))}
                  className="w-full h-8 px-2 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                >
                  <option value="immediate">Immediate Dispatch</option>
                  <option value="delay">Relative Delay After Event</option>
                  <option value="scheduled_offset">Scheduled Milestone Offset</option>
                </select>
              </div>

              {formData.timingType !== "immediate" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {formData.timingType === "delay" ? "Delay Amount" : "Offset Amount"}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.delayValue}
                      onChange={(e) => setFormData((p) => ({ ...p, delayValue: Number(e.target.value) || 0 }))}
                      className="h-8 text-xs bg-white border-[#E5DDD0]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Time Unit</label>
                    <select
                      value={formData.delayUnit}
                      onChange={(e) => setFormData((p) => ({ ...p, delayUnit: e.target.value as any }))}
                      className="w-full h-8 px-2 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="p-2.5 rounded-lg border border-[#E5DDD0]/70 bg-[#FAF7F1] text-[11px] text-muted-foreground">
              {formData.timingType === "immediate" ? (
                <span>Email will be queued and transmitted instantly when the event occurs.</span>
              ) : formData.timingType === "delay" ? (
                <span>
                  Dispatched precisely <strong>{formData.delayValue} {formData.delayUnit}</strong> after the event is triggered.
                </span>
              ) : (
                <span>
                  Scheduled <strong>{formData.delayValue} {formData.delayUnit}</strong> before/after the designated milestone date.
                </span>
              )}
            </div>
          </div>

          {/* 5. Human-in-the-Loop Approval & Governance */}
          <div className="space-y-3 p-4 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1]/60">
            <h4 className="font-serif font-semibold text-foreground text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#24543D]" />
                5. Approval Governance & Safeguards
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-normal text-muted-foreground">Requires Staff Review:</span>
                <Switch
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, requiresApproval: checked }))}
                />
              </div>
            </h4>

            <p className="text-[11px] text-muted-foreground">
              When approval is required, triggered emails will automatically pause in{" "}
              <strong className="text-foreground">"Pending Approval"</strong> status in the Delivery Audit tab. Authorized staff
              must review and approve the email before transmission.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  Minimum Order / Booking Amount Threshold (Optional)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 50000 (INR)"
                  value={formData.conditions?.minAmount ?? ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      conditions: {
                        ...p.conditions,
                        minAmount: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="h-8 text-xs bg-white border-[#E5DDD0]"
                />
                <span className="text-[10px] text-muted-foreground">Leave empty to apply to all values</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  Filter by Travel Style (Optional)
                </label>
                <select
                  value={formData.conditions?.travelStyle ?? ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      conditions: {
                        ...p.conditions,
                        travelStyle: e.target.value || undefined,
                      },
                    }))
                  }
                  className="w-full h-8 px-2 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                >
                  <option value="">All Travel Styles (No restriction)</option>
                  <option value="Ayurveda & Wellness">Ayurveda & Wellness</option>
                  <option value="Backwaters & Houseboat">Backwaters & Houseboat</option>
                  <option value="Hill Stations & Tea Estates">Hill Stations & Tea Estates</option>
                  <option value="Heritage & Culture">Heritage & Culture</option>
                  <option value="Coastal & Beach Luxury">Coastal & Beach Luxury</option>
                </select>
              </div>
            </div>
          </div>

          {serverError && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Error saving automation</p>
                <p className="text-[11px] text-red-600 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[#E5DDD0]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs h-8 border-[#E5DDD0]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="text-xs h-8 bg-[#24543D] hover:bg-[#1b3f2e] text-white gap-1.5"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving Configuration...
                </>
              ) : isEditing ? (
                "Update Automation"
              ) : (
                "Create Automation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
