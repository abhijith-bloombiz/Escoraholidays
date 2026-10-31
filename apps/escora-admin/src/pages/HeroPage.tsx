import { useState } from "react";
import {
  useListHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  getListHeroSlidesQueryKey,
} from "@workspace/api-client-react";
import type { HeroSlide, HeroSlideInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

interface SlideFormData {
  headingLine1: string;
  headingLine2: string;
  eyebrow: string;
}

const DEFAULT_SLIDE_FORM: SlideFormData = {
  headingLine1: "A WORLD WAITING",
  headingLine2: "TO BE DISCOVERED",
  eyebrow: "GOD'S OWN COUNTRY",
};

export default function HeroPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState<SlideFormData>(DEFAULT_SLIDE_FORM);
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);

  // Queries
  const { data: slides = [], isLoading: slidesLoading } = useListHeroSlides();

  // Mutations
  const createSlideMutation = useCreateHeroSlide();
  const updateSlideMutation = useUpdateHeroSlide();
  const deleteSlideMutation = useDeleteHeroSlide();

  function invalidateSlides() {
    qc.invalidateQueries({ queryKey: getListHeroSlidesQueryKey() });
  }

  function handleOpenCreate() {
    setEditingSlide(null);
    setSlideForm({
      headingLine1: "",
      headingLine2: "",
      eyebrow: "GOD'S OWN COUNTRY",
    });
    setOpenModal(true);
  }

  function handleOpenEdit(slide: HeroSlide) {
    setEditingSlide(slide);
    setSlideForm({
      headingLine1: slide.headingLine1 || "",
      headingLine2: slide.headingLine2 || "",
      eyebrow: slide.eyebrow || "GOD'S OWN COUNTRY",
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
    if (!slideForm.headingLine2.trim()) {
      toast({ title: "Validation Error", description: "Heading Line 2 is required", variant: "destructive" });
      return;
    }
    if (!slideForm.eyebrow.trim()) {
      toast({ title: "Validation Error", description: "Eyebrow badge is required", variant: "destructive" });
      return;
    }

    const payload: HeroSlideInput = {
      title: editingSlide?.title || slideForm.headingLine1.trim(),
      subtitle: editingSlide?.subtitle || slideForm.headingLine2.trim(),
      eyebrow: slideForm.eyebrow.trim(),
      headingLine1: slideForm.headingLine1.trim(),
      headingLine2: slideForm.headingLine2.trim(),
      videoUrl: editingSlide?.videoUrl || (slides.length > 0 && slides[0].videoUrl ? slides[0].videoUrl : "/hero/15015065_1920_1080_60fps.mp4"),
      posterUrl: editingSlide?.posterUrl || "/images/dest_3_munnar.jpg",
      ctaText: editingSlide?.ctaText || "Plan Your Journey",
      ctaLink: editingSlide?.ctaLink || "/plan",
      published: editingSlide?.published ?? true,
      sortOrder: editingSlide?.sortOrder ?? slides.length + 1,
    };

    try {
      if (editingSlide) {
        await updateSlideMutation.mutateAsync({
          id: editingSlide.id,
          data: payload,
        });
        toast({ title: "Updated", description: "Hero headlines updated successfully." });
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

  const activeSlidePreview = previewSlide || slides[0] || null;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
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
            Configure the 3 hero banner elements: <strong>Heading 1</strong>, <strong>Heading 2</strong>, and <strong>Eyebrow Badge</strong>.
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

      {/* Interactive Live Hero Miniature Preview */}
      {activeSlidePreview && (
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-[#0D0F13] text-white h-[230px] md:h-[260px] flex items-center justify-center select-none">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />

          {/* Preview Content: Eyebrow + Heading 1 + Heading 2 */}
          <div className="relative z-10 text-center px-4 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#D4A359]/40 text-[10px] uppercase font-semibold tracking-widest text-[#D4A359]">
              <Sparkles size={11} /> {activeSlidePreview.eyebrow}
            </div>

            <h2 className="font-serif text-2xl md:text-4xl font-normal tracking-wide text-white leading-tight">
              {activeSlidePreview.headingLine1}{" "}
              <span className="text-[#D4A359] block md:inline">{activeSlidePreview.headingLine2}</span>
            </h2>
          </div>

          {/* Top Banner Tag */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white/70 border border-white/10 flex items-center gap-1.5">
            <Play size={10} className="text-emerald-400 fill-emerald-400" />
            Live Preview: Slide #{activeSlidePreview.sortOrder}
          </div>
        </div>
      )}

      {/* Slides Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[70px]">Slide</TableHead>
              <TableHead className="min-w-[180px]">1. HEADING 1</TableHead>
              <TableHead className="min-w-[180px]">2. HEADING 2</TableHead>
              <TableHead className="min-w-[160px]">3. EYEBROW BADGE</TableHead>
              <TableHead className="text-center w-[100px]">Status</TableHead>
              <TableHead className="text-right w-[110px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slidesLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-14 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : slides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Type size={32} className="text-muted-foreground/60" />
                    <p className="text-base font-serif font-medium text-foreground">No hero slides found</p>
                    <p className="text-xs text-muted-foreground">Add a hero slide to customize headlines and eyebrow badge.</p>
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
              slides.map((slide) => (
                <TableRow
                  key={slide.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setPreviewSlide(slide)}
                >
                  {/* Thumbnail / Number */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div
                      onClick={() => setPreviewSlide(slide)}
                      className="relative h-10 w-14 rounded-md overflow-hidden bg-black border border-border cursor-pointer group flex items-center justify-center"
                      title="Click to preview"
                    >
                      {slide.posterUrl ? (
                        <img src={slide.posterUrl} alt={slide.headingLine1} className="h-full w-full object-cover" />
                      ) : (
                        <video src={slide.videoUrl} muted className="h-full w-full object-cover" />
                      )}
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
                    <span className="font-serif font-medium text-sm text-[#B48235] uppercase tracking-wide">
                      {slide.headingLine2}
                    </span>
                  </TableCell>

                  {/* Eyebrow Badge */}
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#B48235]/10 text-[#B48235] border border-[#B48235]/25">
                      {slide.eyebrow}
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

      {/* Create / Edit Slide Modal - ONLY 1. HEADING 1, 2. HEADING 2, 3. EYEBROW BADGE */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-foreground">
              {editingSlide ? "Edit Hero Slide" : "Add Hero Slide"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure the 3 hero banner elements: Heading 1, Heading 2, and Eyebrow Badge.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSlideSubmit} className="space-y-4">
            {/* 1. HEADING 1 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">1. HEADING 1 *</Label>
              <Input
                value={slideForm.headingLine1}
                onChange={(e) => setSlideForm((p) => ({ ...p, headingLine1: e.target.value }))}
                placeholder="e.g. A WORLD WAITING"
                className="text-xs font-serif uppercase tracking-wider"
                required
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Primary headline displayed in bold white typography.
              </p>
            </div>

            {/* 2. HEADING 2 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">2. HEADING 2 *</Label>
              <Input
                value={slideForm.headingLine2}
                onChange={(e) => setSlideForm((p) => ({ ...p, headingLine2: e.target.value }))}
                placeholder="e.g. TO BE DISCOVERED"
                className="text-xs font-serif uppercase tracking-wider text-[#B48235]"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Secondary accent headline highlighted in golden tones.
              </p>
            </div>

            {/* 3. EYEBROW BADGE */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">3. EYEBROW BADGE *</Label>
              <Input
                value={slideForm.eyebrow}
                onChange={(e) => setSlideForm((p) => ({ ...p, eyebrow: e.target.value }))}
                placeholder="e.g. GOD'S OWN COUNTRY"
                className="text-xs uppercase font-medium tracking-widest text-[#B48235]"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                The small uppercase luxury tag pinned directly above the headlines.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
