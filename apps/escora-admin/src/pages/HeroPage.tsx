import { useState, useMemo } from "react";
import {
  useListHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  getListHeroSlidesQueryKey,
  useGetHeroConfig,
  useUpdateHeroConfig,
  getGetHeroConfigQueryKey,
  useListDestinations,
} from "@workspace/api-client-react";
import type { HeroSlide, HeroSlideInput, HeroConfig } from "@workspace/api-client-react";
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
  ExternalLink,
  Play,
  Video,
  Layers,
  Settings,
  Sparkles,
  Eye,
  CheckCircle2,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Sliders,
  Maximize2,
  Film,
} from "lucide-react";

export const PRESET_HERO_VIDEOS = [
  {
    name: "Kerala Highlands (Misty Summits 60fps)",
    url: "/hero/15015065_1920_1080_60fps.mp4",
    poster: "/images/dest_3_munnar.jpg",
  },
  {
    name: "Heritage Waterways (UHD 4K Backwaters)",
    url: "/hero/9154179-uhd_3840_2160_25fps.mp4",
    poster: "/images/exp_houseboat.jpg",
  },
  {
    name: "Periyar Reserve & Bamboo Waters",
    url: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    poster: "/images/dest_4_rafting.jpg",
  },
];

interface SlideFormData {
  title: string;
  subtitle: string;
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  videoUrl: string;
  posterUrl: string;
  ctaText: string;
  ctaLink: string;
  published: boolean;
  sortOrder: number;
}

const DEFAULT_SLIDE_FORM: SlideFormData = {
  title: "KERALA HIGHLANDS",
  subtitle: "Misty Summits & Ancient Valleys",
  eyebrow: "GOD'S OWN COUNTRY",
  headingLine1: "A WORLD WAITING",
  headingLine2: "TO BE DISCOVERED",
  videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
  posterUrl: "/images/dest_3_munnar.jpg",
  ctaText: "Plan Your Journey",
  ctaLink: "/plan",
  published: true,
  sortOrder: 1,
};

export default function HeroPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"slides" | "config">("slides");
  const [openModal, setOpenModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState<SlideFormData>(DEFAULT_SLIDE_FORM);
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);

  // Queries
  const { data: slides = [], isLoading: slidesLoading } = useListHeroSlides();
  const { data: config, isLoading: configLoading } = useGetHeroConfig();
  const { data: destinations = [] } = useListDestinations();

  // Mutations
  const createSlideMutation = useCreateHeroSlide();
  const updateSlideMutation = useUpdateHeroSlide();
  const deleteSlideMutation = useDeleteHeroSlide();
  const updateConfigMutation = useUpdateHeroConfig();

  // Config Local State
  const [configEyebrow, setConfigEyebrow] = useState("");
  const [configShowSearch, setConfigShowSearch] = useState(false);
  const [configSlideDuration, setConfigSlideDuration] = useState(7);
  const [configInitialized, setConfigInitialized] = useState(false);

  // Sync config once loaded
  if (config && !configInitialized) {
    setConfigEyebrow(config.eyebrowBadge || "GOD'S OWN COUNTRY");
    setConfigShowSearch(Boolean(config.showSearchBar));
    setConfigSlideDuration(config.slideDuration || 7);
    setConfigInitialized(true);
  }

  function invalidateSlides() {
    qc.invalidateQueries({ queryKey: getListHeroSlidesQueryKey() });
  }

  function invalidateConfig() {
    qc.invalidateQueries({ queryKey: getGetHeroConfigQueryKey() });
  }

  function handleOpenCreate() {
    setEditingSlide(null);
    setSlideForm({
      ...DEFAULT_SLIDE_FORM,
      sortOrder: slides.length + 1,
    });
    setOpenModal(true);
  }

  function handleOpenEdit(slide: HeroSlide) {
    setEditingSlide(slide);
    setSlideForm({
      title: slide.title,
      subtitle: slide.subtitle,
      eyebrow: slide.eyebrow,
      headingLine1: slide.headingLine1,
      headingLine2: slide.headingLine2,
      videoUrl: slide.videoUrl,
      posterUrl: slide.posterUrl ?? "",
      ctaText: slide.ctaText ?? "Plan Your Journey",
      ctaLink: slide.ctaLink ?? "/plan",
      published: slide.published,
      sortOrder: slide.sortOrder,
    });
    setOpenModal(true);
  }

  async function handleTogglePublish(slide: HeroSlide, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await updateSlideMutation.mutateAsync({
        id: slide.id,
        data: { published: !slide.published },
      });
      invalidateSlides();
      toast({
        title: slide.published ? "Slide Hidden" : "Slide Live",
        description: `Slide "${slide.title}" is now ${slide.published ? "Draft" : "Published"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update slide status",
        variant: "destructive",
      });
    }
  }

  async function handleSlideSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slideForm.headingLine1.trim()) {
      toast({ title: "Validation Error", description: "Heading line 1 is required", variant: "destructive" });
      return;
    }
    if (!slideForm.videoUrl.trim()) {
      toast({ title: "Validation Error", description: "Video URL is required", variant: "destructive" });
      return;
    }

    const payload: HeroSlideInput = {
      title: slideForm.title.trim(),
      subtitle: slideForm.subtitle.trim(),
      eyebrow: slideForm.eyebrow.trim(),
      headingLine1: slideForm.headingLine1.trim(),
      headingLine2: slideForm.headingLine2.trim(),
      videoUrl: slideForm.videoUrl.trim(),
      posterUrl: slideForm.posterUrl.trim() || undefined,
      ctaText: slideForm.ctaText.trim() || undefined,
      ctaLink: slideForm.ctaLink.trim() || undefined,
      published: slideForm.published,
      sortOrder: Number(slideForm.sortOrder) || 1,
    };

    try {
      if (editingSlide) {
        await updateSlideMutation.mutateAsync({
          id: editingSlide.id,
          data: payload,
        });
        toast({ title: "Updated", description: `Slide "${slideForm.title}" updated successfully.` });
      } else {
        await createSlideMutation.mutateAsync({
          data: payload,
        });
        toast({ title: "Created", description: `Slide "${slideForm.title}" added to hero.` });
      }
      invalidateSlides();
      setOpenModal(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save slide",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteConfirm() {
    if (!slideToDelete) return;
    try {
      await deleteSlideMutation.mutateAsync({ id: slideToDelete.id });
      invalidateSlides();
      toast({ title: "Deleted", description: `Slide "${slideToDelete.title}" removed.` });
      setDeleteDialogOpen(false);
      setSlideToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete slide",
        variant: "destructive",
      });
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateConfigMutation.mutateAsync({
        data: {
          eyebrowBadge: configEyebrow.trim() || "GOD'S OWN COUNTRY",
          showSearchBar: configShowSearch,
          slideDuration: Number(configSlideDuration) || 7,
        },
      });
      invalidateConfig();
      toast({ title: "Saved", description: "Hero global configuration updated successfully." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update configuration",
        variant: "destructive",
      });
    }
  }

  const activeSlidePreview = previewSlide || slides[0] || null;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Hero Section CMS</h1>
            <Badge variant="outline" className="text-xs bg-[#183D2E]/10 text-[#183D2E] border-[#183D2E]/20 font-medium">
              {slides.length} Cinematic Slides
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Control the full-screen cinematic video backgrounds, dramatic headlines, eyebrow badges, and timing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs gap-1.5 border-border hover:bg-muted"
          >
            <a href="http://localhost:5173" target="_blank" rel="noreferrer">
              <ExternalLink size={13} /> View Live Hero
            </a>
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-[#183D2E] hover:bg-[#122E23] text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Add Hero Slide
          </Button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("slides")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "slides"
              ? "bg-[#183D2E] text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Film size={14} /> Hero Slides ({slides.length})
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "config"
              ? "bg-[#183D2E] text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Settings size={14} /> Global Hero Settings
        </button>
      </div>

      {/* TAB 1: SLIDES */}
      {activeTab === "slides" && (
        <div className="space-y-6">
          {/* Interactive Live Hero Miniature Preview */}
          {activeSlidePreview && (
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-[#0D0F13] text-white h-[280px] md:h-[320px] flex items-center justify-center select-none">
              {/* Background Video */}
              <video
                key={activeSlidePreview.videoUrl}
                src={activeSlidePreview.videoUrl}
                poster={activeSlidePreview.posterUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />

              {/* Gradient Scrims */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 pointer-events-none" />

              {/* Preview Content */}
              <div className="relative z-10 text-center px-4 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] uppercase font-semibold tracking-widest text-[#D4A359]">
                  <Sparkles size={11} /> {activeSlidePreview.eyebrow}
                </div>

                <h2 className="font-serif text-2xl md:text-4xl font-normal tracking-wide text-white leading-tight">
                  {activeSlidePreview.headingLine1}{" "}
                  <span className="text-[#D4A359] block md:inline">{activeSlidePreview.headingLine2}</span>
                </h2>

                <p className="text-xs md:text-sm text-white/80 font-sans tracking-wide">
                  {activeSlidePreview.title} — {activeSlidePreview.subtitle}
                </p>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#D4A359] text-black text-xs font-semibold">
                    {activeSlidePreview.ctaText || "Plan Your Journey"} <ArrowRight size={12} />
                  </span>
                </div>
              </div>

              {/* Top Banner Tag */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white/70 border border-white/10 flex items-center gap-1">
                <Play size={10} className="text-emerald-400 fill-emerald-400" />
                Live Preview: Slide #{activeSlidePreview.sortOrder} ({activeSlidePreview.title})
              </div>
            </div>
          )}

          {/* Slides Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[80px]">Preview</TableHead>
                  <TableHead className="min-w-[200px]">Headlines</TableHead>
                  <TableHead>Slide Title & Subtitle</TableHead>
                  <TableHead>Video Source</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-[110px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slidesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-12 w-16 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40 mb-2" /><Skeleton className="h-3 w-60" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-14 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : slides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Video size={36} className="text-muted-foreground/60" />
                        <p className="text-base font-serif font-medium text-foreground">No hero slides configured</p>
                        <p className="text-xs text-muted-foreground">Add video slides to display in the full-screen hero banner.</p>
                        <Button
                          size="sm"
                          onClick={handleOpenCreate}
                          className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs mt-2"
                        >
                          <Plus size={14} className="mr-1" /> Add First Slide
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  slides.map((slide) => (
                    <TableRow
                      key={slide.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setPreviewSlide(slide)}
                    >
                      {/* Video Thumbnail */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div
                          onClick={() => setPreviewSlide(slide)}
                          className="relative h-12 w-16 rounded-md overflow-hidden bg-black border border-border cursor-pointer group flex items-center justify-center"
                        >
                          {slide.posterUrl ? (
                            <img src={slide.posterUrl} alt={slide.title} className="h-full w-full object-cover" />
                          ) : (
                            <video src={slide.videoUrl} muted className="h-full w-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                            <Play size={12} className="text-white fill-white" />
                          </div>
                        </div>
                      </TableCell>

                      {/* Headlines */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#B48235]">
                            {slide.eyebrow}
                          </span>
                          <div className="text-sm font-serif font-medium text-foreground">
                            {slide.headingLine1} {slide.headingLine2}
                          </div>
                        </div>
                      </TableCell>

                      {/* Title & Subtitle */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-foreground">{slide.title}</span>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{slide.subtitle}</p>
                        </div>
                      </TableCell>

                      {/* Video Source */}
                      <TableCell>
                        <span className="text-[11px] font-mono text-muted-foreground line-clamp-1 max-w-[200px]" title={slide.videoUrl}>
                          {slide.videoUrl}
                        </span>
                      </TableCell>

                      {/* Sort Order */}
                      <TableCell className="text-center">
                        <span className="text-xs font-mono font-medium text-muted-foreground">
                          #{slide.sortOrder}
                        </span>
                      </TableCell>

                      {/* Published Toggle */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleTogglePublish(slide, e)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                            slide.published
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${slide.published ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          {slide.published ? "Live" : "Draft"}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(slide)}
                            title="Edit Slide"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSlideToDelete(slide);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete Slide"
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
        </div>
      )}

      {/* TAB 2: GLOBAL HERO CONFIG */}
      {activeTab === "config" && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Settings */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Sliders size={18} className="text-[#183D2E]" />
                <h3 className="text-sm font-semibold text-foreground">Banner & Timing Controls</h3>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Default Eyebrow Badge</Label>
                <Input
                  value={configEyebrow}
                  onChange={(e) => setConfigEyebrow(e.target.value)}
                  placeholder="GOD'S OWN COUNTRY"
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  The gold badge appearing above the primary headline on the hero banner.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Slide Auto-Advance Interval (seconds)</Label>
                <Input
                  type="number"
                  min={3}
                  max={30}
                  value={configSlideDuration}
                  onChange={(e) => setConfigSlideDuration(Number(e.target.value) || 7)}
                  className="text-xs w-36"
                />
                <p className="text-[11px] text-muted-foreground">
                  Duration each video plays before gently crossfading into the next scene.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Quick Search / Filter Bar</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Display the floating destination & date booking selector over the hero.
                  </p>
                </div>
                <Switch
                  checked={configShowSearch}
                  onCheckedChange={setConfigShowSearch}
                />
              </div>
            </div>

            {/* Portal Destinations Overview */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Compass size={18} className="text-[#183D2E]" />
                <h3 className="text-sm font-semibold text-foreground">Hero Portal Geography</h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                As guests scroll down from the hero video, the stage opens into an interactive 3D map featuring 1
                center flagship sanctuary and 4 corner companion portals:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/40 flex items-center justify-between">
                  <span className="font-medium text-foreground">Center Flagship Sanctuary</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    Auto-Mapped to Munnar Highlands
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Top-Left</span>
                    <span className="text-xs font-medium text-foreground">Bekal Fortress</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Top-Right</span>
                    <span className="text-xs font-medium text-foreground">Kannur Ritual Fire</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Bottom-Left</span>
                    <span className="text-xs font-medium text-foreground">Fort Kochi Heritage</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Bottom-Right</span>
                    <span className="text-xs font-medium text-foreground">Varkala Sea Cliffs</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground pt-1">
                  These destination portals dynamically synchronize with your live Destinations CMS!
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateConfigMutation.isPending}
              className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs gap-1.5 shadow-sm"
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Global Hero Settings"}
            </Button>
          </div>
        </form>
      )}

      {/* Create / Edit Slide Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-foreground">
              {editingSlide ? `Edit Slide: ${editingSlide.title}` : "Add New Hero Slide"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure cinematic headlines, video media, poster images, and button links.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSlideSubmit} className="space-y-4">
            {/* Headlines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Heading Line 1 *</Label>
                <Input
                  value={slideForm.headingLine1}
                  onChange={(e) => setSlideForm((p) => ({ ...p, headingLine1: e.target.value }))}
                  placeholder="e.g. A WORLD WAITING"
                  className="text-xs font-serif"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Heading Line 2 *</Label>
                <Input
                  value={slideForm.headingLine2}
                  onChange={(e) => setSlideForm((p) => ({ ...p, headingLine2: e.target.value }))}
                  placeholder="e.g. TO BE DISCOVERED"
                  className="text-xs font-serif text-[#B48235]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Eyebrow Badge</Label>
                <Input
                  value={slideForm.eyebrow}
                  onChange={(e) => setSlideForm((p) => ({ ...p, eyebrow: e.target.value }))}
                  placeholder="GOD'S OWN COUNTRY"
                  className="text-xs uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Slide Title / Tag</Label>
                <Input
                  value={slideForm.title}
                  onChange={(e) => setSlideForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. KERALA HIGHLANDS"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Subtitle / Geographic Label</Label>
              <Input
                value={slideForm.subtitle}
                onChange={(e) => setSlideForm((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="e.g. Misty Summits & Ancient Valleys"
                className="text-xs"
                required
              />
            </div>

            {/* Video Selection with Presets */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-medium">Video URL *</Label>
              <Input
                value={slideForm.videoUrl}
                onChange={(e) => setSlideForm((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="e.g. /hero/15015065_1920_1080_60fps.mp4 or CDN video URL"
                className="text-xs font-mono"
                required
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1 self-center">Presets:</span>
                {PRESET_HERO_VIDEOS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() =>
                      setSlideForm((p) => ({
                        ...p,
                        videoUrl: preset.url,
                        posterUrl: preset.poster,
                      }))
                    }
                    className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted/60 hover:bg-muted text-foreground transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Poster / Fallback Image */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Poster / Fallback Image</Label>
              <ImageUploadField
                value={slideForm.posterUrl}
                onChange={(url) => setSlideForm((p) => ({ ...p, posterUrl: url }))}
                label="Poster Image"
                size="compact"
                helperText="Displayed while video initializes or on low-power devices."
              />
            </div>

            {/* Button Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">CTA Button Text</Label>
                <Input
                  value={slideForm.ctaText}
                  onChange={(e) => setSlideForm((p) => ({ ...p, ctaText: e.target.value }))}
                  placeholder="Plan Your Journey"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">CTA Button Link</Label>
                <Input
                  value={slideForm.ctaLink}
                  onChange={(e) => setSlideForm((p) => ({ ...p, ctaLink: e.target.value }))}
                  placeholder="/plan"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Published Live</Label>
                <Switch
                  checked={slideForm.published}
                  onCheckedChange={(checked) => setSlideForm((p) => ({ ...p, published: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Sort Order</Label>
                <Input
                  type="number"
                  value={slideForm.sortOrder}
                  onChange={(e) => setSlideForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 1 }))}
                  className="text-xs w-20 text-center"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createSlideMutation.isPending || updateSlideMutation.isPending}
                className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs"
              >
                {createSlideMutation.isPending || updateSlideMutation.isPending ? "Saving..." : editingSlide ? "Update Slide" : "Create Slide"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Hero Slide?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to permanently delete slide{" "}
              <span className="font-semibold text-foreground">"{slideToDelete?.title}"</span>?
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
