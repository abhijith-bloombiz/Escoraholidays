import Layout from "@/components/layout/Layout";
import { Link } from "wouter";
import { useSeo } from "@/hooks/useSeo";
import midhilajPhoto from "@assets/escora/midhilaj-founder.jpg";

export default function About() {
  useSeo({
    title: "About Escora — Boutique Kerala Travel Specialists",
    description: "Escora is a boutique Kerala travel agency and destination management company based in Kozhikode — crafting private, bespoke journeys for discerning travellers from the UK, Europe, and the Gulf since 2016.",
    url: "https://www.escoraholidays.com/about",
  });

  return (
    <Layout>
      <style>{`
        @media (max-width: 640px) {
          .about-page h1, .about-page h2, .about-page h3, .about-page p {
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            max-width: 100% !important;
          }
          .about-page .container { overflow: hidden !important; }
        }
      `}</style>
      <div className="about-page" style={{ overflowX: "hidden" }}>

      {/* Hero */}
      <section className="relative pt-40 pb-20 bg-bg overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 40% 50%, #cbab6e 0%, transparent 60%)" }}
        />
        <div className="container mx-auto px-6 md:px-16 max-w-5xl">
          <p className="font-mono text-gold text-xs tracking-[0.3em] uppercase mb-6">Our Story</p>
          <h1 className="font-serif text-5xl md:text-7xl text-ink font-light leading-[1.1] mb-8" style={{ overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" }}>
            Designed for<br /><em className="italic text-gold">those who travel deeply</em>
          </h1>
          <p className="font-sans text-ink-mute text-lg leading-relaxed max-w-2xl" style={{ overflowWrap: "anywhere" }}>
            Escora is a boutique destination management studio rooted in Kerala, crafting private journeys
            for travellers who seek meaning over itineraries.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-16 max-w-5xl">
        <hr style={{ borderColor: "var(--line)", margin: "0 0 80px" }} />
      </div>

      {/* Philosophy */}
      <section className="container mx-auto px-6 md:px-16 max-w-5xl pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="reveal-up">
            <p className="font-mono text-gold text-xs tracking-[0.3em] uppercase mb-6">Philosophy</p>
            <h2 className="font-serif text-4xl text-ink font-light leading-tight mb-6" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
              Slow travel. Curated access. Honest hospitality.
            </h2>
            <p className="font-sans text-ink-mute leading-relaxed mb-4">
              We believe the finest journeys are not assembled from a catalogue. They are built around a conversation —
              between you and the places you visit, between your pace and the landscape's rhythm.
            </p>
            <p className="font-sans text-ink-mute leading-relaxed">
              Kerala has nine hundred kilometres of backwaters, a coastline that changes character every hour,
              hills that hold the oldest tea estates in India, and a culture of hospitality that predates the
              tourism industry by centuries. We are custodians of access to all of it.
            </p>
          </div>
          <div className="reveal-up">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80"
                alt="Kerala Backwaters"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-bg-2 border-y border-line">
        <div className="container mx-auto px-6 md:px-16 max-w-5xl">
          <p className="font-mono text-gold text-xs tracking-[0.3em] uppercase mb-10 text-center">What guides us</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Depth over breadth",
                body: "We design itineraries that spend time in a place, not just pass through it. Every programme allows for stillness.",
              },
              {
                title: "Local first",
                body: "Our guides, cooks, and hosts are Keralites who have spent their lives in the places they show you. There is no substitute.",
              },
              {
                title: "Transparent pricing",
                body: "Every quote we send is line-itemised. You know where your money goes and who benefits from your visit.",
              },
            ].map(v => (
              <div key={v.title} className="reveal-up">
                <div className="w-10 h-[1px] bg-gold mb-6" />
                <h3 className="font-serif text-2xl text-ink font-light mb-4">{v.title}</h3>
                <p className="font-sans text-ink-mute text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ background: "var(--bg-2)", borderTop: "1px solid var(--line)", padding: "clamp(72px,9vw,130px) 0" }}>
        <div className="container mx-auto px-6 md:px-16" style={{ maxWidth: "var(--container)" }}>

          {/* Eyebrow */}
          <div className="reveal-up" style={{ marginBottom: "clamp(48px,6vw,80px)" }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: ".3em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 16 }}>
              The people behind the journeys
            </div>
            <h2 style={{ fontFamily: "var(--f-display)", fontSize: "clamp(48px,6vw,72px)", fontWeight: 300, color: "var(--ink)", maxWidth: "18ch", lineHeight: 1.1 }}>
              Rooted in Kerala.<br /><em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>Built for the world.</em>
            </h2>
          </div>

          {/* Founder card — large editorial layout */}
          <div className="reveal-up about-founder-card">
            {/* Photo */}
            <div style={{ position: "relative", overflow: "hidden", minHeight: "min(480px, 60vw)" }}>
              <img
                src={midhilajPhoto}
                alt="Midhilaj — Founder & CEO, Escora"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
              />
              {/* subtle dark gradient at bottom */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14,29,20,.55) 0%, transparent 50%)" }} />
            </div>

            {/* Content */}
            <div style={{ padding: "clamp(36px,5vw,64px)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 32 }}>
              <div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: ".3em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 20 }}>
                  Founder & CEO
                </div>
                <h3 style={{ fontFamily: "var(--f-display)", fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 300, color: "var(--ink)", margin: "0 0 24px", lineHeight: 1.1 }}>
                  Midhilaj
                </h3>
                <p style={{ fontFamily: "var(--f-sans)", fontSize: 15, color: "var(--ink-mute)", lineHeight: 1.85, maxWidth: "42ch" }}>
                  Born and raised in Kerala, Midhilaj built his career across three continents before returning home. He spent three years in Saudi Arabia and three in Dubai working in travel and tourism — learning what luxury travellers from the Gulf truly expect. He then earned his MBA in the United Kingdom and spent six years in London, deepening that understanding from within the world's most demanding market. He returned to Kerala with one conviction: that the state's finest experiences were being undersold to the world, and that the people who deserved them most were never finding them. Escora is his answer to that.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
                {[
                  { label: "Based in", value: "Kozhikode, Kerala" },
                  { label: "Education", value: "MBA, United Kingdom" },
                  { label: "Experience", value: "Saudi Arabia · Dubai · London · Kerala" },
                  { label: "Languages", value: "English · Malayalam · Hindi · Arabic" },
                ].map(d => (
                  <div key={d.label} style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".2em", color: "var(--gold)", textTransform: "uppercase", minWidth: 80, flexShrink: 0 }}>{d.label}</span>
                    <span style={{ fontFamily: "var(--f-sans)", fontSize: 13.5, color: "var(--ink-mute)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Curation team card — smaller, full width */}
          <div className="reveal-up about-team-card">
            <div className="about-team-stat" style={{ background: "var(--bg-3)", padding: "clamp(28px,4vw,48px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 36, fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>14+</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: ".2em", color: "var(--ink-mute)", textTransform: "uppercase", marginTop: 8 }}>Curators & specialists</div>
            </div>
            <div style={{ padding: "clamp(28px,4vw,48px)", display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: ".3em", color: "var(--gold)", textTransform: "uppercase" }}>The Journey Design Team</div>
              <h4 style={{ fontFamily: "var(--f-display)", fontSize: "clamp(20px,2vw,28px)", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
                Keralites. Curators. Storytellers.
              </h4>
              <p style={{ fontFamily: "var(--f-sans)", fontSize: 14.5, color: "var(--ink-mute)", lineHeight: 1.8, margin: 0, maxWidth: "56ch" }}>
                A small team of English-speaking Keralites who have collectively travelled every district of the state. Specialists in wellness, heritage, marine ecology, and culinary traditions — each journey is designed by someone who has lived it first.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Numbers */}
      <section className="py-20 bg-bg-2 border-y border-line">
        <div className="container mx-auto px-6 md:px-16 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10", label: "Years in Kerala" },
              { number: "2,400+", label: "Journeys designed" },
              { number: "14", label: "Regions of Kerala" },
              { number: "98%", label: "Return guests" },
            ].map(s => (
              <div key={s.label} className="reveal-up">
                <div className="font-serif text-4xl md:text-5xl text-gold font-light mb-2">{s.number}</div>
                <div className="font-mono text-xs uppercase tracking-widest text-ink-mute">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-bg text-center">
        <div className="container mx-auto px-6 max-w-2xl reveal-up">
          <h2 className="font-serif text-4xl text-ink font-light mb-6">Ready to begin?</h2>
          <p className="font-sans text-ink-mute mb-10 leading-relaxed">
            Tell us where you want to go and how you want to feel. We'll take care of the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/plan"
              className="inline-block bg-gold text-bg font-sans text-sm font-medium px-8 py-4 rounded-sm hover:opacity-90 transition-opacity"
            >
              Plan a Journey
            </a>
            <Link
              href="/contact"
              className="inline-block border border-line text-ink-soft font-sans text-sm px-8 py-4 rounded-sm hover:border-gold hover:text-gold transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
      </div>
    </Layout>
  );
}
