import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Send,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RotateCcw,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Sparkles,
  Smartphone,
  Phone,
  Search,
  Check,
  Ban,
  FileText,
  CreditCard,
  NotebookText,
  Calendar,
  Copy,
  ExternalLink,
  Layers,
  Lock,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon,
  HelpCircle,
  Info,
  CheckCircle,
  X,
  Edit,
  Radio,
  User,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export interface WhatsAppMessageItem {
  id: number;
  direction?: "outbound" | "inbound";
  recipientPhone: string;
  recipientName: string;
  messageType: string;
  category: "transactional" | "service_followup" | "administrative" | "marketing";
  trigger: string;
  relatedType: "enquiry" | "order" | "itinerary" | "invoice" | "custom";
  relatedId: number;
  bodyText: string;
  templateName?: string | null;
  templateLanguage?: string | null;
  templateVariables?: Record<string, any> | null;
  provider: "mock" | "cloud_api";
  providerMessageId?: string | null;
  providerStatus?: string | null;
  providerResponse?: Record<string, any> | null;
  status:
    | "pending"
    | "simulated"
    | "sent"
    | "delivered"
    | "read"
    | "failed"
    | "cancelled"
    | "skipped_no_consent"
    | "skipped_opted_out"
    | "skipped_invalid_phone"
    | "skipped_disabled";
  error?: string | null;
  idempotencyKey: string;
  retryCount: number;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppSettingsData {
  id?: string;
  provider: "mock" | "cloud_api";
  providerMode?: "mock" | "cloud_api";
  liveSendingEnabled?: boolean;
  hasApiToken?: boolean;
  hasPhoneNumberId?: boolean;
  hasWebhookSecret?: boolean;
  hasWebhookVerifyToken?: boolean;
  graphApiVersion?: string;
  webhookCallbackUrl?: string;
  enableEnquiryAcknowledgement: boolean;
  enableBookingConfirmation: boolean;
  enableItineraryUpdates: boolean;
  enablePaymentReceipts: boolean;
  enablePaymentReminders: boolean;
  enablePreTripReminders: boolean;
  enablePostTripFeedback: boolean;
  enableEnquiryFollowups: boolean;
  enableDocumentDelivery: boolean;
  simulateAutoDelivery: boolean;
  enquiryFollowupDelayHours: number;
  postTripFeedbackDelayHours: number;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface AutomationRuleItem {
  id: string;
  name: string;
  key: keyof WhatsAppSettingsData;
  description: string;
  triggerEvent: string;
  category: "transactional" | "service_followup" | "administrative";
  templateName: string;
  defaultTiming: string;
  delayKey?: "enquiryFollowupDelayHours" | "postTripFeedbackDelayHours";
  sampleMessage: string;
  condition: string;
}

const AUTOMATION_RULES: AutomationRuleItem[] = [
  {
    id: "enquiry_acknowledgement",
    name: "Enquiry Acknowledgement",
    key: "enableEnquiryAcknowledgement",
    description: "Sends an immediate welcome acknowledgement when a guest submits a new journey enquiry on the website.",
    triggerEvent: "enquiry.created",
    category: "transactional",
    templateName: "escora_enquiry_acknowledgement_v1",
    defaultTiming: "Immediate (within 60 seconds)",
    condition: "Sent to valid phone numbers without active opt-out.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nThank you for inquiring with Escora Holidays. We have received your journey enquiry (Ref: #ENQ-{{id}}).\n\nOur private travel designer is reviewing your preferences to curate an unhurried, slow-luxury itinerary.",
  },
  {
    id: "booking_confirmation",
    name: "Booking Confirmation",
    key: "enableBookingConfirmation",
    description: "Sends journey reservation confirmation and booking reference when an order or trip is confirmed.",
    triggerEvent: "order.confirmed",
    category: "transactional",
    templateName: "escora_booking_confirmation_v1",
    defaultTiming: "Immediate upon booking confirmation",
    condition: "Requires confirmed order and valid traveler phone number.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nWe are delighted to confirm your journey with Escora Holidays (Booking Ref: #ESC-{{id}}).\n\n✨ Journey: Kerala Signature Sanctuary\n👥 Private Chauffeur & Curated Stays",
  },
  {
    id: "itinerary_update",
    name: "Itinerary Revision & Updates",
    key: "enableItineraryUpdates",
    description: "Notifies travelers with a private digital access link whenever their personalized itinerary is revised.",
    triggerEvent: "itinerary.updated",
    category: "transactional",
    templateName: "escora_itinerary_update_v1",
    defaultTiming: "Immediate upon publishing itinerary changes",
    condition: "Requires traveler phone and published itinerary token.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nYour travel curator has updated your personalized travel plan.\n\n✨ Explore your revised itinerary:\nhttps://www.escoraholidays.com/itineraries/share/sample-token",
  },
  {
    id: "payment_receipt",
    name: "Payment Receipts",
    key: "enablePaymentReceipts",
    description: "Sends receipt acknowledgement and remaining balance breakdown when an invoice payment installment is recorded.",
    triggerEvent: "invoice.paid",
    category: "transactional",
    templateName: "escora_payment_receipt_v1",
    defaultTiming: "Immediate upon payment verification",
    condition: "Triggered on full or partial invoice payment.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nWe gratefully acknowledge receipt of your payment for Invoice *#ESC-INV-{{id}}*.\n\n💳 Status: Verified\nThank you for traveling with Escora Holidays.",
  },
  {
    id: "payment_reminder",
    name: "Payment Reminders",
    key: "enablePaymentReminders",
    description: "Sends a gentle reminder to travelers with upcoming balance deadlines or pending invoice milestones.",
    triggerEvent: "invoice.due_reminder",
    category: "transactional",
    templateName: "escora_payment_reminder_v1",
    defaultTiming: "Scheduled 7 days prior to installment due date",
    condition: "Sent only if invoice has an outstanding balance.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nThis is a gentle reminder regarding your upcoming payment milestone for Invoice *#ESC-INV-{{id}}*.\n\nPlease let us know if you need any assistance.",
  },
  {
    id: "pre_trip_reminder",
    name: "Pre-Trip Reminders & Welcome",
    key: "enablePreTripReminders",
    description: "Sends essential packing recommendations, private chauffeur contact, and arrival protocol 3 days before travel.",
    triggerEvent: "trip.pre_departure",
    category: "service_followup",
    templateName: "escora_pre_trip_v1",
    defaultTiming: "3 days prior to departure date",
    condition: "Requires confirmed itinerary and upcoming travel date.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nYour journey with Escora Holidays begins in 3 days! Your private chauffeur details and arrival notes are ready. Have a wonderful trip!",
  },
  {
    id: "post_trip_feedback",
    name: "Post-Trip Feedback & Review",
    key: "enablePostTripFeedback",
    description: "Reaches out after tour completion to ensure traveler satisfaction and collect personal feedback.",
    triggerEvent: "trip.completed",
    category: "service_followup",
    templateName: "escora_post_trip_feedback_v1",
    defaultTiming: "Configurable delay (default: 24h after trip end)",
    delayKey: "postTripFeedbackDelayHours",
    condition: "Sent once per completed trip.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nWelcome home! We hope your journey through Kerala was unforgettable. How was your experience with Escora Holidays?",
  },
  {
    id: "enquiry_followup",
    name: "Enquiry Follow-up Check-in",
    key: "enableEnquiryFollowups",
    description: "Sends a warm concierge follow-up to check if travelers have questions about their custom journey proposal.",
    triggerEvent: "enquiry.followup",
    category: "service_followup",
    templateName: "escora_enquiry_followup_v1",
    defaultTiming: "Configurable delay (default: 48h after enquiry)",
    delayKey: "enquiryFollowupDelayHours",
    condition: "Sent if enquiry remains active without completed booking.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nChecking in from Escora Holidays to see if you have any questions regarding your bespoke holiday proposal. We are happy to tailor every detail.",
  },
  {
    id: "document_delivery",
    name: "Document & Voucher Delivery",
    key: "enableDocumentDelivery",
    description: "Delivers hotel check-in vouchers, houseboat passes, and entry permits directly to the traveler's WhatsApp.",
    triggerEvent: "documents.issued",
    category: "transactional",
    templateName: "escora_document_delivery_v1",
    defaultTiming: "Immediate upon ticket or voucher generation",
    condition: "Requires attached document links and verified guest phone.",
    sampleMessage:
      "Namaste *{{name}}*,\n\nYour travel vouchers and private stay confirmation passes for Kerala are now ready.\n\n✨ Tap here to download your documents securely.",
  },
];

const TEMPLATE_PRESETS = [
  {
    name: "Enquiry Acknowledgement",
    type: "enquiry_acknowledgement",
    category: "transactional" as const,
    templateName: "escora_enquiry_acknowledgement_v1",
    text: `Namaste *{{name}}*,\n\nThank you for inquiring with Escora Holidays. We have received your journey enquiry (Ref: #ENQ-{{id}}).\n\nOur private travel designer is reviewing your preferences to curate an unhurried, slow-luxury itinerary.\n\nIf you have specific preferences or dates, feel free to reply directly to this message.\n\nWarm regards,\nEscora Holidays Concierge`,
  },
  {
    name: "Booking Confirmation",
    type: "booking_confirmation",
    category: "transactional" as const,
    templateName: "escora_booking_confirmation_v1",
    text: `Namaste *{{name}}*,\n\nWe are delighted to confirm your journey with Escora Holidays (Booking Ref: #ESC-{{id}}).\n\n✨ Journey: Kerala Signature Sanctuary\n📅 Travel Dates: Confirmed Season\n👥 Private Chauffeur & Curated Stays\n\nYour finalized day-by-day itinerary is being assembled by your personal curator.\n\nWarm regards,\nEscora Holidays Concierge`,
  },
  {
    name: "Itinerary Revision Link",
    type: "itinerary_update",
    category: "transactional" as const,
    templateName: "escora_itinerary_update_v1",
    text: `Namaste *{{name}}*,\n\nYour travel curator has updated your personalized travel plan.\n\n✨ Explore your revised itinerary:\nhttps://www.escoraholidays.com/itineraries/share/sample-token\n\nWarm regards,\nEscora Holidays Concierge`,
  },
  {
    name: "Payment Receipt",
    type: "payment_receipt",
    category: "transactional" as const,
    templateName: "escora_payment_receipt_v1",
    text: `Namaste *{{name}}*,\n\nWe gratefully acknowledge receipt of your payment for Invoice *#ESC-INV-2026-0001*.\n\n💳 Amount Paid: INR 50,000\n💰 Remaining Balance: INR 0 (Paid in Full)\n\nThank you for traveling with Escora Holidays.\n\nWarm regards,\nEscora Holidays Accounts`,
  },
  {
    name: "Concierge Welcome Note",
    type: "manual_concierge_message",
    category: "administrative" as const,
    templateName: "custom_note",
    text: `Namaste *{{name}}*,\n\nGreetings from Escora Holidays. I am your dedicated travel curator for Kerala. Please let me know if you would like me to arrange private backwater dining or Ayurvedic wellness sessions during your stay.\n\nWarm regards,\nArun · Escora Holidays Concierge`,
  },
  {
    name: "Meta Sandbox (hello_world)",
    type: "hello_world",
    category: "transactional" as const,
    templateName: "hello_world",
    text: "Hello World (Meta pre-approved test template for Cloud API verification)",
  },
];

type WhatsAppView = "overview" | "automations" | "send" | "history" | "settings";

export default function WhatsAppPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Navigation State
  const [activeView, setActiveView] = useState<WhatsAppView>("overview");
  const [settingsActiveTab, setSettingsActiveTab] = useState<string>("connection");

  // History Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect message dialog
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessageItem | null>(null);

  // Edit Automation Rule dialog
  const [editingRule, setEditingRule] = useState<AutomationRuleItem | null>(null);
  const [ruleDelayHours, setRuleDelayHours] = useState<number>(24);
  const [expandedRuleDetailsId, setExpandedRuleDetailsId] = useState<string | null>(null);

  // Send Message Composer state
  const [composerRecipientMode, setComposerRecipientMode] = useState<"enquiry" | "manual">("enquiry");
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>("");
  const [composerPhone, setComposerPhone] = useState<string>("+91 98765 43210");
  const [composerName, setComposerName] = useState<string>("Dr. Ananya Menon");
  const [composerPresetIdx, setComposerPresetIdx] = useState<number>(0);
  const [composerText, setComposerText] = useState<string>(TEMPLATE_PRESETS[0].text);
  const [lastSentSuccess, setLastSentSuccess] = useState<any | null>(null);

  // Consent lookup state
  const [consentPhoneInput, setConsentPhoneInput] = useState<string>("");
  const [consentResult, setConsentResult] = useState<any | null>(null);
  const [consentLoading, setConsentLoading] = useState<boolean>(false);

  // Query message list
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<WhatsAppMessageItem[]>({
    queryKey: ["admin", "whatsapp-messages", statusFilter, directionFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (directionFilter !== "all") params.append("direction", directionFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("limit", "200");

      const res = await fetch(`/api/whatsapp/messages?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load WhatsApp messages");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Query WhatsApp automation settings
  const {
    data: settings,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery<WhatsAppSettingsData>({
    queryKey: ["admin", "whatsapp-settings"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load WhatsApp settings");
      return res.json();
    },
  });

  // Query recent enquiries for recipient picker
  const { data: enquiries = [] } = useQuery<any[]>({
    queryKey: ["admin", "enquiries-select"],
    queryFn: async () => {
      const res = await fetch("/api/enquiries?limit=40", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.enquiries || [];
    },
  });

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updated: Partial<WhatsAppSettingsData>) => {
      const res = await fetch("/api/whatsapp/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-settings"] });
      toast({
        title: "Settings Saved",
        description: "WhatsApp preferences and automation rules have been updated.",
      });
      setEditingRule(null);
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/whatsapp/messages/${id}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Retry failed");
      }
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-messages"] });
      toast({
        title: "Message Retried",
        description: `Message #${updated.id} re-dispatched. Status: ${updated.status}`,
      });
      if (selectedMessage && selectedMessage.id === updated.id) {
        setSelectedMessage(updated);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Retry Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Dispatch / Send message mutation
  const dispatchMessageMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Message dispatch failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-messages"] });
      setLastSentSuccess(data.message);
      toast({
        title: "WhatsApp Message Dispatched",
        description: `Routed to ${data.message.recipientPhone} via ${data.message.provider} provider.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Dispatch Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Consent lookup handler
  async function handleLookupConsent(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!consentPhoneInput.trim()) return;

    setConsentLoading(true);
    try {
      const cleanPhone = encodeURIComponent(consentPhoneInput.trim());
      const res = await fetch(`/api/whatsapp/consent/${cleanPhone}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Consent lookup failed");
      }
      const data = await res.json();
      setConsentResult(data);
    } catch (err: any) {
      toast({
        title: "Lookup Failed",
        description: err.message,
        variant: "destructive",
      });
      setConsentResult(null);
    } finally {
      setConsentLoading(false);
    }
  }

  // Consent toggle mutation
  const toggleConsentMutation = useMutation({
    mutationFn: async (payload: { phone: string; transactionalOptOut?: boolean; marketingConsent?: boolean }) => {
      const res = await fetch("/api/whatsapp/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update consent");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Consent Preferences Updated",
        description: `Updated WhatsApp consent for ${data.consent.phone}`,
      });
      handleLookupConsent();
    },
    onError: (err: any) => {
      toast({
        title: "Consent Update Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleSelectPreset(idx: number) {
    setComposerPresetIdx(idx);
    const preset = TEMPLATE_PRESETS[idx];
    const customized = preset.text
      .replace(/\{\{name\}\}/g, composerName || "Guest")
      .replace(/\{\{id\}\}/g, "104");
    setComposerText(customized);
  }

  function handleSelectEnquiry(enquiryIdStr: string) {
    setSelectedEnquiryId(enquiryIdStr);
    const enq = enquiries.find((e) => String(e.id) === enquiryIdStr);
    if (enq) {
      const name = enq.name || enq.guestName || "Guest";
      const phone = enq.phone || enq.guestPhone || "";
      setComposerName(name);
      if (phone) setComposerPhone(phone);
      setComposerText(
        TEMPLATE_PRESETS[composerPresetIdx].text
          .replace(/\{\{name\}\}/g, name)
          .replace(/\{\{id\}\}/g, String(enq.id))
      );
    }
  }

  function handleSendComposerMessage() {
    if (!composerPhone.trim() || !composerName.trim() || !composerText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a valid recipient phone number, guest name, and message text.",
        variant: "destructive",
      });
      return;
    }

    const preset = TEMPLATE_PRESETS[composerPresetIdx];
    dispatchMessageMutation.mutate({
      recipientPhone: composerPhone,
      recipientName: composerName,
      messageType: preset ? preset.type : "manual_concierge_message",
      category: preset ? preset.category : "transactional",
      bodyText: composerText,
      templateName: preset?.templateName || "custom_note",
      relatedType: selectedEnquiryId ? "enquiry" : "custom",
      relatedId: selectedEnquiryId ? Number(selectedEnquiryId) : 0,
    });
  }

  // Active automations count
  const activeAutomationsCount = useMemo(() => {
    if (!settings) return 0;
    return AUTOMATION_RULES.filter((rule) => Boolean(settings[rule.key])).length;
  }, [settings]);

  const isCloudApi = settings?.providerMode === "cloud_api";
  const isLiveSending = settings?.liveSendingEnabled === true;

  // Filtered messages list
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (statusFilter !== "all") {
        if (statusFilter === "delivered" && msg.status !== "delivered" && msg.status !== "read") return false;
        if (statusFilter === "sent" && msg.status !== "sent") return false;
        if (statusFilter === "simulated" && msg.status !== "simulated") return false;
        if (statusFilter === "blocked" && !msg.status.startsWith("skipped_")) return false;
        if (statusFilter === "failed" && msg.status !== "failed" && msg.status !== "cancelled") return false;
      }
      if (directionFilter !== "all" && msg.direction !== directionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          msg.recipientName.toLowerCase().includes(q) ||
          msg.recipientPhone.toLowerCase().includes(q) ||
          msg.bodyText.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, statusFilter, directionFilter, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* ============================================================
          VIEW 1: TASK-BASED MAIN LANDING PAGE (Clean & Simplified)
      ============================================================ */}
      {activeView === "overview" && (
        <div className="space-y-8">
          {/* Main Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-6">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight">
                WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-sans">
                Manage customer messages and automatic updates.
              </p>
            </div>

            {/* Compact Connection / Mode Indicator & Refresh */}
            <div className="flex items-center gap-3">
              {isCloudApi ? (
                isLiveSending ? (
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 px-3 py-1 text-xs flex items-center gap-2 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud API Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 px-3 py-1 text-xs flex items-center gap-2 font-medium">
                    <Lock className="h-3 w-3" />
                    Cloud API (Safety Locked)
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="bg-[#FAF7F1] dark:bg-zinc-800 text-[#24543D] dark:text-emerald-400 border-[#E5DDD0] px-3 py-1 text-xs flex items-center gap-2 font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#24543D] animate-pulse" />
                  Simulation Mode (Testing)
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchMessages();
                  refetchSettings();
                  toast({ title: "Refreshed", description: "WhatsApp records updated." });
                }}
                disabled={messagesLoading || settingsLoading}
                className="text-xs h-8 border-[#E5DDD0] text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${messagesLoading || settingsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Two Prominent Primary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Automatic Messages */}
            <div className="p-7 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card shadow-xs hover:border-[#24543D]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-[#24543D]/10 text-[#24543D] flex items-center justify-center font-bold">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-serif font-semibold text-foreground">
                      Automatic Messages
                    </h2>
                    <span className="text-xs font-sans text-muted-foreground bg-[#FAF7F1] px-2.5 py-1 rounded-full border border-[#E5DDD0]">
                      {activeAutomationsCount} of {AUTOMATION_RULES.length} active
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-sans leading-relaxed">
                    Manage messages sent automatically when customers enquire, book, pay, or reach other supported milestones.
                  </p>
                </div>
              </div>

              <div>
                <Button
                  onClick={() => setActiveView("automations")}
                  className="w-full bg-[#24543D] hover:bg-[#1b3f2e] text-white font-medium text-sm h-11 rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  Manage Automatic Messages
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 2. Send Message */}
            <div className="p-7 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card shadow-xs hover:border-[#24543D]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-[#24543D]/10 text-[#24543D] flex items-center justify-center font-bold">
                  <Send className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-serif font-semibold text-foreground">
                      Send Message
                    </h2>
                    <span className="text-xs font-sans text-muted-foreground bg-[#FAF7F1] px-2.5 py-1 rounded-full border border-[#E5DDD0]">
                      Individual message
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-sans leading-relaxed">
                    Compose and send an individual WhatsApp message to a customer or guest with approved templates.
                  </p>
                </div>
              </div>

              <div>
                <Button
                  onClick={() => {
                    setLastSentSuccess(null);
                    setActiveView("send");
                  }}
                  className="w-full bg-[#24543D] hover:bg-[#1b3f2e] text-white font-medium text-sm h-11 rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  Send Message
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Two Simple Secondary Navigation Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Secondary 1: Message History */}
            <div
              onClick={() => setActiveView("history")}
              className="p-5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card hover:border-[#24543D]/40 hover:bg-[#FAF7F1]/60 dark:hover:bg-zinc-800/40 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center group-hover:bg-[#24543D]/10 group-hover:text-[#24543D] transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-[#24543D] transition-colors">
                    Message History
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View sent and received messages, delivery results, and carrier confirmations.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {messages.length} messages
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#24543D] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Secondary 2: Settings */}
            <div
              onClick={() => setActiveView("settings")}
              className="p-5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card hover:border-[#24543D]/40 hover:bg-[#FAF7F1]/60 dark:hover:bg-zinc-800/40 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center group-hover:bg-[#24543D]/10 group-hover:text-[#24543D] transition-colors">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-[#24543D] transition-colors">
                    Settings & Testing
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage connection, approved templates, customer consent, and testing simulator.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {isCloudApi ? "Cloud API" : "Simulation"}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#24543D] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 2: AUTOMATIC MESSAGES (Dedicated Clean Management)
      ============================================================ */}
      {activeView === "automations" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("overview")}
              className="text-xs font-sans text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to WhatsApp
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight">
                  Automatic Messages
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  Manage messages sent automatically when customers enquire, book, pay, or reach milestones.
                </p>
              </div>
              <span className="text-xs font-sans text-muted-foreground bg-[#FAF7F1] px-3 py-1.5 rounded-full border border-[#E5DDD0] self-start md:self-auto">
                {activeAutomationsCount} of {AUTOMATION_RULES.length} rules active
              </span>
            </div>
          </div>

          {/* Clean Rules List */}
          <div className="space-y-4">
            {AUTOMATION_RULES.map((rule) => {
              const isEnabled = settings ? Boolean(settings[rule.key]) : false;
              const isExpanded = expandedRuleDetailsId === rule.id;

              return (
                <div
                  key={rule.id}
                  className="p-5 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card shadow-2xs hover:border-[#24543D]/30 transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-semibold text-foreground">
                          {rule.name}
                        </h2>
                        {isEnabled ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[11px] font-medium">
                            <Check className="h-3 w-3 mr-1" /> On
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-300 text-[11px] font-medium">
                            Off
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground font-sans hidden sm:inline">
                          • {rule.defaultTiming}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                        {rule.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule);
                          if (rule.delayKey && settings) {
                            setRuleDelayHours((settings as any)[rule.delayKey] || 24);
                          }
                        }}
                        className="text-xs h-8 border-[#E5DDD0] text-foreground hover:bg-[#FAF7F1] gap-1"
                      >
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        Edit
                      </Button>

                      <div className="flex items-center gap-2 pl-2 border-l border-[#E5DDD0]">
                        <span className="text-xs text-muted-foreground font-medium">
                          {isEnabled ? "Active" : "Disabled"}
                        </span>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            updateSettingsMutation.mutate({ [rule.key]: checked })
                          }
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Toggle Advanced Details link */}
                  <div className="pt-2 border-t border-[#E5DDD0]/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setExpandedRuleDetailsId(isExpanded ? null : rule.id)}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium text-[11px]"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isExpanded ? "Hide Details" : "View Settings & Timing"}
                    </button>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Event: {rule.triggerEvent}
                    </span>
                  </div>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div className="p-4 rounded-xl bg-[#FAF7F1] dark:bg-zinc-900 border border-[#E5DDD0] text-xs space-y-3 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Trigger Condition
                          </span>
                          <span className="text-foreground text-[11px] font-sans">
                            {rule.condition}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Meta WhatsApp Template
                          </span>
                          <span className="font-mono text-foreground text-[11px]">
                            {rule.templateName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Category / Policy
                          </span>
                          <span className="text-foreground text-[11px] capitalize">
                            {rule.category.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                          Standard Message Template
                        </span>
                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-[#E5DDD0] text-[11px] font-sans text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                          {rule.sampleMessage.replace(/\\n/g, "\n")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 3: SEND MESSAGE (Simple Guided Composer)
      ============================================================ */}
      {activeView === "send" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("overview")}
              className="text-xs font-sans text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to WhatsApp
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight">
                  Send WhatsApp Message
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  Compose and dispatch an individual customer message.
                </p>
              </div>

              {/* Delivery Channel Indicator */}
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#24543D]" />
                <span>
                  {isCloudApi && isLiveSending
                    ? "Live Cloud API Sending Active"
                    : "Safe Simulation Mode (Zero-Charge Testing)"}
                </span>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {lastSentSuccess && (
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-sm block">
                    Message Dispatched Successfully!
                  </span>
                  <span>
                    Sent to <strong>{lastSentSuccess.recipientName}</strong> ({lastSentSuccess.recipientPhone}). Status:{" "}
                    <span className="uppercase font-mono">{lastSentSuccess.status}</span>.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLastSentSuccess(null)}
                  className="text-xs h-8 border-emerald-300 hover:bg-emerald-100"
                >
                  Send Another
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveView("history")}
                  className="text-xs h-8 bg-[#24543D] hover:bg-[#1b3f2e] text-white"
                >
                  View in History
                </Button>
              </div>
            </div>
          )}

          {/* Guided 3-Step Composer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form Steps (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Select Recipient */}
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#24543D] text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <h2 className="text-base font-semibold text-foreground">
                      Recipient Information
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setComposerRecipientMode("enquiry")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        composerRecipientMode === "enquiry"
                          ? "bg-[#24543D] text-white font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Recent Enquiries
                    </button>
                    <button
                      onClick={() => setComposerRecipientMode("manual")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        composerRecipientMode === "manual"
                          ? "bg-[#24543D] text-white font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Enter Phone
                    </button>
                  </div>
                </div>

                {composerRecipientMode === "enquiry" ? (
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-foreground block">
                      Select Customer / Enquiry
                    </label>
                    <Select value={selectedEnquiryId} onValueChange={handleSelectEnquiry}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="Choose a recent enquiry..." />
                      </SelectTrigger>
                      <SelectContent>
                        {enquiries.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No recent enquiries found
                          </SelectItem>
                        ) : (
                          enquiries.map((enq) => (
                            <SelectItem key={enq.id} value={String(enq.id)} className="text-xs">
                              #{enq.id} — {enq.name || enq.guestName} ({enq.phone || enq.guestPhone || "No phone"})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Customer Name
                    </label>
                    <Input
                      value={composerName}
                      onChange={(e) => {
                        setComposerName(e.target.value);
                        setComposerText(
                          TEMPLATE_PRESETS[composerPresetIdx].text
                            .replace(/\{\{name\}\}/g, e.target.value || "Guest")
                            .replace(/\{\{id\}\}/g, selectedEnquiryId || "104")
                        );
                      }}
                      placeholder="e.g. Dr. Ananya Menon"
                      className="text-xs bg-background h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      WhatsApp Phone Number
                    </label>
                    <Input
                      value={composerPhone}
                      onChange={(e) => setComposerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="text-xs bg-background h-9 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Choose Template or Message */}
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#24543D] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-base font-semibold text-foreground">
                    Message Content & Template
                  </h2>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Choose Approved Template
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TEMPLATE_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.name}
                        onClick={() => handleSelectPreset(idx)}
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                          composerPresetIdx === idx
                            ? "border-[#24543D] bg-[#24543D]/5 text-[#24543D] font-medium"
                            : "border-[#E5DDD0] bg-background hover:bg-muted/40 text-foreground"
                        }`}
                      >
                        <div className="truncate">{preset.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                          {preset.templateName || "custom"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-foreground">
                      Message Text (Review and Customize)
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Dynamic variables auto-filled
                    </span>
                  </div>
                  <Textarea
                    rows={8}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    className="text-xs font-sans leading-relaxed bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Preview & Confirm (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-4 shadow-2xs sticky top-8">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#24543D] text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <h2 className="text-base font-semibold text-foreground">
                    Recipient & Message Preview
                  </h2>
                </div>

                {/* WhatsApp Chat Preview Bubble */}
                <div className="p-4 rounded-xl bg-[#EFEAE2] dark:bg-zinc-900 border border-[#E5DDD0] space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#E5DDD0]/60 pb-2">
                    <div className="h-8 w-8 rounded-full bg-[#24543D] text-white flex items-center justify-center font-bold text-xs">
                      EH
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                        Escora Concierge
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 fill-emerald-600 text-white" />
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        To: {composerName || "Guest"} ({composerPhone || "—"})
                      </div>
                    </div>
                  </div>

                  {/* Speech Bubble */}
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg rounded-tl-none shadow-xs border border-zinc-200/60 dark:border-zinc-700 text-xs text-foreground/90 font-sans leading-relaxed whitespace-pre-wrap">
                    {composerText || "Enter message text to preview..."}
                    <div className="text-right text-[10px] text-muted-foreground mt-2">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                {/* Consent & Policy Note */}
                <div className="p-3 rounded-lg bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 text-[#24543D] flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    Transactional messages will be delivered directly. If the recipient has previously opted out with STOP, the message will be safeguarded automatically.
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSendComposerMessage}
                    disabled={dispatchMessageMutation.isPending || !composerPhone.trim()}
                    className="w-full bg-[#24543D] hover:bg-[#1b3f2e] text-white font-medium text-sm h-11 rounded-xl shadow-xs flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {dispatchMessageMutation.isPending ? "Sending..." : "Confirm & Send Message"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 4: MESSAGE HISTORY (Clean, Readable Table & Details)
      ============================================================ */}
      {activeView === "history" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("overview")}
              className="text-xs font-sans text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to WhatsApp
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight">
                  Message History
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  View sent and received customer messages, delivery results, and carrier confirmations.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setLastSentSuccess(null);
                  setActiveView("send");
                }}
                className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-8 gap-1.5 self-start md:self-auto"
              >
                <Send className="h-3.5 w-3.5" />
                Compose Message
              </Button>
            </div>
          </div>

          {/* Compact Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5DDD0] bg-white dark:bg-card">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered & Read</SelectItem>
                    <SelectItem value="sent">Sent (Awaiting Carrier)</SelectItem>
                    <SelectItem value="simulated">Simulated</SelectItem>
                    <SelectItem value="blocked">Blocked (Safeguards)</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Flow: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flows</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search customer or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMessages()}
                disabled={messagesLoading}
                className="h-8 px-2.5 border-[#E5DDD0] text-muted-foreground hover:text-foreground"
                title="Refresh Messages"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Clean History Table */}
          <div className="rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F1] dark:bg-zinc-800/60 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-[#E5DDD0]">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DDD0]/60">
                  {messagesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        Loading message records...
                      </td>
                    </tr>
                  ) : filteredMessages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="font-medium text-foreground text-sm">No WhatsApp messages found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try adjusting your status or search filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMessages.map((msg) => {
                      return (
                        <tr key={msg.id} className="hover:bg-[#FAF7F1]/60 dark:hover:bg-zinc-800/30 transition-colors">
                          {/* Customer */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-foreground">{msg.recipientName}</div>
                            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                              {msg.recipientPhone}
                            </div>
                          </td>

                          {/* Message snippet */}
                          <td className="py-3 px-4 max-w-xs">
                            <span className="text-[11px] font-medium text-foreground/80 capitalize block truncate">
                              {msg.messageType.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block font-sans">
                              {msg.bodyText.replace(/\n/g, " ").slice(0, 70)}...
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                            {new Date(msg.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            •{" "}
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <CleanStatusBadge status={msg.status} direction={msg.direction} />
                          </td>

                          {/* Channel / Mode */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {msg.provider === "cloud_api" ? (
                              <span className="text-[10px] font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200">
                                Cloud API
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-[#24543D] dark:text-emerald-400 bg-[#FAF7F1] dark:bg-zinc-800 px-2 py-0.5 rounded border border-[#E5DDD0]">
                                Simulated
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMessage(msg)}
                              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>

                            {["failed", "cancelled", "skipped_no_consent", "skipped_disabled"].includes(msg.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => retryMutation.mutate(msg.id)}
                                disabled={retryMutation.isPending}
                                className="h-7 px-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 5: SETTINGS & TESTING (Dedicated Screen)
      ============================================================ */}
      {activeView === "settings" && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("overview")}
              className="text-xs font-sans text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to WhatsApp
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-5">
              <div>
                <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight">
                  WhatsApp Settings & Testing
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  Manage connection mode, templates, consent safeguards, and testing tools.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchSettings();
                    toast({ title: "Settings Refreshed", description: "WhatsApp configuration reloaded." });
                  }}
                  className="h-8 text-xs border-[#E5DDD0]"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Reload
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Tabs */}
          <Tabs value={settingsActiveTab} onValueChange={setSettingsActiveTab} className="space-y-6">
            <TabsList className="bg-[#FAF7F1] dark:bg-zinc-800 p-1 border border-[#E5DDD0] rounded-xl">
              <TabsTrigger value="connection" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#24543D] data-[state=active]:shadow-xs rounded-lg">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                Connection & Mode
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#24543D] data-[state=active]:shadow-xs rounded-lg">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Message Templates
              </TabsTrigger>
              <TabsTrigger value="consent" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#24543D] data-[state=active]:shadow-xs rounded-lg">
                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                Consent & Safeguards
              </TabsTrigger>
              <TabsTrigger value="simulator" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#24543D] data-[state=active]:shadow-xs rounded-lg">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Testing & Simulator
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#24543D] data-[state=active]:shadow-xs rounded-lg">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Advanced Details
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Connection & Mode */}
            <TabsContent value="connection" className="space-y-6">
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    WhatsApp Cloud API Connection
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure official Meta WhatsApp Cloud API credentials and live sending mode.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Active Mode
                    </span>
                    <span className="text-sm font-semibold text-foreground block">
                      {isCloudApi ? "Meta Cloud API" : "Mock Simulation Mode"}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {isCloudApi ? "Official Meta Business API configured." : "Running local zero-cost simulation."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Live Sending Lock
                    </span>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isLiveSending ? "text-emerald-700" : "text-amber-700"}`}>
                        {isLiveSending ? "Live Sending Enabled" : "Safety Locked (Test Mode)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {isLiveSending ? "Outbound messages are delivered to actual phones." : "Outbound messages are held in simulation."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      API Credentials Status
                    </span>
                    <span className="text-sm font-semibold text-foreground block">
                      {settings?.hasApiToken && settings?.hasPhoneNumberId ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Configured
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> Missing Token
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      v{settings?.graphApiVersion || "v21.0"}
                    </p>
                  </div>
                </div>

                {/* Webhook Endpoint */}
                <div className="p-4 rounded-xl bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Meta Webhook Callback URL
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(settings?.webhookCallbackUrl || "");
                        toast({ title: "Copied", description: "Webhook URL copied to clipboard." });
                      }}
                      className="text-xs h-7 border-[#E5DDD0]"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                  <code className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-[#E5DDD0] text-xs font-mono text-foreground block break-all">
                    {settings?.webhookCallbackUrl || "/api/whatsapp/webhook"}
                  </code>
                  <p className="text-[11px] text-muted-foreground">
                    Register this URL in Meta Developer App &gt; WhatsApp &gt; Configuration &gt; Webhooks for inbound delivery receipts.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Message Templates */}
            <TabsContent value="templates" className="space-y-4">
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Approved WhatsApp Message Templates
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pre-approved Meta WhatsApp templates used for transactional notifications and guest service.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TEMPLATE_PRESETS.map((tmpl) => (
                    <div key={tmpl.name} className="p-4 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1] dark:bg-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{tmpl.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize bg-white dark:bg-zinc-900">
                          {tmpl.category}
                        </Badge>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {tmpl.templateName}
                      </div>
                      <p className="text-xs text-foreground/80 font-sans leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-[#E5DDD0]">
                        {tmpl.text.replace(/\\n/g, "\n")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Consent & Safeguards */}
            <TabsContent value="consent" className="space-y-6">
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Customer Consent & DPDP Safeguards
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inspect and enforce customer WhatsApp messaging preferences.
                  </p>
                </div>

                {/* Policy Notice */}
                <div className="p-4 rounded-xl bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#24543D]">
                    <ShieldCheck className="h-4 w-4" />
                    Escora Holidays WhatsApp Standard
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                    <li><strong>Transactional Messages:</strong> Sent to customers who submitted an enquiry or booking, provided they have not opted out.</li>
                    <li><strong>Marketing Messages:</strong> Strictly require explicit opt-in. Inquiries do not constitute broadcast consent.</li>
                    <li><strong>Immediate Opt-Out:</strong> If a customer replies with "STOP", all automated dispatches are blocked immediately.</li>
                  </ul>
                </div>

                {/* Consent Phone Lookup */}
                <div className="p-4 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1] dark:bg-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold text-foreground">
                    Inspect Phone Consent Record
                  </h3>
                  <form onSubmit={handleLookupConsent} className="flex gap-2 max-w-md">
                    <Input
                      placeholder="Enter customer phone (e.g. +91 98765 43210)"
                      value={consentPhoneInput}
                      onChange={(e) => setConsentPhoneInput(e.target.value)}
                      className="text-xs bg-white dark:bg-zinc-900"
                    />
                    <Button type="submit" disabled={consentLoading} className="text-xs bg-[#24543D] hover:bg-[#1b3f2e] text-white">
                      {consentLoading ? "Checking..." : "Inspect"}
                    </Button>
                  </form>

                  {consentResult && (
                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5DDD0] space-y-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {consentResult.phone}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {consentResult.hasExplicitRecord ? "Durable DB Record" : "Default Policies"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-lg border border-[#E5DDD0] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-foreground">Transactional Opt-Out</div>
                            <div className="text-[11px] text-muted-foreground">Block all automated updates</div>
                          </div>
                          <Switch
                            checked={consentResult.transactionalOptOut}
                            onCheckedChange={(checked) =>
                              toggleConsentMutation.mutate({
                                phone: consentResult.phone,
                                transactionalOptOut: checked,
                              })
                            }
                          />
                        </div>

                        <div className="p-3 rounded-lg border border-[#E5DDD0] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-foreground">Marketing Consent</div>
                            <div className="text-[11px] text-muted-foreground">Opt-in for travel offers</div>
                          </div>
                          <Switch
                            checked={consentResult.marketingConsent}
                            onCheckedChange={(checked) =>
                              toggleConsentMutation.mutate({
                                phone: consentResult.phone,
                                marketingConsent: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Testing & Simulator */}
            <TabsContent value="simulator" className="space-y-6">
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    WhatsApp Message Simulator & Auto-Delivery
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Test dispatch workflows without incurring WhatsApp carrier charges.
                  </p>
                </div>

                {/* Auto-delivery simulation toggle */}
                <div className="p-4 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1] dark:bg-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Simulate Auto-Delivery & Read Receipts
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      In simulation mode, automatically progresses test messages from Sent &rarr; Delivered &rarr; Read.
                    </p>
                  </div>
                  <Switch
                    checked={settings?.simulateAutoDelivery ?? true}
                    onCheckedChange={(val) => updateSettingsMutation.mutate({ simulateAutoDelivery: val })}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setLastSentSuccess(null);
                      setActiveView("send");
                    }}
                    className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-9"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Open Message Composer
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: Advanced Details */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="p-6 rounded-2xl border border-[#E5DDD0] bg-white dark:bg-card space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Advanced Delivery & Security Safeguards
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Internal technical parameters and idempotency guarantees.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1] dark:bg-zinc-800">
                    <span className="font-semibold block text-foreground mb-0.5">
                      1. Idempotency Key Guard
                    </span>
                    <span className="text-muted-foreground leading-relaxed">
                      Every dispatched message receives a deterministic idempotency key. Duplicate webhooks or repeated button clicks never trigger duplicate WhatsApp carrier charges.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1] dark:bg-zinc-800">
                    <span className="font-semibold block text-foreground mb-0.5">
                      2. E.164 Phone Normalization
                    </span>
                    <span className="text-muted-foreground leading-relaxed">
                      All phone numbers are validated against international E.164 specifications (+91 Indian format with 10 digits). Invalid numbers are safely flagged as skipped.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1] dark:bg-zinc-800">
                    <span className="font-semibold block text-foreground mb-0.5">
                      3. Webhook Signature Validation
                    </span>
                    <span className="text-muted-foreground leading-relaxed">
                      In live mode, incoming Meta webhook payloads are verified via HMAC-SHA256 using the configured WhatsApp App Secret.
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ============================================================
          MODAL 1: EDIT AUTOMATION RULE DIALOG
      ============================================================ */}
      {editingRule && (
        <Dialog open={Boolean(editingRule)} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-lg bg-white dark:bg-card border-[#E5DDD0]">
            <DialogHeader>
              <DialogTitle className="text-lg font-serif font-semibold text-foreground">
                Edit {editingRule.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure timing, conditions, and activation status for this automatic message.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Status Switch */}
              <div className="p-3.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F1] dark:bg-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">
                    Automation Status
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Enable or pause this automatic message
                  </span>
                </div>
                <Switch
                  checked={settings ? Boolean(settings[editingRule.key]) : false}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ [editingRule.key]: checked })
                  }
                />
              </div>

              {/* Timing Delay if applicable */}
              {editingRule.delayKey && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">
                    Delivery Delay (Hours)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={ruleDelayHours}
                    onChange={(e) => setRuleDelayHours(Number(e.target.value))}
                    className="h-8 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Number of hours to wait after event trigger before dispatching WhatsApp message.
                  </p>
                </div>
              )}

              {/* Template Content Preview */}
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Message Content Preview
                </label>
                <div className="p-3 rounded-lg bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] text-[11px] font-sans text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                  {editingRule.sampleMessage.replace(/\\n/g, "\n")}
                </div>
              </div>

              {/* Clear Explanation of Disabling Effect */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                <strong>Effect of Turning Off:</strong> When disabled, no automatic WhatsApp messages will be triggered or sent for this milestone. Any newly arriving events will be skipped safely without sending.
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRule(null)}
                className="text-xs border-[#E5DDD0]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (editingRule.delayKey) {
                    updateSettingsMutation.mutate({ [editingRule.delayKey]: ruleDelayHours });
                  } else {
                    setEditingRule(null);
                  }
                }}
                disabled={updateSettingsMutation.isPending}
                className="text-xs bg-[#24543D] hover:bg-[#1b3f2e] text-white"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ============================================================
          MODAL 2: MESSAGE INSPECTION & AUDIT DIALOG
      ============================================================ */}
      {selectedMessage && (
        <Dialog open={Boolean(selectedMessage)} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-xl bg-white dark:bg-card border-[#E5DDD0]">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-base font-serif font-semibold text-foreground">
                  WhatsApp Message #{selectedMessage.id}
                </DialogTitle>
                <CleanStatusBadge status={selectedMessage.status} direction={selectedMessage.direction} />
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Recorded on {new Date(selectedMessage.createdAt).toLocaleString()} via {selectedMessage.provider === "cloud_api" ? "Meta Cloud API" : "Simulation"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Delivery Timestamps */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] text-[11px]">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">1. Dispatched</span>
                  <span className="font-mono text-foreground">
                    {selectedMessage.sentAt
                      ? new Date(selectedMessage.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : selectedMessage.status === "simulated" ? "Simulated" : "Pending"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">2. Carrier Delivered</span>
                  <span className="font-mono text-foreground">
                    {selectedMessage.deliveredAt
                      ? new Date(selectedMessage.deliveredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">3. Customer Read</span>
                  <span className="font-mono text-foreground">
                    {selectedMessage.readAt
                      ? new Date(selectedMessage.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Unread"}
                  </span>
                </div>
              </div>

              {/* Recipient info */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0]">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Recipient</span>
                  <span className="font-semibold text-foreground">{selectedMessage.recipientName}</span>
                  <span className="block text-muted-foreground font-mono text-[11px]">{selectedMessage.recipientPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Related Record</span>
                  <span className="font-medium text-foreground">
                    {selectedMessage.relatedType.toUpperCase()} #{selectedMessage.relatedId}
                  </span>
                  <span className="block text-muted-foreground text-[11px] capitalize">{selectedMessage.trigger}</span>
                </div>
              </div>

              {/* Message body */}
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">Message Body</span>
                <div className="p-3.5 rounded-xl bg-background border border-[#E5DDD0] whitespace-pre-wrap font-sans text-xs text-foreground/90 leading-relaxed max-h-44 overflow-y-auto">
                  {selectedMessage.bodyText}
                </div>
              </div>

              {/* Error reason if any */}
              {selectedMessage.error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
                  <span className="font-semibold block text-[11px] uppercase">Safeguard / Error Reason:</span>
                  {selectedMessage.error}
                </div>
              )}

              {/* Provider details */}
              <div className="p-3 rounded-lg bg-[#FAF7F1] dark:bg-zinc-800 border border-[#E5DDD0] text-[11px] font-mono text-muted-foreground">
                <div>Provider Message ID: {selectedMessage.providerMessageId || "None"}</div>
                <div>Idempotency Key: {selectedMessage.idempotencyKey}</div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 border-t border-[#E5DDD0] pt-3">
              <span className="text-[11px] text-muted-foreground font-mono">
                Retries: {selectedMessage.retryCount}
              </span>
              <div className="flex gap-2">
                {["failed", "cancelled", "skipped_no_consent", "skipped_disabled"].includes(selectedMessage.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryMutation.mutate(selectedMessage.id)}
                    disabled={retryMutation.isPending}
                    className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry Message
                  </Button>
                )}
                <Button size="sm" onClick={() => setSelectedMessage(null)} className="text-xs bg-[#24543D] hover:bg-[#1b3f2e] text-white">
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CleanStatusBadge({ status, direction }: { status: string; direction?: string }) {
  switch (status) {
    case "delivered":
    case "read":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-medium">
          <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-600" />
          {status.toUpperCase()}
        </Badge>
      );
    case "sent":
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-300 text-[10px] font-medium">
          <Send className="h-2.5 w-2.5 mr-1 text-sky-600" />
          SENT
        </Badge>
      );
    case "simulated":
      return (
        <Badge variant="outline" className="bg-[#FAF7F1] text-[#24543D] border-[#E5DDD0] text-[10px] font-medium">
          <Clock className="h-2.5 w-2.5 mr-1" />
          SIMULATED
        </Badge>
      );
    case "failed":
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] font-medium">
          <AlertCircle className="h-2.5 w-2.5 mr-1 text-rose-600" />
          {status.toUpperCase()}
        </Badge>
      );
    case "skipped_no_consent":
    case "skipped_opted_out":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-medium">
          <Ban className="h-2.5 w-2.5 mr-1 text-amber-600" />
          {status === "skipped_opted_out" ? "OPTED OUT" : "NO CONSENT"}
        </Badge>
      );
    case "skipped_disabled":
      return (
        <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-300 text-[10px] font-medium">
          RULE DISABLED
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-medium">
          {status.toUpperCase()}
        </Badge>
      );
  }
}
