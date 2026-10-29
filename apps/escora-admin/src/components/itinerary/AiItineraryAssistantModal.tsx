import { useState, useEffect } from "react";
import {
  useAssistItinerary,
  useListEnquiries,
  type ItineraryAiAssistResponse,
  type Enquiry,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  RotateCw,
  Sliders,
  Layers,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface AiItineraryAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft: (
    draft: ItineraryAiAssistResponse,
    extra?: {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      startDate?: string;
      enquiryId?: number;
    }
  ) => void | Promise<any>;
  initialEnquiryId?: number;
  initialEnquiry?: Enquiry;
  prefillData?: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    destination?: string;
    durationDays?: number;
    startDate?: string;
    pace?: "unhurried-slow" | "balanced" | "active-discovery";
    travelerType?: string;
    budgetTier?: string;
    notes?: string;
    enquiryId?: number;
  };
  currentFormData?: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    title?: string;
    summary?: string;
    days?: any[];
    stays?: any[];
    inclusions?: string[];
    exclusions?: string[];
  };
  isEdit?: boolean;
}

export default function AiItineraryAssistantModal({
  isOpen,
  onClose,
  onApplyDraft,
  initialEnquiryId,
  initialEnquiry,
  prefillData,
  currentFormData,
  isEdit = false,
}: AiItineraryAssistantModalProps) {
  const { toast } = useToast();
  const assistMutation = useAssistItinerary();
  const { data: enquiriesData } = useListEnquiries();

  // Active modal tab
  const [activeTab, setActiveTab] = useState<"input" | "preview">("input");

  // Form requirements state
  const [customerName, setCustomerName] = useState(
    prefillData?.customerName || initialEnquiry?.name || currentFormData?.customerName || ""
  );
  const [destination, setDestination] = useState(
    prefillData?.destination || currentFormData?.destination || "Munnar & Alleppey Backwaters"
  );
  const [durationDays, setDurationDays] = useState(
    prefillData?.durationDays ||
      (currentFormData?.days && currentFormData.days.length > 0 ? currentFormData.days.length : 7)
  );
  const [startDate, setStartDate] = useState(prefillData?.startDate || currentFormData?.startDate || "");
  const [pace, setPace] = useState<"unhurried-slow" | "balanced" | "active-discovery">(
    prefillData?.pace || "unhurried-slow"
  );
  const [travelerType, setTravelerType] = useState(prefillData?.travelerType || "Couple / Pair");
  const [budgetTier, setBudgetTier] = useState(prefillData?.budgetTier || "Signature Slow-Luxury");
  const [notes, setNotes] = useState(
    prefillData?.notes || (initialEnquiry?.message ? `Client inquiry: "${initialEnquiry.message}"` : "")
  );
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>(
    prefillData?.enquiryId
      ? String(prefillData.enquiryId)
      : initialEnquiry?.id
      ? String(initialEnquiry.id)
      : initialEnquiryId
      ? String(initialEnquiryId)
      : ""
  );
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [includeCurrentState, setIncludeCurrentState] = useState(isEdit);

  // Generated draft state
  const [generatedDraft, setGeneratedDraft] = useState<ItineraryAiAssistResponse | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  // Sync initial enquiry or prefill data if changed when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (prefillData) {
      if (prefillData.customerName) setCustomerName(prefillData.customerName);
      if (prefillData.destination) setDestination(prefillData.destination);
      if (prefillData.durationDays) setDurationDays(prefillData.durationDays);
      if (prefillData.startDate) setStartDate(prefillData.startDate);
      if (prefillData.pace) setPace(prefillData.pace);
      if (prefillData.travelerType) setTravelerType(prefillData.travelerType);
      if (prefillData.budgetTier) setBudgetTier(prefillData.budgetTier);
      if (prefillData.notes) setNotes(prefillData.notes);
      if (prefillData.enquiryId) setSelectedEnquiryId(String(prefillData.enquiryId));
    } else if (initialEnquiry) {
      setSelectedEnquiryId(String(initialEnquiry.id));
      if (initialEnquiry.name) setCustomerName(initialEnquiry.name);
      if (initialEnquiry.message) setNotes(`Client inquiry: "${initialEnquiry.message}"`);
    } else if (initialEnquiryId) {
      setSelectedEnquiryId(String(initialEnquiryId));
      const enq = enquiriesData?.find((e: Enquiry) => e.id === initialEnquiryId);
      if (enq) {
        if (!customerName || customerName === "Valued Guest") {
          setCustomerName(enq.name);
        }
        if (enq.message && !notes) {
          setNotes(`Client inquiry: "${enq.message}"`);
        }
      }
    }
  }, [isOpen, prefillData, initialEnquiry, initialEnquiryId, enquiriesData]);

  // When an enquiry is chosen from the dropdown, prefill relevant fields
  const handleEnquirySelect = (enqIdStr: string) => {
    setSelectedEnquiryId(enqIdStr);
    if (!enqIdStr || enqIdStr === "none") return;

    const enq = enquiriesData?.find((e: Enquiry) => String(e.id) === enqIdStr);
    if (enq) {
      if (!customerName || customerName === "Valued Guest") {
        setCustomerName(enq.name);
      }
      if (enq.message) {
        setNotes((prev) => (prev ? `${prev}\n\nClient inquiry: "${enq.message}"` : `Client inquiry: "${enq.message}"`));
      }
      toast({
        title: `Enquiry #${enq.id} imported`,
        description: `Imported customer details for ${enq.name}.`,
      });
    }
  };

  // Submit generation or refinement request
  const handleGenerate = () => {
    const enqIdNum = selectedEnquiryId && selectedEnquiryId !== "none" ? Number(selectedEnquiryId) : undefined;

    const payload: any = {
      customerName: customerName.trim() || undefined,
      destination: destination.trim() || undefined,
      durationDays: Number(durationDays) || 7,
      startDate: startDate.trim() || undefined,
      pace,
      travelerType,
      budgetTier,
      notes: notes.trim() || undefined,
      enquiryId: enqIdNum,
      refinementPrompt: refinementPrompt.trim() || undefined,
      currentItinerary:
        includeCurrentState && currentFormData?.days && currentFormData.days.length > 0
          ? {
              title: currentFormData.title,
              destination: currentFormData.destination,
              days: currentFormData.days,
              stays: currentFormData.stays,
            }
          : undefined,
    };

    assistMutation.mutate(
      { data: payload },
      {
        onSuccess: (data: ItineraryAiAssistResponse) => {
          setGeneratedDraft(data);
          setActiveTab("preview");
          toast({
            title: "Itinerary proposal draft generated ✨",
            description: `Crafted ${data.days.length}-day itinerary: "${data.title}"`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Generation failed",
            description: err?.message || "Could not generate proposal. Please verify provider connectivity.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!generatedDraft || isApplying) return;
    const finalEnquiryId =
      selectedEnquiryId && selectedEnquiryId !== "none"
        ? Number(selectedEnquiryId)
        : prefillData?.enquiryId || initialEnquiry?.id || initialEnquiryId;

    try {
      setIsApplying(true);
      await Promise.resolve(
        onApplyDraft(generatedDraft, {
          customerName: customerName.trim() || undefined,
          customerEmail: prefillData?.customerEmail || initialEnquiry?.email || currentFormData?.customerEmail,
          customerPhone: prefillData?.customerPhone || initialEnquiry?.phone || currentFormData?.customerPhone,
          startDate: startDate.trim() || undefined,
          enquiryId: finalEnquiryId,
        })
      );
      onClose();
    } catch (err: any) {
      console.error("Error applying proposal draft", err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-serif text-foreground">
                  AI Itinerary Assistant
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Create personalised itineraries using customer requirements and available destinations.
                </DialogDescription>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-auto">
              <TabsList className="h-8 bg-muted/60">
                <TabsTrigger value="input" className="text-xs gap-1.5 px-3">
                  <Sliders className="h-3.5 w-3.5" />
                  Requirements
                </TabsTrigger>
                <TabsTrigger value="preview" disabled={!generatedDraft} className="text-xs gap-1.5 px-3">
                  <FileCheck className="h-3.5 w-3.5" />
                  Review Draft {generatedDraft ? "✨" : ""}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: REQUIREMENTS & REFINEMENT INPUT */}
          {activeTab === "input" && (
            <div className="space-y-6">
              {/* Optional Enquiry Import Card */}
              {enquiriesData && enquiriesData.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="py-3 px-4 pb-2">
                    <CardTitle className="text-xs font-serif flex items-center gap-2 text-primary">
                      <Compass className="h-3.5 w-3.5" />
                      Quick Import from Customer Enquiries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <Select value={selectedEnquiryId} onValueChange={handleEnquirySelect}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Choose an enquiry to import requirements..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Manual custom entry</SelectItem>
                        {enquiriesData.map((e: Enquiry) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            #{e.id} — {e.name} ({e.email}) · Status: {e.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Client & Travel Requirements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Customer / Party Name</Label>
                  <Input
                    placeholder="e.g. Lady Eleanor Vance"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Destination / Region</Label>
                  <Input
                    placeholder="e.g. Munnar, Thekkady & Kumarakom Backwaters"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Trip Duration (Days)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={2}
                      max={30}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="h-9 text-xs w-28"
                    />
                    <span className="text-xs text-muted-foreground">
                      = {Math.max(1, durationDays - 1)} Nights
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Start Date or Preferred Season</Label>
                  <Input
                    placeholder="e.g. 2026-11-20 or Late November"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Travel Pacing</Label>
                  <Select value={pace} onValueChange={(v: any) => setPace(v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unhurried-slow">
                        🌿 Unhurried (2-3 nights per stop, relaxed pace)
                      </SelectItem>
                      <SelectItem value="balanced">
                        ⚖️ Balanced (Standard route flow)
                      </SelectItem>
                      <SelectItem value="active-discovery">
                        ⛰️ Active Discovery (Nature trails, plantations, wildlife)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Traveler Group</Label>
                  <Select value={travelerType} onValueChange={setTravelerType}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Couple / Pair">Couple / Romantic / Anniversary</SelectItem>
                      <SelectItem value="Family with Children">Family with Children</SelectItem>
                      <SelectItem value="Solo Explorer">Solo Rejuvenation</SelectItem>
                      <SelectItem value="Small Private Group">Small Private Group (Friends / Multi-Gen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Special Wishes / Guest Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Customer Wishes, Requests or Specific Interests</Label>
                <Textarea
                  placeholder="e.g. Guest requested candlelight dinners by the backwaters, private tea-tasting, and prefers colonial heritage over modern resorts..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              {/* Travel Designer Steering & Refinement Section */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label className="text-xs font-semibold text-foreground">
                      Travel Designer Steering / Refinement Prompt
                    </Label>
                  </div>
                  {isEdit && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCurrentState}
                        onChange={(e) => setIncludeCurrentState(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Refine existing form contents</span>
                    </label>
                  )}
                </div>

                <Textarea
                  placeholder="e.g. Add a private doctor Ayurvedic consultation on day 2, propose Windermere Estate in Munnar, and slow down the transfer from Fort Kochi..."
                  rows={2}
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  className="text-xs resize-none bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  Your instructions will steer the proposal draft using available destinations and journeys.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PROPOSAL DRAFT REVIEW & GROUNDING */}
          {activeTab === "preview" && generatedDraft && (
            <div className="space-y-6">
              {/* Proposal Header Card */}
              <Card className="border border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-primary/10 text-primary border-primary/20 mb-1.5">
                        {generatedDraft.destination} · {generatedDraft.durationDays} Days / {generatedDraft.durationNights} Nights
                      </Badge>
                      <CardTitle className="text-xl font-serif text-foreground">
                        {generatedDraft.title}
                      </CardTitle>
                    </div>
                    {generatedDraft.coverImageUrl && (
                      <div className="relative shrink-0">
                        <img
                          src={generatedDraft.coverImageUrl}
                          alt="Proposal Cover"
                          className="h-16 w-28 object-cover rounded-lg border border-border shadow-2xs"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                          Cover
                        </span>
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
                    {generatedDraft.summary}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Verified Catalogue Grounding Badges */}
              <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Matched Destinations &amp; Journeys
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Destinations:</span>
                  {generatedDraft.verifiedCatalogMatches.destinations.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-background border-primary/25 text-primary">
                      {d.name} ({d.region})
                    </Badge>
                  ))}
                  {generatedDraft.verifiedCatalogMatches.packages.length > 0 && (
                    <>
                      <span className="text-[11px] text-muted-foreground ml-2 mr-1">Journeys:</span>
                      {generatedDraft.verifiedCatalogMatches.packages.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-background border-primary/30 text-primary">
                          {p.title}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Confirmation Checklist (Operational Items to Verify) */}
              {generatedDraft.unconfirmedItems.length > 0 && (
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-xs font-serif font-semibold text-amber-800 dark:text-amber-300">
                    Operational Confirmation Required (Check Before Client Dispatch)
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-1.5">
                    <ul className="list-disc pl-4 space-y-0.5">
                      {generatedDraft.unconfirmedItems.map((item, idx) => (
                        <li key={idx} className="text-xs">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Travel Designer Logistics Advice */}
              {generatedDraft.travelDesignerAdvice && (
                <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5 flex items-start gap-2.5">
                  <Compass className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <strong className="text-blue-900 dark:text-blue-300 block mb-0.5">
                      Designer Pacing &amp; Route Logistics
                    </strong>
                    <span className="text-muted-foreground">{generatedDraft.travelDesignerAdvice}</span>
                  </div>
                </div>
              )}

              {/* Day-by-Day Proposal Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-serif font-semibold tracking-wide uppercase text-muted-foreground">
                  Day-by-Day Curated Experience ({generatedDraft.days.length} Days)
                </h4>
                <div className="space-y-2">
                  {generatedDraft.days.map((day) => {
                    const isExpanded = expandedDay === day.day;
                    return (
                      <div
                        key={day.day}
                        className="rounded-lg border border-border bg-card overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-primary w-12">
                              Day {day.day}
                            </span>
                            <span className="text-xs font-medium text-foreground">{day.title}</span>
                            {day.destination && (
                              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                                {day.destination}
                              </Badge>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3 pt-1 border-t border-border/60 bg-muted/10 space-y-2 text-xs">
                            {day.description && (
                              <p className="text-muted-foreground italic text-[11px]">{day.description}</p>
                            )}
                            <div className="space-y-1.5 pt-1">
                              {day.activities.map((act, aIdx) => (
                                <div key={aIdx} className="flex items-start gap-2">
                                  <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4">
                                    {act.time || "Activity"}
                                  </Badge>
                                  <div className="flex-1">
                                    <strong className="text-foreground">{act.title}: </strong>
                                    <span className="text-muted-foreground">{act.description}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Matched Visuals (Method B) */}
                            {((day.imageUrls && day.imageUrls.length > 0) || day.imageUrl) && (
                              <div className="pt-2 border-t border-border/40">
                                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5 font-semibold">
                                  📸 Matched Visuals ({((day.imageUrls || [day.imageUrl])).filter(Boolean).length} Photos):
                                </span>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                  {((day.imageUrls && day.imageUrls.length > 0) ? day.imageUrls : [day.imageUrl!]).filter((url): url is string => Boolean(url)).map((imgUrl: string, iIdx: number) => (
                                    <img
                                      key={iIdx}
                                      src={imgUrl}
                                      alt={`Day ${day.day} visual ${iIdx + 1}`}
                                      className="h-16 w-24 object-cover rounded border border-border shrink-0 shadow-2xs hover:scale-105 transition-transform"
                                      loading="lazy"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Stays & Properties */}
              {generatedDraft.stays.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-serif font-semibold tracking-wide uppercase text-muted-foreground">
                    Recommended Boutique Sanctuaries ({generatedDraft.stays.length} Stays)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {generatedDraft.stays.map((stay, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-foreground">{stay.name}</strong>
                          <Badge variant="outline" className="text-[10px]">
                            {stay.nights} {stay.nights === 1 ? "Night" : "Nights"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {stay.location} · {stay.roomType || "Standard Heritage Room"}
                        </p>
                        {stay.notes && (
                          <p className="text-[10px] text-muted-foreground/80 italic">
                            {stay.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Curated Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                  <strong className="text-foreground block">Curated Inclusions</strong>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                    {generatedDraft.inclusions.map((inc, i) => (
                      <li key={i}>{inc}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                  <strong className="text-foreground block">Standard Exclusions</strong>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                    {generatedDraft.exclusions.map((exc, i) => (
                      <li key={i}>{exc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {activeTab === "preview" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("input")}
                className="gap-1.5"
              >
                <Sliders className="h-3.5 w-3.5" /> Adjust Requirements
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "input" ? (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={assistMutation.isPending}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {assistMutation.isPending ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    Curating Slow Proposal...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    {generatedDraft ? "Re-generate Proposal Draft ✨" : "Generate Proposal Draft ✨"}
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleApply}
                disabled={isApplying}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isApplying ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    Applying &amp; Saving Proposal...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Apply to Proposal Form
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
