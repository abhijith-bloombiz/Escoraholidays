import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import PalmBotanicalAnimation from "@/components/PalmBotanicalAnimation";

export default function Contact() {
  useSeo({
    title: "Contact Escora — Kerala Travel Experts, Kozhikode",
    description: "Get in touch with Escora's Kerala travel specialists in Kozhikode. Start planning your private luxury Kerala holiday — honeymoon, Ayurveda retreat, or bespoke family tour. We respond within one business day.",
    url: "https://www.escoraholidays.com/contact",
  });

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
            {/* Direct Lines */}
            <div className="space-y-4 reveal-up">
              <p className="section-label mb-4"><span className="dot" />Direct Lines</p>
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

            {/* Studio Address */}
            <div className="space-y-4 reveal-up">
              <p className="section-label mb-4"><span className="dot" />Escora Journey Studio</p>
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
        </section>
      </div>
    </Layout>
  );
}
