import { useState, useRef } from "react";
import {
  useListHomeExperiences,
  useUpdateHomeExperienceCard,
  type HomeExperienceCard,
  type HomeExperienceCardInput,
} from "@/hooks/useHomeExperiences";
import { useListExperiences, type Experience } from "@workspace/api-client-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Upload,
  Loader2,
  Pencil,
  ExternalLink,
  Sparkles,
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  Layers,
  AlertCircle,
  Play,
} from "lucide-react";

interface SlotFormState {
  title: string;
  tag: string;
  location: string;
  duration: string;
  desc: string;
  inclusion: string;
  videoUrl: string;
  posterUrl: string;
  experienceSlug: string;
  ctaText: string;
  published: boolean;
}

const DEFAULT_SLOT_FORM: SlotFormState = {
  title: "",
  tag: "Exclusive Experience",
  location: "Kerala",
  duration: "Half Day",
  desc: "",
  inclusion: "",
  videoUrl: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
  posterUrl: "",
  experienceSlug: "",
  ctaText: "Curate This Experience",
  published: true,
};

export default function HomeExperiencesManager() {
  const { toast } = useToast();
  const { data: cards = [], isLoading, error } = useListHomeExperiences();
  const { data: catalogExperiences = [] } = useListExperiences();
  const updateCardMutation = useUpdateHomeExperienceCard();

  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [formState, setFormState] = useState<SlotFormState>(DEFAULT_SLOT_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Normalize 4 slots (1, 2, 3, 4)
  const slots: { slot: number; card?: HomeExperienceCard }[] = [1, 2, 3, 4].map((slotNum) => ({
    slot: slotNum,
    card: cards.find((c) => c.slot === slotNum),
  }));

  function handleOpenEdit(slotNum: number, card?: HomeExperienceCard) {
    setEditingSlot(slotNum);
    if (card) {
      setFormState({
        title: card.title || "",
        tag: card.tag || "Exclusive Experience",
        location: card.location || "Kerala",
        duration: card.duration || "Half Day",
        desc: card.desc || "",
        inclusion: card.inclusion || "",
        videoUrl: card.videoUrl || "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
        posterUrl: card.posterUrl || "",
        experienceSlug: card.experienceSlug || "",
        ctaText: card.ctaText || "Curate This Experience",
        published: card.published ?? true,
      });
    } else {
      setFormState({
        ...DEFAULT_SLOT_FORM,
        title: `Signature Experience ${slotNum}`,
      });
    }
    setModalOpen(true);
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed with status ${resp.status}`);
      }

      const resData = await resp.json();
      setFormState((prev) => ({
        ...prev,
        videoUrl: resData.url,
      }));
      toast({
        title: "Video Uploaded",
        description: `"${file.name}" uploaded successfully and linked to Card ${editingSlot}.`,
      });
    } catch (err: any) {
      toast({
        title: "Video Upload Failed",
        description: err.message || "Failed to upload video to server.",
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function handleTogglePublish(card: HomeExperienceCard, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await updateCardMutation.mutateAsync({
        slot: card.slot,
        data: { published: !card.published },
      });
      toast({
        title: card.published ? "Card Hidden" : "Card Published",
        description: `Card ${card.slot} is now ${card.published ? "Draft" : "Live"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update card status",
        variant: "destructive",
      });
    }
  }

  async function handleSaveCard(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSlot) return;

    if (!formState.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for this experience card.",
        variant: "destructive",
      });
      return;
    }

    if (!formState.videoUrl.trim()) {
      toast({
        title: "Video Required",
        description: "Please upload or specify a video URL for this experience card.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: HomeExperienceCardInput = {
        title: formState.title.trim(),
        tag: formState.tag.trim() || "Signature Experience",
        location: formState.location.trim() || "Kerala",
        duration: formState.duration.trim() || "Half Day",
        desc: formState.desc.trim(),
        inclusion: formState.inclusion.trim(),
        videoUrl: formState.videoUrl.trim(),
        posterUrl: formState.posterUrl.trim() || null,
        experienceSlug: formState.experienceSlug.trim() || null,
        ctaText: formState.ctaText.trim() || "Curate This Experience",
        published: formState.published,
        sortOrder: editingSlot,
      };

      await updateCardMutation.mutateAsync({
        slot: editingSlot,
        data: payload,
      });

      toast({
        title: "Card Saved",
        description: `Homepage Experience Card 0${editingSlot} updated successfully.`,
      });
      setModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save experience card.",
        variant: "destructive",
      });
    }
  }

  // Pre-fill from catalog if selected
  function handleSelectCatalogExperience(slug: string) {
    if (!slug) {
      setFormState((prev) => ({ ...prev, experienceSlug: "" }));
      return;
    }
    const found = catalogExperiences.find((e: Experience) => e.slug === slug);
    if (found) {
      setFormState((prev) => ({
        ...prev,
        experienceSlug: found.slug,
        title: prev.title || found.title,
        tag: prev.tag === "Exclusive Experience" ? found.category : prev.tag,
        duration: prev.duration === "Half Day" ? (found.duration || prev.duration) : prev.duration,
        desc: prev.desc || found.tagline || "",
        posterUrl: prev.posterUrl || found.heroImage || "",
      }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="bg-gradient-to-r from-[#183D2E]/10 via-[#183D2E]/5 to-transparent p-5 rounded-2xl border border-[#183D2E]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#183D2E]" />
            <h2 className="text-base font-semibold text-foreground">Homepage Experiences (4 Spotlight Video Cards)</h2>
            <Badge className="bg-[#183D2E] text-white text-[11px] font-normal">Fixed 4 Slots</Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Configure the 4 featured experience cards rendered on the homepage. Each card plays a silent ambient looping video on hover/viewport and provides a direct path to bespoke enquiry or deep-dive story.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="text-xs gap-1.5 self-start md:self-auto border-border hover:bg-muted"
        >
          <a href="http://localhost:3000/#experiences" target="_blank" rel="noreferrer">
            <ExternalLink size={13} /> View On Homepage
          </a>
        </Button>
      </div>

      {/* 4 Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((s) => (
            <Skeleton key={s} className="h-96 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {slots.map(({ slot, card }) => {
            const isLive = card?.published ?? true;
            return (
              <div
                key={slot}
                className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col hover:border-[#183D2E]/40 transition-all duration-200 group"
              >
                {/* Slot Header */}
                <div className="p-3.5 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#183D2E] bg-[#183D2E]/10 px-2 py-0.5 rounded-md">
                      CARD 0{slot}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">
                      {card?.location || "Unset"}
                    </span>
                  </div>

                  {card && (
                    <button
                      type="button"
                      onClick={(e) => handleTogglePublish(card, e)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                        isLive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-500/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      {isLive ? "Live" : "Draft"}
                    </button>
                  )}
                </div>

                {/* Video Media Box */}
                <div className="relative aspect-[4/3] bg-black/90 overflow-hidden flex items-center justify-center">
                  {card?.videoUrl ? (
                    <video
                      key={card.videoUrl}
                      src={card.videoUrl}
                      poster={card.posterUrl || undefined}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <div className="text-center p-4 text-muted-foreground space-y-1">
                      <Video className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs">No video assigned</p>
                    </div>
                  )}

                  {/* Overlay duration badge */}
                  {card?.duration && (
                    <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <Clock size={11} className="text-[#D4AF37]" /> {card.duration}
                    </div>
                  )}

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenEdit(slot, card)}
                      className="h-8 text-xs bg-white text-zinc-900 hover:bg-white/90 gap-1.5 shadow"
                    >
                      <Pencil size={12} /> Edit Card 0{slot}
                    </Button>
                  </div>
                </div>

                {/* Card Content Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#D4AF37]">
                      {card?.tag || "SIGNATURE EXPERIENCE"}
                    </span>
                    <h3 className="font-serif font-bold text-sm text-foreground line-clamp-2 leading-tight">
                      {card?.title || `Experience Card 0${slot}`}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {card?.desc || "No description set yet. Click edit to configure."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 space-y-2">
                    {card?.inclusion && (
                      <div className="text-[11px] text-muted-foreground/90 line-clamp-1">
                        <strong className="text-[#183D2E] font-medium">Inclusion: </strong>
                        {card.inclusion}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      {card?.experienceSlug ? (
                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">
                          🔗 /{card.experienceSlug}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">No linked story</span>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(slot, card)}
                        className="h-7 text-xs text-[#183D2E] hover:bg-[#183D2E]/10 px-2"
                      >
                        Edit <Pencil size={11} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal for Slot */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#183D2E] bg-[#183D2E]/10 px-2 py-0.5 rounded-md">
                SLOT 0{editingSlot}
              </span>
              Edit Homepage Experience Card
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure video media, luxury headline, teaser story, and inclusions for this card.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCard} className="space-y-4">
            {/* Catalog Experience Quick-Fill */}
            <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/80">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#183D2E]" />
                Link / Pre-fill from Catalog Experience (Optional)
              </Label>
              <Select
                value={formState.experienceSlug || "none"}
                onValueChange={(val) => handleSelectCatalogExperience(val === "none" ? "" : val)}
              >
                <SelectTrigger className="text-xs h-9 bg-background">
                  <SelectValue placeholder="Choose an experience from catalog..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No linked experience (Stand-alone card) --</SelectItem>
                  {catalogExperiences.map((exp: Experience) => (
                    <SelectItem key={exp.id} value={exp.slug}>
                      {exp.title} ({exp.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Selecting a catalog experience pre-fills title, tag, and connects this card to the full experience story page.
              </p>
            </div>

            {/* Video Upload & Preview Section */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Video className="w-3.5 h-3.5 text-[#183D2E]" />
                  Card Ambient Video *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingVideo}
                  onClick={() => videoInputRef.current?.click()}
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

              {/* Hidden file input */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                className="hidden"
                onChange={handleVideoUpload}
              />

              <Input
                value={formState.videoUrl}
                onChange={(e) => setFormState((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="e.g. /Experience-section/12881094-hd_1920_1080_30fps.mp4 or upload directly"
                className="text-xs font-mono h-9"
                required
              />

              {/* In-modal video preview */}
              {formState.videoUrl && (
                <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video max-h-40 relative flex items-center justify-center mt-2">
                  <video
                    key={formState.videoUrl}
                    src={formState.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    muted
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="h-6 text-[10px] bg-black/80 hover:bg-black text-white px-2 shadow"
                    >
                      {uploadingVideo ? "Uploading..." : "Replace"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Title & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Card Title *</Label>
                <Input
                  value={formState.title}
                  onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Private Chef Twilight Cruise"
                  className="text-xs font-serif"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tag / Category</Label>
                <Input
                  value={formState.tag}
                  onChange={(e) => setFormState((p) => ({ ...p, tag: e.target.value }))}
                  placeholder="e.g. Exclusive Charter"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Location & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Location</Label>
                <Input
                  value={formState.location}
                  onChange={(e) => setFormState((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Alleppey Waters"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Duration</Label>
                <Input
                  value={formState.duration}
                  onChange={(e) => setFormState((p) => ({ ...p, duration: e.target.value }))}
                  placeholder="e.g. 4 Hours / Overnight Sanctuary"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Teaser Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Short Editorial Teaser (1-2 sentences)</Label>
              <Textarea
                rows={2}
                value={formState.desc}
                onChange={(e) => setFormState((p) => ({ ...p, desc: e.target.value }))}
                placeholder="Drift along silent palm-fringed lagoons aboard a handcrafted Kettuvallam..."
                className="text-xs resize-none"
              />
            </div>

            {/* Bespoke Inclusion */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Bespoke Inclusion Details</Label>
              <Input
                value={formState.inclusion}
                onChange={(e) => setFormState((p) => ({ ...p, inclusion: e.target.value }))}
                placeholder="e.g. Includes exclusive wooden vessel charter, 3-course menu, and twilight flute accompaniment."
                className="text-xs"
              />
            </div>

            {/* Fallback Poster & CTA Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fallback Poster Image URL (Optional)</Label>
                <Input
                  value={formState.posterUrl}
                  onChange={(e) => setFormState((p) => ({ ...p, posterUrl: e.target.value }))}
                  placeholder="e.g. /images/exp_houseboat.jpg"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Enquiry Button Label</Label>
                <Input
                  value={formState.ctaText}
                  onChange={(e) => setFormState((p) => ({ ...p, ctaText: e.target.value }))}
                  placeholder="Curate This Experience"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Published Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Card Status</Label>
                <p className="text-[11px] text-muted-foreground">
                  {formState.published ? "Active and visible on the homepage." : "Hidden in draft state."}
                </p>
              </div>
              <Switch
                checked={formState.published}
                onCheckedChange={(val) => setFormState((p) => ({ ...p, published: val }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateCardMutation.isPending}
                className="bg-[#183D2E] hover:bg-[#122E23] text-white text-xs gap-1.5"
              >
                {updateCardMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Card 0{editingSlot}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
