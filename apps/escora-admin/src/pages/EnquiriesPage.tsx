import { useState } from "react";
import { useListEnquiries, useUpdateEnquiry, useDeleteEnquiry, getListEnquiriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Mail, Eye } from "lucide-react";
import type { Enquiry } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  read: "secondary",
  replied: "outline",
};

const STATUS_LABELS: Record<string, string> = { new: "New", read: "Read", replied: "Replied" };

export default function EnquiriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: enquiries, isLoading } = useListEnquiries();
  const updateMutation = useUpdateEnquiry();
  const deleteMutation = useDeleteEnquiry();

  const [filterStatus, setFilterStatus] = useState("all");
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  function invalidate() { qc.invalidateQueries({ queryKey: getListEnquiriesQueryKey() }); }

  function markRead(e: Enquiry) {
    if (e.status === "new") {
      updateMutation.mutate({ id: e.id, data: { status: "read" } }, { onSuccess: invalidate });
    }
  }

  function handleStatusChange(id: number, status: string) {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => { invalidate(); toast({ title: "Status updated" }); },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Message deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  const filtered = filterStatus === "all" ? enquiries : enquiries?.filter(e => e.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Contact Inbox</h1>
          <p className="text-muted-foreground mt-1">
            {enquiries?.length ?? 0} messages ·{" "}
            {enquiries?.filter(e => e.status === "new").length ?? 0} unread
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Message Preview</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            )) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                  {filterStatus === "all" ? "No contact messages yet." : `No ${filterStatus} messages.`}
                </TableCell>
              </TableRow>
            ) : filtered.map((e) => (
              <TableRow key={e.id} className={e.status === "new" ? "bg-primary/5" : ""}>
                <TableCell>
                  <div className="font-medium">{e.name}</div>
                  <a href={`mailto:${e.email}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" />{e.email}
                  </a>
                  {e.phone && <div className="text-xs text-muted-foreground">{e.phone}</div>}
                </TableCell>
                <TableCell className="max-w-64">
                  <p className="text-sm text-muted-foreground truncate">{e.message}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[e.status] ?? "secondary"} className="text-xs">
                    {STATUS_LABELS[e.status] ?? e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => { markRead(e); setViewing(e); }}>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View dialog */}
      <Dialog open={viewing !== null} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Message from {viewing?.name}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">From</p>
                  <p className="font-medium">{viewing.name}</p>
                  <a href={`mailto:${viewing.email}`} className="text-muted-foreground hover:text-foreground text-xs">{viewing.email}</a>
                  {viewing.phone && <p className="text-xs text-muted-foreground">{viewing.phone}</p>}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Received</p>
                  <p className="text-sm">{new Date(viewing.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Message</p>
                <p className="text-sm bg-muted/30 border rounded-md p-3 whitespace-pre-wrap leading-relaxed">{viewing.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Status:</p>
                <Select value={viewing.status} onValueChange={v => { handleStatusChange(viewing.id, v); setViewing({ ...viewing, status: v }); }}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
            {viewing && (
              <Button asChild>
                <a href={`mailto:${viewing.email}?subject=Re: Your enquiry — Escora`}>Reply via Email</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the contact message.</AlertDialogDescription>
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
