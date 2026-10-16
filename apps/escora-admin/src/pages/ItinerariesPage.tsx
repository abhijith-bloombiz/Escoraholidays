import { useState, useMemo } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListItineraries,
  useDeleteItinerary,
  useCreateItinerary,
  useUpdateItinerary,
  getListItinerariesQueryKey,
} from "@workspace/api-client-react";
import type { Itinerary } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Link as LinkIcon,
  Download,
  Copy,
  Info,
  Search,
  Calendar,
  ExternalLink,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import ItineraryDocument from "@/components/itinerary/ItineraryDocument";
import ItineraryPrintDocument from "@/components/itinerary/ItineraryPrintDocument";
import { printElementById } from "@/lib/printElement";
import { parsePricing, parseDays, parseStays, parseStringList } from "@/lib/itinerary";

const SHARE_BASE_URL = "https://www.escoraholidays.com";
const PRINT_TARGET_ID = "itinerary-print-target";

function getLocalOrProdShareUrl(token: string, mode: "itinerary" | "package" = "itinerary"): string {
  const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const base = isLocal ? "http://localhost:3000" : SHARE_BASE_URL;
  return `${base}/${mode}/${token}`;
}

function getProdShareUrl(token: string, mode: "itinerary" | "package" = "itinerary"): string {
  return `${SHARE_BASE_URL}/${mode}/${token}`;
}

function statusBadge(status: string) {
  if (status === "confirmed") {
    return (
      <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-600/20 text-xs capitalize font-medium">
        Confirmed
      </Badge>
    );
  }
  if (status === "shared") {
    return (
      <Badge className="bg-blue-600/10 text-blue-700 border-blue-300 dark:border-blue-800 hover:bg-blue-600/20 text-xs capitalize font-medium">
        Shared · Active
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs capitalize font-medium">
      Draft · Private
    </Badge>
  );
}

function calculateNights(startDate?: string | null, endDate?: string | null): number | undefined {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return nights > 0 ? nights : undefined;
}

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
  };
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
  };
}

export default function ItinerariesPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: itineraries, isLoading, isError, refetch } = useListItineraries();
  const deleteMutation = useDeleteItinerary();
  const cloneMutation = useCreateItinerary();
  const updateMutation = useUpdateItinerary();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const [viewing, setViewing] = useState<Itinerary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Itinerary | null>(null);
  const [printing, setPrinting] = useState<Itinerary | null>(null);
  const [draftAlertItinerary, setDraftAlertItinerary] = useState<{ itinerary: Itinerary; mode: "itinerary" | "package" } | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteTarget(null);
          toast({ title: "Itinerary deleted successfully" });
        },
        onError: () => toast({ title: "Failed to delete itinerary", variant: "destructive" }),
      }
    );
  }

  function copyLink(itinerary: Itinerary, mode: "itinerary" | "package" = "itinerary") {
    // If draft, warn administrator that client will see 404 unless published/shared
    if (itinerary.status === "draft") {
      setDraftAlertItinerary({ itinerary, mode });
      return;
    }

    const url = getProdShareUrl(itinerary.shareToken, mode);
    navigator.clipboard.writeText(url).then(
      () =>
        toast({
          title: mode === "package" ? "Package link copied" : "Client itinerary link copied",
          description: url,
        }),
      () => toast({ title: "Could not copy link", variant: "destructive" })
    );
  }

  function proceedWithDraftCopy(itinerary: Itinerary, mode: "itinerary" | "package", changeToShared: boolean) {
    if (changeToShared) {
      updateMutation.mutate(
        { id: itinerary.id, data: { status: "shared" } },
        {
          onSuccess: () => {
            invalidate();
            const url = getProdShareUrl(itinerary.shareToken, mode);
            navigator.clipboard.writeText(url);
            toast({
              title: "Status updated to Shared and link copied",
              description: url,
            });
            setDraftAlertItinerary(null);
          },
          onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
        }
      );
    } else {
      const url = getProdShareUrl(itinerary.shareToken, mode);
      navigator.clipboard.writeText(url);
      toast({
        title: "Draft link copied (Note: Client will get 404 until Shared)",
        description: url,
      });
      setDraftAlertItinerary(null);
    }
  }

  function openPreview(itinerary: Itinerary, mode: "itinerary" | "package" = "itinerary") {
    const url = getLocalOrProdShareUrl(itinerary.shareToken, mode);
    window.open(url, "_blank");
  }

  async function downloadPdf(itinerary: Itinerary) {
    flushSync(() => setPrinting(itinerary));
    await printElementById(PRINT_TARGET_ID);
  }

  function cloneItinerary(itinerary: Itinerary) {
    cloneMutation.mutate(
      {
        data: {
          customerName: itinerary.customerName,
          customerEmail: itinerary.customerEmail ?? undefined,
          customerPhone: itinerary.customerPhone ?? undefined,
          title: `Copy of ${itinerary.title}`,
          destination: itinerary.destination ?? undefined,
          startDate: itinerary.startDate ?? undefined,
          endDate: itinerary.endDate ?? undefined,
          coverImageUrl: itinerary.coverImageUrl ?? undefined,
          summary: itinerary.summary ?? undefined,
          days: itinerary.days,
          stays: itinerary.stays,
          inclusions: itinerary.inclusions ?? undefined,
          exclusions: itinerary.exclusions ?? undefined,
          pricing: itinerary.pricing,
          currency: itinerary.currency,
          status: "draft",
        },
      },
      {
        onSuccess: (created) => {
          invalidate();
          toast({ title: "Itinerary cloned", description: "Opening the copy in builder." });
          navigate(`/itineraries/${created.id}/edit`);
        },
        onError: () => toast({ title: "Failed to clone itinerary", variant: "destructive" }),
      }
    );
  }

  // Filtered itineraries
  const filteredItineraries = useMemo(() => {
    if (!itineraries) return [];
    const today = new Date().toISOString().split("T")[0];

    return itineraries.filter((it) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCustomer = it.customerName.toLowerCase().includes(query);
        const matchesTitle = it.title.toLowerCase().includes(query);
        const matchesDest = (it.destination ?? "").toLowerCase().includes(query);
        if (!matchesCustomer && !matchesTitle && !matchesDest) return false;
      }

      // Status
      if (statusFilter !== "all" && it.status !== statusFilter) {
        return false;
      }

      // Date
      if (dateFilter === "upcoming") {
        if (!it.startDate || it.startDate < today) return false;
      } else if (dateFilter === "past") {
        if (!it.endDate || it.endDate >= today) return false;
      } else if (dateFilter === "undated") {
        if (it.startDate || it.endDate) return false;
      }

      return true;
    });
  }, [itineraries, searchTerm, statusFilter, dateFilter]);

  const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all" || dateFilter !== "all";

  // Counts
  const counts = useMemo(() => {
    if (!itineraries) return { total: 0, draft: 0, shared: 0, confirmed: 0 };
    return {
      total: itineraries.length,
      draft: itineraries.filter((i) => i.status === "draft").length,
      shared: itineraries.filter((i) => i.status === "shared").length,
      confirmed: itineraries.filter((i) => i.status === "confirmed").length,
    };
  }, [itineraries]);

  return (
    <div data-testid="itineraries-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Itineraries &amp; Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bespoke client proposals with interactive web view and printable A4 PDF dossier.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/itineraries/new?ai=true")}
            data-testid="button-ai-itinerary"
            className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
          >
            <Sparkles className="h-4 w-4" /> Design with AI ✨
          </Button>
          <Button onClick={() => navigate("/itineraries/new")} data-testid="button-add-itinerary">
            <Plus className="h-4 w-4 mr-2" /> New Itinerary
          </Button>
        </div>
      </div>

      {/* Integration & Public Usage Guide */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-serif text-base font-medium">Itinerary Proposals &amp; Public Client Links</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <p>
            Itineraries are bespoke journey proposals prepared for individual clients. They are accessible publicly via unique secret tokens at{" "}
            <code className="text-foreground">/itinerary/:token</code> (client dossier) and <code className="text-foreground">/package/:token</code> (public package preview).
          </p>
          <p>
            <strong>Publishing requirement:</strong> Only itineraries with status set to <strong>Shared</strong> or <strong>Confirmed</strong> are publicly viewable. Itineraries in <strong>Draft</strong> status return a 404 error if opened by the client.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Note: Client contact details (email and phone) and internal administrative notes are kept private and never rendered on public share pages.
          </p>
        </AlertDescription>
      </Alert>

      {/* Status Counters & Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-lg border border-border">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, title, or destination..."
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

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({counts.total})</SelectItem>
              <SelectItem value="draft">Drafts ({counts.draft})</SelectItem>
              <SelectItem value="shared">Shared ({counts.shared})</SelectItem>
              <SelectItem value="confirmed">Confirmed ({counts.confirmed})</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming Trips</SelectItem>
              <SelectItem value="past">Past Trips</SelectItem>
              <SelectItem value="undated">Undated</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
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
              <AlertTitle>Failed to load itineraries</AlertTitle>
              <AlertDescription className="text-xs">There was an issue connecting to the database.</AlertDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/40 hover:bg-destructive/10">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </Alert>
      )}

      {/* Table list */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[200px]">Customer</TableHead>
              <TableHead className="min-w-[220px]">Proposal Title</TableHead>
              <TableHead className="w-[180px]">Travel Dates</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[130px] text-right">Investment</TableHead>
              <TableHead className="w-[190px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : itineraries && itineraries.length === 0 ? (
              /* No itineraries in database at all */
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground">No Itineraries Created Yet</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                        Create personalized travel proposals with day-by-day plans, resort stays, and transparent investment breakdowns.
                      </p>
                    </div>
                    <Button onClick={() => navigate("/itineraries/new")} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" /> Create First Itinerary
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredItineraries.length === 0 ? (
              /* Search/filter yielded zero matches */
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-6 w-6 text-muted-foreground/60" />
                    <p className="font-medium text-foreground text-sm">No matching itineraries found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search terms or filters to find what you&apos;re looking for.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setDateFilter("all");
                      }}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItineraries.map((it) => {
                const pricing = parsePricing(it.pricing);
                const nights = calculateNights(it.startDate, it.endDate);

                return (
                  <TableRow key={it.id} data-testid={`row-itinerary-${it.id}`} className="hover:bg-muted/30">
                    {/* Customer */}
                    <TableCell className="align-top py-3.5">
                      <div className="font-medium text-foreground">{it.customerName}</div>
                      {(it.customerEmail || it.customerPhone) && (
                        <div className="text-[11px] text-muted-foreground/80 mt-0.5 truncate max-w-[190px]">
                          {it.customerEmail || it.customerPhone}
                        </div>
                      )}
                    </TableCell>

                    {/* Title & Destination */}
                    <TableCell className="align-top py-3.5">
                      <div className="font-medium text-foreground text-sm line-clamp-1">{it.title}</div>
                      {it.destination && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          <span>{it.destination}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Dates */}
                    <TableCell className="align-top py-3.5 text-xs text-muted-foreground">
                      {it.startDate ? (
                        <div>
                          <div className="font-medium text-foreground">
                            {new Date(it.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          {it.endDate && (
                            <div className="text-[11px] text-muted-foreground">
                              to {new Date(it.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              {nights ? ` · ${nights}N` : ""}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Undated</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-top py-3.5">{statusBadge(it.status)}</TableCell>

                    {/* Total */}
                    <TableCell className="align-top py-3.5 text-right font-mono text-sm">
                      {pricing.total ? (
                        <span className="font-semibold text-foreground">
                          {it.currency === "INR" ? "₹" : it.currency + " "}
                          {pricing.total.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setViewing(it)}
                          title="View proposal details"
                          data-testid={`button-view-itinerary-${it.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => navigate(`/itineraries/${it.id}/edit`)}
                          title="Edit itinerary"
                          data-testid={`button-edit-itinerary-${it.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Share dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Share proposal links"
                              data-testid={`button-link-itinerary-${it.id}`}
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => copyLink(it, "itinerary")}>
                              <Copy className="h-3.5 w-3.5 mr-2" /> Copy Client Itinerary Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyLink(it, "package")}>
                              <Copy className="h-3.5 w-3.5 mr-2" /> Copy Package Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openPreview(it, "itinerary")}>
                              <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open Client View
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => downloadPdf(it)}
                          title="Download PDF dossier"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => cloneItinerary(it)}
                          disabled={cloneMutation.isPending}
                          title="Clone itinerary as copy"
                          data-testid={`button-clone-itinerary-${it.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(it)}
                          title="Delete itinerary"
                          data-testid={`button-delete-itinerary-${it.id}`}
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

      {/* View Dialog */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 font-serif text-xl">
                <Eye className="h-5 w-5 text-primary" />
                {viewing?.title}
              </DialogTitle>
              {viewing && statusBadge(viewing.status)}
            </div>
          </DialogHeader>

          {viewing && (
            <div className="p-6">
              <ItineraryDocument data={toDocumentData(viewing)} />
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => copyLink(viewing, "itinerary")}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy Client Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyLink(viewing, "package")}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy Package Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openPreview(viewing, "itinerary")}>
                    <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open in New Tab
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {viewing && (
              <Button variant="outline" onClick={() => downloadPdf(viewing)}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
              </Button>
            )}
            {viewing && (
              <Button
                variant="outline"
                onClick={() => {
                  const it = viewing;
                  setViewing(null);
                  cloneItinerary(it);
                }}
                disabled={cloneMutation.isPending}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Clone
              </Button>
            )}
            {viewing && (
              <Button
                onClick={() => {
                  const id = viewing.id;
                  setViewing(null);
                  navigate(`/itineraries/${id}/edit`);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Proposal
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Off-screen print target used by Download PDF */}
      {printing && (
        <div id={PRINT_TARGET_ID} className="fixed left-0 top-0 -z-10 opacity-0 pointer-events-none print:static print:z-auto print:opacity-100">
          <ItineraryPrintDocument data={toPrintData(printing)} />
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg">Delete Itinerary Proposal?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong className="text-foreground">&ldquo;{deleteTarget?.title}&rdquo;</strong> prepared for{" "}
                <strong className="text-foreground">{deleteTarget?.customerName}</strong>?
              </p>
              <p className="text-xs text-destructive">
                This action cannot be undone. Any public share link or QR code issued to the client will stop functioning immediately.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Proposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Draft Link Warning Dialog */}
      <AlertDialog open={draftAlertItinerary !== null} onOpenChange={(open) => !open && setDraftAlertItinerary(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              This Proposal is in Draft Status
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                The itinerary <strong className="text-foreground">&ldquo;{draftAlertItinerary?.itinerary.title}&rdquo;</strong> is currently marked as{" "}
                <strong>Draft</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Public share links return a <strong>404 error</strong> to clients while in Draft status. To allow the client to view this proposal online, change the status to <strong>Shared</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() =>
                draftAlertItinerary &&
                proceedWithDraftCopy(draftAlertItinerary.itinerary, draftAlertItinerary.mode, false)
              }
            >
              Copy Link Anyway (Keep Draft)
            </Button>
            <Button
              onClick={() =>
                draftAlertItinerary &&
                proceedWithDraftCopy(draftAlertItinerary.itinerary, draftAlertItinerary.mode, true)
              }
              className="bg-primary text-primary-foreground"
            >
              Update to &apos;Shared&apos; &amp; Copy Link
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

