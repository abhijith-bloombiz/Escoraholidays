import Layout from "@/components/layout/Layout";
import { useState } from "react";
import { useCreateEnquiry } from "@workspace/api-client-react";
import { useSeo } from "@/hooks/useSeo";
import {
  BotanicalTopLeft,
  BotanicalTopRight,
  BotanicalBottomLeft,
  BotanicalBottomRight,
} from "@/components/BotanicalDecorations";

export default function Contact() {
  useSeo({
    title: "Contact Escora — Kerala Travel Experts, Kozhikode",
    description: "Get in touch with Escora's Kerala travel specialists in Kozhikode. Start planning your private luxury Kerala holiday — honeymoon, Ayurveda retreat, or bespoke family tour. We respond within one business day.",
    url: "https://www.escoraholidays.com/contact",
  });

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", marketingConsent: false });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const mutation = useCreateEnquiry();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    mutation.mutate(
      {
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message,
          marketingConsent: form.marketingConsent,
        } as any,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setError("Something went wrong. Please try again or email us directly."),
      }
    );
  }

  return (
    <Layout>
      <style>{`
        @keyframes botanicalFloatSlow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) rotate(0.6deg);
          }
        }
        @keyframes botanicalFloatAlt {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(6px) rotate(-0.5deg);
          }
        }
        .botanical-anim-slow {
          animation: botanicalFloatSlow 14s ease-in-out infinite;
        }
        .botanical-anim-alt {
          animation: botanicalFloatAlt 16s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .botanical-anim-slow,
          .botanical-anim-alt {
            animation: none !important;
          }
        }
      `}</style>
      <div className="relative overflow-hidden bg-bg">
        {/* Botanical Vector Decorations */}
        <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden" aria-hidden="true">
          {/* Upper-left botanical spray */}
          <BotanicalTopLeft className="absolute -top-4 -left-6 sm:top-0 sm:left-0 w-[240px] h-[250px] sm:w-[320px] sm:h-[340px] lg:w-[420px] lg:h-[440px] opacity-70 sm:opacity-80 lg:opacity-90 botanical-anim-slow" />

          {/* Upper-right botanical spray */}
          <BotanicalTopRight className="absolute -top-4 -right-6 sm:top-0 sm:right-0 w-[210px] h-[230px] sm:w-[280px] sm:h-[300px] lg:w-[380px] lg:h-[400px] opacity-65 sm:opacity-75 lg:opacity-85 botanical-anim-alt" />

          {/* Lower-left botanical spray */}
          <BotanicalBottomLeft className="absolute bottom-6 -left-6 sm:bottom-10 sm:left-0 w-[200px] h-[220px] sm:w-[260px] sm:h-[280px] lg:w-[350px] lg:h-[370px] opacity-45 sm:opacity-70 lg:opacity-80 botanical-anim-slow" />

          {/* Lower-right botanical spray */}
          <BotanicalBottomRight className="absolute bottom-2 -right-6 sm:bottom-6 sm:right-0 w-[190px] h-[210px] sm:w-[250px] sm:h-[270px] lg:w-[340px] lg:h-[360px] opacity-45 sm:opacity-70 lg:opacity-80 botanical-anim-alt" />
        </div>

        {/* Hero */}
        <section className="relative z-10 page-hero-top bg-transparent overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 60% 40%, #cbab6e 0%, transparent 60%)" }}
          />
          <div className="container mx-auto px-6 sm:px-8 max-w-4xl text-center reveal-up">
            <p className="section-label mb-6"><span className="dot" />Contact</p>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-ink font-light leading-[1.1] mb-6">
              Start a <em className="italic text-gold">conversation</em>
            </h1>
            <p className="font-sans text-ink-mute text-base leading-relaxed max-w-xl mx-auto">
              Whether you have a specific journey in mind or simply want to explore what's possible,
              we're here to help. Our team responds within one business day.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-6 sm:px-8 max-w-4xl relative z-10">
          <hr className="page-divider" />
        </div>

        {/* Content grid */}
        <section className="container mx-auto px-6 sm:px-8 max-w-4xl relative z-10" style={{ paddingBottom: "var(--section-y)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Contact details */}
          <div className="space-y-10 reveal-up">
            <div>
              <p className="section-label mb-4"><span className="dot" />Get in touch</p>
              <div className="space-y-4 font-sans text-sm">
                {[
                  { label: "Phone", value: "+91 8157 003 344", href: "tel:+918157003344" },
                  { label: "WhatsApp", value: "+91 8157 003 344", href: "https://wa.me/918157003344" },
                  { label: "Email", value: "hello@escoraholidays.com", href: "mailto:hello@escoraholidays.com" },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-4 py-4 border-b border-line">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-gold w-20 flex-shrink-0 pt-0.5">{c.label}</span>
                    <a href={c.href} className="text-ink hover:text-gold transition-colors">{c.value}</a>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="section-label mb-4"><span className="dot" />Find us</p>
              <p className="font-sans text-ink-mute text-sm leading-relaxed">
                Escora Journey Studio<br />
                1st Floor, Landmark Maple Business Tower<br />
                Kozhikode, Kerala 673014<br />
                India
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mt-4">
                Monday – Saturday · 09:00 – 18:00 IST
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="reveal-up">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                  <span className="text-gold text-xl">✓</span>
                </div>
                <h2 className="font-serif text-3xl text-ink font-light mb-4">Message received</h2>
                <p className="font-sans text-ink-mute text-sm leading-relaxed">
                  Thank you for reaching out. We'll reply within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="section-label mb-6"><span className="dot" />Send a message</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                      placeholder="+91"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                    placeholder="you@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Message *</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={6}
                    className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors resize-none"
                    placeholder="How can we help you plan your journey?"
                  />
                </div>
                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="contact-marketing-consent"
                    type="checkbox"
                    checked={form.marketingConsent}
                    onChange={(e) => setForm((f) => ({ ...f, marketingConsent: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-line text-gold focus:ring-gold accent-[#cbab6e] cursor-pointer"
                  />
                  <label
                    htmlFor="contact-marketing-consent"
                    className="font-sans text-xs text-ink-mute leading-relaxed cursor-pointer select-none"
                  >
                    I'd like to receive occasional travel inspiration, destination guides, and special offers from Escora Holidays by email. I can unsubscribe at any time.
                  </label>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-gold text-bg font-sans text-sm font-medium py-4 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {mutation.isPending ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      </div>
    </Layout>
  );
}
