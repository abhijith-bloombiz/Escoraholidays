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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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
    status: "sent" | "failed" | "skipped_unsubscribed";
    sentAt?: string;
    messageId?: string | null;
    error?: string | null;
  }>;
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

  const [activeTab, setActiveTab] = useState<"campaigns" | "subscribers">("campaigns");
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

  const getStatusBadge = (status: CampaignItem["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">Draft</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">Staff Approved</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">Scheduled</Badge>;
      case "sending":
        return <Badge variant="outline" className="border-amber-400/50 text-amber-300 animate-pulse">Dispatching</Badge>;
      case "sent":
        return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Sent</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-zinc-500/30 text-zinc-400">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
                        {getStatusBadge(camp.status)}
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
                            <span className="text-emerald-400">{camp.stats.sentCount} sent</span> ·{" "}
                            <span className="text-amber-400">{camp.stats.skippedCount} opted out</span>
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
      </Tabs>

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
    </div>
  );
}
