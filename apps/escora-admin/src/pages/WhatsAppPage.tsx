import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Send,
  RefreshCw,
  Sparkles,
  Phone,
  Search,
  CheckCheck,
  Check,
  Clock,
  ExternalLink,
  Settings,
  HelpCircle,
  User,
  Image as ImageIcon,
  Sliders,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Compass,
  FileText,
  Calendar,
  AlertCircle,
  Copy,
  Smartphone,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppMessage {
  id: number;
  direction?: "inbound" | "outbound";
  recipientPhone: string;
  recipientName: string;
  messageType: string;
  category: string;
  trigger: string;
  bodyText: string;
  status: string;
  createdAt: string;
  deliveredAt?: string;
  metadata?: Record<string, any>;
}

interface ConversationItem {
  phone: string;
  recipientName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastDirection: "inbound" | "outbound";
  status: string;
  messages: WhatsAppMessage[];
  isServiceWindowActive: boolean;
  serviceWindowExpiresAt: string | null;
  matchedEnquiryId: number | null;
  selectedOption: string | null;
}

interface WhatsAppSettings {
  welcomeGreetingEnabled?: boolean;
  welcomeBannerUrl?: string;
  welcomeGreetingText?: string;
  welcomeButton1Label?: string;
  welcomeButton2Label?: string;
  welcomeButton3Label?: string;
  welcomeButton1Reply?: string;
  welcomeButton2Reply?: string;
  welcomeButton3Reply?: string;
  providerMode?: "mock" | "cloud_api";
  liveSendingEnabled?: boolean;
}

const PRESET_BANNERS = [
  {
    name: "Munnar Tea Hills Sanctuary",
    url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Alleppey Luxury Houseboat",
    url: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Marari Heritage Beach Villa",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function WhatsAppPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Top-level View: "chat" (Live Enquiries) | "settings" (Welcome Bot Config) | "test" (Simulator)
  const [activeTab, setActiveTab] = useState<"chat" | "settings" | "test">("chat");

  // Full Screen Mode state & handlers
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}
    } else {
      setIsFullscreen(false);
      try {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {}
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Chat UI state
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<"all" | "active" | "inbound">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [staffName, setStaffName] = useState("Escora Travel Curator");
  const [staffNotes, setStaffNotes] = useState<Record<string, string>>({});

  // Welcome Bot Settings Form state
  const [bannerUrl, setBannerUrl] = useState("");
  const [greetingText, setGreetingText] = useState("");
  const [btn1Label, setBtn1Label] = useState("");
  const [btn2Label, setBtn2Label] = useState("");
  const [btn3Label, setBtn3Label] = useState("");
  const [btn1Reply, setBtn1Reply] = useState("");
  const [btn2Reply, setBtn2Reply] = useState("");
  const [btn3Reply, setBtn3Reply] = useState("");
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);

  // Test sender state
  const [testPhone, setTestPhone] = useState("+91 98765 43210");
  const [testName, setTestName] = useState("Arun");

  // Fetch Conversations
  const {
    data: conversations = [],
    isLoading: convsLoading,
    refetch: refetchConvs,
  } = useQuery<ConversationItem[]>({
    queryKey: ["admin", "whatsapp-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load conversations");
      return res.json();
    },
    refetchInterval: 4000,
  });

  // Fetch Settings
  const { data: settings, refetch: refetchSettings } = useQuery<WhatsAppSettings>({
    queryKey: ["admin", "whatsapp-settings"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  // Populate settings form when loaded
  useEffect(() => {
    if (settings) {
      setWelcomeEnabled(settings.welcomeGreetingEnabled !== false);
      setBannerUrl(
        settings.welcomeBannerUrl ||
          "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80"
      );
      setGreetingText(
        settings.welcomeGreetingText ||
          "Good day {{first_name}}! Welcome to Escora Holidays. Simply select an option below or type your enquiry to get started."
      );
      setBtn1Label(settings.welcomeButton1Label || "🌴 Tour Packages");
      setBtn2Label(settings.welcomeButton2Label || "✍️ Plan Custom Trip");
      setBtn3Label(settings.welcomeButton3Label || "🛎️ Talk to Concierge");
      setBtn1Reply(
        settings.welcomeButton1Reply ||
          "🌴 *Escora Signature Collections*\n\n1. *Munnar Mist Sanctuary (4D/3N)*\n2. *Vembanad Houseboat Serenity (3D/2N)*\n3. *Wayanad Rainforest Retreat (4D/3N)*\n\nReply with your travel dates for full pricing!"
      );
      setBtn2Reply(
        settings.welcomeButton2Reply ||
          "✍️ *Plan a Custom Itinerary*\n\nPlease reply with:\n• Travel dates\n• Number of travelers\n• Preferred style (Romantic Honeymoon, Family, or Wellness)"
      );
      setBtn3Reply(
        settings.welcomeButton3Reply ||
          "🛎️ *Escora Concierge Assigned*\n\nOur senior travel designer will assist you right here in this chat shortly."
      );
    }
  }, [settings]);

  // Set initial selected conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedPhone) {
      setSelectedPhone(conversations[0].phone);
    }
  }, [conversations, selectedPhone]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedPhone, conversations]);

  // Send Reply Mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ phone, text }: { phone: string; text: string }) => {
      const res = await fetch(`/api/whatsapp/conversations/${encodeURIComponent(phone)}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          staffName,
          recipientName: activeConv?.recipientName || "Guest",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send reply");
      }
      return res.json();
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-conversations"] });
      toast({
        title: "Message Sent",
        description: "Your reply was delivered to customer's WhatsApp.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Send Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Save Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updated: Partial<WhatsAppSettings>) => {
      const res = await fetch("/api/whatsapp/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-settings"] });
      toast({
        title: "Settings Saved",
        description: "WhatsApp Welcome Bot configuration updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Test Welcome Message Mutation
  const testWelcomeMutation = useMutation({
    mutationFn: async ({ phone, name }: { phone: string; name: string }) => {
      const res = await fetch("/api/whatsapp/test-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send test welcome message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-conversations"] });
      toast({
        title: "Test Welcome Dispatched",
        description: `Banner & buttons dispatched to ${testPhone}. Check your WhatsApp!`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Test Send Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (chatFilter === "active" && !c.isServiceWindowActive) return false;
      if (chatFilter === "inbound" && c.lastDirection !== "inbound") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.recipientName.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conversations, chatFilter, searchQuery]);

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.phone === selectedPhone) || conversations[0] || null;
  }, [conversations, selectedPhone]);

  function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !activeConv) return;
    sendReplyMutation.mutate({ phone: activeConv.phone, text: replyText.trim() });
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    saveSettingsMutation.mutate({
      welcomeGreetingEnabled: welcomeEnabled,
      welcomeBannerUrl: bannerUrl.trim(),
      welcomeGreetingText: greetingText.trim(),
      welcomeButton1Label: btn1Label.trim(),
      welcomeButton2Label: btn2Label.trim(),
      welcomeButton3Label: btn3Label.trim(),
      welcomeButton1Reply: btn1Reply.trim(),
      welcomeButton2Reply: btn2Reply.trim(),
      welcomeButton3Reply: btn3Reply.trim(),
    });
  }

  function insertQuickSnippet(text: string) {
    setReplyText((prev) => (prev ? `${prev}\n\n${text}` : text));
  }

  const isLive = settings?.providerMode === "cloud_api" && settings?.liveSendingEnabled;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#FAF7F2] p-4 md:p-6 overflow-hidden flex flex-col w-screen h-screen m-0 max-w-none font-sans"
          : "p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 font-sans"
      }
    >
      {/* ============================================================
          TOP HEADER: Brand, Status, and Clean Navigation Tabs
      ============================================================ */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E2D5] shrink-0 ${
          isFullscreen ? "pb-3 mb-3" : "pb-5"
        }`}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#1C2826] tracking-tight">
              WhatsApp Concierge
            </h1>
            {isLive ? (
              <Badge className="bg-emerald-600/10 text-emerald-800 border-emerald-300 font-sans text-xs px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse mr-1.5" />
                Meta Cloud API (Live)
              </Badge>
            ) : (
              <Badge className="bg-amber-600/10 text-amber-900 border-amber-300 font-sans text-xs px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />
                Mock Simulation Mode
              </Badge>
            )}
            {isFullscreen && (
              <Badge className="bg-[#2C5E43]/10 text-[#2C5E43] border-[#2C5E43]/30 text-xs px-2 py-0.5 font-medium hidden sm:inline-flex">
                Full Screen View
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#5C6E68] mt-1">
            Real-time 2-way guest messaging & automated welcome greeting with interactive options.
          </p>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#F4EFEA] p-1 rounded-xl border border-[#E5DDD0] flex items-center gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "chat"
                  ? "bg-white text-[#1C2826] shadow-sm font-semibold"
                  : "text-[#5C6E68] hover:text-[#1C2826]"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#2C5E43]" />
              Live Enquiries & Chat
              {conversations.length > 0 && (
                <span className="bg-[#2C5E43] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {conversations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "settings"
                  ? "bg-white text-[#1C2826] shadow-sm font-semibold"
                  : "text-[#5C6E68] hover:text-[#1C2826]"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-[#2C5E43]" />
              Welcome Bot Config
            </button>
            <button
              onClick={() => setActiveTab("test")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "test"
                  ? "bg-white text-[#1C2826] shadow-sm font-semibold"
                  : "text-[#5C6E68] hover:text-[#1C2826]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#2C5E43]" />
              Live Test Sender
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchConvs()}
            className="border-[#E5DDD0] hover:bg-[#F4EFEA] text-[#1C2826]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#5C6E68]" />
            Refresh
          </Button>

          {/* Full Screen Toggle Button */}
          <Button
            variant={isFullscreen ? "default" : "outline"}
            size="sm"
            onClick={toggleFullscreen}
            className={
              isFullscreen
                ? "bg-[#2C5E43] text-white hover:bg-[#234b35] border-transparent font-medium shadow-xs"
                : "border-[#E5DDD0] hover:bg-[#F4EFEA] text-[#1C2826]"
            }
            title={isFullscreen ? "Exit Full Screen (Esc)" : "Expand WhatsApp Panel to Full Screen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 mr-1.5 text-white" />
                Exit Full Screen
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 mr-1.5 text-[#2C5E43]" />
                Full Screen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: LIVE 2-WAY CHAT CRM (3-Column Luxury Workspace)
      ============================================================ */}
      {activeTab === "chat" && (
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-[#E8E2D5] shadow-sm overflow-hidden ${
            isFullscreen ? "flex-1 min-h-0 h-full" : "min-h-[720px]"
          }`}
        >
          {/* COLUMN 1: CONVERSATIONS LIST (3 Cols on desktop) */}
          <div className="lg:col-span-4 border-r border-[#E8E2D5] flex flex-col bg-[#FAF7F2]">
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-[#E8E2D5] space-y-3 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#8A9A94]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest or message..."
                  className="pl-9 h-10 bg-[#FAF7F2] border-[#E8E2D5] text-xs focus-visible:ring-[#2C5E43]"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1.5 text-xs">
                <button
                  onClick={() => setChatFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    chatFilter === "all"
                      ? "bg-[#2C5E43] text-white"
                      : "bg-[#EFE9DF] text-[#5C6E68] hover:bg-[#E5DDD0]"
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setChatFilter("active")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                    chatFilter === "active"
                      ? "bg-[#2C5E43] text-white"
                      : "bg-[#EFE9DF] text-[#5C6E68] hover:bg-[#E5DDD0]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active 24h Window
                </button>
                <button
                  onClick={() => setChatFilter("inbound")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    chatFilter === "inbound"
                      ? "bg-[#2C5E43] text-white"
                      : "bg-[#EFE9DF] text-[#5C6E68] hover:bg-[#E5DDD0]"
                  }`}
                >
                  Needs Reply
                </button>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#EFE9DF]">
              {convsLoading ? (
                <div className="p-8 text-center text-xs text-[#8A9A94]">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <MessageCircle className="w-8 h-8 text-[#8A9A94] mx-auto opacity-40" />
                  <p className="text-xs text-[#5C6E68] font-medium">No conversations found</p>
                  <p className="text-[11px] text-[#8A9A94]">
                    When a guest messages your WhatsApp, it will appear here instantly.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedPhone === conv.phone;
                  return (
                    <div
                      key={conv.phone}
                      onClick={() => setSelectedPhone(conv.phone)}
                      className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                        isSelected
                          ? "bg-white border-l-[#2C5E43] shadow-xs"
                          : "border-l-transparent hover:bg-[#F2ECE1]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#E5DDD0] text-[#2C5E43] font-serif font-semibold text-xs flex items-center justify-center shrink-0">
                            {conv.recipientName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1C2826] truncate">
                              {conv.recipientName}
                            </p>
                            <p className="text-[11px] text-[#5C6E68] font-mono">{conv.phone}</p>
                          </div>
                        </div>

                        {/* Relative Time & 24h Status Indicator */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-[#8A9A94]">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {conv.isServiceWindowActive && (
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] text-emerald-700 font-medium font-mono">
                                24h Free
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Snippet & Tag */}
                      <p className="text-[11px] text-[#5C6E68] line-clamp-1 mt-1.5">
                        {conv.lastDirection === "inbound" ? (
                          <span className="text-[#2C5E43] font-medium mr-1">Guest:</span>
                        ) : (
                          <span className="text-[#8A9A94] mr-1">You:</span>
                        )}
                        {conv.lastMessage}
                      </p>

                      {conv.selectedOption && (
                        <div className="mt-1.5">
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2C5E43]/10 text-[#2C5E43]">
                            {conv.selectedOption}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: LIVE CONVERSATION STREAM & REPLY BOX (5 Cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col bg-white border-r border-[#E8E2D5]">
            {activeConv ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-[#E8E2D5] flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E5DDD0] text-[#2C5E43] font-serif font-bold text-sm flex items-center justify-center">
                      {activeConv.recipientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#1C2826]">
                        {activeConv.recipientName}
                      </h2>
                      <p className="text-xs text-[#5C6E68] font-mono">{activeConv.phone}</p>
                    </div>
                  </div>

                  {/* 24-Hour Session Badge & Fullscreen Quick Toggle */}
                  <div className="flex items-center gap-2">
                    {activeConv.isServiceWindowActive ? (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] px-2.5 py-0.5">
                        <Clock className="w-3 h-3 mr-1 text-emerald-600" />
                        24h Free Window Active
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-900 border-amber-300 text-[10px] px-2.5 py-0.5">
                        Window Expired (Template Required)
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-lg border border-[#E8E2D5] text-[#5C6E68] hover:text-[#1C2826] hover:bg-[#FAF7F2] transition"
                      title={isFullscreen ? "Exit Full Screen (Esc)" : "Expand Chat to Full Screen"}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-3.5 h-3.5 text-[#2C5E43]" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5 text-[#5C6E68]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]">
                  {activeConv.messages.map((msg, idx) => {
                    const isInbound = msg.direction === "inbound";
                    const isBotWelcome = msg.trigger === "welcome_greeting_bot";

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs space-y-2 ${
                            isInbound
                              ? "bg-white text-[#1C2826] border border-[#E8E2D5] rounded-tl-xs"
                              : "bg-[#2C5E43] text-white rounded-tr-xs"
                          }`}
                        >
                          {/* Bot Banner Preview if Welcome Greeting */}
                          {isBotWelcome && msg.metadata?.bannerUrl && (
                            <div className="rounded-lg overflow-hidden border border-white/20 mb-2">
                              <img
                                src={msg.metadata.bannerUrl}
                                alt="Escora Welcome"
                                className="w-full h-32 object-cover"
                              />
                            </div>
                          )}

                          {/* Message Body Text */}
                          <div className="whitespace-pre-wrap leading-relaxed font-sans">
                            {msg.bodyText}
                          </div>

                          {/* Interactive Buttons Pill Display if attached */}
                          {msg.metadata?.buttons && Array.isArray(msg.metadata.buttons) && (
                            <div className="pt-2 border-t border-white/20 space-y-1">
                              <p className="text-[10px] uppercase tracking-wider text-white/70">
                                Interactive Quick Buttons:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {msg.metadata.buttons.map((b: string, bIdx: number) => (
                                  <span
                                    key={bIdx}
                                    className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px]"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer: Time & Status */}
                          <div
                            className={`flex items-center justify-end gap-1.5 pt-1 text-[9px] ${
                              isInbound ? "text-[#8A9A94]" : "text-emerald-200"
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {!isInbound && (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                            )}
                          </div>
                        </div>

                        <span className="text-[9px] text-[#8A9A94] mt-0.5 px-1">
                          {isInbound ? activeConv.recipientName : "Escora Staff"}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Curator Reply Bar */}
                <div className="p-3.5 border-t border-[#E8E2D5] bg-white space-y-2">
                  {/* Quick Canned Snippets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-[10px] text-[#8A9A94] font-medium shrink-0">
                      Quick Snippets:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        insertQuickSnippet(
                          "🌴 We have luxury pool villas available in Munnar for 4D/3N starting at ₹48,000 for 2 adults with private car."
                        )
                      }
                      className="px-2 py-1 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-[10px] text-[#5C6E68] hover:bg-[#EFE9DF] shrink-0"
                    >
                      🌴 Munnar Pricing
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertQuickSnippet(
                          "✍️ Could you please share how many adults and children will be traveling, and your expected dates?"
                        )
                      }
                      className="px-2 py-1 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-[10px] text-[#5C6E68] hover:bg-[#EFE9DF] shrink-0"
                    >
                      ✍️ Ask Dates & Guests
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertQuickSnippet(
                          "🛎️ You can reach our senior curator directly at +91 94000 00000 anytime."
                        )
                      }
                      className="px-2 py-1 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-[10px] text-[#5C6E68] hover:bg-[#EFE9DF] shrink-0"
                    >
                      📞 Direct Phone
                    </button>
                  </div>

                  <form onSubmit={handleSendReply} className="space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply to customer's WhatsApp..."
                      rows={2}
                      className="text-xs border-[#E8E2D5] focus-visible:ring-[#2C5E43] resize-none"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8A9A94]">Replying as:</span>
                        <Input
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          className="h-6 w-36 text-[10px] px-1.5 border-[#E8E2D5]"
                        />
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        disabled={!replyText.trim() || sendReplyMutation.isPending}
                        className="bg-[#2C5E43] hover:bg-[#234b35] text-white text-xs h-8 px-4"
                      >
                        {sendReplyMutation.isPending ? (
                          "Sending..."
                        ) : (
                          <>
                            Send to WhatsApp
                            <Send className="w-3.5 h-3.5 ml-1.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[#8A9A94]">
                Select a conversation to view chat
              </div>
            )}
          </div>

          {/* COLUMN 3: GUEST & LEAD 360° SIDEBAR (3 Cols on desktop) */}
          <div className="lg:col-span-3 p-5 bg-[#FAF7F2] flex flex-col space-y-6">
            {activeConv ? (
              <>
                {/* Guest Profile Card */}
                <div className="bg-white p-4 rounded-xl border border-[#E8E2D5] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2C5E43]/10 text-[#2C5E43] font-serif font-bold text-sm flex items-center justify-center">
                      {activeConv.recipientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#1C2826]">
                        {activeConv.recipientName}
                      </h3>
                      <p className="text-[11px] text-[#5C6E68] font-mono">{activeConv.phone}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EFE9DF] text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#8A9A94]">Channel:</span>
                      <span className="font-medium text-[#1C2826]">WhatsApp Inbound</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A9A94]">Selected Option:</span>
                      <span className="font-medium text-[#2C5E43]">
                        {activeConv.selectedOption || "General Query"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A9A94]">Service Window:</span>
                      <span
                        className={`font-medium ${
                          activeConv.isServiceWindowActive ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {activeConv.isServiceWindowActive ? "Active (Free)" : "Closed"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions for Curators */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9A94]">
                    Lead Actions
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs border-[#E8E2D5] bg-white hover:bg-[#FAF7F2] text-[#1C2826]"
                    onClick={() => {
                      if (activeConv.matchedEnquiryId) {
                        window.location.href = `/admin/enquiries?search=${activeConv.phone}`;
                      } else {
                        toast({
                          title: "Linked Enquiry",
                          description: `Lead registered under phone ${activeConv.phone}. View in Enquiries page.`,
                        });
                      }
                    }}
                  >
                    <FileText className="w-3.5 h-3.5 mr-2 text-[#2C5E43]" />
                    View / Convert to Booking
                    <ArrowUpRight className="w-3 h-3 ml-auto text-[#8A9A94]" />
                  </Button>
                </div>

                {/* Private Curator Notes */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9A94]">
                    Internal Curator Notes
                  </p>
                  <Textarea
                    value={staffNotes[activeConv.phone] || ""}
                    onChange={(e) =>
                      setStaffNotes((prev) => ({ ...prev, [activeConv.phone]: e.target.value }))
                    }
                    placeholder="Private notes (e.g. Guest celebrating anniversary, prefers ground-floor pool villa)..."
                    rows={4}
                    className="text-xs bg-white border-[#E8E2D5] focus-visible:ring-[#2C5E43] resize-none flex-1"
                  />
                  <p className="text-[10px] text-[#8A9A94]">
                    Notes are visible only to your staff, never to the customer.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-[#8A9A94] mt-8">
                No active guest selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: WELCOME GREETING BOT CONFIGURATOR
      ============================================================ */}
      {activeTab === "settings" && (
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D5] shadow-sm ${
            isFullscreen ? "flex-1 overflow-y-auto" : ""
          }`}
        >
          {/* LEFT: Config Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-xl font-serif font-semibold text-[#1C2826]">
                Automated Welcome Greeting Bot
              </h2>
              <p className="text-xs text-[#5C6E68] mt-1">
                Configure the banner image, welcome message, and 3 interactive options sent
                automatically when a traveler texts *"Hi"* on WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <div>
                  <p className="text-xs font-semibold text-[#1C2826]">
                    Enable Automated Welcome Greeting
                  </p>
                  <p className="text-[11px] text-[#5C6E68]">
                    Automatically dispatches banner + options when customer messages for the first time.
                  </p>
                </div>
                <Switch
                  checked={welcomeEnabled}
                  onCheckedChange={setWelcomeEnabled}
                  className="data-[state=checked]:bg-[#2C5E43]"
                />
              </div>

              {/* Banner Image URL & Presets */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#1C2826] flex items-center justify-between">
                  <span>Welcome Hero Banner Image URL</span>
                  <span className="text-[11px] text-[#8A9A94]">High-res JPG / PNG</span>
                </label>
                <Input
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs border-[#E8E2D5] h-9"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#8A9A94]">Presets:</span>
                  {PRESET_BANNERS.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setBannerUrl(p.url)}
                      className="px-2 py-0.5 rounded text-[10px] bg-[#FAF7F2] border border-[#E8E2D5] hover:bg-[#EFE9DF] text-[#5C6E68]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Greeting Copy Text */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#1C2826] flex items-center justify-between">
                  <span>Welcome Copy Text</span>
                  <span className="text-[11px] text-[#8A9A94]">Supports variables</span>
                </label>
                <Textarea
                  value={greetingText}
                  onChange={(e) => setGreetingText(e.target.value)}
                  rows={3}
                  className="text-xs border-[#E8E2D5] resize-none"
                />
                <p className="text-[10px] text-[#8A9A94]">
                  Variables: <code className="bg-[#FAF7F2] px-1 py-0.5 rounded font-mono">{"{{first_name}}"}</code> (Profile Name), <code className="bg-[#FAF7F2] px-1 py-0.5 rounded font-mono">{"{{greeting_time}}"}</code> (Good Morning/Afternoon)
                </p>
              </div>

              {/* The 3 Interactive Quick Buttons */}
              <div className="space-y-4 pt-2 border-t border-[#E8E2D5]">
                <h3 className="text-xs font-semibold text-[#1C2826] uppercase tracking-wider">
                  The 3 Quick-Reply Buttons & Auto Responses
                </h3>

                {/* Button 1 */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2C5E43] text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <Input
                      value={btn1Label}
                      onChange={(e) => setBtn1Label(e.target.value)}
                      placeholder="Button 1 Label (e.g. 🌴 Tour Packages)"
                      maxLength={20}
                      className="h-8 text-xs bg-white border-[#E8E2D5]"
                    />
                  </div>
                  <Textarea
                    value={btn1Reply}
                    onChange={(e) => setBtn1Reply(e.target.value)}
                    placeholder="Automated response when Button 1 is clicked..."
                    rows={2}
                    className="text-xs bg-white border-[#E8E2D5] resize-none"
                  />
                </div>

                {/* Button 2 */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2C5E43] text-white text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <Input
                      value={btn2Label}
                      onChange={(e) => setBtn2Label(e.target.value)}
                      placeholder="Button 2 Label (e.g. ✍️ Plan Custom Trip)"
                      maxLength={20}
                      className="h-8 text-xs bg-white border-[#E8E2D5]"
                    />
                  </div>
                  <Textarea
                    value={btn2Reply}
                    onChange={(e) => setBtn2Reply(e.target.value)}
                    placeholder="Automated response when Button 2 is clicked..."
                    rows={2}
                    className="text-xs bg-white border-[#E8E2D5] resize-none"
                  />
                </div>

                {/* Button 3 */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2C5E43] text-white text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <Input
                      value={btn3Label}
                      onChange={(e) => setBtn3Label(e.target.value)}
                      placeholder="Button 3 Label (e.g. 🛎️ Talk to Concierge)"
                      maxLength={20}
                      className="h-8 text-xs bg-white border-[#E8E2D5]"
                    />
                  </div>
                  <Textarea
                    value={btn3Reply}
                    onChange={(e) => setBtn3Reply(e.target.value)}
                    placeholder="Automated response when Button 3 is clicked..."
                    rows={2}
                    className="text-xs bg-white border-[#E8E2D5] resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saveSettingsMutation.isPending}
                className="bg-[#2C5E43] hover:bg-[#234b35] text-white text-xs px-6 h-9"
              >
                {saveSettingsMutation.isPending ? "Saving..." : "Save Welcome Bot Settings"}
              </Button>
            </form>
          </div>

          {/* RIGHT: Live Mobile Phone WhatsApp Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-semibold text-[#1C2826] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#2C5E43]" />
              Live WhatsApp Customer Preview
            </p>

            {/* Smartphone Mockup */}
            <div className="w-[310px] bg-black rounded-[40px] p-3 shadow-xl border-4 border-[#D8D0C5]">
              {/* Screen */}
              <div className="bg-[#EFEAE2] rounded-[32px] overflow-hidden flex flex-col h-[520px]">
                {/* WhatsApp Chat Header */}
                <div className="bg-[#075E54] text-white p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white font-serif font-bold text-xs flex items-center justify-center">
                    EH
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">Escora Holidays</p>
                    <p className="text-[9px] text-white/80">Official Business Account</p>
                  </div>
                </div>

                {/* Chat Background & Message */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {/* Customer "Hi" */}
                  <div className="flex justify-end">
                    <div className="bg-[#E7FFDB] text-[#1C2826] p-2 rounded-lg text-[11px] shadow-xs">
                      Hi, need holiday details
                      <span className="text-[9px] text-[#8A9A94] ml-2">12:34 PM ✓✓</span>
                    </div>
                  </div>

                  {/* Automated Welcome Card */}
                  <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#D5CEC5]">
                    {/* Banner Image */}
                    {bannerUrl && (
                      <img
                        src={bannerUrl}
                        alt="Preview"
                        className="w-full h-28 object-cover"
                      />
                    )}

                    {/* Text Body */}
                    <div className="p-2.5 text-[11px] text-[#1C2826] whitespace-pre-wrap leading-relaxed">
                      {greetingText.replace(/\{\{first_name\}\}/g, "Arun")}
                    </div>

                    <div className="px-2.5 pb-1 text-[9px] text-[#8A9A94]">
                      Escora Holidays · Bespoke Luxury
                    </div>

                    {/* 3 Interactive Buttons */}
                    <div className="border-t border-[#EFE9DF] divide-y divide-[#EFE9DF]">
                      <div className="p-2 text-center text-[11px] font-semibold text-[#00A884]">
                        {btn1Label || "🌴 Tour Packages"}
                      </div>
                      <div className="p-2 text-center text-[11px] font-semibold text-[#00A884]">
                        {btn2Label || "✍️ Plan Custom Trip"}
                      </div>
                      <div className="p-2 text-center text-[11px] font-semibold text-[#00A884]">
                        {btn3Label || "🛎️ Talk to Concierge"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#8A9A94] mt-3">
              This is the exact interactive layout your travelers will see on their phones.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: LIVE TEST SENDER (Interactive Sandbox)
      ============================================================ */}
      {activeTab === "test" && (
        <div
          className={`max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-6 ${
            isFullscreen ? "my-auto overflow-y-auto" : ""
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-full bg-[#2C5E43]/10 text-[#2C5E43] flex items-center justify-center mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-[#1C2826]">
              Test Welcome Bot on Your Own Phone
            </h2>
            <p className="text-xs text-[#5C6E68] mt-1">
              Verify the exact banner image, greeting copy, and clickable buttons on your personal
              WhatsApp before making it live for guests.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#1C2826]">Your Mobile Number</label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="text-xs border-[#E8E2D5] font-mono h-10"
              />
              <p className="text-[10px] text-[#8A9A94]">
                In Meta sandbox mode, recipient phone must be registered as a verified test recipient.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#1C2826]">Recipient Name</label>
              <Input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Arun"
                className="text-xs border-[#E8E2D5] h-10"
              />
            </div>

            <Button
              onClick={() => testWelcomeMutation.mutate({ phone: testPhone, name: testName })}
              disabled={testWelcomeMutation.isPending || !testPhone.trim()}
              className="w-full bg-[#2C5E43] hover:bg-[#234b35] text-white text-xs h-10 font-semibold"
            >
              {testWelcomeMutation.isPending ? (
                "Dispatching to your phone..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Welcome Greeting to My WhatsApp
                </>
              )}
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#5C6E68] space-y-1">
            <p className="font-semibold text-[#1C2826] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Safety Verification
            </p>
            <p className="text-[11px]">
              In Mock mode, dispatches are cleanly simulated in the live audit log. When
              WHATSAPP_LIVE_SENDING_ENABLED=true, real messages are submitted to Meta Graph API.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
