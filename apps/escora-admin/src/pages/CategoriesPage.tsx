import { useState, useMemo } from "react";
import {
  useListTravelCategories,
  useCreateTravelCategory,
  useUpdateTravelCategory,
  useDeleteTravelCategory,
  getListTravelCategoriesQueryKey,
  type TravelCategory,
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
  ExternalLink,
  Compass,
  AlertTriangle,
  Layers,
  Lock,
  Unlock,
} from "lucide-react";

interface CategoryFormData {
  label: string;
  slug: string;
  description: string;
  imageUrl: string;
  priceFrom: string;
  priceLabel: string;
  journeyCount: string;
  sortOrder: number;
  published: boolean;
}

const defaultForm: CategoryFormData = {
  label: "",
  slug: "",
  description: "",
  imageUrl: "",
  priceFrom: "",
  priceLabel: "",
  journeyCount: "",
  sortOrder: 0,
  published: true,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading, isError } = useListTravelCategories();
  const createMutation = useCreateTravelCategory();
  const updateMutation = useUpdateTravelCategory();
  const deleteMutation = useDeleteTravelCategory();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TravelCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultForm);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<TravelCategory | null>(null);
  const [dependencyError, setDependencyError] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchSearch =
        cat.label.toLowerCase().includes(search.toLowerCase()) ||
        cat.slug.toLowerCase().includes(search.toLowerCase()) ||
        (cat.description || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
          ? cat.published
          : !cat.published;

      return matchSearch && matchStatus;
    });
  }, [categories, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      ...defaultForm,
      sortOrder: categories.length,
    });
    setIsSlugManuallyEdited(false);
    setValidationError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: TravelCategory) => {
    setEditingCategory(category);
    setFormData({
      label: category.label,
      slug: category.slug,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      priceFrom: category.priceFrom || "",
      priceLabel: category.priceLabel || "",
      journeyCount: category.journeyCount || "",
      sortOrder: category.sortOrder,
      published: category.published,
    });
    setIsSlugManuallyEdited(true);
    setValidationError(null);
    setDialogOpen(true);
  };

  const handleLabelChange = (newLabel: string) => {
    setFormData((prev) => ({
      ...prev,
      label: newLabel,
      slug: !isSlugManuallyEdited ? slugify(newLabel) : prev.slug,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.label.trim()) {
      setValidationError("Category label is required.");
      return;
    }
    if (!formData.slug.trim()) {
      setValidationError("Category slug is required.");
      return;
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data: {
            label: formData.label.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || undefined,
            imageUrl: formData.imageUrl.trim() || undefined,
            priceFrom: formData.priceFrom.trim() || undefined,
            priceLabel: formData.priceLabel.trim() || undefined,
            journeyCount: formData.journeyCount.trim() || undefined,
            sortOrder: Number(formData.sortOrder) || 0,
            published: formData.published,
          },
        });
        toast({
          title: "Category updated",
          description: `"${formData.label}" was successfully updated.`,
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            label: formData.label.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || undefined,
            imageUrl: formData.imageUrl.trim() || undefined,
            priceFrom: formData.priceFrom.trim() || undefined,
            priceLabel: formData.priceLabel.trim() || undefined,
            journeyCount: formData.journeyCount.trim() || undefined,
            sortOrder: Number(formData.sortOrder) || 0,
            published: formData.published,
          },
        });
        toast({
          title: "Category created",
          description: `"${formData.label}" was successfully added.`,
        });
      }
      qc.invalidateQueries({ queryKey: getListTravelCategoriesQueryKey() });
      setDialogOpen(false);
    } catch (err: any) {
      setValidationError(err.message || "Failed to save category. Please check required fields.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setDependencyError(null);

    try {
      await deleteMutation.mutateAsync({ id: deletingCategory.id });
      qc.invalidateQueries({ queryKey: getListTravelCategoriesQueryKey() });
      toast({
        title: "Category deleted",
        description: `"${deletingCategory.label}" was safely deleted.`,
      });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (err: any) {
      setDependencyError(err.message || "Could not delete category due to active dependencies.");
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground">
              Travel by Type
            </h1>
            <Badge variant="outline" className="text-xs">
              {categories.length} Categories
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage travel styles displayed in the homepage 3D coverflow and collection detail pages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreate} className="gap-2 cursor-pointer" data-testid="button-create-category">
            <Plus className="h-4 w-4" />
            Add Travel Category
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
            placeholder="Search categories by name, slug..."
            className="pl-9 h-9 text-xs"
            data-testid="input-search-categories"
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

      {/* Categories Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-24">Image</TableHead>
              <TableHead>Category Label</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Price Display</TableHead>
              <TableHead>Journeys</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="text-right w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-16 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No travel categories found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {search ? "Try refining your search terms" : "Click 'Add Travel Category' to create one"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/20" data-testid={`category-row-${category.id}`}>
                  <TableCell className="text-center text-xs text-muted-foreground font-mono">
                    {category.sortOrder}
                  </TableCell>
                  <TableCell>
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.label}
                        className="h-12 w-16 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-md bg-muted/40 border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                      <span>{category.label}</span>
                    </div>
                    {category.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-md mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    /collections/{category.slug}
                  </TableCell>
                  <TableCell className="text-xs">
                    {category.priceFrom ? (
                      <div>
                        <span className="font-medium text-foreground">{category.priceFrom}</span>
                        {category.priceLabel && (
                          <span className="text-muted-foreground text-[11px] block">{category.priceLabel}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {category.journeyCount || "—"}
                  </TableCell>
                  <TableCell>
                    {category.published ? (
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
                      <a
                        href={`/collections/${category.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View Public Page"
                        aria-label={`View public page for ${category.label}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => handleOpenEdit(category)}
                        data-testid={`button-edit-category-${category.id}`}
                        aria-label={`Edit ${category.label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => {
                          setDeletingCategory(category);
                          setDependencyError(null);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-category-${category.id}`}
                        aria-label={`Delete ${category.label}`}
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
              {editingCategory ? `Edit Category: ${editingCategory.label}` : "Create New Travel Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure category details for homepage 3D coverflow and collection routes.
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
                <Label htmlFor="category-label" className="text-xs font-medium">
                  Category Name / Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="category-label"
                  value={formData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="e.g. Honeymoon, Nature & Wildlife"
                  className="text-xs"
                  required
                  data-testid="input-category-label"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category-slug" className="text-xs font-medium">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSlugManuallyEdited(!isSlugManuallyEdited);
                      if (isSlugManuallyEdited) {
                        setFormData((p) => ({ ...p, slug: slugify(p.label) }));
                      }
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {isSlugManuallyEdited ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    {isSlugManuallyEdited ? "Auto-generate" : "Manual edit"}
                  </button>
                </div>
                <Input
                  id="category-slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setIsSlugManuallyEdited(true);
                    setFormData((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  placeholder="e.g. honeymoon, nature-wildlife"
                  className="text-xs font-mono"
                  required
                  data-testid="input-category-slug"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category-desc" className="text-xs font-medium">
                Short Description
              </Label>
              <Textarea
                id="category-desc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief editorial description shown in the coverflow..."
                rows={3}
                className="text-xs resize-none"
                data-testid="input-category-desc"
              />
            </div>

            {/* Image upload field using existing infrastructure */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category Hero / Coverflow Image</Label>
              <ImageUploadField
                value={formData.imageUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                label="Category Image"
                size="wide"
                helperText="High-resolution landscape image (1200×800 recommended for coverflow)."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category-price" className="text-xs font-medium">
                  Price From
                </Label>
                <Input
                  id="category-price"
                  value={formData.priceFrom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priceFrom: e.target.value }))}
                  placeholder="e.g. ₹6,99,000"
                  className="text-xs"
                  data-testid="input-category-price"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category-pricelabel" className="text-xs font-medium">
                  Price Context Label
                </Label>
                <Input
                  id="category-pricelabel"
                  value={formData.priceLabel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priceLabel: e.target.value }))}
                  placeholder="e.g. from / couple, from / night"
                  className="text-xs"
                  data-testid="input-category-pricelabel"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category-journeys" className="text-xs font-medium">
                  Journey Count
                </Label>
                <Input
                  id="category-journeys"
                  value={formData.journeyCount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, journeyCount: e.target.value }))}
                  placeholder="e.g. 12 journeys, 9 programmes"
                  className="text-xs"
                  data-testid="input-category-journeys"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="category-order" className="text-xs font-medium">
                  Display Order
                </Label>
                <Input
                  id="category-order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                  className="text-xs"
                  data-testid="input-category-order"
                />
                <p className="text-[11px] text-muted-foreground">Order in coverflow (0 = first)</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-6">
                <div>
                  <Label htmlFor="category-published" className="text-xs font-medium block">
                    Publication Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Make visible on public website</p>
                </div>
                <Switch
                  id="category-published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, published: checked }))}
                  data-testid="switch-category-published"
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
                data-testid="button-save-category"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving…"
                  : editingCategory
                  ? "Save Changes"
                  : "Create Category"}
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
              Delete Category &quot;{deletingCategory?.label}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action cannot be undone. If any packages depend on this category, the deletion will be safely blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {dependencyError && (
            <Alert variant="destructive" className="py-2.5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Deletion Blocked</AlertTitle>
              <AlertDescription className="text-xs">{dependencyError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingCategory(null);
                setDependencyError(null);
              }}
              className="text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
              data-testid="button-confirm-delete-category"
            >
              {deleteMutation.isPending ? "Checking & Deleting…" : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
