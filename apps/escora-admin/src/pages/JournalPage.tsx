import { useState, useRef } from "react";
import { useListJournalPosts, useCreateJournalPost, useUpdateJournalPost, useDeleteJournalPost, getListJournalPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Globe, Clock, Eye } from "lucide-react";
import type { JournalPost } from "@workspace/api-client-react";

type Post = JournalPost;

const emptyForm = {
  title: "", slug: "", category: "", excerpt: "", content: "",
  authorName: "", authorRole: "", imageUrl: "", tags: "", readTimeMinutes: 5,
  published: true, publishedAt: "",
};

function RichTextToolbar({ textareaRef }: { textareaRef: React.RefObject<HTMLTextAreaElement | null> }) {
  function wrap(before: string, after: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = el.value.slice(start, end);
    const newVal = el.value.slice(0, start) + before + sel + after + el.value.slice(end);
    el.value = newVal;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
    el.setSelectionRange(start + before.length, start + before.length + sel.length);
  }
  function insertLink() {
    const url = prompt("Enter URL:", "https://");
    if (!url) return;
    const el = textareaRef.current;
    if (!el) return;
    const sel = el.value.slice(el.selectionStart, el.selectionEnd) || "link text";
    wrap(`<a href="${url}">`, `</a>`);
  }
  const tools = [
    { label: "B", title: "Bold", action: () => wrap("<strong>", "</strong>") },
    { label: "I", title: "Italic", action: () => wrap("<em>", "</em>") },
    { label: "H2", title: "Heading", action: () => wrap("<h2>", "</h2>") },
    { label: "❝", title: "Blockquote", action: () => wrap("<blockquote>", "</blockquote>") },
    { label: "🔗", title: "Link", action: insertLink },
    { label: "•", title: "Bullet list", action: () => wrap("<ul>\n<li>", "</li>\n</ul>") },
  ];
  return (
    <div className="flex items-center gap-1 p-1.5 bg-muted/50 border border-b-0 rounded-t-md">
      {tools.map(t => (
        <button
          key={t.label}
          type="button"
          title={t.title}
          onClick={t.action}
          className="px-2.5 py-1 text-xs font-mono rounded hover:bg-background hover:shadow-sm transition-all border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
        >
          {t.label}
        </button>
      ))}
      <span className="ml-auto text-[10px] text-muted-foreground/50">HTML editor</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm">{String(value)}</p>
    </div>
  );
}

export default function JournalPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: posts, isLoading } = useListJournalPosts();
  const createMutation = useCreateJournalPost();
  const updateMutation = useUpdateJournalPost();
  const deleteMutation = useDeleteJournalPost();

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewing, setViewing] = useState<Post | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: Post) {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, category: p.category,
      excerpt: p.excerpt ?? "", content: p.content ?? "",
      authorName: p.authorName ?? "", authorRole: p.authorRole ?? "",
      imageUrl: p.imageUrl ?? "", tags: p.tags ?? "",
      readTimeMinutes: p.readTimeMinutes ?? 5,
      published: p.published, publishedAt: p.publishedAt ?? "",
    });
    setOpen(true);
  }

  function invalidate() { qc.invalidateQueries({ queryKey: getListJournalPostsQueryKey() }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, readTimeMinutes: Number(form.readTimeMinutes) };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Post updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Post created" }); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Post deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  return (
    <div data-testid="journal-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Journal</h1>
          <p className="text-muted-foreground mt-1">{posts?.length ?? 0} posts total</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-post">
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Read Time</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            )) : !posts?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No posts yet. Click <span className="font-medium text-foreground">New Post</span> to write your first.
                </TableCell>
              </TableRow>
            ) : posts?.map((p) => (
              <TableRow key={p.id} data-testid={`row-post-${p.id}`}>
                <TableCell className="font-medium max-w-48 truncate">{p.title}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.authorName ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.readTimeMinutes ? (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.readTimeMinutes}m</span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.publishedAt ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={p.published ? "default" : "secondary"} className="text-xs">
                    {p.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(p)} data-testid={`button-view-post-${p.id}`}>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`button-edit-post-${p.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} data-testid={`button-delete-post-${p.id}`}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewing !== null} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {viewing?.title}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title" value={viewing.title} />
                <Field label="Slug" value={viewing.slug} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Category" value={viewing.category} />
                <Field label="Read Time" value={viewing.readTimeMinutes ? `${viewing.readTimeMinutes} min` : undefined} />
                <Field label="Published Date" value={viewing.publishedAt} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Author Name" value={viewing.authorName} />
                <Field label="Author Role" value={viewing.authorRole} />
              </div>
              <Field label="Cover Image URL" value={viewing.imageUrl} />
              {viewing.imageUrl && (
                <img src={viewing.imageUrl} alt={viewing.title} className="w-full h-40 object-cover rounded-md" />
              )}
              <Field label="Excerpt" value={viewing.excerpt} />
              {viewing.content && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content</p>
                  <p className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto border rounded-md p-2 bg-muted/30">{viewing.content}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={viewing.published ? "default" : "secondary"} className="text-xs">
                  {viewing.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">ID: {viewing.id} · Created: {new Date(viewing.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
            <Button onClick={() => { if (viewing) { setViewing(null); openEdit(viewing); } }}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required data-testid="input-post-title" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required data-testid="input-post-slug" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Travel, Wellness, Destinations…" required />
              </div>
              <div className="space-y-1.5">
                <Label>Read Time (min)</Label>
                <Input type="number" value={form.readTimeMinutes} onChange={e => setForm(f => ({ ...f, readTimeMinutes: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Published Date</Label>
                <Input type="date" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} data-testid="input-post-published-at" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Author Name</Label>
                <Input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Author Role</Label>
                <Input value={form.authorRole} onChange={e => setForm(f => ({ ...f, authorRole: e.target.value }))} placeholder="Founder, Journey Designer…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="kerala, wellness, heritage" />
            </div>
            <div className="space-y-1.5">
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Content <span className="text-muted-foreground text-xs">(HTML supported)</span></Label>
              <RichTextToolbar textareaRef={contentRef} />
              <Textarea
                ref={contentRef}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={10}
                placeholder="Write the full article content here… HTML tags are supported."
                className="rounded-t-none font-mono text-xs"
                data-testid="input-post-content"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.published} onCheckedChange={v => setForm(f => ({ ...f, published: v }))} data-testid="switch-post-published" />
              <Label className="flex items-center gap-1.5 cursor-pointer">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Published on customer site
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-post">
                {editing ? "Save Changes" : "Publish Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>This post will be permanently deleted.</AlertDialogDescription>
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
