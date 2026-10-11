import { useState, useRef } from "react";
import { useListMedia, useDeleteMedia, getListMediaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Trash2, Image, Copy, Check } from "lucide-react";

export default function MediaPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: media, isLoading } = useListMedia();
  const deleteMutation = useDeleteMedia();
  const fileInput = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function invalidate() { qc.invalidateQueries({ queryKey: getListMediaQueryKey() }); }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const resp = await fetch("/api/media", {
          method: "POST",
          headers: { "content-type": file.type, "x-filename": file.name },
          body: file,
        });
        if (!resp.ok) throw new Error("Upload failed");
      } catch {
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }
    setUploading(false);
    invalidate();
    if (fileInput.current) fileInput.current.value = "";
    toast({ title: `${files.length} file(s) uploaded` });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "File deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  async function copyUrl(url: string, id: number) {
    await navigator.clipboard.writeText(window.location.origin + url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalSize = media?.reduce((acc, m) => acc + (m.sizeBytes ?? 0), 0) ?? 0;
  const totalSizeMb = (totalSize / 1024 / 1024).toFixed(1);

  return (
    <div data-testid="media-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Media</h1>
          <p className="text-muted-foreground mt-1">{media?.length ?? 0} files · {totalSizeMb} MB</p>
        </div>
        <div>
          <input ref={fileInput} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleUpload} data-testid="input-file-upload" />
          <Button onClick={() => fileInput.current?.click()} disabled={uploading} data-testid="button-upload-media">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Upload Files"}
          </Button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 mb-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInput.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          if (fileInput.current) {
            const dt = new DataTransfer();
            Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
            fileInput.current.files = dt.files;
            fileInput.current.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }}
        data-testid="media-drop-zone"
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Drag & drop files here or <span className="text-primary">click to browse</span></p>
        <p className="text-xs text-muted-foreground/60 mt-1">Images and videos accepted</p>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : media?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No media uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media?.map((m) => (
            <div key={m.id} className="group relative rounded-md overflow-hidden border border-border bg-card" data-testid={`media-item-${m.id}`}>
              {m.mimeType.startsWith("image/") ? (
                <img src={m.url} alt={m.filename} className="w-full aspect-square object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-muted">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-end">
                <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{m.filename}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <Badge variant="outline" className="text-xs text-white border-white/30 bg-black/30">
                      {m.sizeBytes ? `${(m.sizeBytes / 1024).toFixed(0)}KB` : "—"}
                    </Badge>
                    <button
                      onClick={() => copyUrl(m.url, m.id)}
                      className="ml-auto p-1 rounded hover:bg-white/20 transition-colors"
                      title="Copy URL"
                      data-testid={`button-copy-url-${m.id}`}
                    >
                      {copiedId === m.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-white" />}
                    </button>
                    <button
                      onClick={() => setDeleteId(m.id)}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                      title="Delete"
                      data-testid={`button-delete-media-${m.id}`}
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>This file will be permanently deleted from storage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
