import { useState, useMemo, useRef } from "react";
import {
  useListExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
  getListExperiencesQueryKey,
} from "@workspace/api-client-react";
import type { Experience, ExperienceInput, ExperienceDestination } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  X,
  Compass,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Image as ImageIcon,
  Flame,
  Activity,
  HeartHandshake,
  Coffee,
  Waves,
  Feather,
  Video,
  Upload,
  Play,
  Loader2,
} from "lucide-react";

export const PRESET_CATEGORIES = [
  "Waterways & Houseboats",
  "Tea & Highlands",
  "Wilderness & Wildlife",
  "Heritage & Sacred Arts",
  "Wellness & Ayurveda",
];

export const INTENSITY_LEVELS = [
  "Gentle & Relaxed",
  "Moderate Activity",
  "Active Exploration",
];

export const COMMON_DESTINATIONS = [
  { name: "Alleppey & Vembanad", slug: "alleppey" },
  { name: "Kumarakom", slug: "kumarakom" },
  { name: "Munnar", slug: "munnar" },
  { name: "Wayanad", slug: "wayanad" },
  { name: "Thekkady & Periyar", slug: "thekkady" },
  { name: "Fort Kochi", slug: "fort-kochi" },
  { name: "Varkala", slug: "varkala" },
  { name: "Kovalam", slug: "kovalam" },
  { name: "Kannur", slug: "kannur" },
  { name: "Bekal", slug: "bekal" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ExperienceFormData {
  title: string;
  slug: string;
  category: string;
  tagline: string;
  duration: string;
  intensity: string;
  bestTime: string;
  vibe: string;
  heroImage: string;
  gallery: string[];
  story: string;
  highlights: string[];
  inclusions: string[];
  destinations: ExperienceDestination[];
  conciergeTip: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  isHomeSpotlight: boolean;
  spotlightSlot: number | null;
  spotlightVideoUrl: string;
  spotlightTitle: string;
  spotlightDescription: string;
}

const DEFAULT_FORM: ExperienceFormData = {
  title: "",
  slug: "",
  category: "Waterways & Houseboats",
  tagline: "",
  duration: "4 Hours",
  intensity: "Gentle & Relaxed",
  bestTime: "October – March",
  vibe: "Romantic & Unhurried",
  heroImage: "",
  gallery: [],
  story: "",
  highlights: [""],
  inclusions: [""],
  destinations: [],
  conciergeTip: "",
  featured: true,
  published: true,
  sortOrder: 0,
  isHomeSpotlight: false,
  spotlightSlot: null,
  spotlightVideoUrl: "",
  spotlightTitle: "",
  spotlightDescription: "",
};

export default function ExperiencesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [spotlightFilter, setSpotlightFilter] = useState("all");

  const [openModal, setOpenModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [formData, setFormData] = useState<ExperienceFormData>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState<"overview" | "logistics" | "media" | "highlights" | "settings">("overview");
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [uploadingSpotlightVideo, setUploadingSpotlightVideo] = useState(false);
  const spotlightVideoInputRef = useRef<HTMLInputElement>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<Experience | null>(null);

  // Queries & Mutations
  const { data: experiences = [], isLoading } = useListExperiences();
  const createMutation = useCreateExperience();
  const updateMutation = useUpdateExperience();
  const deleteMutation = useDeleteExperience();

  function invalidateCache() {
    qc.invalidateQueries({ queryKey: getListExperiencesQueryKey() });
  }

  // Filtered Experiences
  const filteredExperiences = useMemo(() => {
    const list = (experiences as Experience[]).filter((exp: Experience) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exp.title.toLowerCase().includes(q) ||
        exp.slug.toLowerCase().includes(q) ||
        (exp.tagline && exp.tagline.toLowerCase().includes(q)) ||
        exp.category.toLowerCase().includes(q) ||
        (exp.destinations && exp.destinations.some((d) => d.name.toLowerCase().includes(q)));

      const matchesCat = categoryFilter === "all" || exp.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && exp.published) ||
        (statusFilter === "draft" && !exp.published);
      const matchesSpotlight =
        spotlightFilter === "all" ||
        (spotlightFilter === "spotlight" && exp.isHomeSpotlight) ||
        (spotlightFilter === "standard" && !exp.isHomeSpotlight);

      return matchesSearch && matchesCat && matchesStatus && matchesSpotlight;
    });

    if (spotlightFilter === "spotlight") {
      return [...list].sort((a, b) => (a.spotlightSlot || 99) - (b.spotlightSlot || 99));
    }
    return list;
  }, [experiences, search, categoryFilter, statusFilter, spotlightFilter]);

  function handleOpenCreate() {
    setEditingExperience(null);
    setFormData({
      ...DEFAULT_FORM,
      sortOrder: experiences.length + 1,
      isHomeSpotlight: false,
      spotlightSlot: null,
      spotlightVideoUrl: "",
      spotlightTitle: "",
      spotlightDescription: "",
    });
    setSlugLocked(false);
    setActiveTab("overview");
    setOpenModal(true);
  }

  function handleOpenEdit(exp: Experience) {
    setEditingExperience(exp);
    setFormData({
      title: exp.title,
      slug: exp.slug,
      category: exp.category,
      tagline: exp.tagline ?? "",
      duration: exp.duration ?? "",
      intensity: exp.intensity ?? "Gentle & Relaxed",
      bestTime: exp.bestTime ?? "",
      vibe: exp.vibe ?? "",
      heroImage: exp.heroImage ?? "",
      gallery: Array.isArray(exp.gallery) ? exp.gallery : [],
      story: exp.story ?? "",
      highlights: Array.isArray(exp.highlights) && exp.highlights.length > 0 ? exp.highlights : [""],
      inclusions: Array.isArray(exp.inclusions) && exp.inclusions.length > 0 ? exp.inclusions : [""],
      destinations: Array.isArray(exp.destinations) ? exp.destinations : [],
      conciergeTip: exp.conciergeTip ?? "",
      featured: exp.featured ?? true,
      published: exp.published ?? true,
      sortOrder: exp.sortOrder ?? 0,
      isHomeSpotlight: Boolean(exp.isHomeSpotlight),
      spotlightSlot: exp.spotlightSlot ?? null,
      spotlightVideoUrl: exp.spotlightVideoUrl ?? "",
      spotlightTitle: exp.spotlightTitle ?? "",
      spotlightDescription: exp.spotlightDescription ?? "",
    });
    setSlugLocked(true);
    setActiveTab("overview");
    setOpenModal(true);
  }

  function handleTitleChange(val: string) {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: slugLocked || editingExperience ? prev.slug : slugify(val),
    }));
  }

  function handleToggleSpotlight(checked: boolean) {
    if (checked) {
      const otherSpotlights = experiences.filter(
        (e) => e.isHomeSpotlight && e.id !== editingExperience?.id
      );
      if (otherSpotlights.length >= 4) {
        toast({
          title: "Spotlight Limit Reached (Max 4)",
          description:
            "Only 4 experiences can be active in the homepage spotlight at a time. Please disable spotlight on another experience first.",
          variant: "destructive",
        });
        return;
      }

      const usedSlots = new Set(otherSpotlights.map((e) => e.spotlightSlot));
      let nextSlot = formData.spotlightSlot;
      if (!nextSlot || usedSlots.has(nextSlot)) {
        nextSlot = [1, 2, 3, 4].find((s) => !usedSlots.has(s)) || 1;
      }

      setFormData((p) => ({
        ...p,
        isHomeSpotlight: true,
        spotlightSlot: nextSlot,
        spotlightTitle: p.spotlightTitle || p.title,
        spotlightDescription: p.spotlightDescription || p.tagline,
        spotlightVideoUrl: p.spotlightVideoUrl || "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
      }));
    } else {
      setFormData((p) => ({
        ...p,
        isHomeSpotlight: false,
        spotlightSlot: null,
      }));
    }
  }

  async function handleSpotlightVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|ogg)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an MP4, WebM, or MOV video file.",
        variant: "destructive",
      });
      return;
    }

    setUploadingSpotlightVideo(true);
    try {
      const resp = await fetch("/api/media/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": file.type || "application/octet-stream",
          "x-filename": encodeURIComponent(file.name),
        },
        body: file,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed with status ${resp.status}`);
      }

      const resData = await resp.json();
      setFormData((prev) => ({
        ...prev,
        spotlightVideoUrl: resData.url,
      }));
      toast({
        title: "Video Uploaded",
        description: `"${file.name}" uploaded successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Video Upload Failed",
        description: err.message || "Failed to upload video to server.",
        variant: "destructive",
      });
    } finally {
      setUploadingSpotlightVideo(false);
      if (spotlightVideoInputRef.current) spotlightVideoInputRef.current.value = "";
    }
  }

  async function handleTogglePublish(exp: Experience, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await updateMutation.mutateAsync({
        id: exp.id,
        data: { published: !exp.published },
      });
      invalidateCache();
      toast({
        title: exp.published ? "Unpublished" : "Published",
        description: `Experience is now ${exp.published ? "saved as Draft" : "Live"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update publication status",
        variant: "destructive",
      });
    }
  }

  async function handleQuickSlotChange(exp: Experience, newSlot: number) {
    try {
      await updateMutation.mutateAsync({
        id: exp.id,
        data: { spotlightSlot: newSlot, isHomeSpotlight: true },
      });
      invalidateCache();
      toast({
        title: "Spotlight Order Updated",
        description: `"${exp.title}" moved to Slot #${newSlot}. Any conflicting slot has been swapped automatically.`,
      });
    } catch (err: any) {
      toast({
        title: "Error updating order",
        description: err?.message || "Failed to update spotlight slot.",
        variant: "destructive",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Validation Error", description: "Experience title is required", variant: "destructive" });
      return;
    }
    if (!formData.slug.trim()) {
      toast({ title: "Validation Error", description: "Experience slug is required", variant: "destructive" });
      return;
    }
    if (!formData.category.trim()) {
      toast({ title: "Validation Error", description: "Category is required", variant: "destructive" });
      return;
    }

    if (formData.isHomeSpotlight) {
      const otherSpotlights = experiences.filter(
        (e) => e.isHomeSpotlight && e.id !== editingExperience?.id
      );
      if (otherSpotlights.length >= 4) {
        toast({
          title: "Spotlight Limit Reached (Max 4)",
          description:
            "Only 4 experiences can be active in the homepage spotlight. Please disable spotlight on another experience first.",
          variant: "destructive",
        });
        return;
      }
    }

    const payload: ExperienceInput = {
      title: formData.title.trim(),
      slug: slugify(formData.slug),
      category: formData.category.trim(),
      tagline: formData.tagline.trim() || undefined,
      duration: formData.duration.trim() || undefined,
      intensity: formData.intensity.trim() || undefined,
      bestTime: formData.bestTime.trim() || undefined,
      vibe: formData.vibe.trim() || undefined,
      heroImage: formData.heroImage.trim() || undefined,
      gallery: formData.gallery.filter((g) => g.trim() !== ""),
      story: formData.story.trim() || undefined,
      highlights: formData.highlights.filter((h) => h.trim() !== ""),
      inclusions: formData.inclusions.filter((i) => i.trim() !== ""),
      destinations: formData.destinations,
      conciergeTip: formData.conciergeTip.trim() || undefined,
      featured: true,
      published: formData.published,
      sortOrder: Number(formData.sortOrder) || 0,
      isHomeSpotlight: formData.isHomeSpotlight,
      spotlightSlot: formData.isHomeSpotlight ? (Number(formData.spotlightSlot) || 1) : null,
      spotlightVideoUrl: formData.isHomeSpotlight ? (formData.spotlightVideoUrl.trim() || undefined) : undefined,
      spotlightTitle: formData.isHomeSpotlight ? (formData.spotlightTitle.trim() || undefined) : undefined,
      spotlightDescription: formData.isHomeSpotlight ? (formData.spotlightDescription.trim() || undefined) : undefined,
    };

    try {
      if (editingExperience) {
        await updateMutation.mutateAsync({
          id: editingExperience.id,
          data: payload,
        });
        toast({ title: "Updated", description: `Experience "${formData.title}" updated successfully.` });
      } else {
        await createMutation.mutateAsync({
          data: payload,
        });
        toast({ title: "Created", description: `Experience "${formData.title}" created successfully.` });
      }
      invalidateCache();
      setOpenModal(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save experience",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteConfirm() {
    if (!experienceToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: experienceToDelete.id });
      invalidateCache();
      toast({ title: "Deleted", description: `Experience "${experienceToDelete.title}" removed.` });
      setDeleteDialogOpen(false);
      setExperienceToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete experience",
        variant: "destructive",
      });
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "Wellness & Ayurveda":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Waterways & Houseboats":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "Tea & Highlands":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Wilderness & Wildlife":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "Heritage & Sacred Arts":
        return "bg-purple-50 text-purple-800 border-purple-200";
      default:
        return "bg-zinc-50 text-zinc-800 border-zinc-200";
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Experiences CMS</h1>
            <Badge variant="outline" className="text-xs bg-[#183D2E]/10 text-[#183D2E] border-[#183D2E]/20 font-medium">
              {experiences.length} Curated
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Curate signature Kerala activities, private backwater cruises, estate teas, and living heritage arts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs gap-1.5 border-border hover:bg-muted"
          >
            <a href="http://localhost:3000/#experiences" target="_blank" rel="noreferrer">
              <ExternalLink size={13} /> View On Homepage
            </a>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs gap-1.5 border-border hover:bg-muted"
          >
            <a href="http://localhost:3000/experiences" target="_blank" rel="noreferrer">
              <ExternalLink size={13} /> View Live Page
            </a>
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-[#183D2E] hover:bg-[#122E23] text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Add Experience
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, tagline, destination..."
            className="pl-9 text-xs h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="text-xs h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PRESET_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="text-xs h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published Live</SelectItem>
            <SelectItem value="draft">Drafts Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Spotlight Filter */}
        <Select value={spotlightFilter} onValueChange={setSpotlightFilter}>
          <SelectTrigger className="text-xs h-9">
            <SelectValue placeholder="All Experiences" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items ({experiences.length})</SelectItem>
            <SelectItem value="spotlight">Hero Spotlight ({experiences.filter((e) => e.isHomeSpotlight).length}/4)</SelectItem>
            <SelectItem value="standard">Standard Catalog</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Experiences Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[80px]">Cover</TableHead>
              <TableHead className="min-w-[240px]">Experience</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration & Vibe</TableHead>
              <TableHead>Destinations</TableHead>
              <TableHead className="text-center w-[130px]">Hero Spotlight</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right w-[110px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-14 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 mb-2" /><Skeleton className="h-3 w-60" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredExperiences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-56 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Compass size={36} className="text-muted-foreground/60" />
                    <p className="text-base font-serif font-medium text-foreground">No experiences found</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {search || categoryFilter !== "all" || statusFilter !== "all"
                        ? "Try adjusting your search criteria or category filter."
                        : "Start creating your first luxury Kerala experience."}
                    </p>
                    {search || categoryFilter !== "all" || statusFilter !== "all" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setCategoryFilter("all");
                          setStatusFilter("all");
                          setSpotlightFilter("all");
                        }}
                        className="text-xs mt-2"
                      >
                        Reset Filters
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleOpenCreate}
                        className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs mt-2"
                      >
                        <Plus size={14} className="mr-1" /> Add First Experience
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredExperiences.map((exp: Experience) => (
                <TableRow
                  key={exp.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => handleOpenEdit(exp)}
                >
                  {/* Hero Thumbnail */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="relative h-12 w-14 rounded-md overflow-hidden bg-muted border border-border flex items-center justify-center">
                      {exp.heroImage ? (
                        <img
                          src={exp.heroImage}
                          alt={exp.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <ImageIcon size={18} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </TableCell>

                  {/* Title & Tagline */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm text-foreground hover:text-[#B48235] transition-colors">
                          {exp.title}
                        </span>
                        {exp.isHomeSpotlight && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                            Slot {exp.spotlightSlot || 1}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {exp.tagline || `/experiences/${exp.slug}`}
                      </p>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(
                        exp.category
                      )}`}
                    >
                      {exp.category}
                    </span>
                  </TableCell>

                  {/* Duration & Vibe */}
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1 text-foreground font-medium">
                        <Clock size={11} className="text-muted-foreground" />
                        <span>{exp.duration || "Self-Paced"}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {exp.intensity || exp.vibe || "Curated"}
                      </div>
                    </div>
                  </TableCell>

                  {/* Destinations */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {exp.destinations && exp.destinations.length > 0 ? (
                        exp.destinations.slice(0, 2).map((d: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 text-[10px] bg-muted/80 text-foreground px-1.5 py-0.5 rounded border border-border"
                          >
                            <MapPin size={9} className="text-[#B48235]" />
                            {d.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Kerala Wide</span>
                      )}
                      {exp.destinations && exp.destinations.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{exp.destinations.length - 2}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Hero Spotlight Quick Order */}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {exp.isHomeSpotlight ? (
                      <Select
                        value={String(exp.spotlightSlot || 1)}
                        onValueChange={(val) => handleQuickSlotChange(exp, Number(val))}
                      >
                        <SelectTrigger className="inline-flex h-7 w-[88px] items-center justify-center px-2 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-xs hover:bg-amber-500/25 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent onClick={(e) => e.stopPropagation()}>
                          <SelectItem value="1">Slot 1</SelectItem>
                          <SelectItem value="2">Slot 2</SelectItem>
                          <SelectItem value="3">Slot 3</SelectItem>
                          <SelectItem value="4">Slot 4</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </TableCell>



                  {/* Status Toggle */}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleTogglePublish(exp, e)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                        exp.published
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${exp.published ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      {exp.published ? "Live" : "Draft"}
                    </button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(exp)}
                        title="Edit Experience"
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setExperienceToDelete(exp);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete Experience"
                      >
                        <Trash2 size={13} />
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
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <form onSubmit={handleSubmit}>
            {/* Modal Header */}
            <div className="p-6 border-b border-border bg-card sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-serif font-bold text-foreground">
                    {editingExperience ? `Edit Experience: ${editingExperience.title}` : "Create New Experience"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Configure luxury activity attributes, story narrative, inclusions, highlights, and imagery.
                  </DialogDescription>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-border mt-4 -mb-6 pb-0 overflow-x-auto">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "logistics", label: "Details & Vibe" },
                  { id: "media", label: "Visuals & Media" },
                  { id: "highlights", label: "Highlights & Inclusions" },
                  { id: "settings", label: "Publish Settings" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-[#183D2E] text-[#183D2E] font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 bg-background">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Experience Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. The Art of Classical Kerala Healing"
                        className="text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">URL Slug *</Label>
                        {editingExperience && (
                          <button
                            type="button"
                            onClick={() => setSlugLocked(!slugLocked)}
                            className="text-[10px] text-muted-foreground hover:text-foreground underline"
                          >
                            {slugLocked ? "Unlock Slug" : "Lock Slug"}
                          </button>
                        )}
                      </div>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))}
                        placeholder="e.g. ayurveda-wellness"
                        className="text-xs font-mono"
                        disabled={slugLocked && Boolean(editingExperience)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData((p) => ({ ...p, category: val }))}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESET_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Tagline / Subheading</Label>
                      <Input
                        value={formData.tagline}
                        onChange={(e) => setFormData((p) => ({ ...p, tagline: e.target.value }))}
                        placeholder="e.g. 5,000 Years of Vedic Wisdom, Herb Gardens & Physician-Led Care"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Curatorial Story / Narrative</Label>
                    <Textarea
                      value={formData.story}
                      onChange={(e) => setFormData((p) => ({ ...p, story: e.target.value }))}
                      placeholder="Write an evocative, immersive description of the experience..."
                      className="text-xs min-h-[140px] leading-relaxed"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      This narrative is displayed prominently on the experience detail page and modal.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: LOGISTICS */}
              {activeTab === "logistics" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Duration</Label>
                      <Input
                        value={formData.duration}
                        onChange={(e) => setFormData((p) => ({ ...p, duration: e.target.value }))}
                        placeholder="e.g. Full Day Cruise or Overnight Charter (1–3 Nights)"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Physical Intensity</Label>
                      <Select
                        value={formData.intensity}
                        onValueChange={(val) => setFormData((p) => ({ ...p, intensity: val }))}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select intensity" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTENSITY_LEVELS.map((lvl) => (
                            <SelectItem key={lvl} value={lvl}>
                              {lvl}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Best Season to Experience</Label>
                      <Input
                        value={formData.bestTime}
                        onChange={(e) => setFormData((p) => ({ ...p, bestTime: e.target.value }))}
                        placeholder="e.g. October – April, Monsoon Prime (June – August)"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Atmosphere & Vibe</Label>
                      <Input
                        value={formData.vibe}
                        onChange={(e) => setFormData((p) => ({ ...p, vibe: e.target.value }))}
                        placeholder="e.g. Romantic, Silent & Unhurried"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Concierge Insider Tip</Label>
                    <Textarea
                      value={formData.conciergeTip}
                      onChange={(e) => setFormData((p) => ({ ...p, conciergeTip: e.target.value }))}
                      placeholder="e.g. Request our private sunrise canoe add-on at 6:30 AM before motorized boats start..."
                      className="text-xs min-h-[80px]"
                    />
                  </div>

                  {/* Associated Destinations */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs font-medium">Associated Destinations</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Click below to quickly attach or detach Kerala destinations:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_DESTINATIONS.map((dest) => {
                        const isSelected = formData.destinations.some((d) => d.slug === dest.slug);
                        return (
                          <button
                            key={dest.slug}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormData((p) => ({
                                  ...p,
                                  destinations: p.destinations.filter((d) => d.slug !== dest.slug),
                                }));
                              } else {
                                setFormData((p) => ({
                                  ...p,
                                  destinations: [...p.destinations, dest],
                                }));
                              }
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                              isSelected
                                ? "bg-[#183D2E] text-white border-[#183D2E]"
                                : "bg-muted/60 text-foreground border-border hover:bg-muted"
                            }`}
                          >
                            <MapPin size={10} className={isSelected ? "text-amber-300" : "text-muted-foreground"} />
                            {dest.name}
                            {isSelected && <CheckCircle2 size={10} className="ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA */}
              {activeTab === "media" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Hero Image *</Label>
                    <ImageUploadField
                      value={formData.heroImage}
                      onChange={(url) => setFormData((p) => ({ ...p, heroImage: url }))}
                      label="Upload or select hero cover image"
                      size="default"
                      helperText="High resolution landscape photo (1920x1080 recommended)."
                    />
                  </div>

                  {/* Gallery Section */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <Label className="text-xs font-medium">Gallery Images</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                        placeholder="Paste image URL to add to gallery (or upload above and copy URL)..."
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newGalleryUrl.trim()) {
                            setFormData((p) => ({
                              ...p,
                              gallery: [...p.gallery, newGalleryUrl.trim()],
                            }));
                            setNewGalleryUrl("");
                          }
                        }}
                        className="text-xs"
                      >
                        Add Photo
                      </Button>
                    </div>

                    {/* Gallery Thumbnails */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {formData.gallery.map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-border h-24 bg-muted">
                          <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((p) => ({
                                ...p,
                                gallery: p.gallery.filter((_, i) => i !== idx),
                              }));
                            }}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-destructive text-white rounded-full p-1 opacity-80 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: HIGHLIGHTS & INCLUSIONS */}
              {activeTab === "highlights" && (
                <div className="space-y-6">
                  {/* Highlights */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Curated Highlights</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData((p) => ({ ...p, highlights: [...p.highlights, ""] }))}
                        className="text-[11px] h-7 gap-1"
                      >
                        <Plus size={11} /> Add Bullet Point
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {formData.highlights.map((h, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-4 text-right">{idx + 1}.</span>
                          <Input
                            value={h}
                            onChange={(e) => {
                              const next = [...formData.highlights];
                              next[idx] = e.target.value;
                              setFormData((p) => ({ ...p, highlights: next }));
                            }}
                            placeholder="e.g. Comprehensive personal pulse consultation with an Ayurvedic physician"
                            className="text-xs"
                          />
                          {formData.highlights.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((p) => ({
                                  ...p,
                                  highlights: p.highlights.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="text-muted-foreground hover:text-destructive p-1"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inclusions */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">What's Included</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData((p) => ({ ...p, inclusions: [...p.inclusions, ""] }))}
                        className="text-[11px] h-7 gap-1"
                      >
                        <Plus size={11} /> Add Inclusion
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {formData.inclusions.map((inc, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                          <Input
                            value={inc}
                            onChange={(e) => {
                              const next = [...formData.inclusions];
                              next[idx] = e.target.value;
                              setFormData((p) => ({ ...p, inclusions: next }));
                            }}
                            placeholder="e.g. Private initial & exit consultations with Chief Ayurvedic Physician"
                            className="text-xs"
                          />
                          {formData.inclusions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((p) => ({
                                  ...p,
                                  inclusions: p.inclusions.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="text-muted-foreground hover:text-destructive p-1"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SETTINGS */}
              {activeTab === "settings" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium">Live Published Status</Label>
                      <p className="text-[11px] text-muted-foreground">
                        When enabled, this experience is visible to prospective guests on the web app.
                      </p>
                    </div>
                    <Switch
                      checked={formData.published}
                      onCheckedChange={(checked) => setFormData((p) => ({ ...p, published: checked }))}
                    />
                  </div>

                  {/* Homepage Spotlight (Hero Section 4 Cards) Toggle & Custom Fields */}
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-600 fill-amber-500" />
                          <Label className="text-xs font-semibold text-foreground">
                            Feature in Homepage Spotlight (Hero Section)
                          </Label>
                          <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            Max 4 Slots
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Feature this experience in the 4 interactive video cards on the homepage. When clicked on the homepage, visitors are redirected to <code className="text-xs font-mono text-amber-700 dark:text-amber-400">/experiences/{formData.slug || "slug"}</code>.
                        </p>
                      </div>
                      <Switch
                        checked={formData.isHomeSpotlight}
                        onCheckedChange={handleToggleSpotlight}
                      />
                    </div>

                    {formData.isHomeSpotlight && (
                      <div className="pt-3 border-t border-amber-500/20 space-y-4">
                        {/* Slot Selection & Homepage Title */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Spotlight Slot Position (Order 1–4) *</Label>
                            <Select
                              value={String(formData.spotlightSlot || 1)}
                              onValueChange={(val) => setFormData((p) => ({ ...p, spotlightSlot: Number(val) }))}
                            >
                              <SelectTrigger className="text-xs h-9 bg-background">
                                <SelectValue placeholder="Select Slot (1 - 4)" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4].map((slotNum) => {
                                  const occupant = experiences.find(
                                    (e) => e.isHomeSpotlight && e.spotlightSlot === slotNum && e.id !== editingExperience?.id
                                  );
                                  return (
                                    <SelectItem key={slotNum} value={String(slotNum)}>
                                      Slot {slotNum} {slotNum === 1 ? "(Center Main)" : `(Card ${slotNum})`}
                                      {occupant ? ` — [Occupied: ${occupant.title.slice(0, 22)}...]` : " — [Vacant]"}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                              Occupied slots will automatically swap positions on save to prevent duplicate orders.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Homepage Card Title</Label>
                            <Input
                              value={formData.spotlightTitle}
                              onChange={(e) => setFormData((p) => ({ ...p, spotlightTitle: e.target.value }))}
                              placeholder={formData.title || "e.g. Kayaking"}
                              className="text-xs bg-background"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Leave empty to default to Experience Title.
                            </p>
                          </div>
                        </div>

                        {/* Homepage Description */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Homepage Card Description (1–2 Sentences)</Label>
                          <Textarea
                            value={formData.spotlightDescription}
                            onChange={(e) => setFormData((p) => ({ ...p, spotlightDescription: e.target.value }))}
                            placeholder={formData.tagline || "e.g. Glide through silent lagoons and tranquil backwaters on a private kayak."}
                            rows={2}
                            className="text-xs bg-background"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Short evocative description shown on the front of the homepage card.
                          </p>
                        </div>

                        {/* Spotlight Ambient Video Upload & URL */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-1.5">
                            <Video size={13} className="text-amber-600" />
                            Spotlight Ambient Video (.mp4 / .webm) *
                          </Label>

                          <div className="flex gap-2">
                            <Input
                              value={formData.spotlightVideoUrl}
                              onChange={(e) => setFormData((p) => ({ ...p, spotlightVideoUrl: e.target.value }))}
                              placeholder="e.g. /Experience-section/12881094-hd_1920_1080_30fps.mp4"
                              className="text-xs font-mono bg-background"
                            />
                            <input
                              ref={spotlightVideoInputRef}
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={handleSpotlightVideoUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingSpotlightVideo}
                              onClick={() => spotlightVideoInputRef.current?.click()}
                              className="text-xs gap-1.5 shrink-0 border-amber-500/30 hover:bg-amber-500/10"
                            >
                              {uploadingSpotlightVideo ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" /> Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload size={13} /> Upload Video
                                </>
                              )}
                            </Button>
                          </div>

                          {formData.spotlightVideoUrl && (
                            <div className="relative rounded-lg overflow-hidden border border-border bg-black max-w-sm mt-2 aspect-video flex items-center justify-center">
                              <video
                                key={formData.spotlightVideoUrl}
                                src={formData.spotlightVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Play size={9} /> Live Preview
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Redirection Notice */}
                        <div className="p-2.5 rounded-lg bg-background/80 border border-border text-xs text-muted-foreground flex items-center gap-2">
                          <ExternalLink size={13} className="text-amber-600 shrink-0" />
                          <span>
                            When clicked on homepage, visitors will be redirected to:{" "}
                            <strong className="text-foreground font-mono">
                              /experiences/{formData.slug || "slug"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>



                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <Label className="text-xs font-medium">Display Sort Order</Label>
                    <Input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))}
                      className="text-xs w-32"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Lower numbers appear first in lists and homepage showcases.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-card flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs gap-1.5 shadow-sm"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingExperience ? "Update Experience" : "Publish Experience"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Experience?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">"{experienceToDelete?.title}"</span>? This will remove
              it from both the website and administrative listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
