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
import { ArrowLeft, Plus, Trash2, ChevronLeft, FileText } from "lucide-react";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  computePricingTotal,
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
  days: ItineraryDay[];
  stays: ItineraryStay[];
  pricing: ItineraryPricing;
  inclusionsText: string;
  exclusionsText: string;
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
  days: [],
  stays: [],
  pricing: { items: [], total: 0 },
  inclusionsText: "",
  exclusionsText: "",
};

function templateToFormValues(template: ItineraryTemplate): BuilderForm {
  return {
    ...emptyForm,
    title: template.title,
    destination: template.destination,
    days: template.days,
    stays: template.stays,
    pricing: template.pricing,
    inclusionsText: template.inclusions.join("\n"),
    exclusionsText: template.exclusions.join("\n"),
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
        days: parseDays(existing.days),
        stays: parseStays(existing.stays),
        pricing: parsePricing(existing.pricing),
        inclusionsText: parseStringList(existing.inclusions).join("\n"),
        exclusionsText: parseStringList(existing.exclusions).join("\n"),
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
      days: JSON.stringify(form.days.map((d, i) => ({ ...d, day: d.day || i + 1 }))),
      stays: JSON.stringify(form.stays),
      pricing: JSON.stringify({ ...form.pricing, total }),
      inclusions: JSON.stringify(form.inclusionsText.split("\n").map(s => s.trim()).filter(Boolean)),
      exclusions: JSON.stringify(form.exclusionsText.split("\n").map(s => s.trim()).filter(Boolean)),
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
            <p className="text-muted-foreground mt-1">Start from a template, or build one from scratch.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setTemplateChoice("blank")}
            data-testid="template-card-blank"
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Start Blank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Build a new itinerary from an empty form.</p>
              <Button type="button" size="sm" variant="outline" className="w-full">
                Use this
              </Button>
            </CardContent>
          </Card>
          {itineraryTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                reset(templateToFormValues(template));
                setTemplateChoice(template.id);
              }}
              data-testid={`template-card-${template.id}`}
            >
              <CardHeader>
                <CardTitle className="text-base">{template.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <Button type="button" size="sm" variant="outline" className="w-full">
                  Use this template
                </Button>
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
          <p className="text-muted-foreground mt-1">Build a day-by-day travel plan with pricing.</p>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Customer Name *</Label>
                <Input {...register("customerName", { required: true })} data-testid="input-customer-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Customer Email</Label>
                <Input type="email" {...register("customerEmail")} />
              </div>
              <div className="space-y-1.5">
                <Label>Customer Phone</Label>
                <Input {...register("customerPhone")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Itinerary Title *</Label>
                <Input {...register("title", { required: true })} placeholder="7 Nights Kerala — The Iyer Family" data-testid="input-title" />
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Input {...register("destination")} placeholder="Kerala, India" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
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
              <Textarea {...register("summary")} rows={3} placeholder="A short intro to the journey shown at the top of the itinerary." />
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

        {/* Stays */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Stays</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => staysArray.append({ name: "" })}
              data-testid="button-add-stay"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Stay
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {staysArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No stays added yet.</p>
            )}
            {staysArray.fields.map((field, i) => (
              <div key={field.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Stay {i + 1}</p>
                  <Button type="button" variant="ghost" size="icon" onClick={() => staysArray.remove(i)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input {...register(`stays.${i}.name` as const)} placeholder="Hotel / Resort Name" />
                  <Input {...register(`stays.${i}.location` as const)} placeholder="Location" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <Input type="date" {...register(`stays.${i}.checkIn` as const)} />
                  <Input type="date" {...register(`stays.${i}.checkOut` as const)} />
                  <Input type="number" {...register(`stays.${i}.nights` as const, { valueAsNumber: true })} placeholder="Nights" />
                  <Input {...register(`stays.${i}.roomType` as const)} placeholder="Room Type" />
                </div>
                <Input {...register(`stays.${i}.notes` as const)} placeholder="Notes" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Inclusions / Exclusions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inclusions &amp; Exclusions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Inclusions (one per line)</Label>
              <Textarea {...register("inclusionsText")} rows={5} placeholder={"Airport transfers\nDaily breakfast\n..."} />
            </div>
            <div className="space-y-1.5">
              <Label>Exclusions (one per line)</Label>
              <Textarea {...register("exclusionsText")} rows={5} placeholder={"Flights\nPersonal expenses\n..."} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pricing</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => priceItemsArray.append({ label: "", amount: 0 })}
              data-testid="button-add-price-item"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Line Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {priceItemsArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No pricing line items yet.</p>
            )}
            {priceItemsArray.fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-3">
                <Input {...register(`pricing.items.${i}.label` as const)} placeholder="e.g. Accommodation (5N)" className="flex-1" />
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
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label>Discount</Label>
                <Input type="number" {...register("pricing.discount", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Taxes &amp; Fees</Label>
                <Input type="number" {...register("pricing.taxes", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pricing Notes</Label>
              <Input {...register("pricing.notes")} placeholder="e.g. Price valid for travel before March 2027" />
            </div>
            <div className="flex justify-end pt-2 border-t">
              <p className="text-lg font-semibold">Total: {watch("currency") === "INR" ? "₹" : watch("currency") + " "}{total.toLocaleString("en-IN")}</p>
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
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Day {dayIndex + 1}</p>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      <div className="flex gap-3">
        <Controller
          control={control}
          name={`days.${dayIndex}.imageUrl` as const}
          render={({ field }) => (
            <ImageUploadField value={field.value} onChange={field.onChange} label="Day photo" />
          )}
        />
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input {...register(`days.${dayIndex}.title` as const)} placeholder="Day title, e.g. Arrival in Kochi" />
            <Input type="date" {...register(`days.${dayIndex}.date` as const)} />
          </div>
          <Textarea {...register(`days.${dayIndex}.description` as const)} rows={2} placeholder="Day summary" />
        </div>
      </div>

      <div className="pl-4 border-l-2 space-y-2">
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
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Activity
        </Button>
      </div>
    </div>
  );
}
