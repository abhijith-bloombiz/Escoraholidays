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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadField from "@/components/ImageUploadField";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Star,
  Quote,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
} from "lucide-react";

interface TestimonialFormData {
  name: string;
  quote: string;
  category: string;
  dateLabel: string;
  location: string;
  avatarUrl: string;
  photoUrl: string;
  photoAlt: string;
  rating: number;
  sortOrder: number;
  published: boolean;
}

const defaultForm: TestimonialFormData = {
  name: "",
  quote: "",
  category: "",
  dateLabel: "",
  location: "",
  avatarUrl: "",
  photoUrl: "",
  photoAlt: "",
  rating: 5,
  sortOrder: 0,
  published: true,
};

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: testimonials = [], isLoading, isError } = useListTestimonials();
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
      quote: testimonial.quote,
      category: testimonial.category || "",
      dateLabel: testimonial.dateLabel || "",
      location: testimonial.location || "",
      avatarUrl: testimonial.avatarUrl || "",
      photoUrl: testimonial.photoUrl || "",
      photoAlt: testimonial.photoAlt || "",
      rating: testimonial.rating || 5,
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
      setValidationError("Customer name is required.");
      return;
    }
    if (!formData.quote.trim()) {
      setValidationError("Testimonial quote is required.");
      return;
    }

    try {
      if (editingTestimonial) {
        await updateMutation.mutateAsync({
          id: editingTestimonial.id,
          data: {
            name: formData.name.trim(),
            quote: formData.quote.trim(),
            category: formData.category.trim() || undefined,
            dateLabel: formData.dateLabel.trim() || undefined,
            location: formData.location.trim() || undefined,
            avatarUrl: formData.avatarUrl.trim() || undefined,
            photoUrl: formData.photoUrl.trim() || undefined,
            photoAlt: formData.photoAlt.trim() || undefined,
            rating: Number(formData.rating) || 5,
            sortOrder: Number(formData.sortOrder) || 0,
            published: formData.published,
          },
        });
        toast({
          title: "Testimonial updated",
          description: `Testimonial from "${formData.name}" was successfully updated.`,
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            name: formData.name.trim(),
            quote: formData.quote.trim(),
            category: formData.category.trim() || undefined,
            dateLabel: formData.dateLabel.trim() || undefined,
            location: formData.location.trim() || undefined,
            avatarUrl: formData.avatarUrl.trim() || undefined,
            photoUrl: formData.photoUrl.trim() || undefined,
            photoAlt: formData.photoAlt.trim() || undefined,
            rating: Number(formData.rating) || 5,
            sortOrder: Number(formData.sortOrder) || 0,
            published: formData.published,
          },
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
              Testimonials
            </h1>
            <Badge variant="outline" className="text-xs">
              {testimonials.length} Stories
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage traveller endorsements and reviews displayed in the homepage carousel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreate} className="gap-2 cursor-pointer" data-testid="button-create-testimonial">
            <Plus className="h-4 w-4" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search testimonials by traveller, quote, city..."
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
              <TableHead className="w-20">Photos</TableHead>
              <TableHead>Customer / Reviewer</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead className="w-28">Context</TableHead>
              <TableHead className="w-24 text-center">Rating</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-16 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredTestimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Quote className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No testimonials found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {search ? "Try refining your search query" : "Click 'Add Testimonial' to create one"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTestimonials.map((testimonial) => (
                <TableRow key={testimonial.id} className="hover:bg-muted/20" data-testid={`testimonial-row-${testimonial.id}`}>
                  <TableCell className="text-center text-xs text-muted-foreground font-mono">
                    {testimonial.sortOrder}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center -space-x-2">
                      {testimonial.photoUrl && (
                        <img
                          src={testimonial.photoUrl}
                          alt={testimonial.photoAlt || "Trip"}
                          className="h-10 w-12 rounded object-cover border border-border shadow-xs"
                        />
                      )}
                      {testimonial.avatarUrl ? (
                        <img
                          src={testimonial.avatarUrl}
                          alt={testimonial.name}
                          className="h-7 w-7 rounded-full object-cover border-2 border-background shadow-xs"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground text-sm">
                      {testimonial.name}
                    </div>
                    {testimonial.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground/70" />
                        {testimonial.location}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className="text-xs text-muted-foreground line-clamp-2 max-w-lg italic font-serif"
                      dangerouslySetInnerHTML={{ __html: testimonial.quote }}
                    />
                  </TableCell>
                  <TableCell className="text-xs">
                    {testimonial.category && (
                      <span className="font-medium text-foreground block">{testimonial.category}</span>
                    )}
                    {testimonial.dateLabel && (
                      <span className="text-muted-foreground text-[11px] block">{testimonial.dateLabel}</span>
                    )}
                    {!testimonial.category && !testimonial.dateLabel && (
                      <span className="text-muted-foreground italic text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-amber-500 text-xs font-mono font-medium inline-flex items-center gap-0.5">
                      {"★".repeat(testimonial.rating || 5)}
                    </span>
                  </TableCell>
                  <TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingTestimonial ? `Edit Testimonial: ${editingTestimonial.name}` : "Create New Testimonial"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add genuine traveller experiences and stories for the homepage testimonial carousel.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="testi-name" className="text-xs font-medium">
                  Customer Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="testi-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Eleanor V., Marcus T."
                  className="text-xs"
                  required
                  data-testid="input-testimonial-name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="testi-rating" className="text-xs font-medium">
                  Rating
                </Label>
                <Select
                  value={String(formData.rating)}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, rating: parseInt(val, 10) || 5 }))}
                >
                  <SelectTrigger id="testi-rating" className="text-xs h-9">
                    <SelectValue placeholder="Rating (1-5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">★★★★★ (5 Stars)</SelectItem>
                    <SelectItem value="4">★★★★☆ (4 Stars)</SelectItem>
                    <SelectItem value="3">★★★☆☆ (3 Stars)</SelectItem>
                    <SelectItem value="2">★★☆☆☆ (2 Stars)</SelectItem>
                    <SelectItem value="1">★☆☆☆☆ (1 Star)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="testi-quote" className="text-xs font-medium">
                Testimonial Quote <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="testi-quote"
                value={formData.quote}
                onChange={(e) => setFormData((prev) => ({ ...prev, quote: e.target.value }))}
                placeholder="The traveller's quote. HTML like <em>emphasis</em> is supported."
                rows={3}
                className="text-xs resize-none font-serif"
                required
                data-testid="input-testimonial-quote"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="testi-location" className="text-xs font-medium">
                  Location / City
                </Label>
                <Input
                  id="testi-location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. London, San Francisco"
                  className="text-xs"
                  data-testid="input-testimonial-location"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="testi-category" className="text-xs font-medium">
                  Category / Trip Type
                </Label>
                <Input
                  id="testi-category"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. Honeymoon, Family"
                  className="text-xs"
                  data-testid="input-testimonial-category"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="testi-datelabel" className="text-xs font-medium">
                  Date / Context Label
                </Label>
                <Input
                  id="testi-datelabel"
                  value={formData.dateLabel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dateLabel: e.target.value }))}
                  placeholder="e.g. Mar 2025, Dec 2024"
                  className="text-xs"
                  data-testid="input-testimonial-datelabel"
                />
              </div>
            </div>

            {/* Photos: Avatar and Trip Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Customer Avatar</Label>
                <ImageUploadField
                  value={formData.avatarUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, avatarUrl: url }))}
                  label="Avatar Photo"
                  size="default"
                  helperText="Square profile picture or headshot."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Trip / Scenery Photo</Label>
                <ImageUploadField
                  value={formData.photoUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url }))}
                  label="Trip Photo"
                  size="default"
                  helperText="Landscape photo of their Kerala experience."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="testi-photoalt" className="text-xs font-medium">
                Trip Photo Alt Text
              </Label>
              <Input
                id="testi-photoalt"
                value={formData.photoAlt}
                onChange={(e) => setFormData((prev) => ({ ...prev, photoAlt: e.target.value }))}
                placeholder="Accessible description of the trip photo..."
                className="text-xs"
                data-testid="input-testimonial-photoalt"
              />
            </div>

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
                  <p className="text-[11px] text-muted-foreground">Make visible on homepage carousel</p>
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
                className="text-xs cursor-pointer"
                data-testid="button-save-testimonial"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving…"
                  : editingTestimonial
                  ? "Save Changes"
                  : "Create Testimonial"}
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
