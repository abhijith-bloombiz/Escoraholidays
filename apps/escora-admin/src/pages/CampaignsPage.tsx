import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  Users,
  Eye,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  Sparkles,
  Bell,
  FileText,
  RotateCcw,
  ExternalLink,
  XCircle,
  CreditCard,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  Zap,
  Copy,
  ChevronRight,
  Filter,
  Search,
  LayoutGrid,
  List,
  Sliders,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import CampaignVisualBuilderModal from "@/components/campaign/CampaignVisualBuilderModal";
import ManageAudiencesModal from "@/components/campaign/ManageAudiencesModal";
import AutomationConfigModal, { AutomationFormData } from "@/components/campaign/AutomationConfigModal";

export interface AutomationSettingsData {
  id?: string;
  enableBookingConfirmation: boolean;
  enableEnquiryAcknowledgement?: boolean;
  enableStaffNotifications?: boolean;
  enableItineraryUpdates: boolean;
  enableEnquiryFollowups: boolean;
  enablePostTripFeedback: boolean;
  enablePaymentReceipts: boolean;
  enablePaymentReminders: boolean;
  enablePreTripReminders: boolean;
  preTripReminderDays?: number;
  enableCancellationNotifications: boolean;
  enableDocumentDelivery: boolean;
  enquiryFollowupDelayHours: number;
  postTripFeedbackDelayHours: number;
}

export interface AutomationItem {
  id: string;
  name: string;
  category: "transactional" | "scheduled" | "operational";
  trigger: string;
  triggerDescription?: string;
  template?: string;
  templateId?: string;
  templateName?: string;
  recipientLogic: string;
  timing?: string;
  timingType?: "immediate" | "delay" | "scheduled_offset";
  delayKey?: string;
  delayValue?: number;
  delayUnit?: "minutes" | "hours" | "days" | string;
  requiresApproval: boolean;
  enabled: boolean;
  conditions?: Record<string, any>;
  lastExecutedAt?: string | null;
  lastExecutionStatus?: "success" | "failed" | "skipped" | null;
  lastExecutionError?: string | null;
  nextScheduledAt?: string | null;
  stats: {
    sent: number;
    failed: number;
    skipped: number;
    pending: number;
    lastExecutedAt: string | null;
    lastExecutionStatus?: string | null;
    lastExecutionError?: string | null;
    nextScheduledAt: string | null;
  };
}

export const RETIRED_AUTOMATION_IDS = new Set([
  "pre_trip_reminder",
  "travel_document_delivery",
  "enquiry_followup",
  "itinerary_update",
  "internal_staff_notification",
]);

export const TRIGGER_MAP_TO_NOTIF_TYPE: Record<string, string> = {
  enquiry_submitted: "enquiry_acknowledgement",
  booking_confirmed: "booking_confirmation",
  payment_succeeded: "payment_receipt",
  payment_reminder_due: "payment_deadline_reminder",
  trip_completed: "post_trip_feedback",
};

export const AUTOMATION_PLAIN_DESCRIPTIONS: Record<string, string> = {
  enquiry_submitted: "Sent immediately when a customer submits a travel enquiry, confirming their request has been received.",
  booking_confirmed: "Sent when an itinerary proposal is accepted and booked, providing the official confirmation and package summary.",
  payment_succeeded: "Sent automatically upon receipt of payment, containing the payment receipt and billing acknowledgment.",
  payment_reminder_due: "Sent prior to the invoice payment deadline to gently remind the customer of pending balance.",
  trip_completed: "Sent 24 hours after the holiday concludes to thank the guest and invite feedback and reviews.",
};

export function getPlainTiming(auto: AutomationItem): string {
  if (auto.timingType === "immediate" || (!auto.delayValue && !auto.delayKey)) {
    return "Sent immediately upon trigger";
  }
  if (auto.delayValue) {
    const unit = auto.delayUnit || "hours";
    return `Delivered ${auto.delayValue} ${unit} after trigger`;
  }
  return auto.timing || "Scheduled delivery";
}

export function getSimpleCampaignStatus(
  status: string,
  deliveryMode?: "simulated" | "live" | null
): { label: string; badgeClass: string } {
  if (deliveryMode === "simulated" && (status === "sent" || status === "completed")) {
    return {
      label: "Simulated (Mock)",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
    };
  }
  switch (status) {
    case "draft":
      return { label: "Draft", badgeClass: "bg-stone-100 text-stone-700 border-stone-200" };
    case "pending_approval":
      return { label: "Awaiting Approval", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" };
    case "approved":
      return { label: "Approved", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
    case "scheduled":
      return { label: "Scheduled", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" };
    case "sending":
      return { label: "Sending...", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse" };
    case "sent":
    case "completed":
      return { label: "Sent (Live)", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    case "failed":
      return { label: "Failed", badgeClass: "bg-red-50 text-red-700 border-red-200" };
    case "rejected":
      return { label: "Needs Review", badgeClass: "bg-red-50 text-red-700 border-red-200" };
    case "cancelled":
      return { label: "Cancelled", badgeClass: "bg-stone-100 text-stone-600 border-stone-200" };
    default:
      return { label: status, badgeClass: "bg-stone-100 text-stone-700 border-stone-200" };
  }
}

interface CampaignItem {
  id: number;
  name: string;
  subject: string;
  previewText?: string | null;
  contentHtml: string;
  targetAudience: {
    type: "all_contacts" | "enquiries_only" | "confirmed_guests" | "subscribed_contacts" | "custom_segment" | "audience_group";
    destinations?: string[];
    travelStyle?: string | null;
    groupId?: string;
    groupIds?: string[];
  };
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "scheduled"
    | "sending"
    | "sent"
    | "completed"
    | "cancelled"
    | "failed";
  scheduledAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  submittedForApprovalAt?: string | null;
  sentAt?: string | null;
  stats: {
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    skippedCount: number;
  };
  deliveries?: Array<{
    recipientEmail: string;
    recipientName: string;
    status:
      | "sent"
      | "simulated"
      | "accepted"
      | "delivered"
      | "bounced"
      | "failed"
      | "skipped_unsubscribed"
      | "complained";
    deliveryStatus?: string | null;
    sentAt?: string;
    messageId?: string | null;
    error?: string | null;
  }>;
  deliveryMode?: "simulated" | "live" | null;
  createdAt: string;
  updatedAt: string;
}

interface SubscriberItem {
  email: string;
  name?: string | null;
  status?: "subscribed" | "not_subscribed" | "unsubscribed" | "suppressed";
  subscribed: boolean;
  token: string;
  source: string;
  unsubscribedAt?: string | null;
  suppressed?: boolean;
  suppressedAt?: string | null;
  suppressionReason?: string | null;
  suppressedBy?: string | null;
  consentDate?: string | null;
  consentMethod?: string | null;
  doubleOptInConfirmed?: boolean;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface NotificationItem {
  id: number;
  type: string;
  category: string;
  relatedType: string;
  relatedId: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status:
    | "pending"
    | "pending_approval"
    | "sending"
    | "sent"
    | "accepted"
    | "delivered"
    | "simulated"
    | "bounced"
    | "failed"
    | "cancelled"
    | "skipped";
  requiresApproval?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  scheduledFor?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  bouncedAt?: string | null;
  messageId?: string | null;
  error?: string | null;
  retryCount: number;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface AudiencePreviewData {
  totalSelected?: number;
  eligibleRecipients: number;
  eligibleCount?: number;
  activeSubscribers: number;
  unsubscribedCount: number;
  excludedNotSubscribed?: number;
  excludedUnsubscribed?: number;
  excludedSuppressed?: number;
  sampleRecipients: Array<{
    name: string;
    email: string;
    source: string;
    isSubscribed: boolean;
    consentStatus?: string;
  }>;
}

interface DashboardStats {
  campaignsSent: number;
  scheduledCampaigns: number;
  pendingApprovals: number;
  draftCampaigns: number;
  rejectedCampaigns: number;
  emailsSentOrDelivered: number;
  failedEmails: number;
  activeAutomations: number;
  totalAudienceGroups: number;
  activeSubscribers: number;
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Task-based view state: "overview" (clean default) | "campaigns" | "automations" | "audiences" | "history"
  const [activeView, setActiveView] = useState<"overview" | "campaigns" | "automations" | "audiences" | "history">("overview");
  const [expandedAutomationId, setExpandedAutomationId] = useState<string | null>(null);
  const [customerGroupsSubTab, setCustomerGroupsSubTab] = useState<"groups" | "registry">("groups");
  const [activeTab, setActiveTab] = useState<"campaigns" | "automations" | "subscribers" | "delivery_audit">("campaigns");

  // Dialog states for campaigns
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [statusConfirmEditCampaign, setStatusConfirmEditCampaign] = useState<{
    campaign: CampaignItem;
    type: "approved" | "pending_approval" | "scheduled" | "sent";
  } | null>(null);
  const [isStatusActionLoading, setIsStatusActionLoading] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCampaignForPreview, setSelectedCampaignForPreview] = useState<CampaignItem | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedCampaignForSchedule, setSelectedCampaignForSchedule] = useState<CampaignItem | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedCampaignForSend, setSelectedCampaignForSend] = useState<CampaignItem | null>(null);
  const [sendMockMode, setSendMockMode] = useState(true);

  // Test Email dialog state
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [selectedCampaignForTest, setSelectedCampaignForTest] = useState<CampaignItem | null>(null);
  const [testRecipientEmail, setTestRecipientEmail] = useState("");

  // Audience Groups modal state
  const [audienceModalOpen, setAudienceModalOpen] = useState(false);
  const [audienceModalGroupId, setAudienceModalGroupId] = useState<number | string | null>(null);
  const [audienceModalStartCreate, setAudienceModalStartCreate] = useState(false);

  // Campaign Rejection dialog
  const [rejectCampaignDialogOpen, setRejectCampaignDialogOpen] = useState(false);
  const [selectedCampaignForReject, setSelectedCampaignForReject] = useState<CampaignItem | null>(null);
  const [campaignRejectReason, setCampaignRejectReason] = useState("");

  // Automation delay configuration dialog
  const [delayConfigDialogOpen, setDelayConfigDialogOpen] = useState(false);
  const [selectedAutomationForDelay, setSelectedAutomationForDelay] = useState<AutomationItem | null>(null);
  const [automationDelayValueInput, setAutomationDelayValueInput] = useState<number>(24);

  // Automation rule management states
  const [automationModalOpen, setAutomationModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationItem | null>(null);
  const [automationViewMode, setAutomationViewMode] = useState<"cards" | "table">("cards");
  const [automationCategoryFilter, setAutomationCategoryFilter] = useState<string>("all");
  const [automationStatusFilter, setAutomationStatusFilter] = useState<string>("all");
  const [automationSearchQuery, setAutomationSearchQuery] = useState("");
  const [deleteConfirmAutomation, setDeleteConfirmAutomation] = useState<AutomationItem | null>(null);

  // Delivery log inspection & filters
  const [auditWorkflowFilter, setAuditWorkflowFilter] = useState<"all" | "manual" | "automation">("all");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("all");
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [selectedNotifDetails, setSelectedNotifDetails] = useState<NotificationItem | null>(null);
  const [previewNotificationId, setPreviewNotificationId] = useState<number | null>(null);

  // Campaign filters
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>("all");
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");

  // Subscriber filters & consent action dialogs
  const [subStatusFilter, setSubStatusFilter] = useState<"all" | "subscribed" | "not_subscribed" | "unsubscribed" | "opted_out" | "suppressed">("all");
  const [subSearchQuery, setSubSearchQuery] = useState("");

  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [selectedContactForUnsub, setSelectedContactForUnsub] = useState<SubscriberItem | null>(null);
  const [unsubReasonInput, setUnsubReasonInput] = useState("");

  const [recordConsentDialogOpen, setRecordConsentDialogOpen] = useState(false);
  const [selectedContactForConsent, setSelectedContactForConsent] = useState<SubscriberItem | null>(null);
  const [consentNameInput, setConsentNameInput] = useState("");
  const [consentMethodInput, setConsentMethodInput] = useState("written_request");
  const [consentSourceInput, setConsentSourceInput] = useState("Website Signup");
  const [consentDateInput, setConsentDateInput] = useState(() => new Date().toISOString().split("T")[0]);
  const [doubleOptInInput, setDoubleOptInInput] = useState(false);
  const [consentNotesInput, setConsentNotesInput] = useState("");

  const [suppressDialogOpen, setSuppressDialogOpen] = useState(false);
  const [selectedContactForSuppress, setSelectedContactForSuppress] = useState<SubscriberItem | null>(null);
  const [suppressCategoryInput, setSuppressCategoryInput] = useState("spam_complaint");
  const [suppressDetailsInput, setSuppressDetailsInput] = useState("");

  const [unsuppressDialogOpen, setUnsuppressDialogOpen] = useState(false);
  const [selectedContactForUnsuppress, setSelectedContactForUnsuppress] = useState<SubscriberItem | null>(null);
  const [unsuppressReasonInput, setUnsuppressReasonInput] = useState("");

  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [selectedContactForDelete, setSelectedContactForDelete] = useState<SubscriberItem | null>(null);
  const [deleteInspectionData, setDeleteInspectionData] = useState<any>(null);
  const [deleteInspectionLoading, setDeleteInspectionLoading] = useState(false);

  // Automation settings dialog & manual compose email
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<AutomationSettingsData | null>(null);
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [composeFormData, setComposeFormData] = useState({
    type: "custom_enquiry_response",
    recipientEmail: "",
    recipientName: "",
    relatedType: "enquiry",
    relatedId: "1",
    title: "",
    bodyHtml: "",
    ctaLabel: "",
    ctaUrl: "",
    queueApproval: false,
  });

  // Notification edit & confirm dialogs
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    subject: "",
    recipientName: "",
    recipientEmail: "",
    bodyHtml: "",
    notes: "",
  });
  const [confirmApproveNotificationId, setConfirmApproveNotificationId] = useState<number | null>(null);
  const [confirmRejectNotificationId, setConfirmRejectNotificationId] = useState<number | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [confirmCancelNotificationId, setConfirmCancelNotificationId] = useState<number | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  // -------------------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------------------

  // 1. Dashboard summary metrics (Section 7)
  const { data: dashboardStats, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["admin", "campaigns-stats"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard metrics");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // 2. Campaigns list (Section 1)
  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    refetch: refetchCampaigns,
  } = useQuery<CampaignItem[]>({
    queryKey: ["admin", "campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load campaigns");
      return res.json();
    },
  });

  // 3. Automations list (Section 2)
  const {
    data: automations = [],
    isLoading: automationsLoading,
    isError: automationsError,
    error: automationsErrorObj,
    refetch: refetchAutomations,
  } = useQuery<AutomationItem[]>({
    queryKey: ["admin", "automations"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/automations", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to load automations (${res.status})`);
      }
      return res.json();
    },
  });

  // 4. Subscriber consent registry (Section 3)
  const {
    data: subscribers = [],
    isLoading: subscribersLoading,
    refetch: refetchSubscribers,
  } = useQuery<SubscriberItem[]>({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/subscribers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load subscriber consent registry");
      return res.json();
    },
  });

  // 5. Notifications audit logs (Section 4)
  const {
    data: notifications = [],
    isLoading: notifsLoading,
    refetch: refetchNotifications,
  } = useQuery<NotificationItem[]>({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=250", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load notification audit records");
      return res.json();
    },
  });

  // 6. Automation settings
  const { data: automationSettings, refetch: refetchSettings } = useQuery<AutomationSettingsData>({
    queryKey: ["admin", "automation-settings"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load automation settings");
      return res.json();
    },
  });

  // 7. Audience preview
  const { data: audiencePreview, isLoading: previewLoading } = useQuery<AudiencePreviewData>({
    queryKey: ["admin", "campaigns", selectedCampaignForPreview?.id, "preview"],
    queryFn: async () => {
      if (!selectedCampaignForPreview) return null as any;
      const res = await fetch(`/api/campaigns/${selectedCampaignForPreview.id}/audience-preview`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load audience preview");
      return res.json();
    },
    enabled: Boolean(selectedCampaignForPreview && previewModalOpen),
  });

  // 8. Notification HTML preview
  const { data: previewData, isLoading: notifPreviewLoading } = useQuery<{
    id: number;
    subject: string;
    recipientEmail: string;
    recipientName: string;
    html: string;
    status: string;
    type: string;
  }>({
    queryKey: ["admin", "notification-preview", previewNotificationId],
    queryFn: async () => {
      if (!previewNotificationId) return null as any;
      const res = await fetch(`/api/notifications/${previewNotificationId}/preview`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load email preview");
      return res.json();
    },
    enabled: Boolean(previewNotificationId),
  });

  // 9. Audience groups query
  const { data: audienceGroups = [], refetch: refetchAudienceGroups } = useQuery<any[]>({
    queryKey: ["campaigns", "audiences"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/audiences", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load audience groups");
      return res.json();
    },
  });

  // 10. Authenticated Email Config Query
  const { data: emailConfig } = useQuery<{
    provider: "gmail" | "resend" | "mock";
    senderEmail: string;
    senderName: string;
    fullFrom: string;
    isConfigured: boolean;
    authMechanism: string;
    smtpHost?: string;
    smtpPort?: number;
  }>({
    queryKey: ["admin", "email-config"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/email-config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load email config");
      return res.json();
    },
    refetchInterval: 60000,
  });

  // -------------------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------------------

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "campaigns-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "automations"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "subscribers"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "audiences"] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: payload.name,
          subject: payload.subject,
          previewText: payload.previewText,
          contentHtml: payload.contentHtml,
          targetAudience: {
            type: payload.audienceType,
            groupId: payload.groupId,
            groupIds: payload.groupIds,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setCreateDialogOpen(false);
      toast({ title: "Campaign Created", description: "Draft campaign saved successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: payload.name,
          subject: payload.subject,
          previewText: payload.previewText,
          contentHtml: payload.contentHtml,
          targetAudience: {
            type: payload.audienceType,
            groupId: payload.groupId ? Number(payload.groupId) : undefined,
            groupIds: payload.groupIds ? payload.groupIds.map(Number) : undefined,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setCreateDialogOpen(false);
      setEditingCampaign(null);
      toast({ title: "Campaign Updated", description: "Campaign changes saved." });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete campaign");
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Campaign Deleted", description: "Campaign removed." });
    },
    onError: (err: any) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  // Approval Workflow Mutations
  const submitCampaignApprovalMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/campaigns/${id}/submit-approval`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit for approval");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Submitted for Approval",
        description: "Campaign is now awaiting administrator review.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/campaigns/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Campaign Approved",
        description: "Campaign marked as approved. Ready for scheduling or immediate send.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectCampaignMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await fetch(`/api/campaigns/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setRejectCampaignDialogOpen(false);
      setSelectedCampaignForReject(null);
      setCampaignRejectReason("");
      toast({
        title: "Campaign Rejected",
        description: "Campaign marked as rejected. Staff can revise and re-submit.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Rejection Failed", description: err.message, variant: "destructive" });
    },
  });

  const duplicateCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to duplicate campaign");
      }
      return res.json();
    },
    onSuccess: (newDraft) => {
      invalidateAll();
      toast({
        title: "Campaign Duplicated",
        description: `New draft copy #${newDraft.id} created successfully.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Duplication Failed", description: err.message, variant: "destructive" });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: number; scheduledAt: string }) => {
      const res = await fetch(`/api/campaigns/${id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scheduledAt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to schedule campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setScheduleDialogOpen(false);
      toast({ title: "Campaign Scheduled", description: "Campaign successfully queued for automatic dispatch." });
    },
    onError: (err: any) => {
      toast({ title: "Scheduling Failed", description: err.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ id, mock }: { id: number; mock: boolean }) => {
      const res = await fetch(`/api/campaigns/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mock }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to execute campaign dispatch");
      }
      return res.json();
    },
    onSuccess: (data: CampaignItem) => {
      invalidateAll();
      setSendDialogOpen(false);
      toast({
        title: "Dispatch Completed",
        description: `Delivered to ${data.stats.sentCount} recipients (${data.stats.skippedCount} unsubscribed contacts safely skipped).`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Dispatch Failed", description: err.message, variant: "destructive" });
    },
  });

  const presendValidationQuery = useQuery({
    queryKey: ["campaign-presend-validation", selectedCampaignForSend?.id],
    queryFn: async () => {
      if (!selectedCampaignForSend) return null;
      const res = await fetch(`/api/campaigns/${selectedCampaignForSend.id}/presend-validation`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to validate campaign pre-send state");
      }
      return res.json();
    },
    enabled: sendDialogOpen && !!selectedCampaignForSend,
  });
  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ campaignId, recipientEmail }: { campaignId?: number; recipientEmail: string }) => {
      const res = await fetch("/api/campaigns/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ campaignId, recipientEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to deliver test email");
      }
      return data;
    },
    onSuccess: (data) => {
      setTestEmailDialogOpen(false);
      const title = data.status === "simulated" ? "Test Email Simulated (Mock)" : "Test Email Accepted for Relay";
      const desc = data.message || `Dispatched to ${data.to} from ${data.from}. Message ID: ${data.messageId}`;
      toast({
        title,
        description: desc,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Test Email Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/campaigns/${id}/cancel`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Campaign Cancelled", description: "Scheduled dispatch safely stopped." });
    },
    onError: (err: any) => {
      toast({ title: "Cancellation Failed", description: err.message, variant: "destructive" });
    },
  });

  // Automation mutations
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/notifications/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle automation");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      toast({
        title: vars.enabled ? "Automation Activated" : "Automation Deactivated",
        description: `Automation rule is now ${vars.enabled ? "live and active" : "paused"}.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateAutomationDelayMutation = useMutation({
    mutationFn: async ({ id, delayValue }: { id: string; delayValue: number }) => {
      const res = await fetch(`/api/notifications/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ delayValue }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update delay");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setDelayConfigDialogOpen(false);
      setSelectedAutomationForDelay(null);
      toast({ title: "Timing Updated", description: "Automation execution delay adjusted." });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (payload: AutomationFormData) => {
      const res = await fetch("/api/notifications/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to create automation rule (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (saved) => {
      invalidateAll();
      setAutomationModalOpen(false);
      setEditingAutomation(null);
      toast({
        title: "Automation Created",
        description: `Automation rule "${saved?.name || "New Rule"}" has been saved and activated.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateAutomationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AutomationFormData }) => {
      const res = await fetch(`/api/notifications/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to update automation (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setAutomationModalOpen(false);
      setEditingAutomation(null);
      toast({
        title: "Automation Updated",
        description: "Automation configuration changes persisted successfully.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/automations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to delete automation (${res.status})`);
      }
    },
    onSuccess: () => {
      invalidateAll();
      setDeleteConfirmAutomation(null);
      toast({
        title: "Automation Deleted",
        description: "The automation rule has been removed from database.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  // Notification Retry & Approval
  const retryNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/retry`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to retry delivery");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Retry Queued", description: "Notification has been re-enqueued for dispatch." });
    },
    onError: (err: any) => {
      toast({ title: "Retry Failed", description: err.message, variant: "destructive" });
    },
  });

  const approveNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/approve`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve notification");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setConfirmApproveNotificationId(null);
      toast({ title: "Approved & Dispatched", description: "Notification approved for immediate dispatch." });
    },
    onError: (err: any) => {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectNotificationMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await fetch(`/api/notifications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject notification");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setConfirmRejectNotificationId(null);
      setRejectReasonInput("");
      toast({ title: "Notification Rejected", description: "Marked as cancelled." });
    },
    onError: (err: any) => {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updated: Partial<AutomationSettingsData>) => {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setSettingsDialogOpen(false);
      toast({ title: "Settings Saved", description: "Global automation rules and scheduling delays updated." });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const sendManualNotificationMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/notifications/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to dispatch manual email");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      setComposeDialogOpen(false);
      toast({
        title: vars.queueApproval ? "Queued for Approval" : "Email Dispatched",
        description: vars.queueApproval
          ? "Correspondence queued in pending_approval status for review."
          : "Manual correspondence dispatched with delivery tracking.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Dispatch Failed", description: err.message, variant: "destructive" });
    },
  });

  const editNotificationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update notification");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setEditingNotification(null);
      toast({ title: "Notification Updated", description: "Changes saved to draft notification." });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const cancelNotificationMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await fetch(`/api/notifications/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel notification");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setConfirmCancelNotificationId(null);
      setCancelReasonInput("");
      toast({ title: "Notification Cancelled", description: "Scheduled dispatch stopped." });
    },
    onError: (err: any) => {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    },
  });

  // -------------------------------------------------------------------------
  // CONSENT & UNSUBSCRIBE REGISTRY MUTATIONS
  // -------------------------------------------------------------------------

  const fetchDeleteInspection = async (email: string) => {
    setDeleteInspectionLoading(true);
    try {
      const res = await fetch(`/api/campaigns/subscribers/check-delete?email=${encodeURIComponent(email)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to check contact relationships");
      const data = await res.json();
      setDeleteInspectionData(data);
    } catch (err: any) {
      toast({ title: "Inspection Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleteInspectionLoading(false);
    }
  };

  const adminUnsubscribeMutation = useMutation({
    mutationFn: async ({ email, reason }: { email: string; reason?: string }) => {
      const res = await fetch("/api/campaigns/subscribers/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, reason, source: "admin_consent_registry" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to unsubscribe contact");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      setUnsubscribeDialogOpen(false);
      setSelectedContactForUnsub(null);
      setUnsubReasonInput("");
      toast({
        title: "Contact Unsubscribed",
        description: `${vars.email} has been unsubscribed from all marketing campaigns.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Unsubscribe Failed", description: err.message, variant: "destructive" });
    },
  });

  const recordConsentMutation = useMutation({
    mutationFn: async (payload: {
      email: string;
      name?: string;
      consentMethod: string;
      source: string;
      consentDate?: string;
      doubleOptInConfirmed?: boolean;
      notes?: string;
    }) => {
      const res = await fetch("/api/campaigns/subscribers/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to record explicit consent");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      setRecordConsentDialogOpen(false);
      setSelectedContactForConsent(null);
      setConsentNameInput("");
      setConsentNotesInput("");
      toast({
        title: "Consent Recorded",
        description: `Verified subscription consent recorded for ${vars.email}.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Consent Recording Failed", description: err.message, variant: "destructive" });
    },
  });

  const suppressMutation = useMutation({
    mutationFn: async ({ email, reason }: { email: string; reason: string }) => {
      const res = await fetch("/api/campaigns/subscribers/suppress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to suppress email address");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      setSuppressDialogOpen(false);
      setSelectedContactForSuppress(null);
      setSuppressDetailsInput("");
      toast({
        title: "Email Suppressed",
        description: `${vars.email} is now suppressed from all marketing communications.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Suppression Failed", description: err.message, variant: "destructive" });
    },
  });

  const unsuppressMutation = useMutation({
    mutationFn: async ({ email, reason }: { email: string; reason?: string }) => {
      const res = await fetch("/api/campaigns/subscribers/unsuppress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to remove suppression");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      setUnsuppressDialogOpen(false);
      setSelectedContactForUnsuppress(null);
      setUnsuppressReasonInput("");
      toast({
        title: "Suppression Removed",
        description: `Marketing suppression lifted for ${vars.email}. Contact remains unsubscribed until explicit consent is recorded.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await fetch("/api/campaigns/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete contact record");
      }
      return res.json();
    },
    onSuccess: (data) => {
      invalidateAll();
      setDeleteContactDialogOpen(false);
      setSelectedContactForDelete(null);
      setDeleteInspectionData(null);
      toast({
        title: "Contact Processed",
        description: data.message || "Contact record removed safely.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Removal Failed", description: err.message, variant: "destructive" });
    },
  });

  const auditFixMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/campaigns/subscribers/audit-fix", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reconcile consent records");
      }
      return res.json();
    },
    onSuccess: (data) => {
      invalidateAll();
      toast({
        title: "Consent Reconciled",
        description: `Successfully reconciled ${data.totalFixed} inconsistent records with full audit trail.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Reconciliation Failed", description: err.message, variant: "destructive" });
    },
  });

  // -------------------------------------------------------------------------
  // FILTERED DATA
  // -------------------------------------------------------------------------

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (campaignStatusFilter !== "all" && c.status !== campaignStatusFilter) return false;
      if (campaignSearchQuery.trim()) {
        const q = campaignSearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          String(c.id).includes(q)
        );
      }
      return true;
    });
  }, [campaigns, campaignStatusFilter, campaignSearchQuery]);

  const inconsistentOptOutRecords = useMemo(() => {
    return subscribers.filter(
      (s) =>
        s.subscribed &&
        (/opted\s*out/i.test(s.name || "") || s.email.startsWith("optout.") || s.source?.includes("opt_out"))
    );
  }, [subscribers]);

  const subscriberCounts = useMemo(() => {
    let sub = 0;
    let notSub = 0;
    let unsub = 0;
    let supp = 0;
    for (const s of subscribers) {
      if (s.status === "suppressed" || s.suppressed) supp++;
      else if (s.status === "subscribed" || (s.subscribed && s.status !== "unsubscribed" && s.status !== "not_subscribed")) sub++;
      else if (s.status === "unsubscribed" || Boolean(s.unsubscribedAt)) unsub++;
      else notSub++;
    }
    return { all: subscribers.length, subscribed: sub, not_subscribed: notSub, unsubscribed: unsub, suppressed: supp };
  }, [subscribers]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const isSuppressed = s.status === "suppressed" || Boolean(s.suppressed);
      const isSubscribed = s.status === "subscribed" || (s.subscribed && !isSuppressed && s.status !== "unsubscribed" && s.status !== "not_subscribed");
      const isUnsubscribed = s.status === "unsubscribed" || (!s.subscribed && !isSuppressed && Boolean(s.unsubscribedAt));
      const isNotSubscribed = s.status === "not_subscribed" || (!s.subscribed && !isSuppressed && !s.unsubscribedAt && s.status !== "unsubscribed");

      if (subStatusFilter === "suppressed") {
        if (!isSuppressed) return false;
      } else if (subStatusFilter === "subscribed") {
        if (!isSubscribed) return false;
      } else if (subStatusFilter === "unsubscribed" || subStatusFilter === "opted_out") {
        if (!isUnsubscribed) return false;
      } else if (subStatusFilter === "not_subscribed") {
        if (!isNotSubscribed) return false;
      }
      if (subSearchQuery.trim()) {
        const q = subSearchQuery.toLowerCase();
        return s.email.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q));
      }
      return true;
    });
  }, [subscribers, subStatusFilter, subSearchQuery]);

  // Active (non-retired) automations list
  const activeAutomationsList = useMemo(() => {
    return automations.filter((auto) => !RETIRED_AUTOMATION_IDS.has(auto.id));
  }, [automations]);

  // Filtered automations memo
  const filteredAutomations = useMemo(() => {
    return activeAutomationsList.filter((auto) => {
      if (automationCategoryFilter !== "all" && auto.category !== automationCategoryFilter) return false;
      if (automationStatusFilter === "enabled" && !auto.enabled) return false;
      if (automationStatusFilter === "paused" && auto.enabled) return false;
      if (automationSearchQuery.trim()) {
        const q = automationSearchQuery.toLowerCase();
        return (
          auto.name.toLowerCase().includes(q) ||
          auto.trigger.toLowerCase().includes(q) ||
          (auto.triggerDescription && auto.triggerDescription.toLowerCase().includes(q)) ||
          (auto.template && auto.template.toLowerCase().includes(q)) ||
          (auto.templateName && auto.templateName.toLowerCase().includes(q)) ||
          auto.recipientLogic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeAutomationsList, automationCategoryFilter, automationStatusFilter, automationSearchQuery]);

  // Unified delivery logs for Section 4
  const unifiedLogs = useMemo(() => {
    const list: Array<{
      id: string;
      source: "manual" | "automation";
      type: string;
      sourceName: string;
      recipientEmail: string;
      recipientName: string;
      subject: string;
      status: string;
      messageId?: string | null;
      timestamp: string;
      error?: string | null;
      notificationId?: number;
      campaignId?: number;
      rawItem?: any;
    }> = [];

    // Add automation notifications
    for (const n of notifications) {
      list.push({
        id: `notif-${n.id}`,
        source: n.category === "manual" ? "manual" : "automation",
        type: n.type,
        sourceName:
          n.type === "campaign_test_email"
            ? "Campaign Test Email"
            : n.category === "manual"
            ? "Manual Admin"
            : "System Automation",
        recipientEmail: n.recipientEmail,
        recipientName: n.recipientName,
        subject: n.subject,
        status: n.status,
        messageId: n.messageId,
        timestamp: n.sentAt || n.scheduledFor || n.createdAt,
        error: n.error,
        notificationId: n.id,
        rawItem: n,
      });
    }

    // Add campaign deliveries
    for (const c of campaigns) {
      if (c.deliveries && c.deliveries.length > 0) {
        for (let i = 0; i < c.deliveries.length; i++) {
          const d = c.deliveries[i];
          list.push({
            id: `camp-${c.id}-d-${i}`,
            source: "manual",
            type: "campaign_delivery",
            sourceName: `Campaign #${c.id}: ${c.name}`,
            recipientEmail: d.recipientEmail,
            recipientName: d.recipientName,
            subject: c.subject,
            status: d.status,
            messageId: d.messageId,
            timestamp: d.sentAt || c.sentAt || c.createdAt,
            error: d.error,
            campaignId: c.id,
            rawItem: d,
          });
        }
      }
    }

    return list.filter((item) => {
      if (auditWorkflowFilter !== "all" && item.source !== auditWorkflowFilter) return false;
      if (auditStatusFilter !== "all") {
        if (auditStatusFilter === "delivered") {
          if (item.status !== "delivered") return false;
        } else if (auditStatusFilter === "accepted") {
          if (item.status !== "accepted" && item.status !== "sent") return false;
        } else if (auditStatusFilter === "simulated") {
          if (item.status !== "simulated") return false;
        } else if (auditStatusFilter === "bounced") {
          if (item.status !== "bounced" && item.status !== "complained") return false;
        } else if (auditStatusFilter === "failed") {
          if (item.status !== "failed") return false;
        } else if (auditStatusFilter === "pending") {
          if (item.status !== "pending") return false;
        } else if (auditStatusFilter === "pending_approval") {
          if (item.status !== "pending_approval") return false;
        } else if (item.status !== auditStatusFilter) {
          return false;
        }
      }
      if (
        auditTypeFilter !== "all" &&
        item.type !== auditTypeFilter &&
        item.type !== TRIGGER_MAP_TO_NOTIF_TYPE[auditTypeFilter]
      ) {
        return false;
      }
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        return (
          item.recipientEmail.toLowerCase().includes(q) ||
          item.recipientName.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          (item.messageId && item.messageId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [notifications, campaigns, auditWorkflowFilter, auditStatusFilter, auditTypeFilter, auditSearchQuery]);

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setCreateDialogOpen(true);
  };

  const fetchAndOpenBuilder = async (campaignId: number) => {
    try {
      setLoadingEditId(campaignId);
      const res = await fetch(`/api/campaigns/${campaignId}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load campaign data");
      }
      const fullCampaign = await res.json();
      setEditingCampaign(fullCampaign);
      setCreateDialogOpen(true);
    } catch (err: any) {
      toast({
        title: "Unable to Open Campaign",
        description: err.message || "Failed to fetch campaign details",
        variant: "destructive",
      });
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleInitiateEdit = (camp: CampaignItem) => {
    if (camp.status === "sending") {
      toast({
        title: "Campaign In Dispatch",
        description: "Campaign is currently sending and cannot be edited.",
        variant: "destructive",
      });
      return;
    }
    if (camp.status === "sent") {
      setStatusConfirmEditCampaign({ campaign: camp, type: "sent" });
      return;
    }
    if (camp.status === "scheduled") {
      setStatusConfirmEditCampaign({ campaign: camp, type: "scheduled" });
      return;
    }
    if (camp.status === "approved") {
      setStatusConfirmEditCampaign({ campaign: camp, type: "approved" });
      return;
    }
    if (camp.status === "pending_approval") {
      setStatusConfirmEditCampaign({ campaign: camp, type: "pending_approval" });
      return;
    }
    // draft, rejected, cancelled -> directly fetch full campaign and open builder
    fetchAndOpenBuilder(camp.id);
  };

  const openEditDialog = (campaign: CampaignItem) => {
    handleInitiateEdit(campaign);
  };

  const getCampaignStatusBadge = (camp: CampaignItem) => {
    switch (camp.status) {
      case "draft":
        return <Badge variant="outline" className="border-zinc-400 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 text-[11px]">Draft</Badge>;
      case "pending_approval":
        return (
          <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 gap-1 text-[11px] font-semibold">
            <Clock className="h-3 w-3" /> Pending Approval
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-red-500/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 gap-1 text-[11px]">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 gap-1 text-[11px]">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="outline" className="border-purple-500/40 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 gap-1 text-[11px]">
            <Calendar className="h-3 w-3" /> Scheduled
          </Badge>
        );
      case "sending":
        return (
          <Badge variant="outline" className="border-blue-400 text-blue-600 dark:text-blue-400 animate-pulse text-[11px]">
            Sending
          </Badge>
        );
      case "sent":
      case "completed": {
        const isSimulated =
          camp.deliveryMode === "simulated" ||
          camp.deliveries?.some(
            (d) =>
              d.deliveryStatus === "simulated" ||
              d.status === "simulated" ||
              d.messageId?.startsWith("mock_") ||
              d.messageId?.startsWith("simulated_")
          );
        const allDelivered =
          !isSimulated &&
          (camp.deliveries || []).length > 0 &&
          (camp.deliveries || []).every((d) => d.status === "delivered");
        return (
          <Badge
            variant="outline"
            className={`text-[11px] ${
              isSimulated
                ? "border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30"
                : allDelivered
                ? "border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-sky-500/40 text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30"
            }`}
          >
            {isSimulated ? "Simulated (Mock)" : allDelivered ? "Delivered (Confirmed)" : "Accepted / Sent (Live)"}
          </Badge>
        );
      }
      case "cancelled":
        return <Badge variant="outline" className="border-zinc-400 text-zinc-500 text-[11px]">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{camp.status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* ============================================================
          VIEW 1: TASK-BASED MAIN LANDING PAGE (Clean & Simplified)
      ============================================================ */}
      {activeView === "overview" && (
        <div className="space-y-8">
          {/* Main Page Heading */}
          <div className="border-b border-[#E5DDD0] pb-6">
            <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight">
              Campaigns & Emails
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-sans">
              Manage marketing emails and automatic customer messages.
            </p>
          </div>

          {/* Two Prominent Primary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Marketing Emails */}
            <div className="p-7 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card shadow-xs hover:border-[#24543D]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-[#24543D]/10 text-[#24543D] flex items-center justify-center font-bold">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-serif font-semibold text-foreground">
                      Marketing Emails
                    </h2>
                    <span className="text-xs font-sans text-muted-foreground bg-[#FAF7F1] px-2.5 py-1 rounded-full border border-[#E5DDD0]">
                      {campaigns.length} campaigns
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-sans leading-relaxed">
                    Create and send offers, promotions, and travel newsletters to customers.
                  </p>
                </div>
              </div>

              <div>
                <Button
                  onClick={() => setActiveView("campaigns")}
                  className="w-full bg-[#24543D] hover:bg-[#1b3f2e] text-white h-11 text-sm font-medium rounded-xl shadow-sm gap-2 cursor-pointer"
                >
                  Manage Campaigns
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 2. Automatic Emails */}
            <div className="p-7 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card shadow-xs hover:border-[#24543D]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-serif font-semibold text-foreground">
                      Automatic Emails
                    </h2>
                    <span className="text-xs font-sans text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {activeAutomationsList.filter((a) => a.enabled).length} of {activeAutomationsList.length} active
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-sans leading-relaxed">
                    Manage emails sent automatically when customers make enquiries, confirm bookings, or reach other supported milestones.
                  </p>
                </div>
              </div>

              <div>
                <Button
                  onClick={() => setActiveView("automations")}
                  className="w-full bg-[#24543D] hover:bg-[#1b3f2e] text-white h-11 text-sm font-medium rounded-xl shadow-sm gap-2 cursor-pointer"
                >
                  Manage Automatic Emails
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Two Simple Secondary Links / Compact Rows */}
          <div className="pt-2 border-t border-[#E5DDD0]/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 font-sans">
              Secondary Management
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Groups Link */}
              <button
                type="button"
                onClick={() => setActiveView("audiences")}
                className="p-4 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card hover:bg-[#FAF8F3] hover:border-[#24543D]/40 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-[#FAF7F1] border border-[#E5DDD0] text-muted-foreground group-hover:text-[#24543D] flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground group-hover:text-[#24543D] transition-colors">
                      Customer Groups
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Organize customers for targeted marketing emails.
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#24543D] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>

              {/* Email History Link */}
              <button
                type="button"
                onClick={() => setActiveView("history")}
                className="p-4 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card hover:bg-[#FAF8F3] hover:border-[#24543D]/40 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-[#FAF7F1] border border-[#E5DDD0] text-muted-foreground group-hover:text-[#24543D] flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground group-hover:text-[#24543D] transition-colors">
                      Email History
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      View sent emails, delivery results, and failures.
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#24543D] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 2: MARKETING EMAILS (Manage Campaigns)
      ============================================================ */}
      {activeView === "campaigns" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <button
              type="button"
              onClick={() => setActiveView("overview")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#24543D] hover:underline mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Campaigns & Emails
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground tracking-tight">
                  Marketing Emails
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                  Create and send offers, promotions, and travel newsletters to customers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5DDD0] bg-white text-xs select-none"
                  title={emailConfig?.isConfigured ? "Sender is authenticated via Gmail SMTP" : "Gmail App Password required in .env"}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      emailConfig?.isConfigured ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                    )}
                  />
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium text-foreground">{emailConfig?.senderEmail || "arunopera7@gmail.com"}</span>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-[#FAF8F5] border border-[#E5DDD0] text-muted-foreground font-mono">
                    {emailConfig?.provider === "gmail" ? "Gmail SMTP" : emailConfig?.provider || "Gmail"}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveView("audiences")}
                  className="text-xs h-9 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1.5"
                >
                  <Users className="h-3.5 w-3.5 text-[#24543D]" />
                  Customer Groups
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchCampaigns()}
                  className="text-xs h-9 border-[#E5DDD0]"
                  title="Refresh campaigns"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={openCreateDialog}
                  className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-9 px-4 shadow-sm gap-1.5 cursor-pointer font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={campaignSearchQuery}
                  onChange={(e) => setCampaignSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs border-[#E5DDD0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                <select
                  value={campaignStatusFilter}
                  onChange={(e) => setCampaignStatusFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-md bg-white dark:bg-background border border-[#E5DDD0] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                >
                  <option value="all">All Campaigns ({campaigns.length})</option>
                  <option value="draft">Drafts</option>
                  <option value="pending_approval">Awaiting Approval</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent / Delivered</option>
                  <option value="rejected">Needs Review</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
            </div>
          </div>

          {/* Campaigns List */}
          {campaignsLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading marketing campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E5DDD0] rounded-xl bg-[#FFFDF9] dark:bg-card/40">
              <Mail className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-serif font-medium text-foreground">No Marketing Campaigns Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                Create promotional newsletters, seasonal packages, or destination highlights to reach subscribed guests.
              </p>
              <Button onClick={openCreateDialog} className="bg-[#24543D] text-white text-xs h-8">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create First Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredCampaigns.map((camp) => {
                const statusMeta = getSimpleCampaignStatus(camp.status, camp.deliveryMode);
                return (
                  <div
                    key={camp.id}
                    className="p-5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card shadow-xs hover:border-[#24543D]/40 transition-colors space-y-3"
                  >
                    {/* Rejection Alert Banner if rejected */}
                    {camp.status === "rejected" && (
                      <div className="p-3 rounded-lg border border-red-200 bg-red-50/70 dark:bg-red-950/20 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block">Campaign Needs Review:</span>
                          <span>{camp.rejectionReason || "Please review message copy and audience criteria."}</span>
                        </div>
                      </div>
                    )}

                    {/* Pending Approval Notice if pending */}
                    {camp.status === "pending_approval" && (
                      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block">Awaiting Administrator Approval:</span>
                          <span>
                            Submitted {camp.submittedForApprovalAt ? new Date(camp.submittedForApprovalAt).toLocaleDateString() : "recently"}.
                            Authorized staff must review content before scheduling or delivery.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Main Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-serif font-semibold text-foreground truncate">
                            {camp.name}
                          </h3>
                          {getCampaignStatusBadge(camp)}
                        </div>
                        <p className="text-xs text-muted-foreground font-sans truncate">
                          <span className="font-medium text-foreground/80">Subject:</span> "{camp.subject}"
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-sans pt-0.5">
                          {camp.sentAt ? (
                            <span>
                              {camp.deliveryMode === "simulated" ? "Simulated on " : "Sent on "}
                              {new Date(camp.sentAt).toLocaleDateString()}
                            </span>
                          ) : camp.scheduledAt ? (
                            <span className="text-purple-700 dark:text-purple-300 font-medium">
                              Scheduled for {new Date(camp.scheduledAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span>Created {new Date(camp.createdAt).toLocaleDateString()}</span>
                          )}
                          <span>·</span>
                          <span>
                            Audience:{" "}
                            {camp.targetAudience?.type === "custom_segment" ? (
                              <span className="text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 inline" /> Custom Destination Segment (Retired — Action Required)
                              </span>
                            ) : (
                              camp.targetAudience?.type?.replace(/_/g, " ") || "All contacts"
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaignForPreview(camp);
                            setPreviewModalOpen(true);
                          }}
                          className="text-xs h-8 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInitiateEdit(camp)}
                          disabled={camp.status === "sending" || loadingEditId === camp.id}
                          className={`text-xs h-8 border-[#E5DDD0] gap-1 ${
                            camp.status === "sending"
                              ? "opacity-50 cursor-not-allowed text-muted-foreground"
                              : "text-foreground hover:bg-[#FAF7F1]"
                          }`}
                          title={
                            camp.status === "sending"
                              ? "Campaign is currently sending and cannot be edited"
                              : camp.status === "sent"
                              ? "Sent campaigns are locked. Click to duplicate and edit."
                              : camp.status === "scheduled"
                              ? "Scheduled campaign. Click to unschedule and edit."
                              : camp.status === "approved"
                              ? "Approved campaign. Editing will invalidate approval."
                              : camp.status === "pending_approval"
                              ? "Pending approval. Editing will withdraw from review queue."
                              : "Edit Campaign"
                          }
                          data-testid={`button-edit-campaign-${camp.id}`}
                        >
                          {loadingEditId === camp.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-[#24543D]" />
                          ) : (
                            <Pencil className="h-3 w-3 text-[#24543D]" />
                          )}
                          Edit
                        </Button>

                        {camp.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (camp.targetAudience?.type === "custom_segment") {
                                toast({
                                  title: "Audience Reassignment Required",
                                  description:
                                    "The 'Custom Destination Segment' option has been retired. Please edit the campaign and select a supported audience segment before requesting approval.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              submitCampaignApprovalMutation.mutate(camp.id);
                            }}
                            className="text-xs h-8 border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100"
                          >
                            Request Approval
                          </Button>
                        )}

                        {camp.status === "pending_approval" && (
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                            onClick={() => approveMutation.mutate(camp.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </Button>
                        )}

                        {camp.status === "pending_approval" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 border-red-300 text-red-700 hover:bg-red-50 gap-1"
                            onClick={() => {
                              setSelectedCampaignForReject(camp);
                              setCampaignRejectReason("");
                              setRejectCampaignDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaignForTest(camp);
                            setTestRecipientEmail("");
                            setTestEmailDialogOpen(true);
                          }}
                          className="text-xs h-8 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1"
                          title="Send a real test email to a single recipient inbox without contacting the audience"
                        >
                          <Mail className="h-3 w-3 text-blue-600" />
                          Send Test
                        </Button>

                        {camp.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaignForSchedule(camp);
                              setScheduleDialogOpen(true);
                            }}
                            className="text-xs h-8 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1"
                          >
                            <Calendar className="h-3 w-3 text-purple-600" />
                            Schedule
                          </Button>
                        )}

                        {camp.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCampaignForSend(camp);
                              setSendDialogOpen(true);
                            }}
                            className="text-xs h-8 bg-[#24543D] hover:bg-[#1b3f2e] text-white gap-1"
                          >
                            <Send className="h-3 w-3" />
                            Send Now
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateCampaignMutation.mutate(camp.id)}
                          className="text-xs h-8 text-muted-foreground hover:text-foreground px-2"
                          title="Duplicate Campaign"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete campaign "${camp.name}"?`)) {
                              deleteMutation.mutate(camp.id);
                            }
                          }}
                          className="text-xs h-8 text-muted-foreground hover:text-red-600 px-2"
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 3: AUTOMATIC EMAILS (Manage Automations)
      ============================================================ */}
      {activeView === "automations" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <button
              type="button"
              onClick={() => setActiveView("overview")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#24543D] hover:underline mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Campaigns & Emails
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground tracking-tight">
                  Automatic Emails
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                  Manage emails sent automatically when customers make enquiries, confirm bookings, or reach other supported milestones.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (automationSettings) {
                      setSettingsDraft({ ...automationSettings });
                    }
                    setSettingsDialogOpen(true);
                  }}
                  className="text-xs h-9 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1.5"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#24543D]" />
                  Global Delay Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchAutomations()}
                  className="text-xs h-9 border-[#E5DDD0]"
                  title="Refresh automations"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={() => {
                    setEditingAutomation(null);
                    setAutomationModalOpen(true);
                  }}
                  className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-9 px-4 shadow-sm gap-1.5 cursor-pointer font-medium"
                >
                  <Plus className="h-4 w-4" />
                  New Automation
                </Button>
              </div>
            </div>
          </div>

          {/* Simple Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search automatic rules..."
                  value={automationSearchQuery}
                  onChange={(e) => setAutomationSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs border-[#E5DDD0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                <select
                  value={automationStatusFilter}
                  onChange={(e) => setAutomationStatusFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-md bg-white dark:bg-background border border-[#E5DDD0] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#24543D]"
                >
                  <option value="all">All Rules ({activeAutomationsList.length})</option>
                  <option value="enabled">Active (On) Only</option>
                  <option value="paused">Paused (Off) Only</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {filteredAutomations.filter((a) => a.enabled).length} active of {filteredAutomations.length} displayed
            </div>
          </div>

          {/* Automations Cards List */}
          {automationsLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading automatic rules...</div>
          ) : automationsError ? (
            <div className="p-8 text-center rounded-xl border border-red-200 bg-red-50/50 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <p className="text-sm font-semibold text-red-900">Failed to load automation rules</p>
              <Button size="sm" variant="outline" onClick={() => refetchAutomations()} className="text-xs border-red-300">
                Retry Loading
              </Button>
            </div>
          ) : filteredAutomations.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E5DDD0] rounded-xl bg-white">
              <p className="text-xs text-muted-foreground">No automatic email rules match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredAutomations.map((auto) => {
                const isEnabled = auto.enabled;
                const isExpanded = expandedAutomationId === auto.id;
                const plainDesc =
                  AUTOMATION_PLAIN_DESCRIPTIONS[auto.trigger] ||
                  auto.triggerDescription ||
                  "Automatic customer email triggered by milestones.";
                const plainTiming = getPlainTiming(auto);

                return (
                  <div
                    key={auto.id}
                    className="p-5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card shadow-xs hover:border-[#24543D]/40 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Status & Plain Details */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isEnabled
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-stone-100 text-stone-500 border border-stone-200"
                          }`}
                        >
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-serif font-semibold text-foreground truncate">
                              {auto.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={
                                isEnabled
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-sans font-medium"
                                  : "bg-stone-100 text-stone-600 border-stone-200 text-[11px] font-sans font-medium"
                              }
                            >
                              {isEnabled ? "On" : "Off"}
                            </Badge>
                            {auto.requiresApproval && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-sans">
                                Requires Staff Approval
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {plainDesc}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-stone-600 dark:text-stone-300 font-sans">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{plainTiming}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span>Recipient: {auto.recipientLogic}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Toggle Switch & Edit & Details Toggle */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {/* Turn On / Turn Off Switch */}
                        <div className="flex items-center gap-2 bg-[#FAF7F1] px-3 py-1.5 rounded-lg border border-[#E5DDD0]">
                          <span className="text-xs font-medium text-foreground select-none">
                            {isEnabled ? "On" : "Off"}
                          </span>
                          <Switch
                            checked={isEnabled}
                            disabled={toggleAutomationMutation.isPending}
                            onCheckedChange={() =>
                              toggleAutomationMutation.mutate({ id: auto.id, enabled: !isEnabled })
                            }
                            aria-label={`Toggle ${auto.name}`}
                          />
                        </div>

                        {/* Edit Action */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAutomation(auto);
                            setAutomationModalOpen(true);
                          }}
                          className="text-xs h-8 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>

                        {/* Details Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedAutomationId(isExpanded ? null : auto.id)}
                          className="text-xs h-8 text-muted-foreground hover:text-foreground px-2"
                          title="Advanced Details & History"
                        >
                          {isExpanded ? "Hide Details" : "Details"}
                          <ChevronRight
                            className={`h-3.5 w-3.5 ml-1 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Advanced Settings & History Drawer */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-[#E5DDD0] space-y-3 bg-[#FAF7F1]/60 -mx-5 -mb-5 p-4 rounded-b-xl text-xs font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
                              System Trigger
                            </span>
                            <span className="font-mono text-xs text-foreground font-semibold">{auto.trigger}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
                              Email Template
                            </span>
                            <span className="text-xs text-foreground">
                              {auto.templateName || auto.templateId || "Standard Template"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
                              Rule ID
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">{auto.id}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E5DDD0]/60 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <span>Sent: <strong className="text-foreground">{auto.stats.sent}</strong></span>
                            <span>Failed: <strong className="text-foreground">{auto.stats.failed}</strong></span>
                            <span>
                              Last Executed:{" "}
                              <strong className="text-foreground">
                                {auto.stats.lastExecutedAt
                                  ? new Date(auto.stats.lastExecutedAt).toLocaleDateString()
                                  : "Never"}
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveView("history");
                                setAuditWorkflowFilter("automation");
                                setAuditTypeFilter(TRIGGER_MAP_TO_NOTIF_TYPE[auto.trigger] || "all");
                              }}
                              className="text-[11px] h-7 text-[#24543D] hover:bg-[#24543D]/10 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View Sent History
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmAutomation(auto)}
                              className="text-[11px] h-7 text-muted-foreground hover:text-red-600 px-2"
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Delete Rule
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 4: CUSTOMER GROUPS & CONSENT REGISTRY
      ============================================================ */}
      {activeView === "audiences" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <button
              type="button"
              onClick={() => setActiveView("overview")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#24543D] hover:underline mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Campaigns & Emails
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground tracking-tight">
                  Customer Groups & Consent
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                  Organize customers for targeted marketing emails. Consent and unsubscribe rules apply automatically.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={() => {
                    setAudienceModalGroupId(null);
                    setAudienceModalStartCreate(true);
                    setAudienceModalOpen(true);
                  }}
                  className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-9 px-4 shadow-sm gap-1.5 cursor-pointer font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Create Customer Group
                </Button>
              </div>
            </div>
          </div>

          {/* Automatic Consent Safeguard Banner */}
          <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Automated Marketing Consent Enforcement
              </p>
              <p>
                Every outbound marketing email automatically includes an official one-click unsubscribe link.
                When a customer opts out, they are immediately excluded from all future campaigns, regardless of group membership.
              </p>
            </div>
          </div>

          {/* Sub-tabs for Groups vs Consent Registry */}
          <div className="flex items-center gap-2 border-b border-[#E5DDD0] pb-2">
            <button
              type="button"
              onClick={() => setCustomerGroupsSubTab("groups")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                customerGroupsSubTab === "groups"
                  ? "bg-[#24543D] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer Groups ({audienceGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setCustomerGroupsSubTab("registry")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                customerGroupsSubTab === "registry"
                  ? "bg-[#24543D] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Consent & Unsubscribe Registry ({subscribers.length})
            </button>
          </div>

          {/* Tab 1: Customer Groups */}
          {customerGroupsSubTab === "groups" && (
            <div className="space-y-4">
              {audienceGroups.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-[#E5DDD0] rounded-xl bg-white">
                  <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No customer groups created yet.</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                    Create groups to send tailored travel recommendations based on customer interests.
                  </p>
                  <Button
                    onClick={() => {
                      setAudienceModalGroupId(null);
                      setAudienceModalStartCreate(true);
                      setAudienceModalOpen(true);
                    }}
                    className="bg-[#24543D] text-white text-xs h-8"
                  >
                    Create First Group
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {audienceGroups.map((group: any) => (
                    <div
                      key={group.id}
                      className="p-5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card shadow-xs hover:border-[#24543D]/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-serif font-semibold text-foreground truncate">
                            {group.name}
                          </h3>
                          <Badge variant="outline" className="text-[11px] bg-[#FAF7F1] border-[#E5DDD0]">
                            {group.type === "dynamic" ? "Smart Rules" : "Manual List"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {group.description || "Reusable customer audience group for marketing broadcasts."}
                        </p>
                        <div className="pt-2 text-xs font-medium text-foreground">
                          {group.memberCount ?? group.members?.length ?? 0} Contacts Eligible
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E5DDD0]/60 flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAudienceModalGroupId(group.id);
                            setAudienceModalStartCreate(false);
                            setAudienceModalOpen(true);
                          }}
                          className="text-xs h-8 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1]"
                        >
                          Manage Group
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Consent Registry */}
          {customerGroupsSubTab === "registry" && (
            <div className="space-y-4">
              {/* Inconsistent Records Reconcile Banner */}
              {inconsistentOptOutRecords.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-amber-950">
                        Consent Inconsistencies Detected ({inconsistentOptOutRecords.length} records)
                      </h4>
                      <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                        Guest records labeled &apos;Opted Out&apos; currently display an active subscribed status due to historical enquiry auto-indexing.
                        You can safely reconcile these canonical opt-outs with a complete audit trail.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => auditFixMutation.mutate()}
                    disabled={auditFixMutation.isPending}
                    className="text-xs h-8 bg-white border-amber-300 hover:bg-amber-100 text-amber-900 font-medium shrink-0 cursor-pointer"
                  >
                    {auditFixMutation.isPending ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Reconciling...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-amber-700" /> Reconcile Inconsistencies
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search email or name..."
                      value={subSearchQuery}
                      onChange={(e) => setSubSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs border-[#E5DDD0]"
                    />
                  </div>

                  <select
                    value={subStatusFilter}
                    onChange={(e) => setSubStatusFilter(e.target.value as any)}
                    className="h-8 px-2.5 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground"
                  >
                    <option value="all">All Contacts ({subscriberCounts.all})</option>
                    <option value="subscribed">Subscribed ({subscriberCounts.subscribed})</option>
                    <option value="not_subscribed">Not Subscribed ({subscriberCounts.not_subscribed})</option>
                    <option value="unsubscribed">Unsubscribed ({subscriberCounts.unsubscribed})</option>
                    <option value="suppressed">Suppressed ({subscriberCounts.suppressed})</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSubscribers()}
                  className="text-xs h-8 border-[#E5DDD0]"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh Registry
                </Button>
              </div>

              {subscribersLoading ? (
                <div className="p-12 text-center text-muted-foreground text-sm">Loading consent registry...</div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-[#E5DDD0] rounded-xl bg-white">
                  <p className="text-xs text-muted-foreground">No subscriber records match your filters.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E5DDD0] overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F1] border-b border-[#E5DDD0] text-muted-foreground uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Contact Name</th>
                        <th className="py-3 px-4">Email Address</th>
                        <th className="py-3 px-4">Consent Status</th>
                        <th className="py-3 px-4">Source & Method</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DDD0]">
                      {filteredSubscribers.map((sub) => {
                        const isSuppressed = sub.status === "suppressed" || Boolean(sub.suppressed);
                        const isSubscribed = sub.status === "subscribed" || (sub.subscribed && !isSuppressed && sub.status !== "unsubscribed" && sub.status !== "not_subscribed");
                        const isUnsubscribed = sub.status === "unsubscribed" || (!sub.subscribed && !isSuppressed && Boolean(sub.unsubscribedAt));
                        return (
                        <tr key={sub.email} className="hover:bg-muted/10">
                          <td className="py-3 px-4 font-medium text-foreground">{sub.name || "—"}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-foreground">{sub.email}</td>
                          <td className="py-3 px-4">
                            {isSuppressed ? (
                              <div className="space-y-0.5">
                                <Badge variant="outline" className="bg-red-950/10 text-red-800 border-red-300 font-semibold text-[11px] gap-1">
                                  <Ban className="h-3 w-3 text-red-600" /> Suppressed
                                </Badge>
                                {sub.suppressionReason && (
                                  <div className="text-[10px] text-red-700 truncate max-w-[150px]" title={sub.suppressionReason}>
                                    {sub.suppressionReason}
                                  </div>
                                )}
                              </div>
                            ) : isSubscribed ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                                  Subscribed
                                </Badge>
                                {sub.doubleOptInConfirmed && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0 px-1.5">
                                    Double Opt-In
                                  </Badge>
                                )}
                              </div>
                            ) : isUnsubscribed ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[11px]">
                                Unsubscribed {sub.unsubscribedAt ? `(${new Date(sub.unsubscribedAt).toLocaleDateString()})` : ""}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px]">
                                Not Subscribed
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="capitalize font-medium text-foreground text-[11px]">{sub.source || "System"}</div>
                            {sub.consentMethod && (
                              <div className="text-[10px] text-muted-foreground capitalize">
                                {sub.consentMethod.replace(/_/g, " ")}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-[11px]">
                            {new Date(sub.consentDate || sub.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted cursor-pointer">
                                  <span className="sr-only">Open contact actions</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 text-xs">
                                {/* 1. Unsubscribe from Marketing (only if currently subscribed & not suppressed) */}
                                {sub.subscribed && !sub.suppressed && (
                                  <DropdownMenuItem
                                    className="text-amber-800 dark:text-amber-400 cursor-pointer gap-2"
                                    onClick={() => {
                                      setSelectedContactForUnsub(sub);
                                      setUnsubReasonInput("");
                                      setUnsubscribeDialogOpen(true);
                                    }}
                                  >
                                    <UserX className="h-3.5 w-3.5 text-amber-600" />
                                    Unsubscribe from Marketing
                                  </DropdownMenuItem>
                                )}

                                {/* 2. Record Subscription Consent (if opted out or suppressed) */}
                                {(!sub.subscribed || sub.suppressed) && (
                                  <DropdownMenuItem
                                    className="text-emerald-800 dark:text-emerald-400 cursor-pointer gap-2"
                                    onClick={() => {
                                      setSelectedContactForConsent(sub);
                                      setConsentNameInput(sub.name || "");
                                      setConsentSourceInput("Customer Written Request");
                                      setConsentMethodInput("written_request");
                                      setConsentDateInput(new Date().toISOString().split("T")[0]);
                                      setDoubleOptInInput(false);
                                      setConsentNotesInput("");
                                      setRecordConsentDialogOpen(true);
                                    }}
                                  >
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Record Subscription Consent
                                  </DropdownMenuItem>
                                )}

                                {/* 3. Suppress Email Address (if not currently suppressed) */}
                                {!sub.suppressed && (
                                  <DropdownMenuItem
                                    className="text-red-700 dark:text-red-400 cursor-pointer gap-2"
                                    onClick={() => {
                                      setSelectedContactForSuppress(sub);
                                      setSuppressCategoryInput("spam_complaint");
                                      setSuppressDetailsInput("");
                                      setSuppressDialogOpen(true);
                                    }}
                                  >
                                    <Ban className="h-3.5 w-3.5 text-red-600" />
                                    Suppress Email Address
                                  </DropdownMenuItem>
                                )}

                                {/* 3b. Lift Suppression (if currently suppressed) */}
                                {sub.suppressed && (
                                  <DropdownMenuItem
                                    className="text-blue-700 dark:text-blue-400 cursor-pointer gap-2"
                                    onClick={() => {
                                      setSelectedContactForUnsuppress(sub);
                                      setUnsuppressReasonInput("");
                                      setUnsuppressDialogOpen(true);
                                    }}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                                    Lift Email Suppression
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                {/* 4. Remove Contact Record, where safe */}
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400 cursor-pointer gap-2"
                                  onClick={() => {
                                    setSelectedContactForDelete(sub);
                                    setDeleteInspectionData(null);
                                    fetchDeleteInspection(sub.email);
                                    setDeleteContactDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                  Remove Contact Record...
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 5: EMAIL HISTORY & DELIVERY RESULTS
      ============================================================ */}
      {activeView === "history" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <button
              type="button"
              onClick={() => setActiveView("overview")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#24543D] hover:underline mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Campaigns & Emails
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground tracking-tight">
                  Email History
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                  View sent emails, delivery results, and failures.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchNotifications()}
                  className="text-xs h-9 border-[#E5DDD0] gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh History
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search recipient or subject..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs border-[#E5DDD0]"
                />
              </div>

              <select
                value={auditWorkflowFilter}
                onChange={(e) => setAuditWorkflowFilter(e.target.value as any)}
                className="h-8 px-2.5 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground"
              >
                <option value="all">All Email Types</option>
                <option value="manual">Marketing Campaigns Only</option>
                <option value="automation">Automatic Emails Only</option>
              </select>

              <select
                value={auditStatusFilter}
                onChange={(e) => setAuditStatusFilter(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground"
              >
                <option value="all">All Delivery Results</option>
                <option value="delivered">Delivered (Confirmed)</option>
                <option value="accepted">Accepted / Relayed</option>
                <option value="simulated">Simulated (Mock)</option>
                <option value="bounced">Bounced</option>
                <option value="failed">Failed / Undelivered</option>
                <option value="pending">Queued / Scheduled</option>
                <option value="pending_approval">Pending Approval</option>
              </select>
            </div>

            <div className="text-xs text-muted-foreground">
              {unifiedLogs.length} records found
            </div>
          </div>

          {/* Delivery History Table */}
          {notifsLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading delivery records...</div>
          ) : unifiedLogs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E5DDD0] rounded-xl bg-white">
              <p className="text-xs text-muted-foreground">No email delivery records match your filter criteria.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E5DDD0] overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F1] border-b border-[#E5DDD0] text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Type / Source</th>
                    <th className="py-3 px-4">Delivery Result</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DDD0]">
                  {unifiedLogs.map((log) => {
                    const isDelivered = log.status === "delivered";
                    const isAccepted = log.status === "accepted" || log.status === "sent";
                    const isSimulated = log.status === "simulated";
                    const isBounced = log.status === "bounced" || log.status === "complained";
                    const isFailed = log.status === "failed";
                    const isPending = log.status === "pending_approval" || log.status === "pending";

                    return (
                      <tr key={log.id} className="hover:bg-muted/10">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{log.recipientName || "Customer"}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{log.recipientEmail}</div>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-foreground" title={log.subject}>
                          {log.subject || "No subject"}
                        </td>

                        <td className="py-3 px-4 capitalize text-muted-foreground">
                          {log.sourceName || log.type.replace(/_/g, " ")}
                        </td>

                        <td className="py-3 px-4">
                          {isDelivered && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]" title="Confirmed delivery received via provider webhook">
                              Delivered (Confirmed)
                            </Badge>
                          )}
                          {isAccepted && (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[11px]" title="Accepted by mail server relay for delivery (inbox placement unconfirmed)">
                                Accepted (Relayed)
                              </Badge>
                              <div className="text-[10px] text-muted-foreground">
                                {log.rawItem?.metadata?.provider === "gmail" ? "Gmail SMTP relay" : "Mail provider relay"}
                              </div>
                            </div>
                          )}
                          {isSimulated && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[11px]" title="Simulated dispatch. No outbound mail sent.">
                              Simulated (Mock)
                            </Badge>
                          )}
                          {isBounced && (
                            <div className="space-y-1">
                              <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 text-[11px]">
                                Bounced
                              </Badge>
                              {log.error && (
                                <div className="text-[10px] text-orange-700 truncate max-w-xs" title={log.error}>
                                  {log.error}
                                </div>
                              )}
                            </div>
                          )}
                          {isFailed && (
                            <div className="space-y-1">
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[11px]">
                                Failed
                              </Badge>
                              {log.error && (
                                <div className="text-[10px] text-red-600 truncate max-w-xs" title={log.error}>
                                  {log.error}
                                </div>
                              )}
                            </div>
                          )}
                          {isPending && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[11px]">
                              {log.status === "pending_approval" ? "Awaiting Approval" : "Queued"}
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5">
                          {isFailed && log.notificationId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryNotificationMutation.mutate(log.notificationId!)}
                              disabled={retryNotificationMutation.isPending}
                              className="text-[11px] h-7 border-amber-300 text-amber-800 hover:bg-amber-50 px-2"
                              title="Retry Delivery"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Retry
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (log.rawItem) {
                                setSelectedNotifDetails(log.rawItem);
                              }
                            }}
                            className="text-[11px] h-7 text-muted-foreground hover:text-foreground px-2"
                            title="View Technical Details"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          MODALS & DIALOGS
      ============================================================ */}

      {/* 1. Manage Audiences Modal */}
      <ManageAudiencesModal
        isOpen={audienceModalOpen}
        onClose={() => {
          setAudienceModalOpen(false);
          setAudienceModalGroupId(null);
          setAudienceModalStartCreate(false);
        }}
        initialGroupId={audienceModalGroupId}
        startInCreateMode={audienceModalStartCreate}
      />

      {/* 2. Visual Email Builder Modal */}
      <CampaignVisualBuilderModal
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingCampaign(null);
        }}
        initialCampaign={editingCampaign}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onSave={(payload) => {
          if (editingCampaign) {
            updateMutation.mutate({ id: editingCampaign.id, payload });
          } else {
            createMutation.mutate(payload);
          }
        }}
      />

      {/* 2b. Status-Aware Edit Confirmation Dialog */}
      <Dialog
        open={statusConfirmEditCampaign !== null}
        onOpenChange={(open) => !open && setStatusConfirmEditCampaign(null)}
      >
        <DialogContent className="max-w-md bg-[#FFFDF9] dark:bg-card border-[#E5DDD0]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              {statusConfirmEditCampaign?.type === "approved" && (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Edit Approved Campaign #{statusConfirmEditCampaign.campaign.id}
                </>
              )}
              {statusConfirmEditCampaign?.type === "pending_approval" && (
                <>
                  <Clock className="h-5 w-5 text-blue-600" />
                  Withdraw & Edit Campaign #{statusConfirmEditCampaign.campaign.id}
                </>
              )}
              {statusConfirmEditCampaign?.type === "scheduled" && (
                <>
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Unschedule & Edit Campaign #{statusConfirmEditCampaign.campaign.id}
                </>
              )}
              {statusConfirmEditCampaign?.type === "sent" && (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  Historical Campaign Locked (#{statusConfirmEditCampaign.campaign.id})
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2 space-y-2">
              {statusConfirmEditCampaign?.type === "approved" && (
                <span>
                  Campaign <strong>"{statusConfirmEditCampaign.campaign.name}"</strong> has already been approved. Modifying its content or audience will automatically <strong>invalidate the approval</strong> and return it to <strong>Draft</strong> status. It will need to be reviewed and approved again before live sending.
                </span>
              )}
              {statusConfirmEditCampaign?.type === "pending_approval" && (
                <span>
                  Campaign <strong>"{statusConfirmEditCampaign.campaign.name}"</strong> is currently awaiting staff review. Opening and modifying this campaign will <strong>withdraw it from the review queue</strong> and return it to <strong>Draft</strong> status.
                </span>
              )}
              {statusConfirmEditCampaign?.type === "scheduled" && (
                <span>
                  Campaign <strong>"{statusConfirmEditCampaign.campaign.name}"</strong> is currently scheduled for dispatch. To prevent accidental modification of queued dispatches, the campaign must first be <strong>unscheduled</strong> and returned to Draft status.
                </span>
              )}
              {statusConfirmEditCampaign?.type === "sent" && (
                <span>
                  Campaign <strong>"{statusConfirmEditCampaign.campaign.name}"</strong> has already been dispatched. Historical campaigns cannot be modified in order to preserve recipient delivery records, unsubscribe tracking, and audit logs. You can duplicate this campaign to create an editable draft.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusConfirmEditCampaign(null)}
              disabled={isStatusActionLoading}
              className="text-xs h-9 border-[#E5DDD0]"
            >
              Cancel
            </Button>

            {statusConfirmEditCampaign?.type === "approved" && (
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const campId = statusConfirmEditCampaign.campaign.id;
                  setStatusConfirmEditCampaign(null);
                  await fetchAndOpenBuilder(campId);
                }}
                className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] text-xs h-9 gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Continue to Editor
              </Button>
            )}

            {statusConfirmEditCampaign?.type === "pending_approval" && (
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const campId = statusConfirmEditCampaign.campaign.id;
                  setStatusConfirmEditCampaign(null);
                  await fetchAndOpenBuilder(campId);
                }}
                className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] text-xs h-9 gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Withdraw & Edit
              </Button>
            )}

            {statusConfirmEditCampaign?.type === "scheduled" && (
              <Button
                type="button"
                size="sm"
                disabled={isStatusActionLoading}
                onClick={async () => {
                  setIsStatusActionLoading(true);
                  try {
                    const res = await fetch(`/api/campaigns/${statusConfirmEditCampaign.campaign.id}/cancel`, {
                      method: "POST",
                      credentials: "include",
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || "Failed to unschedule campaign");
                    }
                    toast({
                      title: "Campaign Unscheduled",
                      description: "Schedule cancelled and campaign returned to Draft.",
                    });
                    invalidateAll();
                    const campId = statusConfirmEditCampaign.campaign.id;
                    setStatusConfirmEditCampaign(null);
                    await fetchAndOpenBuilder(campId);
                  } catch (err: any) {
                    toast({
                      title: "Unschedule Failed",
                      description: err.message,
                      variant: "destructive",
                    });
                  } finally {
                    setIsStatusActionLoading(false);
                  }
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs h-9 gap-1.5"
              >
                {isStatusActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
                Unschedule & Edit
              </Button>
            )}

            {statusConfirmEditCampaign?.type === "sent" && (
              <Button
                type="button"
                size="sm"
                disabled={isStatusActionLoading}
                onClick={async () => {
                  setIsStatusActionLoading(true);
                  try {
                    const res = await fetch(`/api/campaigns/${statusConfirmEditCampaign.campaign.id}/duplicate`, {
                      method: "POST",
                      credentials: "include",
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || "Failed to duplicate campaign");
                    }
                    const duplicated = await res.json();
                    toast({
                      title: "Campaign Duplicated",
                      description: `Draft campaign #${duplicated.id} "${duplicated.name}" created. Opening editor...`,
                    });
                    invalidateAll();
                    setStatusConfirmEditCampaign(null);
                    await fetchAndOpenBuilder(duplicated.id);
                  } catch (err: any) {
                    toast({
                      title: "Duplicate Failed",
                      description: err.message,
                      variant: "destructive",
                    });
                  } finally {
                    setIsStatusActionLoading(false);
                  }
                }}
                className="bg-[#24543D] hover:bg-[#1a3d2c] text-[#FAF7F1] text-xs h-9 gap-1.5"
              >
                {isStatusActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Duplicate & Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Campaign Rejection Reason Dialog */}
      <Dialog open={rejectCampaignDialogOpen} onOpenChange={setRejectCampaignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Campaign #{selectedCampaignForReject?.id}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide feedback for the campaign author explaining what changes are needed before resubmission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold uppercase tracking-wider block">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="e.g. Please update discount terms and verify image licensing..."
              value={campaignRejectReason}
              onChange={(e) => setCampaignRejectReason(e.target.value)}
              className="text-xs h-24 border-[#E5DDD0] resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectCampaignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={rejectCampaignMutation.isPending || !campaignRejectReason.trim()}
              onClick={() => {
                if (!selectedCampaignForReject) return;
                rejectCampaignMutation.mutate({
                  id: selectedCampaignForReject.id,
                  reason: campaignRejectReason.trim(),
                });
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Automation Delay Configuration Dialog */}
      <Dialog open={delayConfigDialogOpen} onOpenChange={setDelayConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#24543D]" />
              Configure {selectedAutomationForDelay?.name} Timing
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adjust execution delay window for this automated workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <label className="text-xs font-semibold uppercase tracking-wider block">
              Delay Window ({selectedAutomationForDelay?.delayUnit || "hours"})
            </label>
            <Input
              type="number"
              min={1}
              max={720}
              value={automationDelayValueInput}
              onChange={(e) => setAutomationDelayValueInput(Number(e.target.value) || 1)}
              className="h-9 text-xs border-[#E5DDD0]"
            />
            <span className="text-[11px] text-muted-foreground block">
              Trigger timing will apply to all subsequent events.
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDelayConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateAutomationDelayMutation.isPending}
              onClick={() => {
                if (!selectedAutomationForDelay) return;
                updateAutomationDelayMutation.mutate({
                  id: selectedAutomationForDelay.id,
                  delayValue: automationDelayValueInput,
                });
              }}
              className="bg-[#24543D] hover:bg-[#1b3f2e] text-white"
            >
              Save Timing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Audience Reach Preview Dialog */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-[#24543D]" />
              Audience Reach: {selectedCampaignForPreview?.name}
            </DialogTitle>
          </DialogHeader>

          {previewLoading ? (
            <div className="p-8 text-center text-muted-foreground text-xs">Calculating reach...</div>
          ) : audiencePreview ? (
            <div className="space-y-5 py-2 text-xs">
              {selectedCampaignForPreview?.targetAudience?.type === "custom_segment" && (
                <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Retired Audience Option</span>
                    This campaign currently uses the retired <strong>Custom Destination Segment</strong>. It resolves 0 recipients. Please edit the campaign and reassign its audience to one of the four supported segments before approval or dispatch.
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-center">
                <div className="p-3 rounded-lg bg-[#FAF7F1] border border-[#E5DDD0]">
                  <span className="text-xl font-bold font-serif text-foreground block tabular-nums">
                    {audiencePreview.totalSelected ?? (audiencePreview.eligibleRecipients + (audiencePreview.excludedNotSubscribed || 0) + (audiencePreview.excludedUnsubscribed || 0) + (audiencePreview.excludedSuppressed || 0))}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Total Selected
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-xl font-bold font-serif text-emerald-800 block tabular-nums">
                    {audiencePreview.eligibleRecipients}
                  </span>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-medium">
                    Eligible Marketing
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-xl font-bold font-serif text-slate-700 block tabular-nums">
                    {audiencePreview.excludedNotSubscribed ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">
                    Not Subscribed
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-xl font-bold font-serif text-amber-800 block tabular-nums">
                    {audiencePreview.excludedUnsubscribed ?? audiencePreview.unsubscribedCount}
                  </span>
                  <span className="text-[10px] text-amber-700 uppercase tracking-wider font-medium">
                    Unsubscribed
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-xl font-bold font-serif text-red-700 block tabular-nums">
                    {audiencePreview.excludedSuppressed ?? 0}
                  </span>
                  <span className="text-[10px] text-red-600 uppercase tracking-wider font-medium">
                    Suppressed
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Sample Contact Breakdown
                </span>
                <div className="rounded-lg border border-[#E5DDD0] overflow-hidden divide-y divide-[#E5DDD0] max-h-60 overflow-y-auto">
                  {audiencePreview.sampleRecipients.map((r, i) => {
                    const isSub = r.consentStatus === "subscribed" || (r.isSubscribed && r.consentStatus !== "not_subscribed" && r.consentStatus !== "unsubscribed" && r.consentStatus !== "suppressed");
                    const isNotSub = r.consentStatus === "not_subscribed";
                    const isUnsub = r.consentStatus === "unsubscribed";
                    const isSupp = r.consentStatus === "suppressed";

                    return (
                      <div key={i} className="p-2.5 flex items-center justify-between bg-white dark:bg-card">
                        <div>
                          <span className="font-semibold text-foreground">{r.name}</span>{" "}
                          <span className="text-muted-foreground font-mono text-[11px]">({r.email})</span>
                        </div>
                        {isSub ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                            Eligible · Subscribed
                          </Badge>
                        ) : isNotSub ? (
                          <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-700 bg-slate-50">
                            Excluded · Not Subscribed
                          </Badge>
                        ) : isUnsub ? (
                          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                            Excluded · Unsubscribed
                          </Badge>
                        ) : isSupp ? (
                          <Badge variant="outline" className="text-[10px] border-red-300 text-red-700 bg-red-50">
                            Excluded · Suppressed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-700 bg-slate-50">
                            Excluded
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button size="sm" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Schedule Campaign Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#24543D]" />
              Schedule Campaign #{selectedCampaignForSchedule?.id}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <label className="text-xs font-semibold uppercase tracking-wider block">Target Date & Time</label>
            <Input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="h-9 text-xs border-[#E5DDD0]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selectedCampaignForSchedule || !scheduleDateTime) return;
                scheduleMutation.mutate({
                  id: selectedCampaignForSchedule.id,
                  scheduledAt: new Date(scheduleDateTime).toISOString(),
                });
              }}
              disabled={scheduleMutation.isPending}
              className="bg-[#24543D] hover:bg-[#1b3f2e] text-white"
            >
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Dispatch Campaign Execution Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-[#24543D]" />
              Dispatch Campaign #{selectedCampaignForSend?.id}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            {/* Pre-Send Audit Summary */}
            {presendValidationQuery.isLoading ? (
              <div className="p-3 rounded-lg border border-[#E5DDD0] bg-[#FAF8F5] flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-[#24543D]" />
                <span>Auditing recipient merge tags and consent tokens...</span>
              </div>
            ) : presendValidationQuery.data ? (
              <div className="p-3 rounded-lg border border-[#E5DDD0] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#24543D]" /> Pre-Send Merge Tag Audit
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium",
                      presendValidationQuery.data.canSend
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    {presendValidationQuery.data.canSend ? "Ready to Dispatch" : "Blocked by Validation"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#FAF8F5] p-2 rounded border border-[#E5DDD0]/70">
                    <span className="text-muted-foreground block text-[10px]">Ready to Receive</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {presendValidationQuery.data.readyToSendCount} / {presendValidationQuery.data.totalAudienceCount}
                    </span>
                  </div>
                  <div className="bg-[#FAF8F5] p-2 rounded border border-[#E5DDD0]/70">
                    <span className="text-muted-foreground block text-[10px]">Excluded / Opted-out</span>
                    <span className="font-bold text-amber-700 text-sm">
                      {presendValidationQuery.data.excludedCount}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground bg-stone-50 p-2 rounded border border-stone-200/60 space-y-1">
                  <span className="font-medium text-stone-700 block">Personalization Fallbacks:</span>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200">
                      Name fallback: <strong>{presendValidationQuery.data.fallbacksUsed?.namesUsingFallbackCount || 0}</strong>
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200">
                      Destination fallback: <strong>{presendValidationQuery.data.fallbacksUsed?.destinationsUsingFallbackCount || 0}</strong>
                    </span>
                  </div>
                </div>

                {presendValidationQuery.data.unresolvedTags?.length > 0 && (
                  <div className="p-2 rounded bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <strong className="block">Unresolved Merge Tags</strong>
                      <span>Missing or malformed: {presendValidationQuery.data.unresolvedTags.join(", ")}</span>
                    </div>
                  </div>
                )}

                {presendValidationQuery.data.blockReason && (
                  <p className="text-red-600 text-[11px] font-medium bg-red-50/50 p-2 rounded border border-red-200/50">
                    ⚠️ {presendValidationQuery.data.blockReason}
                  </p>
                )}
              </div>
            ) : null}

            <div className="p-3 rounded-lg border border-[#24543D]/25 bg-[#24543D]/5 space-y-1">
              <p className="font-semibold text-[#24543D]">Enforced Safeguards</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>Strict consent verification: opted-out contacts are skipped.</li>
                <li>Personalized one-click unsubscribe links automatically attached.</li>
                <li>Delivery records and provider message IDs recorded.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5DDD0] bg-stone-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground block">Simulation Mode</span>
                  <Badge variant="outline" className={sendMockMode ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px]" : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"}>
                    {sendMockMode ? "Dry Run (Zero Mail Sent)" : "Live Outbound Dispatch"}
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  {sendMockMode
                    ? "Dry run only. Generates delivery records in database without contacting recipient mailboxes."
                    : "Live mode. Dispatches actual emails to recipient mailboxes (requires live marketing provider configuration)."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={sendMockMode}
                onChange={(e) => setSendMockMode(e.target.checked)}
                className="h-4 w-4 accent-[#24543D]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selectedCampaignForSend) return;
                sendMutation.mutate({
                  id: selectedCampaignForSend.id,
                  mock: sendMockMode,
                });
              }}
              disabled={sendMutation.isPending || (presendValidationQuery.data && !presendValidationQuery.data.canSend)}
              className="bg-[#24543D] hover:bg-[#1b3f2e] text-white"
            >
              {sendMutation.isPending ? "Dispatching..." : sendMockMode ? "Run Simulation Dispatch" : "Confirm Live Dispatch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7b. Send Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#24543D]" />
              Send Test Email
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deliver a live test copy to an individual email address to inspect rendering and deliverability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Campaign info card */}
            <div className="p-3 rounded-lg border border-[#E5DDD0] bg-[#FAF8F5] space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Campaign:</span>
                <span className="font-medium text-foreground">{selectedCampaignForTest?.name || "Untitled Campaign"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-serif italic text-foreground truncate max-w-[240px]">
                  {selectedCampaignForTest?.subject || "No subject set"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-[#E5DDD0]">
                <span className="text-muted-foreground">Authenticated Sender:</span>
                <span className="font-mono text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
                  {emailConfig?.fullFrom || '"Escora Journeys" <arunopera7@gmail.com>'}
                </span>
              </div>
            </div>

            {/* Recipient Input */}
            <div className="space-y-1.5">
              <label htmlFor="test-recipient-email-input" className="font-semibold text-foreground block">
                Recipient Email Address:
              </label>
              <Input
                id="test-recipient-email-input"
                type="email"
                placeholder="e.g. arunopera7@gmail.com"
                value={testRecipientEmail}
                onChange={(e) => setTestRecipientEmail(e.target.value)}
                className="text-xs h-9 bg-white"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sends <strong>only</strong> to this test recipient. The target audience is <strong>never</strong> contacted during a test send.
              </p>
            </div>

            {/* Gmail App Password instructions if not yet configured in .env */}
            {!emailConfig?.isConfigured && (
              <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/80 text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  Gmail App Password Required
                </div>
                <p className="leading-relaxed text-[11px]">
                  To send genuine, authenticated test emails directly from <strong>arunopera7@gmail.com</strong>:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-950/80">
                  <li>Ensure 2-Step Verification is active on your Google Account.</li>
                  <li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-medium text-amber-900">myaccount.google.com/apppasswords</a>.</li>
                  <li>Generate an App Password named "Escora Admin".</li>
                  <li>Copy the 16-character code into <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">GMAIL_APP_PASSWORD</code> in your <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">.env</code> file.</li>
                </ol>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setTestEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!testRecipientEmail.trim()) {
                  toast({
                    title: "Recipient Required",
                    description: "Please specify a destination email address.",
                    variant: "destructive",
                  });
                  return;
                }
                sendTestEmailMutation.mutate({
                  campaignId: selectedCampaignForTest?.id,
                  recipientEmail: testRecipientEmail.trim(),
                });
              }}
              disabled={sendTestEmailMutation.isPending || !testRecipientEmail.trim()}
              className="bg-[#24543D] hover:bg-[#1b3f2e] text-white gap-1.5"
            >
              {sendTestEmailMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Sending Test...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Notification HTML Preview Dialog */}
      <Dialog open={Boolean(previewNotificationId)} onOpenChange={(open) => !open && setPreviewNotificationId(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#24543D]" />
                Email Rendered Preview #{previewNotificationId}
              </span>
              {previewData?.status && (
                <Badge variant="outline" className="text-xs uppercase font-medium">
                  {previewData.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {previewData ? (
                <span>
                  Subject: <strong className="text-foreground">{previewData.subject}</strong> · Recipient:{" "}
                  <strong className="text-foreground">{previewData.recipientName}</strong> &lt;{previewData.recipientEmail}&gt;
                </span>
              ) : (
                "Loading preview..."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {notifPreviewLoading ? (
              <div className="p-16 text-center text-muted-foreground text-xs">Rendering preview...</div>
            ) : previewData?.html ? (
              <div className="rounded-lg border border-[#E5DDD0] overflow-hidden bg-white shadow-inner">
                <iframe
                  srcDoc={previewData.html}
                  className="w-full h-[520px] border-none"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground text-xs">Unable to render email preview.</div>
            )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setPreviewNotificationId(null)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. Notification Full Details Modal */}
      <Dialog open={Boolean(selectedNotifDetails)} onOpenChange={(open) => !open && setSelectedNotifDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#24543D]" />
              Audit Record #{selectedNotifDetails?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedNotifDetails && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-[#E5DDD0] bg-[#FAF7F1]">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Type:</span>
                  <span className="font-semibold text-foreground font-mono">{selectedNotifDetails.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Delivery Result:</span>
                  <span className="font-semibold text-foreground capitalize">
                    {selectedNotifDetails.status === "delivered"
                      ? "Delivered (Confirmed)"
                      : selectedNotifDetails.status === "accepted" || selectedNotifDetails.status === "sent"
                      ? "Accepted (Relayed)"
                      : selectedNotifDetails.status === "simulated"
                      ? "Simulated (Mock)"
                      : selectedNotifDetails.status === "bounced"
                      ? "Bounced"
                      : selectedNotifDetails.status}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Recipient:</span>
                  <span className="font-mono text-foreground">{selectedNotifDetails.recipientEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Provider:</span>
                  <span className="font-mono text-foreground uppercase text-[11px]">
                    {selectedNotifDetails.metadata?.provider || "Gmail SMTP"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Message ID:</span>
                  <span className="font-mono text-foreground truncate block" title={selectedNotifDetails.messageId || "None"}>
                    {selectedNotifDetails.messageId || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Sent At:</span>
                  <span className="text-foreground">
                    {selectedNotifDetails.sentAt ? new Date(selectedNotifDetails.sentAt).toLocaleString() : "N/A"}
                  </span>
                </div>
                {(selectedNotifDetails.deliveredAt || selectedNotifDetails.metadata?.deliveryConfirmedAt) && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Delivered At:</span>
                    <span className="text-emerald-700 font-medium">
                      {new Date(selectedNotifDetails.deliveredAt || selectedNotifDetails.metadata?.deliveryConfirmedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedNotifDetails.bouncedAt && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Bounced At:</span>
                    <span className="text-orange-700 font-medium">
                      {new Date(selectedNotifDetails.bouncedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Delivery Semantics & Mailbox Notice */}
              {(selectedNotifDetails.status === "accepted" || selectedNotifDetails.status === "sent") && (
                <div className="p-3 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 text-[11px] leading-relaxed">
                  <strong className="block font-semibold mb-1 text-sky-950">Delivery Semantics Notice:</strong>
                  This email was accepted by the outbound mail server relay for transmission. In standard SMTP protocols, relay acceptance confirms the mail server received the message, but does not guarantee the email reached the inbox. When sending from personal Gmail accounts or domains without custom SPF/DKIM alignment, recipient mail servers often route automated messages to <strong>Spam / Junk</strong> or <strong>Promotions</strong> folders, or apply throttling. Please advise the recipient to inspect their Spam and All Mail tabs.
                </div>
              )}

              {selectedNotifDetails.status === "simulated" && (
                <div className="p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-900 text-[11px] leading-relaxed">
                  <strong className="block font-semibold mb-1 text-purple-950">Simulation Mode:</strong>
                  This dispatch was recorded in mock / simulation mode. No live email was dispatched to the external mail network.
                </div>
              )}

              {selectedNotifDetails.status === "delivered" && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-[11px] leading-relaxed">
                  <strong className="block font-semibold mb-1 text-emerald-950">Verified Inbox Delivery:</strong>
                  Reliable delivery confirmation received from the provider webhook.
                </div>
              )}

              {selectedNotifDetails.metadata?.smtpResponse && (
                <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-[11px]">
                  <span className="text-muted-foreground block text-[10px] uppercase font-sans font-semibold">SMTP Response</span>
                  <span className="text-zinc-800">{selectedNotifDetails.metadata.smtpResponse}</span>
                </div>
              )}

              {selectedNotifDetails.error && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
                  <span className="font-semibold block mb-0.5">Failure Reason:</span>
                  <span className="font-mono text-[11px]">{selectedNotifDetails.error}</span>
                </div>
              )}

              {selectedNotifDetails.metadata && Object.keys(selectedNotifDetails.metadata).length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] block">
                    Telemetry Metadata
                  </span>
                  <pre className="p-3 rounded bg-muted/20 border font-mono text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(selectedNotifDetails.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedNotifDetails?.status === "failed" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  retryNotificationMutation.mutate(selectedNotifDetails.id);
                  setSelectedNotifDetails(null);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retry Delivery
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setSelectedNotifDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 10. Automation Configuration Modal (Create & Edit) */}
      <AutomationConfigModal
        open={automationModalOpen}
        onOpenChange={(isOpen) => {
          setAutomationModalOpen(isOpen);
          if (!isOpen) setEditingAutomation(null);
        }}
        automation={editingAutomation}
        onSave={async (formData) => {
          if (editingAutomation?.id) {
            await updateAutomationMutation.mutateAsync({ id: editingAutomation.id, data: formData });
          } else {
            await createAutomationMutation.mutateAsync(formData);
          }
        }}
        isSaving={createAutomationMutation.isPending || updateAutomationMutation.isPending}
      />

      {/* 11. Delete Automation Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirmAutomation)} onOpenChange={(open) => !open && setDeleteConfirmAutomation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-foreground flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Automation Rule
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete the automation rule{" "}
              <strong className="text-foreground">"{deleteConfirmAutomation?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-muted-foreground bg-red-50/50 p-3 rounded-lg border border-red-200">
            This will remove the event trigger configuration from the database. Automatic emails associated with trigger{" "}
            <span className="font-mono text-foreground font-semibold">{deleteConfirmAutomation?.trigger}</span> will cease to fire.
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmAutomation(null)}
              disabled={deleteAutomationMutation.isPending}
              className="text-xs border-[#E5DDD0]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleteAutomationMutation.isPending}
              onClick={() => {
                if (deleteConfirmAutomation?.id) {
                  deleteAutomationMutation.mutate(deleteConfirmAutomation.id);
                }
              }}
              className="text-xs"
            >
              {deleteAutomationMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 12. Unsubscribe Confirmation Dialog */}
      <Dialog open={unsubscribeDialogOpen} onOpenChange={setUnsubscribeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-foreground flex items-center gap-2 text-amber-700">
              <UserX className="h-5 w-5 text-amber-600" />
              Unsubscribe from Marketing
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to unsubscribe{" "}
              <strong className="text-foreground">{selectedContactForUnsub?.email}</strong> from future marketing campaigns?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 space-y-1.5 text-[11px] leading-relaxed">
              <p className="font-semibold text-amber-950">Consent & Compliance Safeguards</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Immediately excludes this normalized email from all marketing campaigns.</li>
                <li>Applies across duplicate contacts sharing the same email address.</li>
                <li>Audience groups, bookings, or new enquiries will <strong>not</strong> silently resubscribe this contact.</li>
                <li>Transactional notices (booking confirmations, receipts) remain active where applicable.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block text-[11px]">
                Reason for Opt-Out (Optional):
              </label>
              <Input
                placeholder="e.g. Customer requested via phone / chat, admin opt-out"
                value={unsubReasonInput}
                onChange={(e) => setUnsubReasonInput(e.target.value)}
                className="text-xs h-8 border-[#E5DDD0] bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnsubscribeDialogOpen(false)}
              disabled={adminUnsubscribeMutation.isPending}
              className="text-xs border-[#E5DDD0]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={adminUnsubscribeMutation.isPending || !selectedContactForUnsub?.email}
              onClick={() => {
                if (selectedContactForUnsub?.email) {
                  adminUnsubscribeMutation.mutate({
                    email: selectedContactForUnsub.email,
                    reason: unsubReasonInput.trim() || undefined,
                  });
                }
              }}
              className="text-xs bg-amber-700 hover:bg-amber-800 text-white"
            >
              {adminUnsubscribeMutation.isPending ? "Unsubscribing..." : "Confirm Unsubscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 13. Record Explicit Subscription Consent Dialog */}
      <Dialog open={recordConsentDialogOpen} onOpenChange={setRecordConsentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-foreground flex items-center gap-2 text-[#24543D]">
              <UserCheck className="h-5 w-5 text-[#24543D]" />
              Record Explicit Marketing Consent
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record verified marketing consent for{" "}
              <strong className="text-foreground">{selectedContactForConsent?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg border border-[#24543D]/25 bg-[#24543D]/5 space-y-1 text-[11px] leading-relaxed text-[#24543D]">
              <p className="font-semibold">Compliance Notice</p>
              <p>
                Only record consent when the customer has affirmatively opted in. Missing consent records, bookings,
                or staff assumptions do <strong>not</strong> constitute valid consent.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block text-[11px]">Contact Name (Optional):</label>
              <Input
                placeholder="Customer full name"
                value={consentNameInput}
                onChange={(e) => setConsentNameInput(e.target.value)}
                className="text-xs h-8 border-[#E5DDD0] bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block text-[11px]">Consent Method:</label>
                <select
                  value={consentMethodInput}
                  onChange={(e) => setConsentMethodInput(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground"
                >
                  <option value="written_request">Written Request (Email / Form)</option>
                  <option value="verbal_consent">Customer Care (Phone Consent)</option>
                  <option value="in_person">In-Person Consultation</option>
                  <option value="digital_form">Signed Consent Form</option>
                  <option value="double_opt_in">Double Opt-In Confirmed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground block text-[11px]">Consent Date:</label>
                <Input
                  type="date"
                  value={consentDateInput}
                  onChange={(e) => setConsentDateInput(e.target.value)}
                  className="text-xs h-8 border-[#E5DDD0] bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block text-[11px]">Consent Source / Channel:</label>
              <Input
                placeholder="e.g. Website Signup, Customer Care Desk, VIP Form"
                value={consentSourceInput}
                onChange={(e) => setConsentSourceInput(e.target.value)}
                className="text-xs h-8 border-[#E5DDD0] bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="doi-confirm"
                checked={doubleOptInInput}
                onCheckedChange={(checked) => setDoubleOptInInput(Boolean(checked))}
              />
              <label htmlFor="doi-confirm" className="text-[11px] text-foreground cursor-pointer">
                Confirmed via double opt-in verification or documented audit link
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block text-[11px]">Audit Notes (Optional):</label>
              <Textarea
                placeholder="Documentation or reference details for this consent recording..."
                value={consentNotesInput}
                onChange={(e) => setConsentNotesInput(e.target.value)}
                className="text-xs border-[#E5DDD0] bg-white resize-none h-16"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecordConsentDialogOpen(false)}
              disabled={recordConsentMutation.isPending}
              className="text-xs border-[#E5DDD0]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={recordConsentMutation.isPending || !selectedContactForConsent?.email}
              onClick={() => {
                if (selectedContactForConsent?.email) {
                  recordConsentMutation.mutate({
                    email: selectedContactForConsent.email,
                    name: consentNameInput.trim() || undefined,
                    consentMethod: consentMethodInput,
                    source: consentSourceInput.trim() || "Customer Explicit Consent",
                    consentDate: consentDateInput,
                    doubleOptInConfirmed: doubleOptInInput,
                    notes: consentNotesInput.trim() || undefined,
                  });
                }
              }}
              className="text-xs bg-[#24543D] hover:bg-[#1b3f2e] text-white"
            >
              {recordConsentMutation.isPending ? "Recording..." : "Record Verified Consent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 14. Suppress Email Address Dialog */}
      <Dialog open={suppressDialogOpen} onOpenChange={setSuppressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-foreground flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5 text-red-600" />
              Suppress Email Address
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Permanently suppress <strong className="text-foreground">{selectedContactForSuppress?.email}</strong> from all marketing campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-900 space-y-1.5 text-[11px] leading-relaxed">
              <p className="font-semibold text-red-950">Precedence & Persistence</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Suppression takes absolute precedence over customer groups and subscribed status.</li>
                <li>The contact will be immediately blocked from all campaign audience resolutions.</li>
                <li>Suppression persists even if a contact record is deleted or recreated.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block text-[11px]">Suppression Reason Category:</label>
              <select
                value={suppressCategoryInput}
                onChange={(e) => setSuppressCategoryInput(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-md border border-[#E5DDD0] bg-white text-foreground"
              >
                <option value="spam_complaint">Spam Complaint / Deliverability Risk</option>
                <option value="hard_bounce">Permanent Bounce / Invalid Mailbox</option>
                <option value="legal_compliance">Legal / Regulatory Block</option>
                <option value="administrative">Administrative Exclusion / High Risk</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block text-[11px]">Justification & Details:</label>
              <Textarea
                placeholder="Explain why this address is being suppressed..."
                value={suppressDetailsInput}
                onChange={(e) => setSuppressDetailsInput(e.target.value)}
                className="text-xs border-[#E5DDD0] bg-white resize-none h-16"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuppressDialogOpen(false)}
              disabled={suppressMutation.isPending}
              className="text-xs border-[#E5DDD0]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={suppressMutation.isPending || !selectedContactForSuppress?.email}
              onClick={() => {
                if (selectedContactForSuppress?.email) {
                  const reasonCombined = suppressDetailsInput.trim()
                    ? `${suppressCategoryInput}: ${suppressDetailsInput.trim()}`
                    : suppressCategoryInput;
                  suppressMutation.mutate({
                    email: selectedContactForSuppress.email,
                    reason: reasonCombined,
                  });
                }
              }}
              className="text-xs"
            >
              {suppressMutation.isPending ? "Suppressing..." : "Confirm Email Suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 15. Lift Email Suppression Dialog */}
      <Dialog open={unsuppressDialogOpen} onOpenChange={setUnsuppressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-foreground flex items-center gap-2 text-blue-700">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              Lift Email Suppression
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Lift marketing suppression for <strong className="text-foreground">{selectedContactForUnsuppress?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-900 space-y-1 text-[11px] leading-relaxed">
              <p className="font-semibold text-blue-950">Important Notice</p>
              <p>
                Removing suppression lifts the hard block. The contact will remain in their default opt-out state
                until fresh explicit consent is recorded.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block text-[11px]">Reason for Lifting Suppression (Optional):</label>
              <Input
                placeholder="e.g. Mailbox issue resolved, customer appealed"
                value={unsuppressReasonInput}
                onChange={(e) => setUnsuppressReasonInput(e.target.value)}
                className="text-xs h-8 border-[#E5DDD0] bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnsuppressDialogOpen(false)}
              disabled={unsuppressMutation.isPending}
              className="text-xs border-[#E5DDD0]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={unsuppressMutation.isPending || !selectedContactForUnsuppress?.email}
              onClick={() => {
                if (selectedContactForUnsuppress?.email) {
                  unsuppressMutation.mutate({
                    email: selectedContactForUnsuppress.email,
                    reason: unsuppressReasonInput.trim() || undefined,
                  });
                }
              }}
              className="text-xs bg-blue-700 hover:bg-blue-800 text-white"
            >
              {unsuppressMutation.isPending ? "Lifting..." : "Lift Suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 16. Remove Contact Record Dialog */}
      <Dialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-foreground flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove Contact Record
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review linked records before removing contact{" "}
              <strong className="text-foreground">{selectedContactForDelete?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {deleteInspectionLoading ? (
              <div className="p-6 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Inspecting linked enquiries, bookings, invoices, and audience groups...
              </div>
            ) : deleteInspectionData ? (
              <>
                <div className="p-3 rounded-lg border border-[#E5DDD0] bg-[#FAF8F5] space-y-2">
                  <div className="font-semibold text-foreground text-[11px]">Associated Business Records:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-white border border-[#E5DDD0]">
                      <span className="text-muted-foreground block text-[10px]">Enquiries</span>
                      <strong className="text-foreground">{deleteInspectionData.relationships?.enquiriesCount || 0}</strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-[#E5DDD0]">
                      <span className="text-muted-foreground block text-[10px]">Bookings / Orders</span>
                      <strong className={deleteInspectionData.relationships?.ordersCount > 0 ? "text-red-600 font-bold" : "text-foreground"}>
                        {deleteInspectionData.relationships?.ordersCount || 0}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-[#E5DDD0]">
                      <span className="text-muted-foreground block text-[10px]">Invoices</span>
                      <strong className={deleteInspectionData.relationships?.invoicesCount > 0 ? "text-red-600 font-bold" : "text-foreground"}>
                        {deleteInspectionData.relationships?.invoicesCount || 0}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-[#E5DDD0]">
                      <span className="text-muted-foreground block text-[10px]">Audience Groups</span>
                      <strong className="text-foreground">{deleteInspectionData.relationships?.audienceGroupCount || 0}</strong>
                    </div>
                  </div>
                </div>

                {!deleteInspectionData.canDelete ? (
                  <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-900 space-y-1 text-[11px] leading-relaxed">
                    <div className="font-semibold flex items-center gap-1.5 text-red-950">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      Contact Record Cannot Be Removed
                    </div>
                    <p>{deleteInspectionData.reason}</p>
                    <p className="text-[10px] text-red-800/80 mt-1">
                      To stop marketing communications without altering financial records, use <strong>Unsubscribe</strong> or <strong>Suppress</strong> instead.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 space-y-1 text-[11px] leading-relaxed">
                    <div className="font-semibold flex items-center gap-1.5 text-emerald-950">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      Safe to Remove
                    </div>
                    <p>
                      No active bookings or invoices found. Deletion will detach this contact from customer groups and remove enquiry/subscriber records.
                      Any opt-out or suppression protections will be preserved in canonical audit records.
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteContactDialogOpen(false)}
              disabled={deleteContactMutation.isPending}
              className="text-xs border-[#E5DDD0]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={
                deleteContactMutation.isPending ||
                deleteInspectionLoading ||
                !deleteInspectionData?.canDelete ||
                !selectedContactForDelete?.email
              }
              onClick={() => {
                if (selectedContactForDelete?.email) {
                  deleteContactMutation.mutate({ email: selectedContactForDelete.email });
                }
              }}
              className="text-xs"
            >
              {deleteContactMutation.isPending ? "Removing..." : "Confirm Removal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

