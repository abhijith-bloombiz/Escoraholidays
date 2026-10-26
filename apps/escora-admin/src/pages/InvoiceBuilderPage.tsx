import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useGetNextInvoiceNumber,
  useListInvoices,
  getListInvoicesQueryKey,
} from "@/lib/invoicesApi";
import { useListOrders, useListItineraries } from "@workspace/api-client-react";
import type {
  InvoiceData,
  InvoiceItem,
  InvoiceBankDetails,
  InvoicePayment,
} from "@/lib/invoices";
import {
  calculateInvoiceTotals,
  parseInvoiceItems,
  parseInvoiceBankDetails,
  parseInvoicePayments,
  formatMoney,
  DEFAULT_BANK_DETAILS,
  DEFAULT_TERMS,
  DEFAULT_NOTES,
  GST_ADVISORY_NOTE,
} from "@/lib/invoices";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Building,
  User,
  Compass,
  CreditCard,
  Info,
  Calendar,
  AlertTriangle,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import InvoicePrintDocument from "@/components/invoice/InvoicePrintDocument";
import { printElementById } from "@/lib/printElement";
import {
  parseItineraryForInvoice,
  parseBookingForInvoice,
  type ImportedCustomerData,
  type ImportedFinancialData,
} from "@/lib/invoiceImport";
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
import { Checkbox } from "@/components/ui/checkbox";

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
  taxType: string;
  taxRateSelect: string; // '5' | '12' | '18' | '28' | '0' | 'custom'
  customTaxRate: number;
  payments: InvoicePayment[];
  paymentTerms: string;
  bankDetails: InvoiceBankDetails;
  notes: string;
  terms: string;
  revisionReason?: string;
}

const defaultFormValues: InvoiceFormValues = {
  invoiceNumber: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerAddress: "",
  customerGstin: "",
  title: "Kerala Tour Package",
  destination: "Kerala, India",
  travelDates: "",
  guestCount: 2,
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  status: "issued",
  currency: "INR",
  items: [
    {
      description: "",
      hsnSac: "998555",
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ],
  discount: 0,
  discountType: "fixed",
  taxType: "cgst_sgst",
  taxRateSelect: "5",
  customTaxRate: 5,
  payments: [],
  paymentTerms: "50% advance to confirm booking; 50% balance 15 days prior to arrival.",
  bankDetails: DEFAULT_BANK_DETAILS,
  notes: DEFAULT_NOTES,
  terms: DEFAULT_TERMS,
  revisionReason: "",
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

  const { data: invoicesList } = useListInvoices();
  const { data: nextNumberData } = useGetNextInvoiceNumber();
  const { data: orders } = useListOrders();
  const { data: itineraries } = useListItineraries();

  const hasInitializedFromPrevious = useRef(false);

  // Retrieve previous invoice data if available
  const previousInvoice = useMemo(() => {
    if (invoicesList && invoicesList.length > 0) {
      const sorted = [...invoicesList].sort((a, b) => (b.id || 0) - (a.id || 0));
      return sorted[0];
    }
    try {
      const cached = localStorage.getItem("escora_last_invoice_template");
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return null;
  }, [invoicesList]);

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [printing, setPrinting] = useState<boolean>(false);

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<InvoiceFormValues>({
    defaultValues: defaultFormValues,
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    replace: replaceItems,
  } = useFieldArray({
    control,
    name: "items",
  });

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    control,
    name: "payments",
  });

  const watchedValues = watch();

  // Determine effective tax rate
  const effectiveTaxRate =
    watchedValues.taxType === "exempt" || watchedValues.taxType === "none"
      ? 0
      : watchedValues.taxRateSelect === "custom"
      ? Number(watchedValues.customTaxRate) || 0
      : Number(watchedValues.taxRateSelect) || 0;

  // Recalculate totals in real time
  const calculated = calculateInvoiceTotals({
    items: watchedValues.items || [],
    discount: watchedValues.discount || 0,
    discountType: watchedValues.discountType || "fixed",
    taxRate: effectiveTaxRate,
    taxType: watchedValues.taxType || "cgst_sgst",
    payments: watchedValues.payments || [],
    dueDate: watchedValues.dueDate,
    status: watchedValues.status,
  });

  // Populate existing data when editing, or populate non-client sections from previous invoice when creating
  useEffect(() => {
    if (existing) {
      const existingTaxRate = existing.taxRate ?? 5;
      const isKnownTaxRate = ["0", "5", "12", "18", "28"].includes(String(existingTaxRate));

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
        taxType: existing.taxType ?? "cgst_sgst",
        taxRateSelect: isKnownTaxRate ? String(existingTaxRate) : "custom",
        customTaxRate: existingTaxRate,
        payments: parseInvoicePayments(existing.payments),
        paymentTerms: existing.paymentTerms ?? "",
        bankDetails: parseInvoiceBankDetails(existing.bankDetails),
        notes: existing.notes ?? DEFAULT_NOTES,
        terms: existing.terms ?? DEFAULT_TERMS,
        revisionReason: "",
      });
    } else if (!isEdit) {
      if (!watchedValues.invoiceNumber) {
        if (nextNumberData?.invoiceNumber) {
          setValue("invoiceNumber", nextNumberData.invoiceNumber);
        } else {
          const randomSeq = Math.floor(1000 + Math.random() * 9000);
          setValue("invoiceNumber", `ESC-INV-${new Date().getFullYear()}-${randomSeq}`);
        }
      }

      // Automatically prefill other sections from the most recent invoice created, keeping Client Details & Items blank
      if (previousInvoice && !hasInitializedFromPrevious.current) {
        hasInitializedFromPrevious.current = true;
        const prevTaxRate = previousInvoice.taxRate ?? 5;
        const isKnownTaxRate = ["0", "5", "12", "18", "28"].includes(String(prevTaxRate));

        if (previousInvoice.title) setValue("title", previousInvoice.title);
        if (previousInvoice.destination) setValue("destination", previousInvoice.destination);
        if (previousInvoice.travelDates) setValue("travelDates", previousInvoice.travelDates);
        if (previousInvoice.guestCount) setValue("guestCount", Number(previousInvoice.guestCount) || 2);
        if (previousInvoice.currency) setValue("currency", previousInvoice.currency);
        if (previousInvoice.taxType) setValue("taxType", previousInvoice.taxType);
        setValue("taxRateSelect", isKnownTaxRate ? String(prevTaxRate) : "custom");
        setValue("customTaxRate", prevTaxRate);
        if (previousInvoice.paymentTerms) setValue("paymentTerms", previousInvoice.paymentTerms);
        if (previousInvoice.bankDetails) setValue("bankDetails", parseInvoiceBankDetails(previousInvoice.bankDetails));
        if (previousInvoice.notes) setValue("notes", previousInvoice.notes);
        if (previousInvoice.terms) setValue("terms", previousInvoice.terms);
      }
    }
  }, [existing, isEdit, nextNumberData?.invoiceNumber, previousInvoice]);

  // Construct current preview invoice
  const currentPreviewData: InvoiceData = {
    id: invoiceId || 0,
    invoiceNumber: watchedValues.invoiceNumber || "ESC-INV-2026-0001",
    customerName: watchedValues.customerName || "Guest Name",
    customerEmail: watchedValues.customerEmail,
    customerPhone: watchedValues.customerPhone,
    customerAddress: watchedValues.customerAddress,
    customerGstin: watchedValues.customerGstin,
    title: watchedValues.title || "Tour Package",
    destination: watchedValues.destination,
    travelDates: watchedValues.travelDates,
    guestCount: watchedValues.guestCount,
    issueDate: watchedValues.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: watchedValues.dueDate,
    status: watchedValues.status || calculated.derivedStatus,
    currency: watchedValues.currency || "INR",
    items: calculated.items,
    subtotal: calculated.subtotal,
    discount: watchedValues.discount || 0,
    discountType: watchedValues.discountType || "fixed",
    taxType: calculated.taxType,
    taxRate: calculated.taxRate,
    taxableAmount: calculated.taxableAmount,
    taxAmount: calculated.taxAmount,
    cgstAmount: calculated.cgstAmount,
    sgstAmount: calculated.sgstAmount,
    igstAmount: calculated.igstAmount,
    totalAmount: calculated.totalAmount,
    paidAmount: calculated.paidAmount,
    balanceDue: calculated.balanceDue,
    payments: watchedValues.payments || [],
    paymentTerms: watchedValues.paymentTerms,
    bankDetails: watchedValues.bankDetails,
    notes: watchedValues.notes,
    terms: watchedValues.terms,
    auditTrail: existing?.auditTrail || "[]",
    revision: existing?.revision || 1,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Quick Import State & Handlers
  const [importScope, setImportScope] = useState<"full" | "customer_only">("full");
  const [pendingReplaceConfirm, setPendingReplaceConfirm] = useState<{
    sourceType: "booking" | "itinerary";
    rawSource: any;
  } | null>(null);
  const [pendingBookingTaxConfirm, setPendingBookingTaxConfirm] = useState<{
    order: any;
    totalAmount: number;
  } | null>(null);

  function hasExistingFinancialData(): boolean {
    const items = watchedValues.items || [];
    const hasItems = items.some(
      (it) => (Number(it.rate) > 0 && Number(it.quantity) > 0) || (it.description && it.description.trim() !== "")
    );
    const hasDiscount = Number(watchedValues.discount) > 0;
    return hasItems || hasDiscount;
  }

  function applyCustomerData(data: ImportedCustomerData) {
    if (data.orderId !== undefined) setValue("orderId", data.orderId);
    if (data.itineraryId !== undefined) setValue("itineraryId", data.itineraryId);
    if (data.customerName) setValue("customerName", data.customerName, { shouldValidate: true, shouldDirty: true });
    if (data.customerEmail) setValue("customerEmail", data.customerEmail, { shouldValidate: true, shouldDirty: true });
    if (data.customerPhone) setValue("customerPhone", data.customerPhone, { shouldValidate: true, shouldDirty: true });
    if (data.destination) setValue("destination", data.destination, { shouldValidate: true, shouldDirty: true });
    if (data.title) setValue("title", data.title, { shouldValidate: true, shouldDirty: true });
    if (data.travelDates) setValue("travelDates", data.travelDates, { shouldValidate: true, shouldDirty: true });
    if (data.guestCount) setValue("guestCount", data.guestCount, { shouldValidate: true, shouldDirty: true });
  }

  function applyFinancialData(data: ImportedFinancialData) {
    if (data.items && data.items.length > 0) {
      replaceItems(data.items);
    }
    setValue("discount", data.discount ?? 0, { shouldValidate: true, shouldDirty: true });
    setValue("discountType", data.discountType || "fixed", { shouldValidate: true, shouldDirty: true });
    if (data.currency) {
      setValue("currency", data.currency, { shouldValidate: true, shouldDirty: true });
    }
  }

  function executeItineraryImport(it: any) {
    const parsed = parseItineraryForInvoice(it);
    applyCustomerData(parsed.customerData);
    applyFinancialData(parsed.financialData);
    toast({
      title: "Itinerary package imported",
      description: `Loaded ${parsed.financialData.items.length} service item(s) and pricing from "${it.title}"`,
    });
  }

  function executeBookingImport(order: any, taxOption?: "inclusive" | "exclusive") {
    const parsed = parseBookingForInvoice(order, taxOption, effectiveTaxRate);
    applyCustomerData(parsed.customerData);
    if (parsed.financialData) {
      applyFinancialData(parsed.financialData);
      toast({
        title: "Booking imported",
        description: `Loaded ${parsed.financialData.items.length} service item(s) for ${order.guestName}`,
      });
    } else {
      toast({
        title: "Booking customer details imported",
        description: `Loaded guest details for ${order.guestName} (no package items found)`,
      });
    }
  }

  function handleImportBooking(orderIdStr: string) {
    if (!orderIdStr || !orders) return;
    const order = orders.find((o) => String(o.id) === orderIdStr);
    if (!order) return;

    // Customer-only autofill mode: never touch financial data
    if (importScope === "customer_only") {
      const parsed = parseBookingForInvoice(order);
      applyCustomerData(parsed.customerData);
      toast({
        title: "Customer details imported",
        description: `Loaded guest details for ${order.guestName} (line items & pricing preserved)`,
      });
      return;
    }

    // Full import: if existing financial data is present, require user confirmation first
    if (hasExistingFinancialData()) {
      setPendingReplaceConfirm({ sourceType: "booking", rawSource: order });
      return;
    }

    // Check if tax treatment confirmation is needed
    const parsed = parseBookingForInvoice(order, undefined, effectiveTaxRate);
    if (parsed.requiresTaxConfirmation) {
      setPendingBookingTaxConfirm({ order, totalAmount: parsed.totalAmount! });
      return;
    }

    executeBookingImport(order);
  }

  function handleImportItinerary(itineraryIdStr: string) {
    if (!itineraryIdStr || !itineraries) return;
    const it = itineraries.find((i) => String(i.id) === itineraryIdStr);
    if (!it) return;

    // Customer-only autofill mode: never touch financial data
    if (importScope === "customer_only") {
      const parsed = parseItineraryForInvoice(it);
      applyCustomerData(parsed.customerData);
      toast({
        title: "Customer details imported",
        description: `Loaded guest details for "${it.title}" (line items & pricing preserved)`,
      });
      return;
    }

    // Full import: if existing financial data is present, require user confirmation first
    if (hasExistingFinancialData()) {
      setPendingReplaceConfirm({ sourceType: "itinerary", rawSource: it });
      return;
    }

    executeItineraryImport(it);
  }

  function handleAddAdvance50Payment() {
    const advAmount = calculated.advance50Amount;
    if (advAmount <= 0) {
      toast({ title: "No payable amount", description: "Line items total must be greater than zero", variant: "destructive" });
      return;
    }
    appendPayment({
      amount: advAmount,
      date: new Date().toISOString().slice(0, 10),
      method: "bank_transfer",
      reference: "ADV-50-DEP",
      notes: "50% Advance Booking Deposit",
      recordedAt: new Date().toISOString(),
    });
    toast({ title: "50% Advance payment recorded", description: `Added payment of ${formatMoney(advAmount, watchedValues.currency)}` });
  }

  function handleAddFullSettlementPayment() {
    const balAmount = calculated.balanceDue;
    if (balAmount <= 0) {
      toast({ title: "Invoice already fully paid", description: "Balance due is ₹0." });
      return;
    }
    appendPayment({
      amount: balAmount,
      date: new Date().toISOString().slice(0, 10),
      method: "bank_transfer",
      reference: "FINAL-SETTLE",
      notes: "Full settlement payment",
      recordedAt: new Date().toISOString(),
    });
    toast({ title: "Full payment recorded", description: `Added payment of ${formatMoney(balAmount, watchedValues.currency)}` });
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
    // 1. Client-side validations
    if (!values.customerName.trim()) {
      toast({ title: "Customer name is required", variant: "destructive" });
      return;
    }
    if (!values.title.trim()) {
      toast({ title: "Tour title is required", variant: "destructive" });
      return;
    }
    if (!values.items || values.items.length === 0) {
      toast({ title: "At least one line item is required", variant: "destructive" });
      return;
    }
    for (let i = 0; i < values.items.length; i++) {
      if (!values.items[i].description.trim()) {
        toast({ title: `Line item #${i + 1} must have a description`, variant: "destructive" });
        return;
      }
      if (values.items[i].quantity <= 0) {
        toast({ title: `Line item #${i + 1} quantity must be at least 1`, variant: "destructive" });
        return;
      }
    }

    const totals = calculateInvoiceTotals({
      items: values.items || [],
      discount: values.discount || 0,
      discountType: values.discountType || "fixed",
      taxRate: effectiveTaxRate,
      taxType: values.taxType || "cgst_sgst",
      payments: values.payments || [],
      dueDate: values.dueDate,
      status: values.status,
    });

    const payload: Partial<InvoiceData> & { revisionReason?: string } = {
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
      status: totals.derivedStatus,
      currency: values.currency,
      items: JSON.stringify(totals.items),
      subtotal: totals.subtotal,
      discount: Number(values.discount) || 0,
      discountType: values.discountType,
      taxType: totals.taxType,
      taxRate: totals.taxRate,
      taxableAmount: totals.taxableAmount,
      taxAmount: totals.taxAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      totalAmount: totals.totalAmount,
      paidAmount: totals.paidAmount,
      balanceDue: totals.balanceDue,
      payments: JSON.stringify(values.payments || []),
      paymentTerms: values.paymentTerms?.trim() || null,
      bankDetails: JSON.stringify(values.bankDetails),
      notes: values.notes?.trim() || null,
      terms: values.terms?.trim() || null,
      revisionReason: values.revisionReason?.trim() || undefined,
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
          onError: (err: any) =>
            toast({
              title: "Failed to update invoice",
              description: err?.message || "Please check inputs",
              variant: "destructive",
            }),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          try {
            localStorage.setItem(
              "escora_last_invoice_template",
              JSON.stringify({
                title: payload.title,
                destination: payload.destination,
                travelDates: payload.travelDates,
                guestCount: payload.guestCount,
                currency: payload.currency,
                taxType: payload.taxType,
                taxRate: payload.taxRate,
                paymentTerms: payload.paymentTerms,
                bankDetails: payload.bankDetails,
                notes: payload.notes,
                terms: payload.terms,
              })
            );
          } catch {
            // ignore
          }
          qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          toast({ title: "Invoice created successfully" });
          navigate("/invoices");
        },
        onError: (err: any) =>
          toast({
            title: "Failed to create invoice",
            description: err?.message || "Please check inputs",
            variant: "destructive",
          }),
      });
    }
  }

  const onFormError = (errors: any) => {
    setActiveTab("edit");
    const firstKey = Object.keys(errors)[0];
    const firstErr = errors[firstKey];
    toast({
      title: "Missing Required Information",
      description: firstErr?.message || `Please check ${firstKey || "required fields"} on the form.`,
      variant: "destructive",
    });
  };

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
            <h1 className="text-2xl font-serif font-semibold text-foreground">
              {isEdit ? `Edit Invoice (${existing?.invoiceNumber})` : "Create Tax Invoice"}
            </h1>
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
            onClick={handleSubmit(onSubmit, onFormError)}
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
          <TabsTrigger value="preview">Invoice Preview</TabsTrigger>
        </TabsList>

        {/* Tab 1: Form Editor */}
        <TabsContent value="edit" className="space-y-6">
          {/* Quick Import Toolbar */}
          {!isEdit && (
            <Card className="border-border/80 bg-muted/20">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Autofill &amp; Import
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="customerOnlyToggle"
                      checked={importScope === "customer_only"}
                      onCheckedChange={(checked) => setImportScope(checked ? "customer_only" : "full")}
                    />
                    <label
                      htmlFor="customerOnlyToggle"
                      className="text-xs text-muted-foreground font-medium cursor-pointer select-none"
                    >
                      Customer Details Only (Do not overwrite line items)
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
                            {o.guestName} — {o.packageName || o.destinations || "Tour"} ({formatMoney(o.totalAmount || 0, o.currency || "INR")})
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

          <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-6">
            {/* Card 1: Invoice Meta */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Voucher &amp; Invoice Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="invoiceNumber" className="text-xs">Invoice Number *</Label>
                    <Input
                      id="invoiceNumber"
                      {...register("invoiceNumber", { required: true })}
                      className="text-sm font-mono"
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
                    <Label className="text-xs">Lifecycle Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft (Unissued)</SelectItem>
                            <SelectItem value="issued">Issued (Unpaid)</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid (Fully Settled)</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Audit & Revision Note when editing an issued invoice */}
                {isEdit && existing && existing.status !== "draft" && (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <Info className="h-4 w-4" />
                      Issued Document Revision Audit
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      This invoice has already been issued. Modifications will be permanently timestamped in the audit trail.
                    </p>
                    <Input
                      {...register("revisionReason")}
                      placeholder="Enter audit note / reason for revision (e.g. Adjusted rate per client confirmation)..."
                      className="text-xs h-8 bg-background"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Client & Billed To */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
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
                    placeholder="Enter client / guest full name"
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
                    placeholder="+91 Phone / WhatsApp"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="customerAddress" className="text-xs">Billing Address</Label>
                  <Textarea
                    id="customerAddress"
                    {...register("customerAddress")}
                    rows={2}
                    placeholder="Billing address (street, city, state, PIN code)..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerGstin" className="text-xs">Client GSTIN / Tax ID</Label>
                  <Input
                    id="customerGstin"
                    {...register("customerGstin")}
                    placeholder="GSTIN / Tax ID (optional)"
                    className="text-xs uppercase font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Journey Reference */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
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
                    placeholder={previousInvoice?.title || "e.g. Kerala Tour Package"}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="destination" className="text-xs">Destination(s)</Label>
                  <Input
                    id="destination"
                    {...register("destination")}
                    placeholder={previousInvoice?.destination || "e.g. Kerala, India"}
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
                    placeholder={previousInvoice?.travelDates || "e.g. 15 Nov 2026 – 20 Nov 2026"}
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

            {/* Card 4: Line Items Table & Authoritative Totals */}
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold">
                    Itemized Services &amp; Tariffs
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appendItem({
                      description: "",
                      hsnSac: "998555",
                      quantity: 1,
                      rate: 0,
                      amount: 0,
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
                  {itemFields.map((field, idx) => {
                    const rowQty = watch(`items.${idx}.quantity`) || 1;
                    const rowRate = watch(`items.${idx}.rate`) || 0;
                    const rowTotal = rowQty * rowRate;

                    return (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-lg border border-border/70 bg-muted/20 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-muted-foreground mt-1 tabular-nums">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Description of Service</Label>
                            <Textarea
                              {...register(`items.${idx}.description` as const, { required: true })}
                              rows={2}
                              placeholder="Description of service (e.g. Resort Stay, Transport, Sightseeing)..."
                              className="text-sm bg-background"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(idx)}
                            disabled={itemFields.length === 1}
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
                              className="h-8 text-xs bg-background font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Quantity</Label>
                            <Input
                              type="number"
                              min={1}
                              {...register(`items.${idx}.quantity` as const, {
                                valueAsNumber: true,
                              })}
                              className="h-8 text-xs bg-background tabular-nums"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Unit Rate ({watchedValues.currency})</Label>
                            <Input
                              type="number"
                              min={0}
                              {...register(`items.${idx}.rate` as const, {
                                valueAsNumber: true,
                              })}
                              className="h-8 text-xs bg-background tabular-nums"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Row Total</Label>
                            <div className="h-8 px-3 rounded-md border border-border/50 bg-muted/40 flex items-center text-xs font-semibold text-foreground tabular-nums">
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
                  <div className="space-y-4 w-full md:w-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Discount Input */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Discount</Label>
                        <div className="flex gap-1.5">
                          <Input
                            type="number"
                            min={0}
                            {...register("discount", { valueAsNumber: true })}
                            className="h-8 text-xs w-24 tabular-nums"
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

                      {/* Tax Rate Configurator */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">GST Rate</Label>
                        <div className="flex gap-1.5 items-center">
                          <Controller
                            control={control}
                            name="taxRateSelect"
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={(v) => field.onChange(v)}
                              >
                                <SelectTrigger className="h-8 text-xs w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5% (Tour Operator)</SelectItem>
                                  <SelectItem value="12">12% (Accommodation)</SelectItem>
                                  <SelectItem value="18">18% (Standard Services)</SelectItem>
                                  <SelectItem value="28">28% (Luxury)</SelectItem>
                                  <SelectItem value="0">0% (Nil / Exempt)</SelectItem>
                                  <SelectItem value="custom">Custom %</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />

                          {watchedValues.taxRateSelect === "custom" && (
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              {...register("customTaxRate", { valueAsNumber: true })}
                              className="h-8 text-xs w-16 tabular-nums"
                              placeholder="%"
                            />
                          )}
                        </div>
                      </div>

                      {/* Tax Supply Category */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tax Supply Type</Label>
                        <Controller
                          control={control}
                          name="taxType"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="h-8 text-xs w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cgst_sgst">Intra-State (CGST + SGST)</SelectItem>
                                <SelectItem value="igst">Inter-State (IGST)</SelectItem>
                                <SelectItem value="exempt">Exempt / Zero Rated</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Tax Rules Advisory Note */}
                    <div className="flex items-start gap-2 p-2.5 rounded bg-muted/40 border border-border/60 text-[11px] text-muted-foreground max-w-lg">
                      <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span>{GST_ADVISORY_NOTE}</span>
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="w-full md:w-72 space-y-1.5 text-xs tabular-nums">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>{formatMoney(calculated.subtotal, watchedValues.currency)}</span>
                    </div>

                    {calculated.discountAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount:</span>
                        <span className="text-rose-600">-{formatMoney(calculated.discountAmount, watchedValues.currency)}</span>
                      </div>
                    )}

                    {calculated.discountAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground border-t border-dashed border-border/60 pt-1">
                        <span>Taxable Value:</span>
                        <span>{formatMoney(calculated.taxableAmount, watchedValues.currency)}</span>
                      </div>
                    )}

                    {calculated.taxRate > 0 && calculated.taxType === "cgst_sgst" && (
                      <>
                        <div className="flex justify-between text-muted-foreground">
                          <span>CGST ({calculated.cgstRate}%):</span>
                          <span>+{formatMoney(calculated.cgstAmount, watchedValues.currency)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>SGST ({calculated.sgstRate}%):</span>
                          <span>+{formatMoney(calculated.sgstAmount, watchedValues.currency)}</span>
                        </div>
                      </>
                    )}

                    {calculated.taxRate > 0 && calculated.taxType === "igst" && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>IGST ({calculated.igstRate}%):</span>
                        <span>+{formatMoney(calculated.igstAmount, watchedValues.currency)}</span>
                      </div>
                    )}

                    {calculated.taxRate === 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST (0% - Nil/Exempt):</span>
                        <span>₹0.00</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border">
                      <span>Grand Total:</span>
                      <span className="text-foreground font-bold">{formatMoney(calculated.totalAmount, watchedValues.currency)}</span>
                    </div>

                    {calculated.paidAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground pt-0.5">
                        <span>Total Payments Settled:</span>
                        <span className="text-emerald-600 font-semibold">{formatMoney(calculated.paidAmount, watchedValues.currency)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-semibold text-muted-foreground pt-1 border-t border-border/60">
                      <span>Amount Payable (Balance Due):</span>
                      <span className="text-foreground font-bold">{formatMoney(calculated.balanceDue, watchedValues.currency)}</span>
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Recorded Payments & Settlements */}
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Recorded Payments &amp; Settlement History
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddAdvance50Payment}
                    className="text-xs h-8"
                  >
                    + Record 50% Advance
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddFullSettlementPayment}
                    className="text-xs h-8"
                  >
                    + Record Full Settlement
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      appendPayment({
                        amount: 0,
                        date: new Date().toISOString().slice(0, 10),
                        method: "bank_transfer",
                        reference: "",
                        notes: "",
                        recordedAt: new Date().toISOString(),
                      })
                    }
                    className="text-xs h-8 gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentFields.length === 0 ? (
                  <div className="py-4 text-center border rounded-lg border-dashed text-xs text-muted-foreground bg-muted/10">
                    No payments recorded yet. Click above to record an advance, partial payment, or full settlement.
                  </div>
                ) : (
                  paymentFields.map((field, pIdx) => (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg border border-border/70 bg-muted/10 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
                    >
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Amount ({watchedValues.currency}) *</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          {...register(`payments.${pIdx}.amount` as const, { valueAsNumber: true })}
                          className="h-8 text-xs bg-background tabular-nums font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Payment Date *</Label>
                        <Input
                          type="date"
                          {...register(`payments.${pIdx}.date` as const)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Payment Method</Label>
                        <Controller
                          control={control}
                          name={`payments.${pIdx}.method` as const}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="h-8 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bank_transfer">Bank Wire / NEFT / RTGS</SelectItem>
                                <SelectItem value="upi">UPI / QR Code</SelectItem>
                                <SelectItem value="credit_card">Credit / Debit Card</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Reference / UTR Number</Label>
                        <Input
                          {...register(`payments.${pIdx}.reference` as const)}
                          placeholder="e.g. UTR12389104"
                          className="h-8 text-xs bg-background font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Notes</Label>
                          <Input
                            {...register(`payments.${pIdx}.notes` as const)}
                            placeholder="Optional remark"
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePayment(pIdx)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Card 6: Bank Details & Payment Instructions */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
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
                    className="text-sm font-mono"
                    placeholder="50200088992211"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ifsc" className="text-xs">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    {...register("bankDetails.ifsc")}
                    className="text-xs uppercase font-mono"
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
                    className="text-xs font-mono"
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

            {/* Card 7: Notes & Terms */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-foreground font-semibold">
                  Notes &amp; Booking Terms
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

      {/* Confirmation Modal 1: Overwrite existing line items */}
      <AlertDialog
        open={!!pendingReplaceConfirm}
        onOpenChange={(open) => {
          if (!open) setPendingReplaceConfirm(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-lg max-w-[95vw] p-6">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <AlertDialogTitle className="text-base font-bold text-foreground">
                  Replace Existing Line Items?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  You already have custom line items or tariffs entered in this invoice. Full import will replace these items with the package services from the selected {pendingReplaceConfirm?.sourceType === "itinerary" ? "itinerary" : "booking"}.
                  <br /><br />
                  Would you like to replace all line items, or only autofill customer contact details?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-0 pt-3">
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              className="text-xs h-8"
              onClick={() => {
                if (pendingReplaceConfirm) {
                  if (pendingReplaceConfirm.sourceType === "itinerary") {
                    const parsed = parseItineraryForInvoice(pendingReplaceConfirm.rawSource);
                    applyCustomerData(parsed.customerData);
                    toast({
                      title: "Customer details imported",
                      description: `Imported customer details for "${pendingReplaceConfirm.rawSource.title}" (line items preserved).`,
                    });
                  } else {
                    const parsed = parseBookingForInvoice(pendingReplaceConfirm.rawSource);
                    applyCustomerData(parsed.customerData);
                    toast({
                      title: "Customer details imported",
                      description: `Imported customer details for ${pendingReplaceConfirm.rawSource.guestName} (line items preserved).`,
                    });
                  }
                }
                setPendingReplaceConfirm(null);
              }}
            >
              Import Customer Only
            </Button>
            <AlertDialogAction
              className="text-xs h-8 bg-primary"
              onClick={() => {
                if (pendingReplaceConfirm) {
                  if (pendingReplaceConfirm.sourceType === "itinerary") {
                    executeItineraryImport(pendingReplaceConfirm.rawSource);
                  } else {
                    const parsed = parseBookingForInvoice(pendingReplaceConfirm.rawSource, undefined, effectiveTaxRate);
                    if (parsed.requiresTaxConfirmation) {
                      setPendingBookingTaxConfirm({ order: pendingReplaceConfirm.rawSource, totalAmount: parsed.totalAmount! });
                    } else {
                      executeBookingImport(pendingReplaceConfirm.rawSource);
                    }
                  }
                }
                setPendingReplaceConfirm(null);
              }}
            >
              Replace Line Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal 2: Unknown tax treatment on booking total */}
      <AlertDialog
        open={!!pendingBookingTaxConfirm}
        onOpenChange={(open) => {
          if (!open) setPendingBookingTaxConfirm(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-xl max-w-[95vw] p-6 sm:p-7">
          {(() => {
            const totalAmount = pendingBookingTaxConfirm?.totalAmount || 0;
            const currency = pendingBookingTaxConfirm?.order?.currency || watchedValues.currency || "INR";
            const guestName = pendingBookingTaxConfirm?.order?.guestName || "Guest Booking";
            const packageName = pendingBookingTaxConfirm?.order?.packageName || pendingBookingTaxConfirm?.order?.title || "Curated Tour Package";
            const isTaxActive = effectiveTaxRate > 0 && watchedValues.taxType !== "exempt" && watchedValues.taxType !== "none";

            // Inclusive option calculations:
            const inclusiveBase = isTaxActive
              ? Math.round((totalAmount / (1 + effectiveTaxRate / 100)) * 100) / 100
              : totalAmount;
            const inclusiveTax = Math.round((totalAmount - inclusiveBase) * 100) / 100;
            const inclusiveTotal = totalAmount;

            // Exclusive option calculations:
            const exclusiveBase = totalAmount;
            const exclusiveTax = isTaxActive
              ? Math.round((totalAmount * (effectiveTaxRate / 100)) * 100) / 100
              : 0;
            const exclusiveTotal = totalAmount + exclusiveTax;

            return (
              <>
                <AlertDialogHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <AlertDialogTitle className="text-lg font-bold text-foreground">
                        Confirm Tax Treatment
                      </AlertDialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Specify how GST ({effectiveTaxRate}%) should be applied to this booking total
                      </p>
                    </div>
                  </div>

                  {/* Booking context summary card */}
                  <div className="rounded-xl bg-muted/40 border border-border/70 p-3 text-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                        Booking / Guest
                      </span>
                      <span className="font-semibold text-foreground truncate block mt-0.5 text-xs">
                        {guestName}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate block">
                        {packageName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                        Package Total
                      </span>
                      <span className="font-bold text-foreground text-base tracking-tight block mt-0.5 font-mono">
                        {formatMoney(totalAmount, currency)}
                      </span>
                    </div>
                  </div>

                  <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                    The imported booking does not specify if GST is included. Choose how this total should be interpreted to prevent double taxation:
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Option Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
                  {/* Option 1: Tax-Inclusive */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (pendingBookingTaxConfirm) {
                        executeBookingImport(pendingBookingTaxConfirm.order, "inclusive");
                      }
                      setPendingBookingTaxConfirm(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (pendingBookingTaxConfirm) {
                          executeBookingImport(pendingBookingTaxConfirm.order, "inclusive");
                        }
                        setPendingBookingTaxConfirm(null);
                      }
                    }}
                    className="group relative flex flex-col justify-between text-left p-4 rounded-xl border-2 border-border/80 hover:border-primary bg-card hover:bg-primary/[0.03] transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          Final Price
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        Tax-Inclusive
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        Grand total remains <strong>{formatMoney(inclusiveTotal, currency)}</strong>. GST is extracted backwards.
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-border/50 space-y-1 text-[11px]">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Base Tariff:</span>
                          <span className="font-mono">{formatMoney(inclusiveBase, currency)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>GST ({effectiveTaxRate}%):</span>
                          <span className="font-mono">{formatMoney(inclusiveTax, currency)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground pt-1 border-t border-dashed border-border/60">
                          <span>Invoice Total:</span>
                          <span className="font-mono text-primary">{formatMoney(inclusiveTotal, currency)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="w-full mt-3.5 h-8 text-xs font-semibold bg-primary text-primary-foreground group-hover:bg-primary/90 pointer-events-none"
                    >
                      Apply Tax-Inclusive
                    </Button>
                  </div>

                  {/* Option 2: Tax-Exclusive */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (pendingBookingTaxConfirm) {
                        executeBookingImport(pendingBookingTaxConfirm.order, "exclusive");
                      }
                      setPendingBookingTaxConfirm(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (pendingBookingTaxConfirm) {
                          executeBookingImport(pendingBookingTaxConfirm.order, "exclusive");
                        }
                        setPendingBookingTaxConfirm(null);
                      }
                    }}
                    className="group relative flex flex-col justify-between text-left p-4 rounded-xl border-2 border-border/80 hover:border-foreground/40 bg-card hover:bg-muted/40 transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400">
                          Net Tariff
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-foreground transition-colors">
                        Tax-Exclusive
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        GST is added on top. Grand total becomes <strong>{formatMoney(exclusiveTotal, currency)}</strong>.
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-border/50 space-y-1 text-[11px]">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Base Tariff:</span>
                          <span className="font-mono">{formatMoney(exclusiveBase, currency)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>GST ({effectiveTaxRate}%):</span>
                          <span className="font-mono">+{formatMoney(exclusiveTax, currency)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground pt-1 border-t border-dashed border-border/60">
                          <span>Invoice Total:</span>
                          <span className="font-mono">{formatMoney(exclusiveTotal, currency)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-3.5 h-8 text-xs font-semibold group-hover:bg-muted pointer-events-none"
                    >
                      Apply Tax-Exclusive
                    </Button>
                  </div>
                </div>

                <AlertDialogFooter className="sm:justify-end pt-2">
                  <AlertDialogCancel className="text-xs h-8 px-4">Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
