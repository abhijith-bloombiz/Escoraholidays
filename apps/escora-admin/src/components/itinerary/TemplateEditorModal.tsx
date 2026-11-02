import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateItineraryTemplate,
  useUpdateItineraryTemplate,
  getListItineraryTemplatesQueryKey,
  type ItineraryTemplate,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  FileText,
  MoveUp,
  MoveDown,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Check,
} from "lucide-react";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  parseTripIncludes,
  parseTransportation,
  DEFAULT_HOTEL_TERMS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_IMPORTANT_INFO,
  DEFAULT_AGENCY_CONTACT,
  type ItineraryDay,
  type ItineraryStay,
  type ItineraryPricing,
  type ItineraryPriceItem,
} from "@/lib/itinerary";

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: ItineraryTemplate | null;
  onSaved?: (savedTemplate: ItineraryTemplate) => void;
}

export default function TemplateEditorModal({
  isOpen,
  onClose,
  templateToEdit,
  onSaved,
}: TemplateEditorModalProps) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const isEdit = Boolean(templateToEdit);

  const createMutation = useCreateItineraryTemplate();
  const updateMutation = useUpdateItineraryTemplate();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Active tab
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Form states
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [curatorName, setCuratorName] = useState("");
  const [curatorPhone, setCuratorPhone] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);

  // Inclusions checklist
  const [hotelIncluded, setHotelIncluded] = useState(true);
  const [transportIncluded, setTransportIncluded] = useState(true);
  const [sightseeingIncluded, setSightseeingIncluded] = useState(true);
  const [transferIncluded, setTransferIncluded] = useState(true);
  const [flightsIncluded, setFlightsIncluded] = useState(true);
  const [weAlsoProvide, setWeAlsoProvide] = useState<string[]>([]);

  // Transportation
  const [transportOrigin, setTransportOrigin] = useState("ESCORA HOLIDAYS | Trivandrum, Keralam, India");
  const [transportDestination, setTransportDestination] = useState(
    "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India"
  );
  const [transportVehicle, setTransportVehicle] = useState(
    "Private Dedicated Chauffeur Driven AC Sedan / SUV"
  );

  // Complex items
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [stays, setStays] = useState<ItineraryStay[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [priceItems, setPriceItems] = useState<ItineraryPriceItem[]>([]);
  const [priceTotal, setPriceTotal] = useState<number>(0);
  const [pricingNotes, setPricingNotes] = useState<string>("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form on open / template change
  useEffect(() => {
    if (!isOpen) return;

    if (templateToEdit) {
      setLabel(templateToEdit.label || "");
      setTitle(templateToEdit.title || "");
      setDestination(templateToEdit.destination || "");
      setDescription(templateToEdit.description || "");
      setCoverImageUrl(templateToEdit.coverImageUrl || "");
      setSummary(templateToEdit.summary || "");
      setCustomerName(templateToEdit.customerName || "Prospective Client");
      setCuratorName(templateToEdit.curatorName || DEFAULT_AGENCY_CONTACT.curatorName);
      setCuratorPhone(templateToEdit.curatorPhone || DEFAULT_AGENCY_CONTACT.curatorPhone);
      setEmergencyContacts(templateToEdit.emergencyContacts || DEFAULT_AGENCY_CONTACT.emergencyContacts);
      setReferenceNumber(templateToEdit.referenceNumber || "");
      setAdults(templateToEdit.adults ?? 2);
      setChildren(templateToEdit.children ?? 0);
      setInfants(templateToEdit.infants ?? 0);

      const parsedTripInc = parseTripIncludes(templateToEdit.tripIncludes);
      setHotelIncluded(parsedTripInc.hotel);
      setTransportIncluded(parsedTripInc.transport);
      setSightseeingIncluded(parsedTripInc.sightseeing);
      setTransferIncluded(parsedTripInc.transfer);
      setFlightsIncluded(parsedTripInc.flights ?? true);
      setWeAlsoProvide(parsedTripInc.weAlsoProvide || []);

      const parsedTrans = parseTransportation(templateToEdit.transportation);
      if (parsedTrans) {
        setTransportOrigin(parsedTrans.origin || "");
        setTransportDestination(parsedTrans.destination || "");
        setTransportVehicle(parsedTrans.vehicleType || "");
      }

      setDays(parseDays(templateToEdit.days));
      setStays(parseStays(templateToEdit.stays));
      setInclusions(parseStringList(templateToEdit.inclusions));
      setExclusions(parseStringList(templateToEdit.exclusions));

      const parsedPricing = parsePricing(templateToEdit.pricing);
      setPriceItems(parsedPricing.items || []);
      setPriceTotal(parsedPricing.total || 0);
      setPricingNotes(parsedPricing.notes || "");
    } else {
      // Default blank state for new template
      setLabel("");
      setTitle("");
      setDestination("");
      setDescription("");
      setCoverImageUrl("");
      setSummary("");
      setCustomerName("Prospective Client");
      setCuratorName(DEFAULT_AGENCY_CONTACT.curatorName);
      setCuratorPhone(DEFAULT_AGENCY_CONTACT.curatorPhone);
      setEmergencyContacts(DEFAULT_AGENCY_CONTACT.emergencyContacts);
      setReferenceNumber("");
      setAdults(2);
      setChildren(0);
      setInfants(0);
      setHotelIncluded(true);
      setTransportIncluded(true);
      setSightseeingIncluded(true);
      setTransferIncluded(true);
      setTransportOrigin("ESCORA HOLIDAYS | Trivandrum, Keralam, India");
      setTransportDestination("Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India");
      setTransportVehicle("Private Dedicated Chauffeur Driven AC Sedan / SUV");
      setDays([
        {
          day: 1,
          title: "Day 1 | Arrival & Welcome",
          subtitle: "Welcome to Kerala",
          description: "Arrive at airport/railway station and transfer to accommodation.",
          meals: "Dinner at leisure",
          stay: "Stay: Heritage Resort / Hotel",
          activities: [],
        },
      ]);
      setStays([
        {
          name: "Signature Hotel / Resort",
          location: "Kerala",
          nights: 1,
          roomType: "Deluxe Room",
          mealPlan: "Breakfast",
          starRating: "5 Star",
        },
      ]);
      setInclusions([
        "Accommodation with daily breakfast",
        "Dedicated AC vehicle for all transfers and sightseeing",
        "All applicable taxes and tolls",
      ]);
      setExclusions([
        "Any items of personal nature (tips, laundry, phone calls)",
        "Airfare / train tickets unless specifically listed",
      ]);
      setPriceItems([]);
      setPriceTotal(0);
      setPricingNotes("");
    }

    setErrors({});
    setActiveTab("basic");
  }, [isOpen, templateToEdit]);

  // Recalculate priceTotal automatically if price items change
  const computedItemsTotal = useMemo(() => {
    return priceItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [priceItems]);

  const durationText = useMemo(() => {
    const nights = stays.reduce((sum, s) => sum + (Number(s.nights) || 0), 0);
    const dayCount = days.length;
    if (dayCount > 0 && nights > 0) {
      return `${dayCount} ${dayCount === 1 ? "Day" : "Days"} · ${nights} ${nights === 1 ? "Night" : "Nights"}`;
    }
    if (dayCount > 0) return `${dayCount} ${dayCount === 1 ? "Day" : "Days"}`;
    return "Flexible Duration";
  }, [days, stays]);

  // Handle Day updates
  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    setDays([
      ...days,
      {
        day: nextDayNum,
        title: `Day ${nextDayNum} | Sightseeing & Exploration`,
        subtitle: "",
        description: "",
        meals: "",
        stay: "",
        activities: [],
      },
    ]);
  };

  const handleUpdateDay = (index: number, field: keyof ItineraryDay, value: any) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: value };
    setDays(updated);
  };

  const handleRemoveDay = (index: number) => {
    const filtered = days.filter((_, i) => i !== index);
    // Renumber days
    const renumbered = filtered.map((d, i) => ({ ...d, day: i + 1 }));
    setDays(renumbered);
  };

  const handleMoveDay = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === days.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const reordered = [...days];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setDays(reordered.map((d, i) => ({ ...d, day: i + 1 })));
  };

  // Handle Stay updates
  const handleAddStay = () => {
    setStays([
      ...stays,
      {
        name: "",
        location: destination || "Kerala",
        nights: 1,
        roomType: "Deluxe Room",
        mealPlan: "Breakfast",
        starRating: "5 Star",
      },
    ]);
  };

  const handleUpdateStay = (index: number, field: keyof ItineraryStay, value: any) => {
    const updated = [...stays];
    updated[index] = { ...updated[index], [field]: value };
    setStays(updated);
  };

  const handleRemoveStay = (index: number) => {
    setStays(stays.filter((_, i) => i !== index));
  };

  // Handle Price items
  const handleAddPriceItem = () => {
    setPriceItems([...priceItems, { label: "", amount: 0 }]);
  };

  const handleUpdatePriceItem = (index: number, field: keyof ItineraryPriceItem, value: any) => {
    const updated = [...priceItems];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount" ? Number(value) || 0 : value,
    };
    setPriceItems(updated);
    setPriceTotal(updated.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  };

  const handleRemovePriceItem = (index: number) => {
    const updated = priceItems.filter((_, i) => i !== index);
    setPriceItems(updated);
    setPriceTotal(updated.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  };

  // Validate form
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!label.trim()) errs.label = "Template name is required";
    if (!title.trim()) errs.title = "Proposal title is required";
    if (!destination.trim()) errs.destination = "Destination is required";
    if (!description.trim()) errs.description = "Short description is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      setActiveTab("basic");
      toast({
        title: "Validation Error",
        description: "Please fill in all required template details marked with *.",
        variant: "destructive",
      });
      return;
    }

    const tripIncludesPayload = {
      hotel: hotelIncluded,
      transport: transportIncluded,
      sightseeing: sightseeingIncluded,
      transfer: transferIncluded,
      flights: flightsIncluded,
      weAlsoProvide: weAlsoProvide.filter((s) => s && s.toLowerCase() !== "flight tickets"),
    };

    const transportationPayload = {
      origin: transportOrigin,
      destination: transportDestination,
      vehicleType: transportVehicle,
    };

    const payload = {
      label: label.trim(),
      title: title.trim(),
      destination: destination.trim(),
      description: description.trim(),
      coverImageUrl: coverImageUrl.trim() || undefined,
      summary: summary.trim() || undefined,
      customerName: customerName.trim() || "Prospective Client",
      curatorName: curatorName.trim() || undefined,
      curatorPhone: curatorPhone.trim() || undefined,
      emergencyContacts: emergencyContacts.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      adults: Number(adults) || 2,
      children: Number(children) || 0,
      infants: Number(infants) || 0,
      tripIncludes: JSON.stringify(tripIncludesPayload),
      transportation: JSON.stringify(transportationPayload),
      days: JSON.stringify(days),
      stays: JSON.stringify(stays),
      pricing: JSON.stringify({
        items: priceItems,
        total: priceTotal || computedItemsTotal,
        notes: pricingNotes || undefined,
      }),
      inclusions: JSON.stringify(inclusions.filter((item) => item.trim())),
      exclusions: JSON.stringify(exclusions.filter((item) => item.trim())),
      hotelTerms: JSON.stringify(DEFAULT_HOTEL_TERMS),
      paymentTerms: JSON.stringify(DEFAULT_PAYMENT_TERMS),
      importantInfo: JSON.stringify(DEFAULT_IMPORTANT_INFO),
      status: "active",
    };

    if (isEdit && templateToEdit) {
      updateMutation.mutate(
        { id: templateToEdit.id, data: payload },
        {
          onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: getListItineraryTemplatesQueryKey() });
            toast({
              title: "Template Updated",
              description: `Successfully updated template "${updated.label}".`,
            });
            onSaved?.(updated);
            onClose();
          },
          onError: (err: any) => {
            toast({
              title: "Failed to Update Template",
              description: err?.message || "An unexpected error occurred while saving.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: getListItineraryTemplatesQueryKey() });
            toast({
              title: "Template Created",
              description: `Successfully created template "${created.label}".`,
            });
            onSaved?.(created);
            onClose();
          },
          onError: (err: any) => {
            toast({
              title: "Failed to Create Template",
              description: err?.message || "An unexpected error occurred while saving.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden" data-testid="template-editor-modal">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-serif text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {isEdit ? `Edit Template: ${label || templateToEdit?.label}` : "Create Itinerary Template"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1 text-muted-foreground">
                Configure reusable itinerary template with routes, stays, and day-by-day plans.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs font-medium bg-primary/5 text-primary border-primary/20">
                {durationText}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Tabbed Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="basic" className="text-xs gap-1.5" data-testid="tab-template-basic">
                <FileText className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="days" className="text-xs gap-1.5" data-testid="tab-template-days">
                <Calendar className="h-3.5 w-3.5" /> Daily Itinerary ({days.length})
              </TabsTrigger>
              <TabsTrigger value="stays" className="text-xs gap-1.5" data-testid="tab-template-stays">
                <Building className="h-3.5 w-3.5" /> Stays ({stays.length})
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs gap-1.5" data-testid="tab-template-pricing">
                <DollarSign className="h-3.5 w-3.5" /> Inclusions &amp; Pricing
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW & BASICS */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="template-label" className="text-xs font-semibold">
                    Template Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="template-label"
                    placeholder="e.g. Explora Trivandrum"
                    value={label}
                    onChange={(e) => {
                      setLabel(e.target.value);
                      if (!title || title === label) {
                        setTitle(`${e.target.value} — ${durationText}`);
                      }
                    }}
                    className={errors.label ? "border-destructive" : ""}
                    data-testid="input-template-label"
                  />
                  {errors.label && <p className="text-[11px] text-destructive">{errors.label}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="template-title" className="text-xs font-semibold">
                    Proposal Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="template-title"
                    placeholder="e.g. Explora Trivandrum — 3 Days · 2 Nights"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={errors.title ? "border-destructive" : ""}
                    data-testid="input-template-title"
                  />
                  {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="template-destination" className="text-xs font-semibold">
                    Destination / Region <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="template-destination"
                    placeholder="e.g. Trivandrum & Kovalam, Kerala"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className={errors.destination ? "border-destructive" : ""}
                    data-testid="input-template-destination"
                  />
                  {errors.destination && <p className="text-[11px] text-destructive">{errors.destination}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="template-cover-image" className="text-xs font-semibold">
                    Cover Image URL
                  </Label>
                  <Input
                    id="template-cover-image"
                    placeholder="https://... or /assets/..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    data-testid="input-template-cover-image"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="template-description" className="text-xs font-semibold">
                  Card Short Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="template-description"
                  placeholder="A concise 1-2 sentence overview shown on template cards..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={errors.description ? "border-destructive" : ""}
                  data-testid="textarea-template-description"
                />
                {errors.description && <p className="text-[11px] text-destructive">{errors.description}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="template-summary" className="text-xs font-semibold">
                  Full Journey Summary / Proposal Introduction
                </Label>
                <Textarea
                  id="template-summary"
                  placeholder="Detailed welcome narrative for client proposals..."
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  data-testid="textarea-template-summary"
                />
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
                  Curator &amp; Default Guest Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Curator Name</Label>
                    <Input
                      value={curatorName}
                      onChange={(e) => setCuratorName(e.target.value)}
                      placeholder="Midhilaj Chelakkal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Curator Phone</Label>
                    <Input
                      value={curatorPhone}
                      onChange={(e) => setCuratorPhone(e.target.value)}
                      placeholder="+91 9745585813"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Emergency Contacts</Label>
                    <Input
                      value={emergencyContacts}
                      onChange={(e) => setEmergencyContacts(e.target.value)}
                      placeholder="+91 9400 280 420 | +91 8157 003 344"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Default Adults</Label>
                    <Input
                      type="number"
                      min={1}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Default Children</Label>
                    <Input
                      type="number"
                      min={0}
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Default Infants</Label>
                    <Input
                      type="number"
                      min={0}
                      value={infants}
                      onChange={(e) => setInfants(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: DAILY ITINERARY */}
            <TabsContent value="days" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Day-by-Day Journey Plan</h3>
                  <p className="text-xs text-muted-foreground">
                    Sequenced days with arrival, activities, meals, and overnight locations.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddDay}
                  className="gap-1.5 text-xs h-8"
                  data-testid="button-add-template-day"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Day
                </Button>
              </div>

              {days.length === 0 ? (
                <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
                  <p className="text-sm font-medium">No days added to this template yet.</p>
                  <Button size="sm" variant="outline" onClick={handleAddDay} className="mt-3 text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Day 1
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {days.map((day, idx) => (
                    <Card key={idx} className="border border-border/80 bg-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-semibold text-xs">
                              Day {day.day}
                            </Badge>
                            <Input
                              value={day.title}
                              onChange={(e) => handleUpdateDay(idx, "title", e.target.value)}
                              placeholder={`Day ${day.day} Title...`}
                              className="font-medium text-xs h-8 w-64 md:w-80"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={idx === 0}
                              onClick={() => handleMoveDay(idx, "up")}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Move Up"
                            >
                              <MoveUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={idx === days.length - 1}
                              onClick={() => handleMoveDay(idx, "down")}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Move Down"
                            >
                              <MoveDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDay(idx)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Remove Day"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Subtitle (Optional)</Label>
                            <Input
                              value={day.subtitle || ""}
                              onChange={(e) => handleUpdateDay(idx, "subtitle", e.target.value)}
                              placeholder="e.g. Arrival in Trivandrum / Fort Kochi Walk"
                              className="text-xs h-7 mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Overnight Stay Note</Label>
                            <Input
                              value={day.stay || ""}
                              onChange={(e) => handleUpdateDay(idx, "stay", e.target.value)}
                              placeholder="e.g. Stay: Uday Samudra Leisure Beach Hotel"
                              className="text-xs h-7 mt-0.5"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-[11px] text-muted-foreground">Day Description &amp; Sightseeing</Label>
                          <Textarea
                            value={day.description || ""}
                            onChange={(e) => handleUpdateDay(idx, "description", e.target.value)}
                            placeholder="Detailed schedule of morning, afternoon, and evening experiences..."
                            rows={3}
                            className="text-xs mt-0.5"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] text-muted-foreground">Meals Note</Label>
                          <Input
                            value={day.meals || ""}
                            onChange={(e) => handleUpdateDay(idx, "meals", e.target.value)}
                            placeholder="e.g. Breakfast included. Dinner at leisure."
                            className="text-xs h-7 mt-0.5"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: STAYS / HOTELS */}
            <TabsContent value="stays" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Accommodations &amp; Resorts</h3>
                  <p className="text-xs text-muted-foreground">
                    Curated stays, room categories, and meal plans.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddStay}
                  className="gap-1.5 text-xs h-8"
                  data-testid="button-add-template-stay"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Stay
                </Button>
              </div>

              {stays.length === 0 ? (
                <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
                  <p className="text-sm font-medium">No stays defined yet.</p>
                  <Button size="sm" variant="outline" onClick={handleAddStay} className="mt-3 text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Hotel / Resort
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stays.map((stay, idx) => (
                    <Card key={idx} className="border border-border/80 bg-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-muted-foreground">Stay #{idx + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStay(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Remove Stay"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Property Name</Label>
                            <Input
                              value={stay.name}
                              onChange={(e) => handleUpdateStay(idx, "name", e.target.value)}
                              placeholder="e.g. The Leela Kovalam, a Raviz Hotel"
                              className="text-xs h-8 mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Location</Label>
                            <Input
                              value={stay.location || ""}
                              onChange={(e) => handleUpdateStay(idx, "location", e.target.value)}
                              placeholder="e.g. Kovalam, Kerala"
                              className="text-xs h-8 mt-0.5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Nights</Label>
                            <Input
                              type="number"
                              min={1}
                              value={stay.nights || 1}
                              onChange={(e) => handleUpdateStay(idx, "nights", Number(e.target.value) || 1)}
                              className="text-xs h-8 mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Room Type</Label>
                            <Input
                              value={stay.roomType || ""}
                              onChange={(e) => handleUpdateStay(idx, "roomType", e.target.value)}
                              placeholder="Deluxe Room"
                              className="text-xs h-8 mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Meal Plan</Label>
                            <Input
                              value={stay.mealPlan || ""}
                              onChange={(e) => handleUpdateStay(idx, "mealPlan", e.target.value)}
                              placeholder="Breakfast included"
                              className="text-xs h-8 mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Star Rating</Label>
                            <Input
                              value={stay.starRating || ""}
                              onChange={(e) => handleUpdateStay(idx, "starRating", e.target.value)}
                              placeholder="5 Star"
                              className="text-xs h-8 mt-0.5"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: INCLUSIONS & PRICING */}
            <TabsContent value="pricing" className="space-y-4 mt-0">
              {/* Trip Includes checklist */}
              <div className="p-3 bg-muted/20 border rounded-lg space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Default Trip Inclusions Checkbox Badges
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inc-hotel"
                      checked={hotelIncluded}
                      onCheckedChange={(c) => setHotelIncluded(Boolean(c))}
                    />
                    <label htmlFor="inc-hotel" className="text-xs font-medium cursor-pointer">
                      Hotel Stay
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inc-transport"
                      checked={transportIncluded}
                      onCheckedChange={(c) => setTransportIncluded(Boolean(c))}
                    />
                    <label htmlFor="inc-transport" className="text-xs font-medium cursor-pointer">
                      Chauffeur Transport
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inc-sightseeing"
                      checked={sightseeingIncluded}
                      onCheckedChange={(c) => setSightseeingIncluded(Boolean(c))}
                    />
                    <label htmlFor="inc-sightseeing" className="text-xs font-medium cursor-pointer">
                      Sightseeing
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inc-transfer"
                      checked={transferIncluded}
                      onCheckedChange={(c) => setTransferIncluded(Boolean(c))}
                    />
                    <label htmlFor="inc-transfer" className="text-xs font-medium cursor-pointer">
                      VISA
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inc-flights"
                      checked={flightsIncluded}
                      onCheckedChange={(c) => setFlightsIncluded(Boolean(c))}
                    />
                    <label htmlFor="inc-flights" className="text-xs font-medium cursor-pointer">
                      Flight Tickets
                    </label>
                  </div>
                </div>
              </div>

              {/* Optional: We Also Provide */}
              <div className="p-3 bg-muted/20 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    We Also Provide (Optional Add-on Badges)
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Shown in PDF when checked</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    "Private Guide",
                    "Photographer/ Videographer",
                  ].map((service) => {
                    const isChecked = weAlsoProvide.includes(service);
                    return (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tpl-prov-${service}`}
                          checked={isChecked}
                          onCheckedChange={(c) => {
                            if (c) {
                              setWeAlsoProvide([...weAlsoProvide, service]);
                            } else {
                              setWeAlsoProvide(weAlsoProvide.filter((s) => s !== service));
                            }
                          }}
                        />
                        <label htmlFor={`tpl-prov-${service}`} className="text-xs font-medium cursor-pointer">
                          {service}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transportation Details */}
              <div className="space-y-2 pt-1 border-t">
                <h4 className="text-xs font-semibold text-foreground">Transportation Route Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Origin / Pickup</Label>
                    <Input
                      value={transportOrigin}
                      onChange={(e) => setTransportOrigin(e.target.value)}
                      className="text-xs h-8 mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Destination / Dropoff</Label>
                    <Input
                      value={transportDestination}
                      onChange={(e) => setTransportDestination(e.target.value)}
                      className="text-xs h-8 mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Vehicle Type</Label>
                    <Input
                      value={transportVehicle}
                      onChange={(e) => setTransportVehicle(e.target.value)}
                      className="text-xs h-8 mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Included Items (one per line)</Label>
                  <Textarea
                    rows={4}
                    value={inclusions.join("\n")}
                    onChange={(e) => setInclusions(e.target.value.split("\n"))}
                    placeholder="Accommodations with daily breakfast&#10;Private dedicated chauffeur vehicle&#10;All tolls and driver allowances"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Excluded Items (one per line)</Label>
                  <Textarea
                    rows={4}
                    value={exclusions.join("\n")}
                    onChange={(e) => setExclusions(e.target.value.split("\n"))}
                    placeholder="Airfare not listed&#10;Personal expenses and tips&#10;Entry tickets for optional detours"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Indicative Pricing Items</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Base package pricing displayed in proposal cost breakdown.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddPriceItem}
                    className="gap-1 text-xs h-7"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </div>

                {priceItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={item.label}
                      onChange={(e) => handleUpdatePriceItem(idx, "label", e.target.value)}
                      placeholder="e.g. Land Package / Accommodations"
                      className="text-xs h-8 flex-1"
                    />
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={item.amount || ""}
                        onChange={(e) => handleUpdatePriceItem(idx, "amount", e.target.value)}
                        placeholder="0"
                        className="text-xs h-8 pl-6 text-right"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePriceItem(idx)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="font-semibold text-foreground">Total Proposal Amount:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      value={priceTotal}
                      onChange={(e) => setPriceTotal(Number(e.target.value) || 0)}
                      className="w-36 text-xs h-8 font-semibold text-right"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Pricing Notes</Label>
                  <Input
                    value={pricingNotes}
                    onChange={(e) => setPricingNotes(e.target.value)}
                    placeholder="e.g. Per adult on double sharing. Applicable taxes included."
                    className="text-xs h-8 mt-0.5"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/10 flex items-center justify-between gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-medium shadow-sm"
            data-testid="button-save-template"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving Template...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" /> {isEdit ? "Update Template" : "Save Template"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
