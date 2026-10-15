import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListInvoices,
  useDeleteInvoice,
  useUpdateInvoice,
  useCreateInvoice,
  getListInvoicesQueryKey,
} from "@/lib/invoicesApi";
import type { InvoiceData } from "@/lib/invoices";
import { formatMoney, formatDate, parseInvoiceItems, DEFAULT_BANK_DETAILS, DEFAULT_TERMS, DEFAULT_NOTES } from "@/lib/invoices";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Printer,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Receipt,
  Sparkles,
} from "lucide-react";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import InvoicePrintDocument from "@/components/invoice/InvoicePrintDocument";
import { printElementById } from "@/lib/printElement";

const PRINT_TARGET_ID = "invoice-print-target";

function statusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge className="bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-[11px] uppercase tracking-wider">Paid</Badge>;
    case "partially_paid":
      return <Badge className="bg-stone-700 hover:bg-stone-800 text-white font-mono text-[11px] uppercase tracking-wider">Partial</Badge>;
    case "overdue":
      return <Badge variant="destructive" className="font-mono text-[11px] uppercase tracking-wider">Overdue</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">Cancelled</Badge>;
    case "draft":
      return <Badge variant="secondary" className="font-mono text-[11px] uppercase tracking-wider">Draft</Badge>;
    default:
      return <Badge className="bg-[#183a27] hover:bg-[#122c1e] text-white font-mono text-[11px] uppercase tracking-wider">Issued</Badge>;
  }
}

export default function InvoicesPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewing, setViewing] = useState<InvoiceData | null>(null);
  const [printing, setPrinting] = useState<InvoiceData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: invoices, isLoading } = useListInvoices({
    status: filterStatus === "all" ? undefined : filterStatus,
    search: searchQuery || undefined,
  });

  const deleteMutation = useDeleteInvoice();
  const updateMutation = useUpdateInvoice();
  const createMutation = useCreateInvoice();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteId(null);
          toast({ title: "Invoice deleted successfully" });
        },
        onError: () => toast({ title: "Failed to delete invoice", variant: "destructive" }),
      }
    );
  }

  function handleMarkAsPaid(invoice: InvoiceData) {
    updateMutation.mutate(
      {
        id: invoice.id,
        data: {
          status: "paid",
          paidAmount: invoice.totalAmount,
          balanceDue: 0,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: `Invoice ${invoice.invoiceNumber} marked as Paid` });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      }
    );
  }

  function handleClone(invoice: InvoiceData) {
    const nextNumber = `ESC-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    createMutation.mutate(
      {
        ...invoice,
        id: undefined,
        invoiceNumber: nextNumber,
        status: "draft",
        issueDate: new Date().toISOString().slice(0, 10),
        paidAmount: 0,
        balanceDue: invoice.totalAmount,
      },
      {
        onSuccess: (created) => {
          invalidate();
          toast({
            title: "Invoice cloned",
            description: `Created new draft invoice ${created.invoiceNumber}`,
          });
          navigate(`/invoices/${created.id}/edit`);
        },
      }
    );
  }

  async function handlePrint(invoice: InvoiceData) {
    setPrinting(invoice);
    // Give DOM a frame to mount print target
    setTimeout(async () => {
      try {
        await printElementById(PRINT_TARGET_ID);
      } catch (err) {
        console.error("Print error:", err);
      } finally {
        setPrinting(null);
      }
    }, 150);
  }

  function handleCreateSample() {
    createMutation.mutate(
      {
        customerName: "Dr. Arvind Menon",
        customerEmail: "arvind.menon@example.com",
        customerPhone: "+91 98450 12345",
        customerAddress: "42, Richmond Road, Bangalore, Karnataka - 560025",
        customerGstin: "29AABCU9603R1ZM",
        title: "Bespoke Wayanad & Munnar Luxury Escape (5N/6D)",
        destination: "Wayanad & Munnar, Kerala",
        travelDates: "15 Nov 2026 – 20 Nov 2026",
        guestCount: 2,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: "issued",
        currency: "INR",
        items: JSON.stringify([
          {
            description: "5 Nights Luxury Villa Stay with Private Pool\n(3N Wayanad Rainforest Retreat + 2N Munnar Tea Estate Suite)",
            hsnSac: "998555",
            quantity: 1,
            rate: 135000,
            amount: 135000,
          },
          {
            description: "Dedicated Luxury Chauffeur & Private Toyota Vellfire / Innova HyCross Transfer for 6 Days",
            hsnSac: "996411",
            quantity: 1,
            rate: 32000,
            amount: 32000,
          },
          {
            description: "Curated Plantation Walk, Tea Tasting Experience & Private Candlelight Dinner",
            hsnSac: "998555",
            quantity: 1,
            rate: 18000,
            amount: 18000,
          },
        ]),
        subtotal: 185000,
        discount: 10000,
        discountType: "fixed",
        taxRate: 5,
        taxAmount: 8750,
        totalAmount: 183750,
        paidAmount: 90000,
        balanceDue: 93750,
        paymentTerms: "50% advance received, balance payable 7 days prior to journey.",
        bankDetails: JSON.stringify(DEFAULT_BANK_DETAILS),
        notes: DEFAULT_NOTES,
        terms: DEFAULT_TERMS,
      },
      {
        onSuccess: (inv) => {
          invalidate();
          toast({ title: "Sample invoice created", description: inv.invoiceNumber });
        },
      }
    );
  }

  function exportCsv() {
    if (!invoices?.length) return;
    const headers = [
      "Invoice Number",
      "Customer Name",
      "Email",
      "Phone",
      "Title / Reference",
      "Destination",
      "Issue Date",
      "Due Date",
      "Status",
      "Currency",
      "Subtotal",
      "Tax Amount",
      "Total Amount",
      "Paid Amount",
      "Balance Due",
    ];
    const esc = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = invoices.map((i) =>
      [
        i.invoiceNumber,
        i.customerName,
        i.customerEmail,
        i.customerPhone,
        i.title,
        i.destination,
        i.issueDate,
        i.dueDate,
        i.status,
        i.currency,
        i.subtotal,
        i.taxAmount,
        i.totalAmount,
        i.paidAmount,
        i.balanceDue,
      ]
        .map(esc)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `escora-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Calculate Metrics
  const list = invoices || [];
  const totalInvoiced = list.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const totalPaid = list.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
  const totalDue = list.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);
  const overdueCount = list.filter((i) => i.status === "overdue").length;

  return (
    <div data-testid="invoices-page" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Invoices &amp; Billing</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage client billing, tax vouchers, payment reconciliations, and luxury PDF exports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {list.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleCreateSample} className="gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Sample Invoice
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={!list.length}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/invoices/new")}
            className="gap-1.5 font-medium"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Total Invoiced
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-foreground">
              {formatMoney(totalInvoiced, "INR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{list.length} Total Invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Collected Revenue
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-emerald-700">
              {formatMoney(totalPaid, "INR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Settled payments to date</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Outstanding Balance
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-foreground">
              {formatMoney(totalDue, "INR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending client settlement</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Overdue Vouchers
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-rose-500">
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice #, guest, trip..."
            className="pl-9 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-mono text-xs uppercase tracking-wider">Invoice #</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Guest &amp; Contact</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Trip / Reference</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Date &amp; Due</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-right">Total (INR)</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-right">Balance</TableHead>
              <TableHead className="w-12 text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Receipt className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-base font-serif font-medium text-foreground">No invoices found</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {searchQuery || filterStatus !== "all"
                        ? "Try clearing your filters or search terms."
                        : "Create your first luxury invoice voucher or generate a sample."}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" onClick={() => navigate("/invoices/new")} className="gap-1.5 font-medium">
                        <Plus className="h-3.5 w-3.5" />
                        Create Invoice
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCreateSample} className="gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Sample Invoice
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              list.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    <button
                      onClick={() => setViewing(inv)}
                      className="hover:underline text-left hover:text-primary transition-colors"
                    >
                      {inv.invoiceNumber}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{inv.customerName}</p>
                      {inv.customerPhone && (
                        <p className="text-xs text-muted-foreground">{inv.customerPhone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 max-w-[220px]">
                      <p className="text-sm text-foreground truncate font-serif">{inv.title}</p>
                      {inv.destination && (
                        <p className="text-xs text-muted-foreground truncate">{inv.destination}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <p className="text-foreground">{formatDate(inv.issueDate)}</p>
                      {inv.dueDate && (
                        <p className="text-muted-foreground text-[11px]">Due: {formatDate(inv.dueDate)}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-sm text-foreground">
                    {formatMoney(inv.totalAmount, inv.currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                    {formatMoney(inv.balanceDue, inv.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setViewing(inv)} className="gap-2">
                          <Eye className="h-4 w-4" /> View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(inv)} className="gap-2">
                          <Printer className="h-4 w-4" /> Print / PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}/edit`)} className="gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleClone(inv)} className="gap-2">
                          <Copy className="h-4 w-4" /> Clone
                        </DropdownMenuItem>
                        {inv.status !== "paid" && (
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(inv)} className="gap-2 text-emerald-600">
                            <CheckCircle className="h-4 w-4" /> Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(inv.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Hidden Print Target mounted when printing is active */}
      {printing && <InvoicePrintDocument invoice={printing} id={PRINT_TARGET_ID} />}

      {/* Interactive Luxury View Modal */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0 shadow-none">
          {viewing && (
            <InvoiceDocument
              invoice={viewing}
              onPrint={() => handlePrint(viewing)}
              onEdit={() => {
                setViewing(null);
                navigate(`/invoices/${viewing.id}/edit`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This invoice voucher will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
