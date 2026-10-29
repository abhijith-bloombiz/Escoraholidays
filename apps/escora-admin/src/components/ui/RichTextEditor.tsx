import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Link as LinkIcon,
  Unlink,
  Table as TableIcon,
  Quote,
  Minus,
  Palette,
  Highlighter,
  Undo2,
  Redo2,
  RemoveFormatting,
  Smile,
  ChevronDown,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeRichDescriptionHtml } from "@/lib/itinerary";

export interface RichTextEditorRef {
  focus: () => void;
  getHtml: () => string;
  setHtml: (html: string) => void;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
}

// Preset Text Colors tailored for luxury travel itineraries
const PRESET_TEXT_COLORS = [
  { name: "Forest Green", value: "#1A3326" },
  { name: "Luxury Gold", value: "#CAA052" },
  { name: "Dark Bronze", value: "#493414" },
  { name: "Charcoal", value: "#161F18" },
  { name: "Neutral Gray", value: "#4B5563" },
  { name: "Muted Slate", value: "#6B7280" },
  { name: "Deep Navy", value: "#1E3A8A" },
  { name: "Ocean Blue", value: "#0284C7" },
  { name: "Emerald", value: "#15803D" },
  { name: "Amber", value: "#D97706" },
  { name: "Crimson", value: "#DC2626" },
  { name: "Pure Black", value: "#000000" },
];

// Preset Background Highlight Colors
const PRESET_HIGHLIGHT_COLORS = [
  { name: "Warm Gold", value: "#FEF3C7" },
  { name: "Mint Green", value: "#DCFCE7" },
  { name: "Soft Sky", value: "#E0F2FE" },
  { name: "Peach", value: "#FFEDD5" },
  { name: "Rose", value: "#FFE4E6" },
  { name: "Lavender", value: "#F3E8FF" },
  { name: "Soft Gray", value: "#F3F4F6" },
];

// Special Characters & Symbols Categorized
const SPECIAL_CHAR_GROUPS = [
  {
    category: "Currency",
    chars: ["₹", "$", "€", "£", "¥", "AED ", "SAR ", "د.إ", "﷼"],
  },
  {
    category: "Travel & Badges",
    chars: ["✓", "✕", "★", "☆", "✈", "🏖", "🌴", "🏨", "🚗", "🛳", "📍", "⏱", "☕", "🍽"],
  },
  {
    category: "Arrows & Pointers",
    chars: ["→", "←", "↑", "↓", "↔", "⇒", "➜", "➤", "▸", "•", "◦"],
  },
  {
    category: "Typography & Legal",
    chars: ["©", "®", "™", "—", "–", "…", "“", "”", "‘", "’", "«", "»", "•", "·"],
  },
  {
    category: "Math & Metrics",
    chars: ["°", "±", "²", "³", "½", "¼", "¾", "%", "‰", "≠", "≈", "≤", "≥", "×", "÷"],
  },
];

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "Describe the day's journey, cultural highlights, sightseeing, and scenic transfers...",
      minHeight = "140px",
      className = "",
      disabled = false,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);

    // Active state tracker for buttons
    const [activeFormats, setActiveFormats] = useState({
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      superscript: false,
      subscript: false,
      unorderedList: false,
      orderedList: false,
      alignLeft: false,
      alignCenter: false,
      alignRight: false,
      alignJustify: false,
    });

    const [currentHeading, setCurrentHeading] = useState<string>("p");
    const [currentFontFamily, setCurrentFontFamily] = useState<string>("default");
    const [currentFontSize, setCurrentFontSize] = useState<string>("default");
    const [currentFontWeight, setCurrentFontWeight] = useState<string>("default");
    const [customTextColor, setCustomTextColor] = useState<string>("#1A3326");
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Link modal state
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(true);

    // Table modal state
    const [isTablePopoverOpen, setIsTablePopoverOpen] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [tableHasHeader, setTableHasHeader] = useState(true);

    // Special Char popover
    const [isSpecialCharOpen, setIsSpecialCharOpen] = useState(false);

    // Save Selection before opening modal/popover
    const saveSelection = useCallback(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }, []);

    // Restore Selection when modal/popover confirms
    const restoreSelection = useCallback(() => {
      const sel = window.getSelection();
      if (sel && savedRangeRef.current) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }, []);

    // Synchronize external value with contentEditable innerHTML
    useEffect(() => {
      if (!editorRef.current) return;
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        const sanitized = sanitizeRichDescriptionHtml(value);
        if (!sanitized) {
          editorRef.current.innerHTML = "";
        } else if (!/<[a-z][\s\S]*>/i.test(sanitized)) {
          // Legacy plain text: split newlines to <p>
          const paragraphs = sanitized
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p) => `<p>${p}</p>`)
            .join("");
          editorRef.current.innerHTML = paragraphs || `<p>${sanitized}</p>`;
        } else {
          editorRef.current.innerHTML = sanitized;
        }
      }
    }, [value]);

    // Handle Content Changes
    const handleInput = useCallback(() => {
      if (!editorRef.current || !onChange) return;
      const html = editorRef.current.innerHTML;
      // If only empty <p><br></p>, treat as empty string
      if (html === "<p><br></p>" || html === "<p></p>" || html === "<br>") {
        onChange("");
      } else {
        onChange(html);
      }
      updateActiveFormats();
    }, [onChange]);

    // Update active toolbar button highlights based on selection
    const updateActiveFormats = useCallback(() => {
      if (typeof document === "undefined") return;
      try {
        setActiveFormats({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          strikeThrough: document.queryCommandState("strikeThrough"),
          superscript: document.queryCommandState("superscript"),
          subscript: document.queryCommandState("subscript"),
          unorderedList: document.queryCommandState("insertUnorderedList"),
          orderedList: document.queryCommandState("insertOrderedList"),
          alignLeft: document.queryCommandState("justifyLeft"),
          alignCenter: document.queryCommandState("justifyCenter"),
          alignRight: document.queryCommandState("justifyRight"),
          alignJustify: document.queryCommandState("justifyFull"),
        });

        // Detect parent block tag for Heading
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          let node: Node | null = sel.anchorNode;
          if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
          }
          if (node && node instanceof HTMLElement) {
            const tag = node.closest("h1, h2, h3, h4, p, blockquote")?.tagName.toLowerCase();
            setCurrentHeading(tag || "p");
          }
        }
      } catch {
        // Safe fallback
      }
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      getHtml: () => editorRef.current?.innerHTML || "",
      setHtml: (newHtml: string) => {
        if (editorRef.current) {
          const cleaned = sanitizeRichDescriptionHtml(newHtml);
          editorRef.current.innerHTML = cleaned;
          onChange?.(cleaned);
        }
      },
    }));

    // Standard execCommand wrapper
    const exec = (command: string, valueArg: string | undefined = undefined) => {
      if (disabled) return;
      editorRef.current?.focus();
      document.execCommand(command, false, valueArg);
      handleInput();
    };

    // Apply Format Block (Heading / Paragraph)
    const handleHeadingChange = (tag: string) => {
      if (disabled) return;
      editorRef.current?.focus();
      if (tag === "p") {
        document.execCommand("formatBlock", false, "<p>");
      } else {
        document.execCommand("formatBlock", false, `<${tag}>`);
      }
      setCurrentHeading(tag);
      handleInput();
    };

    // Apply Font Family
    const handleFontFamilyChange = (font: string) => {
      if (disabled) return;
      editorRef.current?.focus();
      if (font === "default") {
        document.execCommand("fontName", false, "inherit");
      } else {
        document.execCommand("fontName", false, font);
      }
      setCurrentFontFamily(font);
      handleInput();
    };

    // Apply Font Size
    const handleFontSizeChange = (sizePx: string) => {
      if (disabled) return;
      saveSelection();
      restoreSelection();
      editorRef.current?.focus();

      if (sizePx === "default") {
        document.execCommand("fontSize", false, "3");
      } else {
        // Use span with inline font-size to guarantee pixel-perfect styling in PDF
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const selectedText = sel.toString();
          if (selectedText) {
            const span = `<span style="font-size: ${sizePx};">${selectedText}</span>`;
            document.execCommand("insertHTML", false, span);
          }
        }
      }
      setCurrentFontSize(sizePx);
      handleInput();
    };

    // Apply Font Weight
    const handleFontWeightChange = (weight: string) => {
      if (disabled) return;
      saveSelection();
      restoreSelection();
      editorRef.current?.focus();

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const selectedText = sel.toString();
        if (selectedText) {
          const span = `<span style="font-weight: ${weight};">${selectedText}</span>`;
          document.execCommand("insertHTML", false, span);
        }
      }
      setCurrentFontWeight(weight);
      handleInput();
    };

    // Apply Text Color
    const handleTextColor = (color: string) => {
      if (disabled) return;
      saveSelection();
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand("foreColor", false, color);
      handleInput();
    };

    // Apply Background Highlighting
    const handleHighlight = (color: string | null) => {
      if (disabled) return;
      saveSelection();
      restoreSelection();
      editorRef.current?.focus();
      if (!color) {
        document.execCommand("hiliteColor", false, "transparent");
      } else {
        document.execCommand("hiliteColor", false, color);
      }
      handleInput();
    };

    // Apply Line Spacing to parent paragraph / container
    const handleLineSpacing = (spacing: string) => {
      if (disabled) return;
      editorRef.current?.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode;
        }
        if (node && node instanceof HTMLElement) {
          const block = node.closest("p, div, li, h1, h2, h3, h4, blockquote");
          if (block && block instanceof HTMLElement) {
            block.style.lineHeight = spacing;
          }
        }
      }
      handleInput();
    };

    // Toggle / Apply Blockquote
    const handleBlockquote = () => {
      if (disabled) return;
      saveSelection();
      restoreSelection();
      editorRef.current?.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        if (node && (node as HTMLElement).closest("blockquote")) {
          document.execCommand("formatBlock", false, "<p>");
          handleInput();
          return;
        }
      }
      try {
        document.execCommand("formatBlock", false, "<blockquote>");
      } catch {
        const selectedText = window.getSelection()?.toString() || "";
        const bqHtml = `<blockquote style="border-left: 3.5px solid #1A3326; padding: 6px 14px; margin: 10px 0; background-color: #F8FAF8; color: #3C4A42; font-style: italic; border-radius: 0 4px 4px 0;">${selectedText || "<br>"}</blockquote><p><br></p>`;
        document.execCommand("insertHTML", false, bqHtml);
      }
      handleInput();
    };

    // Insert Horizontal Rule
    const handleHorizontalRule = () => {
      if (disabled) return;
      editorRef.current?.focus();
      const hrHtml = `<hr style="border: none; border-top: 1px solid #D6DDD6; margin: 14px 0;" /><p><br></p>`;
      document.execCommand("insertHTML", false, hrHtml);
      handleInput();
    };

    // Insert Hyperlink Modal submission
    const handleInsertLinkSubmit = () => {
      if (!linkUrl.trim()) return;
      restoreSelection();
      editorRef.current?.focus();

      let targetUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(targetUrl) && !/^mailto:/i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }

      const displayText = linkText.trim() || targetUrl;
      const targetAttr = linkOpenInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
      const linkHtml = `<a href="${targetUrl}"${targetAttr} style="color: #1A3326; text-decoration: underline; font-weight: 600;">${displayText}</a>`;

      document.execCommand("insertHTML", false, linkHtml);
      setIsLinkDialogOpen(false);
      setLinkUrl("");
      setLinkText("");
      handleInput();
    };

    // Remove Hyperlink
    const handleUnlink = () => {
      if (disabled) return;
      editorRef.current?.focus();
      document.execCommand("unlink", false);
      handleInput();
    };

    // Insert Table
    const handleInsertTable = (rows: number, cols: number, hasHeader: boolean) => {
      restoreSelection();
      editorRef.current?.focus();

      let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #D1D5DB; font-size: 13px;">`;

      if (hasHeader) {
        tableHtml += `<thead><tr style="background-color: #F3F4F6;">`;
        for (let c = 1; c <= cols; c++) {
          tableHtml += `<th style="border: 1px solid #D1D5DB; padding: 7px 10px; font-weight: 700; color: #1A3326; text-align: left;">Header ${c}</th>`;
        }
        tableHtml += `</tr></thead>`;
      }

      tableHtml += `<tbody>`;
      const bodyRows = hasHeader ? Math.max(1, rows - 1) : rows;
      for (let r = 1; r <= bodyRows; r++) {
        tableHtml += `<tr>`;
        for (let c = 1; c <= cols; c++) {
          tableHtml += `<td style="border: 1px solid #D1D5DB; padding: 7px 10px; color: #28322B;">Item ${r}-${c}</td>`;
        }
        tableHtml += `</tr>`;
      }
      tableHtml += `</tbody></table><p><br></p>`;

      document.execCommand("insertHTML", false, tableHtml);
      setIsTablePopoverOpen(false);
      handleInput();
    };

    // Insert Special Character
    const handleInsertSpecialChar = (char: string) => {
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, char);
      setIsSpecialCharOpen(false);
      handleInput();
    };

    // Keyboard Shortcuts Handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            exec("bold");
            break;
          case "i":
            e.preventDefault();
            exec("italic");
            break;
          case "u":
            e.preventDefault();
            exec("underline");
            break;
          case "k":
            e.preventDefault();
            saveSelection();
            const selText = window.getSelection()?.toString() || "";
            setLinkText(selText);
            setLinkUrl("");
            setIsLinkDialogOpen(true);
            break;
          case "z":
            if (e.shiftKey) {
              e.preventDefault();
              exec("redo");
            } else {
              e.preventDefault();
              exec("undo");
            }
            break;
          case "y":
            e.preventDefault();
            exec("redo");
            break;
          default:
            break;
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          exec("outdent");
        } else {
          exec("indent");
        }
      }
    };

    // Paste Event Handler: Automatically cleans Microsoft Word / external copy-paste artifacts
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();

      const clipboardData = e.clipboardData;
      const pastedHtml = clipboardData.getData("text/html");
      const pastedText = clipboardData.getData("text/plain");

      if (pastedHtml) {
        const cleaned = sanitizeRichDescriptionHtml(pastedHtml);
        document.execCommand("insertHTML", false, cleaned);
      } else if (pastedText) {
        const cleaned = sanitizeRichDescriptionHtml(pastedText);
        if (cleaned.includes("\n")) {
          const formatted = cleaned
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => `<p>${line}</p>`)
            .join("");
          document.execCommand("insertHTML", false, formatted);
        } else {
          document.execCommand("insertText", false, cleaned);
        }
      }
      handleInput();
    };

    return (
      <div
        className={`border border-border/90 rounded-lg overflow-hidden bg-background shadow-xs transition-all flex flex-col ${
          isFullscreen
            ? "fixed inset-4 z-50 shadow-2xl bg-white dark:bg-neutral-950 flex flex-col"
            : ""
        } ${className}`}
      >
        {/* =========================================================================
            RICH TEXT FORMATTING TOOLBAR
        ========================================================================= */}
        <div
          className="bg-muted/30 border-b border-border/80 px-2 py-1.5 flex flex-wrap items-center gap-1 text-xs select-none sticky top-0 z-10"
          onMouseDown={(e) => {
            // Prevent toolbar clicks from causing contentEditable blur / lost selection
            if (
              (e.target as HTMLElement).tagName !== "INPUT" &&
              (e.target as HTMLElement).tagName !== "SELECT"
            ) {
              e.preventDefault();
            }
          }}
        >
          {/* GROUP 1: Undo / Redo */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
            <button
              type="button"
              onClick={() => exec("undo")}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("redo")}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* GROUP 2: Heading Selector */}
          <div className="flex items-center pr-1 border-r border-border/60">
            <select
              value={currentHeading}
              onChange={(e) => handleHeadingChange(e.target.value)}
              className="h-7 px-2 py-0 text-xs bg-background border border-input rounded hover:bg-muted/50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium"
              title="Heading Level"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
            </select>
          </div>

          {/* GROUP 3: Typography (Font Family, Font Size, Font Weight) */}
          <div className="flex items-center gap-1 pr-1 border-r border-border/60">
            {/* Font Family */}
            <select
              value={currentFontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="h-7 px-1.5 py-0 text-[11px] bg-background border border-input rounded hover:bg-muted/50 cursor-pointer focus:outline-none font-medium max-w-[110px]"
              title="Font Family"
            >
              <option value="default">Font (Default)</option>
              <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'Playfair Display', serif">Playfair (Luxury)</option>
              <option value="'Georgia', serif">Georgia</option>
              <option value="'Courier New', monospace">Monospace</option>
            </select>

            {/* Font Size */}
            <select
              value={currentFontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="h-7 px-1.5 py-0 text-[11px] bg-background border border-input rounded hover:bg-muted/50 cursor-pointer focus:outline-none font-medium"
              title="Font Size"
            >
              <option value="default">Size</option>
              <option value="11px">11px</option>
              <option value="12px">12px</option>
              <option value="13.5px">13.5px</option>
              <option value="15px">15px</option>
              <option value="18px">18px</option>
              <option value="22px">22px</option>
              <option value="28px">28px</option>
            </select>

            {/* Font Weight */}
            <select
              value={currentFontWeight}
              onChange={(e) => handleFontWeightChange(e.target.value)}
              className="h-7 px-1.5 py-0 text-[11px] bg-background border border-input rounded hover:bg-muted/50 cursor-pointer focus:outline-none font-medium"
              title="Font Weight"
            >
              <option value="default">Weight</option>
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">SemiBold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">ExtraBold (800)</option>
            </select>
          </div>

          {/* GROUP 4: Inline Text Styles (Bold, Italic, Underline, Strikethrough, Super, Sub) */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
            <button
              type="button"
              onClick={() => exec("bold")}
              title="Bold (Ctrl+B)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.bold
                  ? "bg-primary/15 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("italic")}
              title="Italic (Ctrl+I)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.italic
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("underline")}
              title="Underline (Ctrl+U)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.underline
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Underline className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("strikeThrough")}
              title="Strikethrough"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.strikeThrough
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("superscript")}
              title="Superscript (e.g. x²)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.superscript
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Superscript className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("subscript")}
              title="Subscript (e.g. H₂O)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.subscript
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Subscript className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* GROUP 5: Colors & Highlighting */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
            {/* Text Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Text Color"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2.5" align="start">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Text Color
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_TEXT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleTextColor(c.value)}
                        className="w-6 h-6 rounded border border-border/80 transition-transform hover:scale-110 cursor-pointer shadow-2xs"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-border flex items-center gap-2">
                    <Label className="text-[11px] text-muted-foreground">Custom:</Label>
                    <input
                      type="color"
                      value={customTextColor}
                      onChange={(e) => {
                        setCustomTextColor(e.target.value);
                        handleTextColor(e.target.value);
                      }}
                      className="w-7 h-6 p-0 border border-input rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {customTextColor}
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Background Highlighter */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Background Highlight"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <Highlighter className="h-3.5 w-3.5" />
                  <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2.5" align="start">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Highlight Color
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleHighlight(c.value)}
                        className="h-6 rounded border border-border/80 transition-transform hover:scale-105 cursor-pointer shadow-2xs flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      >
                        Aa
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHighlight(null)}
                    className="w-full text-xs h-7 mt-1 text-muted-foreground hover:text-foreground"
                  >
                    Clear Highlight
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* GROUP 6: Paragraph Alignment & Indent */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
            <button
              type="button"
              onClick={() => exec("justifyLeft")}
              title="Align Left"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.alignLeft
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("justifyCenter")}
              title="Align Center"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.alignCenter
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("justifyRight")}
              title="Align Right"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.alignRight
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("justifyFull")}
              title="Justify"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.alignJustify
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </button>

            {/* Line Spacing */}
            <select
              onChange={(e) => handleLineSpacing(e.target.value)}
              className="h-7 px-1.5 py-0 text-[11px] bg-background border border-input rounded hover:bg-muted/50 cursor-pointer focus:outline-none font-medium ml-0.5"
              title="Line Spacing"
              defaultValue="1.6"
            >
              <option value="1.2">1.2 (Tight)</option>
              <option value="1.4">1.4 (Standard)</option>
              <option value="1.6">1.6 (Relaxed)</option>
              <option value="1.8">1.8 (Spacious)</option>
              <option value="2.0">2.0 (Double)</option>
            </select>

            <button
              type="button"
              onClick={() => exec("outdent")}
              title="Decrease Indent"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Outdent className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("indent")}
              title="Increase Indent"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Indent className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* GROUP 7: Lists */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
            <button
              type="button"
              onClick={() => exec("insertUnorderedList")}
              title="Bulleted List"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.unorderedList
                  ? "bg-primary/15 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("insertOrderedList")}
              title="Numbered List"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                activeFormats.orderedList
                  ? "bg-primary/15 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* GROUP 8: Inserts (Link, Table, Quote, Horizontal Line, Special Chars) */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
            {/* Hyperlink */}
            <button
              type="button"
              onClick={() => {
                saveSelection();
                const sel = window.getSelection();
                setLinkText(sel ? sel.toString() : "");
                setLinkUrl("");
                setIsLinkDialogOpen(true);
              }}
              title="Insert Link (Ctrl+K)"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleUnlink}
              title="Remove Link"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Unlink className="h-3.5 w-3.5" />
            </button>

            {/* Table Inserter */}
            <Popover open={isTablePopoverOpen} onOpenChange={setIsTablePopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={() => saveSelection()}
                  title="Insert Table"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-foreground">Insert Table</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Rows</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={tableRows}
                        onChange={(e) => setTableRows(Math.max(1, Number(e.target.value) || 1))}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Columns</Label>
                      <Input
                        type="number"
                        min="1"
                        max="6"
                        value={tableCols}
                        onChange={(e) => setTableCols(Math.max(1, Number(e.target.value) || 1))}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={tableHasHeader}
                      onChange={(e) => setTableHasHeader(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    Include Header Row
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => handleInsertTable(tableRows, tableCols, tableHasHeader)}
                  >
                    Insert Table
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Blockquote */}
            <button
              type="button"
              onClick={handleBlockquote}
              title="Insert Blockquote"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>

            {/* Horizontal Line */}
            <button
              type="button"
              onClick={handleHorizontalRule}
              title="Insert Horizontal Divider"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            {/* Special Characters */}
            <Popover open={isSpecialCharOpen} onOpenChange={setIsSpecialCharOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={() => saveSelection()}
                  title="Special Characters & Symbols"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  <div className="text-xs font-semibold text-foreground">Special Characters</div>
                  {SPECIAL_CHAR_GROUPS.map((group) => (
                    <div key={group.category} className="space-y-1">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.category}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.chars.map((char) => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => handleInsertSpecialChar(char)}
                            className="w-7 h-7 flex items-center justify-center rounded border border-border text-xs hover:bg-muted hover:border-primary/50 transition-colors cursor-pointer font-sans"
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* GROUP 9: Remove Formatting & Fullscreen */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              type="button"
              onClick={() => exec("removeFormat")}
              title="Clear Formatting"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <RemoveFormatting className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* =========================================================================
            EDITABLE CONTENT CANVAS
        ========================================================================= */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          style={{ minHeight }}
          className={`p-3.5 text-sm leading-[1.65] text-foreground focus:outline-none overflow-y-auto ${
            isFullscreen ? "flex-1 p-6 text-base" : ""
          } rich-text-editor-surface`}
        />

        {/* =========================================================================
            LINK INSERTION DIALOG
        ========================================================================= */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Insert Hyperlink</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Destination URL *</Label>
                <Input
                  placeholder="https://example.com or mailto:info@example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Display Text (Optional)</Label>
                <Input
                  placeholder="Text to display"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkOpenInNewTab}
                  onChange={(e) => setLinkOpenInNewTab(e.target.checked)}
                  className="rounded text-primary focus:ring-0"
                />
                Open link in a new browser tab
              </label>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLinkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleInsertLinkSubmit}
                disabled={!linkUrl.trim()}
              >
                Insert Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Global Styles for the Editor & Table Styling */}
        <style>{`
          .rich-text-editor-surface:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
            display: block;
          }
          .rich-text-editor-surface h1 {
            font-size: 22px;
            font-weight: 800;
            color: #1A3326;
            margin: 10px 0 6px 0;
            line-height: 1.25;
          }
          .rich-text-editor-surface h2 {
            font-size: 18px;
            font-weight: 700;
            color: #1A3326;
            margin: 8px 0 5px 0;
            line-height: 1.3;
          }
          .rich-text-editor-surface h3 {
            font-size: 15px;
            font-weight: 700;
            color: #1A3326;
            margin: 6px 0 4px 0;
            line-height: 1.35;
          }
          .rich-text-editor-surface h4 {
            font-size: 13.5px;
            font-weight: 600;
            color: #1A3326;
            margin: 5px 0 3px 0;
            line-height: 1.4;
          }
          .rich-text-editor-surface p {
            margin: 0 0 6px 0;
          }
          .rich-text-editor-surface ul {
            list-style-type: disc;
            margin: 6px 0 8px 22px;
            padding-left: 0;
          }
          .rich-text-editor-surface ol {
            list-style-type: decimal;
            margin: 6px 0 8px 22px;
            padding-left: 0;
          }
          .rich-text-editor-surface li {
            margin-bottom: 2px;
          }
          .rich-text-editor-surface table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            border: 1px solid #D1D5DB;
          }
          .rich-text-editor-surface th {
            border: 1px solid #D1D5DB;
            padding: 6px 10px;
            background-color: #F3F4F6;
            font-weight: 700;
            text-align: left;
          }
          .rich-text-editor-surface td {
            border: 1px solid #D1D5DB;
            padding: 6px 10px;
          }
          .rich-text-editor-surface blockquote {
            border-left: 3.5px solid #1A3326;
            padding: 6px 14px;
            margin: 10px 0;
            background-color: #F8FAF8;
            color: #3C4A42;
            font-style: italic;
            border-radius: 0 4px 4px 0;
          }
          .rich-text-editor-surface hr {
            border: none;
            border-top: 1px solid #D6DDD6;
            margin: 14px 0;
          }
          .rich-text-editor-surface a {
            color: #1A3326;
            text-decoration: underline;
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;
