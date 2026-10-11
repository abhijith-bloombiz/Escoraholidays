import { useState } from "react";
import { useListPackages, useCreatePackage, useUpdatePackage, useDeletePackage, getListPackagesQueryKey } from "@workspace/api-client-react";
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
import { Plus, Pencil, Trash2, Globe, Star, Eye } from "lucide-react";
import type { Package } from "@workspace/api-client-react";

const emptyForm = {
  name: "", slug: "", category: "", description: "", shortDesc: "",
  durationNights: 1, route: "", bestFor: "", season: "", priceFrom: 0,
  heroImageUrl: "", itinerary: "", inclusions: "", exclusions: "", faqs: "", accommodations: "",
  featured: false, published: false,
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

export default function PackagesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: packages, isLoading } = useListPackages();
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const deleteMutation = useDeletePackage();

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewing, setViewing] = useState<Package | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: Package) {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, category: p.category,
      description: p.description ?? "", shortDesc: p.shortDesc ?? "",
      durationNights: p.durationNights, route: p.route ?? "",
      bestFor: p.bestFor ?? "", season: p.season ?? "",
      priceFrom: p.priceFrom ?? 0, heroImageUrl: p.heroImageUrl ?? "",
      itinerary: p.itinerary ?? "", inclusions: p.inclusions ?? "",
      exclusions: p.exclusions ?? "", faqs: p.faqs ?? "",
      accommodations: p.accommodations ?? "", featured: p.featured ?? false, published: p.published,
    });
    setOpen(true);
  }

  function invalidate() { qc.invalidateQueries({ queryKey: getListPackagesQueryKey() }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, durationNights: Number(form.durationNights), priceFrom: Number(form.priceFrom) || undefined };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Journey updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Journey created" }); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Journey deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  return (
    <div data-testid="packages-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Journeys</h1>
          <p className="text-muted-foreground mt-1">{packages?.length ?? 0} total packages</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-package">
          <Plus className="h-4 w-4 mr-2" /> Add Journey
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Price from</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            )) : !packages?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No journeys yet. Click <span className="font-medium text-foreground">Add Journey</span> to create your first.
                </TableCell>
              </TableRow>
            ) : packages?.map((p) => (
              <TableRow key={p.id} data-testid={`row-package-${p.id}`}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.durationNights}N</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-32 truncate">{p.route ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {p.priceFrom ? `₹${p.priceFrom.toLocaleString("en-IN")}` : "—"}
                </TableCell>
                <TableCell>
                  {p.featured && (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={p.published ? "default" : "secondary"} className="text-xs">
                    {p.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(p)} data-testid={`button-view-package-${p.id}`}>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`button-edit-package-${p.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} data-testid={`button-delete-package-${p.id}`}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-3 gap-3">
                <Field label="Category" value={viewing.category} />
                <Field label="Duration" value={`${viewing.durationNights} nights`} />
                <Field label="Price From" value={viewing.priceFrom ? `₹${viewing.priceFrom.toLocaleString("en-IN")}` : undefined} />
              </div>
              <Field label="Route" value={viewing.route} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Best For" value={viewing.bestFor} />
                <Field label="Season" value={viewing.season} />
              </div>
              <Field label="Short Description" value={viewing.shortDesc} />
              <Field label="Full Description" value={viewing.description} />
              <Field label="Hero Image URL" value={viewing.heroImageUrl} />
              {viewing.heroImageUrl && (
                <img src={viewing.heroImageUrl} alt={viewing.name} className="w-full h-44 object-cover rounded-md" />
              )}
              {viewing.itinerary && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Itinerary</p>
                  <pre className="text-xs font-mono bg-muted/30 border rounded-md p-2 overflow-x-auto max-h-32 whitespace-pre-wrap">{viewing.itinerary}</pre>
                </div>
              )}
              {viewing.inclusions && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inclusions</p>
                  <pre className="text-xs font-mono bg-muted/30 border rounded-md p-2 overflow-x-auto max-h-24 whitespace-pre-wrap">{viewing.inclusions}</pre>
                </div>
              )}
              {viewing.exclusions && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exclusions</p>
                  <pre className="text-xs font-mono bg-muted/30 border rounded-md p-2 overflow-x-auto max-h-24 whitespace-pre-wrap">{viewing.exclusions}</pre>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                {viewing.featured && (
                  <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
                  </Badge>
                )}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Journey" : "Add Journey"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required data-testid="input-package-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required data-testid="input-package-slug" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Classic, Coastal, Wellness…" required />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (nights) *</Label>
                <Input type="number" value={form.durationNights} onChange={e => setForm(f => ({ ...f, durationNights: Number(e.target.value) }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Price From (₹)</Label>
                <Input type="number" value={form.priceFrom} onChange={e => setForm(f => ({ ...f, priceFrom: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Route</Label>
              <Input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} placeholder="Kochi → Alleppey → Munnar" />
            </div>
            <div className="space-y-1.5">
              <Label>Short Description</Label>
              <Input value={form.shortDesc} onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Full Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Hero Image URL</Label>
              <Input value={form.heroImageUrl} onChange={e => setForm(f => ({ ...f, heroImageUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Best For</Label>
                <Input value={form.bestFor} onChange={e => setForm(f => ({ ...f, bestFor: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Season</Label>
                <Input value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Itinerary (JSON)</Label>
              <Textarea value={form.itinerary} onChange={e => setForm(f => ({ ...f, itinerary: e.target.value }))} rows={4} placeholder='[{"day":1,"title":"Day 1","description":"..."}]' className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label>Inclusions (JSON array of strings)</Label>
              <Textarea value={form.inclusions} onChange={e => setForm(f => ({ ...f, inclusions: e.target.value }))} rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label>Exclusions (JSON array of strings)</Label>
              <Textarea value={form.exclusions} onChange={e => setForm(f => ({ ...f, exclusions: e.target.value }))} rows={3} className="font-mono text-xs" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} data-testid="switch-package-featured" />
                <Label className="flex items-center gap-1.5 cursor-pointer">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  Show in Featured Journeys on home page
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.published} onCheckedChange={v => setForm(f => ({ ...f, published: v }))} data-testid="switch-package-published" />
                <Label className="flex items-center gap-1.5 cursor-pointer">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Published on customer site
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-package">
                {editing ? "Save Changes" : "Create Journey"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journey?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
