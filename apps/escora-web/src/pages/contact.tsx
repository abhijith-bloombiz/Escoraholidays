import Layout from "@/components/layout/Layout";
import { useState } from "react";
import { useCreateEnquiry } from "@workspace/api-client-react";
import { useSeo } from "@/hooks/useSeo";
import PalmBotanicalAnimation from "@/components/PalmBotanicalAnimation";

export default function Contact() {
  useSeo({
    title: "Contact Escora — Kerala Travel Experts, Kozhikode",
    description: "Get in touch with Escora's Kerala travel specialists in Kozhikode. Start planning your private luxury Kerala holiday — honeymoon, Ayurveda retreat, or bespoke family tour. We respond within one business day.",
    url: "https://www.escoraholidays.com/contact",
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    marketingConsent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const mutation = useCreateEnquiry();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    mutation.mutate(
      {
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim(),
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
      <div className="relative overflow-hidden bg-bg">
        <PalmBotanicalAnimation />

        {/* Hero */}
        <section className="relative z-10 page-hero-top bg-transparent overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 60% 40%, #cbab6e 0%, transparent 60%)" }}
          />
          <div className="container mx-auto px-6 sm:px-8 max-w-4xl text-center reveal-up">
            <p className="section-label mb-6">Contact</p>
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
            {/* Direct Lines & Studio Address (Left Column) */}
            <div className="space-y-10 reveal-up">
              <div>
                <p className="section-label mb-4">Direct Lines</p>
                <div className="space-y-4 font-sans text-sm">
                  {[
                    { label: "Phone", value: "+91 8157 003 344", href: "tel:+918157003344" },
                    { label: "WhatsApp", value: "+91 8157 003 344", href: "https://wa.me/918157003344" },
                    { label: "Email", value: "hello@escoraholidays.com", href: "mailto:hello@escoraholidays.com" },
                  ].map(c => (
                    <div key={c.label} className="flex items-start gap-4 py-3 border-b border-line/50">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-gold w-20 flex-shrink-0 pt-0.5">{c.label}</span>
                      <a href={c.href} className="text-ink hover:text-gold transition-colors">{c.value}</a>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="section-label mb-4">Escora Journey Studio</p>
                <p className="font-sans text-ink-mute text-sm leading-relaxed">
                  1st Floor, Landmark Maple Business Tower<br />
                  Kozhikode, Kerala 673014<br />
                  India
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mt-4">
                  Monday – Saturday · 09:00 – 18:00 IST
                </p>
              </div>
            </div>

            {/* Contact Form (Right Column) */}
            <div className="reveal-up">
              <p className="section-label mb-6">Send a message</p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-name" className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                        Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="contact-phone" className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                        Phone
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                        placeholder="+91"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                      Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={6}
                      className="w-full bg-transparent border border-line text-ink text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors resize-none"
                      placeholder="How can we help you plan your journey?"
                    />
                  </div>
                  {/* Marketing Consent Checkbox */}
                  <div className="flex items-start gap-3 pt-1">
                    <input
                      id="contact-marketing-consent"
                      type="checkbox"
                      checked={form.marketingConsent}
                      onChange={e => setForm(f => ({ ...f, marketingConsent: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-line text-gold focus:ring-gold accent-[#B58D5D] cursor-pointer shrink-0"
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
                    id="contact-submit"
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-gold text-bg font-sans text-sm font-medium py-4 hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
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
