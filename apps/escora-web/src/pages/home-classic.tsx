import { useEffect, useState } from "react";
import { useListPackages } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import "./home.css";

import escoraLogo from "@assets/escora/escora-logo-green.png";
import heroBg from "@assets/escora/hero-bg.jpeg";

const DEST_CARDS = [
  { cls: "lg", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1800&q=80", pill: "Backwaters", idx: "Nº 01 / 06", h3: <>Alleppey<br/><i>by candlelight</i></>, country: <>Alappuzha<br/>Kerala</> },
  { cls: "md", img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80", pill: "High Range", idx: "Nº 02 / 06", h3: <>Munnar<br/><i>tea estates</i></>, country: <>Idukki<br/>Kerala</> },
  { cls: "sm", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80", pill: "Heritage", idx: "Nº 03 / 06", h3: <>Fort <i>Kochi</i></>, country: <>Ernakulam</> },
  { cls: "wide", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1800&q=80", pill: "Wildlife", idx: "Nº 04 / 06", h3: <>Wayanad<br/><i>canopy nights</i></>, country: <>Wayanad<br/>Kerala</> },
  { cls: "tall", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80", pill: "Wellness", idx: "Nº 05 / 06", h3: <>Ayurveda<br/>at <i>Kumarakom</i></>, country: <>Vembanad Lake</> },
  { cls: "sm", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80", pill: "Coastal", idx: "Nº 06 / 06", h3: <>Varkala <i>cliffs</i></>, country: <>Thiruvananthapuram</> },
];

const PKG_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=80",
    badge: "Signature", price: "₹6,99,000", priceLabel: "per couple",
    nights: "07 Nights · 08 Days", route: "Cochin → Munnar → Alleppey",
    title: <>The <i>Backwater</i> Sonata</>,
    desc: "Private houseboat with chef, two nights in a heritage tea bungalow, dawn kalaripayattu lesson on the bow, and a moonlit dinner on a rice-barge.",
    tags: ["Couples", "Romance", "Wellness"],
  },
  {
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
    badge: "New", price: "₹10,15,000", priceLabel: "per family of 4",
    nights: "10 Nights · 11 Days", route: "Cochin → Thekkady → Wayanad",
    title: <>Hills, <i>Tea</i> &amp; Tigers</>,
    desc: "From the Periyar wildlife dawns to a private treehouse in Wayanad — designed for curious families, with naturalists, jeep safaris and a private spice estate stay.",
    tags: ["Family", "Wildlife", "Adventure"],
  },
  {
    img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80",
    badge: "Wellness", price: "₹12,30,000", priceLabel: "per person",
    nights: "14 Nights · 15 Days", route: "Cochin → Kumarakom → Trivandrum",
    title: <>The <i>Ayurveda</i> Retreat</>,
    desc: "A medically-led panchakarma at our partner retreat on Vembanad Lake. Consultations, daily abhyanga, vegetarian living cuisine and a private boat to a forgotten island.",
    tags: ["Wellness", "Solo", "Slow"],
  },
];

const RETREAT_PILLARS = [
  {
    img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
    tag: "Ayurveda", title: <>Ayurveda &amp; <i>Panchakarma</i></>,
    desc: "Physician-led detox and rejuvenation in the classical Keraliya tradition — pulse diagnosis, medicated oils prepared in-house, and a daily rhythm tuned to your dosha.",
    offers: ["Panchakarma", "Abhyanga", "Shirodhara", "Rasayana"],
    from: "₹14,500 / night",
  },
  {
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    tag: "Yoga", title: <>Yoga &amp; <i>Meditation</i></>,
    desc: "Lakeside sunrise practice with a senior teacher — from gentle Hatha to disciplined Ashtanga, with breathwork and silent meditation to settle the mind.",
    offers: ["Hatha", "Ashtanga", "Pranayama", "Yoga Nidra"],
    from: "₹8,200 / night",
  },
  {
    img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=80",
    tag: "Martial Art", title: <>Kalaripayattu — <i>the</i> mother art</>,
    desc: "Learn the world's oldest martial art at a traditional kalari, taught by a Gurukkal. Footwork, forms and the marma points that underpin Kerala's healing tradition.",
    offers: ["Meipayattu", "Kolthari", "Marma Therapy", "Uzhichil"],
    from: "₹6,500 / session",
  },
  {
    img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=900&q=80",
    tag: "Healthcare", title: <>Naturopathy &amp; <i>Healthcare</i></>,
    desc: "Doctor-supervised wellness tours — naturopathy, therapeutic diet, physiotherapy and lifestyle medicine, with full medical reports and aftercare for the journey home.",
    offers: ["Naturopathy", "Detox", "Physiotherapy", "Diet & Lifestyle"],
    from: "₹11,000 / night",
  },
];

const TESTIMONIALS = [
  {
    quote: '"They moved a sunset for us. Or it felt that way. A boat appeared on a backwater I\'d been told didn\'t exist — and a chef I\'d long admired was on it."',
    av: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    name: "Eleanor V.", meta: "London · Honeymoon · Mar 2025",
  },
  {
    quote: '"Our family of seven, ages 6 to 78. The itinerary anticipated every single one of us. I have never seen a travel company plan with this kind of attention."',
    av: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    name: "Marcus T.", meta: "San Francisco · Family · Dec 2024",
  },
  {
    quote: '"My panchakarma at Kumarakom is, without exaggeration, the reason I am still working. Escora did not arrange a holiday — they arranged a recovery."',
    av: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    name: "Dr. Aiko N.", meta: "Tokyo · Wellness · Oct 2024",
  },
];

const JOURNAL_POSTS = [
  { feat: true, img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1800&q=80", cat: "Culture · 12 min read", date: "May 2026", title: <>A night with the last <i>Kathakali</i> master of Cheruthuruthy.</> },
  { feat: false, img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80", cat: "Spice trail · 8 min", date: "Apr 2026", title: <>Why the world's best <i>cardamom</i> still comes from one valley.</> },
  { feat: false, img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80", cat: "Wellness · 6 min", date: "Mar 2026", title: <>What no one tells you before your first <i>panchakarma</i>.</> },
];

const INSTA_IMGS = [
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80",
];

const MARQUEE_ITEMS = [
  "Backwaters of Alleppey", "Tea hills of Munnar", "Fort Kochi nights",
  "Wayanad jungles", "Varkala cliffs", "Bekal coast", "Thekkady spice trails",
];

export default function HomeClassic() {
  const [loaded, setLoaded] = useState(false);
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const { data: packagesData } = useListPackages({ published: true });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const opts: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -60px 0px",
      threshold: 0.08,
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("in");
      });
    }, opts);
    const els = document.querySelectorAll(".reveal, .mask-reveal, .image-reveal");
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [loaded]);

  const pkgCards = packagesData?.length
    ? packagesData.slice(0, 3).map((pkg) => ({
        img: pkg.heroImageUrl || PKG_CARDS[0].img,
        badge: pkg.category || "Signature",
        price: pkg.priceFrom ? `₹${Number(pkg.priceFrom).toLocaleString("en-IN")}` : "₹—",
        priceLabel: "per person",
        nights: `${pkg.durationNights} Nights`,
        route: pkg.route || "",
        title: <>{pkg.name}</>,
        desc: pkg.description || "",
        tags: [pkg.category, pkg.bestFor || "Private"].filter(Boolean).slice(0, 3) as string[],
      }))
    : PKG_CARDS;

  return (
    <Layout>
      <div className={`loader${loaded ? " done" : ""}`} aria-hidden="true">
        <div className="stack">
          <img className="logo-img" src={escoraLogo} alt="Escora — Explore · Experience · Escape" />
          <div className="bar" />
          <div className="count">Kerala · for the global traveller</div>
        </div>
      </div>

      <div>
        <section className="hero">
          <div className="bg" style={{ backgroundImage: `url(${heroBg})` }} />
          <div className="inner">
            <div className="eyebrow-row">
              <div className="reveal">
                <div className="eyebrow"><span className="dot" />Est. Kozhikode · Kerala — India</div>
              </div>
              <div className="meta reveal d2">
                <div>09° 56′ N · 76° 16′ E</div>
                <div>Issue Nº 14 — Monsoon Edition</div>
              </div>
            </div>
            <div>
              <h1>
                <span className="mask-reveal"><span>Kerala,</span></span>
                <br />
                <span className="mask-reveal d2"><span><i>composed</i></span></span>
                <br />
                <span className="mask-reveal d3"><span>for connoisseurs.</span></span>
              </h1>
            </div>
            <div className="footrow">
              <p className="lede reveal d3">A destination management studio crafting private, slow-luxury journeys through Kerala — for the world's most discerning travellers, since 2009.</p>
              <div className="scroll-cue reveal d4">
                <span>Scroll</span>
                <span className="stem" />
              </div>
              <div className="indices reveal d5">
                <span><b>14</b> regions</span>
                <span><b>87</b> stays</span>
                <span><b>2K+</b> journeys</span>
              </div>
            </div>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <div>
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span key={i} className="marquee-item">{item}<span className="sep" /></span>
              ))}
            </div>
          </div>
        </div>

        <section className="intro container">
          <div className="row">
            <div className="reveal">
              <div className="eyebrow"><span className="dot" />Nº 01 — The Studio</div>
              <figure className="intro-fig">
                <div className="intro-fig-img image-reveal">
                  <img src="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1100&q=80" alt="A Kerala backwater at sunset" />
                </div>
                <figcaption>Vembanad at dusk — where most Escora journeys begin.</figcaption>
              </figure>
            </div>
            <div className="stack">
              <p className="pull reveal d2">We design <i>singular</i> journeys through Kerala — privately curated, quietly luxurious, deeply local. No two Escora itineraries are alike, and none are ever repeated.</p>
              <div className="reveal d3" style={{ display: "flex", gap: 48, paddingTop: 32, borderTop: "1px solid var(--line)", alignItems: "end" }}>
                <div style={{ flex: 1 }}>
                  <div className="num" style={{ marginBottom: 12 }}>Nº 02 — Our Promise</div>
                  <p style={{ color: "var(--ink-mute)", fontSize: 15, lineHeight: 1.65, maxWidth: "48ch" }}>From the spice-laden lanes of Mattancherry to the silent canopies of Vythiri — every moment is hand-arranged, every detail anticipated. We work only with families, artisans and houses we know by name.</p>
                </div>
                <a className="link-arrow" href="#contact">Begin your journey</a>
              </div>
            </div>
          </div>
        </section>

        <section className="dest container" id="destinations">
          <div className="head">
            <div className="s-head">
              <div className="eyebrow reveal"><span className="dot" />Nº 03 — Featured Destinations</div>
              <h2 className="display-md mask-reveal d2"><span>A Kerala you've <i>never</i> been to.</span></h2>
            </div>
            <a className="link-arrow reveal d3" href="/destinations">All 14 regions →</a>
          </div>
          <div className="dest-grid">
            {DEST_CARDS.map((d, i) => (
              <a key={i} className={`dest-card ${d.cls} reveal${i % 2 === 1 ? " d2" : ""}`} href="/destinations">
                <div className="img" style={{ backgroundImage: `url('${d.img}')` }} />
                <div className="scrim" />
                <div className="body">
                  <div className="top">
                    <span className="pill">{d.pill}</span>
                    <span className="index">{d.idx}</span>
                  </div>
                  <div className="label">
                    <h3>{d.h3}</h3>
                    <span className="country">{d.country}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="packages" id="packages">
          <div className="container">
            <div className="head">
              <div className="s-head">
                <div className="eyebrow reveal"><span className="dot" />Nº 04 — Curated Journeys</div>
                <h2 className="display-md mask-reveal d2"><span>Eight signature itineraries.</span></h2>
              </div>
              <a className="link-arrow reveal d3" href="/journeys">View all 27 →</a>
            </div>
            <div className="pkg-grid">
              {pkgCards.map((pkg, i) => (
                <a key={i} className={`pkg-card reveal${i > 0 ? ` d${i + 1}` : ""}`} href="/journeys">
                  <div className="img-wrap">
                    <div className="img" style={{ backgroundImage: `url('${pkg.img}')` }} />
                    <span className="badge">{pkg.badge}</span>
                    <span className="price">{pkg.price}<small>{pkg.priceLabel}</small></span>
                  </div>
                  <div className="body">
                    <div className="meta-row">
                      <span className="nights">{pkg.nights}</span>
                      <span>{pkg.route}</span>
                    </div>
                    <div className="pkg-title">{pkg.title}</div>
                    <p className="pkg-desc">{pkg.desc}</p>
                    <div className="foot">
                      <div className="tags">{pkg.tags.map((t, j) => <span key={j}>{t}</span>)}</div>
                      <span className="link-arrow" style={{ fontSize: 10 }}>Explore →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="retreat" id="retreat">
          <div className="container">
            <div className="head">
              <div className="s-head">
                <div className="eyebrow reveal"><span className="dot" />Nº 05 — Escora Retreat</div>
                <h2 className="display-md mask-reveal d2"><span>The art of <i>healing</i>, the Kerala way.</span></h2>
              </div>
              <div className="reveal d3">
                <p className="lede">Set on the quiet shore of Vembanad Lake, the Escora Retreat is our own home of wellness — a government-classified Ayurveda centre where physicians, yogis and kalari masters work as one. Every programme is composed for you alone.</p>
                <div className="rstats">
                  <div className="it"><div className="n">5,000<span style={{ fontSize: "0.5em" }}>yr</span></div><div className="l">Of Ayurveda</div></div>
                  <div className="it"><div className="n">3</div><div className="l">Resident physicians</div></div>
                  <div className="it"><div className="n">NABH</div><div className="l">Accredited care</div></div>
                </div>
              </div>
            </div>
            <div className="retreat-grid">
              {RETREAT_PILLARS.map((p, i) => (
                <article key={i} className={`r-pillar reveal${i % 2 === 1 ? " d2" : ""}`}>
                  <div className="pic">
                    <div className="img" style={{ backgroundImage: `url('${p.img}')` }} />
                    <span className="tag">{p.tag}</span>
                  </div>
                  <div className="b">
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                    <div className="offer">{p.offers.map((o: string, j: number) => <span key={j}>{o}</span>)}</div>
                    <div className="rfoot">
                      <div className="from">From<b>{p.from}</b></div>
                      <a className="link-arrow" href="#contact">Enquire →</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="why container" id="why">
          <div className="head">
            <div className="s-head">
              <div className="eyebrow reveal"><span className="dot" />Nº 06 — Why Escora</div>
              <h2 className="display-md mask-reveal d2"><span>The <i>difference</i> is in what you don't see.</span></h2>
            </div>
            <p className="lede reveal d3">We are deliberately small. Twelve curators. Sixteen years on the ground. No call-centres, no off-the-shelf itineraries, no commissions accepted from third parties.</p>
          </div>
          <div className="stats">
            <div className="stat reveal"><div className="num">16</div><div className="label">Years on the ground</div></div>
            <div className="stat reveal d2"><div className="num">2,400+</div><div className="label">Journeys composed</div></div>
            <div className="stat reveal d3"><div className="num">14</div><div className="label">Regions covered</div></div>
            <div className="stat reveal d4"><div className="num">98%</div><div className="label">Return guests</div></div>
          </div>
          <div className="why-grid">
            <div className="why-item reveal">
              <div className="icn" />
              <h4>A studio, <i>not</i> an agency</h4>
              <p>Twelve curators — each a specialist in one corner of Kerala. We turn down more than half the journeys we are asked to build, so we can stay devoted to the ones we accept.</p>
            </div>
            <div className="why-item reveal d2">
              <div className="icn" />
              <h4>Doors that <i>don't</i> open elsewhere</h4>
              <p>Sixteen years of trust with old Travancore families, master chefs, mahouts and ayurveda physicians — none of it is bookable on the internet. All of it is ours to offer you.</p>
            </div>
            <div className="why-item reveal d3">
              <div className="icn" />
              <h4>Service that <i>anticipates</i></h4>
              <p>A dedicated curator before, a 24-hour concierge during, a private archivist after — preparing the leather-bound memory book that arrives at your home a month later.</p>
            </div>
          </div>
        </section>

        <section className="bespoke" id="bespoke">
          <div className="bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=2400&q=80')" }} />
          <div className="container">
            <div className="eyebrow reveal"><span className="dot" />Nº 07 — Bespoke</div>
            <h2 className="display-lg reveal d2">Or — <i>begin</i><br/>with a blank page.</h2>
            <p className="lede reveal d3" style={{ maxWidth: "56ch", textAlign: "center" }}>Tell us the season, the company, and the feeling you are after. We will reply within 24 hours with a sketch of three possible journeys — yours to refine, reject, or rearrange.</p>
            <div className="ctas reveal d4">
              <a className="btn-primary" href="#contact">Begin a Bespoke Journey <span className="btn-arr" /></a>
              <a className="btn-outline" href="/journeys">See Sample Itineraries <span className="btn-arr" /></a>
            </div>
          </div>
        </section>

        <section className="testi" id="testimonials">
          <div className="container">
            <div className="head">
              <div className="s-head">
                <div className="eyebrow reveal"><span className="dot" />Nº 08 — From Our Travellers</div>
                <h2 className="display-md mask-reveal d2"><span>Quiet praise, from <i>quiet</i> people.</span></h2>
              </div>
              <p className="lede reveal d3">Drawn from our 2024–25 guest letters. Names shortened at request.</p>
            </div>
            <div className="testi-grid">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={`testi-card reveal${i > 0 ? ` d${i + 1}` : ""}`}>
                  <div className="stars">★ ★ ★ ★ ★</div>
                  <blockquote>{t.quote}</blockquote>
                  <div className="who">
                    <div className="av" style={{ backgroundImage: `url('${t.av}')` }} />
                    <div>
                      <div className="name">{t.name}</div>
                      <div className="meta">{t.meta}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="journal container" id="journal">
          <div className="head">
            <div className="s-head">
              <div className="eyebrow reveal"><span className="dot" />Nº 09 — The Journal</div>
              <h2 className="display-md mask-reveal d2"><span>Letters from the field.</span></h2>
            </div>
            <a className="link-arrow reveal d3" href="/journal">All entries →</a>
          </div>
          <div className="journal-grid">
            {JOURNAL_POSTS.map((j, i) => (
              <a key={i} className={`j-card${j.feat ? " feat" : ""} reveal${i > 0 ? ` d${i + 1}` : ""}`} href="/journal">
                <div className="img-wrap"><div className="img" style={{ backgroundImage: `url('${j.img}')` }} /></div>
                <div>
                  <div className="jmeta"><span className="cat">{j.cat}</span><span>{j.date}</span></div>
                  <h3 style={{ marginTop: 20 }}>{j.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="insta container" id="instagram">
          <div className="head">
            <div className="s-head">
              <div className="eyebrow reveal"><span className="dot" />Nº 10 — @escora · Latest</div>
              <h2 className="display-md mask-reveal d2"><span>From our <i>field</i> notebooks.</span></h2>
            </div>
            <a className="link-arrow reveal d3" href="#">Follow the studio →</a>
          </div>
          <div className="insta-grid">
            {INSTA_IMGS.map((src, i) => (
              <div key={i} className="insta-item reveal" style={{ backgroundImage: `url('${src}')` }} />
            ))}
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="container">
            <div className="row">
              <div className="left">
                <div className="eyebrow reveal"><span className="dot" />Nº 11 — Begin</div>
                <h2 className="display-md reveal d2" style={{ marginTop: 24 }}>A 20-minute<br/>conversation. <i>Nothing</i> more.</h2>
                <p className="lede reveal d3" style={{ marginTop: 24, marginBottom: 40 }}>No brochures, no obligation. One of our twelve curators will call you at a time that suits, listen, and then disappear to compose three possible journeys.</p>
                <div className="info reveal d4">
                  <div className="row2">
                    <div><div className="lbl">Studio</div><div className="val">Fort <i>Kochi</i>, Kerala</div></div>
                    <div><div className="lbl">Hours</div><div className="val">24 / 7</div></div>
                  </div>
                  <div className="row2">
                    <div><div className="lbl">Telephone</div><div className="val">+91 8157 003 344</div></div>
                    <div><div className="lbl">Letters</div><div className="val">hello@escora.travel</div></div>
                  </div>
                </div>
              </div>
              <form className="cform reveal d3" onSubmit={(e) => { e.preventDefault(); setContactSent(true); }}>
                {contactSent ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase" }}>Sent — we will write back within 24 hours.</p>
                  </div>
                ) : (
                  <>
                    <h3>Tell us a little.</h3>
                    <div className="form-row">
                      <div className="cfield"><label>Your name</label><input type="text" required /></div>
                      <div className="cfield"><label>Country</label><input type="text" /></div>
                    </div>
                    <div className="form-row">
                      <div className="cfield"><label>Email</label><input type="email" required /></div>
                      <div className="cfield"><label>Telephone</label><input type="tel" /></div>
                    </div>
                    <div className="form-row">
                      <div className="cfield">
                        <label>Travelling as</label>
                        <select>
                          <option>Couple / honeymoon</option>
                          <option>Family</option>
                          <option>Solo</option>
                          <option>Friends</option>
                          <option>Corporate / MICE</option>
                          <option>Travel agent (B2B)</option>
                        </select>
                      </div>
                      <div className="cfield">
                        <label>Approximate dates</label>
                        <input type="text" placeholder="e.g. Nov 2026, 10 nights" />
                      </div>
                    </div>
                    <div className="cfield"><label>A few words about the journey</label><textarea /></div>
                    <button type="submit" className="btn-primary" style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>
                      Send to the Studio <span className="btn-arr" />
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </section>

        <section className="news">
          <div className="container">
            <div className="row">
              <h2 className="reveal">A letter, four times a year. <i>Never</i> more.</h2>
              <form className="reveal d2" onSubmit={(e) => { e.preventDefault(); setNewsletterSent(true); }}>
                {newsletterSent ? (
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase" }}>
                    Thank you — first edition arrives soon.
                  </span>
                ) : (
                  <>
                    <input type="email" placeholder="your@email" required />
                    <button type="submit">Subscribe <span className="arrow" /></button>
                  </>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
