import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  size?: "default" | "wide";
}

// Uploads through the same /api/media endpoint MediaPage.tsx already uses
// (raw file body, content-type + x-filename headers), so a photo attached
// here shows up in the shared Media library too instead of being a one-off.
export default function ImageUploadField({ value, onChange, label = "Photo", size = "default" }: ImageUploadFieldProps) {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const boxClass = size === "wide" ? "w-full h-40" : "w-40 h-28";

  async function upload(file: File) {
    setUploading(true);
    try {
      const resp = await fetch("/api/media", {
        method: "POST",
        headers: { "content-type": file.type, "x-filename": file.name },
        body: file,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const media = await resp.json();
      onChange(media.url as string);
    } catch {
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  if (value) {
    return (
      <div className={`relative ${boxClass} rounded-md overflow-hidden border border-border group`}>
        <img src={value} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button type="button" size="sm" variant="secondary" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Change"}
          </Button>
          <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={() => onChange("")}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        disabled={uploading}
        className={`${boxClass} rounded-md border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground`}
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        <span className="text-xs">{uploading ? "Uploading…" : `Add ${label.toLowerCase()}`}</span>
      </button>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
