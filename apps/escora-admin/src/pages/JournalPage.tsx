import { useState, useRef, useMemo } from "react";
import {
  useListJournalPosts,
  useCreateJournalPost,
  useUpdateJournalPost,
  useDeleteJournalPost,
  getListJournalPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadField from "@/components/ImageUploadField";
import AiJournalAssistantModal from "@/components/journal/AiJournalAssistantModal";
import {
  Plus,
  Pencil,
  Trash2,
  Globe,
  Clock,
  Eye,
  Info,
  Search,
  X,
  FileText,
  BookOpen,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Check,
  Tag,
  User,
  RotateCcw,
} from "lucide-react";
import type { JournalPost } from "@workspace/api-client-react";

type Post = JournalPost;

const emptyForm = {
  title: "",
  slug: "",
  category: "Travelogue",
  excerpt: "",
  content: "",
  authorName: "",
  authorRole: "",
  authorImageUrl: "",
  imageUrl: "",
  tags: "",
  readTimeMinutes: 5,
  published: true,
  publishedAt: new Date().toISOString().split("T")[0],
};

const CATEGORY_SUGGESTIONS = [
  "Travelogue",
  "Culture",
  "Heritage",
  "Cuisine",
  "Wellness",
  "News",
  "Wildlife",
  "Architecture",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Robust native HTML sanitizer that uses the browser's DOMParser
 * to strip scripts, styles, dangerous tags, and on* event handlers,
 * while preserving safe article styling tags (h1-h6, p, blockquote, lists, links, images, tables).
 */
function sanitizeArticleHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirty, "text/html");

    const ALLOWED_TAGS = new Set([
      "P", "H1", "H2", "H3", "H4", "H5", "H6",
      "BLOCKQUOTE", "UL", "OL", "LI",
      "STRONG", "B", "EM", "I", "U", "S", "STRIKE",
      "A", "IMG", "CODE", "PRE", "HR", "BR",
      "SPAN", "DIV", "FIGURE", "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD",
    ]);

    const ALLOWED_ATTRS: Record<string, Set<string>> = {
      A: new Set(["HREF", "TARGET", "REL", "TITLE", "CLASS"]),
      IMG: new Set(["SRC", "ALT", "TITLE", "WIDTH", "HEIGHT", "CLASS", "LOADING"]),
      SPAN: new Set(["CLASS"]),
      DIV: new Set(["CLASS"]),
      BLOCKQUOTE: new Set(["CLASS"]),
      P: new Set(["CLASS"]),
      TABLE: new Set(["CLASS"]),
      TH: new Set(["CLASS", "SCOPE"]),
      TD: new Set(["CLASS"]),
      H1: new Set(["CLASS"]),
      H2: new Set(["CLASS"]),
      H3: new Set(["CLASS"]),
      H4: new Set(["CLASS"]),
      H5: new Set(["CLASS"]),
      H6: new Set(["CLASS"]),
      UL: new Set(["CLASS"]),
      OL: new Set(["CLASS"]),
      LI: new Set(["CLASS"]),
    };

    const elements = Array.from(doc.body.querySelectorAll("*"));
    for (const el of elements) {
      const tagName = el.tagName.toUpperCase();
      if (!ALLOWED_TAGS.has(tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON", "SVG"].includes(tagName)) {
          el.remove();
        } else {
          el.replaceWith(...Array.from(el.childNodes));
        }
        continue;
      }

      // Sanitize attributes
      const allowedAttrs = ALLOWED_ATTRS[tagName] || new Set();
      const attrsToRemove: string[] = [];
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        const attrName = attr.name.toUpperCase();
        if (attrName.startsWith("ON") || !allowedAttrs.has(attrName)) {
          attrsToRemove.push(attr.name);
        } else if (attrName === "HREF" || attrName === "SRC") {
          const val = attr.value.trim().toLowerCase();
          if (
            val.startsWith("javascript:") ||
            val.startsWith("data:") ||
            val.startsWith("vbscript:")
          ) {
            attrsToRemove.push(attr.name);
          }
        }
      }
      for (const a of attrsToRemove) {
        el.removeAttribute(a);
      }

      if (tagName === "A") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    }

    return doc.body.innerHTML;
  } catch (err) {
    console.error("HTML sanitization error:", err);
    return dirty.replace(/<[^>]*>/g, "");
  }
}

function formatArticleContent(content?: string | null): string {
  if (!content) return "";
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (!hasHtml) {
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
      .join("");
    return sanitizeArticleHtml(paragraphs);
  }
  return sanitizeArticleHtml(content);
}

function RichTextToolbar({
  onInsert,
  onOpenAi,
}: {
  onInsert: (before: string, after: string, defaultText?: string) => void;
  onOpenAi?: () => void;
}) {
  function handleLink() {
    const url = prompt("Enter Link URL (e.g. https://...):", "https://");
    if (!url || !url.trim()) return;
    onInsert(`<a href="${url.trim()}">`, "</a>", "link text");
  }

  const tools = [
    { label: "B", title: "Bold text (<strong>)", action: () => onInsert("<strong>", "</strong>", "bold text") },
    { label: "I", title: "Italic text (<em>)", action: () => onInsert("<em>", "</em>", "italic text") },
    { label: "H2", title: "Section Heading (<h2>)", action: () => onInsert("<h2>", "</h2>\n", "Section Heading") },
    { label: "H3", title: "Subheading (<h3>)", action: () => onInsert("<h3>", "</h3>\n", "Subheading") },
    { label: "¶", title: "Paragraph (<p>)", action: () => onInsert("<p>", "</p>\n", "Paragraph text...") },
    { label: "❝", title: "Blockquote (<blockquote>)", action: () => onInsert("<blockquote>", "</blockquote>\n", "Quote text...") },
    { label: "• List", title: "Bullet List (<ul>)", action: () => onInsert("<ul>\n  <li>", "</li>\n  <li>Second item</li>\n</ul>\n", "First item") },
    { label: "1. List", title: "Numbered List (<ol>)", action: () => onInsert("<ol>\n  <li>", "</li>\n  <li>Second item</li>\n</ol>\n", "First item") },
    { label: "🔗 Link", title: "Hyperlink (<a>)", action: handleLink },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/40 border border-b-0 rounded-t-md">
      {tools.map((t) => (
        <button
          key={t.label}
          type="button"
          title={t.title}
          onClick={t.action}
          className="px-2 py-1 text-xs font-mono font-medium rounded hover:bg-background hover:shadow-xs transition-all border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
        >
          {t.label}
        </button>
      ))}
      {onOpenAi && (
        <button
          type="button"
          title="Open AI Content Assistant to refine or rewrite"
          onClick={onOpenAi}
          className="px-2 py-1 text-xs font-mono font-medium rounded hover:bg-emerald-500/10 transition-all border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 ml-1"
        >
          <Sparkles className="h-3 w-3" /> AI Refine
        </button>
      )}
      <span className="ml-auto text-[10px] font-mono text-muted-foreground/60 hidden sm:inline">
        HTML Editor
      </span>
    </div>
  );
}

export default function JournalPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: posts, isLoading, isError, refetch } = useListJournalPosts();
  const createMutation = useCreateJournalPost();
  const updateMutation = useUpdateJournalPost();
  const deleteMutation = useDeleteJournalPost();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Dialog states
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewing, setViewing] = useState<Post | null>(null);
  const [contentTab, setContentTab] = useState<"write" | "preview">("write");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // AI Content Assistant modal state (Phase 3C)
  const [aiModalOpen, setAiModalOpen] = useState(false);

  function handleApplyAiContent(fields: {
    title?: string;
    slug?: string;
    category?: string;
    excerpt?: string;
    content?: string;
    tags?: string;
    readTimeMinutes?: number;
  }) {
    setForm((prev) => ({
      ...prev,
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.slug !== undefined ? { slug: fields.slug } : {}),
      ...(fields.category !== undefined ? { category: fields.category } : {}),
      ...(fields.excerpt !== undefined ? { excerpt: fields.excerpt } : {}),
      ...(fields.content !== undefined ? { content: fields.content } : {}),
      ...(fields.tags !== undefined ? { tags: fields.tags } : {}),
      ...(fields.readTimeMinutes !== undefined ? { readTimeMinutes: fields.readTimeMinutes } : {}),
    }));
    if (fields.slug) {
      setSlugManuallyEdited(true);
    }
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListJournalPostsQueryKey() });
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSlugManuallyEdited(false);
    setContentTab("write");
    setOpen(true);
  }

  function openEdit(p: Post) {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      category: p.category,
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      authorName: p.authorName ?? "",
      authorRole: p.authorRole ?? "",
      authorImageUrl: p.authorImageUrl ?? "",
      imageUrl: p.imageUrl ?? "",
      tags: p.tags ?? "",
      readTimeMinutes: p.readTimeMinutes ?? 5,
      published: p.published,
      publishedAt: p.publishedAt ?? new Date().toISOString().split("T")[0],
    });
    setSlugManuallyEdited(true);
    setContentTab("write");
    setOpen(true);
  }

  function handleTitleChange(val: string) {
    setForm((f) => {
      const updated = { ...f, title: val };
      if (!slugManuallyEdited && (!editing || !f.slug)) {
        updated.slug = slugify(val);
      }
      return updated;
    });
  }

  function handleInsertTag(before: string, after: string, defaultText = "") {
    const el = contentRef.current;
    if (!el) {
      setForm((f) => ({ ...f, content: (f.content || "") + before + defaultText + after }));
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const current = form.content || "";
    const selectedText = current.slice(start, end) || defaultText;
    const newContent = current.slice(0, start) + before + selectedText + after + current.slice(end);

    setForm((f) => ({ ...f, content: newContent }));

    setTimeout(() => {
      el.focus();
      const newCursorPos = start + before.length + selectedText.length;
      el.setSelectionRange(start + before.length, newCursorPos);
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!form.slug.trim()) {
      toast({ title: "Validation Error", description: "Slug is required", variant: "destructive" });
      return;
    }
    if (!form.category.trim()) {
      toast({ title: "Validation Error", description: "Category is required", variant: "destructive" });
      return;
    }

    const data = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim(),
      category: form.category.trim(),
      readTimeMinutes: Math.max(1, Number(form.readTimeMinutes) || 1),
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data },
        {
          onSuccess: (updated) => {
            invalidate();
            setOpen(false);
            if (viewing && viewing.id === editing.id) {
              setViewing(updated);
            }
            toast({ title: "Article updated successfully" });
          },
          onError: () => toast({ title: "Failed to update article", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            invalidate();
            setOpen(false);
            toast({
              title: form.published ? "Article published" : "Draft article saved",
              description: form.published
                ? "Your article is now live on the public Journal."
                : "Your draft is saved securely and hidden from public view.",
            });
          },
          onError: () => toast({ title: "Failed to create article", variant: "destructive" }),
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteTarget(null);
          if (viewing && viewing.id === id) {
            setViewing(null);
          }
          toast({ title: "Article deleted permanently" });
        },
        onError: () => toast({ title: "Failed to delete article", variant: "destructive" }),
      }
    );
  }

  // Summary counts
  const counts = useMemo(() => {
    if (!posts) return { total: 0, published: 0, draft: 0 };
    return {
      total: posts.length,
      published: posts.filter((p) => p.published).length,
      draft: posts.filter((p) => !p.published).length,
    };
  }, [posts]);

  // Categories present in current dataset
  const availableCategories = useMemo(() => {
    if (!posts) return [];
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [posts]);

  // Filtered and searched posts
  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    return posts
      .filter((p) => {
        // Search across title, category, author, tags
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchCategory = p.category.toLowerCase().includes(q);
          const matchAuthor = (p.authorName ?? "").toLowerCase().includes(q);
          const matchTags = (p.tags ?? "").toLowerCase().includes(q);
          if (!matchTitle && !matchCategory && !matchAuthor && !matchTags) {
            return false;
          }
        }

        // Status filter
        if (filterStatus === "published" && !p.published) return false;
        if (filterStatus === "draft" && p.published) return false;

        // Category filter
        if (filterCategory !== "all" && p.category !== filterCategory) return false;

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, searchTerm, filterStatus, filterCategory]);

  const hasActiveFilters = searchTerm.trim() !== "" || filterStatus !== "all" || filterCategory !== "all";

  return (
    <div data-testid="journal-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Editorial travelogues, cultural dispatches, and Kerala guides published on{" "}
            <code className="text-xs">/journal</code>.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              openCreate();
              setAiModalOpen(true);
            }}
            className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs gap-1.5 h-9"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            AI Content Assistant
          </Button>
          <Button onClick={openCreate} data-testid="button-add-post">
            <Plus className="h-4 w-4 mr-2" /> New Article
          </Button>
        </div>
      </div>

      {/* Integration & Public Usage Guide */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-serif text-base font-medium">Journal &amp; Editorial Management</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <p>
            Published articles appear on the main <strong>Escora Journal</strong> feed (<code className="text-foreground">/journal</code>) and dedicated reading pages (<code className="text-foreground">/journal/:id</code>).
          </p>
          <p>
            The most recent published post is spotlighted in the <strong>Featured Story</strong> hero slot, while subsequent posts form the editorial reading grid. Comma-separated tags automatically populate the top tag filter chips.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Publishing Note: Articles saved as draft (Published switch off) are hidden from the public feed and return a 404 for unauthenticated visitors.
          </p>
        </AlertDescription>
      </Alert>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* All Posts */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary/50 ${
            filterStatus === "all" ? "border-primary bg-primary/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus("all")}
          title="Show All Articles"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">All Articles</span>
              <p className="text-2xl font-serif font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.total}
              </p>
              <span className="text-[10px] text-muted-foreground block">Total editorial stories</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Published Posts */}
        <Card
          className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
            filterStatus === "published" ? "border-emerald-500 bg-emerald-500/5 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "published" ? "all" : "published")}
          title="Filter by Published Articles"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Published</span>
              <p className="text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.published}
              </p>
              <span className="text-[10px] text-muted-foreground block">Live on public website</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Draft Posts */}
        <Card
          className={`cursor-pointer transition-all hover:border-border/80 ${
            filterStatus === "draft" ? "border-foreground bg-muted/20 shadow-xs" : "bg-card"
          }`}
          onClick={() => setFilterStatus(filterStatus === "draft" ? "all" : "draft")}
          title="Filter by Draft Articles"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Drafts</span>
              <p className="text-2xl font-serif font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : counts.draft}
              </p>
              <span className="text-[10px] text-muted-foreground block">Private, unpublished</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-lg border border-border">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, category, author, or tags..."
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

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({counts.total})</SelectItem>
              <SelectItem value="published">Published ({counts.published})</SelectItem>
              <SelectItem value="draft">Drafts ({counts.draft})</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Select */}
          {availableCategories.length > 0 && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterCategory("all");
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
              <AlertTitle>Failed to load journal articles</AlertTitle>
              <AlertDescription className="text-xs">
                Could not connect to the database to retrieve journal stories.
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

      {/* Articles Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="min-w-[280px]">Article &amp; Story</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[150px]">Author</TableHead>
              <TableHead className="w-[100px]">Read Time</TableHead>
              <TableHead className="w-[110px]">Published</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : posts && posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-52 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-foreground">No Journal Articles Yet</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Write your first travelogue, cultural essay, or Kerala destination guide to showcase on the public website.
                    </p>
                    <Button onClick={openCreate} size="sm" className="mt-2 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Create First Article
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-6 w-6 text-muted-foreground/60" />
                    <p className="font-medium text-foreground text-sm">No matching articles found</p>
                    <p className="text-xs text-muted-foreground">
                      Try clearing your search term or selecting a different status filter.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                        setFilterCategory("all");
                      }}
                      className="mt-2 text-xs"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((p) => (
                <TableRow
                  key={p.id}
                  data-testid={`row-post-${p.id}`}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setViewing(p)}
                >
                  {/* Article Title & Thumbnail */}
                  <TableCell className="align-middle py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded border border-border overflow-hidden bg-muted/40 flex-shrink-0 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="font-serif text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                          title={p.title}
                        >
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {p.excerpt || `/${p.slug}`}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="align-middle py-3">
                    <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider">
                      {p.category}
                    </Badge>
                  </TableCell>

                  {/* Author */}
                  <TableCell className="align-middle py-3">
                    <div className="text-xs">
                      <p className="font-medium text-foreground">{p.authorName || "—"}</p>
                      {p.authorRole && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[130px]" title={p.authorRole}>
                          {p.authorRole}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Read Time */}
                  <TableCell className="align-middle py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {p.readTimeMinutes ? (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-muted-foreground/70" />
                        {p.readTimeMinutes}m read
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  {/* Published Date */}
                  <TableCell className="align-middle py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {p.publishedAt
                      ? new Date(p.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>

                  {/* Publication Status */}
                  <TableCell className="align-middle py-3">
                    {p.published ? (
                      <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-600/20 text-xs font-semibold capitalize flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs font-medium capitalize flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                        Draft
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="align-middle py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewing(p)}
                        title="View formatted article preview"
                        data-testid={`button-view-post-${p.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(p)}
                        title="Edit article"
                        data-testid={`button-edit-post-${p.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(p)}
                        title="Delete article"
                        data-testid={`button-delete-post-${p.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ============================================================
          VIEW POST MODAL — FORMATTED ARTICLE PREVIEW
      ============================================================ */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider text-primary border-primary/30">
                    {viewing?.category}
                  </Badge>
                  {viewing?.published ? (
                    <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Draft
                    </Badge>
                  )}
                  {viewing?.readTimeMinutes && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" /> {viewing.readTimeMinutes}m read
                    </span>
                  )}
                </div>
                <DialogTitle className="font-serif text-2xl font-normal leading-tight text-foreground">
                  {viewing?.title}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 text-muted-foreground flex items-center gap-3">
                  <span>Slug: <code className="text-foreground font-mono">/{viewing?.slug}</code></span>
                  <span>·</span>
                  <span>
                    Published:{" "}
                    {viewing?.publishedAt
                      ? new Date(viewing.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Unpublished draft"}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {viewing && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cover Image */}
              {viewing.imageUrl ? (
                <div className="relative h-60 w-full rounded-lg overflow-hidden border border-border bg-muted/30">
                  <img
                    src={viewing.imageUrl}
                    alt={viewing.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                      const fb = document.getElementById(`view-cover-fallback-${viewing.id}`);
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                  <div
                    id={`view-cover-fallback-${viewing.id}`}
                    style={{ display: "none" }}
                    className="w-full h-full items-center justify-center flex-col gap-2 bg-muted/40 text-muted-foreground p-4 text-center"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    <span className="text-xs">Cover image unavailable ({viewing.imageUrl})</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 w-full rounded-lg border border-dashed flex items-center justify-center gap-2 text-muted-foreground bg-muted/10 text-xs">
                  <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                  No cover image set for this article
                </div>
              )}

              {/* Author Card */}
              {(viewing.authorName || viewing.authorRole) && (
                <div className="flex items-center gap-3 p-3.5 rounded-lg bg-muted/20 border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-base font-semibold flex-shrink-0">
                    {viewing.authorName ? viewing.authorName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{viewing.authorName || "Editorial Staff"}</p>
                    <p className="text-xs text-muted-foreground">{viewing.authorRole || "Escora Journey Curator"}</p>
                  </div>
                </div>
              )}

              {/* Excerpt */}
              {viewing.excerpt && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold block">
                    Article Lead / Excerpt
                  </span>
                  <p className="text-sm font-serif italic text-foreground leading-relaxed">
                    &ldquo;{viewing.excerpt}&rdquo;
                  </p>
                </div>
              )}

              {/* Formatted Article Body */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
                  Article Body (Formatted Preview)
                </span>
                <div className="p-5 rounded-lg border border-border bg-card min-h-[160px] shadow-2xs">
                  {viewing.content ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed space-y-4
                        [&>h1]:font-serif [&>h1]:text-2xl [&>h1]:font-normal [&>h1]:text-foreground [&>h1]:mt-6 [&>h1]:mb-3
                        [&>h2]:font-serif [&>h2]:text-xl [&>h2]:font-normal [&>h2]:text-foreground [&>h2]:mt-5 [&>h2]:mb-2.5
                        [&>h3]:font-serif [&>h3]:text-lg [&>h3]:font-normal [&>h3]:text-foreground [&>h3]:mt-4 [&>h3]:mb-2
                        [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:text-sm
                        [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-foreground [&>blockquote]:bg-primary/5 [&>blockquote]:py-2.5 [&>blockquote]:px-3.5 [&>blockquote]:rounded-r
                        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ul]:text-muted-foreground [&>ul]:text-sm
                        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>ol]:text-muted-foreground [&>ol]:text-sm
                        [&>a]:text-primary [&>a]:underline [&>a]:hover:text-primary/80
                        [&>img]:rounded-md [&>img]:my-4 [&>img]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: formatArticleContent(viewing.content) }}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No article content written for this post.</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {viewing.tags && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
                    Filter Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewing.tags.split(",").map((t, idx) => {
                      const tag = t.trim();
                      if (!tag) return null;
                      return (
                        <Badge key={idx} variant="secondary" className="text-xs font-mono">
                          #{tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Public Link Notice */}
              {viewing.published && (
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border text-xs text-muted-foreground">
                  <span>Public URL on Escora: <code className="text-foreground">/journal/{viewing.id}</code></span>
                  <a
                    href={`/journal/${viewing.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    Open in Journal <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 gap-2">
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (viewing) {
                  const p = viewing;
                  setViewing(null);
                  openEdit(p);
                }
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          CREATE / EDIT POST MODAL
      ============================================================ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-serif text-2xl font-normal text-foreground">
                  {editing ? "Edit Journal Article" : "New Journal Article"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {editing
                    ? `Updating "${editing.title}" (ID: ${editing.id})`
                    : "Create a new story for the Escora travel journal"}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAiModalOpen(true)}
                className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs gap-1.5 h-8 font-medium shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                AI Assistant
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-6 space-y-6 flex-1">
              {/* Title & Slug Section */}
              <div className="space-y-4 bg-muted/10 p-4 rounded-lg border border-border">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="post-title" className="text-xs font-semibold">
                      Article Title *
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Featured headline on /journal</span>
                  </div>
                  <Input
                    id="post-title"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. The Art of Slow Travel in Kerala's Backwaters"
                    required
                    data-testid="input-post-title"
                    className="font-serif text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="post-slug" className="text-xs font-semibold">
                      URL Slug *
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const newSlug = slugify(form.title);
                        setForm((f) => ({ ...f, slug: newSlug }));
                        setSlugManuallyEdited(false);
                        toast({ title: "Slug regenerated from title" });
                      }}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono"
                    >
                      <RotateCcw className="h-3 w-3" /> Auto-generate from title
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">/journal/</span>
                    <Input
                      id="post-slug"
                      value={form.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setForm((f) => ({ ...f, slug: e.target.value }));
                      }}
                      placeholder="slow-travel-kerala-backwaters"
                      required
                      data-testid="input-post-slug"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Category, Read Time, Published Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="post-category" className="text-xs font-semibold">
                    Category *
                  </Label>
                  <div className="space-y-1.5">
                    <Input
                      id="post-category"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="Travelogue, Wellness, Culture..."
                      required
                      className="text-xs"
                    />
                    <div className="flex flex-wrap gap-1">
                      {CATEGORY_SUGGESTIONS.slice(0, 5).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, category: cat }))}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-primary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="post-readtime" className="text-xs font-semibold">
                    Read Time (Minutes)
                  </Label>
                  <Input
                    id="post-readtime"
                    type="number"
                    min={1}
                    value={form.readTimeMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, readTimeMinutes: Number(e.target.value) }))}
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">Estimated read badge (e.g. 5m read)</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="post-date" className="text-xs font-semibold">
                    Publication Date
                  </Label>
                  <Input
                    id="post-date"
                    type="date"
                    value={form.publishedAt}
                    onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                    data-testid="input-post-published-at"
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">Date displayed on article card</p>
                </div>
              </div>

              {/* Author Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="post-author" className="text-xs font-semibold">
                    Author Name
                  </Label>
                  <Input
                    id="post-author"
                    value={form.authorName}
                    onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                    placeholder="e.g. Priya Menon"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Displayed byline and author attribution</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="post-role" className="text-xs font-semibold">
                    Author Role / Title
                  </Label>
                  <Input
                    id="post-role"
                    value={form.authorRole}
                    onChange={(e) => setForm((f) => ({ ...f, authorRole: e.target.value }))}
                    placeholder="e.g. Senior Curator · Journeys"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Subtitle shown in author card bio</p>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-1.5">
                <ImageUploadField
                  value={form.imageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  label="Article Cover Image"
                  size="wide"
                  helperText="Primary banner photograph displayed on the /journal cards and article header. Supports JPEG, PNG, WebP, AVIF up to 10MB."
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="post-tags" className="text-xs font-semibold">
                  Tags <span className="text-muted-foreground font-normal">(comma-separated)</span>
                </Label>
                <Input
                  id="post-tags"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="kerala, backwaters, tea plantations, ayurveda"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Populates the interactive tag filters on <code className="text-foreground">/journal</code>.
                </p>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <Label htmlFor="post-excerpt" className="text-xs font-semibold">
                  Article Excerpt / Lead
                </Label>
                <Textarea
                  id="post-excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  placeholder="A short compelling introduction displayed on preview cards..."
                  className="text-sm font-sans"
                />
                <p className="text-[11px] text-muted-foreground">
                  Brief summary shown on the journal grid cards and as the article&apos;s lead paragraph.
                </p>
              </div>

              {/* Article Content with Write & Live Preview Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Article Body Content <span className="text-muted-foreground font-normal">(Rich HTML supported)</span>
                  </Label>
                  <div className="flex items-center bg-muted/40 p-0.5 rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setContentTab("write")}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        contentTab === "write"
                          ? "bg-background text-foreground font-medium shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentTab("preview")}
                      className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                        contentTab === "preview"
                          ? "bg-background text-foreground font-medium shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Eye className="h-3 w-3" /> Live Preview
                    </button>
                  </div>
                </div>

                {contentTab === "write" ? (
                  <div>
                    <RichTextToolbar onInsert={handleInsertTag} onOpenAi={() => setAiModalOpen(true)} />
                    <Textarea
                      ref={contentRef}
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      rows={12}
                      placeholder="Write your article here... HTML markup like <h2>, <p>, <blockquote>, <ul>/<li>, and <a> are supported."
                      className="rounded-t-none font-mono text-xs leading-relaxed"
                      data-testid="input-post-content"
                    />
                  </div>
                ) : (
                  <div className="rounded-md border p-5 min-h-[260px] max-h-[380px] overflow-y-auto bg-card">
                    {form.content?.trim() ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed space-y-4
                          [&>h1]:font-serif [&>h1]:text-xl [&>h1]:text-foreground
                          [&>h2]:font-serif [&>h2]:text-lg [&>h2]:text-foreground [&>h2]:mt-4 [&>h2]:mb-2
                          [&>h3]:font-serif [&>h3]:text-base [&>h3]:text-foreground
                          [&>p]:text-muted-foreground [&>p]:text-xs [&>p]:leading-relaxed
                          [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-foreground [&>blockquote]:bg-primary/5 [&>blockquote]:py-1.5 [&>blockquote]:px-2.5 [&>blockquote]:rounded-r
                          [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1 [&>ul]:text-xs
                          [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:space-y-1 [&>ol]:text-xs
                          [&>a]:text-primary [&>a]:underline"
                        dangerouslySetInnerHTML={{ __html: formatArticleContent(form.content) }}
                      />
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-muted-foreground/60 text-xs italic">
                        No content written yet. Switch back to &ldquo;Write&rdquo; to draft your article.
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Use the toolbar buttons or standard HTML tags for bold text, section headings, quotes, links, and lists.
                </p>
              </div>

              {/* Publication Status Switch */}
              <div className="p-4 rounded-lg bg-muted/20 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={form.published}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
                      data-testid="switch-post-published"
                    />
                    <Label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Publish on Customer Website
                    </Label>
                  </div>
                  {form.published ? (
                    <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                      Will be Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Will be Saved as Draft
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground pl-11">
                  {form.published
                    ? "Active: The article will be immediately visible on the public /journal page and accessible via its URL."
                    : "Draft: The article is kept private in the admin panel and hidden from public visitors."}
                </p>
              </div>
            </div>

            <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-post"
              >
                {editing
                  ? form.published
                    ? "Save Changes"
                    : "Save as Draft"
                  : form.published
                  ? "Publish Story"
                  : "Save Draft"}
              </Button>
            </DialogFooter>
          </form>
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
              Delete Journal Article?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground">&ldquo;{deleteTarget?.title}&rdquo;</strong>?
              </p>
              {deleteTarget && (
                <div className="p-3 rounded-md bg-muted/40 border text-xs text-muted-foreground space-y-1">
                  <p><strong>Category:</strong> {deleteTarget.category}</p>
                  <p><strong>Author:</strong> {deleteTarget.authorName || "Editorial Staff"}</p>
                  <p><strong>Status:</strong> {deleteTarget.published ? "Currently Published" : "Draft"}</p>
                </div>
              )}
              <p className="text-xs text-destructive">
                This action cannot be undone. The story will be permanently removed from the database and the public website.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Article
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================================
          PHASE 3C: AI JOURNAL CONTENT ASSISTANT MODAL
      ============================================================ */}
      <AiJournalAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApply={handleApplyAiContent}
        currentArticle={{
          title: form.title,
          slug: form.slug,
          category: form.category,
          excerpt: form.excerpt,
          content: form.content,
          tags: form.tags,
          readTimeMinutes: form.readTimeMinutes,
          selectedText: (() => {
            const el = contentRef.current;
            if (!el) return "";
            const start = el.selectionStart ?? 0;
            const end = el.selectionEnd ?? 0;
            return form.content?.slice(start, end) || "";
          })(),
        }}
      />
    </div>
  );
}
