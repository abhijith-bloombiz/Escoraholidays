import { useState, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "wouter";
import {
  useListEnquiries,
  useUpdateEnquiry,
  useDeleteEnquiry,
  getListEnquiriesQueryKey,
  useAssistEnquiry,
  useCreateItinerary,
  useUpdateItinerary,
  useDeleteItinerary,
  getListItinerariesQueryKey,
  type Enquiry,
  type EnquiryAiAssistResponse,
  type Itinerary,
  type ItineraryAiAssistResponse,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trash2,
  Mail,
  Eye,
  Info,
  Search,
  X,
  Phone,
  Copy,
  AlertTriangle,
  RefreshCw,
  Inbox,
  CheckCircle2,
  Check,
  Send,
  Calendar,
  Sparkles,
  HelpCircle,
  Lightbulb,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  Edit3,
  ExternalLink,
  FileText,
  Share2,
  Download,
  MapPin,
  Paperclip,
  MessageSquare,
  CheckCheck,
  ShoppingBag,
  Compass,
} from "lucide-react";
import ConvertEnquiryModal from "@/components/enquiry/ConvertEnquiryModal";
import AiItineraryAssistantModal from "@/components/itinerary/AiItineraryAssistantModal";
import ItineraryDocument from "@/components/itinerary/ItineraryDocument";
import ItineraryPrintDocument from "@/components/itinerary/ItineraryPrintDocument";
import { downloadElementAsPdf, formatItineraryPdfFilename } from "@/lib/pdfDownload";
import {
  parsePricing,
  parseDays,
  parseStays,
  parseStringList,
  parseTripIncludes,
  parseTransportation,
  generateProposalReferenceNumber,
} from "@/lib/itinerary";

const SHARE_BASE_URL = "https://www.escoraholidays.com";

function toDocumentData(itinerary: Itinerary) {
  return {
    title: itinerary.title,
    customerName: itinerary.customerName,
    destination: itinerary.destination,
    startDate: itinerary.startDate,
    endDate: itinerary.endDate,
    coverImageUrl: itinerary.coverImageUrl,
    summary: itinerary.summary,
    days: itinerary.days,
    stays: itinerary.stays,
    inclusions: itinerary.inclusions,
    exclusions: itinerary.exclusions,
    pricing: itinerary.pricing,
    currency: itinerary.currency,
    shareToken: itinerary.shareToken,
    referenceNumber: itinerary.referenceNumber,
    curatorName: itinerary.curatorName,
    curatorPhone: itinerary.curatorPhone,
    emergencyContacts: itinerary.emergencyContacts,
    adults: itinerary.adults,
    children: itinerary.children,
    infants: itinerary.infants,
    tripIncludes: itinerary.tripIncludes,
    transportation: itinerary.transportation,
    hotelTerms: itinerary.hotelTerms,
    paymentTerms: itinerary.paymentTerms,
    importantInfo: itinerary.importantInfo,
  };
}

function getLocalOrProdShareUrl(token: string, mode: "itinerary" | "package" = "itinerary"): string {
  const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const base = isLocal ? "http://localhost:3000" : SHARE_BASE_URL;
  return `${base}/${mode}/${token}`;
}

function getProdShareUrl(token: string, mode: "itinerary" | "package" = "itinerary"): string {
  return `${SHARE_BASE_URL}/${mode}/${token}`;
}

function renderProposalStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 text-[10px] font-semibold capitalize">
          Confirmed
        </Badge>
      );
    case "shared":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold capitalize">
          Shared
        </Badge>
      );
    case "draft":
    default:
      return (
        <Badge variant="secondary" className="text-[10px] font-semibold capitalize">
          Draft
        </Badge>
      );
  }
}

function toPrintData(itinerary: Itinerary) {
  return {
    title: itinerary.title,
    customerName: itinerary.customerName,
    destination: itinerary.destination,
    startDate: itinerary.startDate,
    endDate: itinerary.endDate,
    coverImageUrl: itinerary.coverImageUrl,
    summary: itinerary.summary,
    days: parseDays(itinerary.days),
    stays: parseStays(itinerary.stays),
    inclusions: parseStringList(itinerary.inclusions),
    exclusions: parseStringList(itinerary.exclusions),
    pricing: parsePricing(itinerary.pricing),
    currency: itinerary.currency,
    shareToken: itinerary.shareToken,
    referenceNumber: itinerary.referenceNumber,
    curatorName: itinerary.curatorName,
    curatorPhone: itinerary.curatorPhone,
    emergencyContacts: itinerary.emergencyContacts,
    createdDate: itinerary.createdAt ? new Date(itinerary.createdAt).toISOString() : undefined,
    adults: itinerary.adults,
    children: itinerary.children,
    infants: itinerary.infants,
    tripIncludes: parseTripIncludes(itinerary.tripIncludes),
    weAlsoProvide: parseTripIncludes(itinerary.tripIncludes).weAlsoProvide,
    transportation: parseTransportation(itinerary.transportation),
    hotelTerms: parseStringList(itinerary.hotelTerms),
    paymentTerms: parseStringList(itinerary.paymentTerms),
    importantInfo: parseStringList(itinerary.importantInfo),
  };
}

function extractPrefillFromEnquiry(enq: Enquiry, aiResult?: EnquiryAiAssistResponse) {
  let destination = "Munnar & Alleppey Backwaters";
  if (aiResult?.extractedPreferences?.destinations && aiResult.extractedPreferences.destinations.length > 0) {
    destination = aiResult.extractedPreferences.destinations.join(" & ");
  } else if (aiResult?.summary?.destinations && aiResult.summary.destinations.length > 0) {
    destination = aiResult.summary.destinations.join(" & ");
  } else {
    const msg = enq.message.toLowerCase();
    const found: string[] = [];
    const known = [
      "Munnar",
      "Alleppey",
      "Kumarakom",
      "Wayanad",
      "Kovalam",
      "Kochi",
      "Cochin",
      "Thekkady",
      "Varkala",
      "Marari",
      "Bekal",
      "Athirappilly",
    ];
    for (const k of known) {
      if (msg.includes(k.toLowerCase())) found.push(k);
    }
    if (found.length > 0) destination = found.join(" & ");
  }

  let durationDays = 7;
  const daysMatch = enq.message.match(/(\d+)\s*(days?|nights?|n\b)/i);
  if (daysMatch) {
    const val = parseInt(daysMatch[1], 10);
    if (!Number.isNaN(val) && val >= 2 && val <= 30) {
      durationDays = daysMatch[2].toLowerCase().startsWith("n") ? val + 1 : val;
    }
  }

  let travelerType = "Couple / Pair";
  const groupStr = (
    aiResult?.extractedPreferences?.groupSize ||
    aiResult?.summary?.groupSize ||
    enq.message
  ).toLowerCase();
  if (groupStr.includes("family") || groupStr.includes("kid") || groupStr.includes("child")) {
    travelerType = "Family with Children";
  } else if (groupStr.includes("solo") || groupStr.includes("alone")) {
    travelerType = "Solo Explorer";
  } else if (
    groupStr.includes("group") ||
    groupStr.includes("friends") ||
    groupStr.includes("colleagues") ||
    groupStr.includes("team")
  ) {
    travelerType = "Private Group";
  }

  let budgetTier = "Signature Slow-Luxury";
  const budgetStr = (
    aiResult?.extractedPreferences?.budget ||
    aiResult?.summary?.budget ||
    enq.message
  ).toLowerCase();
  if (
    budgetStr.includes("ultra") ||
    budgetStr.includes("presidential") ||
    budgetStr.includes("high-end") ||
    budgetStr.includes("luxury estate")
  ) {
    budgetTier = "Ultra-Luxury Estate & Villa";
  } else if (
    budgetStr.includes("moderate") ||
    budgetStr.includes("comfort") ||
    budgetStr.includes("standard") ||
    budgetStr.includes("boutique")
  ) {
    budgetTier = "Curated Boutique Standard";
  }

  let pace: "unhurried-slow" | "balanced" | "active-discovery" = "unhurried-slow";
  const styleStr = (aiResult?.extractedPreferences?.travelStyle || enq.message).toLowerCase();
  if (
    styleStr.includes("active") ||
    styleStr.includes("trek") ||
    styleStr.includes("adventure") ||
    styleStr.includes("explore")
  ) {
    pace = "active-discovery";
  } else if (styleStr.includes("balanced") || styleStr.includes("moderate") || styleStr.includes("standard")) {
    pace = "balanced";
  }

  let startDate = "";
  const datesStr =
    aiResult?.extractedPreferences?.travelDates ||
    aiResult?.summary?.travelDates ||
    "";
  if (datesStr && !datesStr.toLowerCase().includes("unknown")) {
    const dMatch = datesStr.match(/\d{4}-\d{2}-\d{2}/);
    if (dMatch) startDate = dMatch[0];
  }
  if (!startDate) {
    const dMatch = enq.message.match(/\d{4}-\d{2}-\d{2}/);
    if (dMatch) startDate = dMatch[0];
  }

  let notes = `Client message: "${enq.message}"`;
  if (
    aiResult?.extractedPreferences?.specialRequests &&
    aiResult.extractedPreferences.specialRequests.length > 0
  ) {
    notes += `\nSpecial requests: ${aiResult.extractedPreferences.specialRequests.join(", ")}`;
  }

  return {
    customerName: enq.name,
    customerEmail: enq.email,
    customerPhone: enq.phone || undefined,
    destination,
    durationDays,
    startDate,
    travelerType,
    budgetTier,
    pace,
    notes,
    enquiryId: enq.id,
  };
}

function renderEnquiryStatusBadge(status: string) {
  switch (status) {
    case "new":
      return (
        <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-600/20 text-xs font-semibold capitalize flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          New
        </Badge>
      );
    case "replied":
      return (
        <Badge className="bg-blue-600/10 text-blue-700 border-blue-300 dark:border-blue-800 hover:bg-blue-600/20 text-xs font-medium capitalize flex items-center gap-1">
          <Check className="h-3 w-3" />
          Replied
        </Badge>
      );
    case "converted":
      return (
        <Badge className="bg-purple-600/10 text-purple-700 border-purple-300 dark:border-purple-800 hover:bg-purple-600/20 text-xs font-semibold capitalize flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" />
          Converted
        </Badge>
      );
    case "read":
    default:
      return (
        <Badge variant="secondary" className="text-xs font-medium capitalize">
          Read
        </Badge>
      );
  }
}

export default function EnquiriesPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: enquiries, isLoading, isError, refetch } = useListEnquiries();
  const updateMutation = useUpdateEnquiry();
  const deleteMutation = useDeleteEnquiry();
  const assistMutation = useAssistEnquiry();
  const createItineraryMutation = useCreateItinerary();
  const updateItineraryMutation = useUpdateItinerary();
  const deleteItineraryMutation = useDeleteItinerary();

  // Search, filter & sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Dialogs & viewing state
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);

  // AI Assistant states
  const [activeTab, setActiveTab] = useState<"details" | "ai-brief" | "reply-assist" | "proposals">("details");
  const [aiResults, setAiResults] = useState<Record<number, EnquiryAiAssistResponse>>({});
  const [designerPrompt, setDesignerPrompt] = useState("");
  const [replyTone, setReplyTone] = useState<"warm-luxury" | "concise" | "detailed">("warm-luxury");
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [refinePrompt, setRefinePrompt] = useState("");

  // AI Itinerary Creator modal state
  const [showAiItineraryModal, setShowAiItineraryModal] = useState(false);
  const [aiPrefillData, setAiPrefillData] = useState<any>(undefined);

  // Proposal attachment & workflow state
  const [attachedProposalId, setAttachedProposalId] = useState<number | null>(null);
  const [newlyCreatedProposalId, setNewlyCreatedProposalId] = useState<number | null>(null);
  const [replyDeliveryChannel, setReplyDeliveryChannel] = useState<"email" | "whatsapp">("email");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [deleteProposalTarget, setDeleteProposalTarget] = useState<Itinerary | null>(null);
  const [viewingProposal, setViewingProposal] = useState<Itinerary | null>(null);

  // Share proposal & PDF state
  const [shareTargetProposal, setShareTargetProposal] = useState<Itinerary | null>(null);
  const [printingProposal, setPrintingProposal] = useState<Itinerary | null>(null);
  const [downloadingProposalId, setDownloadingProposalId] = useState<number | null>(null);

  // Enquiry to Booking conversion state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertSelectedProposal, setConvertSelectedProposal] = useState<Itinerary | undefined>(undefined);

  // Query proposals linked to viewing enquiry
  const { data: linkedProposals = [], refetch: refetchLinkedProposals, isLoading: isLoadingProposals } = useQuery<Itinerary[]>({
    queryKey: ["admin", "enquiry-proposals", viewing?.id],
    queryFn: async () => {
      if (!viewing?.id) return [];
      const res = await fetch(`/api/enquiries/${viewing.id}/proposals`, { credentials: "include" });
      if (!res.ok) {
        const res2 = await fetch(`/api/itineraries?enquiryId=${viewing.id}`, { credentials: "include" });
        if (!res2.ok) return [];
        return res2.json();
      }
      return res.json();
    },
    enabled: Boolean(viewing?.id),
  });

  // Active attached proposal for reply
  const attachedProposal = useMemo(() => {
    if (!linkedProposals || linkedProposals.length === 0) return null;
    if (attachedProposalId) {
      const found = linkedProposals.find((p) => p.id === attachedProposalId);
      if (found) return found;
    }
    return linkedProposals[0];
  }, [linkedProposals, attachedProposalId]);

  // Query notifications for viewing enquiry
  const { data: enquiryNotifications = [] } = useQuery<any[]>({
    queryKey: ["admin", "enquiry-notifications", viewing?.id],
    queryFn: async () => {
      if (!viewing?.id) return [];
      const res = await fetch(`/api/notifications?relatedType=enquiry&relatedId=${viewing.id}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(viewing?.id),
  });

  // Restore viewing enquiry state from URL query parameters (e.g. returning after saving proposal)
  useEffect(() => {
    if (typeof window === "undefined" || !enquiries || enquiries.length === 0) return;
    const sp = new URLSearchParams(window.location.search);
    const viewEnqId = sp.get("viewEnquiry");
    if (viewEnqId) {
      const found = enquiries.find((e: Enquiry) => String(e.id) === viewEnqId);
      if (found && (!viewing || viewing.id !== found.id)) {
        openMessage(found);
        const createdPropId = sp.get("createdProposalId");
        if (createdPropId) {
          toast({
            title: "Proposal Created & Linked ✨",
            description: `Itinerary Proposal #${createdPropId} has been successfully created and linked to ${found.name}.`,
          });
          setActiveTab("proposals");
          const url = new URL(window.location.href);
          url.searchParams.delete("createdProposalId");
          const cleanSearch = url.searchParams.toString();
          window.history.replaceState({}, "", url.pathname + (cleanSearch ? `?${cleanSearch}` : ""));
        }
      }
    }
  }, [enquiries]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListEnquiriesQueryKey() });
  }

  // Opening a New message marks it as Read automatically
  function openMessage(e: Enquiry) {
    setViewing(e);
    setActiveTab("details");
    setDesignerPrompt("");
    setRefinePrompt("");
    setAttachedProposalId(null);
    setNewlyCreatedProposalId(null);
    setReplyDeliveryChannel("email");
    setIsSendingReply(false);

    const cached = aiResults[e.id];
    if (cached) {
      setEditedSubject(cached.suggestedReply.subject);
      setEditedBody(
        `${cached.suggestedReply.greeting}\n\n${cached.suggestedReply.body}\n\n${cached.suggestedReply.signoff}`
      );
    } else {
      setEditedSubject("");
      setEditedBody("");
    }

    if (e.status === "new") {
      updateMutation.mutate(
        { id: e.id, data: { status: "read" } },
        {
          onSuccess: (updated) => {
            invalidate();
            setViewing(updated);
          },
        }
      );
    }
  }

  function handleTriggerAiAssist(
    enquiryId: number,
    focusText?: string,
    targetTab?: "ai-brief" | "reply-assist"
  ) {
    let combinedPrompt = focusText || designerPrompt || undefined;
    if (attachedProposal && (targetTab === "reply-assist" || activeTab === "reply-assist")) {
      const shareUrl = getProdShareUrl(attachedProposal.shareToken, "itinerary");
      const pDays = parseDays(attachedProposal.days);
      const daysCount = pDays.length > 0 ? pDays.length : 7;
      const proposalContext = `Note: Itinerary Proposal "${attachedProposal.title}" (${daysCount} days in ${attachedProposal.destination || 'Kerala'}) is attached with private client link ${shareUrl}. Please weave a warm, personalized reference to this curated proposal into the reply and invite the guest to explore their day plans and curated stays.`;
      combinedPrompt = combinedPrompt ? `${combinedPrompt}\n\n${proposalContext}` : proposalContext;
    }

    assistMutation.mutate(
      {
        id: enquiryId,
        data: {
          focusPrompt: combinedPrompt,
          replyTone,
        },
      },
      {
        onSuccess: (data) => {
          setAiResults((prev) => ({ ...prev, [enquiryId]: data }));
          setEditedSubject(
            attachedProposal
              ? `Your Curated Itinerary Proposal: ${attachedProposal.title} — Escora Holidays`
              : data.suggestedReply.subject
          );

          let body = `${data.suggestedReply.greeting}\n\n${data.suggestedReply.body}\n\n${data.suggestedReply.signoff}`;
          if (attachedProposal && !body.includes(attachedProposal.shareToken)) {
            const shareUrl = getProdShareUrl(attachedProposal.shareToken, "itinerary");
            const pDays = parseDays(attachedProposal.days);
            const daysCount = pDays.length > 0 ? pDays.length : 7;
            const proposalSnippet = `\n\n✨ Curated Itinerary Proposal: "${attachedProposal.title}"\n• Pacing: ${daysCount} Days / ${Math.max(0, daysCount - 1)} Nights\n• Interactive Proposal Link: ${shareUrl}\n\n`;
            if (data.suggestedReply.signoff && body.includes(data.suggestedReply.signoff)) {
              body = `${data.suggestedReply.greeting}\n\n${data.suggestedReply.body}${proposalSnippet}${data.suggestedReply.signoff}`;
            } else {
              body = `${body}${proposalSnippet}`;
            }
          }

          setEditedBody(body);
          if (targetTab) {
            setActiveTab(targetTab);
          } else if (activeTab === "details") {
            setActiveTab("ai-brief");
          }
          setRefinePrompt("");
          toast({
            title: "AI Analysis Complete",
            description: "Executive briefing, preferences extraction, and reply draft prepared.",
          });
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.error || err?.message || "Failed to generate AI assistance";
          toast({
            title: "AI Assistant Request Failed",
            description: msg,
            variant: "destructive",
          });
        },
      }
    );
  }

  function handleStatusChange(id: number, status: string) {
    updateMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: (updated) => {
          invalidate();
          if (viewing && viewing.id === id) {
            setViewing(updated);
          }
          toast({ title: `Message marked as ${status}` });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteTarget(null);
          if (viewing && viewing.id === id) {
            setViewing(null);
          }
          toast({ title: "Contact message deleted" });
        },
        onError: () => toast({ title: "Failed to delete message", variant: "destructive" }),
      }
    );
  }

  // Real summary counts over all inbox records
  const counts = useMemo(() => {
    if (!enquiries) return { total: 0, unread: 0, read: 0, replied: 0, converted: 0 };
    return {
      total: enquiries.length,
      unread: enquiries.filter((e) => e.status === "new").length,
      read: enquiries.filter((e) => e.status === "read").length,
      replied: enquiries.filter((e) => e.status === "replied").length,
      converted: enquiries.filter((e) => e.status === "converted").length,
    };
  }, [enquiries]);

  // Filtered and sorted messages
  const filtered = useMemo(() => {
    if (!enquiries) return [];

    return enquiries
      .filter((e) => {
        // Search by sender name, email, phone, or message content
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = e.name.toLowerCase().includes(q);
          const matchEmail = e.email.toLowerCase().includes(q);
          const matchPhone = (e.phone ?? "").toLowerCase().includes(q);
          const matchMessage = e.message.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchPhone && !matchMessage) {
            return false;
          }
        }

        // Status filter
        if (filterStatus !== "all" && e.status !== filterStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [enquiries, searchTerm, filterStatus, sortOrder]);

  const hasActiveFilters = searchTerm.trim() !== "" || filterStatus !== "all" || sortOrder !== "newest";

  function copyEmailAddress(email: string) {
    navigator.clipboard.writeText(email).then(
      () => toast({ title: "Email copied to clipboard", description: email }),
      () => toast({ title: "Could not copy email", variant: "destructive" })
    );
  }

  const handleOpenCreateProposal = (enq: Enquiry) => {
    const prefill = extractPrefillFromEnquiry(enq, aiResults[enq.id]);
    setAiPrefillData(prefill);
    setShowAiItineraryModal(true);
  };

  const handleApplyAiDraft = async (
    draft: any,
    extra?: {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      startDate?: string;
      enquiryId?: number;
    }
  ) => {
    if (!viewing) return;
    const finalEnquiryId = extra?.enquiryId || viewing.id;
    const guestName = extra?.customerName?.trim() || viewing.name || "Valued Guest";
    const guestEmail = extra?.customerEmail?.trim() || viewing.email || undefined;
    const guestPhone = extra?.customerPhone?.trim() || viewing.phone || undefined;
    const journeyTitle = draft.title?.trim() || `Curated Journey for ${guestName}`;
    const journeyDestination = draft.destination?.trim() || "Kerala";

    // Format days and stays safely
    const start = extra?.startDate ? new Date(extra.startDate) : null;
    const formattedDays = (draft.days || []).map((d: any, idx: number) => {
      let dateStr = d.date || "";
      if (!dateStr && start && !Number.isNaN(start.getTime())) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + idx);
        dateStr = dayDate.toISOString().split("T")[0];
      }
      return {
        day: idx + 1,
        date: dateStr,
        title: d.title || `Day ${idx + 1}`,
        description: d.description || "",
        activities: (d.activities || []).map((a: any) => ({
          time: a.time || "Morning",
          title: a.title || "",
          description: a.description || "",
        })),
      };
    });

    const formattedStays = (draft.stays || []).map((s: any) => ({
      name: s.name || "Heritage Resort",
      location: s.location || journeyDestination,
      checkIn: s.checkIn || "",
      checkOut: s.checkOut || "",
      nights: s.nights || 2,
      roomType: s.roomType || "Luxury Suite",
      notes: s.notes || "",
    }));

    const defaultPricing = {
      items: [
        {
          title: "Bespoke Experiential Journey Package",
          cost: 0,
          notes: "Includes curated accommodations, private chauffeur transfers, and guided excursions",
          gstPercent: 5,
        },
      ],
      total: 0,
    };

    const payload: any = {
      customerName: guestName,
      customerEmail: guestEmail,
      customerPhone: guestPhone,
      title: journeyTitle,
      destination: journeyDestination,
      startDate: extra?.startDate?.trim() || undefined,
      coverImageUrl: draft.coverImageUrl || undefined,
      summary: draft.summary?.trim() || undefined,
      currency: "INR",
      status: "draft",
      days: JSON.stringify(formattedDays),
      stays: JSON.stringify(formattedStays),
      pricing: JSON.stringify(defaultPricing),
      inclusions: JSON.stringify((draft.inclusions || []).map((s: string) => s.trim()).filter(Boolean)),
      exclusions: JSON.stringify((draft.exclusions || []).map((s: string) => s.trim()).filter(Boolean)),
      referenceNumber: generateProposalReferenceNumber({ enquiryId: finalEnquiryId }),
      enquiryId: finalEnquiryId,
    };

    try {
      const created = await createItineraryMutation.mutateAsync({ data: payload });
      qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
      await refetchLinkedProposals();
      setAttachedProposalId(created.id);
      setNewlyCreatedProposalId(created.id);
      setShowAiItineraryModal(false);
      setActiveTab("proposals");

      toast({
        title: "Proposal Created & Linked ✨",
        description: `Itinerary "${created.title}" successfully created and linked to ${guestName}.`,
      });
      return created;
    } catch (err: any) {
      console.error("Failed to persist itinerary", err);
      toast({
        title: "Failed to Save Proposal",
        description: err?.message || "Please check required fields and try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleReplyWithProposal = (proposal: Itinerary) => {
    setAttachedProposalId(proposal.id);
    setActiveTab("reply-assist");

    const shareUrl = getProdShareUrl(proposal.shareToken, "itinerary");
    const pDays = parseDays(proposal.days);
    const dayCount = pDays.length > 0 ? pDays.length : 7;
    const nights = Math.max(0, dayCount - 1);

    if (!editedSubject || editedSubject.startsWith("Re: Your inquiry") || editedSubject.includes("inquiry — Escora")) {
      setEditedSubject(`Your Curated Journey Proposal: ${proposal.title} — Escora Holidays`);
    }

    const proposalRefBlock = `✨ Curated Itinerary: "${proposal.title}"\n• Pacing: ${dayCount} Days / ${nights} Nights in ${proposal.destination || "Kerala"}\n• Private Client Proposal Link: ${shareUrl}\n${proposal.summary ? `• Overview: ${proposal.summary}\n` : ""}\nYou can explore your full day-by-day journey, curated resort stays, and bespoke inclusions online via the link above. Complete PDF documentation is also available.`;

    if (!editedBody.trim()) {
      const fullBody = `Dear ${viewing?.name || "Guest"},\n\nThank you for reaching out to Escora Holidays. We are delighted to share a bespoke slow-luxury journey crafted specifically for your upcoming travel:\n\n${proposalRefBlock}\n\nPlease take a moment to review this itinerary. Our travel designers are delighted to fine-tune any destinations, activities, or dates to ensure your journey is effortless and extraordinary.\n\nWarm regards,\nTravel Design Concierge\nEscora Holidays`;
      setEditedBody(fullBody);
    } else if (!editedBody.includes(proposal.shareToken) && !editedBody.includes(proposal.title)) {
      setEditedBody((prev) => `${prev.trim()}\n\n---\n${proposalRefBlock}`);
    }

    toast({
      title: "Itinerary Attached to Reply Draft ✨",
      description: `Referenced "${proposal.title}" in Reply Assistant.`,
    });
  };

  const handleSendReplyAndMarkReplied = (channel: "email" | "whatsapp") => {
    if (!viewing || isSendingReply) return;

    if (channel === "email") {
      if (!viewing.email) {
        toast({ title: "No email address found for this inquiry", variant: "destructive" });
        return;
      }
      if (!editedBody.trim()) {
        toast({ title: "Draft body is empty", description: "Please enter or generate a reply message first.", variant: "destructive" });
        return;
      }

      setIsSendingReply(true);
      window.location.href = `mailto:${viewing.email}?subject=${encodeURIComponent(
        editedSubject || `Re: Your inquiry — Escora Holidays`
      )}&body=${encodeURIComponent(editedBody)}`;

      if (viewing.status !== "replied") {
        updateMutation.mutate(
          { id: viewing.id, data: { status: "replied" } },
          {
            onSuccess: (updated) => {
              invalidate();
              setViewing(updated);
              setIsSendingReply(false);
              toast({
                title: "Email Client Opened & Marked as Replied ✨",
                description: `Sent proposal reply to ${viewing.email}.`,
              });
            },
            onError: () => {
              setIsSendingReply(false);
              toast({
                title: "Email opened, but could not update status",
                description: "You can manually update status to Replied.",
                variant: "destructive",
              });
            },
          }
        );
      } else {
        setIsSendingReply(false);
        toast({
          title: "Email Client Opened",
          description: `Dispatched reply to ${viewing.email}.`,
        });
      }
    } else if (channel === "whatsapp") {
      if (!viewing.phone) {
        toast({ title: "No phone number available for WhatsApp", variant: "destructive" });
        return;
      }

      const cleanPhone = viewing.phone.replace(/[^0-9]/g, "");
      if (!cleanPhone) {
        toast({ title: "Invalid phone number format", variant: "destructive" });
        return;
      }

      setIsSendingReply(true);
      const shareUrl = attachedProposal ? getProdShareUrl(attachedProposal.shareToken, "itinerary") : "";
      const waMsg =
        editedBody.trim() ||
        `Hi ${viewing.name}, thank you for contacting Escora Holidays. Here is your bespoke itinerary proposal: "${attachedProposal?.title || "Your Curated Journey"}"${shareUrl ? `\n\nView Online: ${shareUrl}` : ""}`;

      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`, "_blank");

      if (viewing.status !== "replied") {
        updateMutation.mutate(
          { id: viewing.id, data: { status: "replied" } },
          {
            onSuccess: (updated) => {
              invalidate();
              setViewing(updated);
              setIsSendingReply(false);
              toast({
                title: "WhatsApp Opened & Marked as Replied ✨",
                description: `Dispatched WhatsApp reply to ${viewing.phone}.`,
              });
            },
            onError: () => {
              setIsSendingReply(false);
              toast({
                title: "WhatsApp opened, but could not update status",
                description: "You can manually update status to Replied.",
                variant: "destructive",
              });
            },
          }
        );
      } else {
        setIsSendingReply(false);
        toast({
          title: "WhatsApp Concierge Opened",
          description: `Dispatched WhatsApp reply to ${viewing.phone}.`,
        });
      }
    }
  };

  const openProposalPreview = (proposal: Itinerary) => {
    setViewingProposal(proposal);
  };

  const handleEditProposal = (proposal: Itinerary) => {
    setViewing(null);
    navigate(`/itineraries/${proposal.id}/edit?fromEnquiry=${viewing?.id}`);
  };

  const handleDeleteProposal = (proposal: Itinerary) => {
    deleteItineraryMutation.mutate(
      { id: proposal.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
          refetchLinkedProposals();
          if (attachedProposalId === proposal.id) {
            setAttachedProposalId(null);
          }
          if (newlyCreatedProposalId === proposal.id) {
            setNewlyCreatedProposalId(null);
          }
          if (viewingProposal?.id === proposal.id) {
            setViewingProposal(null);
          }
          setDeleteProposalTarget(null);
          toast({
            title: "Proposal Deleted",
            description: `Proposal "${proposal.title}" was removed.`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to delete proposal",
            description: err?.message || "Could not delete itinerary proposal.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCopyShareLink = (proposal: Itinerary) => {
    if (proposal.status === "draft") {
      updateItineraryMutation.mutate(
        { id: proposal.id, data: { status: "shared" } },
        {
          onSuccess: () => {
            refetchLinkedProposals();
            const url = getProdShareUrl(proposal.shareToken, "itinerary");
            navigator.clipboard.writeText(url);
            toast({
              title: "Proposal updated to Shared and link copied",
              description: url,
            });
          },
          onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
        }
      );
    } else {
      const url = getProdShareUrl(proposal.shareToken, "itinerary");
      navigator.clipboard.writeText(url);
      toast({
        title: "Proposal link copied to clipboard",
        description: url,
      });
    }
  };

  const handleShareViaEmail = (proposal: Itinerary) => {
    if (!viewing) return;
    const shareUrl = getProdShareUrl(proposal.shareToken, "itinerary");
    const subject = `Your Escora Holidays Itinerary Proposal: ${proposal.title}`;
    const body = `Dear ${viewing.name},\n\nWe have prepared a bespoke luxury travel itinerary for your upcoming journey: "${proposal.title}".\n\nYou can view and explore your complete day-by-day itinerary, curated accommodations, inclusions, and investment details online here:\n${shareUrl}\n\nPlease let us know if you would like any personal adjustments.\n\nWarm regards,\nEscora Holidays`;
    window.open(`mailto:${viewing.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleShareViaWhatsApp = (proposal: Itinerary) => {
    if (!viewing?.phone) return;
    const shareUrl = getProdShareUrl(proposal.shareToken, "itinerary");
    const cleanPhone = viewing.phone.replace(/[^0-9]/g, "");
    const msg = `Hi ${viewing.name}, here is your curated Escora Holidays itinerary proposal: "${proposal.title}". You can view it here: ${shareUrl}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  async function handleDownloadPdf(itinerary: Itinerary) {
    const filename = formatItineraryPdfFilename(itinerary.title);
    try {
      setDownloadingProposalId(itinerary.id);
      flushSync(() => setPrintingProposal(itinerary));
      await downloadElementAsPdf("enquiry-proposal-print-target", filename);
      toast({
        title: "Itinerary PDF Downloaded",
        description: `Saved "${filename}"`,
      });
    } catch (err) {
      console.error("Failed to download PDF", err);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingProposalId(null);
      setPrintingProposal(null);
    }
  }

  const handleCloseModal = () => {
    setViewing(null);
    if (typeof window !== "undefined" && window.location.search) {
      const url = new URL(window.location.href);
      url.searchParams.delete("viewEnquiry");
      url.searchParams.delete("createdProposalId");
      const cleanSearch = url.searchParams.toString();
      window.history.replaceState({}, "", url.pathname + (cleanSearch ? `?${cleanSearch}` : ""));
    }
  };

  return (
    <div data-testid="enquiries-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Contact Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guest inquiries submitted via the website contact form (<code className="text-xs">/contact</code>) and footer.
          </p>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Messages Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary/50 ${
            filterStatus === "all" ? "border-primary bg-primary/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus("all")}
          title="Show All Messages"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Messages</span>
              <p className="text-2xl font-serif font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.total}
              </p>
              <span className="text-[10px] text-muted-foreground block">Total inquiries received</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Inbox className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Unread / New Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
            filterStatus === "new" ? "border-emerald-500 bg-emerald-500/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "new" ? "all" : "new")}
          title="Filter by New / Unread Messages"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unread</span>
              <p className="text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.unread}
              </p>
              <span className="text-[10px] text-muted-foreground block">Pending initial review</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Read Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-border/80 ${
            filterStatus === "read" ? "border-foreground bg-muted/20 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "read" ? "all" : "read")}
          title="Filter by Read Messages"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Read</span>
              <p className="text-2xl font-serif font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.read}
              </p>
              <span className="text-[10px] text-muted-foreground block">Reviewed, awaiting reply</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Replied Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-blue-500/50 ${
            filterStatus === "replied" ? "border-blue-500 bg-blue-500/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "replied" ? "all" : "replied")}
          title="Filter by Replied Messages"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Replied</span>
              <p className="text-2xl font-serif font-bold text-blue-700 dark:text-blue-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.replied}
              </p>
              <span className="text-[10px] text-muted-foreground block">Response sent</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Converted Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-purple-500/50 ${
            filterStatus === "converted" ? "border-purple-500 bg-purple-500/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "converted" ? "all" : "converted")}
          title="Filter by Converted Enquiries"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Converted</span>
              <p className="text-2xl font-serif font-bold text-purple-700 dark:text-purple-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.converted}
              </p>
              <span className="text-[10px] text-muted-foreground block">Active bookings created</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-lg border border-border">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sender name, email, or message text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter and Sort controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status select */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({counts.total})</SelectItem>
              <SelectItem value="new">New ({counts.unread})</SelectItem>
              <SelectItem value="read">Read ({counts.read})</SelectItem>
              <SelectItem value="replied">Replied ({counts.replied})</SelectItem>
              <SelectItem value="converted">Converted ({counts.converted})</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort order select */}
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
            <SelectTrigger className="w-[145px]">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Sort Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setSortOrder("newest");
              }}
              className="text-xs text-muted-foreground hover:text-foreground h-9"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <AlertTitle>Failed to load contact messages</AlertTitle>
              <AlertDescription className="text-xs">There was an issue connecting to the database.</AlertDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/40 hover:bg-destructive/10">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </Alert>
      )}

      {/* Messages Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[230px]">Sender</TableHead>
              <TableHead className="min-w-[260px]">Message Preview</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[130px] text-right">Received</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : enquiries && enquiries.length === 0 ? (
              /* Database has 0 contact records */
              <TableRow>
                <TableCell colSpan={5} className="h-56 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-foreground">Contact Inbox is Empty</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Inquiries submitted from the public website contact page (<code className="text-[11px]">/contact</code>) will appear here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              /* Filter / search matched 0 */
              <TableRow>
                <TableCell colSpan={5} className="h-44 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-6 w-6 text-muted-foreground/60" />
                    <p className="font-medium text-foreground text-sm">No matching messages found</p>
                    <p className="text-xs text-muted-foreground">
                      Try clearing your search term or selecting a different status filter.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                        setSortOrder("newest");
                      }}
                      className="mt-2 text-xs"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => {
                const isUnread = e.status === "new";

                return (
                  <TableRow
                    key={e.id}
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                      isUnread ? "bg-primary/5 font-medium" : ""
                    }`}
                    onClick={() => openMessage(e)}
                  >
                    {/* Sender Info */}
                    <TableCell className="align-top py-3.5">
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0"
                            title="Unread message"
                          />
                        )}
                        <span className={`text-sm ${isUnread ? "font-semibold text-foreground" : "text-foreground"}`}>
                          {e.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5" onClick={(ev) => ev.stopPropagation()}>
                        <a
                          href={`mailto:${e.email}`}
                          className="hover:text-foreground flex items-center gap-1.5 truncate max-w-[210px]"
                          title={e.email}
                        >
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{e.email}</span>
                        </a>
                        {e.phone && (
                          <a
                            href={`tel:${e.phone}`}
                            className="hover:text-foreground flex items-center gap-1.5"
                          >
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{e.phone}</span>
                          </a>
                        )}
                      </div>
                    </TableCell>

                    {/* Message Preview */}
                    <TableCell className="align-top py-3.5 max-w-md">
                      {(e.packageName || e.destinations) && (
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-medium">
                            {e.packageName || e.destinations}
                          </Badge>
                          {e.travelDate && (
                            <span className="text-[10px] text-muted-foreground">
                              · {e.travelDate}
                            </span>
                          )}
                          {e.guestCount && (
                            <span className="text-[10px] text-muted-foreground">
                              · {e.guestCount} {e.guestCount === 1 ? "Guest" : "Guests"}
                            </span>
                          )}
                          {e.budgetRange && (
                            <span className="text-[10px] text-muted-foreground">
                              · {e.budgetRange}{e.currency ? ` (${e.currency})` : ""}
                            </span>
                          )}
                        </div>
                      )}
                      <p className={`text-sm line-clamp-2 leading-relaxed ${isUnread ? "text-foreground font-normal" : "text-muted-foreground"}`}>
                        {e.message}
                      </p>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="align-top py-3.5">
                      {renderEnquiryStatusBadge(e.status)}
                    </TableCell>

                    {/* Received Date */}
                    <TableCell className="align-top py-3.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top py-3.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openMessage(e)}
                          title="View message details"
                          data-testid={`button-view-enquiry-${e.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(e)}
                          title="Delete message"
                          data-testid={`button-delete-enquiry-${e.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ============================================================
          VIEW MESSAGE & AI ENQUIRY ASSISTANT MODAL
      ============================================================ */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-xl sm:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="font-serif text-xl flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Message from {viewing?.name}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Reference #{viewing?.id} · Received{" "}
                  {viewing
                    ? new Date(viewing.createdAt).toLocaleString("en-IN", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })
                    : ""}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {viewing && viewing.status === "converted" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-purple-500/40 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 gap-1.5 cursor-pointer shadow-2xs font-semibold"
                    onClick={() => {
                      setViewing(null);
                      navigate(`/orders${viewing.bookingId ? `?id=${viewing.bookingId}` : ""}`);
                    }}
                    title="View linked booking in Bookings"
                    data-testid="button-view-linked-booking"
                  >
                    <ShoppingBag className="h-3 w-3 text-purple-600" />
                    View Booking {viewing.bookingReference ? `(${viewing.bookingReference})` : ""}
                  </Button>
                ) : viewing ? (
                  <Button
                    size="sm"
                    className="text-xs h-7 bg-[#24543D] hover:bg-[#1b402e] text-[#FAF7F1] gap-1.5 cursor-pointer shadow-2xs font-medium"
                    onClick={() => {
                      setConvertSelectedProposal(linkedProposals[0] || undefined);
                      setShowConvertModal(true);
                    }}
                    title="Convert this enquiry directly into an official Escora booking"
                    data-testid="button-convert-to-booking"
                  >
                    <ShoppingBag className="h-3 w-3" /> Convert to Booking
                  </Button>
                ) : null}
                {viewing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-[#855A18]/30 text-[#855A18] hover:bg-[#855A18]/10 gap-1.5 cursor-pointer shadow-2xs font-medium"
                    onClick={() => handleOpenCreateProposal(viewing)}
                    title="Open AI Itinerary Creator prefilled with enquiry details"
                  >
                    <Sparkles className="h-3 w-3 text-[#855A18]" /> Create Proposal
                  </Button>
                )}
                {viewing && renderEnquiryStatusBadge(viewing.status)}
                {viewing && aiResults[viewing.id] && (
                  <Badge variant="outline" className="bg-[#24543D]/10 text-[#24543D] border-[#24543D]/25 text-[11px] font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#24543D]" /> AI Brief Ready
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {viewing && (
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "details" | "ai-brief" | "reply-assist" | "proposals")}
              className="w-full"
            >
              {/* Single Navigation Row (No duplicate action buttons beside tabs) */}
              <div className="px-6 pt-3 pb-2 border-b bg-muted/10">
                <TabsList className="bg-muted/60 p-1 flex-wrap h-auto">
                  <TabsTrigger value="details" className="text-xs font-medium">
                    <Mail className="h-3.5 w-3.5 mr-1.5" /> Message Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai-brief"
                    className="text-xs font-medium relative data-[state=active]:text-[#24543D] data-[state=active]:bg-[#24543D]/10 data-[state=active]:font-semibold"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#24543D]" /> AI Brief
                    {aiResults[viewing.id] && (
                      <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#24543D] inline-block" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="reply-assist"
                    className="text-xs font-medium relative data-[state=active]:text-[#304F7D] data-[state=active]:bg-[#304F7D]/10 data-[state=active]:font-semibold"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5 text-[#304F7D]" /> Reply Assistant
                    {editedBody && (
                      <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#304F7D] inline-block" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="proposals"
                    className="text-xs font-medium relative data-[state=active]:text-[#855A18] data-[state=active]:bg-[#855A18]/10 data-[state=active]:font-semibold"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5 text-[#855A18]" /> Proposals ({linkedProposals.length})
                    {linkedProposals.length > 0 && (
                      <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#855A18] inline-block" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: MESSAGE DETAILS */}
              <TabsContent value="details" className="m-0 p-6 space-y-5 text-sm">
                {/* Converted Booking Banner */}
                {viewing.status === "converted" && (
                  <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-purple-600" />
                        <span className="font-serif font-semibold text-foreground text-sm">
                          Enquiry Converted to Booking
                        </span>
                        {viewing.bookingReference && (
                          <Badge className="bg-purple-600/10 text-purple-700 border-purple-300 font-mono text-xs">
                            {viewing.bookingReference}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This enquiry was successfully finalized and converted into an official booking record
                        {viewing.convertedAt ? ` on ${new Date(viewing.convertedAt).toLocaleString("en-IN")}` : ""}
                        {viewing.convertedBy ? ` by ${viewing.convertedBy}` : ""}.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-purple-700 hover:bg-purple-800 text-white gap-1.5 shadow-xs cursor-pointer shrink-0"
                      onClick={() => {
                        setViewing(null);
                        navigate(`/orders${viewing.bookingId ? `?id=${viewing.bookingId}` : ""}`);
                      }}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> View in Bookings
                    </Button>
                  </div>
                )}

                {/* Sender Details Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/10 p-4 rounded-lg border">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                      Sender Name
                    </span>
                    <span className="font-medium text-foreground text-base block mt-0.5">
                      {viewing.name}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                        Email Address
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`mailto:${viewing.email}?subject=Re: Your inquiry — Escora Holidays`}
                          className="font-medium text-foreground hover:underline flex items-center gap-1.5"
                        >
                          <Mail className="h-3.5 w-3.5 text-primary" /> {viewing.email}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyEmailAddress(viewing.email)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Copy Email Address"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {viewing.phone && (
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                          Phone Number
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:${viewing.phone}`}
                            className="font-medium text-foreground hover:underline flex items-center gap-1.5"
                          >
                            <Phone className="h-3.5 w-3.5 text-primary" /> {viewing.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(viewing.phone!);
                              toast({ title: "Phone number copied" });
                            }}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy Phone Number"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Journey & Package Details Card */}
                {(viewing.packageName || viewing.destinations || viewing.travelDate) && (
                  <div className="p-4 rounded-lg border border-[#24543D]/20 bg-[#24543D]/5 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#24543D] flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-[#24543D]" />
                        Requested Journey &amp; Package
                      </span>
                      {viewing.packageName && (
                        <Badge className="bg-[#24543D]/10 text-[#24543D] border-[#24543D]/20 text-[10px] font-medium">
                          {viewing.packageName}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      {viewing.destinations && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Destinations</span>
                          <span className="font-medium text-foreground">{viewing.destinations}</span>
                        </div>
                      )}
                      {viewing.travelDate && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Arrival Date</span>
                          <span className="font-medium text-foreground">{viewing.travelDate}</span>
                        </div>
                      )}
                      {viewing.guestCount && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Travellers</span>
                          <span className="font-medium text-foreground">{viewing.guestCount} Guests</span>
                        </div>
                      )}
                      {viewing.travelStyle && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Style</span>
                          <span className="font-medium text-foreground">{viewing.travelStyle}</span>
                        </div>
                      )}
                      {viewing.budgetRange && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Budget</span>
                          <span className="font-medium text-foreground">
                            {viewing.budgetRange}
                            {viewing.currency && (
                              <span className="ml-1.5 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#24543D]/10 text-[#24543D]">
                                {viewing.currency}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {!viewing.budgetRange && viewing.currency && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Currency</span>
                          <span className="font-medium text-foreground">{viewing.currency}</span>
                        </div>
                      )}
                    </div>
                    {viewing.specialRequests && (
                      <div className="pt-2 border-t border-[#24543D]/15 text-xs">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Special Requests</span>
                        <p className="text-foreground mt-0.5">{viewing.specialRequests}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div className="space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground block font-semibold">
                    Message Content
                  </span>
                  <div className="p-4 rounded-lg bg-card border text-foreground leading-relaxed whitespace-pre-wrap text-sm font-sans shadow-2xs min-h-[120px]">
                    {viewing.message}
                  </div>
                </div>

                {/* Automated Follow-Up Status */}
                <div className="p-3.5 rounded-lg border bg-muted/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      Automated Customer Follow-Up
                    </span>
                    {enquiryNotifications.length > 0 && (
                      <Badge
                        variant="outline"
                        className={
                          enquiryNotifications[0].status === "delivered"
                            ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px]"
                            : enquiryNotifications[0].status === "accepted" || enquiryNotifications[0].status === "sent"
                            ? "border-sky-500/30 text-sky-600 bg-sky-500/10 text-[10px]"
                            : enquiryNotifications[0].status === "simulated"
                            ? "border-purple-500/30 text-purple-600 bg-purple-500/10 text-[10px]"
                            : enquiryNotifications[0].status === "pending"
                            ? "border-amber-500/30 text-amber-600 bg-amber-500/10 text-[10px]"
                            : enquiryNotifications[0].status === "bounced"
                            ? "border-orange-500/30 text-orange-600 bg-orange-500/10 text-[10px]"
                            : enquiryNotifications[0].status === "failed"
                            ? "border-red-500/30 text-red-600 bg-red-500/10 text-[10px]"
                            : "border-zinc-500/30 text-zinc-500 text-[10px]"
                        }
                      >
                        {enquiryNotifications[0].status === "pending"
                          ? `Scheduled (${new Date(enquiryNotifications[0].scheduledFor).toLocaleDateString()})`
                          : enquiryNotifications[0].status === "delivered"
                          ? "Delivered (Confirmed)"
                          : enquiryNotifications[0].status === "accepted" || enquiryNotifications[0].status === "sent"
                          ? "Accepted by Mail Relay"
                          : enquiryNotifications[0].status === "simulated"
                          ? "Simulated"
                          : enquiryNotifications[0].status === "bounced"
                          ? "Bounced"
                          : enquiryNotifications[0].status === "failed"
                          ? "Failed"
                          : enquiryNotifications[0].status === "cancelled"
                          ? "Cancelled (Resolved)"
                          : enquiryNotifications[0].status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {enquiryNotifications.length === 0
                      ? "A gentle follow-up email is scheduled automatically if the enquiry is pending and customer has not booked."
                      : enquiryNotifications[0].status === "pending"
                      ? `Follow-up will dispatch on ${new Date(enquiryNotifications[0].scheduledFor).toLocaleString()} if unresolved.`
                      : enquiryNotifications[0].status === "cancelled"
                      ? `Follow-up cancelled: ${enquiryNotifications[0].error || "Customer replied or booked."}`
                      : enquiryNotifications[0].status === "delivered"
                      ? `Follow-up confirmed delivered on ${new Date(enquiryNotifications[0].deliveredAt || enquiryNotifications[0].sentAt || enquiryNotifications[0].updatedAt).toLocaleString()}.`
                      : enquiryNotifications[0].status === "accepted" || enquiryNotifications[0].status === "sent"
                      ? `Follow-up accepted by mail relay on ${new Date(enquiryNotifications[0].sentAt || enquiryNotifications[0].updatedAt).toLocaleString()} (check Spam/Junk if not in inbox).`
                      : enquiryNotifications[0].status === "simulated"
                      ? `Follow-up simulated (mock mode) on ${new Date(enquiryNotifications[0].sentAt || enquiryNotifications[0].updatedAt).toLocaleString()}.`
                      : enquiryNotifications[0].status === "bounced"
                      ? `Follow-up bounced: ${enquiryNotifications[0].error || "Mailbox rejected message."}`
                      : enquiryNotifications[0].status === "failed"
                      ? `Follow-up failed: ${enquiryNotifications[0].error || "Delivery error."}`
                      : `Status: ${enquiryNotifications[0].status}`}
                  </p>
                </div>

                {/* Status Selector & Management */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Current Status:</span>
                    <Select
                      value={viewing.status}
                      onValueChange={(val) => handleStatusChange(viewing.id, val)}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New (Unread)</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {viewing.status !== "converted" && (
                      <Button
                        type="button"
                        size="sm"
                        className="text-xs h-8 bg-[#24543D] hover:bg-[#1b402e] text-[#FAF7F1] gap-1.5 shadow-xs cursor-pointer font-medium"
                        onClick={() => {
                          setConvertSelectedProposal(linkedProposals[0] || undefined);
                          setShowConvertModal(true);
                        }}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Convert to Booking
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs h-8 bg-[#855A18] hover:bg-[#6c4812] text-[#FAF7F1] gap-1.5 shadow-xs cursor-pointer"
                      onClick={() => handleOpenCreateProposal(viewing)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Create Proposal
                    </Button>
                    {viewing.status !== "replied" && viewing.status !== "converted" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-8 self-start sm:self-auto cursor-pointer"
                        onClick={() => handleStatusChange(viewing.id, "replied")}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Mark as Replied
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: AI EXECUTIVE BRIEF */}
              <TabsContent value="ai-brief" className="m-0 p-6 space-y-5 text-sm">
                {/* Header & Re-Analysis Action (Only when brief exists) */}
                {aiResults[viewing.id] && !assistMutation.isPending && (
                  <div className="bg-[#24543D]/5 border border-[#24543D]/20 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-serif font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[#24543D]" />
                        Executive AI Brief &amp; Preference Extraction
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Synthesized facts, travel parameters, destination matches, and information gaps.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-[#24543D]/30 text-[#24543D] hover:bg-[#24543D]/10 gap-1.5 shrink-0"
                      onClick={() => handleTriggerAiAssist(viewing.id, undefined, "ai-brief")}
                      disabled={assistMutation.isPending}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1 text-[#24543D]" />
                      Re-Analyze Brief
                    </Button>
                  </div>
                )}

                {/* Loading State */}
                {assistMutation.isPending && (
                  <div className="p-8 border border-dashed border-[#24543D]/30 rounded-lg text-center space-y-3 bg-[#24543D]/5">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#24543D]" />
                    <p className="font-serif text-sm font-medium text-foreground">
                      Synthesizing Executive Brief &amp; Extracting Guest Preferences...
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Extracting facts, checking destination catalog, and assessing guest parameters.
                    </p>
                  </div>
                )}

                {/* Empty State: Clear primary action when no brief exists */}
                {!aiResults[viewing.id] && !assistMutation.isPending && (
                  <div className="p-8 border border-dashed border-[#24543D]/30 rounded-lg text-center space-y-3 bg-[#24543D]/5">
                    <div className="w-10 h-10 rounded-full bg-[#24543D]/10 text-[#24543D] border border-[#24543D]/20 flex items-center justify-center mx-auto">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-base font-medium text-foreground">
                      Ready to Generate AI Executive Brief
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Click below to generate an executive summary, extract explicit preferences, highlight unanswered customer questions, and reveal information gaps.
                    </p>
                    <Button
                      onClick={() => handleTriggerAiAssist(viewing.id, undefined, "ai-brief")}
                      className="text-xs mt-2 bg-[#24543D] hover:bg-[#1c4330] text-[#FAF7F1] gap-1.5 shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Generate AI Executive Brief
                    </Button>
                  </div>
                )}

                {/* Analyzed Brief Content */}
                {aiResults[viewing.id] && !assistMutation.isPending && (
                  <div className="space-y-4">
                    {/* Executive Summary Card */}
                    <Card className="border shadow-2xs">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h5 className="font-serif font-semibold text-sm flex items-center gap-1.5 text-foreground">
                            <Lightbulb className="h-4 w-4 text-[#24543D]" />
                            Executive Summary &amp; Extracted Preferences
                          </h5>
                          <Badge variant="outline" className="text-[10px] bg-[#24543D]/10 text-[#24543D] border-[#24543D]/25">
                            Verified Analysis
                          </Badge>
                        </div>

                        <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-3 rounded-md">
                          {aiResults[viewing.id].summary.overview}
                        </p>

                        {/* Explicit Facts Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-medium uppercase text-muted-foreground block">
                              Destinations
                            </span>
                            <span className="font-medium text-foreground">
                              {aiResults[viewing.id].summary.destinations.length > 0
                                ? aiResults[viewing.id].summary.destinations.join(", ")
                                : "None specified"}
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-medium uppercase text-muted-foreground block">
                              Travel Dates
                            </span>
                            <span
                              className={`font-medium ${
                                aiResults[viewing.id].summary.travelDates.includes("Unknown")
                                  ? "text-muted-foreground italic"
                                  : "text-foreground"
                              }`}
                            >
                              {aiResults[viewing.id].summary.travelDates}
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-medium uppercase text-muted-foreground block">
                              Group Size
                            </span>
                            <span
                              className={`font-medium ${
                                aiResults[viewing.id].summary.groupSize.includes("Unknown")
                                  ? "text-muted-foreground italic"
                                  : "text-foreground"
                              }`}
                            >
                              {aiResults[viewing.id].summary.groupSize}
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-medium uppercase text-muted-foreground block">
                              Budget Tier
                            </span>
                            <span
                              className={`font-medium ${
                                aiResults[viewing.id].summary.budget.includes("Unknown")
                                  ? "text-muted-foreground italic"
                                  : "text-foreground"
                              }`}
                            >
                              {aiResults[viewing.id].summary.budget}
                            </span>
                          </div>
                        </div>

                        {/* Unanswered Customer Questions */}
                        {aiResults[viewing.id].summary.unansweredQuestions.length > 0 ? (
                          <div className="p-3 rounded-md bg-[#24543D]/5 border border-[#24543D]/25 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                              <HelpCircle className="h-4 w-4 text-[#24543D] flex-shrink-0" />
                              Unanswered Customer Questions (Must Address in Reply):
                            </div>
                            <ul className="list-disc list-inside space-y-1 pl-1 text-foreground/90">
                              {aiResults[viewing.id].summary.unansweredQuestions.map(
                                (q, i) => (
                                  <li key={i}>{q}</li>
                                )
                              )}
                            </ul>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-md bg-muted/20 text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#24543D]" />
                            No direct unanswered questions asked in the message.
                          </div>
                        )}

                        {/* Missing Information Gaps */}
                        {aiResults[viewing.id].extractedPreferences.missingDetails.length >
                          0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase text-muted-foreground block font-semibold">
                              Information Gaps to Clarify with Guest:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {aiResults[viewing.id].extractedPreferences.missingDetails.map(
                                (gap, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="bg-muted/40 text-foreground border-border text-[11px]"
                                  >
                                    Need: {gap}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recommended Next Action */}
                    <Card className="border border-[#24543D]/20 bg-[#24543D]/5 shadow-2xs">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-serif font-semibold text-foreground flex items-center gap-1.5">
                            <ArrowRight className="h-4 w-4 text-[#24543D]" /> Recommended Next Action
                          </span>
                          <Badge
                            className={`text-[10px] uppercase font-semibold ${
                              aiResults[viewing.id].nextAction.priority === "high"
                                ? "bg-[#24543D] text-[#FAF7F1]"
                                : aiResults[viewing.id].nextAction.priority === "medium"
                                ? "bg-[#24543D]/10 text-[#24543D] border border-[#24543D]/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {aiResults[viewing.id].nextAction.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {aiResults[viewing.id].nextAction.recommendedAction}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {aiResults[viewing.id].nextAction.rationale}
                        </p>
                        <div className="pt-2 flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            className="text-xs h-8 bg-[#855A18] hover:bg-[#6c4812] text-[#FAF7F1] gap-1.5 shadow-xs cursor-pointer"
                            onClick={() => handleOpenCreateProposal(viewing)}
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Create Proposal with AI ✨
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 border-[#304F7D]/30 text-[#304F7D] hover:bg-[#304F7D]/10 gap-1.5 cursor-pointer"
                            onClick={() => setActiveTab("reply-assist")}
                          >
                            <Send className="h-3.5 w-3.5" /> Open Reply Assistant
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: REPLY ASSISTANT */}
              <TabsContent value="reply-assist" className="m-0 p-6 space-y-5 text-sm">
                {/* Attached Itinerary Proposal Card */}
                {attachedProposal ? (
                  <div className="bg-[#855A18]/5 border border-[#855A18]/25 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-[#855A18] text-[#FAF7F1] text-[10px] gap-1 px-2 py-0.5 font-medium">
                            <Paperclip className="h-3 w-3" /> Attached Proposal
                          </Badge>
                          <span className="font-serif font-semibold text-sm text-foreground truncate">
                            {attachedProposal.title}
                          </span>
                          {renderProposalStatusBadge(attachedProposal.status)}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          {attachedProposal.destination && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[#855A18]" /> {attachedProposal.destination}
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {parseDays(attachedProposal.days).length} Days /{" "}
                            {Math.max(0, parseDays(attachedProposal.days).length - 1)} Nights
                          </span>
                          {attachedProposal.shareToken && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                Token: {attachedProposal.shareToken.slice(0, 8).toUpperCase()}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Attached Proposal Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1 bg-background cursor-pointer"
                          onClick={() => openProposalPreview(attachedProposal)}
                          title="Open Interactive Client Proposal"
                        >
                          <Eye className="h-3 w-3" /> View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1 bg-background cursor-pointer"
                          onClick={() => handleDownloadPdf(attachedProposal)}
                          disabled={downloadingProposalId === attachedProposal.id}
                          title="Download Official Itinerary PDF"
                        >
                          {downloadingProposalId === attachedProposal.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          PDF
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1 bg-background cursor-pointer"
                          onClick={() => handleCopyShareLink(attachedProposal)}
                          title="Copy Verified Public Share Link"
                        >
                          <Copy className="h-3 w-3" /> Copy Link
                        </Button>
                      </div>
                    </div>

                    {/* Proposal Switcher if multiple proposals exist */}
                    {linkedProposals.length > 1 && (
                      <div className="pt-2 border-t border-[#855A18]/15 flex items-center justify-between text-xs flex-wrap gap-2">
                        <span className="text-muted-foreground text-[11px]">
                          Switch attached proposal ({linkedProposals.length} available):
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {linkedProposals.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleReplyWithProposal(p)}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                p.id === attachedProposal.id
                                  ? "bg-[#855A18] text-white shadow-2xs"
                                  : "bg-background border hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              #{p.id} {p.title.slice(0, 18)}...
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : linkedProposals.length > 0 ? (
                  <div className="bg-[#855A18]/5 border border-dashed border-[#855A18]/30 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#855A18]" />
                      <span>
                        <strong>{linkedProposals.length} proposal{linkedProposals.length > 1 ? "s" : ""}</strong> linked to this guest inquiry.
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 border-[#855A18]/30 text-[#855A18] hover:bg-[#855A18]/10 cursor-pointer"
                      onClick={() => handleReplyWithProposal(linkedProposals[0])}
                    >
                      Attach Proposal to Reply
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/15 border border-dashed rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>No itinerary proposal created yet for this inquiry.</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 gap-1 text-[#855A18] border-[#855A18]/30 hover:bg-[#855A18]/10 cursor-pointer"
                      onClick={() => handleOpenCreateProposal(viewing)}
                    >
                      <Sparkles className="h-3 w-3" /> Create Proposal
                    </Button>
                  </div>
                )}

                {/* Case 1: Loading State */}
                {assistMutation.isPending && (
                  <div className="p-8 border border-dashed border-[#304F7D]/30 rounded-lg text-center space-y-3 bg-[#304F7D]/5">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#304F7D]" />
                    <p className="font-serif text-sm font-medium text-foreground">
                      Drafting Tailored Customer Reply...
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Applying {replyTone === "warm-luxury" ? "warm & friendly" : replyTone} tone, addressing customer questions, and tailoring recommendations.
                    </p>
                  </div>
                )}

                {/* Case 2: No Draft Generated Yet */}
                {!editedBody && !assistMutation.isPending && (
                  <div className="bg-[#304F7D]/5 border border-[#304F7D]/20 p-5 rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-serif font-semibold text-foreground flex items-center gap-1.5">
                          <Send className="h-4 w-4 text-[#304F7D]" />
                          Reply Assistant
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Draft personalized customer replies matching Escora&apos;s luxury hospitality voice.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground">Tone:</span>
                        <Select
                          value={replyTone}
                          onValueChange={(val: any) => setReplyTone(val)}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warm-luxury">Warm &amp; Friendly</SelectItem>
                            <SelectItem value="concise">Concise</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Optional Reply Instructions or Focus Points
                      </label>
                      <Input
                        placeholder="e.g. Highlight backwater houseboat, emphasize private chef, mention December dates..."
                        value={designerPrompt}
                        onChange={(e) => setDesignerPrompt(e.target.value)}
                        className="text-xs h-9 bg-background"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleTriggerAiAssist(viewing.id, designerPrompt, "reply-assist");
                          }
                        }}
                      />
                    </div>

                    {/* Guest Context note if brief exists */}
                    {aiResults[viewing.id] && (
                      <div className="p-3 rounded-md bg-background/80 border text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Extracted Guest Context: </span>
                        {aiResults[viewing.id].summary.destinations.join(", ") || "General Inquiry"} ·{" "}
                        {aiResults[viewing.id].summary.travelDates} ·{" "}
                        Priority: <span className="capitalize text-foreground font-medium">{aiResults[viewing.id].nextAction.priority}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                      {attachedProposal ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-9 border-[#855A18]/30 text-[#855A18] hover:bg-[#855A18]/10 cursor-pointer"
                          onClick={() => handleReplyWithProposal(attachedProposal)}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Use Proposal Template Reply
                        </Button>
                      ) : (
                        <div />
                      )}

                      <Button
                        size="default"
                        className="text-xs h-9 bg-[#304F7D] hover:bg-[#233b5d] text-[#FAF7F1] gap-1.5 shadow-xs cursor-pointer"
                        onClick={() => handleTriggerAiAssist(viewing.id, designerPrompt, "reply-assist")}
                        disabled={assistMutation.isPending}
                      >
                        <Send className="h-3.5 w-3.5" /> Generate Reply Draft
                      </Button>
                    </div>
                  </div>
                )}

                {/* Case 3: Completed Editable Reply Draft Workspace */}
                {editedBody && !assistMutation.isPending && (
                  <Card className="border border-[#304F7D]/25 shadow-2xs space-y-3">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <h5 className="font-serif font-semibold text-base flex items-center gap-1.5 text-foreground">
                            <Edit3 className="h-4 w-4 text-[#304F7D]" /> Personalized Reply Draft
                          </h5>
                          <span className="text-xs text-muted-foreground">
                            Review, personalize, and choose delivery method for this guest response.
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-[#304F7D]/10 text-[#304F7D] border border-[#304F7D]/20"
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" /> Staff Review Required
                        </Badge>
                      </div>

                      {/* Subject Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                          Subject Line
                        </label>
                        <Input
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="text-xs font-medium bg-background"
                        />
                      </div>

                      {/* Reply Body Textarea */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                            Draft Message (Directly Editable)
                          </label>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {editedBody.length} characters
                          </span>
                        </div>
                        <Textarea
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          rows={10}
                          className="text-xs leading-relaxed font-sans bg-card"
                        />
                      </div>

                      {/* Delivery Channel Selector & Guidelines */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                            Choose Delivery Method
                          </label>
                          <div className="inline-flex rounded-md border p-0.5 bg-muted/20">
                            <button
                              type="button"
                              onClick={() => setReplyDeliveryChannel("email")}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                                replyDeliveryChannel === "email"
                                  ? "bg-background text-foreground shadow-2xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Mail className="h-3.5 w-3.5" /> Email
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyDeliveryChannel("whatsapp")}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                                replyDeliveryChannel === "whatsapp"
                                  ? "bg-background text-foreground shadow-2xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                            </button>
                          </div>
                        </div>

                        {replyDeliveryChannel === "email" ? (
                          <div className="rounded-md bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 p-3 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-medium text-blue-900 dark:text-blue-300">
                              <Mail className="h-3.5 w-3.5" /> Email Client Dispatch
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              Opens your email client with subject, recipient (<code className="text-[10px]">{viewing.email || "No email"}</code>), and proposal link pre-populated. To attach the PDF file, click the <strong>PDF</strong> download button in the attached proposal card above and attach it to your email.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-md bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 p-3 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-medium text-emerald-900 dark:text-emerald-300">
                              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Direct Dispatch
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              Opens WhatsApp chat for <code className="text-[10px]">{viewing.phone || "No phone"}</code> with your message and verified interactive proposal link. Note: WhatsApp web links cannot attach binary PDF files directly; the guest can review their itinerary and download the PDF from the interactive link.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions for Draft */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(editedBody).then(
                                () =>
                                  toast({
                                    title: "Reply draft copied to clipboard",
                                    description: "Ready to paste into your email or CRM.",
                                  }),
                                () =>
                                  toast({
                                    title: "Failed to copy",
                                    variant: "destructive",
                                  })
                              );
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Draft
                          </Button>

                          {replyDeliveryChannel === "email" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="text-xs h-8 bg-[#304F7D] hover:bg-[#233b5d] text-[#FAF7F1] cursor-pointer"
                              onClick={() => handleSendReplyAndMarkReplied("email")}
                              disabled={isSendingReply}
                            >
                              {isSendingReply ? (
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Send via Email &amp; Mark Replied
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="text-xs h-8 bg-[#25D366] hover:bg-[#1faa53] text-[#FAF7F1] cursor-pointer"
                              onClick={() => handleSendReplyAndMarkReplied("whatsapp")}
                              disabled={isSendingReply}
                            >
                              {isSendingReply ? (
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Send via WhatsApp &amp; Mark Replied
                            </Button>
                          )}
                        </div>

                        {viewing.status === "replied" ? (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50/50 py-1 px-2.5">
                            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Replied
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-8 cursor-pointer"
                            onClick={() => handleStatusChange(viewing.id, "replied")}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Mark as Replied
                          </Button>
                        )}
                      </div>

                      {/* Refine / Re-Draft Options */}
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Refine or Re-Draft Message
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Tone:</span>
                            <Select
                              value={replyTone}
                              onValueChange={(val: any) => setReplyTone(val)}
                            >
                              <SelectTrigger className="h-6 w-32 text-[11px] bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warm-luxury">Warm &amp; Friendly</SelectItem>
                                <SelectItem value="concise">Concise</SelectItem>
                                <SelectItem value="detailed">Detailed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Instruct assistant to refine draft (e.g. 'Add focus on Ayurveda, mention December peak dates')..."
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            className="text-xs h-8 bg-background flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && refinePrompt.trim()) {
                                handleTriggerAiAssist(viewing.id, refinePrompt.trim(), "reply-assist");
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 border-[#304F7D]/30 text-[#304F7D] hover:bg-[#304F7D]/10 shrink-0 cursor-pointer"
                            onClick={() => handleTriggerAiAssist(viewing.id, refinePrompt.trim(), "reply-assist")}
                            disabled={!refinePrompt.trim() || assistMutation.isPending}
                          >
                            Refine Reply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAB 4: LINKED ITINERARY PROPOSALS */}
              <TabsContent value="proposals" className="m-0 p-6 space-y-4 text-sm">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Itinerary Proposals for {viewing.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bespoke travel proposals linked to this inquiry, complete with day plans, stays, and pricing.
                    </p>
                  </div>
                  {linkedProposals.length > 0 && (
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-[#855A18] hover:bg-[#6c4812] text-[#FAF7F1] gap-1.5 shadow-xs shrink-0 cursor-pointer"
                      onClick={() => handleOpenCreateProposal(viewing)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Create Proposal
                    </Button>
                  )}
                </div>

                {/* Newly Created Proposal Highlight Banner */}
                {newlyCreatedProposalId && (() => {
                  const newProp = linkedProposals.find((p) => p.id === newlyCreatedProposalId);
                  if (!newProp) return null;
                  const newDays = parseDays(newProp.days);
                  return (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-2 py-0.5 font-medium">
                              <Sparkles className="h-3 w-3" /> Newly Created Proposal
                            </Badge>
                            <span className="font-serif font-semibold text-sm text-foreground">
                              {newProp.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Successfully generated and linked to this guest inquiry. Ready to attach and dispatch in Reply Assistant.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-[#304F7D] hover:bg-[#233b5d] text-[#FAF7F1] gap-1.5 cursor-pointer shadow-xs"
                            onClick={() => handleReplyWithProposal(newProp)}
                          >
                            <Send className="h-3.5 w-3.5" /> Reply with this Proposal
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                          {newProp.destination && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-700 dark:text-emerald-400" /> {newProp.destination}
                            </span>
                          )}
                          <span>
                            {newDays.length} Days / {Math.max(0, newDays.length - 1)} Nights
                          </span>
                          {newProp.shareToken && (
                            <span className="font-mono text-[11px]">
                              Token: {newProp.shareToken.slice(0, 8).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-background cursor-pointer"
                            onClick={() => openProposalPreview(newProp)}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-background cursor-pointer"
                            onClick={() => handleEditProposal(newProp)}
                          >
                            <Edit3 className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-background cursor-pointer"
                            onClick={() => handleDownloadPdf(newProp)}
                            disabled={downloadingProposalId === newProp.id}
                          >
                            {downloadingProposalId === newProp.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-background cursor-pointer"
                            onClick={() => handleCopyShareLink(newProp)}
                          >
                            <Copy className="h-3 w-3" /> Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-background text-destructive hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                            onClick={() => setDeleteProposalTarget(newProp)}
                            title="Delete this Proposal"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {isLoadingProposals ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : linkedProposals.length === 0 ? (
                  <div className="p-8 rounded-lg border border-dashed text-center space-y-3 bg-muted/5">
                    <div className="h-10 w-10 rounded-full bg-[#855A18]/10 text-[#855A18] flex items-center justify-center mx-auto">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">No Proposals Created Yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Design a bespoke luxury itinerary prefilled with {viewing.name}&apos;s destination, dates, and requirements.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenCreateProposal(viewing)}
                        className="text-xs h-8 bg-[#855A18] hover:bg-[#6c4812] text-[#FAF7F1] gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Create Proposal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewing(null);
                          navigate(
                            `/itineraries/new?fromEnquiry=${viewing.id}&customerName=${encodeURIComponent(
                              viewing.name
                            )}&customerEmail=${encodeURIComponent(viewing.email || "")}&customerPhone=${encodeURIComponent(
                              viewing.phone || ""
                            )}&blank=true`
                          );
                        }}
                        className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Build Manually
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedProposals.map((proposal) => {
                      const days = parseDays(proposal.days);
                      const pricing = parsePricing(proposal.pricing);
                      const isNewlyCreated = proposal.id === newlyCreatedProposalId;
                      const isAttached = proposal.id === attachedProposalId;

                      return (
                        <Card
                          key={proposal.id}
                          className={`border shadow-2xs transition-all ${
                            isNewlyCreated
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : isAttached
                              ? "border-[#855A18]/40 bg-[#855A18]/5"
                              : "hover:border-primary/30"
                          }`}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-serif font-semibold text-base text-foreground truncate">
                                    {proposal.title}
                                  </span>
                                  {renderProposalStatusBadge(proposal.status)}
                                  {isAttached && (
                                    <Badge className="bg-[#855A18] text-[#FAF7F1] text-[10px] gap-1 px-1.5 py-0 font-normal">
                                      <Paperclip className="h-2.5 w-2.5" /> Attached to Reply
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                    Ref: {proposal.shareToken ? proposal.shareToken.slice(0, 8).toUpperCase() : `#${proposal.id}`}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  {proposal.destination && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-primary" /> {proposal.destination}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-primary" /> {days.length} Days / {Math.max(0, days.length - 1)} Nights
                                  </span>
                                  {pricing.total > 0 && (
                                    <span className="font-medium text-foreground">
                                      {proposal.currency || "INR"} {pricing.total.toLocaleString("en-IN")}
                                    </span>
                                  )}
                                  {proposal.startDate && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> Starts {proposal.startDate}
                                    </span>
                                  )}
                                </div>
                                {proposal.summary && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 pt-1 italic">
                                    &ldquo;{proposal.summary}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
                              <div className="text-[11px] text-muted-foreground">
                                Created on {new Date(proposal.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {viewing.status !== "converted" && (
                                  <Button
                                    size="sm"
                                    className="text-xs h-7 gap-1 bg-[#24543D] hover:bg-[#1b402e] text-[#FAF7F1] cursor-pointer"
                                    onClick={() => {
                                      setConvertSelectedProposal(proposal);
                                      setShowConvertModal(true);
                                    }}
                                    title="Convert directly into a booking using this proposal"
                                  >
                                    <ShoppingBag className="h-3 w-3" /> Convert to Booking
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="text-xs h-7 gap-1 bg-[#304F7D] hover:bg-[#233b5d] text-[#FAF7F1] cursor-pointer"
                                  onClick={() => handleReplyWithProposal(proposal)}
                                  title="Weave this proposal into Reply Assistant"
                                >
                                  <Send className="h-3 w-3" /> Reply with Proposal
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 gap-1 cursor-pointer"
                                  onClick={() => handleCopyShareLink(proposal)}
                                  title="Copy Verified Public Share Link"
                                >
                                  <Copy className="h-3 w-3" /> Copy Link
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 gap-1 cursor-pointer"
                                  onClick={() => openProposalPreview(proposal)}
                                  title="View Public Proposal Page"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 gap-1 cursor-pointer"
                                  onClick={() => handleDownloadPdf(proposal)}
                                  disabled={downloadingProposalId === proposal.id}
                                  title="Download Clean PDF Document"
                                >
                                  {downloadingProposalId === proposal.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3" />
                                  )}
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 gap-1 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                                  onClick={() => setShareTargetProposal(proposal)}
                                  title="Share Proposal via Link, Email, or WhatsApp"
                                >
                                  <Share2 className="h-3 w-3" /> Share
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => handleEditProposal(proposal)}
                                  title="Edit Day-Wise Activities, Stays, and Pricing"
                                >
                                  <Edit3 className="h-3 w-3" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 gap-1 text-destructive/80 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  onClick={() => setDeleteProposalTarget(proposal)}
                                  title="Delete Proposal"
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10 flex items-center justify-between sm:justify-between w-full">
            <div>
              {viewing?.email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyEmailAddress(viewing.email)}
                  title="Copy email address to clipboard"
                  className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Email
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8 cursor-pointer" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          AI ITINERARY ASSISTANT MODAL (DIRECT FROM ENQUIRY)
      ============================================================ */}
      <AiItineraryAssistantModal
        isOpen={showAiItineraryModal}
        onClose={() => setShowAiItineraryModal(false)}
        onApplyDraft={handleApplyAiDraft}
        initialEnquiry={viewing ?? undefined}
        prefillData={aiPrefillData}
      />

      {/* ============================================================
          MANUAL ENQUIRY TO BOOKING CONVERSION MODAL
      ============================================================ */}
      {viewing && (
        <ConvertEnquiryModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false);
            setConvertSelectedProposal(undefined);
          }}
          enquiry={viewing}
          linkedProposals={linkedProposals}
          initialSelectedProposalId={convertSelectedProposal?.id}
          aiResult={aiResults[viewing.id]}
          onConverted={({ booking }) => {
            invalidate();
            qc.invalidateQueries({ queryKey: ["admin", "enquiry-proposals", viewing.id] });
            qc.invalidateQueries({ queryKey: ["admin", "enquiry-notifications", viewing.id] });
            setViewing({
              ...viewing,
              status: "converted",
              bookingId: booking.id,
              bookingReference: booking.bookingReference,
              convertedAt: booking.convertedAt || new Date().toISOString(),
              convertedBy: booking.convertedBy,
            });
          }}
        />
      )}

      {/* ============================================================
          PROPOSAL SHARING DIALOG (LINK, EMAIL, WHATSAPP)
      ============================================================ */}
      <Dialog
        open={shareTargetProposal !== null}
        onOpenChange={(open) => !open && setShareTargetProposal(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              Share Itinerary Proposal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Share &ldquo;{shareTargetProposal?.title}&rdquo; with {viewing?.name || "your guest"}.
            </DialogDescription>
          </DialogHeader>

          {shareTargetProposal && (
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <span className="font-medium text-foreground block">Client Direct Link</span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={getProdShareUrl(shareTargetProposal.shareToken, "itinerary")}
                    className="h-8 text-xs bg-muted/20 font-mono"
                  />
                  <Button
                    size="sm"
                    className="h-8 text-xs shrink-0 gap-1"
                    onClick={() => handleCopyShareLink(shareTargetProposal)}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/10 space-y-2">
                <span className="font-medium text-foreground block">Direct Dispatch Channels</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs justify-start gap-2 border-primary/25 hover:bg-primary/5"
                    onClick={() => handleShareViaEmail(shareTargetProposal)}
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>Send via Email</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs justify-start gap-2 border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-700"
                    onClick={() => handleShareViaWhatsApp(shareTargetProposal)}
                    disabled={!viewing?.phone}
                    title={!viewing?.phone ? "No phone number available" : "Share via WhatsApp"}
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Send WhatsApp</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-muted-foreground text-[11px]">
                <span>Status: <strong className="capitalize text-foreground">{shareTargetProposal.status}</strong></span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary gap-1"
                  onClick={() => openProposalPreview(shareTargetProposal)}
                >
                  Open Live Proposal Page <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShareTargetProposal(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden PDF print container */}
      {printingProposal && (
        <div className="fixed -left-[9999px] -top-[9999px] w-[800px] pointer-events-none opacity-0">
          <ItineraryPrintDocument
            data={toPrintData(printingProposal)}
            id="enquiry-proposal-print-target"
          />
        </div>
      )}

      {/* ============================================================
          SAFE DELETE CONFIRMATION ALERT DIALOG
      ============================================================ */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Contact Message?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete the message from{" "}
                <strong className="text-foreground">{deleteTarget?.name}</strong>{" "}
                (<span className="text-foreground">{deleteTarget?.email}</span>)?
              </p>
              {deleteTarget && (
                <div className="p-3 rounded-md bg-muted/40 border text-xs text-muted-foreground italic line-clamp-2">
                  &ldquo;{deleteTarget.message}&rdquo;
                </div>
              )}
              <p className="text-xs text-destructive">
                This action cannot be undone. The message will be permanently removed from the database.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================
          PROPOSAL DETAIL PREVIEW MODAL
      ============================================================ */}
      <Dialog
        open={viewingProposal !== null}
        onOpenChange={(open) => !open && setViewingProposal(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-4 border-b bg-muted/10 sticky top-0 z-10 backdrop-blur-sm flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="font-serif text-lg">
                  {viewingProposal?.title || "Proposal Details"}
                </DialogTitle>
                {viewingProposal && renderProposalStatusBadge(viewingProposal.status)}
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Prepared for {viewingProposal?.customerName || viewing?.name || "Guest"} • Ref: #{viewingProposal?.id}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-6">
              {viewingProposal && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                    onClick={() => {
                      const p = viewingProposal;
                      setViewingProposal(null);
                      handleEditProposal(p);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                    onClick={() => handleDownloadPdf(viewingProposal)}
                    disabled={downloadingProposalId === viewingProposal.id}
                  >
                    {downloadingProposalId === viewingProposal.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                    onClick={() => handleCopyShareLink(viewingProposal)}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1.5 text-primary cursor-pointer"
                    onClick={() => {
                      window.open(`/itineraries/${viewingProposal.id}?fromEnquiry=${viewing?.id}`, "_blank");
                    }}
                    title="Open Full Detail Page in New Tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Full Page
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          <div className="p-6">
            {viewingProposal && (
              <ItineraryDocument data={toDocumentData(viewingProposal)} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          PROPOSAL DELETE CONFIRMATION ALERT DIALOG
      ============================================================ */}
      <AlertDialog
        open={deleteProposalTarget !== null}
        onOpenChange={(open) => !open && setDeleteProposalTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Itinerary Proposal?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete proposal{" "}
                <strong className="text-foreground">&ldquo;{deleteProposalTarget?.title}&rdquo;</strong>{" "}
                (ID: #{deleteProposalTarget?.id})?
              </p>
              {deleteProposalTarget && (
                <div className="p-3 rounded-md bg-muted/40 border text-xs space-y-1">
                  <div><strong>Destination:</strong> {deleteProposalTarget.destination || "Kerala"}</div>
                  <div><strong>Client:</strong> {deleteProposalTarget.customerName || viewing?.name}</div>
                  <div><strong>Status:</strong> {deleteProposalTarget.status}</div>
                </div>
              )}
              <p className="text-xs text-destructive">
                This action cannot be undone. The itinerary will be permanently removed. The guest contact inquiry will remain safe and unaffected.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProposalTarget && handleDeleteProposal(deleteProposalTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteItineraryMutation.isPending}
            >
              {deleteItineraryMutation.isPending ? "Deleting..." : "Delete Proposal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
