import { useState } from "react";
import { useListDestinations, useCreateDestination, useUpdateDestination, useDeleteDestination, getListDestinationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Globe, Eye } from "lucide-react";
import type { Destination } from "@workspace/api-client-react";

const emptyForm = {
  name: "", slug: "", region: "", type: "", description: "", shortDesc: "",
  imageUrl: "", bestSeason: "", elevation: "", nightsMin: 0, nightsMax: 0,
  highlights: "", howToReach: "", published: false,
};

function parseHighlights(highlights?: string | null): string[] {
  if (!highlights) return [];
  try {
    const parsed = JSON.parse(highlights);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through to newline-split
  }
  return highlights.split("\n").map((s) => s.trim()).filter(Boolean);
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm">{String(value)}</p>
    </div>
  );
}

export default function DestinationsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: destinations, isLoading } = useListDestinations();
  const createMutation = useCreateDestination();
  const updateMutation = useUpdateDestination();
  const deleteMutation = useDeleteDestination();

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewing, setViewing] = useState<Destination | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(d: Destination) {
    setEditing(d);
    setForm({
      name: d.name, slug: d.slug, region: d.region, type: d.type,
      description: d.description ?? "", shortDesc: d.shortDesc ?? "",
      imageUrl: d.imageUrl ?? "", bestSeason: d.bestSeason ?? "",
      elevation: d.elevation ?? "", nightsMin: d.nightsMin ?? 0,
      nightsMax: d.nightsMax ?? 0,
      highlights: parseHighlights(d.highlights).join("\n"),
      howToReach: d.howToReach ?? "",
      published: d.published,
    });
    setOpen(true);
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListDestinationsQueryKey() });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const highlightLines = form.highlights.split("\n").map((s) => s.trim()).filter(Boolean);
    const data = {
      ...form,
      nightsMin: Number(form.nightsMin) || undefined,
      nightsMax: Number(form.nightsMax) || undefined,
      highlights: highlightLines.length > 0 ? JSON.stringify(highlightLines) : undefined,
      howToReach: form.howToReach || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Destination updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Destination created" }); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Destination deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  return (
    <div data-testid="destinations-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Destinations</h1>
          <p className="text-muted-foreground mt-1">{destinations?.length ?? 0} total</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-destination">
          <Plus className="h-4 w-4 mr-2" /> Add Destination
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            )) : !destinations?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  No destinations yet. Click <span className="font-medium text-foreground">Add Destination</span> to create your first.
                </TableCell>
              </TableRow>
            ) : destinations?.map((d) => (
              <TableRow key={d.id} data-testid={`row-destination-${d.id}`}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-muted-foreground">{d.region}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{d.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{d.bestSeason ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={d.published ? "default" : "secondary"} className="text-xs">
                    {d.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(d)} data-testid={`button-view-destination-${d.id}`}>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)} data-testid={`button-edit-destination-${d.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)} data-testid={`button-delete-destination-${d.id}`}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewing !== null} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {viewing?.name}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={viewing.name} />
                <Field label="Slug" value={viewing.slug} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Region" value={viewing.region} />
                <Field label="Type" value={viewing.type} />
              </div>
              <Field label="Short Description" value={viewing.shortDesc} />
              <Field label="Full Description" value={viewing.description} />
              <Field label="Image URL" value={viewing.imageUrl} />
              {viewing.imageUrl && (
                <img src={viewing.imageUrl} alt={viewing.name} className="w-full h-40 object-cover rounded-md" />
              )}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Best Season" value={viewing.bestSeason} />
                <Field label="Min Nights" value={viewing.nightsMin} />
                <Field label="Max Nights" value={viewing.nightsMax} />
              </div>
              <Field label="Elevation" value={viewing.elevation} />
              {parseHighlights(viewing.highlights).length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Highlights</p>
                  <ul className="text-sm list-disc pl-4 space-y-0.5">
                    {parseHighlights(viewing.highlights).map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
              <Field label="How to Reach" value={viewing.howToReach} />
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={viewing.published ? "default" : "secondary"} className="text-xs">
                  {viewing.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">ID: {viewing.id} · Created: {new Date(viewing.createdAt).toLocaleDateString()}</p>
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

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Destination" : "Add Destination"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dest-name">Name *</Label>
                <Input id="dest-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required data-testid="input-destination-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dest-slug">Slug *</Label>
                <Input id="dest-slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required data-testid="input-destination-slug" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dest-region">Region *</Label>
                <Input id="dest-region" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dest-type">Type *</Label>
                <Input id="dest-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Backwaters, Hills, Heritage…" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-short">Short Description</Label>
              <Input id="dest-short" value={form.shortDesc} onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-desc">Full Description</Label>
              <Textarea id="dest-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-img">Image URL</Label>
              <Input id="dest-img" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dest-season">Best Season</Label>
                <Input id="dest-season" value={form.bestSeason} onChange={e => setForm(f => ({ ...f, bestSeason: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dest-nights-min">Min Nights</Label>
                <Input id="dest-nights-min" type="number" value={form.nightsMin} onChange={e => setForm(f => ({ ...f, nightsMin: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dest-nights-max">Max Nights</Label>
                <Input id="dest-nights-max" type="number" value={form.nightsMax} onChange={e => setForm(f => ({ ...f, nightsMax: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-highlights">Highlights / Things to Do</Label>
              <Textarea
                id="dest-highlights"
                value={form.highlights}
                onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))}
                rows={5}
                placeholder={"One highlight per line, e.g.\nMuzhappilangad Drive-in Beach — 4 km of drivable sand\nTheyyam ritual performances at village temple groves"}
              />
              <p className="text-xs text-muted-foreground">One named attraction or experience per line.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dest-how-to-reach">How to Reach</Label>
              <Textarea
                id="dest-how-to-reach"
                value={form.howToReach}
                onChange={e => setForm(f => ({ ...f, howToReach: e.target.value }))}
                rows={2}
                placeholder="Nearest airport, distance, and any rail links…"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="dest-published" checked={form.published} onCheckedChange={v => setForm(f => ({ ...f, published: v }))} data-testid="switch-destination-published" />
              <Label htmlFor="dest-published" className="flex items-center gap-1.5 cursor-pointer">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Published on customer site
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-destination">
                {editing ? "Save Changes" : "Create Destination"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete destination?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The destination will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
