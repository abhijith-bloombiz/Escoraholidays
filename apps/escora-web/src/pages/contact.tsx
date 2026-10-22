import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import EscoraContactCard from "@/components/EscoraContactCard";
import {
  BotanicalTopLeft,
  BotanicalTopRight,
} from "@/components/BotanicalDecorations";

export default function Contact() {
  useSeo({
    title: "Contact Escora — Kerala Travel Experts, Kozhikode",
    description: "Get in touch with Escora's Kerala travel specialists in Kozhikode. Start planning your private luxury Kerala holiday — honeymoon, Ayurveda retreat, or bespoke family tour. We respond within one business day.",
    url: "https://www.escoraholidays.com/contact",
  });

  return (
    <Layout>
      <div className="relative overflow-hidden bg-bg">
        {/* Botanical Vector Decorations */}
        <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden" aria-hidden="true">
          <BotanicalTopLeft className="absolute -top-4 -left-6 sm:top-0 sm:left-0 w-[240px] h-[250px] sm:w-[320px] sm:h-[340px] opacity-70" />
          <BotanicalTopRight className="absolute -top-4 -right-6 sm:top-0 sm:right-0 w-[210px] h-[230px] sm:w-[280px] sm:h-[300px] opacity-65" />
        </div>

        {/* Unified Luxury Enquiry & Contact Card */}
        <div className="relative z-10 pt-4 pb-10">
          <EscoraContactCard id="contact-form" />
        </div>

        {/* Contact details & Studio Address */}
        <section className="container mx-auto max-w-5xl relative z-10 pb-20 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-line/60">
            <div>
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

            <div>
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
