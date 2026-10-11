/**
 * Seed script — populates the database with sample Escora content.
 * Run with: MONGODB_URI=<url> pnpm --filter @workspace/db seed
 * Safe to re-run: skips if destinations already exist.
 */
import { connectDB, disconnectDB } from "../connection";
import { DestinationModel, PackageModel, JournalPostModel, syncSequence } from "../models";

async function main() {
  await connectDB();

  // ── Guard: skip if already seeded ─────────────────────────────────────────
  const existingDests = await DestinationModel.countDocuments();
  if (existingDests > 0) {
    console.log(`Seed skipped — database already has ${existingDests} destinations.`);
    await disconnectDB();
    process.exit(0);
  }

  console.log("Seeding database…");

  // ── Destinations ──────────────────────────────────────────────────────────
  const destinationsData = [
    {
      name: "Fort Kochi",
      slug: "fort-kochi",
      region: "Ernakulam",
      type: "Heritage",
      shortDesc: "A living museum of colonial India — Dutch mansions, Chinese fishing nets and spice-scented lanes.",
      description: "Fort Kochi is unlike anywhere else in India. Portuguese, Dutch, British and Jewish settlers each left their mark on this peninsula, creating a labyrinth of heritage bungalows, art galleries and waterfront cafés. The iconic Chinese fishing nets silhouette the horizon at sunset, while Mattancherry's Jew Town still smells of cardamom and pepper. It is the ideal arrival point for any Kerala journey.",
      imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80",
      latitude: 9.9658,
      longitude: 76.2421,
      bestSeason: "October – March",
      nightsMin: 1,
      nightsMax: 2,
      published: true,
    },
    {
      name: "Munnar",
      slug: "munnar",
      region: "Idukki",
      type: "Hill Station",
      shortDesc: "Endless emerald tea estates rolling across the Western Ghats at 1,600 m above sea level.",
      description: "Munnar's landscape is unlike any other in Kerala — every slope carpeted in the precise geometry of tea bushes, punctuated by colonial planters' bungalows and rushing silver streams. The air is cool and carries the scent of eucalyptus and cardamom. Eravikulam National Park shelters the endangered Nilgiri Tahr, and on clear mornings Anamudi — South India's highest peak — dominates the horizon.",
      imageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=2000&q=80",
      latitude: 10.0889,
      longitude: 77.0595,
      bestSeason: "September – May",
      elevation: "1,600 m",
      nightsMin: 2,
      nightsMax: 3,
      published: true,
    },
    {
      name: "Alleppey",
      slug: "alleppey",
      region: "Alappuzha",
      type: "Backwaters",
      shortDesc: "Nine hundred kilometres of interlocking canals, lagoons and paddy fields — Kerala's 'Venice of the East'.",
      description: "Alleppey is the heart of Kerala's backwater country. Traditional rice barges — kettuvallams — have been transformed into floating hotels where time slows to the pace of a pole. Narrow canals thread through villages where life has remained unchanged for centuries: canoe-school runs, coir weaving on verandahs, and fishermen hauling nets at dawn. The Vembanad Lake opens into an expanse that feels oceanic at sunset.",
      imageUrl: "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=2000&q=80",
      latitude: 9.4981,
      longitude: 76.3388,
      bestSeason: "November – February",
      nightsMin: 1,
      nightsMax: 2,
      published: true,
    },
    {
      name: "Thekkady",
      slug: "thekkady",
      region: "Idukki",
      type: "Wildlife",
      shortDesc: "Periyar Tiger Reserve and spice estates in the high ranges — Kerala's most biodiverse corner.",
      description: "At the edge of the Periyar Tiger Reserve, Thekkady is where the jungle presses in from every direction. The artificial Periyar Lake, created in 1895, reflects forested slopes where elephants, gaur and rare birds come to drink at dawn. Beyond the reserve, working spice estates offer tours through groves of cardamom, black pepper, cinnamon and vanilla. The experience is sensory in the most literal sense.",
      imageUrl: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=2000&q=80",
      latitude: 9.6001,
      longitude: 77.1648,
      bestSeason: "October – April",
      nightsMin: 2,
      nightsMax: 2,
      published: true,
    },
    {
      name: "Wayanad",
      slug: "wayanad",
      region: "Wayanad",
      type: "Forest",
      shortDesc: "Highland forests, tribal heritage and mist-wrapped coffee estates — Kerala's wild, least-visited corner.",
      description: "Wayanad sits at the junction of three states and three forest ranges, which is why its biodiversity is staggering. Ancient Edakkal Caves bear rock carvings older than the pyramids. Adivasi communities — Kurichiyar, Paniyas and Kattunaikkans — call these forests home and offer rare cultural encounters. The coffee and tea estates here are smaller, wilder and less manicured than Munnar, which gives the landscape an untamed quality.",
      imageUrl: "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=2000&q=80",
      latitude: 11.6854,
      longitude: 76.1320,
      bestSeason: "October – May",
      elevation: "700–2,100 m",
      nightsMin: 2,
      nightsMax: 3,
      published: true,
    },
  ];
  for (let i = 0; i < destinationsData.length; i++) {
    await DestinationModel.create({ ...destinationsData[i], id: i + 1 });
  }
  await syncSequence("destinations", destinationsData.length);
  console.log(`✓ ${destinationsData.length} destinations inserted`);

  // ── Packages ──────────────────────────────────────────────────────────────
  const packagesData = [
    {
      name: "The Malabar Escape",
      slug: "malabar-escape",
      category: "Honeymoon",
      shortDesc: "A private five-night journey through Fort Kochi's heritage lanes, Munnar's tea estates and Alleppey's houseboat backwaters.",
      description: "Begin in the candlelit lanes of Fort Kochi, where colonial history and contemporary art collide. Ascend through rubber estates to the cool air of Munnar's tea country. End aboard your private kettuvallam houseboat, drifting Alleppey's labyrinthine canals as the sun sets over the paddy fields. Every stay is a heritage property; every meal is curated from the morning's market.",
      durationNights: 5,
      route: "Fort Kochi → Munnar → Alleppey",
      bestFor: "Couples, Honeymooners",
      season: "October – March",
      priceFrom: 150000,
      heroImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80",
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival in Fort Kochi", description: "Private transfer from Cochin International Airport to your heritage boutique hotel in Fort Kochi. Afternoon walking tour of Jew Town, the Dutch Palace and the Chinese fishing nets. Sunset cocktails at a waterfront bar. Welcome dinner of Keralan seafood." },
        { day: 2, title: "Fort Kochi at Leisure", description: "Morning visit to the vibrant Mattancherry spice market. Kochi Biennale art trail at your own pace. Afternoon Kathakali performance at a heritage venue. Private cooking class: learn to prepare a traditional sadya." },
        { day: 3, title: "Ascent to Munnar", description: "Morning transfer to Munnar (4 hrs) through rubber and pepper plantations. Check in to a colonial planter's bungalow. Afternoon guided tea-estate walk with the estate manager. Tea tasting session. Sunset from the lawn with panoramic Western Ghats views." },
        { day: 4, title: "Munnar High Ranges", description: "Sunrise birdwatching walk in Eravikulam National Park. Encounter the Nilgiri Tahr. Afternoon at leisure — spa treatments, optional mountain cycling. Evening: stargazing session with the estate's telescope." },
        { day: 5, title: "Backwaters & Houseboat Boarding", description: "Morning drive to Alleppey (3 hrs). Board your private kettuvallam houseboat after lunch. Afternoon cruise through narrow village canals. Watch the life of the backwater villages unfold from your sun deck. Dinner prepared by your onboard chef: fresh Kerala fish curry, thoran and rice." },
      ]),
      inclusions: JSON.stringify([
        "5 nights accommodation in hand-picked heritage properties",
        "All transfers in private air-conditioned vehicle",
        "Daily breakfast and all dinners",
        "Personal Escora concierge throughout",
        "Fort Kochi walking tour with heritage guide",
        "Tea-estate walk and tasting at Munnar",
        "Kathakali performance tickets",
        "Private cooking class",
        "Eravikulam Park entry and guided walk",
        "Full-day private houseboat charter",
      ]),
      exclusions: JSON.stringify([
        "International and domestic flights",
        "Lunches (except Day 5 on houseboat)",
        "Personal expenses, tips and gratuities",
        "Camera fees at monuments",
        "Travel insurance",
      ]),
      tags: "honeymoon, heritage, backwaters, tea-estates, houseboat",
      featured: true,
      published: true,
    },
    {
      name: "Cardamom Hills Retreat",
      slug: "cardamom-hills",
      category: "Wellness",
      shortDesc: "Four nights of deep restoration among Munnar's cardamom groves and Thekkady's jungle edge — yoga, ayurveda and spice-estate walks.",
      description: "This itinerary is designed for those who need to genuinely disconnect. Nights in a working cardamom estate where the silence after sunset is absolute. Mornings with a personal yoga instructor. Days punctuated by ayurvedic treatments drawn from 5,000-year-old tradition. An evening boat ride on the Periyar Lake to watch elephants at the water's edge. No agenda. No rush.",
      durationNights: 4,
      route: "Munnar → Thekkady",
      bestFor: "Wellness seekers, Couples, Solo travellers",
      season: "September – May",
      priceFrom: 120000,
      heroImageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=2000&q=80",
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival in Munnar", description: "Transfer from Cochin Airport to your cardamom estate stay (4.5 hrs). Check in, orientation walk with the estate manager. Evening meditation session. Farm-to-table dinner on the veranda." },
        { day: 2, title: "Tea, Cardamom & Ayurveda", description: "6am sunrise yoga on the lawn. Breakfast. Guided spice-estate tour: identify, smell and taste cardamom, vanilla, cinnamon and pepper at source. Afternoon: 3-hour Abhyanga ayurvedic massage at the estate's treatment centre. Herbal steam bath. Light Keralan dinner." },
        { day: 3, title: "Forest & Waterfall Walk", description: "Morning nature walk to a private waterfall — your guide is a local tribal naturalist. Swim in the natural pool. Picnic lunch by the water. Afternoon: cooking class focused on Kerala's anti-inflammatory spice traditions. Evening: documentary on Kerala's spice trade history." },
        { day: 4, title: "Transfer to Thekkady", description: "Morning drive to Thekkady (1.5 hrs). Check in to your jungle-edge retreat. Afternoon boat ride on Periyar Lake to observe wild elephants, deer and birds. Sunset yoga. Final farewell dinner with the estate's signature black-pepper venison." },
      ]),
      inclusions: JSON.stringify([
        "4 nights accommodation in estate and jungle retreat",
        "All transfers",
        "Daily breakfast and all dinners",
        "Sunrise yoga — all days",
        "Guided spice-estate tour",
        "One 3-hour ayurvedic treatment per person",
        "Private waterfall hike with tribal naturalist",
        "Cooking class: spice-based Kerala cuisine",
        "Periyar Lake boat safari",
      ]),
      exclusions: JSON.stringify([
        "Flights",
        "Lunches",
        "Additional spa treatments beyond the included session",
        "Personal expenses",
        "Travel insurance",
      ]),
      tags: "wellness, ayurveda, yoga, spice-estates, wildlife",
      featured: true,
      published: true,
    },
    {
      name: "Spice Coast Odyssey",
      slug: "spice-coast",
      category: "Culture",
      shortDesc: "Seven nights tracing the ancient Arab, Portuguese and Dutch spice trade routes along Kerala's coast and lagoons.",
      description: "This is a journey through history made physical. From the godowns of Mattancherry where pepper was once worth its weight in gold, to the fishing hamlet of Marari where nothing has changed in a century, to the bird-thronged backwaters of Kumarakom — every stop is a chapter in the story of one of the world's most coveted coastlines. For the culturally curious traveller with a week to spare.",
      durationNights: 7,
      route: "Fort Kochi → Marari → Kumarakom",
      bestFor: "Culture lovers, Slow travellers, History enthusiasts",
      season: "October – March",
      priceFrom: 220000,
      heroImageUrl: "https://images.unsplash.com/photo-1556470478-98bd74cfc940?auto=format&fit=crop&w=2000&q=80",
      itinerary: JSON.stringify([
        { day: 1, title: "Fort Kochi: Arrival", description: "Arrival and orientation walk. Visit the 400-year-old Paradesi Synagogue and the Dutch Palace murals. Sunset at the Chinese fishing nets. Kerala prawn curry dinner." },
        { day: 2, title: "Fort Kochi: Spice Markets", description: "Morning in Mattancherry's working spice markets with an Escora historian-guide. Understand the economic forces that brought Europeans to these shores. Afternoon: contemporary art trail (Kerala is home to Asia's largest contemporary art festival). Kathakali evening." },
        { day: 3, title: "Fort Kochi: St Francis & Local Life", description: "Morning: visit St Francis Church — where Vasco da Gama was first buried. Afternoon: Jewish heritage walk in Jew Town. Cooking class with a Fort Kochi family." },
        { day: 4, title: "Marari: Coastal Slow Living", description: "Transfer south to Marari Beach (1.5 hrs). Check into a thatched beach villa. Afternoon: fishing village cycle tour with a local fisher as guide. Dinner of just-caught seafood." },
        { day: 5, title: "Marari: At the Water's Edge", description: "Morning yoga facing the Arabian Sea. Accompany local fishermen for an early morning net-casting session. Ayurvedic treatment at the beach property's spa. Evening: traditional Keralan music performance." },
        { day: 6, title: "Kumarakom: Bird Sanctuary", description: "Transfer north to Kumarakom (2 hrs) on the Vembanad Lake shore. Afternoon: private boat into the Kumarakom Bird Sanctuary — look for Indian darter, purple moorhen, and migratory Siberian storks. Sundowner on the lake." },
        { day: 7, title: "Kumarakom: Departure", description: "Final morning: canoe through narrow village canals. Checkout and transfer to Cochin Airport (2.5 hrs)." },
      ]),
      inclusions: JSON.stringify([
        "7 nights in curated coastal and lakeside properties",
        "All transfers",
        "Daily breakfast and 5 dinners",
        "Historian-guide in Fort Kochi (Days 1–3)",
        "Kathakali performance",
        "Cooking class in Fort Kochi",
        "Marari fishing village cycle tour",
        "Kumarakom bird sanctuary private boat",
        "One ayurvedic treatment per person",
      ]),
      exclusions: JSON.stringify([
        "Flights",
        "Lunches",
        "Dinners on Days 3 & 7",
        "Personal expenses",
        "Travel insurance",
      ]),
      tags: "culture, history, coastal, birdwatching, spice-trade",
      featured: false,
      published: true,
    },
    {
      name: "Wayanad Wilds",
      slug: "wayanad-wilds",
      category: "Adventure",
      shortDesc: "Three nights deep in Wayanad's tribal heartland — jungle treks, hidden waterfalls and an Adivasi cultural encounter.",
      description: "Wayanad is the Kerala that most travellers never reach. In three focused nights you will sleep in a sustainably built forest lodge, trek to waterfalls that appear on no map, and spend an afternoon with the Kurichiyar community whose ancestors have lived in these forests for more than 2,000 years. This itinerary is deliberately physical and deliberately quiet.",
      durationNights: 3,
      route: "Calicut → Wayanad",
      bestFor: "Nature lovers, Adventure travellers, Cultural explorers",
      season: "October – May",
      priceFrom: 90000,
      heroImageUrl: "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=2000&q=80",
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival in Wayanad", description: "Transfer from Calicut Airport through the Thamarassery Pass (1.5 hrs). Check in to your forest lodge. Afternoon orientation walk with the naturalist. Sunset from the coffee-estate viewpoint. Welcome dinner of tribal-recipe wild-forest greens." },
        { day: 2, title: "Waterfall Trek & Tribal Village", description: "Early morning 4-hour jungle trek to a private waterfall. Swim. Return via a Kurichiyar tribal village — the community hosts a guided walk through their traditional knowledge of the forest. Afternoon rest. Evening campfire dinner." },
        { day: 3, title: "Edakkal Caves & Departure", description: "Morning visit to the Edakkal Caves — Neolithic rock carvings estimated at 6,000 years old. Transfer back to Calicut Airport." },
      ]),
      inclusions: JSON.stringify([
        "3 nights in forest lodge",
        "All transfers from/to Calicut Airport",
        "Daily breakfast and all dinners",
        "Tribal naturalist guide throughout",
        "Private waterfall trek",
        "Kurichiyar village cultural walk",
        "Edakkal Caves entry and guided tour",
      ]),
      exclusions: JSON.stringify([
        "Flights",
        "Lunches",
        "Personal expenses",
        "Travel insurance",
      ]),
      tags: "adventure, tribal-culture, jungle, waterfalls, trekking",
      featured: true,
      published: true,
    },
  ];
  for (let i = 0; i < packagesData.length; i++) {
    await PackageModel.create({ ...packagesData[i], id: i + 1 });
  }
  await syncSequence("packages", packagesData.length);
  console.log(`✓ ${packagesData.length} packages inserted`);

  // ── Journal Posts ─────────────────────────────────────────────────────────
  const journalPostsData = [
    {
      title: "The Art of Arriving in Fort Kochi",
      slug: "arriving-in-fort-kochi",
      category: "Destination",
      excerpt: "Most visitors arrive in Kerala at speed — airport, taxi, hotel — and miss the one moment that sets the tone for everything that follows. Here is how to arrive properly.",
      content: `<p>The flight from Mumbai lands at Cochin International at seven in the morning, and the light outside the terminal is the specific amber of the tropics before the heat arrives. You have a choice at this point. You can do what most visitors do: find your driver, slide into the air-conditioned car, and not really look out of the window until you're at the hotel.</p>

<p>Or you can arrive properly.</p>

<p>Arriving properly in Fort Kochi means taking the Vypeen Island ferry from Ernakulam — a twenty-minute crossing on a government boat that costs twelve rupees and carries schoolchildren, fish-sellers and the occasional tourist who has done their research. The crossing is unhurried. The Arabian Sea here is brown and wide, and the Chinese fishing nets on the far shore — vast mechanical constructions of counterweighted wood and rope, unchanged in design since the 14th century — are already moving in the morning wind.</p>

<h2>The Weight of History</h2>

<p>Fort Kochi is the kind of place that European cities pretend to be: genuinely ancient, genuinely layered, genuinely still in use. The Dutch built here in 1663 on top of Portuguese foundations. The British arrived in 1795. The Jewish community had been here since the 1560s, possibly earlier. Their synagogue — painted floor to painted ceiling in blue-and-white Chinese tiles, every tile slightly different — is still active, maintained by the last few members of a community that once numbered in the thousands.</p>

<p>What the ferry crossing does, before you've checked in or unpacked or eaten anything, is place you inside this history rather than outside it. You arrive as people have arrived for four centuries — by water, slowly, watching the shore approach.</p>

<h2>How to Spend the First Evening</h2>

<p>Check into your room. Walk to the Chinese fishing nets at dusk. The net-operators will, if you ask politely, let you pull on the counterweight rope while the net descends into the water. The theatre of this — the mechanics of it, the improbability that it still works — is quietly astonishing.</p>

<p>Walk to the nearest waterfront café. Order a fresh lime soda. Watch the boats. You have arrived.</p>`,
      authorName: "Escora Editorial",
      authorRole: "The Escora Journal",
      imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 5,
      tags: "fort-kochi, arrival, heritage, travel-tips",
      published: true,
      publishedAt: "2025-01-15",
    },
    {
      title: "Monsoon in the Cardamom Hills",
      slug: "monsoon-cardamom-hills",
      category: "Season Guide",
      excerpt: "June brings the southwest monsoon to Kerala, and with it an entirely different version of Munnar — fewer visitors, lower rates, and a landscape of almost surreal greenness.",
      content: `<p>The conventional wisdom is to visit Kerala between October and March. The air is clear, the light is clean, the roads are dry. This is not wrong advice. But it describes only half the year, and arguably the less interesting half.</p>

<p>In June, the southwest monsoon arrives in Kerala before anywhere else in India — a meteorological phenomenon so reliable that the Indian Meteorological Department publishes a separate forecast for its arrival, accurate to within days. The cardamom hills of Munnar receive some of the highest rainfall in the subcontinent. And the landscape it creates is something that the internet has not yet adequately photographed.</p>

<h2>What Changes in the Monsoon</h2>

<p>Everything becomes more itself. The tea bushes, already intensely green, deepen to a colour that has no accurate name in English — the Malayalam word <em>pacha</em> comes closer, a green that is also the word for "raw" and "fresh" and "alive". The waterfalls that are thin silver threads in winter become thundering curtains of white. The air carries the smell of wet earth and crushed cardamom simultaneously.</p>

<p>The tourist numbers drop by sixty percent. The heritage bungalows that are booked four months ahead in December are suddenly available at significant reductions. The roads are yours.</p>

<h2>What to Bring</h2>

<p>A genuinely waterproof jacket — not a light rain mac, but something serious. Quick-dry trousers. Waterproof shoes or ankle boots. A small dry bag for your camera and phone. The will to walk in rain and find it beautiful rather than inconvenient.</p>

<p>The estates are at their best in the late afternoon, when the rain often pauses for an hour and the evening light catches the mist rising from the valleys. This is when to walk. This is when to be outside. The rest of the time, there is always the veranda, always tea, always the sound of rain on the estate roof — which is, in itself, one of the better sounds in the world.</p>`,
      authorName: "Meera Nair",
      authorRole: "Escora Travel Writer",
      imageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 6,
      tags: "munnar, monsoon, season-guide, cardamom-hills",
      published: true,
      publishedAt: "2025-03-10",
    },
    {
      title: "Backwater Slow: A Night on the Alleppey Houseboat",
      slug: "alleppey-houseboat-night",
      category: "Experience",
      excerpt: "The houseboat industry in Alleppey has grown enormously in twenty years, and much of it is not worth your time. Here is what to look for, and what to expect when you find the right boat.",
      content: `<p>There are, at last count, approximately 1,200 registered houseboats operating on the Alleppey backwaters. A significant number of them are identical: blue plastic roof, identical laminate interiors, a generator that runs until eleven, a tinny speaker playing film songs. This version of the backwater experience is not what we are talking about.</p>

<p>The houseboat we are talking about is a kettuvallam — a traditional rice barge, rebuilt by craftsmen from coconut wood and bamboo, caulked with cashew nut oil and black resin. The roof is cured palm frond. There is no air conditioning. There is a ceiling fan in each cabin, and in the evening, when the boat stops moving and ties up for the night beside the canal bank, there is a breeze that comes up reliably from the south.</p>

<h2>The Rhythm of a Backwater Day</h2>

<p>You cast off at nine in the morning. The canals around Alleppey are narrow — barely wider than the boat — and your pilot knows every inch of them. In the first hour you pass fishing nets strung between bamboo poles, a school whose students wave from the playground, a small temple whose gopuram appears suddenly around a bend. There is no schedule. The only obligation is to be on the sun deck.</p>

<p>At noon the boat pulls into a wider stretch of water and your cook prepares lunch: a freshly caught karimeen (pearl spot fish) fried in coconut oil, a thoran of raw banana, sambar, rice. You eat on the deck. The water is the colour of pewter. Nothing is required of you.</p>

<h2>What to Ask For When Booking</h2>

<p>Ask for a boat that has been built or renovated in the last five years. Ask for a cook, not just a crew. Ask whether the boat stops at a village where you can walk in the evening — the best operators know the canal-bank villages and have relationships with residents who welcome guests. Ask whether there is a solar panel or generator, and what time the generator goes off (earlier is better — the sound of frogs and water birds after eleven is the whole point).</p>

<p>The night on the water, tied up under a palm grove, with the single light of a distant house reflecting in the canal and the sound of nothing much at all — this is what the backwaters actually are. This is worth finding.</p>`,
      authorName: "Thomas Cherian",
      authorRole: "Escora Experiences Editor",
      imageUrl: "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 7,
      tags: "alleppey, houseboat, backwaters, experience-guide",
      published: true,
      publishedAt: "2025-04-22",
    },
    {
      title: "Warehouses of the Imagination: Inside the Kochi-Muziris Biennale",
      slug: "kochi-muziris-biennale-warehouses",
      category: "Culture",
      excerpt: "Every two years, Fort Kochi's spice warehouses empty of pepper and cardamom and fill instead with contemporary art from a hundred countries. This is what that transformation actually looks like from inside Aspinwall House.",
      content: `<p>Aspinwall House sits on the harbour road in Fort Kochi, a compound of nineteenth-century warehouses built by an English trading firm that shipped coir, spices and lime to half the ports of the Indian Ocean. For ten months of every two years, it is quiet — padlocked gates, pigeons in the rafters, the faint smell of old jute sacking still caught in the walls. Then the Biennale arrives, and the same rooms that once held sacks of cardamom hold video installations, welded steel, and canvases the size of a small boat.</p>

<p>"People ask why we didn't build a white cube gallery for this," says Bobby Kurian, who has worked as a site coordinator for the Biennale Foundation since its first edition in 2012. "But the warehouse is the point. The art has to argue with the building — with the rust, the salt air coming off the harbour, the holes in the roof where the light falls in stripes at four in the afternoon. A clean gallery would make everything polite. Nothing here is polite."</p>

<h2>A Biennale Built on Trade Routes</h2>

<p>The name is deliberate. Muziris was the ancient port, somewhere near present-day Kodungallur, that drew Roman ships loaded with gold in exchange for Kerala's pepper — a trade so old that Pliny the Elder complained about the drain on the Roman treasury. The Biennale's founders, the artists Bose Krishnamachari and Riyas Komu, wanted an exhibition that remembered this: that this coastline has always been a place where the world's goods, and now its ideas, arrive by water and get argued over.</p>

<p>Walking through Aspinwall House in December, when the show is at its fullest, you move between rooms that still bear the ghost-marks of their old function — iron hooks in the ceiling beams, a weighing platform embedded in the floor of one hall — while artists from Kerala, Karachi, Havana and Seoul install work that responds directly to that residue.</p>

<h2>Beyond the Big Venue</h2>

<p>Aspinwall House is the anchor, but the Biennale spreads through a dozen smaller sites — Pepper House, the David Hall gallery, disused godowns along Bazaar Road. <em>Kalaripayattu</em> practitioners sometimes perform in the courtyards between installations, a reminder that Kerala's own performance traditions predate any of this by centuries.</p>

<p>"Come in the first week if you want the openings and the noise," Kurian says. "Come in February, near the end, if you want to actually look at the work. By then the crowds have thinned and the warehouses are just quiet again, mostly — quiet enough that you can hear the harbour through the walls."</p>`,
      authorName: "Nikhil Varghese",
      authorRole: "Field Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 6,
      tags: "fort-kochi, biennale, contemporary-art, culture, aspinwall-house",
      published: true,
      publishedAt: "2025-06-12",
    },
    {
      title: "Jew Town: Spice, Silence and the Last of Mattancherry",
      slug: "jew-town-mattancherry-spice-trade",
      category: "Heritage",
      excerpt: "Behind the antique shops of Jew Town, the spice godowns still smell of the trade that built Kochi, and the murals of Mattancherry Palace record a version of Kerala's story painted three hundred years before anyone thought to write it down.",
      content: `<p>Synagogue Lane is barely two hundred metres long, and by ten in the morning it smells of three things simultaneously: dried ginger, machine oil from the spice-grinding units still working behind shuttered doors, and the specific mustiness of very old wood. This is Jew Town, the trading quarter that grew up around Mattancherry harbour from the sixteenth century onward, and it is still, underneath the antique shops selling brass lamps to tourists, a working spice market.</p>

<p>"My grandfather bought and sold cardamom on this street for forty years," says Elias Hallegua, one of the handful of Paradesi Jews who remain connected to the Kochi community, most of whose members emigrated to Israel in the 1950s and 60s. "Come into any godown here and you can still smell four hundred years of pepper in the walls."</p>

<h2>A Synagogue Older Than Most Nations</h2>

<p>The Paradesi Synagogue, built in 1568 and rebuilt after Portuguese forces damaged it in 1662, remains active with a shrinking congregation, its floor laid with hand-painted Chinese porcelain tiles brought from Canton in the eighteenth century, no two of them alike. It sits at the literal centre of the spice trade's old geography — walk five minutes in any direction and you reach either the harbour where ships once loaded, or Mattancherry Palace, built by the Portuguese in 1555 and later renovated by the Dutch.</p>

<h2>The Murals the Palace Doesn't Advertise</h2>

<p>Most visitors come to Mattancherry Palace for its name — everyone calls it the Dutch Palace, though the Dutch only renovated what the Portuguese built — and leave without seeing what makes it extraordinary: the murals. In the low-ceilinged rooms upstairs, painted directly onto the walls in natural pigments sometime in the sixteenth and seventeenth centuries, are some of the finest surviving examples of Kerala mural art anywhere.</p>

<p>"People photograph the coronation hall and skip upstairs because the light is bad for their phones," says K.P. Sudheeran, a conservation-trained guide who has worked the palace circuit for over two decades. "That is not decoration. That is a library that happens to be painted."</p>`,
      authorName: "Fiona D'Costa",
      authorRole: "Heritage Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1775433205046-86e060feff06?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 7,
      tags: "fort-kochi, jew-town, mattancherry-palace, heritage, spice-trade",
      published: true,
      publishedAt: "2025-08-03",
    },
    {
      title: "The Roar of the Backwaters: Snake Boat Racing at the Nehru Trophy",
      slug: "nehru-trophy-snake-boat-race-alleppey",
      category: "Culture",
      excerpt: "Once a year, the Punnamada Lake stops being scenery and becomes an arena, as villages that have rowed against each other for generations race hundred-foot snake boats to a rhythm that has not changed since the reign of the old Chempakassery kings.",
      content: `<p>For fifty-one weeks of the year, Punnamada Lake near Alleppey is exactly what the postcards promise: flat, green-fringed, dotted with houseboats moving at the pace of a held breath. On the second Saturday of August, it becomes something closer to a stadium. This is the day of the Nehru Trophy Vallam Kali, and the chundan vallam — snake boats up to thirty metres long, curved at the bow like a raised cobra hood, each one crewed by more than a hundred rowers — go to war with each other, briefly and beautifully, on water.</p>

<h2>A Race Older Than Its Trophy</h2>

<p>Vallam Kali predates the Nehru Trophy by centuries. Village boat races were staged as part of Onam festivities and temple ceremonies across Kuttanad long before Jawaharlal Nehru, visiting Alleppey by boat in 1952, was reportedly so moved by an impromptu race staged in his honour that he donated a rolling trophy — a silver boat mounted on an ebony base — to be awarded to the winning village each year.</p>

<p>"Every boat belongs to a village, not to a club or a sponsor," says Baiju Chempakassery, whose family has organised the training of a chundan vallam crew from Kainakary for three generations. "You cannot buy your way into a boat. You have to be from the place."</p>

<h2>The Sound Before the Sight</h2>

<p>What strikes first-time spectators is not the boats themselves but the sound that precedes them — the <em>vanchipattu</em>, or boat songs, sung by the rowers in unison to a rhythm that sets the stroke rate, call-and-response verses passed down orally for generations. Long before a chundan vallam is visible around the bend of the lake, its song carries across the water, a hundred voices dropping into the same beat at once.</p>

<p>"The song is the engine," Chempakassery says. "Lose the song and the boat loses its rhythm, and a boat without rhythm cannot win, no matter how strong the rowers are individually."</p>

<p>The race itself lasts barely a few minutes per heat — an explosive, almost violent sprint of synchronised paddling that sends spray high enough to catch the afternoon sun — but the atmosphere on the lake's banks builds for hours beforehand, and when the winning boat finally crosses the line, the noise from its home village is loud enough to carry clear across the water to the losing side.</p>`,
      authorName: "Sarath Pillai",
      authorRole: "Escora Travel Writer",
      imageUrl: "https://images.unsplash.com/photo-1704365159871-6bf63f00b9c8?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 6,
      tags: "alleppey, snake-boat-race, nehru-trophy, onam, culture",
      published: true,
      publishedAt: "2025-08-01",
    },
    {
      title: "Farming Below the Sea: The Paddy Fields of Kuttanad",
      slug: "kuttanad-below-sea-level-farming",
      category: "Heritage",
      excerpt: "Across Kuttanad, rice is grown in fields that sit up to two metres below sea level, held dry by a system of mud embankments and pumps that farmers have refined for a hundred and fifty years — one of the few places on earth where the harvest happens beneath the level of the water around it.",
      content: `<p>Stand on the bund at the edge of a Kuttanad paddy field in January and the geography stops making sense. The rice stretches out flat and green in front of you, and the boats on the canal beside it are moving at a level noticeably higher than the crop — sometimes by a metre and a half, sometimes by more. This is not an optical trick. Kuttanad is one of the very few places in the world where farming happens below sea level, in a landscape of reclaimed lake and river delta held dry, season after season, by little more than packed mud walls and the labour of pumping the water back out.</p>

<h2>A System Built From Reclaimed Lake</h2>

<p>Kuttanad sits at the base of Vembanad Lake, fed by four rivers, and the paddy fields here — locally called <em>kayal</em> lands when reclaimed directly from the lakebed — were first drained on a large scale in the 1860s, when a farmer named Achoo Panicker is credited with reclaiming Kuttanad's first lake field for cultivation.</p>

<p>"Our fields don't wait for rain, they wait for water to be removed," says Jose Vattaparambil, a fourth-generation Kuttanad farmer who still works kayal land near Ramankary. "Everywhere else in Kerala, farmers worry about irrigation. Here we worry about drainage. It is the same problem turned upside down."</p>

<h2>The Rhythm of Pumping and Planting</h2>

<p>The agricultural calendar in Kuttanad runs on the mechanics of water removal as much as on the monsoon. After harvest, bunds are deliberately breached and fields are allowed to flood again, both to rest the soil and to allow fish and prawn cultivation in the same plots during the off season — a rotation that has quietly made Kuttanad one of the country's few regions practising integrated rice-fish farming at scale.</p>

<p>The system's ecological significance earned Kuttanad recognition in 2013 as a Globally Important Agricultural Heritage System by the UN Food and Agriculture Organization, one of the few sites in India to receive the designation.</p>

<p>"People come here for the houseboats and photograph the green fields from the water," Vattaparambil says. "Almost nobody asks how the field stays dry while the canal beside it is full. My grandfather used to say Kuttanad farmers make peace with the lake twice a year — once when we ask it to leave, once when we let it back in."</p>`,
      authorName: "Lissy Abraham",
      authorRole: "Escora Travel Writer",
      imageUrl: "https://images.unsplash.com/photo-1519082572439-7ed19908e47e?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 7,
      tags: "alleppey, kuttanad, paddy-fields, agriculture, unesco-heritage",
      published: true,
      publishedAt: "2025-10-05",
    },
    {
      title: "The Blue Bloom: Munnar's Once-in-Twelve-Years Kurinji",
      slug: "kurinji-bloom-munnar",
      category: "Season Guide",
      excerpt: "Every twelve years, the slopes above Munnar turn a shade of blue-violet that exists nowhere else in the botanical world, and then vanish again for another twelve. Here is what the Neelakurinji actually is, and why it matters.",
      content: `<p>Selvam Raj has counted twelve-year cycles the way other men count decades. He is sixty-three, and this is the fifth Neelakurinji bloom he has watched from the same ridge above Chinnakanal. "My grandfather saw it four times," he says. "I will see it five, maybe six if God is generous. That is the whole arithmetic of this flower — it teaches you how few of these you actually get."</p>

<p><em>Strobilanthes kunthiana</em>, known locally as Neelakurinji — <em>neela</em> meaning blue, <em>kurinji</em> the old Tamil word for the plant itself — grows across the shola grasslands of the Western Ghats between roughly 1,300 and 2,400 metres. It flowers gregariously, meaning every plant across an entire hillside blooms in the same narrow window, once every twelve years, and then dies.</p>

<h2>Why Twelve Years, Specifically</h2>

<p>Botanists still argue over the exact mechanism, but the result is not in dispute. When it happens, the grasslands of Eravikulam, Rajamala and the ridges above Kolukkumalai turn a colour that photographs consistently fail to capture: not purple, not blue, but a shifting violet that changes with the angle of the light and the movement of cloud shadow across the slope.</p>

<p>"People arrive expecting a garden," Selvam says. "It is not a garden. It is a hillside that has decided, for six weeks, to become a different colour."</p>

<h2>What the Bloom Means Locally</h2>

<p>The Kurinji is not incidental to the region — it gave Kerala's hill tribes, the Muthuvans among them, a calendar. Marriages, migrations and even a traditional method of age-reckoning were once tied to the flowering cycle. The most recent mass flowering came in 2018, drawing visitors from across India to Eravikulam National Park. The next full cycle is expected in 2030.</p>

<p>Selvam's advice, given to every visitor who asks: go in the early morning, before the mist burns off. "The flower does not perform for the middle of the day," he says. "Nothing in these hills does."</p>`,
      authorName: "Vikram Pillai",
      authorRole: "Field Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1749447591990-226768a5a2dd?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 6,
      tags: "munnar, neelakurinji, nature, season-guide, western-ghats",
      published: true,
      publishedAt: "2025-06-20",
    },
    {
      title: "The Poachers Who Became the Forest's Best Guides",
      slug: "periyar-tiger-reserve-former-poachers",
      category: "Adventure",
      excerpt: "Periyar Tiger Reserve runs on a quiet piece of conservation logic: the men who once knew the forest well enough to poach it are now the ones protecting it. A morning on a bamboo raft with one of them.",
      content: `<p>Biju Kurian does not talk about the years before 1996 unless you ask directly, and even then he is economical about it. "I knew where the sandalwood was. I knew where the animals drank," he says, poling the bamboo raft away from the Periyar Lake shore with a single unhurried stroke. "Now I know the same things, but I tell the forest department instead of the timber buyer. It pays less. I sleep better."</p>

<p>Biju is one of roughly ninety former poachers and sandalwood smugglers absorbed into Periyar's Vidiyal Trust and its ex-vayana samithi patrol groups since the mid-1990s, in a program that has become one of the more studied pieces of community conservation in India.</p>

<h2>What the Bamboo Raft Actually Does</h2>

<p>The rafting program — bundled bamboo poles lashed together, poled silently across sections of the 777-square-kilometre reserve's core lake — exists because engine noise clears wildlife from the shoreline for an hour. A raft makes almost none. Guests sit low, at water level, and the guides, nearly all former poachers or their sons, read the forest edge the way other people read signage.</p>

<p>"Tourists want to see a tiger," Biju says, without turning around. "I have worked here twenty-eight years and I have seen one clearly perhaps six times. What I show them instead is everything the tiger depends on."</p>

<h2>A Different Kind of Trust</h2>

<p>The reserve's core zone treks and overnight jungle patrols — in which paying guests accompany the same ex-poacher patrol teams on their actual anti-poaching rounds — were designed as much for the guides' income as for tourism. Wages from ecotourism now substantially outstrip what the same men could earn from illegal harvest.</p>

<p>Near the end of the two-hour raft circuit, Biju points to a stand of rosewood on the far bank, tall and untouched. "Twenty-five years ago I would have already sold that tree three times over in my head," he says. "Now I only sell people the walk to look at it. It is a better trade, even if it took me a long time to believe that."</p>`,
      authorName: "Reuben Mathew",
      authorRole: "Wildlife Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1663761676240-1dd5bc24756c?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 7,
      tags: "thekkady, periyar, wildlife, conservation, adventure",
      published: true,
      publishedAt: "2025-08-03",
    },
    {
      title: "Six Thousand Years of Handwriting: The Edakkal Caves",
      slug: "edakkal-caves-petroglyphs-wayanad",
      category: "Heritage",
      excerpt: "A narrow cleft in a Wayanad hillside holds some of the oldest evidence of human habitation in peninsular India — carvings that predate the pyramids by a considerable margin, and a debate over their meaning that is still unresolved.",
      content: `<p>The climb to Edakkal is not gentle — roughly forty-five minutes up a boulder-strewn path from Ambukuthi Mala's base, the last stretch requiring an iron ladder bolted into the rock — and Sanal Kumar, who has guided visitors here for over fifteen years, thinks that difficulty is part of the point. "Nothing that old should be easy to reach," he says. "If it were easy, everyone would have already worn it smooth."</p>

<p>What waits at the top is a natural cleft, formed by a boulder wedged between two rock faces, creating a cavern roughly ninety-six feet long. Its walls carry petroglyphs — carved, not painted — that archaeologists date across a startling range, from the Neolithic period some 6,000 years ago through to early historic scripts as recent as the 5th century.</p>

<h2>What the Carvings Might Say</h2>

<p>The caves were documented for the colonial record in 1901 by Fred Fawcett, then a police official with an amateur interest in antiquities, and have been argued over ever since. Some figures are read as anthropomorphic deities; others resemble tools, or animals no longer found in the region.</p>

<p>"People want me to tell them exactly what it means," Sanal says, running a flashlight beam slowly across a panel of overlapping human figures. "I tell them the truth instead, which is less satisfying. We know roughly when. We do not know exactly what they were trying to say to us."</p>

<h2>Standing Inside It</h2>

<p>Inside the cleft, the temperature drops noticeably, and the light falls in a single shaft from the opening above, moving across the carved wall as the sun crosses. Sanal's closing point, delivered at the same spot every time: "Every hand that touched this wall believed something was worth recording here permanently. We still do not fully know what. But we came back anyway, generation after generation, to look at it and wonder."</p>`,
      authorName: "Lakshmi Varma",
      authorRole: "Heritage Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1766590596275-cd4e94e124f6?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 6,
      tags: "wayanad, edakkal-caves, heritage, archaeology, petroglyphs",
      published: true,
      publishedAt: "2025-10-10",
    },
    {
      title: "Coffee Country: A Morning on the Wayanad Estates",
      slug: "wayanad-coffee-estates-morning",
      category: "Culture",
      excerpt: "Kerala's reputation runs on tea and spice, but Wayanad has quietly been growing some of India's finest robusta and arabica for over a century — a story most visitors drive straight past on the way to the wildlife sanctuaries.",
      content: `<p>Joseph Kalathil wakes before four during picking season, though he is careful to say this without any implied virtue. "The coffee cherry does not care what time you woke up," he says, walking a row of waist-high robusta shrubs still wet with overnight dew. "It only cares whether you pick it red or pick it early. Pick it early and you have ruined a year's work in one bad morning."</p>

<p>Wayanad grows roughly two-thirds of Kerala's coffee, mostly on small and mid-sized holdings scattered across the plateau around Meppadi, Ambalavayal and Kalpetta, at an elevation that suits robusta particularly well.</p>

<h2>Shade-Grown, By Necessity and By Choice</h2>

<p>Unlike the open, terraced tea gardens of Munnar, Wayanad's coffee is grown under a canopy — silver oak, jackfruit, sometimes areca palm — a system originally adopted because coffee genuinely needs the shade at this latitude, but which has turned out to double as a biodiversity corridor between the district's forest fragments.</p>

<p>"An elephant does not read a property line," Joseph says, matter-of-fact. "You lose a section of the crop most seasons. You plant expecting to lose it. That is simply the arrangement we have with the forest here."</p>

<h2>From Cherry to Cup, Slowly</h2>

<p>Most small estates in Wayanad still process by hand: cherries pulped on-site, fermented in cement tanks for a day or two, then sun-dried on raised beds and turned by hand every few hours to dry evenly. "We do it by hand because most of us cannot afford the machine," Joseph says. "People taste the result and think it was a choice about quality. Half the time it was a choice about money. The coffee doesn't know the difference."</p>

<h2>Tasting It Where It Grows</h2>

<p>A handful of Wayanad estates now offer cupping sessions on-site, usually conducted on an open veranda with the morning mist still sitting in the valley below. "Most people are more capable of noticing difference than they think," Joseph says. "They just need to be told to stop and pay attention. That is really the whole tour."</p>`,
      authorName: "Nithya Balakrishnan",
      authorRole: "Escora Travel Writer",
      imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 5,
      tags: "wayanad, coffee, culture, plantations, cuisine",
      published: true,
      publishedAt: "2025-12-01",
    },
    {
      title: "The Sadya: Twenty-Six Dishes, One Banana Leaf",
      slug: "kerala-sadya-banana-leaf-feast",
      category: "Cuisine",
      excerpt: "The Onam sadya is not a buffet and not a tasting menu — it is a fixed grammar of dishes, eaten in a fixed order, on a leaf that is itself part of the meaning. Here is how to read one properly.",
      content: `<p>The leaf goes down narrow end to the left. This is the first thing Radhamani Amma tells anyone who sits at her table in Thrissur for the first time, before a single dish has arrived. "If the wide end is toward you, you are eating a funeral meal," she says, without looking up from the rice she is portioning. "Kerala remembers everything through the leaf. Even grief has a direction."</p>

<p>A proper sadya — the word simply means "feast" in Malayalam and Sanskrit both — runs to somewhere between twenty and twenty-eight separate preparations, all arriving on a single banana leaf, all eaten with the right hand. It is served most famously during Onam, the ten-day harvest festival that commemorates the mythical King Mahabali's annual return to Kerala.</p>

<h2>An Order That Is Not Optional</h2>

<p>The sequence matters. Salt, then banana chips and sharkara varatti (jaggery-coated banana), go down first. Then the pickles: mango, lime, ginger, each a small violent dose of sour or heat meant to wake the palate. Rice is served three times, and each serving expects a different companion — sambar, then rasam, then payasam as the sweet closing course.</p>

<p>Between these anchors sit the thorans, the olans, the kalan and the avial — the dish most visitors remember, a thick medley of a dozen vegetables bound in coconut and curd, said to have been invented on the spot by Bhima during the Pandavas' exile.</p>

<h2>Why Hands, Why This Order</h2>

<p>"You eat with your hand because your hand tells you the temperature before your tongue does," Radhamani Amma says. "A spoon is a stranger between you and the food. Why would you want a stranger there?" The etiquette extends to the ending: you fold the leaf toward yourself to signal the meal satisfied you. Folded away from you signals the opposite — a message no host wants to receive.</p>`,
      authorName: "Vishnu Prasad",
      authorRole: "Escora Food Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 7,
      tags: "sadya, onam, kerala-cuisine, banana-leaf, food-culture",
      published: true,
      publishedAt: "2025-06-18",
    },
    {
      title: "Following the Pepper Vine: A Morning in Wayanad's Spice Gardens",
      slug: "wayanad-spice-plantation-morning",
      category: "Cuisine",
      excerpt: "Long before tea or coffee, it was pepper that brought ships to Kerala's shore. A walk through a working Wayanad plantation with the family that has tended it for four generations.",
      content: `<p>Joseph Kutty's grandfather planted the oldest pepper vines on this slope in the 1950s, training them up areca palms the way it has always been done — pepper needs a living support to climb, and it has no particular loyalty to any one tree. "The vine doesn't care what it climbs," Joseph says. "It only cares that the tree is alive. Patience is the entire job."</p>

<p>Kerala's spice trade predates almost every other reason Europeans had for coming to India. Roman ships were logging cargoes of Malabar pepper in the first century CE; Vasco da Gama's stated purpose on landing at Kappad in 1498 was, in his own account, "Christians and spices."</p>

<h2>Reading a Garden by Nose</h2>

<p>A well-run spice garden is arranged less like a farm and more like a layered forest — coffee and areca form the canopy, pepper vines climb the trunks, cardamom grows in the shade beneath, and vanilla, curry leaf, and clove trees fill whatever gaps remain.</p>

<p>"Black pepper, green pepper, white pepper — people think these are different plants," Joseph says, holding out three peppercorns dried at different stages. "Same berry. Black is the whole berry sun-dried with the skin on. White is the same berry soaked until the skin comes away. Green is simply picked before it ripens."</p>

<h2>From Vine to Kitchen</h2>

<p>In the plantation kitchen, Joseph's wife Aleyamma prepares a demonstration meal built entirely around what grows within a hundred metres, handing visitors a mortar and pestle to crush their own pepper before it goes into the pan. "Ground pepper from a packet has already given up," she says. "Fresh-crushed, it is still angry. That anger is the flavour."</p>`,
      authorName: "Rahul Varghese",
      authorRole: "Escora Food Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 6,
      tags: "wayanad, spices, pepper, kerala-cuisine, plantation",
      published: true,
      publishedAt: "2025-08-05",
    },
    {
      title: "Fourteen Days: What Panchakarma Actually Involves",
      slug: "panchakarma-fourteen-day-detox-explained",
      category: "Wellness",
      excerpt: "Panchakarma is often sold as a spa package. It is, properly practised, a supervised medical process with a physician, a restricted diet, and a recovery period — here is what an authentic multi-day program looks like from the inside.",
      content: `<p>Dr. Lakshmi Warrier does not like the word "detox" and says so within the first five minutes of any new patient consultation. "Detox implies removing something foreign, like a poison," she says. "Panchakarma is not removing a foreign thing. It is correcting an imbalance in the doshas that your own body has generated."</p>

<p>Before any oil touches skin, there is a consultation covering pulse diagnosis (nadi pariksha), digestion history, sleep patterns, stress levels, and current medications. The physicians overseeing a legitimate panchakarma course are registered doctors of Ayurvedic medicine, licensed to prescribe herbal formulations and to modify a treatment plan mid-course.</p>

<h2>The Structure of a Genuine Program</h2>

<p>A real panchakarma course runs a minimum of fourteen days, often twenty-one, and follows three distinct phases. The first, purva karma, is preparatory — days of internal oleation and external oil massages (abhyanga) that soften tissue and mobilise toxins toward the digestive tract.</p>

<p>Only once the physician judges the body prepared does the second phase begin — the five actions from which the treatment takes its name: vamana, virechana, two forms of vasti, and nasya. Not every patient receives all five; Dr. Warrier selects among them according to the individual's dosha imbalance.</p>

<h2>What the Diet Actually Restricts</h2>

<p>"People imagine panchakarma as massages and hot oil," Dr. Warrier says. "The oil is perhaps twenty percent of the treatment. The diet is the difficult eighty percent." For the full duration, patients avoid cold food and drink, curd, red meat, alcohol, and anything fried.</p>

<p>"Patients ask me when they will feel the benefit," Dr. Warrier says. "I tell them: not on day three, when you feel worst. Sometimes not until three weeks after you go home. This is not a spa. It does not work like a spa."</p>`,
      authorName: "Sreedevi Pillai",
      authorRole: "Wellness Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 8,
      tags: "ayurveda, panchakarma, wellness, detox, kerala-medicine",
      published: true,
      publishedAt: "2025-10-02",
    },
    {
      title: "When the God Arrives: A Night of Theyyam in North Kerala",
      slug: "theyyam-ritual-north-kerala",
      category: "Culture",
      excerpt: "In the temple groves of Kannur and Kasaragod, performers do not portray deities — for the hours the ritual lasts, they are understood to become them. This is not a tourist show, and it does not perform on request.",
      content: `<p>By the time Ramanan Peruvannan finishes his makeup, he has been sitting still for almost four hours. Layers of rice-paste and turmeric-based pigment build across his face in a pattern fixed by a tradition older than any written record of it. "Before the mask is finished, I am still Ramanan," he says quietly, between layers. "After the mudi goes on my head, I am not permitted to be Ramanan anymore. Not by others, and not by myself."</p>

<p>Theyyam — the word derives from <em>daivam</em>, meaning "god" — is practised across roughly four hundred distinct forms in the temple groves (kavus) of Kannur and Kasaragod, in Kerala's far north, mostly between November and May.</p>

<h2>Not Actors, Not Performers</h2>

<p>What separates Theyyam from Kathakali or classical dance is the claim made about what is actually happening. A Theyyam performer, once the ritual reaches its climax, is treated by the assembled village — Brahmin priests included, in a striking inversion of usual caste hierarchy — as the deity itself, present and answerable.</p>

<p>"During the daylight hours I am a farmer and sometimes I am not treated so well," Ramanan says. "At night, in this costume, the same people who ignored me that morning will bow at my feet and ask my blessing for their children. For one night the order of the village is turned over completely."</p>

<h2>Fire, Drums, and an Ending Nobody Controls</h2>

<p>The performance itself, when it comes near midnight, is loud and physical rather than contemplative — chenda drums building to a pace that seems to force the performer's body rather than accompany it, some forms involving the performer walking through burning coconut fronds.</p>

<p>Visitors are welcome at most kavus, but the caution given to every outsider is the same: this is not staged for you, and it will not repeat on your schedule. "People ask me to start early because their bus is leaving," Ramanan says. "I tell them the god does not care about your bus."</p>`,
      authorName: "Bineesh Kurup",
      authorRole: "Escora Culture Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1741243781186-fee59344ea4f?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 8,
      tags: "theyyam, north-kerala, ritual, kannur, living-culture",
      published: true,
      publishedAt: "2025-11-21",
    },
    {
      title: "Pairing Water and Hills: A Honeymoon Itinerary That Actually Makes Sense",
      slug: "honeymoon-itinerary-backwaters-hills",
      category: "Honeymoon",
      excerpt: "Most Kerala honeymoon itineraries either drown you in backwater cliché or rush you through a checklist of hill stations. Here is how to build one that gives a marriage its first good story.",
      content: `<p>The question we get most often from newly engaged couples is some version of: "Should we do the backwaters or the hills?" It is the wrong question. The right itinerary does both, in the right order, with enough time in each place that the transition itself becomes part of the romance.</p>

<p>Start in the hills, not the water. Three nights in Munnar, in a planter's bungalow with a wood fire in the evenings, does exactly this. Mornings are for walking the tea rows before the day-trippers arrive; the light at 6:30am on the Kannan Devan hills has a clarity that disappears by nine.</p>

<h2>What the Altitude Does to a Conversation</h2>

<p>There is something about cold air and a long, unhurried view that gets newly married people talking about things they have not yet said to each other. "Couples arrive tired from the wedding and leave the estate actually looking at each other," said Sunil Varghese, who has managed the same tea property for over a decade. "The hills do something a beach cannot. There is nowhere to perform for anyone."</p>

<h2>Then, Slowly, Down to the Water</h2>

<p>The drive from Munnar to Alleppey takes the better part of a day, and it should — the descent through rubber and pepper plantations is itself a kind of decompression. By the time you board a private kettuvallam in the late afternoon, the pace of the last three days has already changed you.</p>

<p>This particular sequence — Munnar into Alleppey, hills into water — is more or less the architecture of our own Malabar Escape itinerary, and it exists in that order for a reason: it is much harder to appreciate four days of stillness on the water if stillness is all you've had.</p>

<h2>Practical Notes</h2>

<p>Aim for six nights minimum — three hills, one transfer day, two water. Travel October through February for the clearest hill views and the calmest backwater conditions. Ask your houseboat operator whether the generator runs past 10pm; the good ones turn it off.</p>`,
      authorName: "Nikhila Varma",
      authorRole: "Escora Travel Writer",
      imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 6,
      tags: "honeymoon, itinerary, munnar, alleppey, couples",
      published: true,
      publishedAt: "2025-06-25",
    },
    {
      title: "The Climb to Chembra's Heart",
      slug: "chembra-peak-trek-wayanad",
      category: "Adventure",
      excerpt: "Wayanad's highest trekking peak hides a small lake shaped, improbably and exactly, like a heart. The climb to reach it is steeper than the postcards suggest.",
      content: `<p>The Chembra Peak trek begins deceptively — a wide, graded forest path through shola grassland, easy enough that you start to suspect the mountain's reputation is inflated. It is not. Somewhere around the second kilometre the path narrows, the grade steepens to something closer to a staircase than a trail, and the wind hits you sideways and does not stop.</p>

<p>At 2,100 metres, Chembra is the tallest peak in Wayanad, and the forest department caps daily permits at a small number of trekkers, with a compulsory guide for every group.</p>

<h2>The Lake, and Why It Is Smaller Than You Expect</h2>

<p>Most first-time trekkers are chasing one specific photograph: the heart-shaped lake, a small natural pool roughly two-thirds of the way up, whose outline really does resemble a heart. It is smaller in person than in the drone shots that circulate online, and swimming in it has been prohibited for years to protect the water source for wildlife.</p>

<p>"People train for the summit and forget the descent is where the knees fail," said Baiju K., a Wayanad-based trekking guide. "Go slow on the way down. The mountain does not care how fast you climbed it."</p>

<h2>What to Actually Bring</h2>

<p>Start before 7am — permits are time-slotted and the midday sun on the exposed grassland sections is considerable. Trekking shoes with real ankle support, not trail runners. Carry at least two litres of water per person, a windproof layer for the ridge, and cash for the forest department entry fee.</p>

<h2>Beyond the Summit</h2>

<p>The full round trip runs six to seven hours for a reasonably fit trekker, longer if you linger at the lake, which you should. From the true summit, on a clear day, the view extends across the Wayanad plateau toward the Nilgiris.</p>`,
      authorName: "Rohan Pillai",
      authorRole: "Adventure Correspondent",
      imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 7,
      tags: "adventure, trekking, wayanad, chembra-peak, western-ghats",
      published: true,
      publishedAt: "2025-11-03",
    },
    {
      title: "Wayanad Wilds Opens for the Season",
      slug: "wayanad-wilds-season-opens",
      category: "News",
      excerpt: "Bookings for our three-night Wayanad itinerary open this week for the October–May window — a short note on what's changed, and what hasn't, since we first ran it.",
      content: `<p>Wayanad Wilds opens for booking this week, ahead of the October start of the season, and it feels like a good moment to say plainly what this itinerary is and is not. It is not our easiest package to sell. There is no beach, no sunset cocktail, no infinity pool. It is three nights in a forest lodge, a genuinely demanding waterfall trek, and an afternoon with the Kurichiyar community whose relationship with these forests predates most written history in the region.</p>

<h2>What We Changed This Year</h2>

<p>The main adjustment, after two seasons of running the itinerary, was to the second day. Early groups found the waterfall trek and the village visit back-to-back left almost no time to sit with either experience properly, so this year the afternoon rest block on Day 2 is protected.</p>

<p>"Guests kept telling us they wished they'd had longer at the village, not longer on the trek," said Ajay Menon, who oversees our Wayanad ground operations. "So we gave them the afternoon back. It is a small change. It mattered more than we expected."</p>

<h2>A Note on the Forest Itself</h2>

<p>Wayanad remains, in our experience, the part of Kerala that fewest of our guests arrive with any real expectation of. The <em>chola</em> forest patches here, remnant pockets of the ancient shola ecosystem, are unlike anything on the coast or in the tea country, and the itinerary's Edakkal Caves visit on the final morning has a way of recontextualising everything that came before it on the trip.</p>

<h2>Booking Notes</h2>

<p>The season runs October through May, and forest department trekking permits are limited daily, so early booking genuinely matters this time. Group sizes remain capped, in line with the tribal council's own preference for smaller, quieter visits. If you have been waiting for the right season to do this trip, this is that season.</p>`,
      authorName: "Escora Editorial",
      authorRole: "Escora Editorial",
      imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
      readTimeMinutes: 5,
      tags: "news, wayanad, season-opening, bookings",
      published: true,
      publishedAt: "2026-07-28",
    },
  ];
  for (let i = 0; i < journalPostsData.length; i++) {
    await JournalPostModel.create({ ...journalPostsData[i], id: i + 1 });
  }
  await syncSequence("journal_posts", journalPostsData.length);
  console.log(`✓ ${journalPostsData.length} journal posts inserted`);

  console.log("\n✅ Seed complete — 5 destinations, 4 packages, 18 journal posts");
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
