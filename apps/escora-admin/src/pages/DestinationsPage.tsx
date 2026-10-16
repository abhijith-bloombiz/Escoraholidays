import { useState, useMemo } from "react";
import {
  useListDestinations,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
  getListDestinationsQueryKey,
} from "@workspace/api-client-react";
import type { Destination } from "@workspace/api-client-react";
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
  Globe,
  Eye,
  Info,
  Search,
  X,
  Lock,
  Unlock,
  MapPin,
  Compass,
  FileText,
  Clock,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ListPlus,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

const STANDARD_CATEGORIES = [
  "Coastal",
  "Hills",
  "Backwaters",
  "Forest",
  "Heritage",
  "Wildlife",
  "Plantations",
];

const KERALA_DISTRICTS = [
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad",
];

interface DestinationFormData {
  name: string;
  slug: string;
  region: string;
  type: string;
  shortDesc: string;
  description: string;
  imageUrl: string;
  bestSeason: string;
  elevation: string;
  nightsMin: number | "";
  nightsMax: number | "";
  highlightsList: string[];
  howToReach: string;
  published: boolean;
}

const emptyForm: DestinationFormData = {
  name: "",
  slug: "",
  region: "",
  type: "",
  shortDesc: "",
  description: "",
  imageUrl: "",
  bestSeason: "",
  elevation: "",
  nightsMin: 2,
  nightsMax: 4,
  highlightsList: [],
  howToReach: "",
  published: false,
};

function parseHighlights(highlights?: string | null): string[] {
  if (!highlights) return [];
  try {
    const parsed = JSON.parse(highlights);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // fall through to newline-split
  }
  return highlights
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  // Dialog & Selection states
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [viewing, setViewing] = useState<Destination | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(null);

  // Form states
  const [form, setForm] = useState<DestinationFormData>(emptyForm);
  const [slugLocked, setSlugLocked] = useState(false);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [bulkHighlightsMode, setBulkHighlightsMode] = useState(false);
  const [bulkHighlightsText, setBulkHighlightsText] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  // Dynamic lists of unique categories and regions from database
  const categoriesList = useMemo(() => {
    const set = new Set<string>(STANDARD_CATEGORIES);
    destinations?.forEach((d) => {
      if (d.type) set.add(d.type);
    });
    return Array.from(set).sort();
  }, [destinations]);

  const regionsList = useMemo(() => {
    const set = new Set<string>(KERALA_DISTRICTS);
    destinations?.forEach((d) => {
      if (d.region) set.add(d.region);
    });
    return Array.from(set).sort();
  }, [destinations]);

  // Filtered & Sorted destinations
  const filteredDestinations = useMemo(() => {
    if (!destinations) return [];

    let result = [...destinations];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q) ||
          d.region.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          (d.shortDesc && d.shortDesc.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      result = result.filter((d) => d.type === filterCategory);
    }

    // Region filter
    if (filterRegion !== "all") {
      result = result.filter((d) => d.region === filterRegion);
    }

    // Status filter
    if (filterStatus !== "all") {
      const isPub = filterStatus === "published";
      result = result.filter((d) => d.published === isPub);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "region-asc") return a.region.localeCompare(b.region);
      if (sortBy === "status") return Number(b.published) - Number(a.published);
      return 0;
    });

    return result;
  }, [destinations, searchQuery, filterCategory, filterRegion, filterStatus, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterCategory !== "all" ||
    filterRegion !== "all" ||
    filterStatus !== "all";

  function resetFilters() {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterRegion("all");
    setFilterStatus("all");
    setSortBy("name-asc");
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSlugLocked(false);
    setIsSlugCustomized(false);
    setBulkHighlightsMode(false);
    setBulkHighlightsText("");
    setValidationErrors({});
    setOpen(true);
  }

  function openEdit(d: Destination) {
    setEditing(d);
    const parsedHighlights = parseHighlights(d.highlights);
    setForm({
      name: d.name,
      slug: d.slug,
      region: d.region,
      type: d.type,
      description: d.description ?? "",
      shortDesc: d.shortDesc ?? "",
      imageUrl: d.imageUrl ?? "",
      bestSeason: d.bestSeason ?? "",
      elevation: d.elevation ?? "",
      nightsMin: d.nightsMin ?? "",
      nightsMax: d.nightsMax ?? "",
      highlightsList: parsedHighlights,
      howToReach: d.howToReach ?? "",
      published: d.published,
    });
    setBulkHighlightsText(parsedHighlights.join("\n"));
    setBulkHighlightsMode(false);
    setSlugLocked(true); // Lock existing slugs by default to prevent breaking live URLs
    setIsSlugCustomized(true);
    setValidationErrors({});
    setOpen(true);
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListDestinationsQueryKey() });
  }

  // Name change automatically computes slug if not customized
  function handleNameChange(newName: string) {
    setForm((prev) => {
      const updated = { ...prev, name: newName };
      if (!editing && !isSlugCustomized) {
        updated.slug = slugify(newName);
      }
      return updated;
    });
    if (validationErrors.name) {
      setValidationErrors((v) => ({ ...v, name: "" }));
    }
  }

  // Explicit slug change
  function handleSlugChange(newSlug: string) {
    setIsSlugCustomized(true);
    const formatted = slugify(newSlug);
    setForm((prev) => ({ ...prev, slug: formatted }));
    if (validationErrors.slug) {
      setValidationErrors((v) => ({ ...v, slug: "" }));
    }
  }

  // Highlights management
  function addHighlight() {
    setForm((prev) => ({
      ...prev,
      highlightsList: [...prev.highlightsList, ""],
    }));
  }

  function updateHighlight(index: number, val: string) {
    setForm((prev) => {
      const next = [...prev.highlightsList];
      next[index] = val;
      return { ...prev, highlightsList: next };
    });
  }

  function removeHighlight(index: number) {
    setForm((prev) => ({
      ...prev,
      highlightsList: prev.highlightsList.filter((_, i) => i !== index),
    }));
  }

  function toggleBulkHighlights() {
    if (bulkHighlightsMode) {
      // Switching from bulk text to list
      const lines = bulkHighlightsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      setForm((prev) => ({ ...prev, highlightsList: lines }));
      setBulkHighlightsMode(false);
    } else {
      // Switching from list to bulk text
      setBulkHighlightsText(form.highlightsList.filter(Boolean).join("\n"));
      setBulkHighlightsMode(true);
    }
  }

  // Client validation
  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) {
      errs.name = "Destination Name is required.";
    }

    if (!form.slug.trim()) {
      errs.slug = "Page URL slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errs.slug = "Page URL must contain only lowercase letters, numbers, and hyphens.";
    } else {
      // Slug uniqueness check against other records
      const duplicate = destinations?.find(
        (d) =>
          d.slug.toLowerCase() === form.slug.toLowerCase() &&
          (!editing || d.id !== editing.id)
      );
      if (duplicate) {
        errs.slug = `The URL slug "${form.slug}" is already in use by "${duplicate.name}".`;
      }
    }

    if (!form.region.trim()) {
      errs.region = "District / Region is required.";
    }

    if (!form.type.trim()) {
      errs.type = "Destination Category is required.";
    }

    const minN = form.nightsMin === "" ? undefined : Number(form.nightsMin);
    const maxN = form.nightsMax === "" ? undefined : Number(form.nightsMax);

    if (minN !== undefined && minN < 0) {
      errs.nightsMin = "Minimum stay cannot be negative.";
    }
    if (maxN !== undefined && maxN < 0) {
      errs.nightsMax = "Maximum stay cannot be negative.";
    }
    if (minN !== undefined && maxN !== undefined && minN > maxN) {
      errs.nights = "Minimum stay (Nights) cannot exceed Maximum stay (Nights).";
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: "Please correct the form errors",
        description: Object.values(validationErrors)[0] || "Review highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    // Prepare highlights payload
    const finalHighlights = bulkHighlightsMode
      ? bulkHighlightsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : form.highlightsList.map((s) => s.trim()).filter(Boolean);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      region: form.region.trim(),
      type: form.type.trim(),
      shortDesc: form.shortDesc.trim() || undefined,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      bestSeason: form.bestSeason.trim() || undefined,
      elevation: form.elevation.trim() || undefined,
      nightsMin: form.nightsMin === "" ? undefined : Number(form.nightsMin),
      nightsMax: form.nightsMax === "" ? undefined : Number(form.nightsMax),
      highlights: finalHighlights.length > 0 ? JSON.stringify(finalHighlights) : undefined,
      howToReach: form.howToReach.trim() || undefined,
      published: form.published,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            invalidate();
            setOpen(false);
            toast({
              title: "Destination updated",
              description: `"${payload.name}" changes saved successfully.`,
            });
          },
          onError: (err: any) => {
            toast({
              title: "Failed to update destination",
              description: err.message || "Please check inputs and retry.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            invalidate();
            setOpen(false);
            toast({
              title: "Destination created",
              description: `"${payload.name}" added to Escora Destinations.`,
            });
          },
          onError: (err: any) => {
            toast({
              title: "Failed to create destination",
              description: err.message || "Please check inputs and retry.",
              variant: "destructive",
            });
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteTarget(null);
          toast({ title: "Destination deleted successfully" });
        },
        onError: () =>
          toast({ title: "Failed to delete destination", variant: "destructive" }),
      }
    );
  }

  return (
    <div data-testid="destinations-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Destinations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage Kerala travel regions, explore cards, and destination guides
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-destination" className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add Destination
        </Button>
      </div>

      {/* Integration & Public Usage Guide Banner */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-serif text-base font-medium">
          Destination Management &amp; Public Integration
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <p>
            Published destinations appear in the <strong>Explore Kerala</strong> gallery (
            <code className="text-foreground">/destinations</code>), individual travel guides (
            <code className="text-foreground">/destinations/:slug</code>), and trip planner (
            <code className="text-foreground">/plan</code>).
          </p>
          <p>
            Matching published records also dynamically update destination names, categories, descriptions, and cover images on the homepage <strong>3D Destination Explorer</strong> and <strong>360° Experience</strong>.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Note: 3D relief map geometry, district polygon highlights, and 360° equirectangular spherical panorama textures remain locally curated. Standard cover images are used for 2D cards and hero headers.
          </p>
        </AlertDescription>
      </Alert>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-4 rounded-lg border border-border">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, district, or keyword…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
            data-testid="input-search-destinations"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesList.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Region / District Filter */}
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {regionsList.map((reg) => (
                <SelectItem key={reg} value={reg}>
                  {reg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Publication Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Sorting */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z–A)</SelectItem>
              <SelectItem value="region-asc">District (A–Z)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Listing Table Summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <strong>{filteredDestinations.length}</strong> of{" "}
          <strong>{destinations?.length ?? 0}</strong> destinations
        </span>
      </div>

      {/* Table Container */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Cover</TableHead>
              <TableHead>Destination Name &amp; URL</TableHead>
              <TableHead>District / Region</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Best Time &amp; Stay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredDestinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  {hasActiveFilters ? (
                    <div className="space-y-2">
                      <p>No destinations match your search and filter criteria.</p>
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div>
                      No destinations yet. Click{" "}
                      <span className="font-medium text-foreground">Add Destination</span> to create
                      your first.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredDestinations.map((d) => (
                <TableRow key={d.id} data-testid={`row-destination-${d.id}`} className="group">
                  {/* Thumbnail */}
                  <TableCell className="py-2.5">
                    {d.imageUrl ? (
                      <div className="h-11 w-11 rounded-md overflow-hidden border border-border bg-muted/20 shrink-0">
                        <img
                          src={d.imageUrl}
                          alt={d.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-md border border-dashed border-border bg-muted/10 flex items-center justify-center text-muted-foreground/60 shrink-0">
                        <Compass className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>

                  {/* Name & URL */}
                  <TableCell className="py-2.5">
                    <div className="font-medium text-foreground text-sm">{d.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="text-[11px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                        /destinations/{d.slug}
                      </code>
                    </div>
                  </TableCell>

                  {/* District / Region */}
                  <TableCell className="py-2.5 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                      <span>{d.region}</span>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className="text-xs bg-muted/20 font-normal">
                      {d.type}
                    </Badge>
                  </TableCell>

                  {/* Best Time & Stay */}
                  <TableCell className="py-2.5 text-sm">
                    <div className="text-muted-foreground text-xs">{d.bestSeason || "—"}</div>
                    {(d.nightsMin || d.nightsMax) && (
                      <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {d.nightsMin && d.nightsMax
                          ? `${d.nightsMin}–${d.nightsMax} nights`
                          : d.nightsMin
                          ? `${d.nightsMin}N minimum`
                          : `${d.nightsMax}N maximum`}
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2.5">
                    <Badge
                      variant={d.published ? "default" : "secondary"}
                      className={`text-xs ${
                        d.published
                          ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {d.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewing(d)}
                        data-testid={`button-view-destination-${d.id}`}
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(d)}
                        data-testid={`button-edit-destination-${d.id}`}
                        title="Edit destination"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(d)}
                        data-testid={`button-delete-destination-${d.id}`}
                        title="Delete destination"
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

      {/* View Detail Dialog */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl">
              <Eye className="h-5 w-5 text-primary" />
              {viewing?.name}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 pt-1">
              {viewing.imageUrl && (
                <div className="w-full h-44 rounded-lg overflow-hidden border border-border bg-muted/20">
                  <img
                    src={viewing.imageUrl}
                    alt={viewing.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-b border-border pb-3">
                <Field label="Destination Name" value={viewing.name} />
                <Field label="Page URL" value={`/destinations/${viewing.slug}`} />
                <Field label="District / Region" value={viewing.region} />
                <Field label="Destination Category" value={viewing.type} />
              </div>

              <Field label="Short Introduction" value={viewing.shortDesc} />
              <Field label="Destination Overview" value={viewing.description} />

              <div className="grid grid-cols-3 gap-3 border-y border-border py-3">
                <Field label="Best Time to Visit" value={viewing.bestSeason} />
                <Field
                  label="Minimum Stay"
                  value={viewing.nightsMin ? `${viewing.nightsMin} Nights` : undefined}
                />
                <Field
                  label="Maximum Stay"
                  value={viewing.nightsMax ? `${viewing.nightsMax} Nights` : undefined}
                />
              </div>

              {viewing.elevation && <Field label="Elevation" value={viewing.elevation} />}

              {parseHighlights(viewing.highlights).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Top Attractions &amp; Experiences
                  </p>
                  <ul className="text-sm list-disc pl-4 space-y-1 text-foreground">
                    {parseHighlights(viewing.highlights).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Field label="How to Get There" value={viewing.howToReach} />

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Badge
                  variant={viewing.published ? "default" : "secondary"}
                  className={`text-xs ${
                    viewing.published
                      ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                      : ""
                  }`}
                >
                  {viewing.published ? "Published on Website" : "Draft (Unpublished)"}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  ID: {viewing.id} · Created: {new Date(viewing.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (viewing) {
                  const target = viewing;
                  setViewing(null);
                  openEdit(target);
                }
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Destination Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="font-serif text-2xl">
              {editing ? `Edit Destination — ${editing.name}` : "Add New Destination"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Section 1: Basic Information */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  1. Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Destination Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="dest-name" className="text-xs font-medium">
                    Destination Name *
                  </Label>
                  <Input
                    id="dest-name"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Munnar, Wayanad, Varkala"
                    required
                    data-testid="input-destination-name"
                    className={validationErrors.name ? "border-destructive" : ""}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-destructive">{validationErrors.name}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Displayed as the primary destination title in the public explorer, cards, and guide pages.
                  </p>
                </div>

                {/* Page URL / Slug */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dest-slug" className="text-xs font-medium">
                      Page URL *
                    </Label>
                    {editing && (
                      <button
                        type="button"
                        onClick={() => setSlugLocked((prev) => !prev)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        {slugLocked ? (
                          <>
                            <Lock className="h-3 w-3" /> Unlock URL
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3" /> Lock URL
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="dest-slug"
                      value={form.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="e.g. munnar, wayanad, fort-kochi"
                      required
                      disabled={slugLocked}
                      data-testid="input-destination-slug"
                      className={`font-mono text-xs ${
                        validationErrors.slug ? "border-destructive" : ""
                      } ${slugLocked ? "bg-muted/40 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  {validationErrors.slug && (
                    <p className="text-xs text-destructive">{validationErrors.slug}</p>
                  )}

                  {/* Live URL Preview */}
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/20 px-2 py-1 rounded border border-border/40">
                    <span className="font-mono text-muted-foreground/70">Public link:</span>
                    <span className="font-mono text-foreground truncate">
                      https://www.escoraholidays.com/destinations/{form.slug || "url-slug"}
                    </span>
                  </div>

                  {editing && !slugLocked && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        Caution: Changing the URL of an existing destination will change its live link and can break existing bookmarks.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* District / Region */}
                <div className="space-y-1.5">
                  <Label htmlFor="dest-region" className="text-xs font-medium">
                    District / Region *
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={regionsList.includes(form.region) ? form.region : "custom"}
                      onValueChange={(val) => {
                        if (val !== "custom") {
                          setForm((f) => ({ ...f, region: val }));
                          if (validationErrors.region) {
                            setValidationErrors((v) => ({ ...v, region: "" }));
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-[140px] text-xs">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionsList.map((dist) => (
                          <SelectItem key={dist} value={dist}>
                            {dist}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Other / Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="dest-region"
                      value={form.region}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, region: e.target.value }));
                        if (validationErrors.region) {
                          setValidationErrors((v) => ({ ...v, region: "" }));
                        }
                      }}
                      placeholder="e.g. Idukki, Alappuzha, Wayanad"
                      required
                      data-testid="input-destination-region"
                      className={`flex-1 ${validationErrors.region ? "border-destructive" : ""}`}
                    />
                  </div>
                  {validationErrors.region && (
                    <p className="text-xs text-destructive">{validationErrors.region}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    District or geographic region in Kerala. Used on map highlights and destination cards.
                  </p>
                </div>

                {/* Destination Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="dest-type" className="text-xs font-medium">
                    Destination Category *
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={categoriesList.includes(form.type) ? form.type : "custom"}
                      onValueChange={(val) => {
                        if (val !== "custom") {
                          setForm((f) => ({ ...f, type: val }));
                          if (validationErrors.type) {
                            setValidationErrors((v) => ({ ...v, type: "" }));
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-[140px] text-xs">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesList.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Other / Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="dest-type"
                      value={form.type}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, type: e.target.value }));
                        if (validationErrors.type) {
                          setValidationErrors((v) => ({ ...v, type: "" }));
                        }
                      }}
                      placeholder="e.g. Hills, Backwaters, Coastal"
                      required
                      data-testid="input-destination-type"
                      className={`flex-1 ${validationErrors.type ? "border-destructive" : ""}`}
                    />
                  </div>
                  {validationErrors.type && (
                    <p className="text-xs text-destructive">{validationErrors.type}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Filter tag used on the Explore Kerala gallery page (<code className="text-foreground">/destinations</code>).
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Cover Image */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  2. Cover Image
                </h3>
              </div>

              <div className="space-y-2">
                <ImageUploadField
                  value={form.imageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  label="Cover Image"
                  size="wide"
                  helperText="Main 2D photograph for destination cards, explorer thumbnails, and guide hero headers. (360° panoramas remain locally configured)."
                />
              </div>
            </div>

            {/* Section 3: Destination Details */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  3. Destination Details
                </h3>
              </div>

              {/* Short Introduction */}
              <div className="space-y-1.5">
                <Label htmlFor="dest-short" className="text-xs font-medium">
                  Short Introduction
                </Label>
                <Input
                  id="dest-short"
                  value={form.shortDesc}
                  onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
                  placeholder="e.g. Kerala's tea-clad highland capital — mist-draped peaks, colonial bungalows, and mountain treks."
                  data-testid="input-destination-short-desc"
                />
                <p className="text-[11px] text-muted-foreground">
                  Tagline shown on homepage 3D explorer card and as a subtitle on the destination guide page.
                </p>
              </div>

              {/* Destination Overview */}
              <div className="space-y-1.5">
                <Label htmlFor="dest-desc" className="text-xs font-medium">
                  Destination Overview
                </Label>
                <Textarea
                  id="dest-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Comprehensive narrative detailing the history, landscape, culture, and character of the destination…"
                  data-testid="textarea-destination-overview"
                />
                <p className="text-[11px] text-muted-foreground">
                  Rendered in the Overview narrative section of the public destination guide page.
                </p>
              </div>

              {/* Top Attractions & Experiences */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">
                      Top Attractions &amp; Experiences
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Key attractions and signature activities shown under &apos;Things to Do&apos; on the guide page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleBulkHighlights}
                      className="h-7 text-xs"
                    >
                      {bulkHighlightsMode ? "List View" : "Multiline Editor"}
                    </Button>
                    {!bulkHighlightsMode && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={addHighlight}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Attraction
                      </Button>
                    )}
                  </div>
                </div>

                {bulkHighlightsMode ? (
                  <Textarea
                    value={bulkHighlightsText}
                    onChange={(e) => setBulkHighlightsText(e.target.value)}
                    rows={6}
                    placeholder={"One attraction per line, e.g.\nEravikulam National Park — home to the endangered Nilgiri Tahr\nMattupetty Dam and boating amidst the high ranges\nTea Museum & Lockhart Tea Factory visit"}
                    className="text-xs font-mono"
                  />
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {form.highlightsList.length === 0 ? (
                      <div className="border border-dashed rounded-md p-4 text-center text-xs text-muted-foreground">
                        No attractions added yet. Click &quot;Add Attraction&quot; to build the list.
                      </div>
                    ) : (
                      form.highlightsList.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6 text-right font-mono">
                            {idx + 1}.
                          </span>
                          <Input
                            value={item}
                            onChange={(e) => updateHighlight(idx, e.target.value)}
                            placeholder="e.g. Eravikulam National Park — home to the Nilgiri Tahr"
                            className="text-xs h-8 flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeHighlight(idx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* How to Get There */}
              <div className="space-y-1.5">
                <Label htmlFor="dest-how-to-reach" className="text-xs font-medium">
                  How to Get There
                </Label>
                <Textarea
                  id="dest-how-to-reach"
                  value={form.howToReach}
                  onChange={(e) => setForm((f) => ({ ...f, howToReach: e.target.value }))}
                  rows={2}
                  placeholder="Nearest airport: Cochin International Airport (COK), approx. 110 km (about 3.5–4 hours by road). Nearest railway station: Aluva or Ernakulam."
                />
                <p className="text-[11px] text-muted-foreground">
                  Transport guidance card displayed on the public destination detail page.
                </p>
              </div>
            </div>

            {/* Section 4: Stay & Travel Information */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  4. Stay &amp; Travel Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Best Time to Visit */}
                <div className="space-y-1.5">
                  <Label htmlFor="dest-season" className="text-xs font-medium">
                    Best Time to Visit
                  </Label>
                  <Input
                    id="dest-season"
                    value={form.bestSeason}
                    onChange={(e) => setForm((f) => ({ ...f, bestSeason: e.target.value }))}
                    placeholder="e.g. September – March"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Season shown in Key Facts on the guide page.
                  </p>
                </div>

                {/* Minimum Stay */}
                <div className="space-y-1.5">
                  <Label htmlFor="dest-nights-min" className="text-xs font-medium">
                    Minimum Stay (Nights)
                  </Label>
                  <Input
                    id="dest-nights-min"
                    type="number"
                    min="0"
                    value={form.nightsMin}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        nightsMin: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className={
                      validationErrors.nights || validationErrors.nightsMin
                        ? "border-destructive"
                        : ""
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">Recommended minimum nights.</p>
                </div>

                {/* Maximum Stay */}
                <div className="space-y-1.5">
                  <Label htmlFor="dest-nights-max" className="text-xs font-medium">
                    Maximum Stay (Nights)
                  </Label>
                  <Input
                    id="dest-nights-max"
                    type="number"
                    min="0"
                    value={form.nightsMax}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        nightsMax: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className={
                      validationErrors.nights || validationErrors.nightsMax
                        ? "border-destructive"
                        : ""
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">Recommended maximum nights.</p>
                </div>
              </div>

              {validationErrors.nights && (
                <p className="text-xs text-destructive">{validationErrors.nights}</p>
              )}

              {/* Elevation */}
              <div className="space-y-1.5">
                <Label htmlFor="dest-elevation" className="text-xs font-medium">
                  Elevation (Optional)
                </Label>
                <Input
                  id="dest-elevation"
                  value={form.elevation}
                  onChange={(e) => setForm((f) => ({ ...f, elevation: e.target.value }))}
                  placeholder="e.g. 1,600 m (5,200 ft)"
                />
                <p className="text-[11px] text-muted-foreground">
                  Altitude above sea level for highland or mountain destinations.
                </p>
              </div>
            </div>

            {/* Section 5: Publishing */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  5. Publishing
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-muted/20 rounded-md border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <Label
                      htmlFor="dest-published"
                      className="font-medium text-sm cursor-pointer"
                    >
                      Publish on Website
                    </Label>
                    <Badge
                      variant={form.published ? "default" : "secondary"}
                      className={`text-xs ml-2 ${
                        form.published
                          ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : ""
                      }`}
                    >
                      {form.published ? "Active on Public Site" : "Draft (Hidden)"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Controls whether this destination appears in public directory listings, the trip planner, and homepage explorers.
                  </p>
                </div>

                <Switch
                  id="dest-published"
                  checked={form.published}
                  onCheckedChange={(val) => setForm((f) => ({ ...f, published: val }))}
                  data-testid="switch-destination-published"
                />
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <DialogFooter className="border-t border-border pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-destination"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving…"
                  : editing
                  ? "Save Changes"
                  : "Create Destination"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              Delete &quot;{deleteTarget?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground">{deleteTarget?.name}</strong> (
                <code className="text-foreground">/destinations/{deleteTarget?.slug}</code>)?
              </p>
              {deleteTarget && (
                <div className="bg-muted/40 p-2.5 rounded-md text-xs space-y-1 border border-border">
                  <div>
                    District: <strong>{deleteTarget.region}</strong> · Category:{" "}
                    <strong>{deleteTarget.type}</strong>
                  </div>
                  <div>
                    Status:{" "}
                    <span className="font-semibold">
                      {deleteTarget.published ? "Published (Live)" : "Draft"}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-destructive font-medium text-xs pt-1">
                This will permanently remove the destination from the database and public website listings. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-destination"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Destination"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
