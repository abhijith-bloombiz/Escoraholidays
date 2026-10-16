import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Compass,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAskAiAssistant,
  useGetAiStatus,
  type AiMessage,
  type AiGroundedEntity,
} from "@workspace/api-client-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  groundedEntities?: AiGroundedEntity[];
}

const DEFAULT_SUGGESTIONS = [
  "What is the best season to visit Kerala's backwaters?",
  "Tell me about tea plantations and mist in Munnar.",
  "Recommend a 7-day slow luxury journey route.",
  "How does Escora's bespoke trip planning work?",
];

export default function AiTravelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: aiStatus, isLoading: statusLoading } = useGetAiStatus();
  const askMutation = useAskAiAssistant();

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, askMutation.isPending]);

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSendMessage(textToSend?: string) {
    const rawText = textToSend ?? inputValue;
    const trimmed = rawText.trim();
    if (!trimmed || askMutation.isPending) return;

    setInputValue("");
    setLastFailedMessage(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Build history for backend (last 6 messages)
    const historyPayload: AiMessage[] = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    askMutation.mutate(
      {
        data: {
          message: trimmed,
          history: historyPayload,
        },
      },
      {
        onSuccess: (data) => {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
            suggestions: data.suggestions,
            groundedEntities: data.groundedEntities,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: (err: any) => {
          setLastFailedMessage(trimmed);
        },
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleNewConversation() {
    setMessages([]);
    setInputValue("");
    setLastFailedMessage(null);
  }

  function renderFormattedMessage(text: string) {
    // Basic markdown parsing for paragraphs and bullet points
    const paragraphs = text.split("\n\n").filter(Boolean);

    return (
      <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
        {paragraphs.map((para, idx) => {
          if (para.startsWith("- ") || para.startsWith("* ")) {
            const items = para.split("\n").filter((l) => l.trim().length > 0);
            return (
              <ul key={idx} className="list-disc pl-4 space-y-1 my-1">
                {items.map((it, i) => (
                  <li key={i}>{formatInlineMarkdown(it.replace(/^[-*]\s+/, ""))}</li>
                ))}
              </ul>
            );
          }
          return <p key={idx}>{formatInlineMarkdown(para)}</p>;
        })}
      </div>
    );
  }

  function formatInlineMarkdown(text: string) {
    // Replaces **bold** with <strong>
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  const isConfigured = aiStatus?.configured ?? true;

  return (
    <aside aria-label="Escora AI Travel Assistant" className="relative z-50">
      {/* ── Floating Launcher Button ── */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A3F2C] text-white text-xs shadow-lg cursor-pointer hover:bg-[#293D1F] transition-all border border-[#c59a58]/40 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <Sparkles className="h-3 w-3 text-[#c59a58]" />
            <span className="font-medium">Plan with Escora AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`h-12 w-12 sm:h-13 sm:w-13 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isOpen
              ? "bg-[#293D1F] text-white hover:bg-[#1A3F2C]"
              : "bg-[#1A3F2C] text-white hover:bg-[#293D1F] ring-2 ring-[#c59a58]/40 hover:scale-105"
          }`}
          aria-label={isOpen ? "Close AI Travel Assistant" : "Open Escora AI Travel Assistant"}
          title={isOpen ? "Close Assistant" : "Chat with Escora AI Travel Assistant"}
          data-testid="ai-assistant-launcher"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <div className="relative">
              <Compass className="h-6 w-6 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c59a58] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c59a58]" />
              </span>
            </div>
          )}
        </button>
      </div>

      {/* ── Main Chat Floating Panel ── */}
      {isOpen && (
        <section
          className="fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[580px] max-h-[82vh] bg-[#FEFEFE] border border-[#CCD7D2] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250 font-sans"
          data-testid="ai-assistant-panel"
          aria-modal="true"
          role="dialog"
        >
          {/* Header */}
          <header className="bg-[#1A3F2C] text-white px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-[#293D1F]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58]">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-serif text-sm font-semibold tracking-wide flex items-center gap-1.5">
                  Escora Concierge
                  <Badge className="bg-[#c59a58]/20 text-[#e6ca92] hover:bg-[#c59a58]/30 border-0 text-[9px] px-1.5 py-0 uppercase tracking-widest font-mono">
                    AI Guide
                  </Badge>
                </h2>
                <p className="text-[10px] text-white/70">
                  Bespoke Kerala Travel Specialist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Start a new conversation"
                aria-label="Start a new conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Close chat panel"
                aria-label="Close assistant panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Messages & Conversation Scroll Area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FEFEFE]"
            aria-live="polite"
            data-testid="ai-messages-container"
          >
            {/* Empty State / Welcoming Card */}
            {messages.length === 0 && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-[#F3F7F4] border border-[#CCD7D2]/60 space-y-2">
                  <div className="flex items-center gap-2 text-[#1A3F2C]">
                    <Sparkles className="h-4 w-4 text-[#c59a58]" />
                    <h3 className="font-serif font-semibold text-sm">Welcome to Escora Holidays</h3>
                  </div>
                  <p className="text-xs text-[#56664C] leading-relaxed">
                    I am your private travel concierge, grounded in Escora&apos;s verified Kerala destinations and slow-luxury journeys. How may I assist your voyage?
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#788A63] font-semibold block px-1">
                    Suggested Explorations
                  </span>
                  <div className="space-y-1.5">
                    {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        disabled={askMutation.isPending}
                        className="w-full text-left p-2.5 rounded-lg border border-[#CCD7D2]/70 bg-white hover:bg-[#F3F7F4] hover:border-[#1A3F2C]/30 text-xs text-[#293D1F] transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <span className="truncate pr-2">{suggestion}</span>
                        <ArrowRight className="h-3 w-3 text-[#788A63] group-hover:text-[#1A3F2C] shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-3.5 rounded-2xl max-w-[88%] shadow-2xs ${
                      isUser
                        ? "bg-[#1A3F2C] text-white rounded-tr-xs"
                        : "bg-[#F3F7F4] border border-[#CCD7D2]/60 text-[#293D1F] rounded-tl-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-[#56664C] font-mono">
                        <Compass className="h-3 w-3 text-[#1A3F2C]" />
                        <span>Escora Concierge</span>
                      </div>
                    )}

                    {isUser ? (
                      <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </p>
                    ) : (
                      renderFormattedMessage(m.content)
                    )}

                    {/* Grounded Entity Quick Links */}
                    {!isUser && m.groundedEntities && m.groundedEntities.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#CCD7D2]/50 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#56664C] block font-medium">
                          Relevant Escora Offerings:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.groundedEntities.map((entity, eIdx) => (
                            <Link
                              key={eIdx}
                              href={entity.url}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#CCD7D2] text-[#1A3F2C] hover:bg-[#1A3F2C] hover:text-white transition-colors"
                            >
                              <span>{entity.title}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Follow-up Suggestions from Assistant */}
                  {!isUser && m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-2 pl-1 space-y-1 w-full">
                      <div className="flex flex-wrap gap-1.5">
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sug)}
                            disabled={askMutation.isPending}
                            className="text-[11px] text-left px-2.5 py-1 rounded-full border border-[#CCD7D2] bg-white hover:bg-[#F3F7F4] text-[#3F5630] hover:text-[#1A3F2C] transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[9px] text-[#788A63] mt-1 px-1 font-mono">
                    {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {askMutation.isPending && (
              <div className="flex items-start gap-2">
                <div className="p-3 rounded-2xl rounded-tl-xs bg-[#F3F7F4] border border-[#CCD7D2]/60 text-xs text-[#56664C] flex items-center gap-2 shadow-2xs">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1A3F2C] animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1A3F2C] animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1A3F2C] animate-bounce" />
                  </div>
                  <span className="text-[11px] italic">Curating your recommendations...</span>
                </div>
              </div>
            )}

            {/* Error & Offline States */}
            {askMutation.isError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-[#293D1F] space-y-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#56664C]">
                  {lastFailedMessage
                    ? "The assistant encountered a temporary provider issue. You can retry your question or speak directly with our team."
                    : "The assistant is currently unavailable."}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {lastFailedMessage && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-[#1A3F2C]/30 text-[#1A3F2C] hover:bg-[#1A3F2C] hover:text-white"
                      onClick={() => handleSendMessage(lastFailedMessage)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  )}
                  <Link
                    href="/contact"
                    className="text-xs text-[#1A3F2C] underline hover:no-underline font-medium"
                  >
                    Contact Travel Designer →
                  </Link>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Sending Bar */}
          <footer className="p-3 bg-[#FEFEFE] border-t border-[#CCD7D2] shrink-0 space-y-1.5">
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about destinations, season, itineraries..."
                className="w-full resize-none rounded-xl border border-[#CCD7D2] px-3.5 py-2.5 pr-10 text-xs sm:text-sm bg-[#F3F7F4] text-[#293D1F] placeholder:text-[#788A63] focus:outline-none focus:ring-1 focus:ring-[#1A3F2C] focus:bg-white transition-all max-h-24"
                disabled={askMutation.isPending}
                aria-label="Ask Escora AI a travel question"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || askMutation.isPending}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#1A3F2C] text-white hover:bg-[#293D1F] disabled:opacity-30 disabled:hover:bg-[#1A3F2C] transition-colors"
                title="Send message (Enter)"
                aria-label="Send message"
                data-testid="button-send-ai-message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#788A63] px-1 font-mono">
              <span>Press Enter to send</span>
              <Link href="/plan" className="hover:underline text-[#3F5630]">
                Custom Itinerary Planner →
              </Link>
            </div>
          </footer>
        </section>
      )}
    </aside>
  );
}
