import { useState, useEffect } from "react";
import {
  useAssistJournalPost,
  useListDestinations,
  type JournalAiAssistResponse,
  type JournalAiAssistInput,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  PenTool,
  Compass,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  Eye,
  Sliders,
  FileCheck,
  Clock,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export interface AiJournalAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (fields: {
    title?: string;
    slug?: string;
    category?: string;
    excerpt?: string;
    content?: string;
    tags?: string;
    readTimeMinutes?: number;
  }) => void;
  currentArticle: {
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    content: string;
    tags: string;
    readTimeMinutes?: number;
    selectedText?: string;
  };
}

const TONE_OPTIONS = [
  { value: "slow-luxury", label: "Contemplative & Botanical" },
  { value: "poetic-evocative", label: "Poetic & Evocative (Sensory Imagery)" },
  { value: "cultural-immersive", label: "Cultural & Immersive (Heritage & Lore)" },
  { value: "practical-concise", label: "Practical & Concise (Curated Guidance)" },
];

export default function AiJournalAssistantModal({
  isOpen,
  onClose,
  onApply,
  currentArticle,
}: AiJournalAssistantModalProps) {
  const { toast } = useToast();
  const assistMutation = useAssistJournalPost();
  const { data: destinationsData } = useListDestinations();

  // Active modal tab: input requirements vs review generated draft
  const [activeTab, setActiveTab] = useState<"input" | "preview">("input");

  // Selected AI Action Mode
  const [actionMode, setActionMode] = useState<
    "generate_draft" | "suggest_metadata" | "rewrite" | "generate_seo"
  >("generate_draft");

  // Sub-action for rewrite tab
  const [rewriteSubAction, setRewriteSubAction] = useState<"rewrite" | "expand" | "shorten" | "refine">("rewrite");

  // Input fields state
  const [topic, setTopic] = useState("");
  const [destination, setDestination] = useState("");
  const [targetAudience, setTargetAudience] = useState("Travelers & couples");
  const [instructions, setInstructions] = useState("");
  const [tone, setTone] = useState<"slow-luxury" | "poetic-evocative" | "cultural-immersive" | "practical-concise">("slow-luxury");
  const [textSource, setTextSource] = useState<"selected" | "full" | "custom">("full");
  const [customTextSnippet, setCustomTextSnippet] = useState("");

  // Generated draft state (all fields editable by staff before applying)
  const [generatedDraft, setGeneratedDraft] = useState<JournalAiAssistResponse | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [editableSlug, setEditableSlug] = useState("");
  const [editableCategory, setEditableCategory] = useState("");
  const [editableExcerpt, setEditableExcerpt] = useState("");
  const [editableIntroduction, setEditableIntroduction] = useState("");
  const [editableContent, setEditableContent] = useState("");
  const [editableRefinedText, setEditableRefinedText] = useState("");
  const [editableTags, setEditableTags] = useState("");
  const [editableMetaTitle, setEditableMetaTitle] = useState("");
  const [editableMetaDescription, setEditableMetaDescription] = useState("");
  const [editableKeywords, setEditableKeywords] = useState<string[]>([]);
  const [editableReadTime, setEditableReadTime] = useState(5);

  // Content preview tab in review screen
  const [contentViewMode, setContentViewMode] = useState<"preview" | "raw">("preview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentArticle.selectedText && currentArticle.selectedText.trim()) {
        setTextSource("selected");
        setCustomTextSnippet(currentArticle.selectedText.trim());
      } else {
        setTextSource("full");
        setCustomTextSnippet(currentArticle.content || "");
      }

      if (currentArticle.title && !topic) {
        setTopic(currentArticle.title);
      }
    }
  }, [isOpen, currentArticle]);

  // When a draft is returned from AI, populate the editable state
  const handleGenerationSuccess = (data: JournalAiAssistResponse) => {
    setGeneratedDraft(data);
    setSelectedTitle(data.suggestedTitles[0] || currentArticle.title || "");
    setEditableSlug(data.suggestedSlug || currentArticle.slug || "");
    setEditableCategory(data.suggestedCategory || currentArticle.category || "Travelogue");
    setEditableExcerpt(data.suggestedExcerpt || currentArticle.excerpt || "");
    setEditableIntroduction(data.suggestedIntroduction || "");
    setEditableContent(data.draftContent || currentArticle.content || "");
    setEditableRefinedText(data.refinedText || "");
    setEditableTags(data.suggestedTags?.join(", ") || currentArticle.tags || "");
    setEditableMetaTitle(data.seo?.metaTitle || "");
    setEditableMetaDescription(data.seo?.metaDescription || "");
    setEditableKeywords(data.seo?.keywords || []);
    setEditableReadTime(data.readTimeMinutes || 5);
    setActiveTab("preview");

    toast({
      title: "Content draft generated ✨",
      description: "Review, edit, and choose which fields to apply to your editor.",
    });
  };

  const handleGenerate = () => {
    // Determine effective action
    const effectiveAction = actionMode === "rewrite" ? rewriteSubAction : actionMode;

    // Determine effective text snippet
    let effectiveSnippet = "";
    if (textSource === "selected") {
      effectiveSnippet = currentArticle.selectedText?.trim() || customTextSnippet.trim();
    } else if (textSource === "full") {
      effectiveSnippet = currentArticle.content || "";
    } else {
      effectiveSnippet = customTextSnippet.trim();
    }

    const payload: JournalAiAssistInput = {
      action: effectiveAction as any,
      topic: topic.trim() || undefined,
      destination: destination.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      instructions: instructions.trim() || undefined,
      tone,
      selectedText: effectiveSnippet || undefined,
      currentArticle: {
        title: currentArticle.title || undefined,
        slug: currentArticle.slug || undefined,
        category: currentArticle.category || undefined,
        excerpt: currentArticle.excerpt || undefined,
        content: currentArticle.content || undefined,
        tags: currentArticle.tags || undefined,
      },
    };

    assistMutation.mutate(
      { data: payload },
      {
        onSuccess: handleGenerationSuccess,
        onError: (err: any) => {
          toast({
            title: "Generation failed",
            description: err?.message || "Could not generate content. Please check AI provider configuration.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  // Safe apply handlers that update editor fields without touching database
  const handleApplyAll = () => {
    const contentToApply =
      actionMode === "rewrite" && textSource === "selected" && editableRefinedText
        ? editableRefinedText
        : editableContent;

    onApply({
      title: selectedTitle.trim() || undefined,
      slug: editableSlug.trim() || undefined,
      category: editableCategory.trim() || undefined,
      excerpt: editableExcerpt.trim() || undefined,
      content: contentToApply || undefined,
      tags: editableTags.trim() || undefined,
      readTimeMinutes: editableReadTime || 5,
    });

    toast({
      title: "Content applied to editor ✨",
      description: "Remember to save your draft or publish when you are ready.",
    });
    onClose();
  };

  const handleApplyTitleAndExcerpt = () => {
    onApply({
      title: selectedTitle.trim() || undefined,
      slug: editableSlug.trim() || undefined,
      excerpt: editableExcerpt.trim() || undefined,
      category: editableCategory.trim() || undefined,
    });
    toast({ title: "Title, slug, and excerpt applied to editor ✨" });
    onClose();
  };

  const handleApplyContentOnly = () => {
    const contentToApply =
      actionMode === "rewrite" && textSource === "selected" && editableRefinedText
        ? editableRefinedText
        : editableContent;

    onApply({
      content: contentToApply || undefined,
      readTimeMinutes: editableReadTime || 5,
    });
    toast({ title: "Article content applied to editor ✨" });
    onClose();
  };

  const handleApplySeoAndTags = () => {
    onApply({
      tags: editableTags.trim() || undefined,
    });
    toast({ title: "Tags applied to editor ✨" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-serif text-foreground">
                  AI Content Assistant
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Draft stories, refine tone, suggest headlines, or optimize SEO for articles.
                </DialogDescription>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-auto">
              <TabsList className="h-8 bg-muted/60">
                <TabsTrigger value="input" className="text-xs gap-1.5 px-3">
                  <Sliders className="h-3.5 w-3.5" />
                  Instructions
                </TabsTrigger>
                <TabsTrigger value="preview" disabled={!generatedDraft} className="text-xs gap-1.5 px-3">
                  <FileCheck className="h-3.5 w-3.5" />
                  Review Draft {generatedDraft ? "✨" : ""}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Tab 1: Input & Configuration */}
        {activeTab === "input" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Action Mode Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Select AI Editorial Capability</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionMode("generate_draft")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    actionMode === "generate_draft"
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border hover:border-muted-foreground/30 bg-card text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <PenTool className="h-3.5 w-3.5 text-primary" />
                    Draft Article
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Generate full travel story from topic &amp; destination
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionMode("suggest_metadata")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    actionMode === "suggest_metadata"
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border hover:border-muted-foreground/30 bg-card text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Titles &amp; Excerpt
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Suggest captivating headlines, excerpt leads, and opening hooks
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionMode("rewrite")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    actionMode === "rewrite"
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border hover:border-muted-foreground/30 bg-card text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Rewrite &amp; Refine
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Refine tone, expand details, shorten, or polish selected prose
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionMode("generate_seo")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    actionMode === "generate_seo"
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border hover:border-muted-foreground/30 bg-card text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <Search className="h-3.5 w-3.5 text-primary" />
                    SEO &amp; Keywords
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Generate search-optimized meta title, description &amp; tags
                  </p>
                </button>
              </div>
            </div>

            {/* Mode-Specific Options */}
            {actionMode === "rewrite" && (
              <div className="p-4 rounded-lg bg-muted/20 border border-border space-y-3">
                <Label className="text-xs font-semibold text-foreground">Refinement Action</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={rewriteSubAction === "rewrite" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setRewriteSubAction("rewrite")}
                  >
                    Editorial Tone
                  </Button>
                  <Button
                    type="button"
                    variant={rewriteSubAction === "expand" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setRewriteSubAction("expand")}
                  >
                    Expand Details
                  </Button>
                  <Button
                    type="button"
                    variant={rewriteSubAction === "shorten" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setRewriteSubAction("shorten")}
                  >
                    Shorten &amp; Distill
                  </Button>
                  <Button
                    type="button"
                    variant={rewriteSubAction === "refine" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setRewriteSubAction("refine")}
                  >
                    Custom Prompt
                  </Button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Source Text for Transformation</Label>
                    <div className="flex items-center gap-1 text-[11px]">
                      {currentArticle.selectedText && (
                        <button
                          type="button"
                          onClick={() => {
                            setTextSource("selected");
                            setCustomTextSnippet(currentArticle.selectedText || "");
                          }}
                          className={`px-2 py-0.5 rounded ${
                            textSource === "selected" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          Selection ({currentArticle.selectedText.length} chars)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setTextSource("full");
                          setCustomTextSnippet(currentArticle.content || "");
                        }}
                        className={`px-2 py-0.5 rounded ${
                          textSource === "full" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        Full Article
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextSource("custom")}
                        className={`px-2 py-0.5 rounded ${
                          textSource === "custom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        Custom Text
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={customTextSnippet}
                    onChange={(e) => setCustomTextSnippet(e.target.value)}
                    rows={4}
                    placeholder="Enter or paste the text snippet you wish to rewrite or refine..."
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {/* Topic & Story Focus */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-topic" className="text-xs font-semibold">
                    Article Topic or Angle
                  </Label>
                  <Input
                    id="ai-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Monsoon Ayurvedic Retreats in Wayanad"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">The narrative theme or destination experience</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ai-destination" className="text-xs font-semibold">
                    Target Kerala Region / Destination
                  </Label>
                  <div className="space-y-1">
                    <Input
                      id="ai-destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Munnar, Kumarakom, Fort Kochi..."
                      className="text-xs"
                    />
                    {destinationsData && destinationsData.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {destinationsData.slice(0, 5).map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDestination(d.name)}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-emerald-600 text-muted-foreground hover:text-foreground"
                          >
                            {d.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-audience" className="text-xs font-semibold">
                    Target Audience / Reader Persona
                  </Label>
                  <Input
                    id="ai-audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Slow-travel couples, botanical wellness seekers"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ai-tone" className="text-xs font-semibold">
                    Editorial Tone
                  </Label>
                  <Select value={tone} onValueChange={(val: any) => setTone(val)}>
                    <SelectTrigger id="ai-tone" className="text-xs h-9">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ai-instructions" className="text-xs font-semibold">
                  Staff Editorial Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="ai-instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on early morning boat departures, local cardamom harvesting, stillness, and private courtyard dining..."
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Give specific instructions on sensory notes, cultural context, or pacing.
                </p>
              </div>
            </div>

            {/* Safeguard Assurance Notice */}
            <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Content Verification &amp; Editorial Guidelines</p>
                <p>
                  Destination details are verified against Escora&apos;s active catalog. AI outputs are drafts that you can review and edit before applying.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Review Generated Draft & Apply Safeguards */}
        {activeTab === "preview" && generatedDraft && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Draft Safeguards Notice */}
            <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">Draft Review &amp; Staff Edit Safeguard</p>
                  <p className="text-muted-foreground">
                    This content has not been saved or published. You can edit every field below before applying it to the article form.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                Action: {generatedDraft.action}
              </Badge>
            </div>

            {/* Unverified Claims Warning (if any) */}
            {generatedDraft.unverifiedClaims && generatedDraft.unverifiedClaims.length > 0 && (
              <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/30 text-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <AlertTitle className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Factual Claims Requiring Editorial Verification
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      {generatedDraft.unverifiedClaims.map((claim, idx) => (
                        <li key={idx} className="text-foreground/90">
                          {claim}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Verified Catalog Grounding */}
            {generatedDraft.verifiedCatalogMatches && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
                  Matched Destination &amp; Journey References
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {generatedDraft.verifiedCatalogMatches.destinations.map((d) => (
                    <Badge key={d.slug} variant="secondary" className="text-xs font-normal">
                      📍 {d.name} ({d.region})
                    </Badge>
                  ))}
                  {generatedDraft.verifiedCatalogMatches.packages.map((p) => (
                    <Badge key={p.slug} variant="outline" className="text-xs font-normal text-primary border-primary/25">
                      🌿 {p.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Titles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Suggested Headlines (Click to choose or edit)</Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {generatedDraft.suggestedTitles.length} variations generated
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {generatedDraft.suggestedTitles.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedTitle(t)}
                    className={`text-xs px-2.5 py-1 rounded-md border text-left transition-colors ${
                      selectedTitle === t
                        ? "bg-primary/10 border-primary text-foreground font-medium"
                        : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Input
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                placeholder="Article Title..."
                className="font-serif text-base"
              />
            </div>

            {/* Slug, Category & Read Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">URL Slug</Label>
                <Input
                  value={editableSlug}
                  onChange={(e) => setEditableSlug(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <Input
                  value={editableCategory}
                  onChange={(e) => setEditableCategory(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estimated Read Time</Label>
                <div className="flex items-center gap-2 h-9">
                  <Input
                    type="number"
                    min={1}
                    value={editableReadTime}
                    onChange={(e) => setEditableReadTime(Number(e.target.value))}
                    className="text-xs w-20"
                  />
                  <span className="text-xs text-muted-foreground">minutes read</span>
                </div>
              </div>
            </div>

            {/* Excerpt / Lead */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Lead Paragraph &amp; Preview Excerpt</Label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(editableExcerpt, "excerpt")}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {copiedField === "excerpt" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  Copy
                </button>
              </div>
              <Textarea
                value={editableExcerpt}
                onChange={(e) => setEditableExcerpt(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Article Content / Refined Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  {actionMode === "rewrite" && editableRefinedText ? "Refined Content" : "Draft Article Body (HTML)"}
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(editableContent, "content")}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2"
                  >
                    {copiedField === "content" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                    Copy HTML
                  </button>
                  <div className="flex items-center bg-muted/40 p-0.5 rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setContentViewMode("preview")}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        contentViewMode === "preview" ? "bg-background text-foreground font-medium shadow-2xs" : "text-muted-foreground"
                      }`}
                    >
                      Formatted Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentViewMode("raw")}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        contentViewMode === "raw" ? "bg-background text-foreground font-medium shadow-2xs" : "text-muted-foreground"
                      }`}
                    >
                      Raw HTML
                    </button>
                  </div>
                </div>
              </div>

              {contentViewMode === "preview" ? (
                <div className="rounded-md border p-4 max-h-[300px] overflow-y-auto bg-card text-foreground">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed space-y-3
                      [&>h2]:font-serif [&>h2]:text-lg [&>h2]:text-foreground [&>h2]:mt-3 [&>h2]:mb-1
                      [&>p]:text-muted-foreground [&>p]:text-xs [&>p]:leading-relaxed
                      [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-foreground [&>blockquote]:bg-primary/5 [&>blockquote]:py-1.5 [&>blockquote]:px-2.5 [&>blockquote]:rounded-r
                      [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:text-xs"
                    dangerouslySetInnerHTML={{ __html: editableContent }}
                  />
                </div>
              ) : (
                <Textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows={10}
                  className="font-mono text-xs leading-relaxed"
                />
              )}
            </div>

            {/* SEO Metadata Box */}
            <div className="p-4 rounded-lg bg-muted/20 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-emerald-600" />
                  SEO Metadata &amp; Keywords
                </span>
                <span className="text-[11px] text-muted-foreground">Search Engine Snippet Optimization</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Meta Title</Label>
                  <span className={`text-[10px] font-mono ${editableMetaTitle.length > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {editableMetaTitle.length} / 60 characters
                  </span>
                </div>
                <Input
                  value={editableMetaTitle}
                  onChange={(e) => setEditableMetaTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Meta Description</Label>
                  <span className={`text-[10px] font-mono ${editableMetaDescription.length > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {editableMetaDescription.length} / 160 characters
                  </span>
                </div>
                <Textarea
                  value={editableMetaDescription}
                  onChange={(e) => setEditableMetaDescription(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Suggested Filter Tags</Label>
                <Input
                  value={editableTags}
                  onChange={(e) => setEditableTags(e.target.value)}
                  placeholder="comma-separated tags..."
                  className="text-xs"
                />
              </div>

              {editableKeywords.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Search Keywords:</span>
                  <div className="flex flex-wrap gap-1">
                    {editableKeywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-mono">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Editorial Advice */}
            {generatedDraft.editorialAdvice && (
              <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                <strong className="text-foreground block mb-0.5">Editorial Curator Guidance:</strong>
                {generatedDraft.editorialAdvice}
              </div>
            )}
          </div>
        )}

        {/* Footer with Safeguard Actions */}
        <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 flex items-center justify-between gap-2">
          {activeTab === "input" ? (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={assistMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {assistMutation.isPending ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 mr-2 animate-spin" /> Generating Draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate with AI
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("input")}
                className="text-xs"
              >
                ← Back to Instructions
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyTitleAndExcerpt}
                  className="text-xs"
                >
                  Apply Titles Only
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyContentOnly}
                  className="text-xs"
                >
                  Apply Body Only
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyAll}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Apply All to Editor
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
