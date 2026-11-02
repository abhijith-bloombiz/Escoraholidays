import { useState, useRef, useMemo, useEffect } from "react";
import {
  useListHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  getListHeroSlidesQueryKey,
  getListMediaQueryKey,
} from "@workspace/api-client-react";
import type { HeroSlide, HeroSlideInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Play,
  Sparkles,
  Type,
  Video,
  Upload,
  Loader2,
  Clock,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

export const DEFAULT_VIDEO_DURATION = 8; // Default 8 seconds (what was hardcoded in the hero carousel)



interface SlideFormData {
  headingLine1: string;
  headingLine2: string;
  eyebrow: string;
  videoUrl: string;
  duration: number | string;
  ctaText: string;
  ctaLink: string;
  published: boolean;
  sortOrder: number;
}

const DEFAULT_SLIDE_FORM: SlideFormData = {
  headingLine1: "A WORLD WAITING",
  headingLine2: "TO BE DISCOVERED",
  eyebrow: "GOD'S OWN COUNTRY",
  videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
  duration: DEFAULT_VIDEO_DURATION,
  ctaText: "Plan Your Journey",
  ctaLink: "/plan",
  published: true,
  sortOrder: 1,
};

export default function HeroPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState<SlideFormData>(DEFAULT_SLIDE_FORM);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);

  // Video Direct Upload
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  async function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video file exceeds the 100MB maximum limit.",
        variant: "destructive",
      });
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
      return;
    }

    setUploadingVideo(true);
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
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${resp.status}`);
      }

      const data = await resp.json();
      setSlideForm((prev) => ({
        ...prev,
        videoUrl: data.url,
      }));
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
      toast({
        title: "Video Uploaded",
        description: `"${file.name}" has been uploaded and set as the hero video.`,
      });
    } catch (err: any) {
      toast({
        title: "Video Upload Failed",
        description: err.message || "Failed to upload video to the server.",
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    }
  }

  // Queries
  const { data: slides = [], isLoading: slidesLoading } = useListHeroSlides();

  // Mutations
  const createSlideMutation = useCreateHeroSlide();
  const updateSlideMutation = useUpdateHeroSlide();
  const deleteSlideMutation = useDeleteHeroSlide();

  function invalidateSlides() {
    qc.invalidateQueries({ queryKey: getListHeroSlidesQueryKey() });
  }

  // Sorted slides by sortOrder ascending, with secondary tiebreaker on id
  const sortedSlides = useMemo(() => {
    return [...slides].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
  }, [slides]);

  async function handleMoveOrder(slide: HeroSlide, direction: -1 | 1, e: React.MouseEvent) {
    e.stopPropagation();
    const currentIndex = sortedSlides.findIndex((s) => s.id === slide.id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= sortedSlides.length) return;
    const targetSlide = sortedSlides[targetIndex];

    try {
      await updateSlideMutation.mutateAsync({
        id: slide.id,
        data: { sortOrder: targetSlide.sortOrder },
      });
      invalidateSlides();
      toast({
        title: "Order Updated",
        description: `Moved "${slide.headingLine1}" ${direction === -1 ? "up" : "down"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update slide order",
        variant: "destructive",
      });
    }
  }

  function handleOpenCreate() {
    setEditingSlide(null);
    setSlideForm({
      ...DEFAULT_SLIDE_FORM,
      headingLine1: "",
      headingLine2: "",
      eyebrow: "GOD'S OWN COUNTRY",
      duration: DEFAULT_VIDEO_DURATION,
      sortOrder: sortedSlides.length + 1,
    });
    setOpenModal(true);
  }

  function handleOpenEdit(slide: HeroSlide) {
    setEditingSlide(slide);
    setSlideForm({
      headingLine1: slide.headingLine1 || "",
      headingLine2: slide.headingLine2 || "",
      eyebrow: slide.eyebrow || "GOD'S OWN COUNTRY",
      videoUrl: slide.videoUrl || "/hero/15015065_1920_1080_60fps.mp4",
      duration: typeof slide.duration === "number" && slide.duration > 0 ? slide.duration : DEFAULT_VIDEO_DURATION,
      ctaText: slide.ctaText || "Plan Your Journey",
      ctaLink: slide.ctaLink || "/plan",
      published: slide.published ?? true,
      sortOrder: slide.sortOrder ?? 1,
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
        description: `Slide "${slide.headingLine1}" is now ${slide.published ? "Draft" : "Published"}.`,
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
      toast({ title: "Validation Error", description: "Heading Line 1 is required", variant: "destructive" });
      return;
    }
    if (!slideForm.eyebrow.trim()) {
      toast({ title: "Validation Error", description: "Eyebrow badge is required", variant: "destructive" });
      return;
    }
    if (!slideForm.videoUrl.trim()) {
      toast({ title: "Validation Error", description: "Video URL is required", variant: "destructive" });
      return;
    }

    const numericDuration = Math.max(
      1,
      Math.min(300, Math.round(Number(slideForm.duration) || DEFAULT_VIDEO_DURATION))
    );

    const payload: HeroSlideInput = {
      title: slideForm.headingLine1.trim(),
      subtitle: slideForm.headingLine2.trim(),
      eyebrow: slideForm.eyebrow.trim(),
      headingLine1: slideForm.headingLine1.trim(),
      headingLine2: slideForm.headingLine2.trim(),
      videoUrl: slideForm.videoUrl.trim(),
      duration: numericDuration,
      posterUrl: undefined,
      ctaText: slideForm.ctaText.trim() || "Plan Your Journey",
      ctaLink: slideForm.ctaLink.trim() || "/plan",
      published: slideForm.published,
      sortOrder: Math.max(1, Math.round(Number(slideForm.sortOrder) || 1)),
    };

    try {
      if (editingSlide) {
        await updateSlideMutation.mutateAsync({
          id: editingSlide.id,
          data: payload,
        });
        toast({ title: "Updated", description: "Hero slide updated successfully." });
      } else {
        await createSlideMutation.mutateAsync({
          data: payload,
        });
        toast({ title: "Created", description: "New hero slide added." });
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
      toast({ title: "Deleted", description: "Hero slide removed." });
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

  // Published slides in exact sortOrder for the live final output preview
  const livePreviewSlides = useMemo(() => {
    const published = sortedSlides.filter((s) => s.published !== false);
    return published.length > 0 ? published : sortedSlides;
  }, [sortedSlides]);

  // Keep index within bounds if slides change
  useEffect(() => {
    if (activePreviewIndex >= livePreviewSlides.length && livePreviewSlides.length > 0) {
      setActivePreviewIndex(0);
    }
  }, [livePreviewSlides.length, activePreviewIndex]);

  // Carousel timer matching public Hero: advances automatically using each slide's configured duration
  useEffect(() => {
    if (!livePreviewSlides.length) return;
    const currentSlide = livePreviewSlides[activePreviewIndex];
    const durationSec =
      typeof currentSlide?.duration === "number" && currentSlide.duration > 0
        ? currentSlide.duration
        : DEFAULT_VIDEO_DURATION;

    const timer = setTimeout(() => {
      setActivePreviewIndex((curr) => (curr + 1) % livePreviewSlides.length);
    }, durationSec * 1000);

    return () => clearTimeout(timer);
  }, [livePreviewSlides, activePreviewIndex]);

  const activeSlidePreview = livePreviewSlides[activePreviewIndex] || null;
  const activeSlideDurationSec =
    typeof activeSlidePreview?.duration === "number" && activeSlidePreview.duration > 0
      ? activeSlidePreview.duration
      : DEFAULT_VIDEO_DURATION;

  const conflictingSlide = sortedSlides.find(
    (s) => s.id !== editingSlide?.id && s.sortOrder === slideForm.sortOrder
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <style>{`
        @keyframes heroTimerBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Hero Section CMS</h1>
            <Badge variant="outline" className="text-xs bg-[#183D2E]/10 text-[#183D2E] border-[#183D2E]/20 font-medium">
              {slides.length} {slides.length === 1 ? "Slide" : "Slides"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your live hero video slides, headlines, and eyebrow badge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs gap-1.5 border-border hover:bg-muted"
          >
            <a href="http://localhost:3000" target="_blank" rel="noreferrer">
              <ExternalLink size={13} /> View Live Website
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

      {/* Interactive Live Hero Final Output Preview matching public page styling */}
      {livePreviewSlides.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-[#0B1410] text-white h-[260px] md:h-[300px] flex items-center justify-center select-none">
          {/* Top Info Bar: Live Final Output & Current Slide Duration Indicator */}
          <div className="absolute top-2.5 left-3.5 right-3.5 flex items-center justify-between z-20 pointer-events-none">
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white/90 border border-white/10">
              Live Output Preview
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/30 shadow-xs">
              <Clock size={11} className="text-[#D4AF37]" />
              Slide {activePreviewIndex + 1}/{livePreviewSlides.length} • {activeSlideDurationSec}s
            </span>
          </div>

          {/* Animated Duration Progress Bar at Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/15 z-30 overflow-hidden pointer-events-none">
            <div
              key={`${activePreviewIndex}-${activeSlideDurationSec}`}
              className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]"
              style={{
                animation: `heroTimerBar ${activeSlideDurationSec}s linear forwards`,
              }}
            />
          </div>

          {/* Background Videos with Smooth Crossfade matching public website */}
          {livePreviewSlides.map((slide, idx) => {
            const isActive = idx === activePreviewIndex;
            return (
              <video
                key={slide.id ?? slide.videoUrl}
                src={slide.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out pointer-events-none"
                style={{
                  opacity: isActive ? 0.85 : 0,
                  zIndex: isActive ? 1 : 0,
                }}
              />
            );
          })}

          {/* Luxury Ambient & Vignette Overlays matching public page */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(11, 20, 16, 0.35) 0%, rgba(11, 20, 16, 0.15) 35%, rgba(11, 20, 16, 0.25) 65%, rgba(11, 20, 16, 0.75) 100%)",
            }}
          />

          {/* Preview Content: Eyebrow + Heading 1 + Heading 2 + CTA button matching public hero */}
          <div className="relative z-20 text-center px-4 max-w-3xl flex flex-col items-center">
            {/* Stable Anchored Eyebrow */}
            <span
              style={{
                display: "inline-block",
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                textTransform: "uppercase",
                fontSize: "clamp(0.72rem, 1vw, 0.84rem)",
                letterSpacing: "0.24em",
                color: "#D4AF37",
                fontWeight: 700,
                marginBottom: "0.65rem",
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.85)",
              }}
            >
              {activeSlidePreview?.eyebrow || "GOD'S OWN COUNTRY"}
            </span>

            {/* Public Page Display Heading Stack with smooth crossfade */}
            <div className="grid grid-cols-1 justify-items-center w-full relative">
              {livePreviewSlides.map((slide, idx) => {
                const isActive = idx === activePreviewIndex;
                return (
                  <div
                    key={slide.id}
                    className="transition-all duration-700 ease-out"
                    style={{
                      gridArea: "1 / 1",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateY(0)" : "translateY(-6px)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    <h1
                      className="font-display"
                      style={{
                        fontFamily: "'Bebas Neue', 'Oswald', 'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif",
                        fontSize: "clamp(2.4rem, 4.4vw, 3.8rem)",
                        color: "#FFFFFF",
                        lineHeight: 0.92,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                        margin: 0,
                        textShadow: "0 6px 30px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(0, 0, 0, 0.85)",
                        fontWeight: 500,
                      }}
                    >
                      {slide.headingLine1}
                      {slide.headingLine2 ? (
                        <>
                          <br />
                          {slide.headingLine2}
                        </>
                      ) : null}
                    </h1>
                  </div>
                );
              })}
            </div>


          </div>
        </div>
      )}

      {/* Slides Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[60px] text-center">Order</TableHead>
              <TableHead className="w-[80px]">Video</TableHead>
              <TableHead className="min-w-[180px]">Heading 1</TableHead>
              <TableHead className="min-w-[180px]">Heading 2</TableHead>
              <TableHead className="min-w-[150px]">Eyebrow Badge</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
              <TableHead className="text-center w-[100px]">Status</TableHead>
              <TableHead className="text-right w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slidesLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-14 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sortedSlides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Type size={32} className="text-muted-foreground/60" />
                    <p className="text-base font-serif font-medium text-foreground">No hero slides found</p>
                    <p className="text-xs text-muted-foreground">Add a hero slide to customize headlines, eyebrow badge, and video.</p>
                    <Button
                      size="sm"
                      onClick={handleOpenCreate}
                      className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs mt-2"
                    >
                      <Plus size={14} className="mr-1" /> Add Hero Slide
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedSlides.map((slide, index) => (
                <TableRow
                  key={slide.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => {
                    const targetIdx = livePreviewSlides.findIndex((s) => s.id === slide.id);
                    if (targetIdx !== -1) setActivePreviewIndex(targetIdx);
                  }}
                >
                  {/* Order Badge */}
                  <TableCell className="text-center font-mono" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#183D2E]/10 text-[#183D2E] font-semibold text-xs">
                      #{slide.sortOrder}
                    </span>
                  </TableCell>

                  {/* Thumbnail Video Preview */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div
                      onClick={() => {
                        const targetIdx = livePreviewSlides.findIndex((s) => s.id === slide.id);
                        if (targetIdx !== -1) setActivePreviewIndex(targetIdx);
                      }}
                      className="relative h-10 w-14 rounded-md overflow-hidden bg-black border border-border cursor-pointer group flex items-center justify-center"
                      title="Click to preview"
                    >
                      <video src={slide.videoUrl} muted className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <Play size={10} className="text-white fill-white" />
                      </div>
                    </div>
                  </TableCell>

                  {/* Heading Line 1 */}
                  <TableCell>
                    <span className="font-serif font-medium text-sm text-foreground uppercase tracking-wide">
                      {slide.headingLine1}
                    </span>
                  </TableCell>

                  {/* Heading Line 2 */}
                  <TableCell>
                    <span className="font-serif font-medium text-sm text-black dark:text-foreground uppercase tracking-wide">
                      {slide.headingLine2 || "—"}
                    </span>
                  </TableCell>

                  {/* Eyebrow Badge */}
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#B48235]/10 text-[#B48235] border border-[#B48235]/25">
                      {slide.eyebrow}
                    </span>
                  </TableCell>

                  {/* Playback Duration */}
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-foreground border border-border">
                      <Clock size={11} className="text-[#183D2E]" />
                      {slide.duration || DEFAULT_VIDEO_DURATION}s
                    </span>
                  </TableCell>

                  {/* Published Toggle */}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleTogglePublish(slide, e)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
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
                        disabled={index === 0 || updateSlideMutation.isPending}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        onClick={(e) => handleMoveOrder(slide, -1, e)}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === sortedSlides.length - 1 || updateSlideMutation.isPending}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        onClick={(e) => handleMoveOrder(slide, 1, e)}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </Button>
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

      {/* Create / Edit Slide Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-foreground">
              {editingSlide ? "Edit Hero Slide" : "Add New Hero Slide"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure cinematic headlines, video media, and button links for this hero slide.
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
                  className="text-xs font-serif text-black dark:text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Heading Line 2</Label>
                <Input
                  value={slideForm.headingLine2}
                  onChange={(e) => setSlideForm((p) => ({ ...p, headingLine2: e.target.value }))}
                  placeholder="e.g. TO BE DISCOVERED"
                  className="text-xs font-serif text-black dark:text-foreground"
                />
              </div>
            </div>

            {/* Eyebrow Badge (slidetag & subtitle removed per request) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Eyebrow Badge *</Label>
              <Input
                value={slideForm.eyebrow}
                onChange={(e) => setSlideForm((p) => ({ ...p, eyebrow: e.target.value }))}
                placeholder="e.g. GOD'S OWN COUNTRY"
                className="text-xs uppercase"
                required
              />
            </div>

            {/* Video Selection with Direct Upload and Presets */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#183D2E]" />
                  Video URL *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingVideo}
                  onClick={() => videoFileInputRef.current?.click()}
                  className="h-7 text-xs border-[#183D2E]/30 text-[#183D2E] hover:bg-[#183D2E]/10 flex items-center gap-1.5"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload Video Directly</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Hidden file input for direct video upload */}
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                className="hidden"
                onChange={handleVideoFileChange}
              />

              <Input
                value={slideForm.videoUrl}
                onChange={(e) => setSlideForm((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="e.g. /hero/15015065_1920_1080_60fps.mp4 or upload a video directly"
                className="text-xs font-mono"
                required
              />

              {/* Video Player Preview if URL is set */}
              {slideForm.videoUrl && (
                <div className="rounded-lg overflow-hidden border border-border bg-black/90 aspect-video max-h-36 relative flex items-center justify-center">
                  <video
                    key={slideForm.videoUrl}
                    src={slideForm.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    muted
                    preload="metadata"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => videoFileInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="h-6 text-[10px] bg-black/75 hover:bg-black/90 text-white backdrop-blur-sm px-2 shadow"
                    >
                      {uploadingVideo ? "Uploading..." : "Replace Video"}
                    </Button>
                  </div>
                </div>
              )}



              {/* Playback Duration Option: Dual Slider + Direct Typing + Presets + Reset */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3 mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#183D2E]" />
                      <Label className="text-xs font-semibold text-foreground">Video Playback Duration</Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Slide display time before auto-advancing (Default: {DEFAULT_VIDEO_DURATION} seconds).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Direct Typing Input */}
                    <div className="relative flex items-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={slideForm.duration}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setSlideForm((p) => ({ ...p, duration: "" }));
                            return;
                          }
                          const clean = val.replace(/\D/g, "");
                          setSlideForm((p) => ({ ...p, duration: clean }));
                        }}
                        onBlur={() => {
                          const num = Number(slideForm.duration);
                          if (!num || num < 2) {
                            setSlideForm((p) => ({ ...p, duration: DEFAULT_VIDEO_DURATION }));
                          } else {
                            setSlideForm((p) => ({ ...p, duration: Math.min(120, Math.max(2, num)) }));
                          }
                        }}
                        placeholder={String(DEFAULT_VIDEO_DURATION)}
                        className="w-20 text-xs text-center pr-6 h-8 font-mono font-medium bg-background"
                        title="Type duration directly (2 to 120 seconds)"
                      />
                      <span className="absolute right-2 text-[11px] font-mono text-muted-foreground pointer-events-none">s</span>
                    </div>

                    {/* Reset Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSlideForm((p) => ({
                          ...p,
                          duration: DEFAULT_VIDEO_DURATION,
                        }))
                      }
                      title={`Reset duration to default (${DEFAULT_VIDEO_DURATION}s)`}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border-border bg-background"
                    >
                      <RotateCcw className="w-3 h-3 text-[#183D2E]" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>

                {/* Number Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>2s</span>
                    <span className="font-semibold text-foreground">
                      {slideForm.duration !== "" ? `${slideForm.duration}s` : `${DEFAULT_VIDEO_DURATION}s`}
                    </span>
                    <span>60s</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={60}
                    step={1}
                    value={
                      slideForm.duration !== "" && !isNaN(Number(slideForm.duration))
                        ? Math.min(60, Math.max(2, Number(slideForm.duration)))
                        : DEFAULT_VIDEO_DURATION
                    }
                    onChange={(e) =>
                      setSlideForm((p) => ({
                        ...p,
                        duration: Number(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-[#183D2E]"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mr-1">Presets:</span>
                  {[5, 8, 10, 15, 20].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSlideForm((p) => ({ ...p, duration: sec }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors border ${
                        Number(slideForm.duration) === sec
                          ? "bg-[#183D2E] text-white border-[#183D2E]"
                          : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {sec}s {sec === DEFAULT_VIDEO_DURATION ? "(Default)" : ""}
                    </button>
                  ))}
                </div>
              </div>
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
                <div>
                  <Label className="text-xs font-medium block">Sort Order</Label>
                  <span className="text-[10px] text-muted-foreground">Playback sequence</span>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={slideForm.sortOrder}
                  onChange={(e) => setSlideForm((p) => ({ ...p, sortOrder: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  className="text-xs w-20 text-center font-mono font-medium"
                />
              </div>

              {conflictingSlide && (
                <div className="col-span-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Sort order <strong>#{slideForm.sortOrder}</strong> is currently assigned to <strong>"{conflictingSlide.headingLine1}"</strong>.
                    Saving will place this slide at position <strong>#{slideForm.sortOrder}</strong> and automatically shift other slides to maintain a clean sequence without conflicts.
                  </span>
                </div>
              )}
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
                className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs px-4"
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
              <span className="font-semibold text-foreground">"{slideToDelete?.headingLine1} {slideToDelete?.headingLine2}"</span>?
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
