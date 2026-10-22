import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateItinerary,
  useListItineraryTemplates,
  useDeleteItineraryTemplate,
  getListItinerariesQueryKey,
  getListItineraryTemplatesQueryKey,
  type ItineraryAiAssistResponse,
  type ItineraryTemplate as ApiItineraryTemplate,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Eye,
  Check,
  RefreshCw,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  itineraryTemplates as localPredefinedTemplates,
  type ItineraryTemplate as LocalItineraryTemplate,
  getTemplateDuration,
  getTemplateRoute,
} from "@/lib/itineraryTemplates";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
} from "@/lib/itinerary";
import ItineraryDocument from "@/components/itinerary/ItineraryDocument";
import AiItineraryAssistantModal from "@/components/itinerary/AiItineraryAssistantModal";
import TemplateEditorModal from "@/components/itinerary/TemplateEditorModal";

type AnyItineraryTemplate = ApiItineraryTemplate | LocalItineraryTemplate;

export default function ItineraryCreatePage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const createProposalMutation = useCreateItinerary();
  const deleteTemplateMutation = useDeleteItineraryTemplate();

  // Load server-backed templates
  const { data: serverTemplates, isLoading: isLoadingTemplates } = useListItineraryTemplates();

  // Modals and dialogs state
  const [previewTemplate, setPreviewTemplate] = useState<AnyItineraryTemplate | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiEnquiryId, setAiEnquiryId] = useState<number | undefined>(undefined);
  const [aiFormData, setAiFormData] = useState<any>(undefined);

  // Template management modal & dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AnyItineraryTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnyItineraryTemplate | null>(null);

  // Fallback to local predefined templates if server data is not yet available
  const templates: AnyItineraryTemplate[] = useMemo(() => {
    if (serverTemplates && serverTemplates.length > 0) {
      return serverTemplates;
    }
    return localPredefinedTemplates;
  }, [serverTemplates]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const aiParam = searchParams.get("ai");
    const enqParam = searchParams.get("enquiryId");
    const nameParam = searchParams.get("customerName");
    const emailParam = searchParams.get("customerEmail");
    const phoneParam = searchParams.get("customerPhone");

    if (enqParam) {
      setAiEnquiryId(Number(enqParam));
    }
    if (nameParam || emailParam || phoneParam) {
      setAiFormData({
        customerName: nameParam || undefined,
        customerEmail: emailParam || undefined,
        customerPhone: phoneParam || undefined,
      });
    }

    if (aiParam === "true" || enqParam) {
      setShowAiModal(true);
    }
  }, []);

  const handleCloseAiModal = () => {
    setShowAiModal(false);
    if (typeof window !== "undefined" && window.location.search) {
      const url = new URL(window.location.href);
      const enq = url.searchParams.get("enquiryId");
      if (enq) {
        navigate(`/enquiries?viewEnquiry=${enq}`);
        return;
      }
      url.searchParams.delete("ai");
      url.searchParams.delete("enquiryId");
      url.searchParams.delete("customerName");
      url.searchParams.delete("customerEmail");
      url.searchParams.delete("customerPhone");
      const cleanSearch = url.searchParams.toString();
      window.history.replaceState({}, "", url.pathname + (cleanSearch ? `?${cleanSearch}` : ""));
    }
  };

  const handleApplyAiDraft = (
    draft: ItineraryAiAssistResponse,
    extra?: { customerName?: string; customerEmail?: string; customerPhone?: string; startDate?: string; enquiryId?: number }
  ) => {
    try {
      sessionStorage.setItem(
        "escoraholidays_pending_ai_draft",
        JSON.stringify({ draft, extra })
      );
    } catch (e) {
      console.error("Failed to cache AI draft in sessionStorage", e);
    }
    setShowAiModal(false);
    const linkedEnq = extra?.enquiryId || aiEnquiryId;
    const enqParam = linkedEnq ? `&linkedEnquiryId=${linkedEnq}` : "";
    navigate(`/itineraries/new?aiDraft=true${enqParam}`);
  };

  function invalidateItineraries() {
    qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
  }

  function invalidateTemplates() {
    qc.invalidateQueries({ queryKey: getListItineraryTemplatesQueryKey() });
  }

  function handleUseTemplate(template: AnyItineraryTemplate) {
    if (creatingTemplateId) return;
    setCreatingTemplateId(template.id);

    const daysStr = typeof template.days === "string" ? template.days : JSON.stringify(template.days || []);
    const staysStr = typeof template.stays === "string" ? template.stays : JSON.stringify(template.stays || []);
    const pricingStr =
      typeof template.pricing === "string"
        ? template.pricing
        : JSON.stringify(template.pricing || { items: [], total: 0 });
    const inclusionsStr =
      typeof template.inclusions === "string"
        ? template.inclusions
        : JSON.stringify(template.inclusions || []);
    const exclusionsStr =
      typeof template.exclusions === "string"
        ? template.exclusions
        : JSON.stringify(template.exclusions || []);
    const tripIncludesStr =
      typeof template.tripIncludes === "string"
        ? template.tripIncludes
        : template.tripIncludes
        ? JSON.stringify(template.tripIncludes)
        : undefined;
    const transportationStr =
      typeof template.transportation === "string"
        ? template.transportation
        : template.transportation
        ? JSON.stringify(template.transportation)
        : undefined;
    const hotelTermsStr =
      typeof template.hotelTerms === "string"
        ? template.hotelTerms
        : template.hotelTerms
        ? JSON.stringify(template.hotelTerms)
        : undefined;
    const paymentTermsStr =
      typeof template.paymentTerms === "string"
        ? template.paymentTerms
        : template.paymentTerms
        ? JSON.stringify(template.paymentTerms)
        : undefined;
    const importantInfoStr =
      typeof template.importantInfo === "string"
        ? template.importantInfo
        : template.importantInfo
        ? JSON.stringify(template.importantInfo)
        : undefined;

    const payload = {
      customerName: template.customerName || "Prospective Client",
      customerEmail: undefined,
      customerPhone: undefined,
      title: template.title,
      destination: template.destination ?? undefined,
      startDate: template.startDate ?? undefined,
      endDate: template.endDate ?? undefined,
      coverImageUrl: template.coverImageUrl ?? undefined,
      summary: template.summary || template.description || undefined,
      days: daysStr,
      stays: staysStr,
      pricing: pricingStr,
      inclusions: inclusionsStr,
      exclusions: exclusionsStr,
      currency: "INR",
      status: "draft",
      curatorName: template.curatorName ?? undefined,
      curatorPhone: template.curatorPhone ?? undefined,
      emergencyContacts: template.emergencyContacts ?? undefined,
      referenceNumber: template.referenceNumber ?? undefined,
      adults: template.adults ?? 1,
      children: template.children ?? 0,
      infants: template.infants ?? 0,
      tripIncludes: tripIncludesStr,
      transportation: transportationStr,
      hotelTerms: hotelTermsStr,
      paymentTerms: paymentTermsStr,
      importantInfo: importantInfoStr,
    };

    createProposalMutation.mutate(
      { data: payload },
      {
        onSuccess: (created) => {
          invalidateItineraries();
          setPreviewTemplate(null);
          setCreatingTemplateId(null);
          toast({
            title: "Proposal created from template",
            description: `Opening "${template.label}" in proposal editor.`,
          });
          navigate(`/itineraries/${created.id}/edit`);
        },
        onError: (err: any) => {
          setCreatingTemplateId(null);
          toast({
            title: "Failed to create proposal from template",
            description: err?.message || "Please check your network and try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  const handleDeleteTemplate = () => {
    if (!deleteTarget) return;

    deleteTemplateMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          invalidateTemplates();
          toast({
            title: "Template Removed",
            description: `Template "${deleteTarget.label}" was successfully removed.`,
          });
          setDeleteTarget(null);
        },
        onError: (err: any) => {
          toast({
            title: "Failed to Delete Template",
            description:
              err?.message ||
              "Could not delete this template. If referenced by proposals or bookings, it has been preserved.",
            variant: "destructive",
          });
          setDeleteTarget(null);
        },
      }
    );
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/itineraries");
    }
  };

  return (
    <div data-testid="itinerary-create-page" className="space-y-6">
      {/* Top Header with Breadcrumb & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
            title="Back to Itineraries"
            data-testid="button-back-to-itineraries"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/itineraries" className="hover:text-foreground transition-colors">
                Itineraries
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Create New</span>
            </div>
            <h1 className="text-3xl font-serif font-semibold text-foreground">Create New Itinerary</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start from a template, build manually from scratch, or design with AI.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="self-start sm:self-center gap-1.5 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel &amp; Return
        </Button>
      </div>

      {/* SECTION 1: CREATE A NEW ITINERARY (AI Assistant & Blank) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-serif font-semibold text-foreground">Start from Scratch or with AI</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Start with a fresh blank proposal or generate a custom route using client requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: AI Assistant */}
          <Card
            className="group relative border border-border/80 hover:border-primary/50 bg-gradient-to-br from-primary/5 via-card to-card transition-all cursor-pointer hover:shadow-sm"
            onClick={() => setShowAiModal(true)}
            data-testid="card-ai-assistant"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-medium tracking-wider bg-primary/10 text-primary border-primary/20"
                >
                  AI Assistant
                </Badge>
              </div>
              <CardTitle className="text-base font-serif font-semibold text-foreground group-hover:text-primary transition-colors mt-2">
                Design with AI Assistant
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Generate a personalised itinerary from customer requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                type="button"
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1.5 text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAiModal(true);
                }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Open AI Assistant
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Start Blank */}
          <Card
            className="group relative border border-border/80 hover:border-primary/60 bg-card transition-all cursor-pointer hover:shadow-sm"
            onClick={() => navigate("/itineraries/new?blank=true")}
            data-testid="card-start-blank"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-medium tracking-wider bg-muted text-muted-foreground border-border"
                >
                  Custom
                </Badge>
              </div>
              <CardTitle className="text-base font-serif font-semibold text-foreground group-hover:text-primary transition-colors mt-2">
                Start Blank
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Build a new itinerary manually from scratch.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 group-hover:border-primary group-hover:bg-primary/5 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/itineraries/new?blank=true");
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Build Blank Itinerary
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 2: START FROM A TEMPLATE */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-semibold text-foreground">Start from a Template</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reusable preconfigured itineraries with curated routes, stays, and day-by-day plans.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-medium text-muted-foreground">
              {templates.length} {templates.length === 1 ? "Template" : "Templates"}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingTemplate(null);
                setIsEditorOpen(true);
              }}
              className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
              data-testid="button-create-template"
            >
              <Plus className="h-3.5 w-3.5" /> Create Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const duration = getTemplateDuration(template);
            const isCreatingThis = creatingTemplateId === template.id;

            return (
              <Card
                key={template.id}
                className="group relative border border-border/80 hover:border-primary/50 transition-all flex flex-col justify-between bg-card hover:shadow-sm"
                data-testid={`template-card-${template.id}`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium tracking-tight bg-primary/5 text-primary border-primary/20 shrink-0"
                      >
                        {duration}
                      </Badge>
                      {template.isPredefined && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] uppercase tracking-wider py-0 px-1.5 text-muted-foreground font-normal"
                        >
                          Curated
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className="text-[11px] text-muted-foreground truncate text-right font-medium max-w-[130px]"
                        title={template.destination}
                      >
                        {getTemplateRoute(template)}
                      </span>

                      {/* Subtle Three-Dot Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                            data-testid={`button-template-actions-${template.id}`}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsEditorOpen(true);
                            }}
                            data-testid={`menu-edit-template-${template.id}`}
                            className="cursor-pointer gap-2"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(template)}
                            data-testid={`menu-delete-template-${template.id}`}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Template
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardTitle className="text-base font-serif font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {template.label}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-8"
                      onClick={() => setPreviewTemplate(template)}
                      data-testid={`button-preview-template-${template.id}`}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleUseTemplate(template)}
                      disabled={creatingTemplateId !== null}
                      data-testid={`button-use-template-${template.id}`}
                    >
                      {isCreatingThis ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Creating...
                        </>
                      ) : (
                        <>Use Template</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="font-serif text-xl flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {previewTemplate?.label}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 text-muted-foreground">
                  {previewTemplate?.description}
                </DialogDescription>
              </div>
              {previewTemplate && (
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs font-medium">
                    {getTemplateDuration(previewTemplate)}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          {previewTemplate && (
            <div className="p-6">
              <ItineraryDocument
                data={{
                  title: previewTemplate.title,
                  customerName: previewTemplate.customerName || "Preview Guest",
                  destination: previewTemplate.destination,
                  days: Array.isArray(previewTemplate.days)
                    ? previewTemplate.days
                    : parseDays(previewTemplate.days),
                  stays: Array.isArray(previewTemplate.stays)
                    ? previewTemplate.stays
                    : parseStays(previewTemplate.stays),
                  inclusions: Array.isArray(previewTemplate.inclusions)
                    ? previewTemplate.inclusions
                    : parseStringList(previewTemplate.inclusions),
                  exclusions: Array.isArray(previewTemplate.exclusions)
                    ? previewTemplate.exclusions
                    : parseStringList(previewTemplate.exclusions),
                  pricing:
                    typeof previewTemplate.pricing === "object"
                      ? previewTemplate.pricing
                      : parsePricing(previewTemplate.pricing),
                  currency: "INR",
                }}
              />
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close Preview
            </Button>
            {previewTemplate && (
              <Button
                onClick={() => handleUseTemplate(previewTemplate)}
                disabled={creatingTemplateId !== null}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                data-testid="button-preview-use-template"
              >
                {creatingTemplateId === previewTemplate.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Creating Proposal...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Use This Template
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="dialog-delete-template">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Itinerary Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the template{" "}
              <strong>&ldquo;{deleteTarget?.label}&rdquo;</strong>?
              <br />
              <br />
              Existing proposals, bookings, and customer itineraries previously created from this
              template will not be affected. If this template is referenced by historical records, it
              will be safely archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTemplateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deleteTemplateMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              data-testid="button-confirm-delete-template"
            >
              {deleteTemplateMutation.isPending ? "Removing..." : "Delete Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Create & Edit Modal */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTemplate(null);
        }}
        templateToEdit={editingTemplate as any}
      />

      {/* AI Itinerary Assistant Modal */}
      <AiItineraryAssistantModal
        isOpen={showAiModal}
        onClose={handleCloseAiModal}
        onApplyDraft={handleApplyAiDraft}
        initialEnquiryId={aiEnquiryId}
        currentFormData={aiFormData}
        isEdit={false}
      />
    </div>
  );
}
