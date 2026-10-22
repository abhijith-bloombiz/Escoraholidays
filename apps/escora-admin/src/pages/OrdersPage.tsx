import { useState, useMemo, useEffect } from "react";
import {
  useListOrders,
  useUpdateOrder,
  useDeleteOrder,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import CreateBookingModal from "@/components/booking/CreateBookingModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Eye,
  Download,
  Info,
  Search,
  X,
  Clock,
  CheckCircle2,
  Check,
  XCircle,
  MapPin,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  ShieldAlert,
  Compass,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import type { Order } from "@workspace/api-client-react";

// Status badge styling with Escora color palette
function renderStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-600/20 text-xs font-medium capitalize">
          Confirmed
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-blue-600/10 text-blue-700 border-blue-300 dark:border-blue-800 hover:bg-blue-600/20 text-xs font-medium capitalize">
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 text-xs font-medium capitalize">
          Cancelled
        </Badge>
      );
    case "enquiry":
    default:
      return (
        <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-800 hover:bg-amber-500/20 text-xs font-medium capitalize">
          Enquiry
        </Badge>
      );
  }
}

// Concise explanation of booking statuses
const STATUS_DESCRIPTIONS: Record<string, string> = {
  enquiry: "Inbound request pending consultation or proposal. Customer is awaiting itinerary details.",
  confirmed: "Trip dates and deposit/payment confirmed. Itinerary is locked in for delivery.",
  completed: "Guest has successfully finished their journey. Booking is concluded.",
  cancelled: "Trip was cancelled, declined, or not realized.",
};

// Payment status badge
function renderPaymentStatusBadge(status?: string | null) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 text-[10px] font-semibold capitalize">
          Paid
        </Badge>
      );
    case "partially_paid":
      return (
        <Badge className="bg-blue-600/10 text-blue-700 border-blue-300 dark:border-blue-800 text-[10px] font-semibold capitalize">
          Partially Paid
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="destructive" className="text-[10px] font-semibold capitalize">
          Refunded
        </Badge>
      );
    case "unpaid":
    default:
      return (
        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-500/10 text-[10px] font-semibold capitalize">
          Unpaid
        </Badge>
      );
  }
}

function InfoField({
  label,
  value,
  subvalue,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  subvalue?: string | null;
  icon?: any;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-primary/70" />}
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{String(value)}</p>
      {subvalue && <p className="text-xs text-muted-foreground">{subvalue}</p>}
    </div>
  );
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: orders, isLoading, isError, refetch } = useListOrders();
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Modals state
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Handle deep-linking to an order from Enquiry inbox (?id=...)
  useEffect(() => {
    if (typeof window === "undefined" || !orders || orders.length === 0) return;
    const sp = new URLSearchParams(window.location.search);
    const orderId = sp.get("id");
    if (orderId) {
      const found = orders.find((o) => String(o.id) === orderId);
      if (found && (!viewing || viewing.id !== found.id)) {
        setViewing(found);
      }
    }
  }, [orders]);

  // Query notifications for viewing order
  const { data: orderNotifications = [] } = useQuery<any[]>({
    queryKey: ["admin", "order-notifications", viewing?.id],
    queryFn: async () => {
      if (!viewing?.id) return [];
      const res = await fetch(`/api/notifications?relatedType=order&relatedId=${viewing.id}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(viewing?.id),
  });

  // Edit form state
  const [form, setForm] = useState({
    status: "enquiry",
    totalAmount: 0,
    notes: "",
    travelDate: "",
    guestCount: 1,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
  }

  function openEdit(o: Order) {
    setEditing(o);
    setForm({
      status: o.status,
      totalAmount: o.totalAmount ?? 0,
      notes: o.notes ?? "",
      travelDate: o.travelDate ?? "",
      guestCount: o.guestCount ?? 1,
    });
    setOpenEditModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    if (form.guestCount < 1) {
      toast({ title: "Guest count must be at least 1", variant: "destructive" });
      return;
    }
    if (form.totalAmount < 0) {
      toast({ title: "Total amount cannot be negative", variant: "destructive" });
      return;
    }

    updateMutation.mutate(
      {
        id: editing.id,
        data: {
          status: form.status,
          totalAmount: Number(form.totalAmount) || undefined,
          notes: form.notes,
          travelDate: form.travelDate || undefined,
          guestCount: Number(form.guestCount) || 1,
        },
      },
      {
        onSuccess: (updated) => {
          invalidate();
          setOpenEditModal(false);
          toast({ title: "Booking enquiry updated successfully" });
          if (viewing && viewing.id === updated.id) {
            setViewing(updated);
          }
        },
        onError: () => toast({ title: "Failed to update booking", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteTarget(null);
          if (viewing && viewing.id === id) {
            setViewing(null);
          }
          toast({ title: "Booking enquiry deleted" });
        },
        onError: () => toast({ title: "Failed to delete booking", variant: "destructive" }),
      }
    );
  }

  // Summary Metrics (always calculated over all records in the pipeline)
  const summaryCounts = useMemo(() => {
    if (!orders) return { total: 0, enquiry: 0, confirmed: 0, completed: 0, cancelled: 0 };
    return {
      total: orders.length,
      enquiry: orders.filter((o) => o.status === "enquiry").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  // Filtered & Sorted Bookings
  const filtered = useMemo(() => {
    if (!orders) return [];
    const today = new Date().toISOString().split("T")[0];

    return orders
      .filter((o) => {
        // Search by guest name, email, or phone
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = o.guestName.toLowerCase().includes(q);
          const matchEmail = (o.guestEmail ?? "").toLowerCase().includes(q);
          const matchPhone = (o.guestPhone ?? "").toLowerCase().includes(q);
          const matchDest = (o.destinations ?? "").toLowerCase().includes(q);
          const matchStyle = (o.travelStyle ?? "").toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchPhone && !matchDest && !matchStyle) {
            return false;
          }
        }

        // Status filter
        if (filterStatus !== "all" && o.status !== filterStatus) {
          return false;
        }

        // Date filter
        if (dateFilter === "upcoming") {
          if (!o.travelDate || o.travelDate < today) return false;
        } else if (dateFilter === "past") {
          if (!o.departureDate && !o.travelDate) return false;
          const refDate = o.departureDate || o.travelDate;
          if (refDate! >= today) return false;
        } else if (dateFilter === "undated") {
          if (o.travelDate || o.departureDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "travelDate") {
          if (!a.travelDate) return 1;
          if (!b.travelDate) return -1;
          return a.travelDate.localeCompare(b.travelDate);
        }
        if (sortBy === "amount") {
          return (b.totalAmount ?? 0) - (a.totalAmount ?? 0);
        }
        if (sortBy === "name") {
          return a.guestName.localeCompare(b.guestName);
        }
        return 0;
      });
  }, [orders, searchTerm, filterStatus, dateFilter, sortBy]);

  const hasActiveFilters = searchTerm.trim() !== "" || filterStatus !== "all" || dateFilter !== "all" || sortBy !== "newest";

  // CSV Export respecting current active filters and protecting private internal notes
  function exportCsv() {
    if (!filtered?.length) return;
    const headers = [
      "ID",
      "Guest Name",
      "Email",
      "Phone",
      "Travel Style",
      "Destinations",
      "Travel Date",
      "Departure Date",
      "Guests",
      "Budget Range",
      "Status",
      "Total Amount (INR)",
      "Package",
      "Special Requests",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
      "Country",
      "City",
      "Received Date",
    ];

    function escapeCsvCell(val: string | number | null | undefined): string {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const rows = filtered.map((o) =>
      [
        o.id,
        o.guestName,
        o.guestEmail,
        o.guestPhone,
        o.travelStyle,
        o.destinations,
        o.travelDate,
        o.departureDate,
        o.guestCount,
        o.budgetRange,
        o.status,
        o.totalAmount,
        o.packageName,
        o.specialRequests,
        o.utmSource,
        o.utmMedium,
        o.utmCampaign,
        o.geoCountry,
        o.geoCity,
        new Date(o.createdAt).toISOString(),
      ]
        .map(escapeCsvCell)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-and-enquiries-${filterStatus}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export downloaded",
      description: `Exported ${filtered.length} records to CSV.`,
    });
  }

  return (
    <div data-testid="orders-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Bookings &amp; Inquiries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inbound trip planner requests, journey booking submissions, and customer status tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-[#24543D] hover:bg-[#1b402e] text-[#FAF7F1] text-xs gap-1.5 font-medium shadow-xs cursor-pointer"
            onClick={() => setOpenCreateModal(true)}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Create Booking
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={!filtered?.length}
            title="Download CSV report of filtered bookings"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Enquiries Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-amber-500/50 ${
            filterStatus === "enquiry" ? "border-amber-500 bg-amber-500/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "enquiry" ? "all" : "enquiry")}
          title="Filter by Inbound Enquiries"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inquiries</span>
              <p className="text-2xl font-serif font-bold text-amber-700 dark:text-amber-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : summaryCounts.enquiry}
              </p>
              <span className="text-[10px] text-muted-foreground block">Pending consultation</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Confirmed Bookings Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
            filterStatus === "confirmed" ? "border-emerald-500 bg-emerald-500/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "confirmed" ? "all" : "confirmed")}
          title="Filter by Confirmed Bookings"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmed</span>
              <p className="text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : summaryCounts.confirmed}
              </p>
              <span className="text-[10px] text-muted-foreground block">Deposit / date locked</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Journeys Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-blue-500/50 ${
            filterStatus === "completed" ? "border-blue-500 bg-blue-500/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "completed" ? "all" : "completed")}
          title="Filter by Completed Journeys"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</span>
              <p className="text-2xl font-serif font-bold text-blue-700 dark:text-blue-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : summaryCounts.completed}
              </p>
              <span className="text-[10px] text-muted-foreground block">Tour concluded</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Check className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Bookings Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-destructive/50 ${
            filterStatus === "cancelled" ? "border-destructive bg-destructive/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "cancelled" ? "all" : "cancelled")}
          title="Filter by Cancelled Bookings"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cancelled</span>
              <p className="text-2xl font-serif font-bold text-destructive">
                {isLoading ? <Skeleton className="h-7 w-12" /> : summaryCounts.cancelled}
              </p>
              <span className="text-[10px] text-muted-foreground block">Declined or closed</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-lg border border-border">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by guest name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({summaryCounts.total})</SelectItem>
              <SelectItem value="enquiry">Enquiries ({summaryCounts.enquiry})</SelectItem>
              <SelectItem value="confirmed">Confirmed ({summaryCounts.confirmed})</SelectItem>
              <SelectItem value="completed">Completed ({summaryCounts.completed})</SelectItem>
              <SelectItem value="cancelled">Cancelled ({summaryCounts.cancelled})</SelectItem>
            </SelectContent>
          </Select>

          {/* Date filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[135px]">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Travel Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming Trips</SelectItem>
              <SelectItem value="past">Past Trips</SelectItem>
              <SelectItem value="undated">Undated</SelectItem>
            </SelectContent>
          </Select>

          {/* Sorting */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[155px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Received</SelectItem>
              <SelectItem value="oldest">Oldest Received</SelectItem>
              <SelectItem value="travelDate">Travel Date (Soonest)</SelectItem>
              <SelectItem value="amount">Amount (High to Low)</SelectItem>
              <SelectItem value="name">Guest Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setDateFilter("all");
                setSortBy("newest");
              }}
              className="text-xs text-muted-foreground hover:text-foreground h-9"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <AlertTitle>Failed to load booking enquiries</AlertTitle>
              <AlertDescription className="text-xs">There was an issue connecting to the database.</AlertDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/40 hover:bg-destructive/10">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </Alert>
      )}

      {/* Bookings Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[220px]">Guest Information</TableHead>
              <TableHead className="min-w-[190px]">Travel Style / Destinations</TableHead>
              <TableHead className="w-[160px]">Travel Dates</TableHead>
              <TableHead className="w-[130px]">Guests &amp; Budget</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[110px] text-right">Amount</TableHead>
              <TableHead className="w-[110px] text-right">Received</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders && orders.length === 0 ? (
              /* Zero records in collection */
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground">No Booking Inquiries Yet</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                        Inquiries submitted through the trip planner (<code className="text-xs">/plan</code>) and booking forms will automatically land here.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              /* Filters returned zero records */
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-6 w-6 text-muted-foreground/60" />
                    <p className="font-medium text-foreground text-sm">No matching bookings found</p>
                    <p className="text-xs text-muted-foreground">
                      Try clearing search terms or status filters.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                        setDateFilter("all");
                        setSortBy("newest");
                      }}
                      className="mt-2 text-xs"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id} data-testid={`row-order-${o.id}`} className="hover:bg-muted/30">
                  {/* Guest Information */}
                  <TableCell className="align-top py-3.5">
                    <div className="font-medium text-foreground text-sm flex items-center gap-1.5 flex-wrap">
                      <span>{o.guestName}</span>
                      {o.bookingReference ? (
                        <Badge variant="outline" className="text-[10px] font-mono bg-purple-500/10 text-purple-700 border-purple-300">
                          {o.bookingReference}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">#{o.id}</span>
                      )}
                      {o.enquiryId && (
                        <a
                          href={`/enquiries?viewEnquiry=${o.enquiryId}`}
                          className="hover:underline flex items-center gap-1 text-[10px] text-purple-600 font-medium"
                          title={`Created from Inbox Enquiry #${o.enquiryId}`}
                        >
                          <ShoppingBag className="h-2.5 w-2.5" /> Inbox #{o.enquiryId}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                      <a
                        href={`mailto:${o.guestEmail}`}
                        className="hover:text-foreground flex items-center gap-1.5 truncate max-w-[200px]"
                        title={o.guestEmail}
                      >
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{o.guestEmail}</span>
                      </a>
                      <a
                        href={`tel:${o.guestPhone}`}
                        className="hover:text-foreground flex items-center gap-1.5"
                      >
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{o.guestPhone}</span>
                      </a>
                    </div>
                  </TableCell>

                  {/* Travel Style / Destinations */}
                  <TableCell className="align-top py-3.5">
                    <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      {o.travelStyle ? (
                        <Badge variant="outline" className="text-[10px] font-normal bg-primary/5 text-primary border-primary/20">
                          {o.travelStyle}
                        </Badge>
                      ) : o.packageName ? (
                        <span className="line-clamp-1">{o.packageName}</span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Custom Journey</span>
                      )}
                    </div>
                    {o.destinations && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground/70 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{o.destinations}</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Travel Dates */}
                  <TableCell className="align-top py-3.5 text-xs text-muted-foreground">
                    {o.travelDate ? (
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                          <span>{new Date(o.travelDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {o.departureDate && (
                          <div className="text-[11px] text-muted-foreground pl-4">
                            to {new Date(o.departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60 italic">Undated</span>
                    )}
                  </TableCell>

                  {/* Guests & Budget */}
                  <TableCell className="align-top py-3.5 text-xs">
                    <div className="font-medium text-foreground flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{o.guestCount ? `${o.guestCount} ${o.guestCount === 1 ? "Guest" : "Guests"}` : "—"}</span>
                    </div>
                    {o.budgetRange && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[120px]" title={o.budgetRange}>
                        {o.budgetRange}{o.currency ? ` (${o.currency})` : ""}
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="align-top py-3.5 space-y-1">
                    <div>{renderStatusBadge(o.status)}</div>
                    <div>{renderPaymentStatusBadge(o.paymentStatus)}</div>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="align-top py-3.5 text-right text-xs tabular-nums">
                    {o.totalAmount ? (
                      <span className="font-semibold text-foreground">
                        ₹{o.totalAmount.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* Received */}
                  <TableCell className="align-top py-3.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="align-top py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setViewing(o);
                          setShowTechDetails(false);
                        }}
                        title="View Enquiry Details"
                        data-testid={`button-view-order-${o.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(o)}
                        title="Edit Booking"
                        data-testid={`button-edit-order-${o.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(o)}
                        title="Delete Enquiry"
                        data-testid={`button-delete-order-${o.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Special Requests Summary Panel (if any exist in current filtered set) */}
      {filtered?.some((o) => o.specialRequests) && (
        <Card className="border-border bg-card">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary" />
              Recent Special Requests &amp; Customizations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {filtered
                .filter((o) => o.specialRequests)
                .slice(0, 4)
                .map((o) => (
                  <div key={o.id} className="p-2.5 rounded-md bg-muted/20 border border-border/60 text-xs">
                    <div className="font-medium text-foreground flex items-center justify-between mb-1">
                      <span>{o.guestName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">#{o.id}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 italic">
                      &ldquo;{o.specialRequests}&rdquo;
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================
          VIEW ENQUIRY MODAL (Structured Groups + Collapsible Technical Details)
      ============================================================ */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="font-serif text-xl flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Booking {viewing?.bookingReference || `#${viewing?.id}`}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Submitted {viewing ? new Date(viewing.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : ""}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {viewing && renderStatusBadge(viewing.status)}
                {viewing && renderPaymentStatusBadge(viewing.paymentStatus)}
              </div>
            </div>
          </DialogHeader>

          {viewing && (
            <div className="p-6 space-y-6">
              {/* Linked Inbox Enquiry Banner */}
              {viewing.enquiryId && (
                <div className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Converted from Inbox Enquiry #{viewing.enquiryId}</span>
                      <p className="text-[11px] text-muted-foreground">
                        {viewing.convertedBy ? `Converted by ${viewing.convertedBy}` : "Manual conversion from admin inbox"}
                        {viewing.convertedAt ? ` on ${new Date(viewing.convertedAt).toLocaleString("en-IN")}` : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-purple-500/30 text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-950/30 gap-1 shrink-0 cursor-pointer"
                    onClick={() => {
                      window.location.href = `/enquiries?viewEnquiry=${viewing.enquiryId}`;
                    }}
                  >
                    <ExternalLink className="h-3 w-3" /> View Inbox Enquiry
                  </Button>
                </div>
              )}
              {/* Group 1: Guest Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Guest Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/10 p-3.5 rounded-lg border">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">Guest Name</span>
                    <span className="text-base font-semibold text-foreground block mt-0.5">{viewing.guestName}</span>
                    {(viewing.geoCountry || viewing.geoCity) && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {[viewing.geoCity, viewing.geoRegion, viewing.geoCountry].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">Email Address</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={`mailto:${viewing.guestEmail}`} className="font-medium text-foreground hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3 text-primary" /> {viewing.guestEmail}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(viewing.guestEmail);
                            toast({ title: "Email copied" });
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy Email"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">Phone Number</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={`tel:${viewing.guestPhone}`} className="font-medium text-foreground hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" /> {viewing.guestPhone}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(viewing.guestPhone);
                            toast({ title: "Phone number copied" });
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy Phone"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: Travel Preferences & Destinations */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-primary" />
                  Travel Preferences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField
                    label="Travel Style"
                    value={viewing.travelStyle ?? (viewing.packageName ? "Curated Package" : "Custom")}
                    subvalue={viewing.packageName ? `Package: ${viewing.packageName}` : undefined}
                  />
                  <InfoField
                    label="Selected Destinations"
                    value={viewing.destinations || "Unspecified"}
                  />
                </div>

                {viewing.specialRequests && (
                  <div className="space-y-1 mt-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
                      Special Requests &amp; Notes
                    </span>
                    <div className="p-3 rounded-md bg-muted/20 border text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {viewing.specialRequests}
                    </div>
                  </div>
                )}
              </div>

              {/* Group 3: Travel Dates & Guest Count */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Dates &amp; Party Size
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoField
                    label="Arrival Date"
                    value={viewing.travelDate ? new Date(viewing.travelDate).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
                  />
                  <InfoField
                    label="Departure Date"
                    value={viewing.departureDate ? new Date(viewing.departureDate).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
                  />
                  <InfoField
                    label="Party Size"
                    value={viewing.guestCount ? `${viewing.guestCount} Guests` : "—"}
                  />
                  <InfoField
                    label="Budget Range"
                    value={viewing.budgetRange ? `${viewing.budgetRange}${viewing.currency ? ` (${viewing.currency})` : ""}` : "—"}
                  />
                </div>
              </div>

              {/* Group 4: Booking Status, Financials & Internal Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                  Financials &amp; Internal Pipeline
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border bg-primary/5 space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                      Agreed Total Amount
                    </span>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {viewing.totalAmount ? `${viewing.currency || "₹"}${typeof viewing.currency === "string" && viewing.currency.length > 1 ? " " : ""}${viewing.totalAmount.toLocaleString("en-IN")}` : "Unset"}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-muted-foreground">Payment:</span>
                      {renderPaymentStatusBadge(viewing.paymentStatus)}
                    </div>
                    {viewing.paymentTerms && (
                      <p className="text-[11px] text-muted-foreground pt-0.5">
                        Terms: {viewing.paymentTerms}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                      Inquiry Status
                    </span>
                    <div className="flex items-center gap-2 pt-0.5">
                      {renderStatusBadge(viewing.status)}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      {STATUS_DESCRIPTIONS[viewing.status] ?? ""}
                    </p>
                  </div>
                </div>

                {viewing.notes && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3 text-amber-600" />
                        Confidential Staff Notes
                      </span>
                      <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300">
                        Internal Only
                      </Badge>
                    </div>
                    <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/20 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {viewing.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Automated Customer Notifications Section */}
              <div className="border rounded-lg p-4 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Automated Customer Notifications
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {orderNotifications.length} logged
                  </Badge>
                </div>
                {orderNotifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {viewing.status === "confirmed"
                      ? "Booking confirmation notification is queued / sent."
                      : viewing.status === "completed"
                      ? "Post-trip feedback is scheduled / sent."
                      : "No notifications triggered yet (booking confirmations trigger upon 'Confirmed' status; post-trip feedback triggers upon 'Completed')."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orderNotifications.map((notif: any) => (
                      <div key={notif.id} className="p-2.5 rounded border bg-card text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-foreground capitalize">
                            {notif.type.replace(/_/g, " ")}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {notif.messageId ? (
                              <span className="font-mono">Message ID: {notif.messageId}</span>
                            ) : notif.scheduledFor ? (
                              <span className="tabular-nums">Scheduled: {new Date(notif.scheduledFor).toLocaleString()}</span>
                            ) : ""}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            notif.status === "sent"
                              ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px]"
                              : notif.status === "pending"
                              ? "border-amber-500/30 text-amber-600 bg-amber-500/10 text-[10px]"
                              : "border-destructive/30 text-destructive text-[10px]"
                          }
                        >
                          {notif.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Group 5: Collapsible Technical Details & Visitor Attribution */}
              <div className="border rounded-lg overflow-hidden bg-muted/10">
                <button
                  type="button"
                  onClick={() => setShowTechDetails((prev) => !prev)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-muted/20 transition-colors select-none"
                >
                  <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-semibold">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    Technical Details &amp; Attribution
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{showTechDetails ? "Hide" : "Show"}</span>
                    {showTechDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {showTechDetails && (
                  <div className="p-4 border-t border-border bg-card space-y-3.5 text-xs">
                    <p className="text-[11px] text-muted-foreground/80 italic">
                      Note: Network and visitor analytics are captured from the client browser at form submission. In local development or reverse proxy setups, IP address and geo-location may reflect server defaults.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <InfoField label="IP Address" value={viewing.ipAddress || "—"} />
                      <InfoField label="Browser Language" value={viewing.browserLanguage || "—"} />
                      <InfoField label="Timezone" value={viewing.timezone || "—"} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <InfoField label="Screen Resolution" value={viewing.screenResolution || "—"} />
                      <InfoField label="Landing Page" value={viewing.landingPage || "—"} />
                      <InfoField label="Referrer URL" value={viewing.referrerUrl || "Direct / None"} />
                    </div>

                    {(viewing.utmSource || viewing.utmMedium || viewing.utmCampaign) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                        <InfoField label="UTM Source" value={viewing.utmSource} />
                        <InfoField label="UTM Medium" value={viewing.utmMedium} />
                        <InfoField label="UTM Campaign" value={viewing.utmCampaign} />
                      </div>
                    )}

                    {viewing.userAgent && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                          User Agent
                        </span>
                        <code className="text-[11px] text-muted-foreground block bg-muted/40 p-2 rounded border break-all font-mono">
                          {viewing.userAgent}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && (
              <Button
                onClick={() => {
                  const o = viewing;
                  setViewing(null);
                  openEdit(o);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Booking
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          EDIT BOOKING ENQUIRY MODAL
      ============================================================ */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Update Booking #{editing?.id} — {editing?.guestName}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Status Select */}
            <div className="space-y-1.5">
              <Label htmlFor="orderStatus" className="text-xs font-medium">
                Pipeline Status
              </Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger id="orderStatus" data-testid="select-order-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enquiry">Enquiry (Inbound request pending)</SelectItem>
                  <SelectItem value="confirmed">Confirmed (Dates &amp; deposit locked)</SelectItem>
                  <SelectItem value="completed">Completed (Journey concluded)</SelectItem>
                  <SelectItem value="cancelled">Cancelled (Declined or closed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Travel Date & Guests */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="orderTravelDate" className="text-xs font-medium">
                  Travel Date
                </Label>
                <Input
                  id="orderTravelDate"
                  type="date"
                  value={form.travelDate}
                  onChange={(e) => setForm((f) => ({ ...f, travelDate: e.target.value }))}
                  data-testid="input-order-travel-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orderGuestCount" className="text-xs font-medium">
                  Number of Guests
                </Label>
                <Input
                  id="orderGuestCount"
                  type="number"
                  min="1"
                  value={form.guestCount}
                  onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>

            {/* Total Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="orderAmount" className="text-xs font-medium">
                Agreed Total Booking Amount (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">₹</span>
                <Input
                  id="orderAmount"
                  type="number"
                  min="0"
                  step="1"
                  value={form.totalAmount}
                  onChange={(e) => setForm((f) => ({ ...f, totalAmount: Number(e.target.value) || 0 }))}
                  className="pl-7"
                  placeholder="0"
                  data-testid="input-order-amount"
                />
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="orderNotes" className="text-xs font-medium flex items-center justify-between">
                <span>Internal Staff Notes</span>
                <span className="text-[10px] text-muted-foreground italic">Confidential</span>
              </Label>
              <Textarea
                id="orderNotes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Private booking notes, payment milestones, dietary preferences, or flight numbers..."
                data-testid="input-order-notes"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-order">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          SAFE DELETE CONFIRMATION ALERT DIALOG
      ============================================================ */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Booking Enquiry?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete the inquiry for{" "}
                <strong className="text-foreground">{deleteTarget?.guestName}</strong>{" "}
                (Booking Reference <strong className="text-foreground">#{deleteTarget?.id}</strong>)?
              </p>
              {deleteTarget && (
                <div className="p-3 rounded-md bg-muted/40 border text-xs space-y-1">
                  <p>
                    <span className="text-muted-foreground">Contact:</span> {deleteTarget.guestEmail} · {deleteTarget.guestPhone}
                  </p>
                  {deleteTarget.travelDate && (
                    <p>
                      <span className="text-muted-foreground">Travel Date:</span> {deleteTarget.travelDate}
                    </p>
                  )}
                  {deleteTarget.totalAmount ? (
                    <p>
                      <span className="text-muted-foreground">Amount:</span> ₹{deleteTarget.totalAmount.toLocaleString("en-IN")}
                    </p>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-destructive">
                This action cannot be undone. All recorded preferences, internal notes, and tracking data will be removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Enquiry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Booking Creation Modal */}
      <CreateBookingModal
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCreated={(b) => setViewing(b)}
      />
    </div>
  );
}
