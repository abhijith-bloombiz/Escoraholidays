import { useState } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListItineraries,
  useDeleteItinerary,
  useCreateItinerary,
  getListItinerariesQueryKey,
} from "@workspace/api-client-react";
import type { Itinerary } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, Eye, Link as LinkIcon, Download, Copy } from "lucide-react";
import ItineraryDocument from "@/components/itinerary/ItineraryDocument";
import ItineraryPrintDocument from "@/components/itinerary/ItineraryPrintDocument";
import { printElementById } from "@/lib/printElement";
import { parsePricing, parseDays, parseStays, parseStringList } from "@/lib/itinerary";

const SHARE_BASE_URL = "https://www.escoraholidays.com";
const PRINT_TARGET_ID = "itinerary-print-target";

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "confirmed") return "default";
  if (status === "shared") return "outline";
  return "secondary";
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
  const { data: itineraries, isLoading } = useListItineraries();
  const deleteMutation = useDeleteItinerary();
  const cloneMutation = useCreateItinerary();

  const [viewing, setViewing] = useState<Itinerary | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [printing, setPrinting] = useState<Itinerary | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Itinerary deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  function copyLink(itinerary: Itinerary, mode: "itinerary" | "package" = "itinerary") {
    const url = `${SHARE_BASE_URL}/${mode}/${itinerary.shareToken}`;
    navigator.clipboard.writeText(url).then(
      () => toast({ title: mode === "package" ? "Package link copied" : "Itinerary link copied", description: url }),
      () => toast({ title: "Could not copy link", variant: "destructive" }),
    );
  }

  async function downloadPdf(itinerary: Itinerary) {
    // flushSync forces the print target to actually mount/update in the DOM
    // before we look for it, instead of guessing at a setTimeout delay that
    // could fire before React has committed the new data (showing stale or
    // unstyled content on the first print of a session).
    flushSync(() => setPrinting(itinerary));
    // printElementById() itself waits for the letterhead image to finish
    // loading before calling window.print(), so the very first print of a
    // session doesn't show a flash of unstyled/stale content either.
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
          toast({ title: "Itinerary cloned", description: "Opening the copy for editing." });
          navigate(`/itineraries/${created.id}/edit`);
        },
        onError: () => toast({ title: "Failed to clone itinerary", variant: "destructive" }),
      },
    );
  }

  return (
    <div data-testid="itineraries-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Itineraries</h1>
          <p className="text-muted-foreground mt-1">{itineraries?.length ?? 0} total itineraries</p>
        </div>
        <Button onClick={() => navigate("/itineraries/new")} data-testid="button-add-itinerary">
          <Plus className="h-4 w-4 mr-2" /> New Itinerary
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-40"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            )) : !itineraries?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                  No itineraries yet. Click <span className="font-medium text-foreground">New Itinerary</span> to create your first.
                </TableCell>
              </TableRow>
            ) : itineraries?.map((it) => {
              const pricing = parsePricing(it.pricing);
              return (
                <TableRow key={it.id} data-testid={`row-itinerary-${it.id}`}>
                  <TableCell className="font-medium">{it.customerName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-64 truncate">{it.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {it.startDate ? new Date(it.startDate).toLocaleDateString("en-IN") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(it.status)} className="text-xs capitalize">{it.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {pricing.total ? `${it.currency === "INR" ? "₹" : it.currency + " "}${pricing.total.toLocaleString("en-IN")}` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(it)} data-testid={`button-view-itinerary-${it.id}`}>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/itineraries/${it.id}/edit`)} data-testid={`button-edit-itinerary-${it.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" title="Copy share link" data-testid={`button-link-itinerary-${it.id}`}>
                            <LinkIcon className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => copyLink(it, "itinerary")}>
                            Copy Itinerary Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyLink(it, "package")}>
                            Copy Package Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" onClick={() => downloadPdf(it)} title="Download PDF">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cloneItinerary(it)}
                        disabled={cloneMutation.isPending}
                        title="Clone itinerary"
                        data-testid={`button-clone-itinerary-${it.id}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(it.id)} data-testid={`button-delete-itinerary-${it.id}`}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewing !== null} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {viewing?.title}
            </DialogTitle>
          </DialogHeader>
          {viewing && <ItineraryDocument data={toDocumentData(viewing)} />}
          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
            {viewing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => copyLink(viewing, "itinerary")}>
                    Copy Itinerary Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyLink(viewing, "package")}>
                    Copy Package Link
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
              <Button variant="outline" onClick={() => { const it = viewing; setViewing(null); cloneItinerary(it); }} disabled={cloneMutation.isPending}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Clone
              </Button>
            )}
            {viewing && (
              <Button onClick={() => { const id = viewing.id; setViewing(null); navigate(`/itineraries/${id}/edit`); }}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Off-screen print target used by the Download PDF action (see src/lib/printElement.ts) */}
      {printing && (
        <div id={PRINT_TARGET_ID} className="fixed left-0 top-0 -z-10 opacity-0 pointer-events-none print:static print:z-auto print:opacity-100">
          <ItineraryPrintDocument data={toPrintData(printing)} />
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete itinerary?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The share link will stop working immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
