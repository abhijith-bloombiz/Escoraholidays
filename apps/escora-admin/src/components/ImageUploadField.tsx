import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListMediaQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X, Loader2, Upload, Link as LinkIcon, Check, RefreshCw, Film } from "lucide-react";

interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  size?: "default" | "wide";
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

  const boxHeight = size === "wide" ? "h-48" : "h-36";

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
    onChange(trimmed);
    qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
    setUrlDraft("");
    setShowUrlInput(false);
    toast({ title: "Image URL applied" });
  }

  const isVideo =
    value?.endsWith(".mp4") ||
    value?.endsWith(".webm") ||
    value?.endsWith(".mov") ||
    value?.includes("video");

  // Preview Mode with image loaded
  if (value) {
    return (
      <div className="space-y-2">
        <div className={`relative ${boxHeight} w-full rounded-lg overflow-hidden border border-border bg-muted/20 group`}>
          {isVideo ? (
            <video src={value} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-xs text-white/90 font-mono truncate max-w-full px-2">{value}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                data-testid="button-change-cover-image"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Change File
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-background/80 hover:bg-background"
                onClick={() => {
                  setUrlDraft(value);
                  setShowUrlInput(true);
                }}
              >
                <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                Edit URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onChange("")}
                data-testid="button-remove-cover-image"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Remove
              </Button>
            </div>
          </div>
          <input ref={fileInput} type="file" accept={ALLOWED_MIME_TYPES.join(",")} className="hidden" onChange={handleFileChange} />
        </div>

        {showUrlInput && (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-card">
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://images.unsplash.com/... or /api/media/files/..."
              className="text-xs font-mono h-8"
              autoFocus
            />
            <Button type="button" size="sm" onClick={handleApplyUrl} className="h-8 text-xs">
              Apply
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowUrlInput(false)} className="h-8 text-xs">
              Cancel
            </Button>
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
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Paste Direct Image URL</span>
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
              className="text-xs font-mono"
              autoFocus
            />
            <Button type="button" size="sm" onClick={handleApplyUrl}>
              Apply URL
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Accepts HTTPS image links or paths from the Escora media library.</p>
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
            className={`${boxHeight} w-full rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 p-6 text-center ${
              isDragging
                ? "border-primary bg-primary/10 text-primary scale-[0.99]"
                : "border-border hover:border-primary/50 hover:bg-muted/10 text-muted-foreground"
            }`}
            data-testid="dropzone-cover-image"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <span className="text-xs font-medium text-foreground">Uploading cover image…</span>
                <span className="text-[11px] text-muted-foreground">Compressing and writing asset</span>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Click to choose a photo or drag &amp; drop here
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    JPEG, PNG, WebP, or AVIF (maximum 10MB)
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
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">Standard 2D cover image for cards and headers.</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
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

