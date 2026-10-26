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
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit (matches server)

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
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset error/loaded state whenever the external value changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [value]);

  const boxHeight = size === "wide" ? "h-48" : size === "compact" ? "h-32" : "h-36";

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return "Unsupported format. Please upload JPEG, PNG, WebP, AVIF, GIF, or web video (MP4, WebM).";
    }
    if (file.size > MAX_FILE_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return `File exceeds maximum size of 10MB (selected file is ${mb}MB).`;
    }
    return null;
  }

  async function upload(file: File) {
    const errorMsg = validateFile(file);
    if (errorMsg) {
      toast({ title: "Upload validation failed", description: errorMsg, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const resp = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "content-type": file.type || "application/octet-stream", "x-filename": file.name },
        body: file,
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${resp.status}`);
      }
      const media = await resp.json();
      setImageError(false);
      setImageLoaded(false);
      onChange(media.url as string);
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
      toast({ title: "Media uploaded successfully", description: `Saved as ${media.filename || "media asset"}` });
    } catch (err: any) {
      toast({
        title: "Failed to upload media",
        description: err.message || "Please check your network connection and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setIsDragging(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function handleApplyUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/api/media/")) {
      toast({
        title: "Invalid URL format",
        description: "Please enter a valid URL starting with http://, https://, or an existing /api/media/ path.",
        variant: "destructive",
      });
      return;
    }

    if (/unsplash\.com\/photos\//i.test(trimmed)) {
      toast({
        title: "Unsplash Webpage URL Detected",
        description:
          "This is an Unsplash webpage link, not a direct photo file. On Unsplash, right-click the photo and choose 'Copy Image Address' (starts with https://images.unsplash.com/), or download the photo and upload it directly.",
        variant: "destructive",
      });
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
    value &&
      (value.endsWith(".mp4") ||
        value.endsWith(".webm") ||
        value.endsWith(".mov") ||
        value.includes("video"))
  );

  const isUnsplashWeb = Boolean(value && /unsplash\.com\/photos\//i.test(value));
  const hasDisplayError = imageError || isUnsplashWeb;

  // Preview Mode with image loaded
  if (value) {
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
              {value}
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
                  setUrlDraft(value);
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
                onClick={() => onChange("")}
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
          // Vibrant image preview with subtle hover controls
          <div
            className={`relative ${boxHeight} w-full rounded-lg overflow-hidden border border-border bg-muted/20 group`}
          >
            {!imageLoaded && !isVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/40 text-muted-foreground gap-1.5">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-[10px]">Loading preview…</span>
              </div>
            )}

            {isVideo ? (
              <video src={value} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img
                src={value}
                alt={label}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            )}

            {/* Floating luxury glassmorphism action bar on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/90 font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full truncate max-w-[80%] border border-white/10">
                  {value}
                </span>
                <span className="text-[9px] text-emerald-300 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  Active Photo
                </span>
              </div>

              <div className="flex items-center gap-1.5 justify-center">
                <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 shadow-xl">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs px-2.5 bg-white text-neutral-900 hover:bg-neutral-100 shadow-sm"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    data-testid="button-change-cover-image"
                  >
                    {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    Change
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 bg-black/40 text-white border-white/20 hover:bg-white/20 hover:text-white"
                    onClick={() => {
                      setUrlDraft(value);
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
                    onClick={() => onChange("")}
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
              <Button type="button" size="sm" onClick={handleApplyUrl} className="h-8 text-xs px-3">
                Apply URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowUrlInput(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              💡 <strong>Tip:</strong> Paste direct photo links (e.g. <code>https://images.unsplash.com/...</code> or ending in <code>.jpg</code>, <code>.png</code>, <code>.webp</code>). For Unsplash, right-click the photo and select <em>&ldquo;Copy Image Address&rdquo;</em>.
            </p>
          </div>
        )}

        {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}
      </div>
    );
  }

  // Upload or URL Input Mode
  return (
    <div className="space-y-2">
      {showUrlInput ? (
        <div className="border border-border rounded-lg p-4 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-primary" /> Paste Direct Image URL
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowUrlInput(false)}
            >
              Switch to file upload
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
                <span className="text-xs font-medium text-foreground">Uploading photo…</span>
                <span className="text-[10px] text-muted-foreground">Compressing asset</span>
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
                    {size === "compact" ? "JPEG, PNG, WebP (max 10MB)" : "JPEG, PNG, WebP, or AVIF (maximum 10MB)"}
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
