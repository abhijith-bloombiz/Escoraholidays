import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Compass,
  ArrowRight,
  MapPin,
  Calendar,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Link } from 'wouter';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

const INITIAL_PROMPTS = [
  'Plan a 7-day Romantic Kerala voyage',
  'Private luxury houseboat in Alleppey',
  'Best Ayurvedic panchakarma retreat',
  'Munnar tea estates vs Wayanad rainforest',
  'Best season for Kerala backwaters'
];

// Fallback intelligent luxury knowledge engine if backend AI API is unconfigured/offline
function getIntelligentFallbackResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('honeymoon') || q.includes('romance') || q.includes('romantic') || q.includes('couple')) {
    return (
      "For a romantic Kerala voyage, our travel curators recommend a 7 to 9-night rhythm:\n\n" +
      "• **Munnar Highlands (3 Nights)**: Private cliffside pool villa nestled among mist-covered tea gardens.\n" +
      "• **Alleppey Waters (1 Night)**: Exclusive private kettuvallam (traditional houseboat) with private master suite, dedicated chef, and candlelit lagoon dining.\n" +
      "• **Marari or Kumarakom (3 Nights)**: Lakefront or beachfront heritage retreat with couple's Ayurvedic abhyanga massage.\n\n" +
      "Would you like us to open the interactive journey designer to customize this, or connect directly on WhatsApp with our concierge?"
    );
  }

  if (q.includes('houseboat') || q.includes('alleppey') || q.includes('backwater') || q.includes('kettuvallam')) {
    return (
      "Escora's private houseboats in Alleppey and Kumarakom are handcrafted wooden kettuvallams constructed with jackwood and coir, avoiding plastic.\n\n" +
      "• **Inclusions**: Dedicated captain, navigator, and private chef preparing fresh Karimeen Pollichathu, traditional Kerala banana-leaf feasts, and bespoke menus.\n" +
      "• **Route**: Quiet, untouched canals of Vembanad Lake and Champakkulam away from crowded tourist boat tracks.\n" +
      "• **Tiers**: Premium air-conditioned glass suites, rooftop sunset lounges, and evening private candlelit dining on anchored water."
    );
  }

  if (q.includes('ayurveda') || q.includes('panchakarma') || q.includes('wellness') || q.includes('heal')) {
    return (
      "Kerala is the birthplace of classical Ayurveda. Escora partners exclusively with certified physician-supervised sanctuaries:\n\n" +
      "• **Authentic Panchakarma**: 7, 14, or 21-day curative detox cycles overseen by senior Vaidyas (Ayurvedic physicians).\n" +
      "• **Therapies**: Daily Abhyanga (warm medicated herbal oil), Shirodhara (rhythmic forehead pour), and herbal steam baths tailored to your Dosha (Vata/Pitta/Kapha).\n" +
      "• **Sanctuaries**: Clifftop sanctuaries in Kovalam/Chowara, or serene lakefront retreats in Kumarakom with daily satvik organic cuisine and morning pranayama yoga."
    );
  }

  if (q.includes('munnar') || q.includes('wayanad') || q.includes('hill') || q.includes('mountain') || q.includes('tea')) {
    return (
      "Both are breathtaking highlands in the Western Ghats, each with a distinct soul:\n\n" +
      "• **Munnar (1,600m)**: Endless rolling manicured emerald tea carpets, colonial planter bungalows, Eravikulam Nilgiri Tahr sightings, and crisp morning mist.\n" +
      "• **Wayanad**: Deeper ancient rainforests, prehistoric Edakkal rock caves, wild elephant trails, and private treehouses high in the canopy.\n\n" +
      "For a classic first Kerala trip, Munnar is quintessential; for untamed bio-diversity and seclusion, choose Wayanad."
    );
  }

  if (q.includes('season') || q.includes('weather') || q.includes('when') || q.includes('time') || q.includes('month') || q.includes('december') || q.includes('october')) {
    return (
      "Kerala offers distinct luxury micro-climates across the seasons:\n\n" +
      "• **October – March (Golden Winter Peak)**: Clear blue skies, balmy backwaters, and cool, crisp highland evenings (15°C–28°C). Ideal for sightseeing and houseboats.\n" +
      "• **June – September (Monsoon & Rejuvenation)**: The verdant green season when the atmosphere is cool and dust-free, recognized as the most curative time for classical Ayurvedic Panchakarma.\n" +
      "• **April – May (Summer Serenity)**: Quiet highland retreats in Munnar/Wayanad remain comfortably cool, while beachfront pool villas offer private tranquility."
    );
  }

  if (q.includes('budget') || q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('lakh')) {
    return (
      "Escora's bespoke journeys are individually priced per guest based on seasonality and inclusions:\n\n" +
      "• **Signature Luxury (₹1L – ₹2 Lakhs / guest)**: 5-star boutique homestays, private chauffeured AC luxury MPV, private houseboat cruise.\n" +
      "• **Exclusive Sanctuaries (₹2L – ₹5 Lakhs / guest)**: Private pool villas at Taj, Oberoi, or CGH Earth, private naturalist guides, and chef's tables.\n" +
      "• **Ultra-Bespoke (₹5L+ / guest)**: Royal heritage estates, private helicopter transfers, and dedicated 24/7 personal butler."
    );
  }

  return (
    `Thank you for your interest in Kerala with Escora Holidays. ` +
    `Every voyage we craft is tailored around your individual pace, privacy, and sensory wishes. ` +
    `Would you like to design a tailored day-by-day itinerary in our Journey Studio, or speak directly with our senior travel curators on WhatsApp (+91 8157 003 344)?`
  );
}

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Namaskaram. I am Escora’s AI Travel Concierge. How may I assist your Kerala journey today? Ask me about private houseboats, highland tea estates in Munnar, Ayurvedic retreats, or let me draft your bespoke itinerary.',
      timestamp: 'Just now',
      suggestions: INITIAL_PROMPTS
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isInHero, setIsInHero] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const checkScroll = () => {
      // In the hero section (top 70% of viewport or 480px), hide the floating AI icon
      const threshold = Math.min(window.innerHeight * 0.7, 500);
      setIsInHero(window.scrollY < threshold);
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });

    // Also bind to Lenis smooth scroll if present
    let unbindLenis: (() => void) | null = null;
    const bindLenis = () => {
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.on === 'function') {
        const handler = (e: any) => {
          const y = typeof e?.scroll === 'number' ? e.scroll : window.scrollY;
          const threshold = Math.min(window.innerHeight * 0.7, 500);
          setIsInHero(y < threshold);
        };
        lenis.on('scroll', handler);
        unbindLenis = () => {
          if (lenis && typeof lenis.off === 'function') {
            lenis.off('scroll', handler);
          }
        };
        return true;
      }
      return false;
    };

    if (!bindLenis()) {
      const poll = setInterval(() => {
        if (bindLenis()) clearInterval(poll);
      }, 300);
      setTimeout(() => clearInterval(poll), 3500);
    }

    return () => {
      window.removeEventListener('scroll', checkScroll);
      if (unbindLenis) unbindLenis();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewBadge(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build conversation history for API
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content
      }));

      // Call API server /api/ai/assistant
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      if (response.ok) {
        const data = await response.json();
        const botReply = data.message || getIntelligentFallbackResponse(text);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: botReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        // Graceful fallback to rich local knowledge engine
        await new Promise((res) => setTimeout(res, 600));
        const botReply = getIntelligentFallbackResponse(text);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: botReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch {
      // Offline/network failure fallback
      await new Promise((res) => setTimeout(res, 500));
      const botReply = getIntelligentFallbackResponse(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content:
          'Conversation refreshed. How may I assist your Kerala luxury travel planning?',
        timestamp: 'Just now',
        suggestions: INITIAL_PROMPTS
      }
    ]);
  };

  return (
    <>
      {/* =================================================================== */}
      {/* FLOATING ACTION BUTTON (BOTTOM-RIGHT CORNER)                        */}
      {/* =================================================================== */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          opacity: isInHero && !isOpen ? 0 : 1,
          transform: isInHero && !isOpen ? 'translateY(16px) scale(0.85)' : 'translateY(0) scale(1)',
          pointerEvents: isInHero && !isOpen ? 'none' : 'auto',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Floating trigger button - Pure Pearl White with Signature Emerald Icon */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close AI Travel Concierge' : 'Open AI Travel Concierge'}
          title="Escora AI Travel Concierge"
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            padding: 0,
            backgroundColor: '#FFFFFF',
            color: '#183628',
            border: '1.5px solid rgba(24, 54, 40, 0.18)',
            boxShadow: '0 10px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
          }}
          className="ai-chat-trigger-btn"
        >
          {isOpen ? (
            <X size={22} color="#183628" strokeWidth={2.4} />
          ) : (
            <Sparkles size={24} color="#183628" strokeWidth={2.2} />
          )}
        </button>
      </div>

      {/* =================================================================== */}
      {/* CHAT FLYOUT DIALOG (SLIDE-UP WINDOW)                                 */}
      {/* =================================================================== */}
      {isOpen && (
        <div
          data-lenis-prevent
          className="ai-chatbot-dialog"
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            width: 'min(410px, calc(100vw - 32px))',
            height: 'min(620px, calc(100vh - 120px))',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            overscrollBehavior: 'contain',
            animation: 'aiChatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header - Signature Escora Rainforest Emerald */}
          <div
            style={{
              padding: '1.15rem 1.25rem',
              backgroundColor: '#183628',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                <Bot size={20} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <h3
                    className="font-display"
                    style={{
                      fontSize: '1rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                      margin: 0
                    }}
                  >
                    Escora AI Concierge
                  </h3>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    ONLINE
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.78)' }}>
                  Grounded Kerala Travel Intelligence
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={handleReset}
                title="Restart conversation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.65)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.65)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Bar */}
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#FAF8F5',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem'
            }}
          >
            <Link
              href="/plan"
              onClick={() => setIsOpen(false)}
              style={{
                color: '#9E6F29',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Compass size={13} /> Open Full Journey Studio
            </Link>

            <a
              href="https://wa.me/918157003344?text=Hello%20Escora%20Concierge%2C%20I%20am%20chatting%20with%20your%20AI%20and%20would%20love%20to%20connect%20with%20a%20human%20curator."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2D6A4F',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <MessageSquare size={13} /> WhatsApp
            </a>
          </div>

          {/* Chat Messages Body */}
          <div
            data-lenis-prevent
            className="ai-chatbot-messages"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{
              flexGrow: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              padding: '1rem',
              backgroundColor: '#F8F6F1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem'
            }}
          >
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '100%'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '0.85rem 1.05rem',
                      borderRadius: isAssistant ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      backgroundColor: isAssistant ? '#FFFFFF' : '#183628',
                      color: isAssistant ? '#121316' : '#FFFFFF',
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      boxShadow: isAssistant ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 4px 14px rgba(24, 54, 40, 0.25)',
                      border: isAssistant ? '1px solid rgba(212, 163, 89, 0.2)' : 'none',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {m.content}
                  </div>

                  <span
                    style={{
                      fontSize: '0.66rem',
                      color: '#8A857A',
                      marginTop: '0.25rem',
                      padding: '0 0.35rem'
                    }}
                  >
                    {m.timestamp}
                  </span>

                  {/* Suggestion Chips */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        marginTop: '0.65rem',
                        width: '100%'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: '#9E6F29'
                        }}
                      >
                        Explore Topics:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {m.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(sug)}
                            style={{
                              textAlign: 'left',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '999px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid rgba(158, 111, 41, 0.3)',
                              color: '#121316',
                              fontSize: '0.76rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            ✦ {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px 16px 16px 4px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#9E6F29',
                    display: 'inline-block',
                    animation: 'aiDotPulse 1.2s infinite ease-in-out'
                  }}
                />
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#9E6F29',
                    display: 'inline-block',
                    animation: 'aiDotPulse 1.2s infinite ease-in-out 0.2s'
                  }}
                />
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#9E6F29',
                    display: 'inline-block',
                    animation: 'aiDotPulse 1.2s infinite ease-in-out 0.4s'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: '#8A857A', marginLeft: '0.35rem' }}>
                  Escora AI Curating...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about Kerala luxury travel..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
              style={{
                flexGrow: 1,
                padding: '0.75rem 0.95rem',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: '#FAF8F5',
                fontSize: '0.86rem',
                outline: 'none',
                color: '#121316'
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: inputText.trim() && !isTyping ? '#183628' : 'rgba(0, 0, 0, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputText.trim() && !isTyping ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Global CSS keyframes for chatbot */}
      <style>{`
        @keyframes aiChatSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes aiDotPulse {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
        .ai-chat-trigger-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28) !important;
        }
        .ai-chatbot-messages {
          scrollbar-width: thin;
          scrollbar-color: rgba(24, 54, 40, 0.25) transparent;
        }
        .ai-chatbot-messages::-webkit-scrollbar {
          width: 6px;
        }
        .ai-chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-chatbot-messages::-webkit-scrollbar-thumb {
          background-color: rgba(24, 54, 40, 0.25);
          border-radius: 999px;
        }
        .ai-chatbot-messages::-webkit-scrollbar-thumb:hover {
          background-color: rgba(24, 54, 40, 0.45);
        }
        @media (max-width: 480px) {
          .ai-chatbot-dialog {
            right: 12px !important;
            left: 12px !important;
            bottom: 84px !important;
            width: auto !important;
            height: min(580px, calc(100vh - 100px)) !important;
          }
        }
      `}</style>
    </>
  );
}
