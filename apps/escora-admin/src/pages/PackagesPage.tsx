import { useState, useMemo } from "react";
import {
  useListPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  getListPackagesQueryKey,
} from "@workspace/api-client-react";
import type { Package } from "@workspace/api-client-react";
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
  Star,
  Eye,
  Info,
  Search,
  X,
  Lock,
  Unlock,
  Clock,
  Compass,
  FileText,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Check,
  Layers,
  MapPin,
  Route as RouteIcon,
  IndianRupee,
  ExternalLink,
} from "lucide-react";

const STANDARD_CATEGORIES = [
  "Classic",
  "Honeymoon",
  "Family",
  "Wellness",
  "Culture",
  "Adventure",
  "Wildlife",
  "Culinary",
];

interface ItineraryDayItem {
  day: number;
  title: string;
  description: string;
}

interface PackageFormData {
  name: string;
  slug: string;
  category: string;
  durationNights: number | "";
  priceFrom: number | "";
  route: string;
  shortDesc: string;
  description: string;
  heroImageUrl: string;
  bestFor: string;
  season: string;
  featured: boolean;
  published: boolean;
}

const emptyForm: PackageFormData = {
  name: "",
  slug: "",
  category: "Classic",
  durationNights: 5,
  priceFrom: "",
  route: "",
  shortDesc: "",
  description: "",
  heroImageUrl: "",
  bestFor: "",
  season: "",
  featured: false,
  published: false,
};

function parseItinerary(raw?: string | null): ItineraryDayItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => ({
        day: typeof item.day === "number" ? item.day : idx + 1,
        title: item.title || "",
        description: item.description || "",
      }));
    }
  } catch {}
  return [];
}

function parseStringList(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return raw
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
      <p className="text-sm text-foreground">{String(value)}</p>
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

  // Dialog & Selection states
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [viewing, setViewing] = useState<Package | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  // Form states
  const [form, setForm] = useState<PackageFormData>(emptyForm);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDayItem[]>([]);
  const [inclusionsList, setInclusionsList] = useState<string[]>([]);
  const [exclusionsList, setExclusionsList] = useState<string[]>([]);

  // Toggles & modes
  const [slugLocked, setSlugLocked] = useState(false);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [itineraryBulkMode, setItineraryBulkMode] = useState(false);
  const [itineraryBulkText, setItineraryBulkText] = useState("");
  const [inclusionsBulkMode, setInclusionsBulkMode] = useState(false);
  const [inclusionsBulkText, setInclusionsBulkText] = useState("");
  const [exclusionsBulkMode, setExclusionsBulkMode] = useState(false);
  const [exclusionsBulkText, setExclusionsBulkText] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFeatured, setFilterFeatured] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  // Dynamic list of categories from database
  const categoriesList = useMemo(() => {
    const set = new Set<string>(STANDARD_CATEGORIES);
    packages?.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [packages]);

  // Filtered & Sorted packages
  const filteredPackages = useMemo(() => {
    if (!packages) return [];
    let result = [...packages];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.route && p.route.toLowerCase().includes(q)) ||
          (p.shortDesc && p.shortDesc.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== "all") {
      const isPub = filterStatus === "published";
      result = result.filter((p) => p.published === isPub);
    }

    // Featured filter
    if (filterFeatured !== "all") {
      const isFeat = filterFeatured === "featured";
      result = result.filter((p) => p.featured === isFeat);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "duration-asc") return a.durationNights - b.durationNights;
      if (sortBy === "duration-desc") return b.durationNights - a.durationNights;
      if (sortBy === "price-asc") return (a.priceFrom ?? 0) - (b.priceFrom ?? 0);
      if (sortBy === "price-desc") return (b.priceFrom ?? 0) - (a.priceFrom ?? 0);
      if (sortBy === "status") return Number(b.published) - Number(a.published);
      return 0;
    });

    return result;
  }, [packages, searchQuery, filterCategory, filterStatus, filterFeatured, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterCategory !== "all" ||
    filterStatus !== "all" ||
    filterFeatured !== "all";

  function resetFilters() {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterFeatured("all");
    setSortBy("name-asc");
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setItineraryDays([]);
    setInclusionsList([]);
    setExclusionsList([]);
    setSlugLocked(false);
    setIsSlugCustomized(false);
    setItineraryBulkMode(false);
    setInclusionsBulkMode(false);
    setExclusionsBulkMode(false);
    setValidationErrors({});
    setOpen(true);
  }

  function openEdit(p: Package) {
    setEditing(p);
    const parsedItinerary = parseItinerary(p.itinerary);
    const parsedInclusions = parseStringList(p.inclusions);
    const parsedExclusions = parseStringList(p.exclusions);

    setForm({
      name: p.name,
      slug: p.slug,
      category: p.category,
      durationNights: p.durationNights,
      priceFrom: p.priceFrom ?? "",
      route: p.route ?? "",
      shortDesc: p.shortDesc ?? "",
      description: p.description ?? "",
      heroImageUrl: p.heroImageUrl ?? "",
      bestFor: p.bestFor ?? "",
      season: p.season ?? "",
      featured: p.featured ?? false,
      published: p.published,
    });

    setItineraryDays(parsedItinerary);
    setInclusionsList(parsedInclusions);
    setExclusionsList(parsedExclusions);

    setSlugLocked(true); // Lock existing slugs by default
    setIsSlugCustomized(true);
    setItineraryBulkMode(false);
    setInclusionsBulkMode(false);
    setExclusionsBulkMode(false);
    setValidationErrors({});
    setOpen(true);
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListPackagesQueryKey() });
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

  // Itinerary day actions
  function addDay() {
    setItineraryDays((prev) => [
      ...prev,
      { day: prev.length + 1, title: "", description: "" },
    ]);
  }

  function updateDay(index: number, field: "title" | "description" | "day", value: any) {
    setItineraryDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeDay(index: number) {
    setItineraryDays((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((item, idx) => ({ ...item, day: idx + 1 }));
    });
  }

  function moveDay(index: number, direction: "up" | "down") {
    setItineraryDays((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy.map((d, idx) => ({ ...d, day: idx + 1 }));
    });
  }

  function toggleItineraryBulk() {
    if (itineraryBulkMode) {
      try {
        const parsed = JSON.parse(itineraryBulkText);
        if (Array.isArray(parsed)) {
          setItineraryDays(
            parsed.map((item, idx) => ({
              day: typeof item.day === "number" ? item.day : idx + 1,
              title: item.title || "",
              description: item.description || "",
            }))
          );
        }
      } catch {
        toast({
          title: "Invalid JSON format",
          description: "Could not parse JSON. Returning to list view without applying changes.",
          variant: "destructive",
        });
      }
      setItineraryBulkMode(false);
    } else {
      setItineraryBulkText(JSON.stringify(itineraryDays, null, 2));
      setItineraryBulkMode(true);
    }
  }

  // Inclusions actions
  function addInclusion() {
    setInclusionsList((prev) => [...prev, ""]);
  }

  function updateInclusion(index: number, value: string) {
    setInclusionsList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeInclusion(index: number) {
    setInclusionsList((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleInclusionsBulk() {
    if (inclusionsBulkMode) {
      const lines = inclusionsBulkText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      setInclusionsList(lines);
      setInclusionsBulkMode(false);
    } else {
      setInclusionsBulkText(inclusionsList.filter(Boolean).join("\n"));
      setInclusionsBulkMode(true);
    }
  }

  // Exclusions actions
  function addExclusion() {
    setExclusionsList((prev) => [...prev, ""]);
  }

  function updateExclusion(index: number, value: string) {
    setExclusionsList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeExclusion(index: number) {
    setExclusionsList((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleExclusionsBulk() {
    if (exclusionsBulkMode) {
      const lines = exclusionsBulkText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      setExclusionsList(lines);
      setExclusionsBulkMode(false);
    } else {
      setExclusionsBulkText(exclusionsList.filter(Boolean).join("\n"));
      setExclusionsBulkMode(true);
    }
  }

  // Validation
  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) {
      errs.name = "Journey Name is required.";
    }

    if (!form.slug.trim()) {
      errs.slug = "Page URL slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errs.slug = "Page URL must contain only lowercase letters, numbers, and hyphens.";
    } else {
      // Check slug uniqueness
      const duplicate = packages?.find(
        (p) =>
          p.slug.toLowerCase() === form.slug.toLowerCase() &&
          (!editing || p.id !== editing.id)
      );
      if (duplicate) {
        errs.slug = `The URL slug "${form.slug}" is already in use by "${duplicate.name}".`;
      }
    }

    if (!form.category.trim()) {
      errs.category = "Journey Category is required.";
    }

    const nights = Number(form.durationNights);
    if (!nights || nights < 1 || !Number.isInteger(nights)) {
      errs.durationNights = "Duration must be an integer of at least 1 night.";
    }

    if (form.priceFrom !== "" && Number(form.priceFrom) < 0) {
      errs.priceFrom = "Starting price cannot be negative.";
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

    // Process itinerary
    let finalItinerary = itineraryDays.filter((d) => d.title.trim() || d.description.trim());
    if (itineraryBulkMode) {
      try {
        const parsed = JSON.parse(itineraryBulkText);
        if (Array.isArray(parsed)) finalItinerary = parsed;
      } catch {}
    }

    // Process inclusions
    const finalInclusions = inclusionsBulkMode
      ? inclusionsBulkText.split("\n").map((s) => s.trim()).filter(Boolean)
      : inclusionsList.map((s) => s.trim()).filter(Boolean);

    // Process exclusions
    const finalExclusions = exclusionsBulkMode
      ? exclusionsBulkText.split("\n").map((s) => s.trim()).filter(Boolean)
      : exclusionsList.map((s) => s.trim()).filter(Boolean);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category.trim(),
      durationNights: Number(form.durationNights),
      priceFrom: form.priceFrom === "" ? undefined : Number(form.priceFrom),
      route: form.route.trim() || undefined,
      shortDesc: form.shortDesc.trim() || undefined,
      description: form.description.trim() || undefined,
      heroImageUrl: form.heroImageUrl.trim() || undefined,
      bestFor: form.bestFor.trim() || undefined,
      season: form.season.trim() || undefined,
      itinerary: finalItinerary.length > 0 ? JSON.stringify(finalItinerary) : undefined,
      inclusions: finalInclusions.length > 0 ? JSON.stringify(finalInclusions) : undefined,
      exclusions: finalExclusions.length > 0 ? JSON.stringify(finalExclusions) : undefined,
      featured: form.featured,
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
              title: "Journey updated",
              description: `"${payload.name}" changes saved successfully.`,
            });
          },
          onError: (err: any) => {
            toast({
              title: "Failed to update journey",
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
              title: "Journey created",
              description: `"${payload.name}" added to Escora Journeys.`,
            });
          },
          onError: (err: any) => {
            toast({
              title: "Failed to create journey",
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
          toast({ title: "Journey deleted successfully" });
        },
        onError: (err: any) => {
          const is409 =
            err.message?.includes("active order") || err.message?.includes("409");
          toast({
            title: is409 ? "Cannot Delete Journey" : "Failed to delete journey",
            description: is409
              ? "This journey is linked to active booking orders. Delete or reassign those orders before removing this journey."
              : err.message || "Server error occurred.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div data-testid="packages-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Journeys</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Curate private luxury itineraries, multi-day routes, and signature experiences
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-package" className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add Journey
        </Button>
      </div>

      {/* Integration & Public Usage Guide Banner */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-serif text-base font-medium">
          Journey Management &amp; Public Integration
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <p>
            Published journeys appear in the <strong>Immaculate Journeys</strong> directory (
            <code className="text-foreground">/journeys</code>) and dedicated detail pages (
            <code className="text-foreground">/journeys/:id</code>).
          </p>
          <p>
            Prospective guests can submit booking requests directly from any journey detail page, which flow directly into the <strong>Orders</strong> management queue.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Note on Homepage: The homepage currently presents curated travel categories rather than dynamic packages. The &quot;Featured&quot; toggle is stored in the database but does not change the live homepage layout.
          </p>
        </AlertDescription>
      </Alert>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-4 rounded-lg border border-border">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journeys by name, route, or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
            data-testid="input-search-packages"
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

          {/* Status Filter */}
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

          {/* Featured Filter */}
          <Select value={filterFeatured} onValueChange={setFilterFeatured}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Journeys</SelectItem>
              <SelectItem value="featured">Featured Only</SelectItem>
              <SelectItem value="standard">Standard Only</SelectItem>
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
              <SelectItem value="duration-asc">Duration (Low–High)</SelectItem>
              <SelectItem value="duration-desc">Duration (High–Low)</SelectItem>
              <SelectItem value="price-asc">Price (Low–High)</SelectItem>
              <SelectItem value="price-desc">Price (High–Low)</SelectItem>
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
          Showing <strong>{filteredPackages.length}</strong> of{" "}
          <strong>{packages?.length ?? 0}</strong> journeys
        </span>
      </div>

      {/* Table Container */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Hero</TableHead>
              <TableHead>Journey Name &amp; URL</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="min-w-[200px]">Travel Route</TableHead>
              <TableHead>Starting Price</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredPackages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                  {hasActiveFilters ? (
                    <div className="space-y-2">
                      <p>No journeys match your search and filter criteria.</p>
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div>
                      No journeys yet. Click{" "}
                      <span className="font-medium text-foreground">Add Journey</span> to create
                      your first itinerary.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredPackages.map((p) => (
                <TableRow key={p.id} data-testid={`row-package-${p.id}`} className="group">
                  {/* Thumbnail */}
                  <TableCell className="py-2.5">
                    {p.heroImageUrl ? (
                      <div className="h-11 w-11 rounded-md overflow-hidden border border-border bg-muted/20 shrink-0">
                        <img
                          src={p.heroImageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-md border border-dashed border-border bg-muted/10 flex items-center justify-center text-muted-foreground/60 shrink-0">
                        <Compass className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>

                  {/* Name & Slug */}
                  <TableCell className="py-2.5">
                    <div className="font-medium text-foreground text-sm">{p.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="text-[11px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                        /journeys/{p.slug}
                      </code>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className="text-xs bg-muted/20 font-normal">
                      {p.category}
                    </Badge>
                  </TableCell>

                  {/* Duration */}
                  <TableCell className="py-2.5 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                      <span>{p.durationNights} Nights</span>
                    </div>
                  </TableCell>

                  {/* Travel Route (Readable wrapping display) */}
                  <TableCell className="py-2.5 text-sm max-w-xs">
                    {p.route ? (
                      <div className="text-xs text-foreground/90 font-medium leading-relaxed">
                        {p.route}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">—</span>
                    )}
                  </TableCell>

                  {/* Starting Price */}
                  <TableCell className="py-2.5 text-sm font-medium whitespace-nowrap">
                    {p.priceFrom ? (
                      <span>₹{p.priceFrom.toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-normal">Upon Request</span>
                    )}
                  </TableCell>

                  {/* Featured */}
                  <TableCell className="py-2.5">
                    {p.featured ? (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      >
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2.5">
                    <Badge
                      variant={p.published ? "default" : "secondary"}
                      className={`text-xs ${
                        p.published
                          ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {p.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewing(p)}
                        data-testid={`button-view-package-${p.id}`}
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(p)}
                        data-testid={`button-edit-package-${p.id}`}
                        title="Edit journey"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(p)}
                        data-testid={`button-delete-package-${p.id}`}
                        title="Delete journey"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl">
              <Eye className="h-5 w-5 text-primary" />
              {viewing?.name}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 pt-1">
              {viewing.heroImageUrl && (
                <div className="w-full h-44 rounded-lg overflow-hidden border border-border bg-muted/20">
                  <img
                    src={viewing.heroImageUrl}
                    alt={viewing.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-b border-border pb-3">
                <Field label="Journey Name" value={viewing.name} />
                <Field label="Page URL" value={`/journeys/${viewing.slug}`} />
                <Field label="Journey Category" value={viewing.category} />
                <Field label="Duration" value={`${viewing.durationNights} Nights`} />
              </div>

              <Field label="Travel Route" value={viewing.route} />

              <div className="grid grid-cols-3 gap-3 border-y border-border py-3">
                <Field
                  label="Starting Price"
                  value={
                    viewing.priceFrom
                      ? `₹${viewing.priceFrom.toLocaleString("en-IN")}`
                      : "Upon Request"
                  }
                />
                <Field label="Ideal For" value={viewing.bestFor} />
                <Field label="Best Time to Visit" value={viewing.season} />
              </div>

              <Field label="Short Introduction" value={viewing.shortDesc} />
              <Field label="Journey Overview" value={viewing.description} />

              {/* Itinerary Preview */}
              {parseItinerary(viewing.itinerary).length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Day-by-Day Itinerary ({parseItinerary(viewing.itinerary).length} Days)
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {parseItinerary(viewing.itinerary).map((d, i) => (
                      <div key={i} className="p-2.5 rounded bg-muted/20 border border-border text-xs space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="text-primary font-mono">Day {d.day}:</span> {d.title}
                        </div>
                        {d.description && (
                          <p className="text-muted-foreground leading-relaxed">{d.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {(parseStringList(viewing.inclusions).length > 0 ||
                parseStringList(viewing.exclusions).length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-3">
                  {parseStringList(viewing.inclusions).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Inclusions
                      </p>
                      <ul className="text-xs space-y-1 text-foreground">
                        {parseStringList(viewing.inclusions).map((inc, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span> {inc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {parseStringList(viewing.exclusions).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Exclusions
                      </p>
                      <ul className="text-xs space-y-1 text-foreground">
                        {parseStringList(viewing.exclusions).map((exc, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-muted-foreground">✕</span> {exc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  {viewing.featured && (
                    <Badge
                      variant="outline"
                      className="text-xs gap-1 border-amber-500/40 text-amber-600 bg-amber-500/10"
                    >
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
                    </Badge>
                  )}
                  <Badge
                    variant={viewing.published ? "default" : "secondary"}
                    className={`text-xs ${
                      viewing.published
                        ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        : ""
                    }`}
                  >
                    {viewing.published ? "Published on Website" : "Draft (Hidden)"}
                  </Badge>
                </div>
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
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Journey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Journey Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="font-serif text-2xl">
              {editing ? `Edit Journey — ${editing.name}` : "Add New Journey"}
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
                {/* Journey Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-name" className="text-xs font-medium">
                    Journey Name *
                  </Label>
                  <Input
                    id="pkg-name"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. The Malabar Escape"
                    required
                    data-testid="input-package-name"
                    className={validationErrors.name ? "border-destructive" : ""}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-destructive">{validationErrors.name}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Title displayed on /journeys cards and /journeys/:id headers.
                  </p>
                </div>

                {/* Page URL / Slug */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pkg-slug" className="text-xs font-medium">
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
                      id="pkg-slug"
                      value={form.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="e.g. malabar-escape"
                      required
                      disabled={slugLocked}
                      data-testid="input-package-slug"
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
                      https://www.escoraholidays.com/journeys/{form.slug || "url-slug"}
                    </span>
                  </div>

                  {editing && !slugLocked && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        Caution: Changing this URL will change the live public link and may break external bookmarks.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Journey Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-category" className="text-xs font-medium">
                    Journey Category *
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => {
                      setForm((f) => ({ ...f, category: val }));
                      if (validationErrors.category) {
                        setValidationErrors((v) => ({ ...v, category: "" }));
                      }
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p className="text-xs text-destructive">{validationErrors.category}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Filter category badge on /journeys.
                  </p>
                </div>

                {/* Duration (Nights) */}
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-duration" className="text-xs font-medium">
                    Duration (Nights) *
                  </Label>
                  <Input
                    id="pkg-duration"
                    type="number"
                    min="1"
                    value={form.durationNights}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        durationNights: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    required
                    className={validationErrors.durationNights ? "border-destructive" : ""}
                  />
                  {validationErrors.durationNights && (
                    <p className="text-xs text-destructive">{validationErrors.durationNights}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Total nights of the itinerary.
                  </p>
                </div>

                {/* Travel Route */}
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-route" className="text-xs font-medium">
                    Travel Route
                  </Label>
                  <Input
                    id="pkg-route"
                    value={form.route}
                    onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}
                    placeholder="e.g. Kochi · Munnar · Alleppey"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Sequence of destinations shown on cards and matched by filters.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Images & Description */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  2. Images &amp; Description
                </h3>
              </div>

              {/* Hero Image */}
              <div className="space-y-2">
                <ImageUploadField
                  value={form.heroImageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, heroImageUrl: url }))}
                  label="Hero Image"
                  size="wide"
                  helperText="Primary photograph for the journey header on /journeys/:id and catalog cards on /journeys."
                />
              </div>

              {/* Short Introduction */}
              <div className="space-y-1.5">
                <Label htmlFor="pkg-short" className="text-xs font-medium">
                  Short Introduction
                </Label>
                <Input
                  id="pkg-short"
                  value={form.shortDesc}
                  onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
                  placeholder="e.g. A private five-night journey through Kerala's most iconic backwaters and highland estates."
                />
                <p className="text-[11px] text-muted-foreground">
                  Two-line overview shown on /journeys cards and search summaries.
                </p>
              </div>

              {/* Journey Overview */}
              <div className="space-y-1.5">
                <Label htmlFor="pkg-desc" className="text-xs font-medium">
                  Journey Overview
                </Label>
                <Textarea
                  id="pkg-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Detailed narrative describing the journey theme, experience, and atmosphere…"
                />
                <p className="text-[11px] text-muted-foreground">
                  Rendered under &apos;The Experience&apos; narrative on the journey detail page.
                </p>
              </div>
            </div>

            {/* Section 3: Day-by-Day Itinerary (Structured Builder) */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                    3. Day-by-Day Itinerary
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleItineraryBulk}
                    className="h-7 text-xs"
                  >
                    {itineraryBulkMode ? "Visual Day Cards" : "JSON / Raw Editor"}
                  </Button>
                  {!itineraryBulkMode && (
                    <Button type="button" size="sm" onClick={addDay} className="h-7 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Day
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground -mt-1">
                Rendered as the interactive &apos;Journey Unfolds&apos; timeline schedule on /journeys/:id.
              </p>

              {itineraryBulkMode ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={itineraryBulkText}
                    onChange={(e) => setItineraryBulkText(e.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                    placeholder='[{"day":1,"title":"Arrival in Kochi","description":"..."}]'
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Edit raw JSON array of day objects. Click &quot;Visual Day Cards&quot; to apply.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itineraryDays.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-6 text-center text-xs text-muted-foreground space-y-2">
                      <p>No itinerary days added yet.</p>
                      <Button type="button" variant="outline" size="sm" onClick={addDay}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Start Day 1
                      </Button>
                    </div>
                  ) : (
                    itineraryDays.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border bg-card p-3.5 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono bg-primary/5 border-primary/30 text-primary">
                              Day {item.day}
                            </Badge>
                            <span className="text-xs font-medium text-foreground truncate max-w-xs sm:max-w-md">
                              {item.title || "Untitled Day"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              disabled={idx === 0}
                              onClick={() => moveDay(idx, "up")}
                              title="Move Day Up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              disabled={idx === itineraryDays.length - 1}
                              onClick={() => moveDay(idx, "down")}
                              title="Move Day Down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive ml-1"
                              onClick={() => removeDay(idx)}
                              title="Remove Day"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Day Number</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.day}
                              onChange={(e) =>
                                updateDay(idx, "day", Number(e.target.value) || idx + 1)
                              }
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Day Title *</Label>
                            <Input
                              value={item.title}
                              onChange={(e) => updateDay(idx, "title", e.target.value)}
                              placeholder="e.g. Arrival in Fort Kochi & Sunset Harbor Cruise"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Day Description</Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => updateDay(idx, "description", e.target.value)}
                            rows={2}
                            placeholder="Detail experiences, visits, accommodations, and pace of the day…"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ))
                  )}

                  {itineraryDays.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDay}
                      className="w-full text-xs border-dashed"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Day {itineraryDays.length + 1}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Section 4: Inclusions & Exclusions */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  4. Inclusions &amp; Exclusions
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inclusions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Inclusions
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Services, stays, and items covered.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleInclusionsBulk}
                        className="h-6 text-[11px]"
                      >
                        {inclusionsBulkMode ? "List" : "Paste"}
                      </Button>
                      {!inclusionsBulkMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addInclusion}
                          className="h-6 text-[11px]"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>

                  {inclusionsBulkMode ? (
                    <Textarea
                      value={inclusionsBulkText}
                      onChange={(e) => setInclusionsBulkText(e.target.value)}
                      rows={6}
                      placeholder={"Airport chauffeur transfers\nDaily curated breakfast\nHouseboat private cruise"}
                      className="text-xs font-mono"
                    />
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {inclusionsList.length === 0 ? (
                        <div className="border border-dashed rounded-md p-3 text-center text-xs text-muted-foreground">
                          No inclusions added yet.
                        </div>
                      ) : (
                        inclusionsList.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-emerald-600 font-bold text-xs shrink-0">✓</span>
                            <Input
                              value={item}
                              onChange={(e) => updateInclusion(idx, e.target.value)}
                              placeholder="e.g. All private airport & inter-city transfers"
                              className="text-xs h-8 flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => removeInclusion(idx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Exclusions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Exclusions
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Items not covered in package.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleExclusionsBulk}
                        className="h-6 text-[11px]"
                      >
                        {exclusionsBulkMode ? "List" : "Paste"}
                      </Button>
                      {!exclusionsBulkMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addExclusion}
                          className="h-6 text-[11px]"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>

                  {exclusionsBulkMode ? (
                    <Textarea
                      value={exclusionsBulkText}
                      onChange={(e) => setExclusionsBulkText(e.target.value)}
                      rows={6}
                      placeholder={"International & domestic flights\nPersonal gratuities\nTravel insurance"}
                      className="text-xs font-mono"
                    />
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {exclusionsList.length === 0 ? (
                        <div className="border border-dashed rounded-md p-3 text-center text-xs text-muted-foreground">
                          No exclusions added yet.
                        </div>
                      ) : (
                        exclusionsList.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs shrink-0">✕</span>
                            <Input
                              value={item}
                              onChange={(e) => updateExclusion(idx, e.target.value)}
                              placeholder="e.g. International and domestic flights"
                              className="text-xs h-8 flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => removeExclusion(idx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Travel Details & Publishing */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-serif text-base font-semibold tracking-wide text-foreground">
                  5. Travel Details &amp; Publishing
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Starting Price */}
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-price" className="text-xs font-medium">
                    Starting Price (₹)
                  </Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    min="0"
                    value={form.priceFrom}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        priceFrom: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    placeholder="e.g. 150000"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Internal benchmark price in INR. (Stored in database; not rendered in public layout).
                  </p>
                </div>

                {/* Ideal For */}
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-best-for" className="text-xs font-medium">
                    Ideal For
                  </Label>
                  <Input
                    id="pkg-best-for"
                    value={form.bestFor}
                    onChange={(e) => setForm((f) => ({ ...f, bestFor: e.target.value }))}
                    placeholder="e.g. Couples, Honeymooners, Slow Travellers"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Target traveller profile (stored in database).
                  </p>
                </div>

                {/* Best Time to Visit */}
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-season" className="text-xs font-medium">
                    Best Time to Visit
                  </Label>
                  <Input
                    id="pkg-season"
                    value={form.season}
                    onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                    placeholder="e.g. September – April"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Best season tag rendered in the trip facts bar on /journeys/:id.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Featured Switch */}
                <div className="flex items-start justify-between p-3.5 bg-muted/20 rounded-md border border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <Label
                        htmlFor="pkg-featured"
                        className="font-medium text-sm cursor-pointer"
                      >
                        Featured Journey
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Stored in database. (Note: Public homepage currently features travel categories rather than dynamic packages).
                    </p>
                  </div>
                  <Switch
                    id="pkg-featured"
                    checked={form.featured}
                    onCheckedChange={(val) => setForm((f) => ({ ...f, featured: val }))}
                    data-testid="switch-package-featured"
                  />
                </div>

                {/* Publish Switch */}
                <div className="flex items-start justify-between p-3.5 bg-muted/20 rounded-md border border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <Label
                        htmlFor="pkg-published"
                        className="font-medium text-sm cursor-pointer"
                      >
                        Publish on Website
                      </Label>
                      <Badge
                        variant={form.published ? "default" : "secondary"}
                        className={`text-xs ml-1 ${
                          form.published
                            ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : ""
                        }`}
                      >
                        {form.published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      When published, visible on /journeys. When off, direct unauthenticated access returns 404.
                    </p>
                  </div>
                  <Switch
                    id="pkg-published"
                    checked={form.published}
                    onCheckedChange={(val) => setForm((f) => ({ ...f, published: val }))}
                    data-testid="switch-package-published"
                  />
                </div>
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
                data-testid="button-submit-package"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving…"
                  : editing
                  ? "Save Changes"
                  : "Create Journey"}
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
                <code className="text-foreground">/journeys/{deleteTarget?.slug}</code>)?
              </p>
              {deleteTarget && (
                <div className="bg-muted/40 p-2.5 rounded-md text-xs space-y-1 border border-border">
                  <div>
                    Category: <strong>{deleteTarget.category}</strong> · Duration:{" "}
                    <strong>{deleteTarget.durationNights} Nights</strong>
                  </div>
                  {deleteTarget.route && (
                    <div>
                      Route: <strong>{deleteTarget.route}</strong>
                    </div>
                  )}
                  <div>
                    Status:{" "}
                    <span className="font-semibold">
                      {deleteTarget.published ? "Published (Live)" : "Draft"}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-destructive font-medium text-xs pt-1">
                This will permanently remove the journey from the database and public website. If referenced by active booking orders, deletion will be blocked to protect relational integrity.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-package"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Journey"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
