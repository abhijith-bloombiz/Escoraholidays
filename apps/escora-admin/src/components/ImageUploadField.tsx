import { useRef, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListMediaQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Loader2,
  Upload,
  Link as LinkIcon,
  RefreshCw,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  size?: "default" | "wide" | "compact";
  helperText?: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".svg",
  ".jfif",
  ".heic",
  ".heif",
  ".mp4",
  ".webm",
  ".mov",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit (matches server)
export default function ImageUploadField({
  value,
  onChange,
  label = "Cover Image",
  size = "default",
  helperText,
}: ImageUploadFieldProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Active display URL: local optimistic preview while uploading, else external value
  const displayUrl = localPreview || value;

  // Cleanup object URLs on unmount or when localPreview changes
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  // Synchronize image loaded & error state
  useEffect(() => {
    setImageError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [displayUrl]);

  const boxHeight = size === "wide" ? "h-48" : size === "compact" ? "h-32" : "h-36";

  function validateFile(file: File): string | null {
    const ext = file.name ? ("." + file.name.split(".").pop()!.toLowerCase()) : "";
    const isMimeOk = file.type ? ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) : false;
    const isExtOk = ext ? ALLOWED_EXTENSIONS.includes(ext) : false;

    if (!isMimeOk && !isExtOk) {
      return "Unsupported format. Please upload JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, or web video (MP4, WebM).";
    }
    if (file.size > MAX_FILE_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return `File exceeds maximum size of 100MB (selected file is ${mb}MB).`;
    }
    return null;
  }

  async function upload(file: File) {
    const errorMsg = validateFile(file);
    if (errorMsg) {
      toast({ title: "Upload validation failed", description: errorMsg, variant: "destructive" });
      return;
    }

    // 1. Immediate optimistic local preview
    let objectUrl: string | null = null;
    if (file.type.startsWith("image/") || file.type === "" || file.name.match(/\.(jpe?g|png|webp|avif|gif)$/i)) {
      try {
        objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);
        setImageLoaded(true);
        setImageError(false);
      } catch {
        // Fallback without local preview
      }
    }

    setUploading(true);
    const originalMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadStatus(`Preparing photo (${originalMb}MB)…`);

    try {
      // Direct raw upload preserving 100% original resolution, color depth, and quality
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
        let errDesc = `Upload failed with status ${resp.status}`;
        try {
          const errorData = await resp.json();
          if (errorData?.error) errDesc = errorData.error;
        } catch {}
        if (resp.status === 401) {
          errDesc = "Admin session expired. Please refresh the page or log in again.";
        }
        throw new Error(errDesc);
      }

      const media = await resp.json();
      setImageError(false);
      setImageLoaded(true);
      onChange(media.url as string);

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setLocalPreview(null);

      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
      toast({
        title: "Photo uploaded successfully",
        description: `Saved as ${media.filename || "media asset"} (${originalMb}MB)`,
      });
    } catch (err: any) {
      // Revert local preview on error
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setLocalPreview(null);
      toast({
        title: "Failed to upload photo",
        description: err.message || "Please check your network connection and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadStatus("");
      setIsDragging(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function handleApplyUrl() {
    let trimmed = urlDraft.trim();
    if (!trimmed) return;

    // Auto-convert Unsplash webpage link to direct high-res image URL
    const unsplashPhotoMatch = trimmed.match(/unsplash\.com\/photos\/([a-zA-Z0-9_\-]+)/i);
    if (unsplashPhotoMatch && !trimmed.includes("images.unsplash.com")) {
      const photoId = unsplashPhotoMatch[1];
      trimmed = `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1600&q=80`;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/api/media/")) {
      toast({
        title: "Invalid URL format",
        description: "Please enter a valid URL starting with http://, https://, or an existing /api/media/ path.",
        variant: "destructive",
      });
      return;
    }

    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }

    setImageError(false);
    setImageLoaded(false);
    onChange(trimmed);
    qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
    setUrlDraft("");
    setShowUrlInput(false);
    toast({ title: "Image URL applied" });
  }

  const isVideo = Boolean(
    displayUrl &&
      (displayUrl.endsWith(".mp4") ||
        displayUrl.endsWith(".webm") ||
        displayUrl.endsWith(".mov") ||
        displayUrl.includes("video"))
  );

  const isUnsplashWeb = Boolean(displayUrl && /unsplash\.com\/photos\//i.test(displayUrl));
  const hasDisplayError = imageError || isUnsplashWeb;

  // Preview Mode with image loaded or uploading
  if (displayUrl) {
    return (
      <div className="space-y-2">
        {hasDisplayError ? (
          // Elegant error recovery card
          <div
            className={`relative ${boxHeight} w-full rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-500/10 dark:bg-amber-950/20 p-4 flex flex-col items-center justify-center text-center gap-2`}
          >
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs font-semibold">
                {isUnsplashWeb ? "Unsplash Webpage Link Detected" : "Unable to load image preview"}
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-200/90 max-w-lg leading-snug">
              {isUnsplashWeb ? (
                <>
                  Web browsers cannot display HTML webpages as photos. On Unsplash, right-click the photo and choose{" "}
                  <strong>&ldquo;Copy Image Address&rdquo;</strong> (starts with <code>images.unsplash.com</code>), or download
                  and upload the photo below.
                </>
              ) : (
                "The link could not be decoded as an image. Please verify the URL points directly to an image file (.jpg, .png, .webp) or upload the file directly."
              )}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded truncate max-w-md border border-border">
              {displayUrl}
            </p>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap justify-center">
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-7 text-xs px-2.5"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                data-testid="button-change-cover-image"
              >
                {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                Upload Photo Instead
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 bg-background hover:bg-muted"
                onClick={() => {
                  setUrlDraft(displayUrl);
                  setShowUrlInput(true);
                }}
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                Edit URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-7 text-xs px-2.5"
                onClick={() => {
                  if (localPreview) {
                    URL.revokeObjectURL(localPreview);
                    setLocalPreview(null);
                  }
                  onChange("");
                }}
                data-testid="button-remove-cover-image"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={ALLOWED_MIME_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-file-cover-image"
            />
          </div>
        ) : (
          // Vibrant image preview with subtle hover controls & dropzone support
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) upload(file);
            }}
            className={`relative ${boxHeight} w-full rounded-lg overflow-hidden border border-border bg-muted/20 group transition-all`}
          >
            {isVideo ? (
              <video src={displayUrl} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img
                ref={imgRef}
                src={displayUrl}
                alt={label}
                referrerPolicy="no-referrer"
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  // Do not fail local optimistic preview on initial render
                  if (!localPreview) {
                    setImageError(true);
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            )}

            {/* Active upload status overlay with progress message */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-white gap-2 px-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                <span className="text-xs font-semibold tracking-wide">{uploadStatus || "Uploading photo…"}</span>
                <span className="text-[10px] text-white/70">Optimizing and securing asset</span>
              </div>
            )}

            {/* Dragging over existing photo replacement overlay */}
            {isDragging && !uploading && (
              <div className="absolute inset-0 bg-primary/30 backdrop-blur-xs border-2 border-dashed border-primary z-20 flex flex-col items-center justify-center text-primary-foreground font-medium gap-1.5">
                <Upload className="h-6 w-6 animate-bounce text-white drop-shadow" />
                <span className="text-xs font-bold text-white drop-shadow">Drop photo to replace image</span>
              </div>
            )}

            {/* Floating luxury glassmorphism action bar on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 pointer-events-none group-hover:pointer-events-auto">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/90 font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full truncate max-w-[80%] border border-white/10">
                  {localPreview ? "Local photo ready" : displayUrl}
                </span>
                <span className="text-[9px] text-emerald-300 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Active Photo
                </span>
              </div>

              <div className="flex items-center gap-1.5 justify-center">
                <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 shadow-xl">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs px-2.5 bg-white text-neutral-900 hover:bg-neutral-100 shadow-sm font-medium"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    data-testid="button-change-cover-image"
                  >
                    {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    Replace Photo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 bg-black/40 text-white border-white/20 hover:bg-white/20 hover:text-white"
                    onClick={() => {
                      setUrlDraft(displayUrl);
                      setShowUrlInput(true);
                    }}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs px-2.5 shadow-sm"
                    onClick={() => {
                      if (localPreview) {
                        URL.revokeObjectURL(localPreview);
                        setLocalPreview(null);
                      }
                      onChange("");
                    }}
                    data-testid="button-remove-cover-image"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept={ALLOWED_MIME_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-file-cover-image"
            />
          </div>
        )}

        {showUrlInput && (
          <div className="border border-border rounded-lg p-3 bg-card space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-primary" /> Direct Image URL
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowUrlInput(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://images.unsplash.com/... or /api/media/files/..."
                className="text-xs h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
              />
              <Button type="button" size="sm" className="h-8 text-xs shrink-0" onClick={handleApplyUrl}>
                Apply
              </Button>
            </div>
          </div>
        )}

        {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}
      </div>
    );
  }

  // Empty state: Dropzone & Upload interface
  return (
    <div className="space-y-2">
      {showUrlInput ? (
        <div className="border border-border rounded-lg p-3 bg-card space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-primary" /> Paste Direct Image Link
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowUrlInput(false)}
            >
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://images.unsplash.com/... or /api/media/files/..."
              className="text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              data-testid="input-manual-image-url"
            />
            <Button type="button" size="sm" onClick={handleApplyUrl}>
              Apply URL
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            💡 <strong>Tip:</strong> Direct image URLs must end in <code>.jpg</code>, <code>.png</code>, <code>.webp</code>, or start with <code>https://images.unsplash.com/</code>. For Unsplash, right-click the photo on the website and select <em>&ldquo;Copy Image Address&rdquo;</em>.
          </p>
        </div>
      ) : (
        <div>
          <div
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) upload(file);
            }}
            className={`${boxHeight} w-full rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
              size === "compact" ? "p-3" : "p-6"
            } text-center ${
              isDragging
                ? "border-primary bg-primary/10 text-primary scale-[0.99]"
                : "border-border hover:border-primary/50 hover:bg-muted/10 text-muted-foreground"
            }`}
            data-testid="dropzone-cover-image"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className={`${size === "compact" ? "h-5 w-5" : "h-7 w-7"} text-primary animate-spin`} />
                <span className="text-xs font-medium text-foreground">{uploadStatus || "Uploading photo…"}</span>
                <span className="text-[10px] text-muted-foreground">Securing asset</span>
              </div>
            ) : (
              <>
                <div className={`${size === "compact" ? "p-2" : "p-3"} rounded-full bg-primary/10 text-primary`}>
                  <Upload className={size === "compact" ? "h-4 w-4" : "h-5 w-5"} />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {size === "compact" ? "Upload or drag photo" : "Click to choose a photo or drag & drop here"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {size === "compact" ? "JPEG, PNG, WebP (up to 100MB)" : "JPEG, PNG, WebP, or AVIF (up to 100MB)"}
                  </p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-file-cover-image"
          />
          <div className="flex items-center justify-end mt-2">
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
              data-testid="button-toggle-manual-url"
            >
              <LinkIcon className="h-3 w-3" /> Or enter image URL
            </button>
          </div>
        </div>
      )}

      {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}
    </div>
  );
}
