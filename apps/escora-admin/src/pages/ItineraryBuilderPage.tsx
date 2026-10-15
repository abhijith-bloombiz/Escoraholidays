import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetItinerary,
  useCreateItinerary,
  useUpdateItinerary,
  getListItinerariesQueryKey,
  getGetItineraryQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, ChevronLeft, FileText, CheckSquare } from "lucide-react";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  parseTripIncludes,
  parseTransportation,
  computePricingTotal,
  DEFAULT_HOTEL_TERMS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_IMPORTANT_INFO,
  DEFAULT_EXCLUSIONS,
  DEFAULT_TRIP_INCLUDES,
  DEFAULT_AGENCY_CONTACT,
  type ItineraryDay,
  type ItineraryStay,
  type ItineraryPricing,
} from "@/lib/itinerary";
import { itineraryTemplates, type ItineraryTemplate } from "@/lib/itineraryTemplates";
import ImageUploadField from "@/components/ImageUploadField";

interface BuilderForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  summary: string;
  currency: string;
  status: string;
  referenceNumber: string;
  curatorName: string;
  curatorPhone: string;
  emergencyContacts: string;
  adults: number;
  children: number;
  infants: number;
  hotelIncluded: boolean;
  transportIncluded: boolean;
  sightseeingIncluded: boolean;
  transferIncluded: boolean;
  transportOrigin: string;
  transportDestination: string;
  transportVehicle: string;
  days: ItineraryDay[];
  stays: ItineraryStay[];
  pricing: ItineraryPricing;
  inclusionsText: string;
  exclusionsText: string;
  hotelTermsText: string;
  paymentTermsText: string;
  importantInfoText: string;
}

const emptyForm: BuilderForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  coverImageUrl: "",
  summary: "",
  currency: "INR",
  status: "draft",
  referenceNumber: "",
  curatorName: DEFAULT_AGENCY_CONTACT.curatorName,
  curatorPhone: DEFAULT_AGENCY_CONTACT.curatorPhone,
  emergencyContacts: DEFAULT_AGENCY_CONTACT.emergencyContacts,
  adults: 1,
  children: 0,
  infants: 0,
  hotelIncluded: true,
  transportIncluded: true,
  sightseeingIncluded: true,
  transferIncluded: true,
  transportOrigin: "ESCORA HOLIDAYS | Trivandrum, Keralam, India",
  transportDestination: "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
  transportVehicle: "Private Dedicated Chauffeur Driven AC Sedan / SUV",
  days: [],
  stays: [],
  pricing: { items: [], total: 0 },
  inclusionsText: "",
  exclusionsText: DEFAULT_EXCLUSIONS.join("\n"),
  hotelTermsText: DEFAULT_HOTEL_TERMS.join("\n"),
  paymentTermsText: DEFAULT_PAYMENT_TERMS.join("\n"),
  importantInfoText: DEFAULT_IMPORTANT_INFO.join("\n"),
};

function templateToFormValues(template: ItineraryTemplate): BuilderForm {
  return {
    ...emptyForm,
    title: template.title,
    customerName: template.customerName || "",
    destination: template.destination,
    startDate: template.startDate || "",
    endDate: template.endDate || "",
    coverImageUrl: template.coverImageUrl || "",
    summary: template.summary || "",
    referenceNumber: template.referenceNumber || "",
    curatorName: template.curatorName || DEFAULT_AGENCY_CONTACT.curatorName,
    curatorPhone: template.curatorPhone || DEFAULT_AGENCY_CONTACT.curatorPhone,
    emergencyContacts: template.emergencyContacts || DEFAULT_AGENCY_CONTACT.emergencyContacts,
    adults: template.adults ?? 1,
    children: template.children ?? 0,
    infants: template.infants ?? 0,
    hotelIncluded: template.tripIncludes?.hotel ?? true,
    transportIncluded: template.tripIncludes?.transport ?? true,
    sightseeingIncluded: template.tripIncludes?.sightseeing ?? true,
    transferIncluded: template.tripIncludes?.transfer ?? true,
    transportOrigin: template.transportation?.origin || "ESCORA HOLIDAYS | Trivandrum, Keralam, India",
    transportDestination: template.transportation?.destination || "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
    transportVehicle: template.transportation?.vehicleType || "Private AC Vehicle",
    days: template.days,
    stays: template.stays,
    pricing: template.pricing,
    inclusionsText: template.inclusions.join("\n"),
    exclusionsText: (template.exclusions.length > 0 ? template.exclusions : DEFAULT_EXCLUSIONS).join("\n"),
    hotelTermsText: (template.hotelTerms || DEFAULT_HOTEL_TERMS).join("\n"),
    paymentTermsText: (template.paymentTerms || DEFAULT_PAYMENT_TERMS).join("\n"),
    importantInfoText: (template.importantInfo || DEFAULT_IMPORTANT_INFO).join("\n"),
  };
}

export default function ItineraryBuilderPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const itineraryId = params.id ? Number(params.id) : undefined;

  const { data: existing, isLoading } = useGetItinerary(itineraryId!, {
    query: { enabled: isEdit, queryKey: getGetItineraryQueryKey(itineraryId!) },
  });
  const createMutation = useCreateItinerary();
  const updateMutation = useUpdateItinerary();

  const { register, control, handleSubmit, reset, watch } = useForm<BuilderForm>({
    defaultValues: emptyForm,
  });

  const [templateChoice, setTemplateChoice] = useState<"blank" | string | null>(isEdit ? "blank" : null);

  const daysArray = useFieldArray({ control, name: "days" });
  const staysArray = useFieldArray({ control, name: "stays" });
  const priceItemsArray = useFieldArray({ control, name: "pricing.items" });

  const watchedPricing = watch("pricing");

  useEffect(() => {
    if (existing) {
      const tripInc = parseTripIncludes(existing.tripIncludes);
      const transport = parseTransportation(existing.transportation);
      const hTerms = parseStringList(existing.hotelTerms);
      const pTerms = parseStringList(existing.paymentTerms);
      const iInfo = parseStringList(existing.importantInfo);

      reset({
        customerName: existing.customerName,
        customerEmail: existing.customerEmail ?? "",
        customerPhone: existing.customerPhone ?? "",
        title: existing.title,
        destination: existing.destination ?? "",
        startDate: existing.startDate ?? "",
        endDate: existing.endDate ?? "",
        coverImageUrl: existing.coverImageUrl ?? "",
        summary: existing.summary ?? "",
        currency: existing.currency,
        status: existing.status,
        referenceNumber: existing.referenceNumber ?? "",
        curatorName: existing.curatorName ?? DEFAULT_AGENCY_CONTACT.curatorName,
        curatorPhone: existing.curatorPhone ?? DEFAULT_AGENCY_CONTACT.curatorPhone,
        emergencyContacts: existing.emergencyContacts ?? DEFAULT_AGENCY_CONTACT.emergencyContacts,
        adults: existing.adults ?? 1,
        children: existing.children ?? 0,
        infants: existing.infants ?? 0,
        hotelIncluded: tripInc.hotel,
        transportIncluded: tripInc.transport,
        sightseeingIncluded: tripInc.sightseeing,
        transferIncluded: tripInc.transfer,
        transportOrigin: transport?.origin ?? "ESCORA HOLIDAYS | Trivandrum, Keralam, India",
        transportDestination: transport?.destination ?? "Trivandrum International Airport (TRV), Chacka, Thiruvananthapuram, Keralam, India",
        transportVehicle: transport?.vehicleType ?? "Private AC Vehicle",
        days: parseDays(existing.days),
        stays: parseStays(existing.stays),
        pricing: parsePricing(existing.pricing),
        inclusionsText: parseStringList(existing.inclusions).join("\n"),
        exclusionsText: parseStringList(existing.exclusions).join("\n"),
        hotelTermsText: (hTerms.length > 0 ? hTerms : DEFAULT_HOTEL_TERMS).join("\n"),
        paymentTermsText: (pTerms.length > 0 ? pTerms : DEFAULT_PAYMENT_TERMS).join("\n"),
        importantInfoText: (iInfo.length > 0 ? iInfo : DEFAULT_IMPORTANT_INFO).join("\n"),
      });
    }
  }, [existing, reset]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
  }

  const onSubmit = (form: BuilderForm) => {
    const total = computePricingTotal(form.pricing);
    const data = {
      customerName: form.customerName,
      customerEmail: form.customerEmail || undefined,
      customerPhone: form.customerPhone || undefined,
      title: form.title,
      destination: form.destination || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      summary: form.summary || undefined,
      currency: form.currency,
      status: form.status,
      referenceNumber: form.referenceNumber || undefined,
      curatorName: form.curatorName || undefined,
      curatorPhone: form.curatorPhone || undefined,
      emergencyContacts: form.emergencyContacts || undefined,
      adults: Number(form.adults) || 1,
      children: Number(form.children) || 0,
      infants: Number(form.infants) || 0,
      tripIncludes: JSON.stringify({
        hotel: form.hotelIncluded,
        transport: form.transportIncluded,
        sightseeing: form.sightseeingIncluded,
        transfer: form.transferIncluded,
      }),
      transportation: JSON.stringify({
        origin: form.transportOrigin,
        destination: form.transportDestination,
        vehicleType: form.transportVehicle,
      }),
      days: JSON.stringify(form.days.map((d, i) => ({ ...d, day: d.day || i + 1 }))),
      stays: JSON.stringify(form.stays),
      pricing: JSON.stringify({ ...form.pricing, total }),
      inclusions: JSON.stringify(form.inclusionsText.split("\n").map(s => s.trim()).filter(Boolean)),
      exclusions: JSON.stringify(form.exclusionsText.split("\n").map(s => s.trim()).filter(Boolean)),
      hotelTerms: JSON.stringify(form.hotelTermsText.split("\n").map(s => s.trim()).filter(Boolean)),
      paymentTerms: JSON.stringify(form.paymentTermsText.split("\n").map(s => s.trim()).filter(Boolean)),
      importantInfo: JSON.stringify(form.importantInfoText.split("\n").map(s => s.trim()).filter(Boolean)),
    };

    if (isEdit && itineraryId) {
      updateMutation.mutate({ id: itineraryId, data }, {
        onSuccess: () => { invalidate(); toast({ title: "Itinerary updated" }); navigate("/itineraries"); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => { invalidate(); toast({ title: "Itinerary created" }); navigate("/itineraries"); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const total = computePricingTotal(watchedPricing ?? { items: [], total: 0 });

  if (!isEdit && templateChoice === null) {
    return (
      <div data-testid="itinerary-builder-page">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/itineraries")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif">New Itinerary</h1>
            <p className="text-muted-foreground mt-1">Start from the master reference template, or build one from scratch.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors border-dashed"
            onClick={() => setTemplateChoice("blank")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" /> Blank Itinerary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Start with an empty day-by-day plan.</p>
            </CardContent>
          </Card>

          {itineraryTemplates.map(t => (
            <Card
              key={t.id}
              className={`cursor-pointer hover:border-primary transition-colors ${
                t.id === "explora-trivandrum" ? "border-amber-500/80 bg-amber-50/20" : ""
              }`}
              onClick={() => {
                setTemplateChoice(t.id);
                reset(templateToFormValues(t));
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> {t.label}
                  </CardTitle>
                  {t.id === "explora-trivandrum" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded">
                      Reference PDF
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {t.days.length} days · {t.stays.length} stays
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="itinerary-builder-page">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/itineraries")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-serif">{isEdit ? "Edit Itinerary" : "New Itinerary"}</h1>
          <p className="text-muted-foreground mt-1">Build a day-by-day travel plan matching the master reference dossier.</p>
        </div>
      </div>

      {!isEdit && (
        <button
          type="button"
          onClick={() => {
            setTemplateChoice(null);
            reset(emptyForm);
          }}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
          data-testid="button-change-template"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Change template
        </button>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer & trip details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Customer Name *</Label>
                <Input {...register("customerName", { required: true })} placeholder="MARIA ROY" data-testid="input-customer-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Customer Email</Label>
                <Input type="email" {...register("customerEmail")} placeholder="customer@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Customer Phone</Label>
                <Input {...register("customerPhone")} placeholder="+91 9999999999" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Itinerary Title *</Label>
                <Input {...register("title", { required: true })} placeholder="Explora Trivandrum" data-testid="input-title" />
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Input {...register("destination")} placeholder="Trivandrum, Keralam, India | Kovalam, Keralam, India" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" {...register("startDate")} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" {...register("endDate")} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Reference Number & Passengers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
              <div className="space-y-1.5">
                <Label>Reference Number</Label>
                <Input {...register("referenceNumber")} placeholder="L100021/Q1020" />
              </div>
              <div className="space-y-1.5">
                <Label>Adults</Label>
                <Input type="number" min={1} {...register("adults", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Children</Label>
                <Input type="number" min={0} {...register("children", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Infants</Label>
                <Input type="number" min={0} {...register("infants", { valueAsNumber: true })} />
              </div>
            </div>

            {/* Curator & Emergency Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-1.5">
                <Label>Itinerary Curator</Label>
                <Input {...register("curatorName")} placeholder="Midhilaj Chelakkal" />
              </div>
              <div className="space-y-1.5">
                <Label>Curator Phone</Label>
                <Input {...register("curatorPhone")} placeholder="+91 9745585813" />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency Contacts</Label>
                <Input {...register("emergencyContacts")} placeholder="+91 9400280420 | +91 8157003344" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cover Photo</Label>
              <Controller
                control={control}
                name="coverImageUrl"
                render={({ field }) => (
                  <ImageUploadField value={field.value} onChange={field.onChange} label="Cover photo" size="wide" />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea {...register("summary")} rows={2} placeholder="A short intro to the journey." />
            </div>
          </CardContent>
        </Card>

        {/* Your Trip Includes Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Trip Includes (Feature Toggles)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-neutral-50">
                <input type="checkbox" {...register("hotelIncluded")} className="w-4 h-4 rounded text-primary" />
                <span className="text-sm font-medium">Hotel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-neutral-50">
                <input type="checkbox" {...register("transportIncluded")} className="w-4 h-4 rounded text-primary" />
                <span className="text-sm font-medium">Transport</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-neutral-50">
                <input type="checkbox" {...register("sightseeingIncluded")} className="w-4 h-4 rounded text-primary" />
                <span className="text-sm font-medium">Sight-Seeing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-neutral-50">
                <input type="checkbox" {...register("transferIncluded")} className="w-4 h-4 rounded text-primary" />
                <span className="text-sm font-medium">Transfer</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Transportation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transportation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Origin / Pickup</Label>
                <Input {...register("transportOrigin")} placeholder="ESCORA HOLIDAYS | Trivandrum, Keralam, India" />
              </div>
              <div className="space-y-1.5">
                <Label>Destination / Drop-off</Label>
                <Input {...register("transportDestination")} placeholder="Trivandrum International Airport (TRV), Chacka..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle Type &amp; Services</Label>
              <Input {...register("transportVehicle")} placeholder="Private Dedicated Chauffeur Driven AC Sedan / SUV" />
            </div>
          </CardContent>
        </Card>

        {/* Day by day */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Day-by-Day Plan</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => daysArray.append({ day: daysArray.fields.length + 1, title: "", activities: [] })}
              data-testid="button-add-day"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Day
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {daysArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No days added yet. Click "Add Day" to start building the plan.</p>
            )}
            {daysArray.fields.map((field, dayIndex) => (
              <DayCard
                key={field.id}
                control={control}
                register={register}
                dayIndex={dayIndex}
                onRemove={() => daysArray.remove(dayIndex)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Stays / Budget & Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Budget &amp; Pricing (Accommodations)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => staysArray.append({ name: "", mealPlan: "BreakFast", starRating: "5 Star", rooms: 1, nights: 1 })}
              data-testid="button-add-stay"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Hotel / Stay
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {staysArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No stays added yet.</p>
            )}
            {staysArray.fields.map((field, i) => (
              <div key={field.id} className="border rounded-md p-4 space-y-3 bg-neutral-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-800">Hotel Entry {i + 1}</p>
                  <Button type="button" variant="ghost" size="icon" onClick={() => staysArray.remove(i)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Hotel Name</Label>
                    <Input {...register(`stays.${i}.name` as const)} placeholder="Uday Samudra Leisure Beach Hotel" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Location</Label>
                    <Input {...register(`stays.${i}.location` as const)} placeholder="Trivandrum, Keralam, India" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Star Rating</Label>
                    <Input {...register(`stays.${i}.starRating` as const)} placeholder="5 Star" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nights</Label>
                    <Input type="number" min={1} {...register(`stays.${i}.nights` as const, { valueAsNumber: true })} placeholder="1" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rooms</Label>
                    <Input type="number" min={1} {...register(`stays.${i}.rooms` as const, { valueAsNumber: true })} placeholder="1" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meal Plan</Label>
                    <Input {...register(`stays.${i}.mealPlan` as const)} placeholder="BreakFast" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Inclusions / Exclusions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inclusions &amp; Exclusions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Inclusions (one per line)</Label>
              <Textarea {...register("inclusionsText")} rows={4} placeholder={"Airport transfers\nDaily breakfast\n..."} />
            </div>
            <div className="space-y-1.5">
              <Label>Exclusions (one per line)</Label>
              <Textarea {...register("exclusionsText")} rows={4} placeholder={"Any item of personal nature like tips...\n..."} />
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Terms &amp; Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Hotel Terms &amp; Conditions (one per line)</Label>
              <Textarea {...register("hotelTermsText")} rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms &amp; Conditions (one per line)</Label>
              <Textarea {...register("paymentTermsText")} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Important Information (one per line)</Label>
              <Textarea {...register("importantInfoText")} rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Package Pricing Breakdown</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => priceItemsArray.append({ label: "", amount: 0 })}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Price Component
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {priceItemsArray.fields.map((field, i) => (
              <div key={field.id} className="flex gap-3 items-center">
                <Input
                  {...register(`pricing.items.${i}.label` as const)}
                  placeholder="Component description"
                  className="flex-1"
                />
                <Input
                  type="number"
                  {...register(`pricing.items.${i}.amount` as const, { valueAsNumber: true })}
                  placeholder="Amount"
                  className="w-40"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => priceItemsArray.remove(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t">
              <p className="text-lg font-semibold">Total Package Price: {watch("currency") === "INR" ? "₹" : watch("currency") + " "}{total.toLocaleString("en-IN")}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/itineraries")}>
            <ChevronLeft className="h-4 w-4 mr-1.5" /> Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-itinerary">
            {isEdit ? "Save Changes" : "Create Itinerary"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function DayCard({
  control,
  register,
  dayIndex,
  onRemove,
}: {
  control: any;
  register: any;
  dayIndex: number;
  onRemove: () => void;
}) {
  const activitiesArray = useFieldArray({ control, name: `days.${dayIndex}.activities` });

  return (
    <div className="border rounded-md p-4 space-y-3 bg-neutral-50/40">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-800">Day {dayIndex + 1}</p>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <Controller
          control={control}
          name={`days.${dayIndex}.imageUrl` as const}
          render={({ field }) => (
            <ImageUploadField value={field.value} onChange={field.onChange} label="Day photo" />
          )}
        />
        <div className="flex-1 space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <Input {...register(`days.${dayIndex}.title` as const)} placeholder="Header e.g. Day 1 | Thursday | 29 Oct 2026" />
            <Input {...register(`days.${dayIndex}.subtitle` as const)} placeholder="Subtitle e.g. Arrival in Trivandrum" />
            <Input type="date" {...register(`days.${dayIndex}.date` as const)} />
          </div>
          <Textarea {...register(`days.${dayIndex}.description` as const)} rows={3} placeholder="Day detailed sightseeing description paragraphs" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <Input {...register(`days.${dayIndex}.stay` as const)} placeholder="Stay e.g. Uday Samudra Leisure Beach Hotel" />
            <Input {...register(`days.${dayIndex}.meals` as const)} placeholder="Meals note e.g. Dinner at leisure." />
          </div>
          <Input {...register(`days.${dayIndex}.optionalActivities` as const)} placeholder="Optional (on request) activities" />
        </div>
      </div>

      <div className="pl-4 border-l-2 space-y-2 mt-2">
        {activitiesArray.fields.map((field, actIndex) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input {...register(`days.${dayIndex}.activities.${actIndex}.time` as const)} placeholder="Time" className="w-24" />
            <Input {...register(`days.${dayIndex}.activities.${actIndex}.title` as const)} placeholder="Activity" className="flex-1" />
            <Input {...register(`days.${dayIndex}.activities.${actIndex}.description` as const)} placeholder="Details" className="flex-1" />
            <Button type="button" variant="ghost" size="icon" onClick={() => activitiesArray.remove(actIndex)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => activitiesArray.append({ title: "" })}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Time-stamped Activity
        </Button>
      </div>
    </div>
  );
}
