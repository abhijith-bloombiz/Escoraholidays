import { useState } from "react";
import { useListOrders, useUpdateOrder, useDeleteOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Phone, Mail, Calendar, Eye, Download } from "lucide-react";
import type { Order } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  enquiry: "secondary",
  confirmed: "default",
  completed: "default",
  cancelled: "destructive",
};

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm">{String(value)}</p>
    </div>
  );
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: orders, isLoading } = useListOrders();
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState({ status: "", totalAmount: 0, notes: "", travelDate: "", guestCount: 1 });
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewing, setViewing] = useState<Order | null>(null);

  function openEdit(o: Order) {
    setEditing(o);
    setForm({
      status: o.status,
      totalAmount: o.totalAmount ?? 0,
      notes: o.notes ?? "",
      travelDate: o.travelDate ?? "",
      guestCount: o.guestCount ?? 1,
    });
    setOpen(true);
  }

  function invalidate() { qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    updateMutation.mutate({ id: editing.id, data: { ...form, totalAmount: Number(form.totalAmount) || undefined } }, {
      onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Enquiry updated" }); },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Enquiry deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  const filtered = filterStatus === "all" ? orders : orders?.filter(o => o.status === filterStatus);

  function exportCsv() {
    if (!filtered?.length) return;
    const headers = ["ID","Guest Name","Email","Phone","Travel Style","Destinations","Travel Date","Departure Date","Guests","Budget Range","Status","Amount (INR)","Package","Special Requests","UTM Source","UTM Medium","UTM Campaign","Country","City","Received"];
    const esc = (v: string | number | null | undefined) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map(o => [
      o.id, o.guestName, o.guestEmail, o.guestPhone, o.travelStyle, o.destinations,
      o.travelDate, o.departureDate, o.guestCount, o.budgetRange, o.status, o.totalAmount,
      o.packageName, o.specialRequests, o.utmSource, o.utmMedium, o.utmCampaign,
      o.geoCountry, o.geoCity, o.createdAt,
    ].map(esc).join(","));
    const csv = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-testid="orders-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Enquiries</h1>
          <p className="text-muted-foreground mt-1">{orders?.length ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered?.length}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" data-testid="select-filter-status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="enquiry">Enquiry</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Style / Destinations</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Guests / Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            )) : filtered?.map((o) => (
              <TableRow key={o.id} data-testid={`row-order-${o.id}`}>
                <TableCell>
                  <div className="font-medium">{o.guestName}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <a href={`mailto:${o.guestEmail}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />{o.guestEmail}
                    </a>
                    <a href={`tel:${o.guestPhone}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />{o.guestPhone}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{o.travelStyle ?? o.packageName ?? "—"}</div>
                  {o.destinations && <div className="text-xs text-muted-foreground mt-0.5">{o.destinations}</div>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.travelDate ? (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{o.travelDate}{o.departureDate ? ` → ${o.departureDate}` : ""}</span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{o.guestCount ?? "—"}</div>
                  {o.budgetRange && <div className="text-xs text-muted-foreground">{o.budgetRange}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={(STATUS_COLORS[o.status] ?? "secondary") as "default" | "secondary" | "destructive" | "outline"} className="text-xs capitalize">
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.totalAmount ? `₹${o.totalAmount.toLocaleString("en-IN")}` : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(o)} data-testid={`button-view-order-${o.id}`}>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(o)} data-testid={`button-edit-order-${o.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(o.id)} data-testid={`button-delete-order-${o.id}`}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Special Requests Expansion */}
      {filtered?.some(o => o.specialRequests) && (
        <div className="mt-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Special Requests</h2>
          {filtered?.filter(o => o.specialRequests).map(o => (
            <div key={o.id} className="p-3 rounded-md bg-card border border-border text-sm">
              <span className="font-medium">{o.guestName}:</span>{" "}
              <span className="text-muted-foreground">{o.specialRequests}</span>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewing !== null} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Enquiry — {viewing?.guestName}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 pt-1">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Guest</p>
                <p className="text-sm font-medium">{viewing.guestName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <a href={`mailto:${viewing.guestEmail}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />{viewing.guestEmail}
                  </a>
                  <a href={`tel:${viewing.guestPhone}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />{viewing.guestPhone}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Travel Style" value={viewing.travelStyle} />
                <Field label="Package" value={viewing.packageName} />
              </div>
              <Field label="Destinations" value={viewing.destinations} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Travel Date" value={viewing.travelDate} />
                <Field label="Departure Date" value={viewing.departureDate} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Guests" value={viewing.guestCount} />
                <Field label="Budget Range" value={viewing.budgetRange} />
              </div>
              {viewing.specialRequests && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Special Requests</p>
                  <p className="text-sm bg-muted/30 border rounded-md p-2 whitespace-pre-wrap">{viewing.specialRequests}</p>
                </div>
              )}
              <div className="border-t pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                    <Badge variant={(STATUS_COLORS[viewing.status] ?? "secondary") as "default" | "secondary" | "destructive" | "outline"} className="text-xs capitalize">
                      {viewing.status}
                    </Badge>
                  </div>
                  <Field label="Total Amount" value={viewing.totalAmount ? `₹${viewing.totalAmount.toLocaleString("en-IN")}` : undefined} />
                </div>
                {viewing.notes && (
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Internal Notes</p>
                    <p className="text-sm bg-muted/30 border rounded-md p-2 whitespace-pre-wrap">{viewing.notes}</p>
                  </div>
                )}
              </div>
              {(viewing.ipAddress || viewing.geoCountry || viewing.referrerUrl || viewing.landingPage || viewing.utmSource || viewing.browserLanguage || viewing.timezone || viewing.screenResolution || viewing.userAgent) && (
                <div className="border-t pt-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session & Tracking</p>
                  {(viewing.geoCountry || viewing.geoCity || viewing.ipAddress) && (
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Country" value={viewing.geoCountry} />
                      <Field label="Region" value={viewing.geoRegion} />
                      <Field label="City" value={viewing.geoCity} />
                    </div>
                  )}
                  <Field label="IP Address" value={viewing.ipAddress} />
                  <Field label="Referrer" value={viewing.referrerUrl} />
                  <Field label="Landing Page" value={viewing.landingPage} />
                  {(viewing.utmSource || viewing.utmMedium || viewing.utmCampaign) && (
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="UTM Source" value={viewing.utmSource} />
                      <Field label="UTM Medium" value={viewing.utmMedium} />
                      <Field label="UTM Campaign" value={viewing.utmCampaign} />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Language" value={viewing.browserLanguage} />
                    <Field label="Screen" value={viewing.screenResolution} />
                    <Field label="Timezone" value={viewing.timezone} />
                  </div>
                  {viewing.userAgent && (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User Agent</p>
                      <p className="text-xs text-muted-foreground bg-muted/30 border rounded-md p-2 break-all">{viewing.userAgent}</p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">ID: {viewing.id} · Received: {new Date(viewing.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
            <Button onClick={() => { if (viewing) { setViewing(null); openEdit(viewing); } }}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Enquiry — {editing?.guestName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-order-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enquiry">Enquiry</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Travel Date</Label>
                <Input type="date" value={form.travelDate} onChange={e => setForm(f => ({ ...f, travelDate: e.target.value }))} data-testid="input-order-travel-date" />
              </div>
              <div className="space-y-1.5">
                <Label>Guests</Label>
                <Input type="number" value={form.guestCount} onChange={e => setForm(f => ({ ...f, guestCount: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Total Amount (₹)</Label>
              <Input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: Number(e.target.value) }))} data-testid="input-order-amount" />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} data-testid="input-order-notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-order">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete enquiry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the guest's enquiry.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
