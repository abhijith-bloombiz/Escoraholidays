import React, { useState } from "react";
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

export interface AutomationSettingsData {
  id?: string;
  enableBookingConfirmation: boolean;
  enableItineraryUpdates: boolean;
  enableEnquiryFollowups: boolean;
  enablePostTripFeedback: boolean;
  enablePaymentReceipts: boolean;
  enablePaymentReminders: boolean;
  enablePreTripReminders: boolean;
  enableCancellationNotifications: boolean;
  enableDocumentDelivery: boolean;
  enquiryFollowupDelayHours: number;
  postTripFeedbackDelayHours: number;
}

interface CampaignItem {
  id: number;
  name: string;
  subject: string;
  previewText?: string | null;
  contentHtml: string;
  targetAudience: {
    type: "all_contacts" | "enquiries_only" | "confirmed_guests" | "custom_segment";
    destinations?: string[];
    travelStyle?: string | null;
  };
  status: "draft" | "approved" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";
  scheduledAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
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
    status: "sent" | "simulated" | "accepted" | "delivered" | "bounced" | "failed" | "skipped_unsubscribed" | "complained";
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

const TEMPLATE_PRESETS = [
  {
    name: "Monsoon Sanctuary & Ayurvedic Restoration",
    subject: "The Monsoon Sanctuary: Slow Days and Ayurvedic Rejuvenation in Kerala",
    previewText: "Embrace misty Western Ghats mornings and ancient restorative treatments.",
    html: `<div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
  <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.25em; color: #cbab6e; text-transform: uppercase; margin-bottom: 28px;">Escora Holidays · Slow Sanctuaries</div>
  <h1 style="font-weight: 300; font-size: 28px; line-height: 1.3; color: #1a1410; margin: 0 0 16px 0;">Greetings, {{name}}.</h1>
  <p style="font-size: 16px; line-height: 1.7; color: #4a3d30; margin-bottom: 24px;">
    As the south-west monsoon envelops Kerala in deep emerald and rain-scented breezes, the land enters its traditional season of renewal. In Ayurvedic philosophy, monsoon air opens the pores, creating the most receptive conditions of the year for curative panchakarma and restorative herbal oils.
  </p>
  <div style="background: #f0ece4; border-left: 3px solid #cbab6e; padding: 20px 24px; margin-bottom: 28px;">
    <p style="font-style: italic; font-size: 15px; line-height: 1.6; color: #3a2e22; margin: 0;">
      "Slow travel is not an absence of movement, but an elevation of presence."
    </p>
  </div>
  <p style="font-size: 15px; line-height: 1.7; color: #4a3d30; margin-bottom: 32px;">
    Our private journey designers are curating seven-to-ten day monsoon stays across our heritage sanctuaries in Munnar and Kumarakom, paired with dedicated Ayurvedic consultations and private lakeside dining.
  </p>
  <div style="text-align: center; margin: 36px 0;">
    <a href="https://www.escoraholidays.com/plan" style="background: #1b2e21; color: #f5f2eb; padding: 14px 28px; text-decoration: none; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; display: inline-block; font-weight: 500;">Inquire with a Concierge</a>
  </div>
</div>`,
  },
  {
    name: "Winter Tea Harvest & Cardamom Hills Invitation",
    subject: "Winter in the High Ranges: An Exclusive Invitation to the Cardamom Hills",
    previewText: "Crisp mountain air, handpicked teas, and crackling estate hearths.",
    html: `<div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
  <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.25em; color: #cbab6e; text-transform: uppercase; margin-bottom: 28px;">Escora Holidays · Mountain Retreats</div>
  <h1 style="font-weight: 300; font-size: 28px; line-height: 1.3; color: #1a1410; margin: 0 0 16px 0;">Dear {{name}},</h1>
  <p style="font-size: 16px; line-height: 1.7; color: #4a3d30; margin-bottom: 24px;">
    Winter in Munnar brings dawn mists that gently peel back to reveal sunlit tea valleys, crisp highland breezes, and evenings gathered around heritage fireplaces. We invite you to experience the winter harvest at our private estate partner, Windermere Estate.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #4a3d30; margin-bottom: 32px;">
    Enjoy private naturalist-led birding excursions, tea tastings paired with single-estate artisanal batches, and bespoke dining overlooking the valleys of {{destination}}.
  </p>
  <div style="text-align: center; margin: 36px 0;">
    <a href="https://www.escoraholidays.com/packages" style="background: #1b2e21; color: #f5f2eb; padding: 14px 28px; text-decoration: none; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; display: inline-block;">Discover Signature Journeys</a>
  </div>
</div>`,
  },
  {
    name: "Backwater Houseboat & Heritage Gastronomy",
    subject: "Glide Along Still Waters: Handcrafted Houseboat Journeys in Alleppey",
    previewText: "Private chef dining, starlit canals, and untamed Vembanad tranquility.",
    html: `<div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
  <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.25em; color: #cbab6e; text-transform: uppercase; margin-bottom: 28px;">Escora Holidays · Waterway Sanctuaries</div>
  <h1 style="font-weight: 300; font-size: 28px; line-height: 1.3; color: #1a1410; margin: 0 0 16px 0;">Warm greetings, {{name}}.</h1>
  <p style="font-size: 16px; line-height: 1.7; color: #4a3d30; margin-bottom: 24px;">
    The gentle rhythm of a private kettuvallam gliding through palm-fringed backwaters remains one of the world's most meditative travel experiences. On board Escora's private luxury houseboats, every meal is prepared by your personal chef using heritage coastal recipes.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #4a3d30; margin-bottom: 32px;">
    From tranquil canoe explorations through narrow village canals to candlelit starlit dinners on deck, let us design an unhurried escape tailored just for you.
  </p>
  <div style="text-align: center; margin: 36px 0;">
    <a href="https://www.escoraholidays.com/itineraries" style="background: #1b2e21; color: #f5f2eb; padding: 14px 28px; text-decoration: none; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; display: inline-block;">Explore Sample Itineraries</a>
  </div>
</div>`,
  },
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"campaigns" | "subscribers" | "notifications">("campaigns");
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
  const [liveHtmlPreview, setLiveHtmlPreview] = useState(false);

  // Notification tab filters & inspection state
  const [notifTypeFilter, setNotifTypeFilter] = useState("all");
  const [notifStatusFilter, setNotifStatusFilter] = useState("all");
  const [selectedNotifDetails, setSelectedNotifDetails] = useState<NotificationItem | null>(null);

  // Stage 2: Automation Controls state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<AutomationSettingsData | null>(null);

  // Stage 2: Manual Compose Email state
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

  // Stage 2: Edit Notification state
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    subject: "",
    recipientName: "",
    recipientEmail: "",
    bodyHtml: "",
    notes: "",
  });

  // Stage 2: Email Preview state
  const [previewNotificationId, setPreviewNotificationId] = useState<number | null>(null);

  // Stage 2: Sensitive Action Confirmation states
  const [confirmApproveNotificationId, setConfirmApproveNotificationId] = useState<number | null>(null);
  const [confirmRejectNotificationId, setConfirmRejectNotificationId] = useState<number | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [confirmCancelNotificationId, setConfirmCancelNotificationId] = useState<number | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  // Query automation settings
  const {
    data: automationSettings,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery<AutomationSettingsData>({
    queryKey: ["admin", "automation-settings"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load automation settings");
      return res.json();
    },
  });

  // Query notification preview
  const {
    data: previewData,
    isLoading: notifPreviewLoading,
  } = useQuery<{
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

  // Mutations for Stage 2
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
      queryClient.invalidateQueries({ queryKey: ["admin", "automation-settings"] });
      setSettingsDialogOpen(false);
      toast({ title: "Settings Saved", description: "Automation rules and scheduling delays updated." });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      setComposeDialogOpen(false);
      setComposeFormData({
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
      toast({
        title: vars.queueApproval ? "Queued for Approval" : "Email Dispatched",
        description: vars.queueApproval
          ? "Correspondence queued in pending_approval status for staff review."
          : "Manual correspondence dispatched with complete delivery tracking.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Send Failed", description: err.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      setEditingNotification(null);
      toast({ title: "Notification Updated", description: "Changes saved to the pending record." });
    },
    onError: (err: any) => {
      toast({ title: "Edit Failed", description: err.message, variant: "destructive" });
    },
  });

  const cancelNotificationMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      setConfirmCancelNotificationId(null);
      setCancelReasonInput("");
      toast({ title: "Notification Cancelled", description: "Successfully cancelled scheduled notification." });
    },
    onError: (err: any) => {
      toast({ title: "Cancellation Failed", description: err.message, variant: "destructive" });
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    previewText: "",
    audienceType: "all_contacts" as CampaignItem["targetAudience"]["type"],
    contentHtml: TEMPLATE_PRESETS[0].html,
  });

  // Query campaigns
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

  // Query subscribers
  const {
    data: subscribers = [],
    isLoading: subscribersLoading,
    refetch: refetchSubscribers,
  } = useQuery<SubscriberItem[]>({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/subscribers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load subscribers");
      return res.json();
    },
  });

  // Query transactional and automated notifications
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery<NotificationItem[]>({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load notifications");
      return res.json();
    },
  });

  const retryNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to retry notification");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast({ title: "Notification Re-queued", description: "Scheduled for retry dispatch." });
    },
    onError: (err: any) => {
      toast({ title: "Retry Failed", description: err.message, variant: "destructive" });
    },
  });

  const approveNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve notification");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      setConfirmApproveNotificationId(null);
      toast({ title: "Notification Approved", description: "Queued for automated dispatch." });
    },
    onError: (err: any) => {
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectNotificationMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const res = await fetch(`/api/notifications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject notification");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      setConfirmRejectNotificationId(null);
      setRejectReasonInput("");
      toast({ title: "Notification Rejected", description: "Marked as cancelled." });
    },
    onError: (err: any) => {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    },
  });

  // Query audience preview for selected campaign
  const {
    data: audiencePreview,
    isLoading: previewLoading,
  } = useQuery<AudiencePreviewData>({
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
    enabled: !!selectedCampaignForPreview && previewModalOpen,
  });

  // Mutations
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
          targetAudience: { type: payload.audienceType },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
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
          targetAudience: { type: payload.audienceType },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
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
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete campaign");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast({ title: "Campaign Deleted", description: "Campaign removed." });
    },
    onError: (err: any) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast({
        title: "Staff Approved",
        description: "Campaign marked as approved. Ready for scheduling or delivery.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      setScheduleDialogOpen(false);
      toast({ title: "Campaign Scheduled", description: "Campaign successfully queued." });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      setSendDialogOpen(false);
      toast({
        title: "Dispatch Executed",
        description: `Delivered to ${data.stats.sentCount} recipients (${data.stats.skippedCount} unsubscribed contacts safely skipped).`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Dispatch Failed", description: err.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/campaigns/${id}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast({ title: "Campaign Cancelled", description: "Scheduled dispatch stopped." });
    },
    onError: (err: any) => {
      toast({ title: "Cancellation Failed", description: err.message, variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setFormData({
      name: "",
      subject: TEMPLATE_PRESETS[0].subject,
      previewText: TEMPLATE_PRESETS[0].previewText,
      audienceType: "all_contacts",
      contentHtml: TEMPLATE_PRESETS[0].html,
    });
    setLiveHtmlPreview(false);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (campaign: CampaignItem) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      previewText: campaign.previewText || "",
      audienceType: campaign.targetAudience.type,
      contentHtml: campaign.contentHtml,
    });
    setLiveHtmlPreview(false);
    setCreateDialogOpen(true);
  };

  const insertTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      contentHtml: prev.contentHtml + ` ${tag} `,
    }));
  };

  const selectPreset = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      subject: preset.subject,
      previewText: preset.previewText,
      contentHtml: preset.html,
    }));
  };

  const getStatusBadge = (camp: CampaignItem) => {
    switch (camp.status) {
      case "draft":
        return <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">Draft</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">Staff Approved</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">Scheduled</Badge>;
      case "sending":
        return <Badge variant="outline" className="border-amber-400/50 text-amber-300 animate-pulse">Dispatching</Badge>;
      case "sent": {
        const isSimulated =
          camp.deliveryMode === "simulated" ||
          camp.deliveries?.some(
            (d) => d.deliveryStatus === "simulated" || d.messageId?.startsWith("mock_")
          );
        if (isSimulated) {
          return (
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
              Simulated (Mock)
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Sent (Live)
          </Badge>
        );
      }
      case "cancelled":
        return <Badge variant="outline" className="border-zinc-500/30 text-zinc-400">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{camp.status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif text-foreground tracking-tight">Campaign Automation</h1>
            <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
              Phase 4
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized slow-luxury email journeys with consent safeguards, approval gates, and delivery tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchCampaigns();
              refetchSubscribers();
              refetchNotifications();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreateDialog} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-6">
        <TabsList className="bg-card/60 border border-border">
          <TabsTrigger value="campaigns" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" />
            Consent & Unsubscribe Registry ({subscribers.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Automations & Audit ({notifications.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Campaigns */}
        <TabsContent value="campaigns" className="space-y-6">
          {campaignsLoading ? (
            <div className="p-12 text-center text-muted-foreground font-mono text-sm">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/30">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-medium text-foreground">No Campaigns Created Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-5">
                Create a campaign draft to begin reaching prospective travelers with slow-luxury invitations.
              </p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="p-6 rounded-xl border border-border bg-card/50 hover:border-border/80 transition-colors space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">#{camp.id}</span>
                        <h3 className="text-lg font-semibold text-foreground">{camp.name}</h3>
                        {getStatusBadge(camp)}
                      </div>
                      <p className="text-sm text-muted-foreground font-serif italic">
                        Subject: "{camp.subject}"
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaignForPreview(camp);
                          setPreviewModalOpen(true);
                        }}
                        className="gap-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Audience Preview
                      </Button>

                      {camp.status === "draft" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(camp)}
                            className="gap-1.5 text-xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approveMutation.mutate(camp.id)}
                            disabled={approveMutation.isPending}
                            className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Approve Campaign
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete draft campaign #${camp.id}?`)) {
                                deleteMutation.mutate(camp.id);
                              }
                            }}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}

                      {camp.status === "approved" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaignForSchedule(camp);
                              setScheduleDateTime(
                                new Date(Date.now() + 86400000).toISOString().slice(0, 16)
                              );
                              setScheduleDialogOpen(true);
                            }}
                            className="gap-1.5 text-xs"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Schedule
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaignForSend(camp);
                              setSendMockMode(true);
                              setSendDialogOpen(true);
                            }}
                            className="gap-1.5 text-xs bg-primary text-primary-foreground"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Send Now
                          </Button>
                        </>
                      )}

                      {camp.status === "scheduled" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaignForSend(camp);
                              setSendMockMode(true);
                              setSendDialogOpen(true);
                            }}
                            className="gap-1.5 text-xs bg-primary text-primary-foreground"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Send Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelMutation.mutate(camp.id)}
                            className="gap-1.5 text-xs text-amber-500 border-amber-500/30"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cancel Schedule
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metadata and statistics bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-background/60 border border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Audience Segment</span>
                      <span className="font-medium text-foreground capitalize">
                        {camp.targetAudience.type.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Staff Approval</span>
                      <span className="font-medium text-foreground">
                        {camp.approvedBy ? (
                          <span className="text-emerald-400">Approved by {camp.approvedBy}</span>
                        ) : (
                          <span className="text-amber-400/80">Pending Staff Review</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Delivery Stats</span>
                      <span className="font-mono text-foreground">
                        {camp.status === "sent" ? (
                          <>
                            {camp.deliveryMode === "simulated" ||
                            camp.deliveries?.some(
                              (d) => d.deliveryStatus === "simulated" || d.messageId?.startsWith("mock_")
                            ) ? (
                              <span className="text-cyan-400">{camp.stats.sentCount} simulated (mock)</span>
                            ) : (
                              <span className="text-emerald-400">{camp.stats.sentCount} sent (live)</span>
                            )}{" "}
                            · <span className="text-amber-400">{camp.stats.skippedCount} opted out</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Timestamp</span>
                      <span className="font-mono text-muted-foreground">
                        {camp.sentAt
                          ? `Sent: ${new Date(camp.sentAt).toLocaleDateString()}`
                          : camp.scheduledAt
                            ? `Scheduled: ${new Date(camp.scheduledAt).toLocaleString()}`
                            : `Created: ${new Date(camp.createdAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Subscribers & Consent Registry */}
        <TabsContent value="subscribers" className="space-y-6">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200/90 space-y-1">
              <p className="font-semibold text-emerald-300">
                Automated Consent Verification & One-Click Unsubscribe Registry
              </p>
              <p>
                Every outbound journey email automatically embeds an encrypted one-click unsubscribe token. If a guest opts out, their consent record is immediately marked inactive, and all future campaign dispatches are automatically prevented from contacting their address.
              </p>
            </div>
          </div>

          {subscribersLoading ? (
            <div className="p-12 text-center text-muted-foreground font-mono text-sm">
              Loading subscriber consent registry...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <p className="text-sm text-muted-foreground">
                No subscriber consent records yet. Contacts from enquiries and bookings will populate here automatically.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {subscribers.map((sub) => (
                    <tr key={sub.email} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium text-foreground">{sub.name || "—"}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{sub.email}</td>
                      <td className="py-3 px-4">
                        {sub.subscribed ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 gap-1 bg-emerald-500/10">
                            <UserCheck className="h-3 w-3" /> Subscribed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/30 text-destructive gap-1 bg-destructive/10">
                            <UserX className="h-3 w-3" /> Opted Out ({new Date(sub.unsubscribedAt!).toLocaleDateString()})
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">{sub.source}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground text-[10px] truncate max-w-[120px]">
                        {sub.token.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Transactional & Automated Notifications Audit */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Top Action & Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card/60">
            <div>
              <h2 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Email Automations & Approval Workflows
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect triggered automations, manage approval queues, configure timing rules, and send manual luxury correspondence.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (automationSettings) {
                    setSettingsDraft({ ...automationSettings });
                  }
                  setSettingsDialogOpen(true);
                }}
                className="gap-1.5 text-xs h-8 border-border hover:bg-muted/30"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                Automation Controls
              </Button>
              <Button
                size="sm"
                onClick={() => setComposeDialogOpen(true)}
                className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Mail className="h-3.5 w-3.5" />
                Compose Admin Email
              </Button>
            </div>
          </div>

          {/* Pending Approval Alert Banner */}
          {notifications.filter((n) => n.status === "pending_approval").length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-200">
                    {notifications.filter((n) => n.status === "pending_approval").length} Communication(s) Awaiting Administrator Approval
                  </p>
                  <p className="text-xs text-amber-300/80">
                    High-impact customer notices, personalized proposals, and major changes must be reviewed and approved before delivery.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotifStatusFilter("pending_approval")}
                className="text-xs h-7 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 whitespace-nowrap"
              >
                View Pending Queue
              </Button>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
              <span className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">Total Logged</span>
              <p className="text-2xl font-bold font-serif text-foreground">{notifications.length}</p>
              <span className="text-[10px] text-muted-foreground">All tracked emails</span>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="text-[11px] uppercase font-mono tracking-wider text-amber-400">Needs Approval</span>
              <p className="text-2xl font-bold font-serif text-amber-400">
                {notifications.filter((n) => n.status === "pending_approval").length}
              </p>
              <span className="text-[10px] text-amber-400/70">Awaiting admin review</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
              <span className="text-[11px] uppercase font-mono tracking-wider text-emerald-400">Delivered</span>
              <p className="text-2xl font-bold font-serif text-emerald-400">
                {notifications.filter((n) => n.status === "sent").length}
              </p>
              <span className="text-[10px] text-muted-foreground">Successful dispatches</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
              <span className="text-[11px] uppercase font-mono tracking-wider text-blue-400">Scheduled</span>
              <p className="text-2xl font-bold font-serif text-blue-400">
                {notifications.filter((n) => n.status === "pending" || n.status === "sending").length}
              </p>
              <span className="text-[10px] text-muted-foreground">Pending worker tick</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
              <span className="text-[11px] uppercase font-mono tracking-wider text-destructive">Failed / Retrying</span>
              <p className="text-2xl font-bold font-serif text-destructive">
                {notifications.filter((n) => n.status === "failed").length}
              </p>
              <span className="text-[10px] text-muted-foreground">Safe retry available</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/40">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Automation Type:</span>
                <select
                  value={notifTypeFilter}
                  onChange={(e) => setNotifTypeFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-md bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="booking_confirmation">Booking Confirmation</option>
                  <option value="payment_receipt">Payment Receipt</option>
                  <option value="itinerary_update">Itinerary Update</option>
                  <option value="final_itinerary_delivery">Final Itinerary Delivery</option>
                  <option value="enquiry_followup">Enquiry Follow-Up</option>
                  <option value="post_trip_feedback">Post-Trip Feedback</option>
                  <option value="pre_trip_reminder">Pre-Trip Reminder</option>
                  <option value="payment_deadline_reminder">Payment Deadline Reminder</option>
                  <option value="overdue_payment_followup">Overdue Payment Follow-Up</option>
                  <option value="booking_cancellation">Booking Cancellation</option>
                  <option value="travel_document_delivery">Travel Documents</option>
                  <option value="outstanding_document_reminder">Outstanding Docs Reminder</option>
                  <option value="birthday_anniversary_greeting">Celebration Greeting</option>
                  <option value="major_itinerary_update">Major Itinerary Change</option>
                  <option value="personalized_offer">Personalized Customer Offer</option>
                  <option value="ai_marketing_email">AI Marketing Email (Draft)</option>
                  <option value="exceptional_notice">Exceptional Customer Notice</option>
                  <option value="custom_enquiry_response">Custom Enquiry Reply</option>
                  <option value="quotation_proposal">Quotation & Proposal</option>
                  <option value="custom_itinerary_proposal">Custom Itinerary Proposal</option>
                  <option value="complaint_dispute_response">Complaint / Dispute</option>
                  <option value="refund_compensation_notice">Refund & Compensation</option>
                  <option value="travel_disruption_notice">Travel Disruption Notification</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Delivery Status:</span>
                <select
                  value={notifStatusFilter}
                  onChange={(e) => setNotifStatusFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-md bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="sent">Delivered (Sent)</option>
                  <option value="pending">Scheduled (Pending)</option>
                  <option value="sending">Dispatching</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="skipped">Skipped (Opt-Out)</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              Showing {
                notifications.filter((n) => {
                  if (notifTypeFilter !== "all" && n.type !== notifTypeFilter) return false;
                  if (notifStatusFilter !== "all" && n.status !== notifStatusFilter) return false;
                  return true;
                }).length
              } of {notifications.length} records
            </span>
          </div>

          {/* Notifications Table */}
          {notificationsLoading ? (
            <div className="p-12 text-center text-muted-foreground font-mono text-sm">
              Loading notification audit logs...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/30">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-medium text-foreground">No Automated Notifications Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Transactional automations trigger automatically when bookings are confirmed, itineraries are updated, or trip feedback is due.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card/40">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase font-mono text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Related Entity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Provider Message ID</th>
                    <th className="py-3 px-4">Scheduled / Sent</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {notifications
                    .filter((n) => {
                      if (notifTypeFilter !== "all" && n.type !== notifTypeFilter) return false;
                      if (notifStatusFilter !== "all" && n.status !== notifStatusFilter) return false;
                      return true;
                    })
                    .map((item) => {
                      const renderTypeBadge = () => {
                        switch (item.type) {
                          case "booking_confirmation":
                            return (
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 text-[11px]">
                                <CheckCircle2 className="h-3 w-3" /> Booking Confirmed
                              </Badge>
                            );
                          case "payment_receipt":
                            return (
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 text-[11px]">
                                <CreditCard className="h-3 w-3" /> Payment Receipt
                              </Badge>
                            );
                          case "itinerary_update":
                            return (
                              <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 gap-1 text-[11px]">
                                <RefreshCw className="h-3 w-3" /> Itinerary Update
                              </Badge>
                            );
                          case "final_itinerary_delivery":
                            return (
                              <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-500/10 gap-1 text-[11px]">
                                <FileText className="h-3 w-3" /> Final Itinerary
                              </Badge>
                            );
                          case "enquiry_followup":
                            return (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 gap-1 text-[11px]">
                                <Mail className="h-3 w-3" /> Enquiry Follow-Up
                              </Badge>
                            );
                          case "post_trip_feedback":
                            return (
                              <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/10 gap-1 text-[11px]">
                                <Sparkles className="h-3 w-3" /> Post-Trip Feedback
                              </Badge>
                            );
                          case "pre_trip_reminder":
                            return (
                              <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 gap-1 text-[11px]">
                                <Clock className="h-3 w-3" /> Pre-Trip Reminder
                              </Badge>
                            );
                          case "payment_deadline_reminder":
                          case "overdue_payment_followup":
                            return (
                              <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 gap-1 text-[11px]">
                                <AlertCircle className="h-3 w-3" /> Payment Notice
                              </Badge>
                            );
                          case "booking_cancellation":
                            return (
                              <Badge variant="outline" className="border-zinc-500/40 text-zinc-400 bg-zinc-500/10 gap-1 text-[11px]">
                                <Ban className="h-3 w-3" /> Booking Cancelled
                              </Badge>
                            );
                          case "travel_document_delivery":
                          case "outstanding_document_reminder":
                            return (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 gap-1 text-[11px]">
                                <FileText className="h-3 w-3" /> Travel Docs
                              </Badge>
                            );
                          case "major_itinerary_update":
                          case "personalized_offer":
                            return (
                              <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/10 gap-1 text-[11px]">
                                <ShieldCheck className="h-3 w-3" /> Approval Required
                              </Badge>
                            );
                          case "ai_marketing_email":
                            return (
                              <Badge variant="outline" className="border-violet-500/40 text-violet-400 bg-violet-500/10 gap-1 text-[11px]">
                                <Sparkles className="h-3 w-3" /> AI Marketing Draft
                              </Badge>
                            );
                          case "exceptional_notice":
                            return (
                              <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 gap-1 text-[11px]">
                                <AlertTriangle className="h-3 w-3" /> Exceptional Notice
                              </Badge>
                            );
                          case "custom_enquiry_response":
                            return (
                              <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 gap-1 text-[11px]">
                                <Mail className="h-3 w-3" /> Enquiry Reply
                              </Badge>
                            );
                          case "quotation_proposal":
                            return (
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 text-[11px]">
                                <FileText className="h-3 w-3" /> Quotation Proposal
                              </Badge>
                            );
                          case "custom_itinerary_proposal":
                            return (
                              <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-500/10 gap-1 text-[11px]">
                                <FileText className="h-3 w-3" /> Itinerary Proposal
                              </Badge>
                            );
                          case "complaint_dispute_response":
                            return (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 gap-1 text-[11px]">
                                <ShieldCheck className="h-3 w-3" /> Dispute Resolution
                              </Badge>
                            );
                          case "refund_compensation_notice":
                            return (
                              <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 bg-indigo-500/10 gap-1 text-[11px]">
                                <CreditCard className="h-3 w-3" /> Refund & Compensation
                              </Badge>
                            );
                          case "travel_disruption_notice":
                            return (
                              <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 gap-1 text-[11px]">
                                <AlertTriangle className="h-3 w-3" /> Disruption Notice
                              </Badge>
                            );
                          default:
                            return (
                              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[11px] capitalize">
                                {item.type.replace(/_/g, " ")}
                              </Badge>
                            );
                        }
                      };

                      const renderStatusBadge = () => {
                        switch (item.status) {
                          case "pending_approval":
                            return (
                              <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 text-[11px] gap-1 font-semibold">
                                <AlertCircle className="h-3 w-3 text-amber-400" /> Pending Approval
                              </Badge>
                            );
                          case "sent":
                            return (
                              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px]">
                                Delivered
                              </Badge>
                            );
                          case "pending":
                            return (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[11px]">
                                Scheduled
                              </Badge>
                            );
                          case "sending":
                            return (
                              <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[11px]">
                                Dispatching
                              </Badge>
                            );
                          case "failed":
                            return (
                              <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10 text-[11px]">
                                Failed
                              </Badge>
                            );
                          case "cancelled":
                            return (
                              <Badge variant="outline" className="border-zinc-500/30 text-zinc-400 text-[11px]">
                                Cancelled
                              </Badge>
                            );
                          case "skipped":
                            return (
                              <Badge variant="outline" className="border-zinc-500/30 text-zinc-400 text-[11px]">
                                Skipped (Opt-out)
                              </Badge>
                            );
                          default:
                            return <Badge variant="outline">{item.status}</Badge>;
                        }
                      };

                      return (
                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3.5 px-4">{renderTypeBadge()}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-foreground">{item.recipientName}</div>
                            <div className="text-xs font-mono text-muted-foreground">{item.recipientEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span className="capitalize text-muted-foreground">{item.relatedType}</span> #{item.relatedId}
                          </td>
                          <td className="py-3.5 px-4">{renderStatusBadge()}</td>
                          <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                            {item.messageId || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                            {item.sentAt
                              ? new Date(item.sentAt).toLocaleString()
                              : item.scheduledFor
                              ? `Due: ${new Date(item.scheduledFor).toLocaleString()}`
                              : new Date(item.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview Button for all */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewNotificationId(item.id)}
                                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                title="Preview Email Content"
                              >
                                <Eye className="h-3 w-3" />
                                Preview
                              </Button>

                              {item.status === "pending_approval" && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingNotification(item);
                                      setEditFormData({
                                        subject: item.subject,
                                        recipientName: item.recipientName,
                                        recipientEmail: item.recipientEmail,
                                        bodyHtml: (item.metadata as any)?.bodyHtml || "",
                                        notes: (item.metadata as any)?.notes || "",
                                      });
                                    }}
                                    className="h-7 text-xs gap-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                                    title="Edit Draft Before Approval"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmApproveNotificationId(item.id)}
                                    disabled={approveNotificationMutation.isPending}
                                    className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setConfirmRejectNotificationId(item.id);
                                      setRejectReasonInput("");
                                    }}
                                    disabled={rejectNotificationMutation.isPending}
                                    className="h-7 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {item.status === "pending" && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingNotification(item);
                                      setEditFormData({
                                        subject: item.subject,
                                        recipientName: item.recipientName,
                                        recipientEmail: item.recipientEmail,
                                        bodyHtml: (item.metadata as any)?.bodyHtml || "",
                                        notes: (item.metadata as any)?.notes || "",
                                      });
                                    }}
                                    className="h-7 text-xs gap-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                                    title="Edit Scheduled Notification"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setConfirmCancelNotificationId(item.id);
                                      setCancelReasonInput("");
                                    }}
                                    disabled={cancelNotificationMutation.isPending}
                                    className="h-7 text-xs gap-1 border-zinc-500/40 text-zinc-400 hover:bg-zinc-500/10"
                                  >
                                    <Ban className="h-3 w-3" />
                                    Cancel
                                  </Button>
                                </div>
                              )}

                              {item.status === "failed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => retryNotificationMutation.mutate(item.id)}
                                  disabled={retryNotificationMutation.isPending}
                                  className="h-7 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Retry
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedNotifDetails(item)}
                                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                title="Delivery Audit Record"
                              >
                                <FileText className="h-3 w-3" />
                                Audit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Inspect Notification Details */}
      <Dialog
        open={Boolean(selectedNotifDetails)}
        onOpenChange={(open) => {
          if (!open) setSelectedNotifDetails(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notification Audit #{selectedNotifDetails?.id}
            </DialogTitle>
            <DialogDescription>
              Full delivery metadata and idempotency safeguards.
            </DialogDescription>
          </DialogHeader>

          {selectedNotifDetails && (
            <div className="space-y-4 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-card/60 border border-border">
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Type</span>
                  <span className="font-medium text-foreground capitalize">
                    {selectedNotifDetails.type.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Status</span>
                  <span className="font-medium text-foreground uppercase">{selectedNotifDetails.status}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Recipient</span>
                  <span className="font-medium text-foreground">
                    {selectedNotifDetails.recipientName} &lt;{selectedNotifDetails.recipientEmail}&gt;
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Related Record</span>
                  <span className="font-mono text-foreground capitalize">
                    {selectedNotifDetails.relatedType} #{selectedNotifDetails.relatedId}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Subject Line</span>
                <div className="p-2.5 rounded bg-muted/20 border font-serif text-foreground">
                  {selectedNotifDetails.subject}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Idempotency Key</span>
                <div className="p-2 rounded bg-muted/20 border font-mono text-[11px] text-muted-foreground break-all">
                  {selectedNotifDetails.idempotencyKey}
                </div>
              </div>

              {selectedNotifDetails.messageId && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Provider Message ID</span>
                  <div className="p-2 rounded bg-muted/20 border font-mono text-[11px] text-emerald-400 break-all">
                    {selectedNotifDetails.messageId}
                  </div>
                </div>
              )}

              {selectedNotifDetails.error && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-destructive block">Failure / Reason</span>
                  <div className="p-2.5 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                    {selectedNotifDetails.error}
                  </div>
                </div>
              )}

              {selectedNotifDetails.metadata && Object.keys(selectedNotifDetails.metadata).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Payload Metadata</span>
                  <pre className="p-2.5 rounded bg-muted/30 border font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-36">
                    {JSON.stringify(selectedNotifDetails.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedNotifDetails?.status === "failed" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  retryNotificationMutation.mutate(selectedNotifDetails.id);
                  setSelectedNotifDetails(null);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retry Delivery
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedNotifDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create or Edit Campaign */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingCampaign ? `Edit Campaign #${editingCampaign.id}` : "Create Campaign Draft"}
            </DialogTitle>
            <DialogDescription>
              Design an artisanal email journey. All campaigns require explicit staff approval before dispatch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Campaign Internal Name
                </label>
                <Input
                  placeholder="e.g., Monsoon Sanctuary Invitation 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Audience Segment
                </label>
                <select
                  value={formData.audienceType}
                  onChange={(e) =>
                    setFormData({ ...formData, audienceType: e.target.value as any })
                  }
                  className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all_contacts">All Contacts (Enquiries + Bookings)</option>
                  <option value="enquiries_only">Inquiries Prospects Only</option>
                  <option value="confirmed_guests">Confirmed Journey Guests Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Email Subject Line
              </label>
              <Input
                placeholder="The Monsoon Sanctuary: Slow Days and Ayurvedic Rejuvenation in Kerala"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Preview Text / Preheader
              </label>
              <Input
                placeholder="Brief summary appearing in inbox preview..."
                value={formData.previewText}
                onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
              />
            </div>

            {/* Template Presets Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Starter Slow-Luxury Templates</span>
                <span className="text-[11px] text-muted-foreground font-normal">Click to apply preset</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_PRESETS.map((t) => (
                  <Button
                    key={t.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectPreset(t)}
                    className="text-xs gap-1.5 h-8"
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Merge Tags Quick Insert */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Personalization Merge Tags</span>
                <span className="text-[11px] text-muted-foreground font-normal">Inserts into email HTML</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["{{name}}", "{{email}}", "{{destination}}", "{{year}}", "{{unsubscribeUrl}}"].map(
                  (tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => insertTag(tag)}
                      className="font-mono text-xs h-7 px-2"
                    >
                      {tag}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* HTML Editor vs Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Email Content (HTML)
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLiveHtmlPreview(!liveHtmlPreview)}
                  className="text-xs gap-1.5 h-7"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {liveHtmlPreview ? "Show Code" : "Live Preview"}
                </Button>
              </div>

              {liveHtmlPreview ? (
                <div
                  className="p-6 rounded-lg border border-border bg-white text-zinc-900 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: formData.contentHtml
                      .replace(/\{\{\s*name\s*\}\}/gi, "Lady Eleanor")
                      .replace(/\{\{\s*destination\s*\}\}/gi, "Munnar & Alleppey")
                      .replace(/\{\{\s*unsubscribeUrl\s*\}\}/gi, "#"),
                  }}
                />
              ) : (
                <Textarea
                  rows={12}
                  className="font-mono text-xs leading-relaxed"
                  value={formData.contentHtml}
                  onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!formData.name.trim() || !formData.subject.trim()) {
                  toast({
                    title: "Validation Error",
                    description: "Campaign name and subject line are required.",
                    variant: "destructive",
                  });
                  return;
                }
                if (editingCampaign) {
                  updateMutation.mutate({ id: editingCampaign.id, payload: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCampaign ? "Save Changes" : "Save as Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Audience Preview */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Audience Preview: {selectedCampaignForPreview?.name}
            </DialogTitle>
            <DialogDescription>
              Verified breakdown of eligible recipients and automated opt-out exclusions.
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-sm">
              Calculating audience...
            </div>
          ) : audiencePreview ? (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-lg bg-card border border-border">
                  <span className="text-2xl font-bold font-mono text-foreground block">
                    {audiencePreview.eligibleRecipients}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total In Scope
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-2xl font-bold font-mono text-emerald-400 block">
                    {audiencePreview.activeSubscribers}
                  </span>
                  <span className="text-xs text-emerald-300 uppercase tracking-wider">
                    Active Opt-In
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <span className="text-2xl font-bold font-mono text-destructive block">
                    {audiencePreview.unsubscribedCount}
                  </span>
                  <span className="text-xs text-destructive uppercase tracking-wider">
                    Excluded (Opt-Out)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sample In-Scope Recipients
                </span>
                <div className="rounded-lg border border-border overflow-hidden divide-y divide-border/60 text-xs font-mono">
                  {audiencePreview.sampleRecipients.map((r, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between bg-card/40">
                      <div>
                        <span className="text-foreground font-medium">{r.name}</span>{" "}
                        <span className="text-muted-foreground">({r.email})</span>
                      </div>
                      <div>
                        {r.isSubscribed ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                            Eligible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px]">
                            Excluded
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setPreviewModalOpen(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Schedule Campaign */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule Campaign #{selectedCampaignForSchedule?.id}
            </DialogTitle>
            <DialogDescription>
              Select target date and time for automated campaign dispatch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Target Date & Time
              </label>
              <Input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedCampaignForSchedule || !scheduleDateTime) return;
                scheduleMutation.mutate({
                  id: selectedCampaignForSchedule.id,
                  scheduledAt: new Date(scheduleDateTime).toISOString(),
                });
              }}
              disabled={scheduleMutation.isPending}
            >
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Send Campaign Execution */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Dispatch Campaign #{selectedCampaignForSend?.id}
            </DialogTitle>
            <DialogDescription>
              Confirm delivery dispatch for "{selectedCampaignForSend?.name}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground/80 space-y-1">
              <p className="font-semibold text-primary">Enforced Safeguards</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>Strict consent verification: unsubscribed guests are automatically skipped.</li>
                <li>One-click unsubscribe links are automatically generated per recipient.</li>
                <li>Delivery records and message IDs will be logged for tracking.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div>
                <span className="text-xs font-medium text-foreground block">Simulation / Mock Mode</span>
                <span className="text-[11px] text-muted-foreground block">
                  Simulates complete delivery without external email provider calls.
                </span>
              </div>
              <input
                type="checkbox"
                checked={sendMockMode}
                onChange={(e) => setSendMockMode(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedCampaignForSend) return;
                sendMutation.mutate({
                  id: selectedCampaignForSend.id,
                  mock: sendMockMode,
                });
              }}
              disabled={sendMutation.isPending}
              className="bg-primary text-primary-foreground"
            >
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Automation Settings & Timers */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Automation Rules & Timing Controls
            </DialogTitle>
            <DialogDescription>
              Toggle transactional customer triggers and customize follow-up delay windows across the platform.
            </DialogDescription>
          </DialogHeader>

          {settingsDraft && (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Automated Trigger Toggles
                </h4>
                <div className="space-y-2.5">
                  {[
                    {
                      key: "enableBookingConfirmation" as const,
                      label: "Booking Confirmation Email",
                      desc: "Dispatched upon journey confirmation with booking details and itinerary overview.",
                    },
                    {
                      key: "enablePaymentReceipts" as const,
                      label: "Payment Receipt Email",
                      desc: "Sent automatically when an invoice is marked as paid.",
                    },
                    {
                      key: "enableItineraryUpdates" as const,
                      label: "Itinerary Update & Delivery",
                      desc: "Triggered whenever itinerary days or signature activities are updated.",
                    },
                    {
                      key: "enableEnquiryFollowups" as const,
                      label: "Unanswered Enquiry Follow-Up",
                      desc: "Scheduled for prospective travelers with pending inquiries.",
                    },
                    {
                      key: "enablePostTripFeedback" as const,
                      label: "Post-Trip Feedback Request",
                      desc: "Sent following journey completion to gather guest reviews.",
                    },
                    {
                      key: "enablePaymentReminders" as const,
                      label: "Payment Deadline & Overdue Follow-ups",
                      desc: "Sends gentle advance reminders and overdue payment follow-ups.",
                    },
                    {
                      key: "enablePreTripReminders" as const,
                      label: "Pre-Trip Packing & Sanctuary Reminders",
                      desc: "Dispatched 7 days prior to journey commencement.",
                    },
                    {
                      key: "enableCancellationNotifications" as const,
                      label: "Booking Cancellation Notifications",
                      desc: "Sends formal cancellation summaries and refund tracking.",
                    },
                    {
                      key: "enableDocumentDelivery" as const,
                      label: "Travel Document Delivery",
                      desc: "Delivers flight passes, vouchers, and sanctuary permits to guests.",
                    },
                  ].map((rule) => (
                    <div
                      key={rule.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40"
                    >
                      <div className="pr-4">
                        <span className="text-sm font-medium text-foreground block">{rule.label}</span>
                        <span className="text-xs text-muted-foreground block">{rule.desc}</span>
                      </div>
                      <Switch
                        checked={Boolean(settingsDraft[rule.key])}
                        onCheckedChange={(checked) =>
                          setSettingsDraft({ ...settingsDraft, [rule.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Scheduling Windows & Delays
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 rounded-lg border border-border bg-card/40">
                    <label className="text-xs font-medium text-foreground block">
                      Enquiry Follow-Up Delay (Hours)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      value={settingsDraft.enquiryFollowupDelayHours}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          enquiryFollowupDelayHours: Number(e.target.value) || 24,
                        })
                      }
                    />
                    <span className="text-[11px] text-muted-foreground">Default: 24 hours (1 day)</span>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg border border-border bg-card/40">
                    <label className="text-xs font-medium text-foreground block">
                      Post-Trip Feedback Delay (Hours)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={720}
                      value={settingsDraft.postTripFeedbackDelayHours}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          postTripFeedbackDelayHours: Number(e.target.value) || 48,
                        })
                      }
                    />
                    <span className="text-[11px] text-muted-foreground">Default: 48 hours (2 days)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (settingsDraft) {
                  updateSettingsMutation.mutate(settingsDraft);
                }
              }}
              disabled={updateSettingsMutation.isPending}
              className="bg-primary text-primary-foreground"
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Compose Manual Admin Email */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Compose Administrator Correspondence
            </DialogTitle>
            <DialogDescription>
              Dispatch bespoke official communications to travelers with complete delivery logging.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Communication Category
              </label>
              <select
                value={composeFormData.type}
                onChange={(e) => setComposeFormData({ ...composeFormData, type: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="custom_enquiry_response">Custom Concierge Enquiry Reply</option>
                <option value="quotation_proposal">Formal Quotation & Package Proposal</option>
                <option value="custom_itinerary_proposal">Tailored Itinerary Proposal</option>
                <option value="complaint_dispute_response">Complaint & Dispute Resolution</option>
                <option value="refund_compensation_notice">Refund & Compensation Communication</option>
                <option value="travel_disruption_notice">Travel Disruption & Weather Advisory</option>
                <option value="personalized_offer">Bespoke Guest Offer</option>
                <option value="exceptional_notice">Exceptional Customer Notification</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Guest Name
                </label>
                <Input
                  placeholder="e.g., Lady Eleanor Vance"
                  value={composeFormData.recipientName}
                  onChange={(e) =>
                    setComposeFormData({ ...composeFormData, recipientName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Recipient Email Address
                </label>
                <Input
                  type="email"
                  placeholder="guest@example.com"
                  value={composeFormData.recipientEmail}
                  onChange={(e) =>
                    setComposeFormData({ ...composeFormData, recipientEmail: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Associated Record Type
                </label>
                <select
                  value={composeFormData.relatedType}
                  onChange={(e) =>
                    setComposeFormData({ ...composeFormData, relatedType: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-md bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="enquiry">Enquiry</option>
                  <option value="booking">Booking</option>
                  <option value="itinerary">Itinerary</option>
                  <option value="customer">Customer / Guest</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Associated Record ID / Reference
                </label>
                <Input
                  placeholder="e.g., 104"
                  value={composeFormData.relatedId}
                  onChange={(e) =>
                    setComposeFormData({ ...composeFormData, relatedId: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Email Subject Line
              </label>
              <Input
                placeholder="Regarding Your Escora Holidays Experience..."
                value={composeFormData.title}
                onChange={(e) => setComposeFormData({ ...composeFormData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Message Body
              </label>
              <Textarea
                rows={6}
                placeholder="Enter correspondence message. Formatting and line breaks are preserved with slow-luxury typography..."
                value={composeFormData.bodyHtml}
                onChange={(e) =>
                  setComposeFormData({ ...composeFormData, bodyHtml: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Call-to-Action Label (Optional)
                </label>
                <Input
                  placeholder="e.g., Review Updated Itinerary"
                  value={composeFormData.ctaLabel}
                  onChange={(e) =>
                    setComposeFormData({ ...composeFormData, ctaLabel: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Call-to-Action Link URL (Optional)
                </label>
                <Input
                  placeholder="https://www.escoraholidays.com/itinerary/..."
                  value={composeFormData.ctaUrl}
                  onChange={(e) =>
                    setComposeFormData({ ...composeFormData, ctaUrl: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <div>
                <span className="text-xs font-medium text-foreground block">
                  Require Staff Approval Before Dispatch
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Queues message in Pending Approval status for administrative second-review rather than dispatching right away.
                </span>
              </div>
              <Switch
                checked={composeFormData.queueApproval}
                onCheckedChange={(checked) =>
                  setComposeFormData({ ...composeFormData, queueApproval: checked })
                }
              />
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Audit & Integrity Assurance</p>
              <p>
                All communications record sender username, recipient details, timestamps, and delivery IDs. Real transmissions adhere to safe environment controls.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (
                  !composeFormData.recipientEmail ||
                  !composeFormData.title ||
                  !composeFormData.bodyHtml
                ) {
                  toast({
                    title: "Missing Fields",
                    description: "Please provide a recipient email, subject, and message body.",
                    variant: "destructive",
                  });
                  return;
                }
                sendManualNotificationMutation.mutate(composeFormData);
              }}
              disabled={sendManualNotificationMutation.isPending}
              className="bg-primary text-primary-foreground"
            >
              {composeFormData.queueApproval ? "Queue for Approval" : "Dispatch Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Pending Notification */}
      <Dialog
        open={Boolean(editingNotification)}
        onOpenChange={(open) => {
          if (!open) setEditingNotification(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Notification #{editingNotification?.id}
            </DialogTitle>
            <DialogDescription>
              Refine message content and recipient details before administrative approval or scheduled dispatch.
            </DialogDescription>
          </DialogHeader>

          {editingNotification && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Recipient Name
                  </label>
                  <Input
                    value={editFormData.recipientName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, recipientName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Recipient Email
                  </label>
                  <Input
                    type="email"
                    value={editFormData.recipientEmail}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, recipientEmail: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Subject Line
                </label>
                <Input
                  value={editFormData.subject}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, subject: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Message Content / Body HTML
                </label>
                <Textarea
                  rows={6}
                  value={editFormData.bodyHtml}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, bodyHtml: e.target.value })
                  }
                  placeholder="Custom email content..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Staff Notes / Internal Reference
                </label>
                <Input
                  placeholder="Optional staff notes..."
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNotification(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editingNotification) return;
                editNotificationMutation.mutate({
                  id: editingNotification.id,
                  updates: editFormData,
                });
              }}
              disabled={editNotificationMutation.isPending}
              className="bg-primary text-primary-foreground"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Slow-Luxury Email HTML Preview */}
      <Dialog
        open={Boolean(previewNotificationId)}
        onOpenChange={(open) => {
          if (!open) setPreviewNotificationId(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Email Preview #{previewNotificationId}
              </span>
              {previewData?.status && (
                <Badge variant="outline" className="text-xs uppercase font-mono">
                  {previewData.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {previewData ? (
                <span>
                  Subject: <strong className="text-foreground">{previewData.subject}</strong> · Recipient:{" "}
                  <strong className="text-foreground">{previewData.recipientName}</strong> &lt;{previewData.recipientEmail}&gt;
                </span>
              ) : (
                "Loading luxury preview..."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {notifPreviewLoading ? (
              <div className="p-16 text-center text-muted-foreground font-mono text-sm">
                Rendering slow-luxury email preview...
              </div>
            ) : previewData?.html ? (
              <div className="rounded-lg border border-border overflow-hidden bg-white shadow-inner">
                <iframe
                  srcDoc={previewData.html}
                  className="w-full h-[540px] border-none"
                  title="Slow-Luxury Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                Unable to render email preview.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewNotificationId(null)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Approve Notification */}
      <Dialog
        open={Boolean(confirmApproveNotificationId)}
        onOpenChange={(open) => {
          if (!open) setConfirmApproveNotificationId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Approve Communication #{confirmApproveNotificationId}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this communication? It will be released from approval hold and scheduled for delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-foreground space-y-1 my-3">
            <p className="font-semibold text-emerald-400">Administrative Sign-Off</p>
            <p className="text-muted-foreground">
              Your staff credentials will be recorded as the authorizing administrator. Outbound dispatch respects transactional safety flags.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApproveNotificationId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmApproveNotificationId) {
                  approveNotificationMutation.mutate(confirmApproveNotificationId);
                }
              }}
              disabled={approveNotificationMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Approve & Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Reject Notification */}
      <Dialog
        open={Boolean(confirmRejectNotificationId)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRejectNotificationId(null);
            setRejectReasonInput("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject Notification #{confirmRejectNotificationId}
            </DialogTitle>
            <DialogDescription>
              This notification will be permanently rejected and marked as cancelled. It will never be dispatched.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Rejection Reason (Audit Log)
            </label>
            <Input
              placeholder="e.g., Superseded by new guest itinerary version"
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmRejectNotificationId(null);
                setRejectReasonInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmRejectNotificationId) {
                  rejectNotificationMutation.mutate({
                    id: confirmRejectNotificationId,
                    reason: rejectReasonInput || "Rejected by administrator",
                  });
                }
              }}
              disabled={rejectNotificationMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Cancel Scheduled Notification */}
      <Dialog
        open={Boolean(confirmCancelNotificationId)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCancelNotificationId(null);
            setCancelReasonInput("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2 text-amber-400">
              <Ban className="h-5 w-5 text-amber-400" />
              Cancel Scheduled Notification #{confirmCancelNotificationId}
            </DialogTitle>
            <DialogDescription>
              Prevent this scheduled notification from being processed by background dispatch workers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Cancellation Reason (Audit Log)
            </label>
            <Input
              placeholder="e.g., Guest requested date change"
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmCancelNotificationId(null);
                setCancelReasonInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmCancelNotificationId) {
                  cancelNotificationMutation.mutate({
                    id: confirmCancelNotificationId,
                    reason: cancelReasonInput || "Cancelled by administrator",
                  });
                }
              }}
              disabled={cancelNotificationMutation.isPending}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
