import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  X,
  Send,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Search,
  Paperclip,
  Map,
  Navigation,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const POPULAR_DESTINATIONS = [
  { name: "Alleppey", slug: "alleppey" },
  { name: "Kumarakom", slug: "kumarakom" },
  { name: "Kovalam", slug: "kovalam" },
  { name: "Bekal", slug: "bekal" },
];

const DEFAULT_SUGGESTIONS = [
  "What is the ideal time of year to visit Alleppey?",
  'Tell me about the "The Malabar Escape" journey route.',
  "How can I design a bespoke private itinerary with Escora?",
];

function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C12 7.523 7.523 12 2 12C7.523 12 12 16.477 12 22C12 16.477 16.477 12 22 12C16.477 12 12 7.523 12 2Z" />
    </svg>
  );
}

export default function AiTravelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: aiStatus } = useGetAiStatus();
  const askMutation = useAskAiAssistant();

  // Track whether user is near the bottom to preserve manual scroll position
  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceToBottom <= threshold;
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    if (!isOpen) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.role === "user";

    if (isUserMessage) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      isNearBottomRef.current = true;
    } else if (isNewMessage || askMutation.isPending) {
      if (isNearBottomRef.current) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, isOpen, askMutation.isPending]);

  // Initial scroll to bottom when opening
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        isNearBottomRef.current = true;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
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

  // Close AI Assistant on Outside Click / Tap
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;

      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }
      if (launcherRef.current && launcherRef.current.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
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
        onError: () => {
          setLastFailedMessage(trimmed);
        },
      }
    );
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleNewConversation() {
    setMessages([]);
    setInputValue("");
    setLastFailedMessage(null);
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputValue((prev) =>
        prev ? `${prev} [Attached: ${file.name}]` : `[Attached: ${file.name}] `
      );
    }
  };

  function renderFormattedMessage(text: string) {
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
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[#162B1F]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  }

  return (
    <aside aria-label="Escora AI Travel Assistant">
      {/* ── Floating Launcher Button (Bottom-Left) ── */}
      <div ref={launcherRef} className="escora-ai-launcher fixed bottom-6 left-6 z-[520] flex items-center group">
        {!isOpen && (
          <span
            className="pointer-events-none absolute bottom-[calc(100%+10px)] left-0 sm:left-1/2 sm:-translate-x-1/2 hidden sm:group-hover:inline-flex items-center px-2.5 py-1 text-[11.5px] font-medium tracking-wide text-[#1F382B] bg-[#F8FAF8] border border-[#CCD7D2] rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 z-50 select-none"
            role="tooltip"
          >
            Escora AI Assistant
          </span>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`escora-ai-btn relative h-14 w-14 sm:h-[58px] sm:w-[58px] rounded-full flex items-center justify-center transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F382B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf6ee] cursor-pointer shadow-[0_8px_24px_-4px_rgba(20,38,28,0.20),0_2px_8px_rgba(0,0,0,0.06)] hover:scale-105 hover:shadow-[0_12px_28px_-2px_rgba(20,38,28,0.30)] border ${
            isOpen
              ? "bg-[#1F382B] text-white border-[#1F382B]"
              : "bg-[#F8FAF8] text-[#1F382B] border-[#CCD7D2] hover:border-[#A8BDB2]"
          }`}
          aria-label={isOpen ? "Close Escora AI Assistant" : "Ask Escora — AI Travel Assistant"}
          title={isOpen ? "Close Assistant" : "Escora AI Assistant"}
          data-testid="ai-assistant-launcher"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white transition-transform duration-200" strokeWidth={2} />
          ) : (
            <SparkleIcon className="h-6 w-6 sm:h-7 sm:w-7 text-[#1F382B] transition-transform duration-300 group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* ── Main Chat Floating Panel (Bottom-Left) ── */}
      {isOpen && (
        <section
          ref={panelRef}
          className="escora-ai-panel fixed bottom-20 left-4 sm:bottom-24 sm:left-6 z-[530] w-[calc(100vw-32px)] sm:w-[420px] h-[640px] max-h-[85vh] bg-[#F8FAF8] border border-[#CCD7D2] rounded-[26px] shadow-[0_16px_48px_-8px_rgba(20,38,28,0.18),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250 font-sans box-border"
          data-testid="ai-assistant-panel"
          aria-modal="true"
          role="dialog"
        >
          {/* Header */}
          <header className="bg-[#F8FAF8] px-5 py-4 flex items-center justify-between shrink-0 border-b border-[#E3ECE7]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#1F382B] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <SparkleIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h2 className="font-['Inter',sans-serif] text-[17px] sm:text-[18px] font-semibold text-[#293D1F] leading-snug tracking-normal truncate">
                  Escora AI Assistant
                </h2>
                <p className="font-['Inter',sans-serif] text-[13px] sm:text-[13.5px] font-normal text-[#5A6E62] leading-snug mt-0.5 truncate">
                  Your Kerala Travel Companion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleNewConversation}
                className="w-8 h-8 rounded-full border border-[#DDE6E1] bg-transparent hover:bg-[#EEF3EE] hover:border-[#CCD7D2] text-[#4E6054] flex items-center justify-center transition-colors"
                title="Start a new conversation"
                aria-label="Start a new conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-[#DDE6E1] bg-transparent hover:bg-[#EEF3EE] hover:border-[#CCD7D2] text-[#4E6054] flex items-center justify-center transition-colors"
                title="Close chat panel"
                aria-label="Close assistant panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Messages & Conversation Scroll Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="escora-ai-messages flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4"
            aria-live="polite"
            data-testid="ai-messages-container"
          >
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="space-y-4 pt-1">
                {/* Welcome Message with Avatar */}
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#EEF3EF] border border-[#D6E1DA] flex items-center justify-center shrink-0 text-[#1F382B] mt-0.5">
                    <SparkleIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-[#F0F4F1] border border-[#E0E9E3] text-[#1F382B] text-xs sm:text-[13px] leading-relaxed space-y-3 shadow-2xs">
                    <p>
                      Hello! I&apos;m your <strong className="font-semibold text-[#162B1F]">Escora AI Assistant</strong>.<br />
                      I can help you:
                    </p>

                    <div className="space-y-2.5 pt-0.5">
                      <Link
                        href="/journeys"
                        className="flex items-center gap-2.5 text-[#2D4235] hover:text-[#162B1F] transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/80 border border-[#D8E3DC] flex items-center justify-center shrink-0 text-[#2D4235] group-hover:bg-white group-hover:border-[#1F382B]/30 transition-colors">
                          <Map className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[12px] sm:text-[12.5px]">
                          Explore the full journeys catalog for day-by-day details
                        </span>
                      </Link>

                      <Link
                        href="/destinations"
                        className="flex items-center gap-2.5 text-[#2D4235] hover:text-[#162B1F] transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/80 border border-[#D8E3DC] flex items-center justify-center shrink-0 text-[#2D4235] group-hover:bg-white group-hover:border-[#1F382B]/30 transition-colors">
                          <Navigation className="w-3.5 h-3.5 rotate-45" />
                        </div>
                        <span className="text-[12px] sm:text-[12.5px]">
                          Browse all verified destinations
                        </span>
                      </Link>

                      <Link
                        href="/contact"
                        className="flex items-center gap-2.5 text-[#2D4235] hover:text-[#162B1F] transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/80 border border-[#D8E3DC] flex items-center justify-center shrink-0 text-[#2D4235] group-hover:bg-white group-hover:border-[#1F382B]/30 transition-colors">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[12px] sm:text-[12.5px]">
                          Connect with a travel designer for personalized guidance
                        </span>
                      </Link>
                    </div>

                    <p className="text-[#3E5246] pt-1">
                      We look forward to curating a memorable, unhurried Kerala experience just for you.
                    </p>
                  </div>
                </div>

                {/* Popular Destinations */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] tracking-[0.14em] text-[#64756A] font-medium uppercase block px-1">
                    POPULAR DESTINATIONS
                  </span>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {POPULAR_DESTINATIONS.map((dest) => (
                      <Link
                        key={dest.slug}
                        href={`/destinations/${dest.slug}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D6E1DA] text-[#223A2C] text-xs font-medium hover:bg-[#EEF3EF] hover:border-[#CCD7D2] transition-colors shadow-2xs"
                      >
                        <span>{dest.name}</span>
                        <ExternalLink className="w-3 h-3 text-[#64756A] shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Try Asking / Suggested Questions */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2.5 pt-1 px-1">
                    <span className="text-[10px] tracking-[0.14em] text-[#64756A] font-medium uppercase shrink-0">
                      TRY ASKING
                    </span>
                    <div className="h-px bg-[#E2EAE5] flex-1" />
                  </div>
                  <div className="space-y-2">
                    {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(suggestion)}
                        disabled={askMutation.isPending}
                        className="w-full text-left px-4 py-2.5 rounded-full border border-[#DDE6E1] bg-white hover:bg-[#EEF3EE] hover:border-[#CCD7D2] text-xs sm:text-[12.5px] text-[#223A2C] transition-colors flex items-center gap-2.5 shadow-2xs group"
                      >
                        <Search className="w-3.5 h-3.5 text-[#5E7266] shrink-0 group-hover:text-[#1F382B] transition-colors" />
                        <span className="truncate">{suggestion}</span>
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
                  {isUser ? (
                    <div className="p-3.5 rounded-2xl rounded-tr-xs max-w-[85%] bg-[#1F382B] text-white shadow-2xs">
                      <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 w-full">
                      <div className="w-8 h-8 rounded-full bg-[#EEF3EF] border border-[#D6E1DA] flex items-center justify-center shrink-0 text-[#1F382B] mt-0.5">
                        <SparkleIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 space-y-1.5 max-w-[88%]">
                        <div className="p-3.5 rounded-2xl rounded-tl-xs bg-[#F0F4F1] border border-[#E0E9E3] text-[#1F382B] shadow-2xs">
                          {renderFormattedMessage(m.content)}

                          {/* Grounded Entity Quick Links */}
                          {m.groundedEntities && m.groundedEntities.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-[#D8E3DC] space-y-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-[#5A6E62] block font-medium">
                                Verified Escora Offerings:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.groundedEntities.map((entity, eIdx) => (
                                  <Link
                                    key={eIdx}
                                    href={entity.url}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-[#D6E1DA] text-[#1F382B] hover:bg-[#1F382B] hover:text-white transition-colors"
                                  >
                                    <span>{entity.title}</span>
                                    <ExternalLink className="h-2.5 w-2.5 text-[#5A6E62]" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Follow-up Suggestions from Assistant */}
                        {m.suggestions && m.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.suggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleSendMessage(sug)}
                                disabled={askMutation.isPending}
                                className="text-[11px] text-left px-3 py-1 rounded-full border border-[#D6E1DA] bg-white hover:bg-[#EEF3EF] text-[#223A2C] transition-colors shadow-2xs"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <span className="text-[9.5px] text-[#7A8C81] mt-1 px-1 font-normal">
                    {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {askMutation.isPending && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EEF3EF] border border-[#D6E1DA] flex items-center justify-center shrink-0 text-[#1F382B]">
                  <SparkleIcon className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-xs bg-[#F0F4F1] border border-[#E0E9E3] text-xs text-[#5A6E62] flex items-center gap-2 shadow-2xs">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1F382B] animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1F382B] animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1F382B] animate-bounce" />
                  </div>
                  <span className="text-[11px]">Curating your recommendations...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {askMutation.isError && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-[#293D1F] space-y-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">Notice</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-[#56664C]">
                  {lastFailedMessage
                    ? "The assistant encountered a temporary provider issue. You can retry your question or speak directly with our team."
                    : "The assistant is currently unavailable."}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {lastFailedMessage && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-[#1F382B]/30 text-[#1F382B] hover:bg-[#1F382B] hover:text-white"
                      onClick={() => handleSendMessage(lastFailedMessage)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  )}
                  <Link
                    href="/contact"
                    className="text-xs text-[#1F382B] underline hover:no-underline font-medium"
                  >
                    Contact Travel Designer →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Input & Sending Bar */}
          <footer className="p-3.5 bg-[#F8FAF8] border-t border-[#E3ECE7] shrink-0 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />
            <div className="relative flex items-center bg-white border border-[#D2DDD7] rounded-full p-1.5 pl-2.5 pr-1.5 focus-within:border-[#1F382B] transition-colors shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#EEF3EF] flex items-center justify-center shrink-0 text-[#1F382B]">
                <SparkleIcon className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask about destinations, season, itineraries..."
                className="w-full bg-transparent border-0 text-xs sm:text-[13px] text-[#1F382B] placeholder:text-[#7A8C81] focus:outline-none px-2.5 py-1"
                disabled={askMutation.isPending}
                aria-label="Ask Escora AI a travel question"
              />
              <button
                type="button"
                onClick={handleAttachmentClick}
                className="p-1.5 rounded-full text-[#5E7266] hover:text-[#1F382B] transition-colors shrink-0"
                title="Attach file or note"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || askMutation.isPending}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1F382B] text-white hover:bg-[#16291F] disabled:opacity-30 disabled:hover:bg-[#1F382B] transition-colors flex items-center justify-center shrink-0 shadow-xs"
                title="Send message (Enter)"
                aria-label="Send message"
                data-testid="button-send-ai-message"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10.5px] text-[#6E8074] px-2 font-normal">
              <span>Press Enter to send</span>
              <Link
                href="/plan"
                className="hover:underline text-[#243C2E] font-medium transition-colors"
              >
                Custom Itinerary Planner →
              </Link>
            </div>
          </footer>
        </section>
      )}
    </aside>
  );
}
