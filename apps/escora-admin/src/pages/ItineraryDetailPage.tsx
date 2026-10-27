import { useState } from "react";
import { flushSync } from "react-dom";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetItinerary,
  useDeleteItinerary,
  useUpdateItinerary,
  getListItinerariesQueryKey,
  getGetItineraryQueryKey,
  type Itinerary,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowLeft,
  Pencil,
  Trash2,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileQuestion,
  Sparkles,
} from "lucide-react";
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
} from "@/lib/itinerary";

const SHARE_BASE_URL = "https://www.escoraholidays.com";
const PRINT_TARGET_ID = "itinerary-detail-print-target";

function getLocalOrProdShareUrl(token: string, mode: "itinerary" | "package" = "itinerary"): string {
  const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const base = isLocal ? "http://localhost:3000" : SHARE_BASE_URL;
  return `${base}/${mode}/${token}`;
}

function getProdShareUrl(token: string, mode: "itinerary" | "package" = "itinerary"): string {
  return `${SHARE_BASE_URL}/${mode}/${token}`;
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

function toPrintData(itinerary: Itinerary) {
  return {
    title: itinerary.title || "Slow-Luxury Kerala Journey",
    customerName: itinerary.customerName || "Valued Guest",
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
    currency: itinerary.currency || "INR",
    shareToken: itinerary.shareToken,
    referenceNumber: itinerary.referenceNumber,
    curatorName: itinerary.curatorName,
    curatorPhone: itinerary.curatorPhone,
    emergencyContacts: itinerary.emergencyContacts,
    createdDate: itinerary.createdAt ? new Date(itinerary.createdAt).toLocaleDateString() : undefined,
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

function renderStatusBadge(status: string) {
  if (status === "confirmed") {
    return (
      <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 text-xs capitalize font-medium">
        Confirmed
      </Badge>
    );
  }
  if (status === "shared") {
    return (
      <Badge className="bg-blue-600/10 text-blue-700 border-blue-300 dark:border-blue-800 text-xs capitalize font-medium">
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

export default function ItineraryDetailPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const idParam = params.id;
  const itineraryId = idParam && !Number.isNaN(Number(idParam)) ? Number(idParam) : null;

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const fromEnquiry = searchParams?.get("fromEnquiry") || null;

  const {
    data: itinerary,
    isLoading,
    isError,
    error,
  } = useGetItinerary(itineraryId ?? 0, {
    query: {
      enabled: itineraryId !== null,
      queryKey: itineraryId !== null ? getGetItineraryQueryKey(itineraryId) : ["invalid-id"],
    },
  });

  const deleteMutation = useDeleteItinerary();
  const updateMutation = useUpdateItinerary();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [printingProposal, setPrintingProposal] = useState<Itinerary | null>(null);

  const handleBack = () => {
    if (fromEnquiry) {
      navigate(`/enquiries?viewEnquiry=${fromEnquiry}`);
    } else {
      navigate("/itineraries");
    }
  };

  const handleEdit = () => {
    if (!itinerary) return;
    const url = `/itineraries/${itinerary.id}/edit${fromEnquiry ? `?fromEnquiry=${fromEnquiry}` : ""}`;
    navigate(url);
  };

  const handleCopyLink = () => {
    if (!itinerary) return;
    if (itinerary.status === "draft") {
      updateMutation.mutate(
        { id: itinerary.id, data: { status: "shared" } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
            if (itineraryId) qc.invalidateQueries({ queryKey: getGetItineraryQueryKey(itineraryId) });
            const url = getProdShareUrl(itinerary.shareToken, "itinerary");
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
      const url = getProdShareUrl(itinerary.shareToken, "itinerary");
      navigator.clipboard.writeText(url);
      toast({
        title: "Proposal link copied to clipboard",
        description: url,
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!itinerary || isDownloading) return;
    const filename = formatItineraryPdfFilename(itinerary.title);
    try {
      setIsDownloading(true);
      flushSync(() => setPrintingProposal(itinerary));
      await downloadElementAsPdf(PRINT_TARGET_ID, filename);
      toast({
        title: "Itinerary PDF Downloaded",
        description: `Saved "${filename}"`,
      });
    } catch (err: any) {
      console.error("[Proposal Detail] Failed to generate PDF", err);
      toast({
        title: "Download Failed",
        description: err?.message || "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setPrintingProposal(null);
    }
  };

  const handleDelete = () => {
    if (!itinerary || isDeleting) return;
    setIsDeleting(true);
    deleteMutation.mutate(
      { id: itinerary.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
          toast({ title: "Proposal deleted successfully" });
          setShowDeleteDialog(false);
          setIsDeleting(false);
          handleBack();
        },
        onError: (err: any) => {
          setIsDeleting(false);
          toast({
            title: "Failed to delete proposal",
            description: err?.message || "An unexpected error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Case 1: Invalid identifier in URL
  if (itineraryId === null) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> {fromEnquiry ? "Back to Inquiry" : "Back to Itineraries"}
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-semibold text-foreground">Invalid Proposal Identifier</h2>
              <p className="text-sm text-muted-foreground">
                The identifier &ldquo;{idParam}&rdquo; is not a valid itinerary ID number.
              </p>
            </div>
            <Button onClick={handleBack} className="cursor-pointer">
              {fromEnquiry ? "Return to Inquiry" : "Return to Itineraries List"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case 2: Loading State
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Case 3: Not Found or API Error
  if (isError || !itinerary) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> {fromEnquiry ? "Back to Inquiry" : "Back to Itineraries"}
        </Button>
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-semibold text-foreground">Proposal Not Found</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Could not retrieve itinerary proposal #{itineraryId}. It may have been deleted or moved.
              </p>
              {error && (
                <p className="text-xs text-destructive font-mono mt-2">
                  {(error as any)?.message || "API request failed"}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">
                {fromEnquiry ? "Return to Inquiry" : "Back to Itineraries List"}
              </Button>
              <Button onClick={() => window.location.reload()} className="cursor-pointer">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case 4: Successfully loaded Proposal Document
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 pb-20">
      {/* Hidden print target for PDF generation */}
      {printingProposal && (
        <div className="fixed left-0 top-0 -z-50 pointer-events-none opacity-0 overflow-hidden">
          <ItineraryPrintDocument data={toPrintData(printingProposal)} id={PRINT_TARGET_ID} />
        </div>
      )}

      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            {fromEnquiry ? "Back to Inquiry" : "Back to Itineraries"}
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Proposal #{itinerary.id}
            </Badge>
            {renderStatusBadge(itinerary.status)}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs h-8 gap-1.5 cursor-pointer"
            title="Copy Public Client Share Link"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="text-xs h-8 gap-1.5 cursor-pointer"
            title="Download Official Itinerary PDF"
          >
            {isDownloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="text-xs h-8 gap-1.5 cursor-pointer"
            title="Edit Day Plans, Stays, and Pricing"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Proposal
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = getLocalOrProdShareUrl(itinerary.shareToken, "itinerary");
              window.open(url, "_blank");
            }}
            className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
            title="Open in Public Guest View"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Client View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-xs h-8 text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Delete this proposal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Luxury Proposal Document Render */}
      <div className="bg-card rounded-xl border shadow-sm p-6 sm:p-10">
        <ItineraryDocument data={toDocumentData(itinerary)} />
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg">Delete Itinerary Proposal?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete proposal <strong className="text-foreground">&ldquo;{itinerary.title}&rdquo;</strong> prepared for{" "}
                <strong className="text-foreground">{itinerary.customerName}</strong>?
              </p>
              <p className="text-xs text-destructive">
                This action cannot be undone. The proposal will be permanently removed. Any associated customer inquiries will remain untouched.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Proposal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
