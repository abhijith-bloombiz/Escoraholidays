/**
 * build-seo-shell.mjs — runs after `vite build`.
 *
 * For each route:
 *  1. Creates dist/public/[route]/index.html (SPA fallback for direct navigation)
 *  2. Injects correct per-route <title>, canonical, og:url, og:title, og:description,
 *     meta description, and keyword-rich body content into every HTML file.
 *
 * No browser required — pure Node. Works in any CI/CD environment.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = resolve(__dirname, "../dist/public");
const ORIGIN = "https://www.escoraholidays.com";

// ---------------------------------------------------------------------------
// Per-route SEO metadata + static body content
// ---------------------------------------------------------------------------
const ROUTES = [
  {
    route: "/",
    file: "index.html",
    title: "Escora Holidays — Luxury Kerala Holiday Packages | Private Tours & Ayurveda Retreats",
    description: "Private Kerala holiday packages — honeymoon tours, Ayurveda retreats, backwater houseboats & wildlife safaris. Bespoke itineraries for UK, Europe & Gulf travellers.",
    body: `<main>
<h1>Luxury Kerala Holiday Packages — Crafted for Discerning Travellers</h1>
<p>Escora Holidays designs private Kerala holiday packages for couples, families and wellness seekers from the UK, Europe and the Gulf. Every itinerary is built around you — from a romantic houseboat stay on the Alleppey backwaters to a 14-night Ayurveda Panchakarma retreat in Thrissur.</p>
<p><strong>Who we design for:</strong> Couples on honeymoon, families travelling with children, solo wellness seekers, and groups from the UK, Europe and the Gulf who want Kerala done privately — not on a coach with 40 strangers.</p>
<h2>Eight Ways to Journey Through Kerala</h2>
<ul>
  <li><a href="/collections/honeymoon">Kerala Honeymoon Packages</a> — private houseboat stays, heritage villas, candlelit beach dinners</li>
  <li><a href="/collections/health-wellness">Kerala Ayurveda Retreats &amp; Wellness</a> — classical Panchakarma, Shirodhara, yoga immersions</li>
  <li><a href="/collections/functional-medicine">Functional Medicine Programmes</a> — root-cause health assessments, gut health, metabolic reset</li>
  <li><a href="/collections/nature-wildlife">Kerala Wildlife Safaris &amp; Nature Tours</a> — Periyar Tiger Reserve, Wayanad, Silent Valley</li>
  <li><a href="/collections/hill-stations">Kerala Hill Station Holidays</a> — Munnar tea estates, Vagamon meadows, Wayanad highlands</li>
  <li><a href="/collections/backwaters">Kerala Backwater Houseboat Holidays</a> — Alleppey houseboat, Kumarakom, Valiyaparamba</li>
  <li><a href="/collections/beaches">Kerala Beach Holidays</a> — Kovalam, Varkala, Marari, Bekal, Kappad</li>
  <li><a href="/collections/historical-heritage">Kerala Heritage &amp; History Tours</a> — Fort Kochi, Travancore palaces, Muziris, temple trails</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>What is included in an Escora Kerala holiday package?</h3>
<p>Every package includes private airport transfers, a dedicated vehicle and driver throughout, hand-picked accommodation, and a day-by-day itinerary. Activities, guides and permits are arranged in advance. International flights are not included.</p>
<h3>How long does it take to plan a Kerala holiday with Escora?</h3>
<p>Most itineraries are finalised within 48–72 hours of your initial enquiry. We ask for your travel dates, group size, interests and approximate budget — and we send back a full proposal. There is no obligation to book.</p>
<h3>What is the best time to visit Kerala?</h3>
<p>October to March is peak season — dry, sunny, and ideal for backwaters, beaches and wildlife. July–August (monsoon) is the best time for classical Ayurveda Panchakarma, when the humidity maximises treatment efficacy. April–June is warm but quiet, with lower prices.</p>
<h3>Do you arrange honeymoon packages for couples from the UK?</h3>
<p>Yes — UK and European couples are among our most frequent travellers. We handle all ground arrangements in Kerala so you arrive to a fully organised itinerary. We can also coordinate with your UK travel agent or book independently.</p>
<p>Based in Kozhikode, Kerala since 2016. <a href="/plan">Plan your private Kerala journey</a> with an Escora specialist.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What is included in an Escora Kerala holiday package?", "acceptedAnswer": { "@type": "Answer", "text": "Every package includes private airport transfers, a dedicated vehicle and driver throughout, hand-picked accommodation, and a day-by-day itinerary. Activities, guides and permits are arranged in advance. International flights are not included." } },
        { "@type": "Question", "name": "How long does it take to plan a Kerala holiday with Escora?", "acceptedAnswer": { "@type": "Answer", "text": "Most itineraries are finalised within 48–72 hours of your initial enquiry. We ask for your travel dates, group size, interests and approximate budget — and we send back a full proposal. There is no obligation to book." } },
        { "@type": "Question", "name": "What is the best time to visit Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "October to March is peak season — dry, sunny, and ideal for backwaters, beaches and wildlife. July–August (monsoon) is the best time for classical Ayurveda Panchakarma. April–June is warm but quiet, with lower prices." } },
        { "@type": "Question", "name": "Do you arrange honeymoon packages for couples from the UK?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — UK and European couples are among our most frequent travellers. We handle all ground arrangements in Kerala so you arrive to a fully organised itinerary. We can also coordinate with your UK travel agent or book independently." } },
      ],
    },
  },
  {
    route: "/about",
    file: "about/index.html",
    title: "About Escora Holidays — Boutique Kerala Travel Specialists Since 2016",
    description: "Escora Holidays is a Kozhikode-based boutique Kerala travel agency founded in 2016 by Midhilaj. Private bespoke Kerala journeys for UK, Europe and Gulf travellers.",
    body: `<main>
<h1>About Escora Holidays</h1>
<p>Escora Holidays is a boutique Kerala travel company founded in Kozhikode in 2016. We specialise in private, bespoke Kerala holiday packages for discerning travellers from the UK, Europe and the Gulf — honeymoon tours, Ayurveda retreats, wildlife safaris, backwater houseboat stays, and heritage journeys designed around you.</p>

<h2>Founded by Midhilaj — Kerala Travel Specialist</h2>
<p>Escora was founded by Midhilaj, a Kozhikode-born travel specialist who has been guiding international travellers through Kerala for over a decade. Every itinerary is personally reviewed. We are a small, specialist team — not a mass-market agency — and we take on a limited number of groups each month to maintain the quality of every journey we send out.</p>

<h2>Why Travellers Choose Escora</h2>
<ul>
  <li><strong>Fully private</strong> — your own vehicle, driver and guide throughout. You never share with strangers.</li>
  <li><strong>Genuinely bespoke</strong> — every itinerary is built from scratch around your dates, interests and budget</li>
  <li><strong>Deep local network</strong> — direct relationships with heritage hotels, physician-led Ayurveda centres, naturalist guides and specialist historians built over nine years</li>
  <li><strong>Specialist categories</strong> — Ayurveda, functional medicine, wildlife, backwaters, honeymoon, hill stations, beaches, heritage</li>
  <li><strong>Based in Kerala</strong> — we are here, not a UK or Gulf agency reselling Kerala packages at a markup</li>
</ul>

<h2>Our Credentials</h2>
<ul>
  <li>Founded: 2016, Kozhikode, Kerala, India</li>
  <li>Kerala Tourism registered operator</li>
  <li>GST registered: [GST NUMBER]</li>
  <li>Physical office: [FULL STREET ADDRESS], Kozhikode, Kerala 673001</li>
  <li>Phone: [PHONE NUMBER]</li>
</ul>

<h2>What Our Travellers Say</h2>
<blockquote>
  <p>"Midhilaj and the Escora team arranged every detail of our Kerala honeymoon — from the private houseboat on the Alleppey backwaters to the heritage villa in Munnar. We arrived to find everything exactly as described. Exceptional." — [Name], London, 2024</p>
</blockquote>
<blockquote>
  <p>"The Panchakarma programme Escora arranged at their partner centre in Kozhikode was genuinely transformative. The physician was extraordinary. This was not spa tourism — it was the real thing." — [Name], Dubai, 2024</p>
</blockquote>

<p><a href="/contact">Contact Escora Holidays</a> to begin planning your private Kerala journey.</p>
</main>`,
  },
  {
    route: "/journeys",
    file: "journeys/index.html",
    title: "Kerala Holiday Packages — Luxury Private Itineraries | Escora Holidays",
    description: "Browse Escora's collection of private Kerala holiday packages — honeymoon tours, Ayurveda retreats, wildlife safaris, houseboat stays and heritage tours. Fully bespoke, UK & Gulf departures.",
    body: `<main>
<h1>Kerala Holiday Packages — Luxury Private Itineraries</h1>
<p>Browse Escora Holidays' collection of private Kerala packages. From a 3-night Alleppey houseboat escape to a 14-night Ayurveda Panchakarma programme, every itinerary is fully private — your dates, your pace, your preferences.</p>
<h2>Featured Kerala Packages</h2>
<ul>
  <li><a href="/collections/honeymoon">Munnar &amp; Alleppey Honeymoon Escape</a> — 4 nights | Tea estates, houseboat, backwaters</li>
  <li><a href="/collections/health-wellness">Classical Panchakarma — 14 nights</a> | Authentic Ayurvedic purification</li>
  <li><a href="/collections/nature-wildlife">Periyar Tiger Reserve Wildlife Escape</a> — 3 nights | Jungle, lake safari, tribal tracker</li>
  <li><a href="/collections/historical-heritage">Fort Kochi Heritage Walk &amp; Stay</a> — 3 nights | Colonial history, Kathakali</li>
  <li><a href="/collections/honeymoon">Kerala Classic Honeymoon</a> — 7 nights | Hills, backwaters and beach</li>
  <li><a href="/collections/backwaters">Grand Kerala Backwater Journey</a> — 6 nights | Valiyaparamba to Kollam</li>
</ul>
<p>All packages are fully private and customisable. <a href="/plan">Request a bespoke Kerala itinerary</a>.</p>
</main>`,
  },
  {
    route: "/destinations",
    file: "destinations/index.html",
    title: "Kerala Destinations — Munnar, Alleppey, Wayanad, Fort Kochi | Escora Holidays",
    description: "Explore Kerala's iconic destinations — Munnar tea estates, Alleppey backwaters, Thekkady wildlife, Wayanad highlands, Fort Kochi heritage. Private tours by Escora Holidays.",
    body: `<main>
<h1>Kerala Destinations</h1>
<p>Kerala packs an extraordinary range of landscapes into a narrow coastal state. Escora Holidays designs private itineraries across all of Kerala's key destinations.</p>
<ul>
  <li><strong>Munnar</strong> — tea estates, Eravikulam National Park, Nilgiri Tahr, cool highlands at 1,600m</li>
  <li><strong>Alleppey (Alappuzha)</strong> — backwater houseboats, paddy canals, Vembanad Lake</li>
  <li><strong>Thekkady</strong> — Periyar Tiger Reserve, spice estates, jungle safaris, tribal treks</li>
  <li><strong>Wayanad</strong> — coffee estates, Edakkal Caves, waterfalls, wildlife sanctuary</li>
  <li><strong>Fort Kochi</strong> — Chinese fishing nets, colonial heritage, Kathakali, Mattancherry Jew Town</li>
  <li><strong>Varkala</strong> — laterite cliffs, Papanasam Beach, yoga, ayurveda centres</li>
  <li><strong>Kozhikode (Calicut)</strong> — Malabar cuisine, Kappad beach, Beypore dhow yard</li>
  <li><strong>Kumarakom</strong> — Vembanad lakefront, bird sanctuary, slow backwater stays</li>
</ul>
</main>`,
  },
  {
    route: "/plan",
    file: "plan/index.html",
    title: "Plan Your Private Kerala Holiday — Custom Itinerary Builder | Escora Holidays",
    description: "Start planning your bespoke Kerala holiday with Escora Holidays. Tell us your travel dates, group size, and interests — honeymoon, Ayurveda retreat, family trip — and we'll craft your itinerary.",
    body: `<main>
<h1>Plan Your Private Kerala Holiday</h1>
<p>Tell us how you want to travel and we will design a Kerala itinerary built entirely around you. Private transport, hand-picked hotels, specialist guides — everything arranged before you land.</p>
<h2>What to expect</h2>
<ul>
  <li>A personal consultation with an Escora Kerala specialist</li>
  <li>A bespoke day-by-day itinerary within 48 hours</li>
  <li>Hotel options at every category — heritage, boutique, luxury resort</li>
  <li>All ground arrangements: vehicle, driver, guides, permits</li>
</ul>
<p>We specialise in Kerala holidays for travellers from the UK, Europe and the Gulf. <a href="/contact">Contact us</a> to begin.</p>
</main>`,
  },
  {
    route: "/contact",
    file: "contact/index.html",
    title: "Contact Escora Holidays — Kerala Travel Specialists, Kozhikode",
    description: "Contact Escora Holidays to plan your private Kerala journey. Based in Kozhikode, Kerala. Phone, address and enquiry form. UK, Europe and Gulf travellers welcome.",
    body: `<main>
<h1>Contact Escora Holidays</h1>
<p>Speak to an Escora Holidays Kerala travel specialist about your next journey. We respond to all enquiries within 24 hours and send a full bespoke itinerary proposal within 48–72 hours. There is no obligation to book.</p>

<h2>Get in Touch</h2>
<address>
  <strong>Escora Holidays</strong><br>
  [STREET ADDRESS]<br>
  Kozhikode, Kerala 673001<br>
  India<br><br>
  Phone / WhatsApp: <a href="tel:[PHONE]">[PHONE]</a><br>
  Email: <a href="mailto:[EMAIL]">[EMAIL]</a>
</address>

<h2>Plan Your Journey</h2>
<p>The fastest way to get started is our <a href="/plan">journey planner</a> — tell us your travel dates, group size and interests and we will send back a full proposal. Alternatively, call or WhatsApp us directly.</p>

<h2>Find Us</h2>
<p>Our office is in Kozhikode (Calicut), the historic Malabar coast city in northern Kerala — the same port where Vasco da Gama first arrived in India in 1498. Kozhikode International Airport (CCJ) has direct flights from the Gulf. Calicut railway station connects to Kochi, Chennai and Mumbai.</p>
</main>`,
  },
  {
    route: "/privacy-policy",
    file: "privacy-policy/index.html",
    title: "Privacy Policy — Escora Holidays",
    description: "Escora Holidays privacy policy — how we collect, use and protect your personal data.",
    body: `<main><h1>Privacy Policy — Escora Holidays</h1><p>Escora Holidays privacy policy — how we collect, use and protect your personal data.</p></main>`,
  },
  {
    route: "/collections/honeymoon",
    file: "collections/honeymoon/index.html",
    title: "Kerala Honeymoon Packages — Private & Romantic Getaways | Escora Holidays",
    description: "Luxury Kerala honeymoon packages for couples — private houseboat stays on Alleppey backwaters, heritage villas in Munnar, candlelit beach dinners. Fully bespoke honeymoon itineraries by Escora Holidays.",
    body: `<main>
<h1>Kerala Honeymoon Packages — Private &amp; Romantic Getaways</h1>
<p>Escora Holidays designs private Kerala honeymoon packages for couples who want romance without the crowds. Designed for honeymooners from the UK, Europe and the Gulf — houseboat nights on the Alleppey backwaters, candlelit dinners at heritage villas in Munnar, sunrise at Vagamon meadows, and secluded beach stays on the Malabar coast.</p>
<h2>Kerala Honeymoon Packages</h2>
<ul>
  <li>Munnar &amp; Alleppey Honeymoon Escape — 4 nights | Tea estates, private houseboat, backwaters</li>
  <li>Thekkady &amp; Kumarakom Romance — 5 nights | Wildlife lake, Vembanad villa, canoe rides</li>
  <li>Poovar Island Honeymoon Retreat — 3 nights | Island resort, estuary, beach</li>
  <li>Wayanad Honeymoon Hideaway — 4 nights | Coffee estate, misty highlands, tribal forest</li>
  <li>Kerala Classic Honeymoon — Hills, Backwaters &amp; Beach — 7 nights</li>
  <li>Vagamon Meadows Couple Break — 3 nights | Pine groves, paragliding, meadows</li>
  <li>Bekal &amp; Valiyaparamba Northern Honeymoon — 4 nights | Fort, island backwaters</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>How many nights should a Kerala honeymoon be?</h3>
<p>Most couples from the UK and Europe allow 7–10 nights for a Kerala honeymoon. A 7-night itinerary typically covers hills (Munnar or Wayanad), backwaters (Alleppey or Kumarakom) and a beach finish (Kovalam or Varkala). If you have more time, 10–12 nights allows a more relaxed pace with fewer transfers.</p>
<h3>What is the most romantic place to stay in Kerala?</h3>
<p>For couples, the top choices are: a private houseboat on the Alleppey backwaters (most iconic), a heritage villa in the Munnar tea hills, an island resort at Poovar near Kovalam, or a cliffside stay at Varkala. Escora matches the property to your travel style — some couples want seclusion, others want sea views and spa access.</p>
<h3>Is Kerala a good honeymoon destination from the UK?</h3>
<p>Yes — Kerala is one of the most popular honeymoon destinations for UK couples. The direct flight time from London is around 9–10 hours to Kochi or Trivandrum. UK citizens require an Indian e-Visa, which is applied for online before travel and typically approved within 72 hours — straightforward and inexpensive. The time difference is only 4.5–5.5 hours, so jet lag is minimal compared to long-haul Asian destinations.</p>
<h3>What is the best time for a Kerala honeymoon?</h3>
<p>October to March is ideal — dry weather, lush green landscapes, and all attractions fully open. December and January are peak season with the best weather. July–August (monsoon) is deeply atmospheric with misty hills and flowing waterfalls — romantic for couples who don't mind rain, and prices are significantly lower.</p>
<p>All honeymoon packages are fully private. <a href="/plan">Plan your Kerala honeymoon</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How many nights should a Kerala honeymoon be?", "acceptedAnswer": { "@type": "Answer", "text": "Most couples from the UK and Europe allow 7–10 nights for a Kerala honeymoon. A 7-night itinerary typically covers hills (Munnar or Wayanad), backwaters (Alleppey or Kumarakom) and a beach finish. 10–12 nights allows a more relaxed pace with fewer transfers." } },
        { "@type": "Question", "name": "What is the most romantic place to stay in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "Top choices for couples: a private houseboat on the Alleppey backwaters (most iconic), a heritage villa in the Munnar tea hills, an island resort at Poovar near Kovalam, or a cliffside stay at Varkala." } },
        { "@type": "Question", "name": "Is Kerala a good honeymoon destination from the UK?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Kerala is one of the most popular honeymoon destinations for UK couples. Flight time from London is around 9–10 hours to Kochi or Trivandrum. UK citizens require an Indian e-Visa, applied online before travel and typically approved within 72 hours. Jet lag is minimal — only 4.5–5.5 hours time difference." } },
        { "@type": "Question", "name": "What is the best time for a Kerala honeymoon?", "acceptedAnswer": { "@type": "Answer", "text": "October to March is ideal — dry weather, lush green landscapes, all attractions open. December and January are peak season. July–August (monsoon) is romantic with misty hills and waterfalls, and prices are significantly lower." } },
      ],
    },
  },
  {
    route: "/collections/health-wellness",
    file: "collections/health-wellness/index.html",
    title: "Kerala Ayurveda Retreats & Wellness Holidays | Escora Holidays",
    description: "Authentic Ayurveda retreats and wellness holidays in Kerala — Panchakarma, Shirodhara, yoga immersions, and physician-led programmes at Kerala's finest healing centres. Curated by Escora Holidays.",
    body: `<main>
<h1>Kerala Ayurveda Retreats &amp; Wellness Holidays</h1>
<p>Kerala is the heartland of classical Ayurveda — the only region in India where the full Panchakarma purification tradition is still practised with authentic protocols under qualified Ayurvedic physicians. Escora Holidays curates wellness retreats for travellers from the UK, Europe and the Gulf seeking genuine treatment, not spa tourism.</p>
<h2>Kerala Wellness Programmes</h2>
<ul>
  <li>Classical Panchakarma — 14 nights | Full five-stage Ayurvedic purification under physician supervision</li>
  <li>Karkidaka Chikitsa Monsoon Rejuvenation — 7 nights | Best time: July–August</li>
  <li>Stress &amp; Sleep Restoration Retreat — 7 nights | Shirodhara, Yoga Nidra, nervous-system reset</li>
  <li>Yoga &amp; Ayurveda Immersion — 10 nights | Hatha, Ashtanga, daily Ayurvedic treatment</li>
  <li>Weight &amp; Metabolic Balance Programme — 14 nights | Udwarthanam, dietary restructuring</li>
  <li>Spine, Joint &amp; Mobility Care — 10 nights | Kativasti, Greevavasti, orthopaedic Ayurveda</li>
  <li>Weekend Ayurvedic Reset — 2 nights | Abhyanga, Shirodhara, consultation</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>What is Panchakarma and how long does it take?</h3>
<p>Panchakarma is the classical five-stage Ayurvedic purification programme — Vamana (emesis), Virechana (purgation), Vasti (enema therapy), Nasya (nasal cleansing), and Raktamokshana (blood purification). A full programme requires a minimum of 14 nights under continuous physician supervision. Shorter stays (7 nights) deliver preparatory treatments and partial purification but not the full protocol.</p>
<h3>Is Kerala Ayurveda genuine or just spa tourism?</h3>
<p>There is a significant difference. Authentic Ayurveda requires a qualified Ayurvedic physician (BAMS degree), a formal consultation and diagnosis, and treatments prescribed to your constitution (Prakriti) and imbalance (Vikriti). Many hotel spas offer Ayurvedic-style massage under unqualified staff. Escora partners exclusively with physician-led centres where the doctor sees you daily and adjusts the programme throughout.</p>
<h3>What is the best time of year for an Ayurveda retreat in Kerala?</h3>
<p>The monsoon season (June–August) is considered the optimal time for Panchakarma. The cool, humid air opens the pores and maximises absorption of herbal oils. The Karkidaka month (July–August in the Malayalam calendar) is when Kerala Ayurveda centres traditionally offer their most intensive programmes. Off-season pricing is also significantly lower than peak winter months.</p>
<h3>Can I combine an Ayurveda retreat with sightseeing in Kerala?</h3>
<p>Not during an intensive Panchakarma — the programme requires strict diet, rest and continuous treatment. However, Escora designs combination itineraries where the retreat (7–14 nights) is preceded or followed by 3–5 nights of travel — backwaters, Munnar, or Fort Kochi — so you experience both Kerala's healing tradition and its landscapes.</p>
<p><a href="/plan">Enquire about a Kerala Ayurveda retreat</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What is Panchakarma and how long does it take?", "acceptedAnswer": { "@type": "Answer", "text": "Panchakarma is the classical five-stage Ayurvedic purification programme. A full programme requires a minimum of 14 nights under continuous physician supervision. Shorter stays (7 nights) deliver preparatory treatments but not the full protocol." } },
        { "@type": "Question", "name": "Is Kerala Ayurveda genuine or just spa tourism?", "acceptedAnswer": { "@type": "Answer", "text": "Authentic Ayurveda requires a qualified Ayurvedic physician (BAMS degree), a formal consultation, and treatments prescribed to your constitution. Escora partners exclusively with physician-led centres where the doctor sees you daily and adjusts the programme throughout." } },
        { "@type": "Question", "name": "What is the best time of year for an Ayurveda retreat in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "The monsoon season (June–August) is considered optimal for Panchakarma. The cool, humid air maximises absorption of herbal oils. The Karkidaka month (July–August) is when Kerala Ayurveda centres traditionally offer their most intensive programmes." } },
        { "@type": "Question", "name": "Can I combine an Ayurveda retreat with sightseeing in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "Not during an intensive Panchakarma — the programme requires strict diet, rest and continuous treatment. However, Escora designs combination itineraries where the retreat (7–14 nights) is preceded or followed by 3–5 nights of travel through Kerala's backwaters, hills or heritage sites." } },
      ],
    },
  },
  {
    route: "/collections/nature-wildlife",
    file: "collections/nature-wildlife/index.html",
    title: "Kerala Wildlife Safaris & Nature Tours — Wayanad, Thekkady | Escora Holidays",
    description: "Private Kerala wildlife tours — elephant corridors in Wayanad, tiger reserves in Thekkady, shola forests and bird sanctuaries. Expert naturalist-led safaris by Escora Holidays.",
    body: `<main>
<h1>Kerala Wildlife Safaris &amp; Nature Tours</h1>
<p>Kerala holds the largest contiguous stretch of forest in peninsular India — the Western Ghats biodiversity hotspot. Escora Holidays designs private wildlife tours for naturalists, birders and families from the UK, Europe and the Gulf, with specialist guides who have spent decades in these forests.</p>
<h2>Why Kerala for Wildlife</h2>
<p>Kerala's protected areas shelter tigers, leopards, Asian elephants, gaur, lion-tailed macaques, Nilgiri tahrs and over 500 bird species. Unlike many Indian wildlife destinations, Kerala's reserves are set in lush tropical and subtropical forest rather than dry savannah — making them visually extraordinary year-round. Periyar Tiger Reserve, Wayanad Wildlife Sanctuary, Silent Valley National Park and Parambikulam Tiger Reserve each offer a different ecosystem and wildlife profile.</p>
<h2>Kerala Wildlife Packages</h2>
<ul>
  <li><strong>Periyar Tiger Reserve Wildlife Escape — 3 nights</strong> | Boat safari on Periyar Lake, tribal border trek with indigenous guides, bamboo rafting, eco-camp stay inside the buffer zone</li>
  <li><strong>Wayanad Wildlife &amp; Waterfalls — 4 nights</strong> | Muthanga elephant safari at dawn, Soochipara waterfall, Edakkal cave petroglyphs (3,000 BCE), coffee estate walks</li>
  <li><strong>Silent Valley &amp; Nelliyampathy Rainforest Trail — 5 nights</strong> | One of India's last undisturbed primary rainforests, lion-tailed macaques, silent forest treks with Forest Department permit</li>
  <li><strong>Parambikulam Tiger Reserve Expedition — 3 nights</strong> | Treetop bamboo cottage, world's largest teak tree (Kannimara), night safari, tribal community homestay</li>
  <li><strong>Athirappilly &amp; Vazhachal Waterfall Trail — 2 nights</strong> | Kerala's widest waterfall (Athirappilly), hornbill habitat, river kayaking through the forest corridor</li>
  <li><strong>Kerala Birding Circuit — Thattekad &amp; Kumarakom — 5 nights</strong> | Thattekad Bird Sanctuary (Salim Ali's favourite), 300+ species, specialist ornithologist guide</li>
  <li><strong>Eravikulam &amp; Chinnar Highland Wildlife — 4 nights</strong> | Nilgiri Tahr (found nowhere else), grizzled giant squirrel, star tortoise, high-altitude grasslands</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>Can you see tigers in Kerala?</h3>
<p>Yes — Kerala has two tiger reserves: Periyar (Thekkady) and Parambikulam. Tiger sightings are not guaranteed (they never are anywhere), but both reserves have healthy tiger populations. Periyar's boat safari on the lake offers excellent chances to see elephants, gaur and sambar at the water's edge. Night safaris at Parambikulam increase sighting probability. Most guests also see leopards, wild dogs (dholes) and sloth bears.</p>
<h3>What is the best time for a Kerala wildlife safari?</h3>
<p>October to April is optimal — animals congregate around water sources, visibility is clear, and forest tracks are accessible. March–April (just before monsoon) is excellent as water sources dry up and wildlife concentrates. June–September (monsoon) brings lush green forests but many tracks close and leeches are abundant. Birding is exceptional year-round, with migratory species peaking October–February.</p>
<h3>Are Kerala wildlife tours suitable for families with children?</h3>
<p>Yes — Wayanad and Periyar are especially family-friendly. Periyar's boat safari is calm and accessible for all ages. Wayanad has a good mix of wildlife, waterfalls and cave archaeology that keeps children engaged. Escora designs pace and activities around the youngest traveller in the group. Jungle treks into core forest zones have a minimum age of 12 at most reserves.</p>
<h3>Do you need permits for Kerala wildlife reserves?</h3>
<p>Yes — most Kerala wildlife reserves require entry permits and guided treks require Forest Department permission, often booked in advance. Parambikulam night safaris and Silent Valley treks require advance applications. Escora handles all permits, guide bookings and reserve entry as part of every wildlife package — nothing is left to chance on arrival.</p>
<p><a href="/plan">Plan a private Kerala wildlife tour</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Can you see tigers in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Kerala has two tiger reserves: Periyar (Thekkady) and Parambikulam. Tiger sightings are not guaranteed, but both reserves have healthy tiger populations. Most guests also see elephants, gaur, leopards, wild dogs and sloth bears." } },
        { "@type": "Question", "name": "What is the best time for a Kerala wildlife safari?", "acceptedAnswer": { "@type": "Answer", "text": "October to April is optimal — animals congregate around water sources and forest tracks are accessible. March–April is excellent as water sources dry up. Birding is exceptional year-round, with migratory species peaking October–February." } },
        { "@type": "Question", "name": "Are Kerala wildlife tours suitable for families with children?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Wayanad and Periyar are especially family-friendly. Periyar's boat safari is calm and accessible for all ages. Jungle treks into core forest zones have a minimum age of 12 at most reserves." } },
        { "@type": "Question", "name": "Do you need permits for Kerala wildlife reserves?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — most Kerala wildlife reserves require entry permits and guided treks require Forest Department permission, often booked in advance. Escora handles all permits, guide bookings and reserve entry as part of every wildlife package." } },
      ],
    },
  },
  {
    route: "/collections/hill-stations",
    file: "collections/hill-stations/index.html",
    title: "Kerala Hill Station Holidays — Munnar, Wayanad, Vagamon | Escora Holidays",
    description: "Luxury Kerala hill station holidays — misty Munnar tea estates, Wayanad jungle lodges, Vagamon meadows. British-era bungalows, cardamom walks and cool highland escapes curated by Escora Holidays.",
    body: `<main>
<h1>Kerala Hill Station Holidays</h1>
<p>Kerala's Western Ghats rise to over 2,600m, draped in tea estates, coffee plantations, cardamom forests and shola grasslands. Escora Holidays designs private hill station holidays for travellers from the UK, Europe and the Gulf who want to escape the heat and experience Kerala's cooler, quieter highlands at their own pace.</p>
<h2>Kerala's Hill Stations</h2>
<p>Each highland destination has a distinct character. <strong>Munnar</strong> (1,600m) is Kerala's most famous hill station — rolling tea terraces, the rare Nilgiri Tahr, and the cool Eravikulam National Park. <strong>Wayanad</strong> is wilder and more forested — coffee estates, tribal communities, waterfalls and wildlife corridors. <strong>Vagamon</strong> is the quietest — open meadows, pine groves and paragliding above the clouds. <strong>Thekkady</strong> sits at the edge of Periyar Tiger Reserve, straddling highlands and jungle. <strong>Nelliyampathy</strong> and <strong>Ponmudi</strong> remain relatively undiscovered by international visitors.</p>
<h2>Kerala Hill Station Packages</h2>
<ul>
  <li><strong>Munnar Tea Country Short Break — 3 nights</strong> | Tea Museum, Eravikulam National Park, guided estate walk, tasting at a boutique tea factory</li>
  <li><strong>Munnar &amp; Thekkady Highland Combination — 5 nights</strong> | Tea terraces to jungle lake, Periyar boat safari, spice estate tour</li>
  <li><strong>Wayanad Highlands Family Trip — 4 nights</strong> | Muthanga wildlife safari, Edakkal Caves, Soochipara waterfall, tribal culture experience</li>
  <li><strong>Vagamon &amp; Idukki Quiet Hills — 4 nights</strong> | Open meadows, pine forest, Idukki Arch Dam, paragliding option</li>
  <li><strong>Ponmudi &amp; Trivandrum Hill Retreat — 3 nights</strong> | Kerala's least-known hill station, butterfly hotspot, Neyyar Dam, Trivandrum museum</li>
  <li><strong>Nelliyampathy Orange Hills Break — 3 nights</strong> | Citrus and coffee estates, lion-tailed macaque sightings, Pothundi reservoir</li>
  <li><strong>Munnar, Vagamon &amp; Thekkady Grand Hill Circuit — 7 nights</strong> | The full Western Ghats arc from tea country to jungle to meadows</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>What is the best hill station in Kerala?</h3>
<p>Munnar is the most iconic — internationally recognised, with the finest tea scenery and Eravikulam National Park. For a quieter, less-visited experience, Vagamon (meadows and pine forest) or Nelliyampathy (citrus estates, rarely crowded) are excellent alternatives. Wayanad is best for wildlife alongside hill scenery. Escora recommends the combination based on your group and travel pace.</p>
<h3>When is the best time to visit Munnar?</h3>
<p>September to May is ideal for Munnar — cool temperatures between 5°C and 25°C, clear skies, and Eravikulam National Park open (it closes March–April for Nilgiri Tahr calving season). October–February is peak season with the best visibility. June–August (monsoon) brings dramatic mist and fewer crowds, but roads can be challenging and the park closes.</p>
<h3>How do you get to Munnar from Kochi airport?</h3>
<p>Cochin International Airport (COK) is the closest international airport, approximately 3.5–4 hours from Munnar by private car via the Perumbavoor route. Escora arranges private airport transfers as part of every hill station package — your driver meets you at arrivals and handles the mountain roads. The drive itself through rubber plantations rising to tea terraces is part of the experience.</p>
<h3>Are Kerala hill station holidays suitable in the monsoon?</h3>
<p>Wayanad and Vagamon are particularly beautiful during monsoon — lush green, misty, and dramatically atmospheric. Munnar can have road closures during heavy rain. Escora advises on timing, accommodation with all-weather access, and itineraries that work with the conditions rather than against them. Monsoon (June–September) also brings significantly lower prices.</p>
<p><a href="/plan">Plan your Kerala hill station holiday</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What is the best hill station in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "Munnar is the most iconic with the finest tea scenery and Eravikulam National Park. For quieter alternatives, Vagamon (meadows and pine forest) or Nelliyampathy (citrus estates) are excellent. Wayanad is best for wildlife alongside hill scenery." } },
        { "@type": "Question", "name": "When is the best time to visit Munnar?", "acceptedAnswer": { "@type": "Answer", "text": "September to May is ideal — cool temperatures between 5°C and 25°C, clear skies, and the national park open. October–February is peak season. June–August (monsoon) brings dramatic mist and fewer crowds but roads can be challenging." } },
        { "@type": "Question", "name": "How do you get to Munnar from Kochi airport?", "acceptedAnswer": { "@type": "Answer", "text": "Cochin International Airport (COK) is approximately 3.5–4 hours from Munnar by private car. Escora arranges private airport transfers as part of every hill station package." } },
        { "@type": "Question", "name": "Are Kerala hill station holidays suitable in the monsoon?", "acceptedAnswer": { "@type": "Answer", "text": "Wayanad and Vagamon are particularly beautiful during monsoon — lush, misty and atmospheric. Munnar can have road closures in heavy rain. Monsoon (June–September) brings significantly lower prices." } },
      ],
    },
  },
  {
    route: "/collections/backwaters",
    file: "collections/backwaters/index.html",
    title: "Kerala Backwater Houseboat Holidays — Alleppey & Kumarakom | Escora Holidays",
    description: "Private houseboat holidays on Kerala's backwaters — Alleppey, Kumarakom, Vembanad Lake. Traditional kettuvallam charters with chef, away from the tourist circuit. Curated by Escora Holidays.",
    body: `<main>
<h1>Kerala Backwater Houseboat Holidays</h1>
<p>Nine hundred kilometres of interconnected canals, lakes and lagoons run parallel to the Kerala coast — a world apart from the rest of India. The backwaters are one of the country's most distinctive landscapes: paddy fields below sea level in Kuttanad, Chinese fishing nets at Cochin's edge, egrets standing in the shallows of Vembanad Lake. Escora Holidays arranges private houseboat charters, lakeside villa stays and village canoe tours for travellers from the UK, Europe and the Gulf.</p>
<h2>Understanding the Backwaters</h2>
<p>The backwater network stretches from Kasaragod in the north to Thiruvananthapuram in the south. The most famous stretch is around <strong>Alleppey (Alappuzha)</strong> — narrow canals through paddy villages, opening onto Vembanad Lake, Kerala's largest. <strong>Kumarakom</strong> sits on the lake's eastern shore — quieter than Alleppey, with a bird sanctuary and excellent lake-view resorts. <strong>Kollam</strong> is the southern gateway, connected to Alleppey by an 8-hour backwater cruise. The northern backwaters — <strong>Valiyaparamba</strong> and <strong>Ashtamudi</strong> — are almost completely undiscovered by international visitors.</p>
<h2>Kerala Backwater Packages</h2>
<ul>
  <li><strong>Alleppey Overnight Houseboat — 1 night</strong> | Private kettuvallam with chef on board, sunset on Vembanad Lake, village canal cruise at dawn</li>
  <li><strong>Alleppey &amp; Kumarakom Backwater Combination — 3 nights</strong> | Houseboat on the canals, lakeside villa on Vembanad, bird sanctuary canoe at sunrise</li>
  <li><strong>Kollam to Alleppey Full-Day Backwater Cruise — 2 nights</strong> | 8-hour private motorboat journey through the canal network from south to north</li>
  <li><strong>Kumarakom Lakeside Slow Stay — 3 nights</strong> | Bird sanctuary canoe tour, dhow sunset cruise on Vembanad, Kottayam rubber estate walk</li>
  <li><strong>Kuttanad Village &amp; Paddy Country Experience — 2 nights</strong> | The below-sea-level farming region, traditional Kerala meals, village cycle tour, toddy shop culture</li>
  <li><strong>Valiyaparamba Northern Backwaters — 3 nights</strong> | Island resort in the least-visited backwater region, mangrove channels, fishing villages</li>
  <li><strong>Grand Kerala Backwater Journey — 6 nights</strong> | North to south: Valiyaparamba island → Kannur → Kozhikode → Cochin → Alleppey → Kollam</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>What is a Kerala houseboat like?</h3>
<p>A traditional Kerala houseboat (kettuvallam) is a converted rice barge — typically 60–80 feet long, with one to three bedrooms, a living area, a sundeck, and a kitchen where a chef cooks fresh Kerala meals. Escora charters private houseboats exclusively — you do not share with other guests. Premium houseboats have air-conditioned bedrooms, hot water, and designer interiors, while traditional boats have cane furniture and open windows for the canal breeze.</p>
<h3>How far in advance should you book a Kerala houseboat?</h3>
<p>For peak season (October–March), premium private houseboats should be booked 3–6 months in advance. The best boats on Vembanad Lake and the quieter Kumarakom channels are taken early. Last-minute availability exists but choice is limited. Escora secures houseboats as part of the full itinerary booking — you will not arrive to find your boat unavailable.</p>
<h3>Is one night enough on a Kerala houseboat?</h3>
<p>One night is the standard experience and is worthwhile — you get a full evening on the water, a Kerala dinner on the deck, and a dawn cruise before disembarkation. However, two nights allows the boat to travel further into less-visited canals, slow down, and give you a genuine sense of the backwater rhythm. Escora recommends two nights for those who are not combining the houseboat with other backwater accommodation.</p>
<h3>What is the difference between Alleppey and Kumarakom houseboats?</h3>
<p>Alleppey (Alappuzha) has the largest houseboat fleet and the most famous canal network — narrow village waterways that open onto Vembanad Lake. It is busier, especially at peak times. Kumarakom is quieter — on the eastern shore of the lake — with fewer boats, better birdwatching, and slightly more upmarket resort options. Escora generally recommends starting in Alleppey canals and transitioning to a Kumarakom lakefront property for the combination experience.</p>
<p><a href="/plan">Book a private Kerala houseboat holiday</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What is a Kerala houseboat like?", "acceptedAnswer": { "@type": "Answer", "text": "A traditional Kerala houseboat (kettuvallam) is a converted rice barge — typically 60–80 feet long with bedrooms, a living area, sundeck, and a kitchen with an on-board chef. Escora charters private houseboats exclusively — you do not share with other guests." } },
        { "@type": "Question", "name": "How far in advance should you book a Kerala houseboat?", "acceptedAnswer": { "@type": "Answer", "text": "For peak season (October–March), premium private houseboats should be booked 3–6 months in advance. The best boats are taken early. Escora secures houseboats as part of the full itinerary booking." } },
        { "@type": "Question", "name": "Is one night enough on a Kerala houseboat?", "acceptedAnswer": { "@type": "Answer", "text": "One night is worthwhile — you get a full evening on the water and a dawn cruise. Two nights allows the boat to travel further into less-visited canals and gives a genuine sense of the backwater rhythm." } },
        { "@type": "Question", "name": "What is the difference between Alleppey and Kumarakom houseboats?", "acceptedAnswer": { "@type": "Answer", "text": "Alleppey has the largest fleet and most famous canal network but is busier. Kumarakom is quieter, on the lake's eastern shore, with better birdwatching. Escora recommends combining both for the full backwater experience." } },
      ],
    },
  },
  {
    route: "/collections/beaches",
    file: "collections/beaches/index.html",
    title: "Kerala Beach Holidays — Kovalam, Varkala, Marari, Bekal | Escora Holidays",
    description: "Private Kerala beach holidays — Kovalam lighthouse, Varkala cliffs, Marari fishing village, Bekal fort, Kappad historic landing. Curated by Escora Holidays.",
    body: `<main>
<h1>Kerala Beach Holidays</h1>
<p>Kerala's Arabian Sea coastline stretches 580km from Kasaragod in the north to Thiruvananthapuram in the south — lined with coconut palms, fishing villages, laterite cliffs and ancient ports. Unlike Goa, Kerala's beaches are quieter, less commercialised, and set against a backdrop of genuine culture. Escora Holidays designs private beach holidays for travellers from the UK, Europe and the Gulf who want sun and sea without the package-holiday crowd.</p>
<h2>Kerala's Best Beaches</h2>
<p><strong>Kovalam</strong> (Thiruvananthapuram district) has three crescent bays anchored by a lighthouse headland — the most accessible beach destination in South Kerala. <strong>Varkala</strong> is built on laterite cliffs above the sea, with a spring-fed beach considered sacred by Hindus. <strong>Marari</strong> is a quiet fishing village near Alleppey with one of Kerala's finest beach resorts and almost no commercial development. <strong>Bekal</strong> in the far north has a 17th-century fort that extends into the sea — dramatic, historically significant and largely undiscovered. <strong>Kappad</strong> (Kozhikode district) is where Vasco da Gama first landed in India in 1498.</p>
<h2>Kerala Beach Packages</h2>
<ul>
  <li><strong>Kovalam Beach Break — 3 nights</strong> | Lighthouse beach, cliff-top Ayurveda spas, day trip to Padmanabhapuram Palace and Trivandrum</li>
  <li><strong>Varkala Cliff &amp; Beach Stay — 3 nights</strong> | Laterite cliff-top guesthouses, Papanasam sacred spring beach, sunrise yoga, north cliff sunset</li>
  <li><strong>Marari Beach Village Stay — 3 nights</strong> | Quiet fishing village, cycle tours through paddy fields, no hawkers, world-class resort option</li>
  <li><strong>Bekal &amp; Kannur Northern Beaches — 4 nights</strong> | Bekal Fort at sunset, Theyyam ritual performance, Kannur loom weaving, Muzhappilangad drive-in beach</li>
  <li><strong>Kappad &amp; Beypore Malabar Coast — 3 nights</strong> | Vasco da Gama landing site, Beypore dhow yard (urus built for Arab merchants), Kozhikode fish market</li>
  <li><strong>Poovar &amp; Kovalam Southern Coast — 4 nights</strong> | Poovar island resort (accessible only by boat), Neyyar Dam crocodile park, Kovalam lighthouse</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>Which is the best beach in Kerala?</h3>
<p>For seclusion and quality: Marari (quiet fishing village, world-class resort, no crowds). For drama and atmosphere: Varkala (laterite cliffs, sacred beach, cliff-top cafes). For convenience and facilities: Kovalam (three bays, easy Trivandrum airport access, established Ayurveda centres). For the adventurous: Bekal (17th-century fort extending into the sea, almost no foreign tourists). Escora matches the beach to your travel style.</p>
<h3>Is Kerala safe for swimming?</h3>
<p>Most of Kerala's main beaches have lifeguards and flag systems during peak season (October–March). Kovalam's Lighthouse Beach and Hawa Beach are the most patrolled. Varkala's Papanasam Beach has calmer waters than the cliff beaches. The Arabian Sea can have strong currents during monsoon (June–September) — swimming is generally not advisable then. Escora advises on conditions at each beach as part of the itinerary briefing.</p>
<h3>Can you combine a Kerala beach holiday with backwaters?</h3>
<p>Yes — combining backwaters and beach is the most popular Kerala itinerary structure. A typical arrangement: fly into Kochi, do Munnar or Thekkady (2–3 nights), then Alleppey houseboat (1–2 nights), then a beach finish at Kovalam or Varkala (2–3 nights) before flying home from Trivandrum. Escora designs this as a single private circuit — one vehicle, one driver, everything pre-arranged.</p>
<h3>When is the best time for a Kerala beach holiday?</h3>
<p>November to March is ideal — the northeast monsoon has passed, seas are calm, and temperatures are 28–32°C. October and April are shoulder months with fewer crowds. May–September is monsoon — strong currents and rough seas make beach holidays inadvisable on the west coast, though this is the best time for Ayurveda retreats inland.</p>
<p><a href="/plan">Plan your Kerala beach holiday</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Which is the best beach in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "For seclusion: Marari (quiet fishing village, no crowds). For drama: Varkala (laterite cliffs, sacred beach). For convenience: Kovalam (three bays, airport access). For the adventurous: Bekal (17th-century fort extending into the sea)." } },
        { "@type": "Question", "name": "Is Kerala safe for swimming?", "acceptedAnswer": { "@type": "Answer", "text": "Most main beaches have lifeguards during peak season (October–March). The Arabian Sea can have strong currents during monsoon (June–September) when swimming is generally not advisable." } },
        { "@type": "Question", "name": "Can you combine a Kerala beach holiday with backwaters?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — combining backwaters and beach is the most popular Kerala itinerary. Typical structure: Kochi → Munnar → Alleppey houseboat → Kovalam or Varkala beach. Escora designs this as a single private circuit." } },
        { "@type": "Question", "name": "When is the best time for a Kerala beach holiday?", "acceptedAnswer": { "@type": "Answer", "text": "November to March is ideal — calm seas, temperatures 28–32°C. May–September is monsoon with rough seas making beach holidays inadvisable on the west coast." } },
      ],
    },
  },
  {
    route: "/collections/functional-medicine",
    file: "collections/functional-medicine/index.html",
    title: "Functional Medicine Retreats Kerala — Root-Cause Health Programmes | Escora Holidays",
    description: "Integrated functional medicine retreats in Kerala — comprehensive diagnostic testing combined with classical Ayurvedic treatment. Gut health, metabolic, hormone and detox programmes by Escora Holidays.",
    body: `<main>
<h1>Functional Medicine Retreats in Kerala</h1>
<p>Functional medicine asks why a disease exists, not just what it is. Escora Holidays partners with board-certified functional medicine physicians in Kozhikode, Kerala, to offer integrated health programmes that combine Western diagnostic testing — blood panels, microbiome analysis, hormone assays, metabolic markers — with classical Ayurvedic treatment protocols. Designed for people from the UK, Europe and the Gulf who have tried conventional approaches and want to go deeper.</p>
<h2>What Functional Medicine in Kerala Offers</h2>
<p>Kerala has a unique advantage: qualified Ayurvedic physicians (BAMS, MD Ayurveda) practising alongside Western-trained doctors who understand functional medicine frameworks. This means a programme can include a comprehensive diagnostic panel (identifying root causes), a personalised Ayurvedic treatment protocol (addressing those causes through the body's systems), and a nutritional and lifestyle plan (sustaining outcomes after you return home). No other region in India offers this integration at clinical depth.</p>
<h2>Functional Medicine Programmes</h2>
<ul>
  <li><strong>Functional Medicine Root-Cause Assessment — 5 nights</strong> | Comprehensive blood panel (80+ markers), gut permeability test, systems biology map, personalised 90-day protocol</li>
  <li><strong>Gut Health &amp; Digestive Reset — 10 nights</strong> | GI-MAP microbiome testing, 5R gut restoration protocol, Vasti series (Ayurvedic colon therapy), elimination diet with daily physician review</li>
  <li><strong>Metabolic &amp; Blood Sugar Programme — 14 nights</strong> | Continuous glucose monitor (CGM), HbA1c and insulin resistance panel, Panchakarma purification, low-glycaemic Ayurvedic diet</li>
  <li><strong>Hormone &amp; Thyroid Support Programme — 10 nights</strong> | Full endocrine panel (cortisol, thyroid, sex hormones, adrenals), rasayana herbal protocols, stress regulation, sleep optimisation</li>
  <li><strong>Detox &amp; Environmental Load Programme — 7 nights</strong> | Heavy metals testing, mycotoxin assessment, Virechana (therapeutic purgation), drainage support protocols</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>What conditions does functional medicine in Kerala address?</h3>
<p>The programmes at Escora's partner centre are most effective for: chronic fatigue and burnout, digestive disorders (IBS, IBD, SIBO), metabolic conditions (type 2 diabetes, insulin resistance, obesity), autoimmune conditions, hormonal imbalances (thyroid, adrenal, reproductive hormones), and chronic inflammatory conditions. These are YMYL health topics — Escora's partner physicians hold BAMS and functional medicine certifications and provide full documentation of qualifications on request.</p>
<h3>Is functional medicine the same as Ayurveda?</h3>
<p>No — they are complementary frameworks. Functional medicine is a Western systems-biology approach that uses advanced diagnostics to identify root causes. Ayurveda is a classical Indian healing system that uses herbal medicine, dietary therapy and treatment protocols to restore balance. The integration works because both are patient-specific and systems-focused, unlike conventional medicine's symptom-suppression approach. Kerala is one of the few places in the world where genuinely qualified practitioners of both systems practise together.</p>
<h3>Do I need to prepare before a functional medicine programme in Kerala?</h3>
<p>Yes — Escora sends a pre-programme preparation guide 4 weeks before arrival. This includes: preliminary blood tests you can do at home (to establish baseline and allow comparison), dietary adjustments in the 2 weeks prior, medication review with your GP, and a pre-arrival consultation with the Kerala physician. Arriving prepared significantly improves outcomes and allows the programme to begin active treatment from day one.</p>
<h3>Is the functional medicine programme suitable for someone on medication?</h3>
<p>Potentially yes, with careful management. The Kerala physicians review all current medications before designing the programme and liaise with your UK/European GP as needed. Certain medications are contraindicated with Panchakarma procedures. A pre-programme consultation (by video call) is mandatory for anyone on regular medication to ensure the programme is safe and appropriate.</p>
<p><a href="/plan">Enquire about a functional medicine programme in Kerala</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What conditions does functional medicine in Kerala address?", "acceptedAnswer": { "@type": "Answer", "text": "The programmes are most effective for chronic fatigue, digestive disorders (IBS, SIBO), metabolic conditions (type 2 diabetes, insulin resistance), autoimmune conditions, hormonal imbalances, and chronic inflammatory conditions." } },
        { "@type": "Question", "name": "Is functional medicine the same as Ayurveda?", "acceptedAnswer": { "@type": "Answer", "text": "No — they are complementary frameworks. Functional medicine is a Western systems-biology approach using advanced diagnostics. Ayurveda is a classical Indian healing system. Kerala is one of the few places where genuinely qualified practitioners of both systems work together." } },
        { "@type": "Question", "name": "Do I need to prepare before a functional medicine programme in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Escora sends a pre-programme guide 4 weeks before arrival including preliminary blood tests, dietary adjustments, medication review, and a pre-arrival consultation with the Kerala physician." } },
        { "@type": "Question", "name": "Is the functional medicine programme suitable for someone on medication?", "acceptedAnswer": { "@type": "Answer", "text": "Potentially yes, with careful management. The Kerala physicians review all medications before designing the programme. A pre-programme video consultation is mandatory for anyone on regular medication." } },
      ],
    },
  },
  {
    route: "/collections/historical-heritage",
    file: "collections/historical-heritage/index.html",
    title: "Kerala Heritage Tours — Fort Kochi, Travancore, Muziris | Escora Holidays",
    description: "Private Kerala heritage tours — Fort Kochi colonial quarter, Travancore royal palaces, ancient Spice Route port of Muziris, temple trails. Expert guided history tours by Escora Holidays.",
    body: `<main>
<h1>Kerala Heritage &amp; History Tours</h1>
<p>Kerala's history is three thousand years deep and extraordinarily layered. The ancient Spice Route brought Arab, Chinese, Jewish, Portuguese, Dutch and British traders to this narrow coastal strip — each leaving a distinct architectural and cultural imprint. Escora Holidays designs private heritage tours for travellers from the UK, Europe and the Gulf who want to understand what they are looking at, not just see it. Every tour includes a specialist local historian or heritage guide.</p>
<h2>Kerala's Heritage Layers</h2>
<p>Fort Kochi (Cochin) is the most concentrated heritage destination in Kerala — a single square kilometre holding Chinese fishing nets, a Portuguese cathedral (1503), a Dutch cemetery, a 16th-century synagogue, and the Mattancherry Palace painted with Kerala murals. The Travancore kingdom (1729–1949) left palaces, temples and a distinct architectural tradition across South Kerala. The Malabar coast (Kozhikode, Kannur) holds the memory of the first Portuguese landing in 1498 and the Zamorin's spice trade empire. The ancient Spice Route port of Muziris (near today's Kodungallur) is one of the most significant and undervisited archaeological sites in India.</p>
<h2>Kerala Heritage Packages</h2>
<ul>
  <li><strong>Fort Kochi Heritage Walk &amp; Stay — 3 nights</strong> | Dutch, Portuguese, Jewish and British Kochi with a heritage architect guide; Kathakali performance; Mattancherry Jew Town antique quarter; Chinese fishing nets at dawn</li>
  <li><strong>Temple Trail of Central Kerala — 4 nights</strong> | Guruvayur (one of India's most visited temples), Vadakkunnathan Shiva temple (Thrissur), Kerala Kalamandalam classical arts academy, Thrissur Pooram procession grounds</li>
  <li><strong>Travancore Royal Heritage Circuit — 5 nights</strong> | Padmanabhapuram Palace (16th-century teak masterpiece), Thiruvananthapuram museums, Kollam Krishnapuram Palace, Kuttanad backwaters</li>
  <li><strong>Muziris Heritage Trail — 3 nights</strong> | Pattanam archaeological excavations (Roman amphorae, Chinese ceramics), Kodungallur Cheraman Perumal Mosque (believed oldest mosque in India), Jewish settlement at Chennamangalam</li>
</ul>
<h2>Frequently Asked Questions</h2>
<h3>What is Fort Kochi and why is it historically significant?</h3>
<p>Fort Kochi (also called Cochin or Kochi) is a peninsula at the mouth of a natural harbour that became the first European colonial settlement in India when the Portuguese built a fort here in 1503. Over the next 400 years, the Dutch, then the British, controlled it — leaving an extraordinary architectural palimpsest. It is the only place in the world where you can find a 16th-century Portuguese church, a Dutch-era palace, an active Jewish synagogue and Chinese-designed fishing nets within a 10-minute walk. The area is a UNESCO tentative World Heritage site.</p>
<h3>What is the Muziris Heritage Project?</h3>
<p>Muziris was the most important port in ancient South Asia — mentioned in Greek, Roman, Arabic and Chinese texts as the source of Kerala's spices, particularly black pepper. Archaeological excavations at Pattanam (near Kodungallur, North Kerala) have uncovered Roman amphorae, Chinese ceramics, and evidence of a 1st-century BCE cosmopolitan trading city. The Muziris Heritage Project is a government initiative preserving 25 heritage sites across the Periyar river delta. Escora arranges access to active excavation sites and specialist archaeological guides.</p>
<h3>Is it possible to attend a Kathakali performance in Kerala?</h3>
<p>Yes — Kathakali (classical Kerala dance-drama) is performed nightly at several venues in Fort Kochi and Thrissur. Tourist-facing performances typically show a 45-minute excerpt with a pre-performance makeup demonstration. For a more authentic experience, full-length performances (4–8 hours) are staged at Kerala Kalamandalam (the national academy in Thrissur) during festival seasons. Escora arranges both, depending on your preference and travel timing.</p>
<h3>How long do you need for a Kerala heritage tour?</h3>
<p>Fort Kochi alone deserves 2–3 nights to explore properly. A comprehensive heritage circuit covering Kochi, Thrissur and Trivandrum/Padmanabhapuram requires 7–10 nights. Escora can design a standalone heritage tour or weave heritage into a broader Kerala itinerary that includes backwaters or hill stations. The Travancore circuit pairs particularly well with a Kovalam beach finish.</p>
<p><a href="/plan">Plan a private Kerala heritage tour</a>.</p>
</main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What is Fort Kochi and why is it historically significant?", "acceptedAnswer": { "@type": "Answer", "text": "Fort Kochi is a peninsula that became the first European colonial settlement in India when the Portuguese built a fort in 1503. It holds a Portuguese church, Dutch palace, Jewish synagogue and Chinese fishing nets within a 10-minute walk. It is a UNESCO tentative World Heritage site." } },
        { "@type": "Question", "name": "What is the Muziris Heritage Project?", "acceptedAnswer": { "@type": "Answer", "text": "Muziris was the most important port in ancient South Asia, mentioned in Greek, Roman and Arabic texts. Archaeological excavations at Pattanam have uncovered Roman amphorae and evidence of a 1st-century BCE trading city. The Muziris Heritage Project preserves 25 heritage sites across the Periyar delta." } },
        { "@type": "Question", "name": "Is it possible to attend a Kathakali performance in Kerala?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Kathakali is performed nightly at venues in Fort Kochi and Thrissur. Tourist performances show a 45-minute excerpt. Full-length performances (4–8 hours) are staged at Kerala Kalamandalam during festival seasons." } },
        { "@type": "Question", "name": "How long do you need for a Kerala heritage tour?", "acceptedAnswer": { "@type": "Answer", "text": "Fort Kochi alone deserves 2–3 nights. A comprehensive circuit covering Kochi, Thrissur and Trivandrum requires 7–10 nights. Heritage can also be woven into a broader itinerary with backwaters or hill stations." } },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers — patch specific tags in the base HTML
// ---------------------------------------------------------------------------
function patchTag(html, selector, newValue) {
  // Replaces content= or href= of a specific meta/link tag
  return html.replace(selector, newValue);
}

function setTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
}

function setMeta(html, nameOrProp, attrType, value) {
  const attr = attrType === "property" ? "property" : "name";
  const re = new RegExp(`(<meta\\s+${attr}=["']${nameOrProp}["']\\s+content=["'])[^"']*`, "i");
  if (re.test(html)) {
    return html.replace(re, `$1${value}`);
  }
  // Also try content-first order
  const re2 = new RegExp(`(<meta\\s+content=["'])[^"']*?(["']\\s+${attr}=["']${nameOrProp}["'])`, "i");
  return html.replace(re2, `$1${value}$2`);
}

function setCanonical(html, url) {
  return html.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])[^"']*["']/i,
    `$1${url}"`
  );
}

function injectBody(html, bodyHtml) {
  // Wrap static SEO content in a hidden shell so it's invisible until React hydrates.
  // The inline style sets visibility:hidden (not display:none — display:none removes
  // the element from layout entirely and can cause hydration mismatches).
  // React removes the #seo-shell element on first render via useEffect in main.tsx.
  const shell = `<div id="seo-shell" style="visibility:hidden;position:absolute;width:1px;height:1px;overflow:hidden" aria-hidden="true">${bodyHtml}</div>`;
  if (html.includes('<div id="root"></div>')) {
    return html.replace('<div id="root"></div>', `<div id="root">${shell}</div>`);
  }
  return html.replace('<div id="root">', `<div id="root">${shell}`);
}

function injectSchema(html, schema) {
  // Insert additional JSON-LD block just before </head>
  const tag = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
  return html.replace("</head>", `${tag}\n</head>`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const baseHtml = readFileSync(join(DIST, "index.html"), "utf8");

let ok = 0;

for (const { route, file, title, description, body, schema } of ROUTES) {
  const outPath = join(DIST, file);
  const url = `${ORIGIN}${route}`;

  let html = baseHtml;

  // Patch head tags
  html = setTitle(html, title);
  html = setMeta(html, "description", "name", description);
  html = setCanonical(html, url);
  html = setMeta(html, "og:title", "property", title);
  html = setMeta(html, "og:description", "property", description);
  html = setMeta(html, "og:url", "property", url);
  html = setMeta(html, "twitter:title", "name", title);
  html = setMeta(html, "twitter:description", "name", description);

  // Inject per-route schema (e.g. FAQPage)
  if (schema) html = injectSchema(html, schema);

  // Inject static body content
  html = injectBody(html, body);

  // Write
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf8");

  const size = Buffer.byteLength(html, "utf8");
  console.log(`  ✅  ${route.padEnd(40)} ${(size / 1024).toFixed(1)} KB  canonical: ${url}`);
  ok++;
}

console.log(`\n🎉  SEO shells complete: ${ok} routes with correct per-route canonical/title/og:url`);
