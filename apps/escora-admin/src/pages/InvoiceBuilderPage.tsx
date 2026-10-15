import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  getListInvoicesQueryKey,
} from "@/lib/invoicesApi";
import { useListOrders, useListItineraries } from "@workspace/api-client-react";
import type { InvoiceData, InvoiceItem, InvoiceBankDetails } from "@/lib/invoices";
import {
  calculateInvoiceTotals,
  parseInvoiceItems,
  parseInvoiceBankDetails,
  formatMoney,
  DEFAULT_BANK_DETAILS,
  DEFAULT_TERMS,
  DEFAULT_NOTES,
} from "@/lib/invoices";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Receipt,
  Eye,
  Save,
  CheckCircle2,
  Building,
  User,
  Compass,
} from "lucide-react";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import InvoicePrintDocument from "@/components/invoice/InvoicePrintDocument";
import { printElementById } from "@/lib/printElement";

const PRINT_TARGET_ID = "invoice-print-target";

interface InvoiceFormValues {
  invoiceNumber: string;
  orderId?: number | null;
  itineraryId?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGstin: string;
  title: string;
  destination: string;
  travelDates: string;
  guestCount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  items: InvoiceItem[];
  discount: number;
  discountType: string;
  taxRate: number;
  paidAmount: number;
  paymentTerms: string;
  bankDetails: InvoiceBankDetails;
  notes: string;
  terms: string;
}

const defaultFormValues: InvoiceFormValues = {
  invoiceNumber: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerAddress: "",
  customerGstin: "",
  title: "Bespoke Kerala Luxury Journey",
  destination: "Kerala, India",
  travelDates: "",
  guestCount: 2,
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  status: "issued",
  currency: "INR",
  items: [
    {
      description: "Curated Luxury Resort Stay & Experiential Villa Accommodation",
      hsnSac: "998555",
      quantity: 1,
      rate: 95000,
      amount: 95000,
    },
    {
      description: "Private Chauffeur-Driven Luxury Vehicle Transfer with Airport Concierge",
      hsnSac: "996411",
      quantity: 1,
      rate: 24000,
      amount: 24000,
    },
  ],
  discount: 0,
  discountType: "fixed",
  taxRate: 5,
  paidAmount: 0,
  paymentTerms: "50% advance to confirm booking; 50% balance 15 days prior to arrival.",
  bankDetails: DEFAULT_BANK_DETAILS,
  notes: DEFAULT_NOTES,
  terms: DEFAULT_TERMS,
};

export default function InvoiceBuilderPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const isEdit = !!params.id;
  const invoiceId = params.id ? Number(params.id) : undefined;

  const { data: existing, isLoading: isLoadingExisting } = useGetInvoice(invoiceId!, {
    enabled: isEdit,
  });

  const { data: orders } = useListOrders();
  const { data: itineraries } = useListItineraries();

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [printing, setPrinting] = useState<boolean>(false);

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<InvoiceFormValues>({
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedValues = watch();

  // Populate existing data when editing
  useEffect(() => {
    if (existing) {
      reset({
        invoiceNumber: existing.invoiceNumber,
        orderId: existing.orderId,
        itineraryId: existing.itineraryId,
        customerName: existing.customerName,
        customerEmail: existing.customerEmail ?? "",
        customerPhone: existing.customerPhone ?? "",
        customerAddress: existing.customerAddress ?? "",
        customerGstin: existing.customerGstin ?? "",
        title: existing.title,
        destination: existing.destination ?? "",
        travelDates: existing.travelDates ?? "",
        guestCount: existing.guestCount ?? 2,
        issueDate: existing.issueDate,
        dueDate: existing.dueDate ?? "",
        status: existing.status,
        currency: existing.currency,
        items: parseInvoiceItems(existing.items),
        discount: existing.discount ?? 0,
        discountType: existing.discountType ?? "fixed",
        taxRate: existing.taxRate ?? 5,
        paidAmount: existing.paidAmount ?? 0,
        paymentTerms: existing.paymentTerms ?? "",
        bankDetails: parseInvoiceBankDetails(existing.bankDetails),
        notes: existing.notes ?? DEFAULT_NOTES,
        terms: existing.terms ?? DEFAULT_TERMS,
      });
    } else if (!isEdit && !watchedValues.invoiceNumber) {
      // Auto-generate invoice number for new invoice
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      setValue("invoiceNumber", `ESC-INV-${new Date().getFullYear()}-${randomSeq}`);
    }
  }, [existing, isEdit]);

  // Recalculate totals in real time
  const calculated = calculateInvoiceTotals({
    items: watchedValues.items || [],
    discount: watchedValues.discount || 0,
    discountType: watchedValues.discountType || "fixed",
    taxRate: watchedValues.taxRate ?? 5,
    paidAmount: watchedValues.paidAmount || 0,
  });

  // Construct current preview invoice
  const currentPreviewData: InvoiceData = {
    id: invoiceId || 0,
    invoiceNumber: watchedValues.invoiceNumber || "ESC-INV-2026-0001",
    customerName: watchedValues.customerName || "Guest Name",
    customerEmail: watchedValues.customerEmail,
    customerPhone: watchedValues.customerPhone,
    customerAddress: watchedValues.customerAddress,
    customerGstin: watchedValues.customerGstin,
    title: watchedValues.title || "Luxury Escape",
    destination: watchedValues.destination,
    travelDates: watchedValues.travelDates,
    guestCount: watchedValues.guestCount,
    issueDate: watchedValues.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: watchedValues.dueDate,
    status: watchedValues.status || "issued",
    currency: watchedValues.currency || "INR",
    items: watchedValues.items || [],
    subtotal: calculated.subtotal,
    discount: watchedValues.discount || 0,
    discountType: watchedValues.discountType || "fixed",
    taxRate: watchedValues.taxRate ?? 5,
    taxAmount: calculated.taxAmount,
    totalAmount: calculated.totalAmount,
    paidAmount: calculated.paidAmount,
    balanceDue: calculated.balanceDue,
    paymentTerms: watchedValues.paymentTerms,
    bankDetails: watchedValues.bankDetails,
    notes: watchedValues.notes,
    terms: watchedValues.terms,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  function handleImportBooking(orderIdStr: string) {
    if (!orderIdStr || !orders) return;
    const order = orders.find((o) => String(o.id) === orderIdStr);
    if (!order) return;

    setValue("orderId", order.id);
    setValue("customerName", order.guestName || "");
    setValue("customerEmail", order.guestEmail || "");
    setValue("customerPhone", order.guestPhone || "");
    if (order.destinations) setValue("destination", order.destinations);
    if (order.packageName) setValue("title", order.packageName);
    if (order.guestCount) setValue("guestCount", order.guestCount);
    if (order.travelDate) {
      setValue("travelDates", `${order.travelDate}${order.departureDate ? ` – ${order.departureDate}` : ""}`);
    }
    if (order.totalAmount && Number(order.totalAmount) > 0) {
      setValue("items", [
        {
          description: `${order.packageName || "Curated Journey Package"} - ${order.destinations || "Kerala"}`,
          hsnSac: "998555",
          quantity: 1,
          rate: Number(order.totalAmount),
          amount: Number(order.totalAmount),
        },
      ]);
    }

    toast({
      title: "Booking details imported",
      description: `Loaded information for ${order.guestName}`,
    });
  }

  function handleImportItinerary(itineraryIdStr: string) {
    if (!itineraryIdStr || !itineraries) return;
    const it = itineraries.find((i) => String(i.id) === itineraryIdStr);
    if (!it) return;

    setValue("itineraryId", it.id);
    setValue("customerName", it.customerName || "");
    if (it.customerEmail) setValue("customerEmail", it.customerEmail);
    if (it.customerPhone) setValue("customerPhone", it.customerPhone);
    if (it.destination) setValue("destination", it.destination);
    setValue("title", it.title || "Custom Bespoke Itinerary");
    if (it.startDate || it.endDate) {
      setValue("travelDates", `${it.startDate || ""} – ${it.endDate || ""}`);
    }

    // Try parsing pricing items from itinerary
    try {
      const pricingObj = typeof it.pricing === "string" ? JSON.parse(it.pricing) : it.pricing;
      if (pricingObj?.items && Array.isArray(pricingObj.items) && pricingObj.items.length > 0) {
        const mappedItems: InvoiceItem[] = pricingObj.items.map((p: any) => ({
          description: p.label || "Curated Service Experience",
          hsnSac: "998555",
          quantity: 1,
          rate: Number(p.amount) || 0,
          amount: Number(p.amount) || 0,
        }));
        setValue("items", mappedItems);
      }
    } catch {
      // ignore
    }

    toast({
      title: "Itinerary details imported",
      description: `Loaded information from "${it.title}"`,
    });
  }

  async function handlePrintDirect() {
    setPrinting(true);
    setTimeout(async () => {
      try {
        await printElementById(PRINT_TARGET_ID);
      } catch (err) {
        console.error("Print error:", err);
      } finally {
        setPrinting(false);
      }
    }, 150);
  }

  function onSubmit(values: InvoiceFormValues) {
    const totals = calculateInvoiceTotals({
      items: values.items || [],
      discount: values.discount || 0,
      discountType: values.discountType || "fixed",
      taxRate: values.taxRate ?? 5,
      paidAmount: values.paidAmount || 0,
    });

    const payload: Partial<InvoiceData> = {
      invoiceNumber: values.invoiceNumber.trim(),
      orderId: values.orderId || null,
      itineraryId: values.itineraryId || null,
      customerName: values.customerName.trim(),
      customerEmail: values.customerEmail?.trim() || null,
      customerPhone: values.customerPhone?.trim() || null,
      customerAddress: values.customerAddress?.trim() || null,
      customerGstin: values.customerGstin?.trim() || null,
      title: values.title.trim(),
      destination: values.destination?.trim() || null,
      travelDates: values.travelDates?.trim() || null,
      guestCount: Number(values.guestCount) || 1,
      issueDate: values.issueDate,
      dueDate: values.dueDate || null,
      status: values.status,
      currency: values.currency,
      items: JSON.stringify(values.items),
      subtotal: totals.subtotal,
      discount: Number(values.discount) || 0,
      discountType: values.discountType,
      taxRate: Number(values.taxRate) || 0,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paidAmount: Number(values.paidAmount) || 0,
      balanceDue: totals.balanceDue,
      paymentTerms: values.paymentTerms?.trim() || null,
      bankDetails: JSON.stringify(values.bankDetails),
      notes: values.notes?.trim() || null,
      terms: values.terms?.trim() || null,
    };

    if (isEdit && invoiceId) {
      updateMutation.mutate(
        { id: invoiceId, data: payload },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
            toast({ title: "Invoice updated successfully" });
            navigate("/invoices");
          },
          onError: () => toast({ title: "Failed to update invoice", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          toast({ title: "Invoice created successfully" });
          navigate("/invoices");
        },
        onError: () => toast({ title: "Failed to create invoice", variant: "destructive" }),
      });
    }
  }

  if (isEdit && isLoadingExisting) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/invoices")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              {isEdit ? `Edit Invoice (${existing?.invoiceNumber})` : "Create Tax Invoice"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Prepare a luxury tax invoice voucher for client billing and accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
            className="gap-1.5"
          >
            {activeTab === "edit" ? (
              <>
                <Eye className="h-4 w-4 text-primary" />
                Live Preview
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" />
                Back to Form
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintDirect}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="gap-1.5 font-medium"
          >
            <Save className="h-4 w-4" />
            {isEdit ? "Update Invoice" : "Issue Invoice"}
          </Button>
        </div>
      </div>

      {/* Tabs: Edit vs Preview */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 w-64 mb-4">
          <TabsTrigger value="edit">Invoice Editor</TabsTrigger>
          <TabsTrigger value="preview">Luxury Preview</TabsTrigger>
        </TabsList>

        {/* Tab 1: Form Editor */}
        <TabsContent value="edit" className="space-y-6">
          {/* Quick Import Toolbar */}
          {!isEdit && (
            <Card className="border-border/80 bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono tracking-wider uppercase text-foreground font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Quick Autofill &amp; Import
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Quickly populate client contact and tour data from an existing enquiry booking or itinerary.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-0">
                {orders && orders.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Import from Bookings / Enquiries</Label>
                    <Select onValueChange={handleImportBooking}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Select a booking to import..." />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.guestName} — {o.packageName || o.destinations || "Tour"} ({formatMoney(o.totalAmount || 0, "INR")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {itineraries && itineraries.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Import from Itinerary</Label>
                    <Select onValueChange={handleImportItinerary}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Select an itinerary to import..." />
                      </SelectTrigger>
                      <SelectContent>
                        {itineraries.map((it) => (
                          <SelectItem key={it.id} value={String(it.id)}>
                            {it.title} ({it.customerName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Card 1: Invoice Meta */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Voucher &amp; Invoice Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invoiceNumber" className="text-xs">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    {...register("invoiceNumber", { required: true })}
                    className="font-mono text-sm"
                    placeholder="ESC-INV-2026-0001"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="issueDate" className="text-xs">Date of Issue *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    {...register("issueDate", { required: true })}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dueDate" className="text-xs">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="issued">Issued</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partially_paid">Partially Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Client & Billed To */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Billed To (Client Details)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName" className="text-xs">Client / Guest Name *</Label>
                  <Input
                    id="customerName"
                    {...register("customerName", { required: true })}
                    placeholder="e.g. Dr. Arvind Menon"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerEmail" className="text-xs">Email Address</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register("customerEmail")}
                    placeholder="client@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerPhone" className="text-xs">Phone / WhatsApp</Label>
                  <Input
                    id="customerPhone"
                    {...register("customerPhone")}
                    placeholder="+91 98450 12345"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="customerAddress" className="text-xs">Billing Address</Label>
                  <Textarea
                    id="customerAddress"
                    {...register("customerAddress")}
                    rows={2}
                    placeholder="Street, City, State, PIN code"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerGstin" className="text-xs">Client GSTIN / Tax ID</Label>
                  <Input
                    id="customerGstin"
                    {...register("customerGstin")}
                    placeholder="e.g. 32AABCE1234F1Z5"
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Journey Reference */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" />
                  Journey &amp; Experience Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="title" className="text-xs">Tour / Service Title *</Label>
                  <Input
                    id="title"
                    {...register("title", { required: true })}
                    placeholder="e.g. Bespoke Wayanad & Munnar Luxury Escape (5N/6D)"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="destination" className="text-xs">Destination(s)</Label>
                  <Input
                    id="destination"
                    {...register("destination")}
                    placeholder="e.g. Wayanad & Munnar, Kerala"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestCount" className="text-xs">Number of Guests</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    min={1}
                    {...register("guestCount", { valueAsNumber: true })}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="travelDates" className="text-xs">Travel Dates Period</Label>
                  <Input
                    id="travelDates"
                    {...register("travelDates")}
                    placeholder="e.g. 15 Nov 2026 – 20 Nov 2026"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-xs">Billing Currency</Label>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="AED">AED (AED)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Line Items Table */}
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground font-semibold">
                    Itemized Services &amp; Tariffs
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Break down accommodations, luxury chauffeur transfers, activities, and concierge fees.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    append({
                      description: "Bespoke Experiential Service Component",
                      hsnSac: "998555",
                      quantity: 1,
                      rate: 15000,
                      amount: 15000,
                    })
                  }
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Line Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {fields.map((field, idx) => {
                    const rowQty = watch(`items.${idx}.quantity`) || 1;
                    const rowRate = watch(`items.${idx}.rate`) || 0;
                    const rowTotal = rowQty * rowRate;

                    return (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-lg border border-border/70 bg-muted/20 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs text-muted-foreground font-bold mt-1">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Description of Service</Label>
                            <Textarea
                              {...register(`items.${idx}.description` as const, { required: true })}
                              rows={2}
                              placeholder="e.g. 5 Nights Luxury Villa Stay with Private Pool..."
                              className="text-sm bg-background"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(idx)}
                            disabled={fields.length === 1}
                            className="text-muted-foreground hover:text-destructive h-8 w-8 mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">HSN / SAC Code</Label>
                            <Input
                              {...register(`items.${idx}.hsnSac` as const)}
                              placeholder="998555"
                              className="h-8 text-xs font-mono bg-background"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Quantity</Label>
                            <Input
                              type="number"
                              min={1}
                              {...register(`items.${idx}.quantity` as const, {
                                valueAsNumber: true,
                                onChange: () => {
                                  setValue(`items.${idx}.amount` as const, rowQty * rowRate);
                                },
                              })}
                              className="h-8 text-xs font-mono bg-background"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Unit Rate ({watchedValues.currency})</Label>
                            <Input
                              type="number"
                              min={0}
                              {...register(`items.${idx}.rate` as const, {
                                valueAsNumber: true,
                                onChange: () => {
                                  setValue(`items.${idx}.amount` as const, rowQty * rowRate);
                                },
                              })}
                              className="h-8 text-xs font-mono bg-background"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Row Total</Label>
                            <div className="h-8 px-3 rounded-md border border-border/50 bg-muted/40 flex items-center font-mono text-xs font-semibold text-foreground">
                              {formatMoney(rowTotal, watchedValues.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal & Calculations Card */}
                <div className="p-4 rounded-lg border border-border/80 bg-muted/30 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Discount</Label>
                      <div className="flex gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          {...register("discount", { valueAsNumber: true })}
                          className="h-8 text-xs font-mono w-24"
                        />
                        <Controller
                          control={control}
                          name="discountType"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="h-8 text-xs w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed (₹)</SelectItem>
                                <SelectItem value="percentage">Percent (%)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">GST / Tax Rate</Label>
                      <Controller
                        control={control}
                        name="taxRate"
                        render={({ field }) => (
                          <Select
                            value={String(field.value)}
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <SelectTrigger className="h-8 text-xs w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5% (Tour Operator)</SelectItem>
                              <SelectItem value="12">12% (Hotel Standard)</SelectItem>
                              <SelectItem value="18">18% (Standard Services)</SelectItem>
                              <SelectItem value="0">0% (Nil / Exempt)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Paid to date</Label>
                      <Input
                        type="number"
                        min={0}
                        {...register("paidAmount", { valueAsNumber: true })}
                        className="h-8 text-xs font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="w-full md:w-64 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>{formatMoney(calculated.subtotal, watchedValues.currency)}</span>
                    </div>
                    {calculated.discountAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount:</span>
                        <span>-{formatMoney(calculated.discountAmount, watchedValues.currency)}</span>
                      </div>
                    )}
                    {calculated.taxAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST ({watchedValues.taxRate}%):</span>
                        <span>+{formatMoney(calculated.taxAmount, watchedValues.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                      <span>Grand Total:</span>
                      <span className="text-foreground font-bold">{formatMoney(calculated.totalAmount, watchedValues.currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span>Balance Due:</span>
                      <span className="text-foreground">{formatMoney(calculated.balanceDue, watchedValues.currency)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Bank Details & Payment Instructions */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Bank Wire Details &amp; Payment Settlement
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName" className="text-xs">Bank Name</Label>
                  <Input
                    id="bankName"
                    {...register("bankDetails.bankName")}
                    placeholder="HDFC Bank Ltd."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accountName" className="text-xs">Account Beneficiary Name</Label>
                  <Input
                    id="accountName"
                    {...register("bankDetails.accountName")}
                    placeholder="ESCORA HOLIDAYS PRIVATE LIMITED"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber" className="text-xs">Account Number</Label>
                  <Input
                    id="accountNumber"
                    {...register("bankDetails.accountNumber")}
                    className="font-mono text-sm"
                    placeholder="50200088992211"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ifsc" className="text-xs">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    {...register("bankDetails.ifsc")}
                    className="font-mono text-xs uppercase"
                    placeholder="HDFC0000123"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="branch" className="text-xs">Branch Location</Label>
                  <Input
                    id="branch"
                    {...register("bankDetails.branch")}
                    placeholder="Mavoor Road, Kozhikode"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="upiId" className="text-xs">UPI ID / QR ID</Label>
                  <Input
                    id="upiId"
                    {...register("bankDetails.upiId")}
                    placeholder="escoraholidays@okhdfcbank"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <Label htmlFor="paymentTerms" className="text-xs">Payment Schedule / Terms</Label>
                  <Input
                    id="paymentTerms"
                    {...register("paymentTerms")}
                    placeholder="e.g. 50% advance to confirm, balance 15 days prior to arrival."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 6: Notes & Terms */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground font-semibold">
                  Notes &amp; Luxury Booking Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs">Voucher Notes / Client Message</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    rows={4}
                    placeholder="Message shown to client..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="terms" className="text-xs">Terms &amp; Cancellation Conditions</Label>
                  <Textarea
                    id="terms"
                    {...register("terms")}
                    rows={4}
                    placeholder="Detailed terms and dispute resolution clauses..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bottom Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/invoices")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("preview")}
                className="gap-1.5"
              >
                <Eye className="h-4 w-4 text-primary" />
                Preview Document
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="gap-1.5 font-medium px-6"
              >
                <Save className="h-4 w-4" />
                {isEdit ? "Update Invoice" : "Issue Invoice"}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Tab 2: Live Preview */}
        <TabsContent value="preview" className="pt-2">
          <InvoiceDocument
            invoice={currentPreviewData}
            onPrint={handlePrintDirect}
            onEdit={() => setActiveTab("edit")}
          />
        </TabsContent>
      </Tabs>

      {/* Hidden Print Target */}
      {printing && <InvoicePrintDocument invoice={currentPreviewData} id={PRINT_TARGET_ID} />}
    </div>
  );
}
