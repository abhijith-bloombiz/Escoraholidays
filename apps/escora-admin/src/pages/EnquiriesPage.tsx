import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  useListEnquiries,
  useUpdateEnquiry,
  useDeleteEnquiry,
  getListEnquiriesQueryKey,
  useAssistEnquiry,
  type Enquiry,
  type EnquiryAiAssistResponse,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";

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

  // Search, filter & sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Dialogs & viewing state
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);

  // AI Assistant states
  const [activeTab, setActiveTab] = useState<"details" | "ai-assist">("details");
  const [aiResults, setAiResults] = useState<Record<number, EnquiryAiAssistResponse>>({});
  const [designerPrompt, setDesignerPrompt] = useState("");
  const [replyTone, setReplyTone] = useState<"warm-luxury" | "concise" | "detailed">("warm-luxury");
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [refinePrompt, setRefinePrompt] = useState("");

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListEnquiriesQueryKey() });
  }

  // Opening a New message marks it as Read automatically
  function openMessage(e: Enquiry) {
    setViewing(e);
    setActiveTab("details");
    setDesignerPrompt("");
    setRefinePrompt("");

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

  function handleTriggerAiAssist(enquiryId: number, focusText?: string) {
    assistMutation.mutate(
      {
        id: enquiryId,
        data: {
          focusPrompt: focusText || designerPrompt || undefined,
          replyTone,
        },
      },
      {
        onSuccess: (data) => {
          setAiResults((prev) => ({ ...prev, [enquiryId]: data }));
          setEditedSubject(data.suggestedReply.subject);
          setEditedBody(
            `${data.suggestedReply.greeting}\n\n${data.suggestedReply.body}\n\n${data.suggestedReply.signoff}`
          );
          setActiveTab("ai-assist");
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
    if (!enquiries) return { total: 0, unread: 0, read: 0, replied: 0 };
    return {
      total: enquiries.length,
      unread: enquiries.filter((e) => e.status === "new").length,
      read: enquiries.filter((e) => e.status === "read").length,
      replied: enquiries.filter((e) => e.status === "replied").length,
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

  // Fallback email copy helper
  function copyEmailAddress(email: string) {
    navigator.clipboard.writeText(email).then(
      () => toast({ title: "Email copied to clipboard", description: email }),
      () => toast({ title: "Could not copy email", variant: "destructive" })
    );
  }

  return (
    <div data-testid="enquiries-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Contact Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guest inquiries submitted via the website contact form (<code className="text-xs">/contact</code>) and footer.
          </p>
        </div>
      </div>

      {/* Integration & Public Usage Guide */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-serif text-base font-medium">Contact Inquiries &amp; Public Lead Capture</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <p>
            This inbox captures guest messages submitted through the website footer contact form and the main contact page (<code className="text-foreground">/contact</code>).
          </p>
          <p>
            <strong>Internal inbox only:</strong> Messages stored here are private administrative records and do not publish content back to the public website. Use this dashboard to track review status (<em>New</em>, <em>Read</em>, <em>Replied</em>) and reply directly to guests via phone or email.
          </p>
        </AlertDescription>
      </Alert>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">All Messages</span>
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
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Unread</span>
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
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Read</span>
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
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Replied</span>
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
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
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
              <div className="flex items-center gap-2">
                {viewing && renderEnquiryStatusBadge(viewing.status)}
                {viewing && aiResults[viewing.id] && (
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[11px] font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Brief Ready
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {viewing && (
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "details" | "ai-assist")}
              className="w-full"
            >
              <div className="px-6 pt-3 border-b bg-muted/10 flex items-center justify-between flex-wrap gap-2">
                <TabsList className="bg-muted/60 p-1">
                  <TabsTrigger value="details" className="text-xs font-medium">
                    <Mail className="h-3.5 w-3.5 mr-1.5" /> Message Details
                  </TabsTrigger>
                  <TabsTrigger value="ai-assist" className="text-xs font-medium relative">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> AI Travel Assistant
                    {aiResults[viewing.id] && (
                      <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </TabsTrigger>
                </TabsList>

                {activeTab === "details" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                    onClick={() => {
                      setActiveTab("ai-assist");
                      if (!aiResults[viewing.id]) {
                        handleTriggerAiAssist(viewing.id);
                      }
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    {aiResults[viewing.id] ? "View AI Brief" : "Analyze with AI Assistant ✨"}
                  </Button>
                )}
              </div>

              {/* TAB 1: MESSAGE DETAILS */}
              <TabsContent value="details" className="m-0 p-6 space-y-5 text-sm">
                {/* Sender Details Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/10 p-4 rounded-lg border">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      Sender Name
                    </span>
                    <span className="font-medium text-foreground text-base block mt-0.5">
                      {viewing.name}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
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
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy Email Address"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {viewing.phone && (
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
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
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy Phone Number"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block font-semibold">
                    Message Content
                  </span>
                  <div className="p-4 rounded-lg bg-card border text-foreground leading-relaxed whitespace-pre-wrap text-sm font-sans shadow-2xs min-h-[120px]">
                    {viewing.message}
                  </div>
                </div>

                {/* AI Briefing Snapshot (if already generated) */}
                {aiResults[viewing.id] && (
                  <Card
                    className="border-amber-500/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
                    onClick={() => setActiveTab("ai-assist")}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" /> AI Executive Summary
                        </span>
                        <span className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                          Open Full Assistant Workspace <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 italic leading-relaxed">
                        &ldquo;{aiResults[viewing.id].summary.overview}&rdquo;
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px]">
                          Action: {aiResults[viewing.id].nextAction.recommendedAction}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                      </SelectContent>
                    </Select>
                  </div>

                  {viewing.status !== "replied" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-8 self-start sm:self-auto"
                      onClick={() => handleStatusChange(viewing.id, "replied")}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Mark as Replied
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: AI ENQUIRY ASSISTANT WORKSPACE */}
              <TabsContent value="ai-assist" className="m-0 p-6 space-y-6 text-sm">
                {/* Assistant Header & Controls Bar */}
                <div className="bg-muted/20 border border-border p-4 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Escora AI Travel Designer Assistant
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Extracts verified facts, checks published catalog, flags customer questions, and crafts human-approved replies.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">Tone:</span>
                      <Select
                        value={replyTone}
                        onValueChange={(val: any) => setReplyTone(val)}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warm-luxury">Warm Slow-Luxury</SelectItem>
                          <SelectItem value="concise">Concise Concierge</SelectItem>
                          <SelectItem value="detailed">Detailed Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Designer Optional Direction */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Optional travel designer direction (e.g. 'Suggest 4 nights in Kumarakom and private houseboat')..."
                      value={designerPrompt}
                      onChange={(e) => setDesignerPrompt(e.target.value)}
                      className="text-xs h-8 bg-background flex-1"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleTriggerAiAssist(viewing.id)}
                      disabled={assistMutation.isPending}
                    >
                      {assistMutation.isPending ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                      )}
                      {aiResults[viewing.id] ? "Re-Analyze" : "Analyze & Draft"}
                    </Button>
                  </div>
                </div>

                {/* Loading State */}
                {assistMutation.isPending && (
                  <div className="p-8 border border-dashed rounded-lg text-center space-y-3 bg-muted/5">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="font-serif text-sm font-medium text-foreground">
                      Analyzing Customer Message &amp; Synthesizing Proposal...
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Extracting explicit facts, verifying against published Kerala catalog, and drafting personalized slow-luxury reply.
                    </p>
                  </div>
                )}

                {/* If Not Yet Run and Not Loading */}
                {!aiResults[viewing.id] && !assistMutation.isPending && (
                  <div className="p-8 border border-dashed rounded-lg text-center space-y-3 bg-muted/5">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-base font-medium text-foreground">
                      Ready to Analyze Guest Enquiry
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Click below to generate a concise summary, extract explicit preferences, highlight unanswered customer questions, and prepare an editable draft reply.
                    </p>
                    <Button
                      onClick={() => handleTriggerAiAssist(viewing.id)}
                      className="text-xs mt-2"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Start AI Analysis &amp; Reply Draft
                    </Button>
                  </div>
                )}

                {/* Analyzed Workspace Content */}
                {aiResults[viewing.id] && !assistMutation.isPending && (
                  <div className="space-y-5">
                    {/* 1. Summary & Fact Extraction Card */}
                    <Card className="border">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h5 className="font-serif font-semibold text-sm flex items-center gap-1.5 text-foreground">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Executive Summary &amp; Extracted Preferences
                          </h5>
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Explicit facts only · Zero speculation
                          </Badge>
                        </div>

                        <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-3 rounded-md">
                          {aiResults[viewing.id].summary.overview}
                        </p>

                        {/* Explicit Facts Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                              Destinations
                            </span>
                            <span className="font-medium text-foreground">
                              {aiResults[viewing.id].summary.destinations.length > 0
                                ? aiResults[viewing.id].summary.destinations.join(", ")
                                : "None specified"}
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                              Travel Dates
                            </span>
                            <span
                              className={`font-medium ${
                                aiResults[viewing.id].summary.travelDates.includes("Unknown")
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-foreground"
                              }`}
                            >
                              {aiResults[viewing.id].summary.travelDates}
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                              Group Size
                            </span>
                            <span
                              className={`font-medium ${
                                aiResults[viewing.id].summary.groupSize.includes("Unknown")
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-foreground"
                              }`}
                            >
                              {aiResults[viewing.id].summary.groupSize}
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-card border space-y-0.5">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                              Budget Tier
                            </span>
                            <span
                              className={`font-medium ${
                                aiResults[viewing.id].summary.budget.includes("Unknown")
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-foreground"
                              }`}
                            >
                              {aiResults[viewing.id].summary.budget}
                            </span>
                          </div>
                        </div>

                        {/* Unanswered Customer Questions */}
                        {aiResults[viewing.id].summary.unansweredQuestions.length > 0 ? (
                          <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/30 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 dark:text-blue-300">
                              <HelpCircle className="h-4 w-4 flex-shrink-0" />
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
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            No direct unanswered questions asked in the message.
                          </div>
                        )}

                        {/* Missing Information Gaps */}
                        {aiResults[viewing.id].extractedPreferences.missingDetails.length >
                          0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground block font-semibold">
                              Information Gaps to Clarify with Guest:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {aiResults[viewing.id].extractedPreferences.missingDetails.map(
                                (gap, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[11px]"
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

                    {/* 2. Recommended Next Action */}
                    <Card className="border bg-primary/5">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-serif font-semibold text-foreground flex items-center gap-1.5">
                            <ArrowRight className="h-4 w-4 text-primary" /> Recommended Next Action
                          </span>
                          <Badge
                            className={`text-[10px] uppercase font-semibold ${
                              aiResults[viewing.id].nextAction.priority === "high"
                                ? "bg-emerald-600 text-white"
                                : aiResults[viewing.id].nextAction.priority === "medium"
                                ? "bg-blue-600 text-white"
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
                      </CardContent>
                    </Card>

                    {/* 3. Personalized Reply Draft (Human-Approved & Editable) */}
                    <Card className="border space-y-3">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                          <div>
                            <h5 className="font-serif font-semibold text-sm flex items-center gap-1.5 text-foreground">
                              <Edit3 className="h-4 w-4 text-primary" /> Personalized Reply Draft
                            </h5>
                            <span className="text-[11px] text-muted-foreground">
                              Review, personalize, and copy or send via your preferred email client.
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" /> Human Approval Required
                          </Badge>
                        </div>

                        {/* Subject Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                            Subject Line
                          </label>
                          <Input
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            className="text-xs font-medium bg-background"
                          />
                        </div>

                        {/* Reply Body Textarea */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                              Draft Message (Directly Editable)
                            </label>
                            <span className="text-[10px] text-muted-foreground">
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

                        {/* Actions for Draft */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8"
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

                            <Button asChild size="sm" className="text-xs h-8">
                              <a
                                href={`mailto:${viewing.email}?subject=${encodeURIComponent(
                                  editedSubject
                                )}&body=${encodeURIComponent(editedBody)}`}
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" /> Send via Email Client
                              </a>
                            </Button>
                          </div>

                          {viewing.status !== "replied" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-8"
                              onClick={() => handleStatusChange(viewing.id, "replied")}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Mark as Replied
                            </Button>
                          )}
                        </div>

                        {/* Refine Draft Bar */}
                        <div className="pt-2 border-t flex items-center gap-2">
                          <Input
                            placeholder="Instruct assistant to refine draft (e.g. 'Add focus on Ayurveda, mention December peak')..."
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            className="text-xs h-8 bg-background flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && refinePrompt.trim()) {
                                handleTriggerAiAssist(viewing.id, refinePrompt.trim());
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-8"
                            onClick={() => handleTriggerAiAssist(viewing.id, refinePrompt.trim())}
                            disabled={!refinePrompt.trim() || assistMutation.isPending}
                          >
                            Refine Reply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => copyEmailAddress(viewing.email)}
                  title="Copy email address to clipboard"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Email
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    const enq = viewing;
                    setViewing(null);
                    navigate(
                      `/itineraries/new?ai=true&enquiryId=${enq.id}&customerName=${encodeURIComponent(
                        enq.name
                      )}&customerEmail=${encodeURIComponent(enq.email)}${
                        enq.phone ? `&customerPhone=${encodeURIComponent(enq.phone)}` : ""
                      }`
                    );
                  }}
                  className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                  title="Create an itinerary proposal with AI from this customer inquiry"
                  data-testid="button-create-itinerary-proposal"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Create Proposal ✨
                </Button>
                {activeTab === "ai-assist" && editedBody ? (
                  <Button asChild>
                    <a
                      href={`mailto:${viewing.email}?subject=${encodeURIComponent(
                        editedSubject
                      )}&body=${encodeURIComponent(editedBody)}`}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Send Draft via Email
                    </a>
                  </Button>
                ) : (
                  <Button asChild>
                    <a
                      href={`mailto:${viewing.email}?subject=${encodeURIComponent(
                        "Re: Your inquiry — Escora Holidays"
                      )}`}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Reply via Email
                    </a>
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
