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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

export const TRIGGER_MAP_TO_NOTIF_TYPE: Record<string, string> = {
  enquiry_submitted: "enquiry_acknowledgement",
  booking_confirmed: "booking_confirmation",
  payment_succeeded: "payment_receipt",
  payment_reminder_due: "payment_deadline_reminder",
  pre_trip_departure: "pre_trip_reminder",
  travel_documents_ready: "travel_document_delivery",
  enquiry_unconverted: "enquiry_followup",
  trip_completed: "post_trip_feedback",
  itinerary_amended: "itinerary_update",
  operational_alert: "exceptional_notice",
};

export const AUTOMATION_PLAIN_DESCRIPTIONS: Record<string, string> = {
  enquiry_submitted: "Sent immediately when a customer submits a travel enquiry, confirming their request has been received.",
  booking_confirmed: "Sent when an itinerary proposal is accepted and booked, providing the official confirmation and package summary.",
  payment_succeeded: "Sent automatically upon receipt of payment, containing the payment receipt and billing acknowledgment.",
  payment_reminder_due: "Sent prior to the invoice payment deadline to gently remind the customer of pending balance.",
  pre_trip_departure: "Sent shortly before departure with destination guidelines, Kerala travel advice, and what to pack.",
  travel_documents_ready: "Sent when final tour vouchers, airline/train tickets, and chauffeur contact details are ready.",
  enquiry_unconverted: "Sent as an unhurried, helpful follow-up if an enquiry has had no activity for several days.",
  trip_completed: "Sent after the holiday concludes to thank the guest and invite feedback and reviews.",
  itinerary_amended: "Sent whenever our travel planners make updates or improvements to an existing itinerary proposal.",
  operational_alert: "Sent for special travel notices, exceptional flight/weather updates, or urgent alerts.",
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

export function getSimpleCampaignStatus(status: string): { label: string; badgeClass: string } {
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
      return { label: "Sent", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" };
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
    type: "all_contacts" | "enquiries_only" | "confirmed_guests" | "custom_segment" | "audience_group";
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
  subscribed: boolean;
  token: string;
  source: string;
  unsubscribedAt?: string | null;
  createdAt: string;
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
  status: "pending" | "pending_approval" | "sending" | "sent" | "failed" | "cancelled" | "skipped";
  requiresApproval?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  scheduledFor?: string | null;
  sentAt?: string | null;
  messageId?: string | null;
  error?: string | null;
  retryCount: number;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface AudiencePreviewData {
  eligibleRecipients: number;
  activeSubscribers: number;
  unsubscribedCount: number;
  sampleRecipients: Array<{
    name: string;
    email: string;
    source: string;
    isSubscribed: boolean;
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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCampaignForPreview, setSelectedCampaignForPreview] = useState<CampaignItem | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedCampaignForSchedule, setSelectedCampaignForSchedule] = useState<CampaignItem | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedCampaignForSend, setSelectedCampaignForSend] = useState<CampaignItem | null>(null);
  const [sendMockMode, setSendMockMode] = useState(true);

  // Audience Groups modal state
  const [audienceModalOpen, setAudienceModalOpen] = useState(false);

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

  // Subscriber filters
  const [subStatusFilter, setSubStatusFilter] = useState<"all" | "subscribed" | "opted_out">("all");
  const [subSearchQuery, setSubSearchQuery] = useState("");

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

  // -------------------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------------------

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "campaigns-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "automations"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
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
            groupId: payload.groupId,
            groupIds: payload.groupIds,
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

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      if (subStatusFilter === "subscribed" && !s.subscribed) return false;
      if (subStatusFilter === "opted_out" && s.subscribed) return false;
      if (subSearchQuery.trim()) {
        const q = subSearchQuery.toLowerCase();
        return s.email.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q));
      }
      return true;
    });
  }, [subscribers, subStatusFilter, subSearchQuery]);

  // Filtered automations memo
  const filteredAutomations = useMemo(() => {
    return automations.filter((auto) => {
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
  }, [automations, automationCategoryFilter, automationStatusFilter, automationSearchQuery]);

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
        source: "automation",
        type: n.type,
        sourceName: n.category === "manual" ? "Manual Admin" : "System Automation",
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
      if (auditStatusFilter !== "all" && item.status !== auditStatusFilter) return false;
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

  const openEditDialog = (campaign: CampaignItem) => {
    setEditingCampaign(campaign);
    setCreateDialogOpen(true);
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
          camp.deliveries?.some((d) => d.deliveryStatus === "simulated" || d.messageId?.startsWith("mock_"));
        return (
          <Badge
            variant="outline"
            className={`text-[11px] ${
              isSimulated
                ? "border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/30"
                : "border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
            }`}
          >
            {isSimulated ? "Delivered (Simulated)" : "Delivered (Live)"}
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
                      {automations.filter((a) => a.enabled).length} of {automations.length} active
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
                const statusMeta = getSimpleCampaignStatus(camp.status);
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
                          <Badge variant="outline" className={`text-[11px] font-sans font-medium ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-sans truncate">
                          <span className="font-medium text-foreground/80">Subject:</span> "{camp.subject}"
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-sans pt-0.5">
                          {camp.sentAt ? (
                            <span>Sent on {new Date(camp.sentAt).toLocaleDateString()}</span>
                          ) : camp.scheduledAt ? (
                            <span className="text-purple-700 dark:text-purple-300 font-medium">
                              Scheduled for {new Date(camp.scheduledAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span>Created {new Date(camp.createdAt).toLocaleDateString()}</span>
                          )}
                          <span>·</span>
                          <span>Audience: {camp.targetAudience?.type?.replace(/_/g, " ") || "All contacts"}</span>
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

                        {(camp.status === "draft" || camp.status === "rejected") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(camp)}
                            className="text-xs h-8 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                        )}

                        {camp.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => submitCampaignApprovalMutation.mutate(camp.id)}
                            className="text-xs h-8 border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100"
                          >
                            Request Approval
                          </Button>
                        )}

                        {(camp.status === "approved" || camp.status === "draft") && (
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

                        {(camp.status === "approved" || camp.status === "draft") && (
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
                  <option value="all">All Rules ({automations.length})</option>
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
                  onClick={() => setAudienceModalOpen(true)}
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
                    onClick={() => setAudienceModalOpen(true)}
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
                          onClick={() => setAudienceModalOpen(true)}
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
                    <option value="all">All Contacts ({subscribers.length})</option>
                    <option value="subscribed">Subscribed Only</option>
                    <option value="opted_out">Opted Out (Unsubscribed)</option>
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
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DDD0]">
                      {filteredSubscribers.map((sub) => (
                        <tr key={sub.email} className="hover:bg-muted/10">
                          <td className="py-3 px-4 font-medium text-foreground">{sub.name || "—"}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-foreground">{sub.email}</td>
                          <td className="py-3 px-4">
                            {sub.subscribed ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                                Subscribed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[11px]">
                                Opted Out ({sub.unsubscribedAt ? new Date(sub.unsubscribedAt).toLocaleDateString() : "Active"})
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 capitalize text-muted-foreground">{sub.source}</td>
                          <td className="py-3 px-4 text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
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
                <option value="sent">Delivered / Sent</option>
                <option value="pending">Queued / Scheduled</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="failed">Failed / Undelivered</option>
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
                    const isDelivered = log.status === "sent" || log.status === "delivered";
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
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                              Delivered
                            </Badge>
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
      <ManageAudiencesModal isOpen={audienceModalOpen} onClose={() => setAudienceModalOpen(false)} />

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
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-lg bg-[#FAF7F1] border border-[#E5DDD0]">
                  <span className="text-2xl font-bold font-serif text-foreground block tabular-nums">
                    {audiencePreview.eligibleRecipients}
                  </span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Eligible Recipients
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-2xl font-bold font-serif text-emerald-800 block tabular-nums">
                    {audiencePreview.activeSubscribers}
                  </span>
                  <span className="text-[11px] text-emerald-700 uppercase tracking-wider">Active Opt-In</span>
                </div>
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-2xl font-bold font-serif text-red-700 block tabular-nums">
                    {audiencePreview.unsubscribedCount}
                  </span>
                  <span className="text-[11px] text-red-600 uppercase tracking-wider">Opted-Out Excluded</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Sample Eligible Contacts
                </span>
                <div className="rounded-lg border border-[#E5DDD0] overflow-hidden divide-y divide-[#E5DDD0]">
                  {audiencePreview.sampleRecipients.map((r, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between bg-white dark:bg-card">
                      <div>
                        <span className="font-semibold text-foreground">{r.name}</span>{" "}
                        <span className="text-muted-foreground font-mono text-[11px]">({r.email})</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          r.isSubscribed
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : "border-red-300 text-red-700 bg-red-50"
                        }`}
                      >
                        {r.isSubscribed ? "Eligible" : "Excluded"}
                      </Badge>
                    </div>
                  ))}
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

          <div className="space-y-4 py-3 text-xs">
            <div className="p-3 rounded-lg border border-[#24543D]/25 bg-[#24543D]/5 space-y-1">
              <p className="font-semibold text-[#24543D]">Enforced Safeguards</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>Strict consent verification: opted-out contacts are skipped.</li>
                <li>Personalized one-click unsubscribe links automatically attached.</li>
                <li>Delivery records and provider message IDs recorded.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5DDD0]">
              <div>
                <span className="font-semibold text-foreground block">Simulation Mode</span>
                <span className="text-[11px] text-muted-foreground block">
                  Simulates complete delivery without external email provider calls.
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
              disabled={sendMutation.isPending}
              className="bg-[#24543D] hover:bg-[#1b3f2e] text-white"
            >
              Confirm Dispatch
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
                  <span className="text-muted-foreground block text-[11px]">Status:</span>
                  <span className="font-semibold text-foreground capitalize">{selectedNotifDetails.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Recipient:</span>
                  <span className="font-mono text-foreground">{selectedNotifDetails.recipientEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Message ID:</span>
                  <span className="font-mono text-foreground">{selectedNotifDetails.messageId || "None"}</span>
                </div>
              </div>

              {selectedNotifDetails.error && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
                  <span className="font-semibold block mb-0.5">Failure Reason:</span>
                  <span className="font-mono text-[11px]">{selectedNotifDetails.error}</span>
                </div>
              )}

              {selectedNotifDetails.metadata && Object.keys(selectedNotifDetails.metadata).length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] block">
                    Payload Metadata
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
    </div>
  );
}

