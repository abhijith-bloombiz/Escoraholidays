import { useState, useRef, useMemo } from "react";
import {
  useListMedia,
  useDeleteMedia,
  getListMediaQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Copy,
  Check,
  Search,
  X,
  Eye,
  AlertTriangle,
  ImageOff,
  RefreshCw,
  ExternalLink,
  FileText,
  CheckCircle2,
  HardDrive,
  Film,
  Layers,
  Globe,
} from "lucide-react";
import type { Media } from "@workspace/api-client-react";

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FilterType = "all" | "uploads" | "external" | "issues";

export default function MediaPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: media, isLoading, isError, refetch } = useListMedia();
  const deleteMutation = useDeleteMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [viewingTarget, setViewingTarget] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Track media IDs whose image decoding failed in the browser
  const [brokenMediaIds, setBrokenMediaIds] = useState<Set<number>>(new Set());

  function handleImageError(id: number) {
    setBrokenMediaIds((prev) => new Set(prev).add(id));
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
  }

  // Unified upload processor called by both top-right button and drop zone
  async function uploadFiles(files: FileList | File[]) {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: `Upload rejected: ${file.name}`,
          description: "File exceeds the 10MB maximum size limit.",
          variant: "destructive",
        });
        continue;
      }

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
        successCount++;
      } catch (err: any) {
        toast({
          title: `Failed to upload ${file.name}`,
          description: err.message || "Server rejected the file.",
          variant: "destructive",
        });
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (successCount > 0) {
      invalidate();
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} file(s) to media library.`,
      });
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteTarget(null);
          if (viewingTarget?.id === id) setViewingTarget(null);
          toast({ title: "Asset deleted successfully" });
        },
        onError: (err: any) => {
          const errorMsg =
            err?.response?.data?.error || err?.message || "Failed to delete media asset.";
          toast({
            title: "Deletion Blocked",
            description: errorMsg,
            variant: "destructive",
          });
        },
      }
    );
  }

  async function copyUrl(url: string, id: number) {
    const fullUrl = url.startsWith("http://") || url.startsWith("https://")
      ? url
      : window.location.origin + url;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "URL copied to clipboard",
        description: fullUrl,
      });
    } catch {
      toast({
        title: "Copy URL",
        description: fullUrl,
      });
    }
  }

  // Summary Metrics
  const totalCount = media?.length ?? 0;
  const uploadedCount = useMemo(
    () => media?.filter((m) => (m.storageType ?? "upload") === "upload").length ?? 0,
    [media]
  );
  const externalCount = useMemo(
    () => media?.filter((m) => m.storageType === "external").length ?? 0,
    [media]
  );
  const totalSizeBytes = useMemo(
    () =>
      media
        ?.filter((m) => (m.storageType ?? "upload") === "upload")
        .reduce((acc, m) => acc + (m.sizeBytes ?? 0), 0) ?? 0,
    [media]
  );

  // Diagnostic count: files missing from server disk (fileExists === false) or undecodable in browser
  const issuesCount = useMemo(() => {
    if (!media) return 0;
    return media.filter((m) => brokenMediaIds.has(m.id) || m.fileExists === false).length;
  }, [media, brokenMediaIds]);

  // Filtered Assets
  const filteredMedia = useMemo(() => {
    if (!media) return [];
    return media.filter((m) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = m.filename.toLowerCase().includes(q);
        const matchMime = m.mimeType.toLowerCase().includes(q);
        const matchUrl = m.url.toLowerCase().includes(q);
        const matchRef = m.references?.some(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q) ||
            r.field.toLowerCase().includes(q)
        );
        if (!matchName && !matchMime && !matchUrl && !matchRef) return false;
      }

      const isBroken = brokenMediaIds.has(m.id);
      const isMissing = m.fileExists === false;

      if (filterType === "uploads" && m.storageType === "external") return false;
      if (filterType === "external" && m.storageType !== "external") return false;
      if (filterType === "issues" && !isBroken && !isMissing) return false;

      return true;
    });
  }, [media, searchTerm, filterType, brokenMediaIds]);

  const hasActiveFilters = searchTerm.trim() !== "" || filterType !== "all";

  return (
    <div data-testid="media-page" className="space-y-6">
      {/* Hidden single file input used by both entry points */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        data-testid="input-file-upload"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified library of all uploaded images and videos across destinations, journeys, itineraries, and stories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="button-upload-media"
            className="self-start sm:self-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Upload Media"}
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards (Informational only — not competing filter buttons) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Assets */}
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Assets</span>
              <p className="text-2xl font-serif font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : totalCount}
              </p>
              <span className="text-[10px] text-muted-foreground block">Unified catalogue</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded Files</span>
              <p className="text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : uploadedCount}
              </p>
              <span className="text-[10px] text-muted-foreground block">Stored on server</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Disk Storage */}
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Disk Storage</span>
              <p className="text-2xl font-serif font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-16" /> : formatBytes(totalSizeBytes)}
              </p>
              <span className="text-[10px] text-muted-foreground block">Local storage used</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <HardDrive className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* External References */}
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">External URLs</span>
              <p className="text-2xl font-serif font-bold text-sky-600 dark:text-sky-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : externalCount}
              </p>
              <span className="text-[10px] text-muted-foreground block">Referenced externally</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <Globe className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Useful Diagnostics: Rendered clearly if any file is missing or unreadable */}
      {issuesCount > 0 && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <AlertTitle className="text-xs font-semibold">
                Diagnostics: {issuesCount} asset{issuesCount > 1 ? "s require" : " requires"} attention
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                One or more assets have missing server files or failed image decoding.
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterType("issues")}
            className="text-xs border-amber-500/30 hover:bg-amber-500/20 shrink-0 self-start sm:self-auto"
          >
            Filter to Issues ({issuesCount})
          </Button>
        </Alert>
      )}

      {/* Single Drag & Drop Zone */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-card"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) {
            uploadFiles(e.dataTransfer.files);
          }
        }}
        data-testid="media-drop-zone"
      >
        <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-1.5" />
        <p className="text-sm text-foreground font-medium">
          Drag &amp; drop images or videos here or <span className="text-primary hover:underline">click to browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Supports JPEG, PNG, WebP, AVIF, GIF, MP4, and WebM up to 10MB per file
        </p>
      </div>

      {/* Search & Single Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3.5 rounded-lg border border-border">
        {/* Filename & Reference Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename, URL, MIME type, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* One Clear Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v: FilterType) => setFilterType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Assets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets ({totalCount})</SelectItem>
              <SelectItem value="uploads">Uploaded Files ({uploadedCount})</SelectItem>
              <SelectItem value="external">External URLs ({externalCount})</SelectItem>
              <SelectItem value="issues">Issues &amp; Missing ({issuesCount})</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground h-9"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <AlertTitle>Failed to load media library</AlertTitle>
              <AlertDescription className="text-xs">
                Could not connect to the database to retrieve media assets.
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-destructive/40 hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </Alert>
      )}

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <h3 className="font-serif text-lg font-medium text-foreground">No Media Files In Library</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Upload images above or add cover photography through Destinations, Packages, and Journal.
          </p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-medium text-foreground text-sm">No matching media assets found</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Try adjusting your search query or filter selection.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setFilterType("all");
            }}
            className="mt-3 text-xs"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((m) => {
            const isBroken = brokenMediaIds.has(m.id);
            const isMissing = m.fileExists === false;
            const isVideo = m.mimeType.startsWith("video/");
            const isImage = m.mimeType.startsWith("image/");
            const isExternal = m.storageType === "external";
            const refCount = m.usageCount ?? (m.references?.length || 0);

            return (
              <div
                key={m.id}
                data-testid={`media-item-${m.id}`}
                className="group rounded-lg overflow-hidden border border-border bg-card shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Container: click opens Inspect details */}
                <div
                  className="w-full aspect-square relative overflow-hidden bg-muted/20 cursor-pointer flex items-center justify-center"
                  onClick={() => setViewingTarget(m)}
                  title="Click to view details and references"
                >
                  {isMissing ? (
                    /* Missing File on Disk */
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-destructive/5 border border-destructive/20">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-1.5">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium text-foreground truncate max-w-full px-1" title={m.filename}>
                        {m.filename}
                      </p>
                      <Badge variant="destructive" className="text-[10px] mt-1">
                        Missing file
                      </Badge>
                    </div>
                  ) : isVideo ? (
                    /* Video Preview */
                    <div className="w-full h-full relative flex items-center justify-center bg-black/90">
                      <video
                        src={m.url}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                        <Film className="h-3 w-3" /> Video
                      </div>
                    </div>
                  ) : isImage && !isBroken ? (
                    /* Normal Image */
                    <div className="w-full h-full relative">
                      <img
                        src={m.url}
                        alt={m.filename}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={() => handleImageError(m.id)}
                      />
                      {isExternal && (
                        <div className="absolute top-2 left-2 bg-sky-950/80 border border-sky-500/30 text-sky-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-xs">
                          <ExternalLink className="h-2.5 w-2.5" /> External
                        </div>
                      )}
                    </div>
                  ) : isBroken ? (
                    /* Undecodable Binary / Decode Failed */
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5">
                        <ImageOff className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium text-foreground truncate max-w-full px-1" title={m.filename}>
                        {m.filename}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-700 dark:text-amber-400 border-amber-500/30 mt-1 bg-amber-500/10"
                      >
                        Cannot decode
                      </Badge>
                    </div>
                  ) : (
                    /* Generic File */
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-muted/30">
                      <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
                      <p className="text-xs font-medium text-foreground truncate max-w-full px-1" title={m.filename}>
                        {m.filename}
                      </p>
                      <Badge variant="secondary" className="text-[10px] mt-1 font-mono">
                        {m.mimeType}
                      </Badge>
                    </div>
                  )}

                  {/* Clean Inspect Icon Button (top right hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingTarget(m);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Inspect details and content usage"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Clean Card Body */}
                <div className="p-3 bg-card border-t border-border space-y-2">
                  <div className="space-y-0.5">
                    <p
                      className="text-xs font-medium text-foreground truncate"
                      title={m.filename}
                    >
                      {m.filename}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="tabular-nums font-medium">
                        {isExternal ? "External" : formatBytes(m.sizeBytes)}
                      </span>
                      {refCount > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1 font-normal text-primary border-primary/30 bg-primary/5"
                          title={m.references?.map((r) => `${r.title} (${r.field})`).join(", ")}
                        >
                          {refCount} in use
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">Unused</span>
                      )}
                    </div>
                  </div>

                  {/* Primary Card Action: Single Copy URL button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs font-normal"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(m.url, m.id);
                    }}
                    data-testid={`button-copy-url-${m.id}`}
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" /> Copy URL
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================
          VIEW / INSPECT MEDIA ASSET MODAL
      ============================================================ */}
      <Dialog open={viewingTarget !== null} onOpenChange={(open) => !open && setViewingTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              {viewingTarget?.mimeType.startsWith("video/") ? (
                <Film className="h-5 w-5 text-primary" />
              ) : viewingTarget?.storageType === "external" ? (
                <Globe className="h-5 w-5 text-sky-500" />
              ) : (
                <ImageIcon className="h-5 w-5 text-primary" />
              )}
              {viewingTarget?.filename}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {viewingTarget?.storageType === "external"
                ? "External Web Asset · Referenced in Escora content"
                : `Stored Media File #${viewingTarget?.id} · Uploaded ${
                    viewingTarget
                      ? new Date(viewingTarget.createdAt).toLocaleString("en-IN", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })
                      : ""
                  }`}
            </DialogDescription>
          </DialogHeader>

          {viewingTarget && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Preview Container */}
              {viewingTarget.fileExists === false ? (
                <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/30 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 text-destructive mx-auto flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-foreground text-sm">File Missing from Storage</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    This media record is registered in Escora, but the underlying file could not be found on server disk storage at {viewingTarget.url}.
                  </p>
                </div>
              ) : brokenMediaIds.has(viewingTarget.id) ? (
                <div className="p-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
                    <ImageOff className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-foreground text-sm">Image Decoding Failed</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    The file exists on the server but could not be decoded as an image. This occurs when the stored content contains plain text, is truncated, or does not conform to genuine image binary structure.
                  </p>
                </div>
              ) : viewingTarget.mimeType.startsWith("video/") ? (
                <div className="max-h-72 w-full rounded-lg overflow-hidden border border-border bg-black/90 flex items-center justify-center p-2">
                  <video
                    src={viewingTarget.url}
                    controls
                    className="max-h-64 max-w-full rounded"
                  />
                </div>
              ) : viewingTarget.mimeType.startsWith("image/") ? (
                <div className="max-h-72 w-full rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center p-2">
                  <img
                    src={viewingTarget.url}
                    alt={viewingTarget.filename}
                    className="max-h-64 max-w-full object-contain rounded"
                    onError={() => handleImageError(viewingTarget.id)}
                  />
                </div>
              ) : (
                <div className="h-44 w-full rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/10">
                  <FileText className="h-10 w-10 text-muted-foreground/60" />
                  <span className="text-xs">
                    No visual preview for MIME type: {viewingTarget.mimeType}
                  </span>
                </div>
              )}

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border text-xs">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Asset Label / Filename
                  </span>
                  <span className="font-medium text-foreground text-sm block mt-0.5 break-all">
                    {viewingTarget.filename}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Storage Source
                  </span>
                  <span className="font-medium text-foreground text-sm block mt-0.5">
                    {viewingTarget.storageType === "external" ? (
                      <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" /> External URL
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <HardDrive className="h-3.5 w-3.5" /> Escora Server Storage
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                    File Size
                  </span>
                  <span className="font-medium text-foreground text-sm block mt-0.5 tabular-nums">
                    {viewingTarget.sizeBytes
                      ? `${formatBytes(viewingTarget.sizeBytes)} (${viewingTarget.sizeBytes.toLocaleString()} bytes)`
                      : "External (Not stored locally)"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                    MIME Type
                  </span>
                  <span className="font-medium text-foreground block mt-0.5 font-mono text-xs">
                    {viewingTarget.mimeType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Availability Status
                  </span>
                  <span className="font-medium block mt-0.5">
                    {viewingTarget.fileExists === false ? (
                      <span className="text-destructive font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> File Missing on Server
                      </span>
                    ) : brokenMediaIds.has(viewingTarget.id) ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Undecodable Binary
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valid &amp; Accessible
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Total References
                  </span>
                  <span className="font-medium text-foreground block mt-0.5">
                    {viewingTarget.usageCount ?? (viewingTarget.references?.length || 0)} content link(s)
                  </span>
                </div>
              </div>

              {/* Referenced Content Section */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                  Content Usage &amp; References ({viewingTarget.references?.length ?? 0})
                </span>
                {viewingTarget.references && viewingTarget.references.length > 0 ? (
                  <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden text-xs max-h-48 overflow-y-auto">
                    {viewingTarget.references.map((ref, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-[10px] font-medium">
                            {ref.type}
                          </Badge>
                          <span className="font-medium text-foreground">{ref.title}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{ref.field}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed text-xs text-muted-foreground bg-muted/10">
                    This media asset is not currently referenced in any Destination, Package, Journal post, or Itinerary.
                  </div>
                )}
              </div>

              {/* Public Path Bar */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                  {viewingTarget.storageType === "external" ? "External Image URL" : "Public CDN Path URL"}
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={viewingTarget.url}
                    className="font-mono text-xs bg-muted/40"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(viewingTarget.url, viewingTarget.id)}
                    title="Copy URL"
                  >
                    {copiedId === viewingTarget.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    title="Open directly in new tab"
                  >
                    <a href={viewingTarget.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 gap-2">
            <Button variant="outline" onClick={() => setViewingTarget(null)}>
              Close
            </Button>
            {viewingTarget && viewingTarget.storageType !== "external" && (
              <Button
                variant="destructive"
                onClick={() => {
                  const m = viewingTarget;
                  setViewingTarget(null);
                  setDeleteTarget(m);
                }}
                data-testid={`button-delete-media-${viewingTarget.id}`}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Asset
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          SAFE DELETE CONFIRMATION ALERT DIALOG
      ============================================================ */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Media Asset?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground">&ldquo;{deleteTarget?.filename}&rdquo;</strong>?
              </p>
              {deleteTarget && (
                <div className="p-3 rounded-md bg-muted/40 border text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Path:</strong>{" "}
                    <code className="text-foreground">{deleteTarget.url}</code>
                  </p>
                  <p>
                    <strong>Size:</strong> {formatBytes(deleteTarget.sizeBytes)}
                  </p>
                  {deleteTarget.references && deleteTarget.references.length > 0 && (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      Warning: Currently used in {deleteTarget.references.length} place(s). Deletion will be rejected by the server while in use.
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-destructive">
                This file will be permanently deleted from disk and database storage. If this asset is currently referenced in any destination, package, or itinerary, deletion will be safely rejected.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
