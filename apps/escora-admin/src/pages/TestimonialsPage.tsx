import { useState, useMemo } from "react";
import {
  useListTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  getListTestimonialsQueryKey,
  type Testimonial,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadField from "@/components/ImageUploadField";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Quote,
  AlertTriangle,
  User,
  MapPin,
  Briefcase,
  Sparkles,
  Eye,
} from "lucide-react";

interface TestimonialFormData {
  name: string;
  role: string;
  location: string;
  quote: string;
  photoUrl: string;
  avatarUrl: string;
  sortOrder: number;
  published: boolean;
}

const defaultForm: TestimonialFormData = {
  name: "",
  role: "",
  location: "",
  quote: "",
  photoUrl: "",
  avatarUrl: "",
  sortOrder: 0,
  published: true,
};

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: testimonials = [], isLoading } = useListTestimonials();
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState<TestimonialFormData>(defaultForm);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState<Testimonial | null>(null);

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.quote.toLowerCase().includes(search.toLowerCase()) ||
        (t.location || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.category || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
          ? t.published
          : !t.published;

      return matchSearch && matchStatus;
    });
  }, [testimonials, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingTestimonial(null);
    setFormData({
      ...defaultForm,
      sortOrder: testimonials.length,
    });
    setValidationError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      role: testimonial.category || "",
      location: testimonial.location || "",
      quote: testimonial.quote,
      photoUrl: testimonial.photoUrl || testimonial.avatarUrl || "",
      avatarUrl: testimonial.avatarUrl || testimonial.photoUrl || "",
      sortOrder: testimonial.sortOrder,
      published: testimonial.published,
    });
    setValidationError(null);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.name.trim()) {
      setValidationError("Guest name is required.");
      return;
    }
    if (!formData.quote.trim()) {
      setValidationError("Testimonial quote is required.");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.role.trim() || undefined,
        location: formData.location.trim() || undefined,
        quote: formData.quote.trim(),
        photoUrl: formData.photoUrl.trim() || undefined,
        avatarUrl: formData.photoUrl.trim() || formData.avatarUrl.trim() || undefined,
        sortOrder: Number(formData.sortOrder) || 0,
        published: formData.published,
      };

      if (editingTestimonial) {
        await updateMutation.mutateAsync({
          id: editingTestimonial.id,
          data: payload,
        });
        toast({
          title: "Testimonial updated",
          description: `Testimonial from "${formData.name}" was successfully updated.`,
        });
      } else {
        await createMutation.mutateAsync({
          data: payload,
        });
        toast({
          title: "Testimonial created",
          description: `Testimonial from "${formData.name}" was successfully created.`,
        });
      }
      qc.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
      setDialogOpen(false);
    } catch (err: any) {
      setValidationError(err.message || "Failed to save testimonial. Please verify required fields.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTestimonial) return;

    try {
      await deleteMutation.mutateAsync({ id: deletingTestimonial.id });
      qc.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
      toast({
        title: "Testimonial deleted",
        description: `Testimonial from "${deletingTestimonial.name}" was deleted.`,
      });
      setDeleteDialogOpen(false);
      setDeletingTestimonial(null);
    } catch (err: any) {
      toast({
        title: "Deletion failed",
        description: err.message || "Could not delete testimonial.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground">
              Guest Voices & Testimonials
            </h1>
            <Badge variant="outline" className="text-xs">
              {testimonials.length} Stories
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage guest endorsements, credentials, and portrait photography displayed on the public website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreate} className="gap-2 cursor-pointer bg-[#183D2E] hover:bg-[#122D22] text-white" data-testid="button-create-testimonial">
            <Plus className="h-4 w-4" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest name, role, city, quote..."
            className="pl-9 h-9 text-xs"
            data-testid="input-search-testimonials"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
            <Button
              type="button"
              variant={statusFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-7 text-xs px-2.5"
            >
              All
            </Button>
            <Button
              type="button"
              variant={statusFilter === "published" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("published")}
              className="h-7 text-xs px-2.5 text-emerald-600 dark:text-emerald-400"
            >
              Published
            </Button>
            <Button
              type="button"
              variant={statusFilter === "draft" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
              className="h-7 text-xs px-2.5 text-amber-600 dark:text-amber-400"
            >
              Drafts
            </Button>
          </div>
        </div>
      </div>

      {/* Testimonials Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-24">Portrait</TableHead>
              <TableHead className="w-52">Guest / Author</TableHead>
              <TableHead className="w-56">Role & Location</TableHead>
              <TableHead>Testimonial Quote</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-14 w-12 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-72" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredTestimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Quote className="h-8 w-8 mx-auto mb-2 opacity-40 text-amber-600" />
                  <p className="text-sm font-medium">No testimonials found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {search ? "Try refining your search query" : "Click 'Add Testimonial' to publish a new guest voice"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTestimonials.map((testimonial) => {
                const photo = testimonial.photoUrl || testimonial.avatarUrl;
                const roleFormatted = [testimonial.category, testimonial.location].filter(Boolean).join(", ") || "Verified Guest";

                return (
                  <TableRow key={testimonial.id} className="hover:bg-muted/20" data-testid={`testimonial-row-${testimonial.id}`}>
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {testimonial.sortOrder}
                    </TableCell>

                    {/* Portrait Photo */}
                    <TableCell>
                      {photo ? (
                        <div className="h-14 w-12 rounded-lg overflow-hidden border border-border shadow-xs bg-muted/40">
                          <img
                            src={photo}
                            alt={testimonial.name}
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-12 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                          <User className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                    </TableCell>

                    {/* Guest Name */}
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm uppercase tracking-wide">
                        {testimonial.name}
                      </div>
                    </TableCell>

                    {/* Role & Location */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3 text-amber-600/80 flex-shrink-0" />
                        <span className="font-medium text-foreground">{testimonial.category || "Guest"}</span>
                      </div>
                      {testimonial.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
                          <span>{testimonial.location}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Quote */}
                    <TableCell>
                      <div className="text-xs text-foreground/80 line-clamp-2 italic font-serif max-w-xl">
                        &ldquo;{testimonial.quote.replace(/<[^>]*>/g, "")}&rdquo;
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      {testimonial.published ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px]">
                          Draft
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => handleOpenEdit(testimonial)}
                          data-testid={`button-edit-testimonial-${testimonial.id}`}
                          aria-label={`Edit testimonial by ${testimonial.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                          onClick={() => {
                            setDeletingTestimonial(testimonial);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-testimonial-${testimonial.id}`}
                          aria-label={`Delete testimonial by ${testimonial.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Quote className="h-5 w-5 text-amber-600" />
              {editingTestimonial ? `Edit Testimonial: ${editingTestimonial.name}` : "Create New Guest Voice"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure guest endorsements, credentials, and photography displayed on the public site's Guest Voices card.
            </DialogDescription>
          </DialogHeader>

          {validationError && (
            <Alert variant="destructive" className="py-2.5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Validation Error</AlertTitle>
              <AlertDescription className="text-xs">{validationError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* Guest Name & Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="testi-name" className="text-xs font-medium">
                  Guest Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="testi-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Emily D. Carter"
                  className="text-xs font-medium"
                  required
                  data-testid="input-testimonial-name"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="testi-role" className="text-xs font-medium">
                  Role / Profession
                </Label>
                <Input
                  id="testi-role"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g. Creative Director"
                  className="text-xs"
                  data-testid="input-testimonial-role"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="testi-location" className="text-xs font-medium">
                  City / Country
                </Label>
                <Input
                  id="testi-location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. London"
                  className="text-xs"
                  data-testid="input-testimonial-location"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground -mt-1">
              Displays on website as: <strong className="text-foreground">{(formData.name || "GUEST").toUpperCase()}</strong> &bull; {[formData.role, formData.location].filter(Boolean).join(", ") || "Role, Location"}
            </p>

            {/* Testimonial Quote */}
            <div className="space-y-1.5">
              <Label htmlFor="testi-quote" className="text-xs font-medium">
                Testimonial Quote <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="testi-quote"
                value={formData.quote}
                onChange={(e) => setFormData((prev) => ({ ...prev, quote: e.target.value }))}
                placeholder="Share the guest's authentic experience with ESCORA..."
                rows={4}
                className="text-xs resize-none font-serif leading-relaxed"
                required
                data-testid="input-testimonial-quote"
              />
            </div>

            {/* Single Portrait Photograph */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Portrait Photograph</Label>
              <ImageUploadField
                value={formData.photoUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url, avatarUrl: url }))}
                label="Guest / Scenery Portrait Photo"
                size="default"
                helperText="Vertical portrait photograph displayed on the right of the testimonial card on the homepage."
              />
            </div>

            {/* Live Website Card Preview */}
            <div className="bg-[#F8F6F1] p-4 rounded-xl border border-[#E8E4D9]">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Eye className="h-3.5 w-3.5 text-amber-700" />
                <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                  Live Website Card Preview
                </span>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/5 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch justify-between">
                <div className="flex-1 flex flex-col justify-between">
                  <div className="border-b border-black/5 pb-2 mb-3">
                    <h4 className="font-display text-base font-bold text-gray-900 tracking-wider">
                      {(formData.name || "GUEST NAME").toUpperCase()}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[formData.role, formData.location].filter(Boolean).join(", ") || "Creative Director, London"}
                    </p>
                  </div>
                  <blockquote className="font-serif text-xs text-gray-700 italic leading-relaxed">
                    &ldquo;{formData.quote || "ESCORA completely changed the way we think about luxury travel. Everything felt personal, thoughtfully planned, and deeply respectful of authentic Kerala culture."}&rdquo;
                  </blockquote>
                </div>
                <div className="w-full sm:w-28 h-36 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[10px] p-2 text-center">
                      <User className="h-6 w-6 mb-1 opacity-40" />
                      <span>Portrait Photo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="testi-order" className="text-xs font-medium">
                  Display Order
                </Label>
                <Input
                  id="testi-order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                  className="text-xs"
                  data-testid="input-testimonial-order"
                />
                <p className="text-[11px] text-muted-foreground">Order in carousel (0 = first)</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-6">
                <div>
                  <Label htmlFor="testi-published" className="text-xs font-medium block">
                    Publication Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Visible on homepage guest voices carousel</p>
                </div>
                <Switch
                  id="testi-published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, published: checked }))}
                  data-testid="switch-testimonial-published"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="text-xs cursor-pointer bg-[#183D2E] hover:bg-[#122D22] text-white"
                data-testid="button-save-testimonial"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving…"
                  : editingTestimonial
                  ? "Save Changes"
                  : "Publish Testimonial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Delete Testimonial by &quot;{deletingTestimonial?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action cannot be undone. The testimonial will be permanently removed from the database and public carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingTestimonial(null);
              }}
              className="text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
              data-testid="button-confirm-delete-testimonial"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Testimonial"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
