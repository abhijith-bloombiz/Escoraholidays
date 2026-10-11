import type { ItineraryDay, ItineraryStay, ItineraryPricing } from "@/lib/itinerary";

export interface ItineraryTemplate {
  id: string;
  label: string;
  description: string;
  destination: string;
  title: string;
  days: ItineraryDay[];
  stays: ItineraryStay[];
  pricing: ItineraryPricing;
  inclusions: string[];
  exclusions: string[];
}

// Content adapted from real itineraries the team has previously sent to
// customers, reworded to fit the current day/stay/pricing shape exactly.
// Nothing here introduces fields the model doesn't already support (no
// multi-tier pricing, photos, or transport tables) — details that don't fit
// (e.g. "Optional, on request" activities, package tiers other than
// Standard) are folded into day descriptions or pricing notes rather than
// dropped, so nothing from the source is silently lost.
export const itineraryTemplates: ItineraryTemplate[] = [
  {
    id: "kerala-classic",
    label: "Kerala Classic",
    description: "6 Days / 5 Nights — Kochi, Munnar, Thekkady, Alleppey",
    destination: "Kerala, India",
    title: "Kerala Classic — 6 Days / 5 Nights",
    days: [
      {
        day: 1,
        title: "Arrival in Kochi — Fort Kochi & Mattancherry",
        description:
          "Arrive at Cochin Airport, where you will be met and assisted before being transferred to your hotel for check-in. In the afternoon, set out to discover the old-world charm of Fort Kochi and Mattancherry, a walk through centuries of trading history left behind by the Portuguese, Dutch and British. An evening Kathakali dance performance showcases Kerala's classical art form. Wellness & Ayurveda: traditional treatments are available both at your hotel and at reputed centres nearby. Optional, on request: kayaking through the backwaters around Fort Kochi, or a leisurely boat ride. Dinner at leisure — Fort Kochi offers a wide range of restaurants and cafés, from authentic Kerala seafood to continental fare.",
        activities: [
          { title: "Jew Town, historic Paradesi Synagogue & local shopping" },
          { time: "18:00", title: "Chinese fishing nets at sunset" },
          { time: "19:30", title: "Kathakali dance performance" },
        ],
      },
      {
        day: 2,
        title: "Kochi — Munnar",
        description:
          "After breakfast, check out and drive up to Munnar along the scenic hill route, stopping en route at the Cheeyappara and Valara waterfalls and pausing at a tea plantation to see how Kerala's famous tea is grown and processed. On arrival, check into your resort and spend the rest of the day at leisure.",
        activities: [
          { title: "Cheeyappara & Valara waterfalls" },
          { title: "Tea plantation stop" },
        ],
      },
      {
        day: 3,
        title: "Munnar Sightseeing",
        description:
          "A full day dedicated to the natural beauty of Munnar. Optional, on request: the Kolukkumalai Sunrise Jeep Safari, a trek to Meesapulimala, or a zipline adventure across the valley.",
        activities: [
          { title: "The colourful Flower Garden" },
          { title: "Eravikulam National Park — home to the endangered Nilgiri Tahr" },
          { title: "Tea Museum" },
          { title: "Trekking trails through the surrounding hills" },
          { title: "Jeep Safari across plantation terrain" },
        ],
      },
      {
        day: 4,
        title: "Munnar — Thekkady",
        description:
          "Check out after breakfast and drive to Thekkady. En route, stop at a working spice plantation to walk among pepper vines, cardamom groves and cinnamon trees. Later, head to the Periyar Tiger Reserve for a boat cruise across Periyar Lake, keeping an eye out for elephants, bison and other wildlife. An optional elephant safari through the Thekkady forest offers a closer encounter with these gentle giants.",
        activities: [
          { title: "Spice plantation walk" },
          { title: "Periyar Lake boat cruise" },
        ],
      },
      {
        day: 5,
        title: "Thekkady — Alappuzha (Houseboat)",
        description:
          "After breakfast, drive to Alappuzha, the heart of Kerala's backwaters. Check into your private houseboat and set off on a leisurely cruise through a maze of palm-fringed canals, paddy fields and quiet waterside villages, including a Shikkara cruise on Vembanad Lake. A personal chef travels with you, preparing fresh, home-style Kerala meals through the day. Optional, on request: exploring narrower canals aboard a traditional small boat, or a speed boat ride.",
        activities: [
          { title: "Backwater cruise through palm-fringed canals" },
          { title: "Shikkara cruise on Vembanad Lake" },
        ],
      },
      {
        day: 6,
        title: "Alappuzha — Kochi — Departure",
        description:
          "Disembark after breakfast and drive back to Kochi. Spend some time shopping for souvenirs and essentials before being transferred to Cochin Airport in time for your onward journey, bringing your Kerala tour to a close.",
        activities: [{ title: "Souvenir shopping" }, { title: "Transfer to Cochin Airport" }],
      },
    ],
    stays: [
      { name: "Hotel in Kochi", location: "Kochi", nights: 1 },
      { name: "Resort in Munnar", location: "Munnar", nights: 2 },
      { name: "Resort in Thekkady", location: "Thekkady", nights: 1 },
      { name: "Private Houseboat", location: "Alleppey", nights: 1 },
    ],
    pricing: { items: [], total: 0, notes: "Optional 1-day extensions available: Athirappilly Falls, Varkala Cliff, or Kovalam Beach — ask your consultant." },
    inclusions: [],
    exclusions: [],
  },
  {
    id: "varkala",
    label: "Varkala Coastal Escape",
    description: "1 Day — Varkala Cliff & Beach",
    destination: "Varkala, Kerala",
    title: "Varkala Coastal Escape — 1 Day",
    days: [
      {
        day: 1,
        title: "Arrival in Varkala",
        description:
          "Arrive in Varkala, where you will be met and transferred to your hotel for check-in. Spend the day at Varkala Cliff, the town's signature stretch where red laterite cliffs drop straight down to the Arabian Sea, lined with cafes and shops along the top. Just below, Varkala Beach offers a relaxed spot for a swim or a quiet walk by the water. For those looking to explore further, Kappil Beach & Backwaters, Anjengo Fort, and Black Beach make for a scenic detour, along with a boat trip to Ponnumthuruthu Island (Golden Island). Dinner at leisure — the cliff top offers a fine choice of sea-facing cafes, from local Kerala flavours to continental fare. Optional, on request: surfing with Copa Cabana Surf School, paragliding with Fly Varkala Adventure Club, parasailing with Joy Water Sports, or kayaking at Anjengo Lake / Golden Island Boating. Overnight stay in Varkala.",
        activities: [
          { title: "Varkala Cliff walk & cafes" },
          { title: "Varkala Beach — swim or quiet walk" },
          { title: "Kappil Beach & Backwaters, Anjengo Fort, Black Beach (optional detour)" },
        ],
      },
    ],
    stays: [{ name: "Hotel in Varkala", location: "Varkala", nights: 1 }],
    pricing: { items: [], total: 0 },
    inclusions: [],
    exclusions: [],
  },
  {
    id: "kozhikode-wayanad",
    label: "Kozhikode & Wayanad",
    description: "4 Days / 3 Nights — Kozhikode (Calicut), Wayanad",
    destination: "Kozhikode & Wayanad, Kerala",
    title: "Kozhikode & Wayanad — 4 Days / 3 Nights",
    days: [
      {
        day: 1,
        title: "Arrival in Kozhikode — City & Beach",
        description:
          "Arrive at Kozhikode (Calicut) Airport, where you will be met and assisted before being transferred to your hotel for check-in. Kozhikode is a city with an easy coastal charm, long known as a historic spice-trading port on the Malabar Coast. In the afternoon, take a walk along Kozhikode Beach as the sky turns gold over the Arabian Sea. Round off the evening browsing SM Street, the city's old shopping lane. Optional, on request: a visit to a clinical wellness sanctuary for a therapy session or a quiet reset. Dinner at leisure — Kozhikode is celebrated as home to some of the world's best biryani, alongside thousands of varieties of street food. Overnight stay in Kozhikode.",
        activities: [
          { title: "Kozhikode Beach at sunset" },
          { title: "SM Street shopping lane" },
        ],
      },
      {
        day: 2,
        title: "Kozhikode — Wayanad",
        description:
          "Check out and drive up into the hills of Wayanad along a winding ghat road, stopping en route at the dramatic hairpin bends of Thamarasseri Churam and pausing at Lakkidi View Point as the mist rolls over the Western Ghats. On arrival, check into your resort. In the evening, explore the activities and facilities provided by your resort — guided nature walks, yoga sessions, bird watching, or a campfire evening. Overnight stay in Wayanad.",
        activities: [
          { title: "Thamarasseri Churam hairpin bends" },
          { title: "Lakkidi View Point" },
        ],
      },
      {
        day: 3,
        title: "Wayanad Sightseeing & Trekking",
        description:
          "A full day dedicated to the natural beauty and trekking trails of Wayanad. Optional, on request: a jeep safari through the Muthanga or Tholpetti forest ranges, kayaking or a zipline crossing, or a visit to Kuruva Island and the eco-park glass bridge at Mepaly. Wildlife enthusiasts may also wish to explore the Wayanad Wildlife Sanctuary. Overnight stay in Wayanad.",
        activities: [
          { title: "Chembra Peak — heart-shaped lake & trekking trails" },
          { title: "Pookode Lake" },
          { title: "Edakkal Caves — ancient rock shelters" },
          { title: "Banasura Sagar Dam with boating" },
          { title: "Soochipara Waterfalls" },
          { title: "The 900 Kandi Glass Bridge" },
        ],
      },
      {
        day: 4,
        title: "Wayanad — Kozhikode — Departure",
        description:
          "Check out and drive back down to Kozhikode. Spend some time shopping for souvenirs at SM Street or HiLITE Mall before being transferred to the airport in time for your onward journey.",
        activities: [{ title: "Souvenir shopping" }, { title: "Transfer to airport" }],
      },
      {
        day: 5,
        title: "Optional Extensions (if you have more days)",
        description:
          "Several 1-day extensions can be combined with this itinerary as time allows: Mudumalai Wildlife Sanctuary (part of the Nilgiri Biosphere Reserve, home to elephants, tigers and dense teak forest); Kannur (handloom weaves, historic St. Angelo Fort, the Theyyam ritual art form, and Muzhappilangad — India's longest drive-in beach; in this extended version, departure would be from Kannur International Airport instead of Kozhikode); or Kasaragod (the imposing Bekal Fort, quiet backwaters, and a rich multilingual culture). Ask your consultant to shape any of these around your preferred pace.",
        activities: [],
      },
    ],
    stays: [
      { name: "Hotel in Kozhikode", location: "Kozhikode", nights: 1 },
      { name: "Resort in Wayanad", location: "Wayanad", nights: 2 },
    ],
    pricing: { items: [], total: 0 },
    inclusions: [],
    exclusions: [],
  },
  {
    id: "kerala-group-quote",
    label: "Kerala Group Quote",
    description: "8 Nights / 9 Days — Kochi, Munnar, Thekkady, Alleppey, Kovalam, Kanyakumari",
    destination: "Kerala, India",
    title: "Kerala Group Tour — 8 Nights / 9 Days",
    days: [
      {
        day: 1,
        title: "Cochin — Arrival & Sightseeing",
        description:
          "Upon arrival at Kochi Airport/Railway Station, you will be warmly welcomed by our representative and transferred to your hotel. After check-in and a short refreshment break, proceed for a local sightseeing tour of Fort Kochi. Visit the historic St. Francis Church, recognized as the oldest European church in India. Explore the charming lanes lined with 500-year-old Portuguese houses and witness the iconic Chinese Fishing Nets. Continue to the 16th-century Paradesi Synagogue at Jew Town, and visit the nearby Mattancherry Palace, renowned for its exquisite murals depicting scenes from Indian epics. Note: the Paradesi Synagogue and Mattancherry Palace remain closed on Fridays and Saturdays. Overnight stay at Kochi.",
        activities: [
          { title: "St. Francis Church" },
          { title: "Chinese Fishing Nets" },
          { title: "Paradesi Synagogue, Jew Town" },
          { title: "Mattancherry Palace" },
        ],
      },
      {
        day: 2,
        title: "Cochin to Munnar — Transfer & Sightseeing",
        description:
          "After breakfast, check out from hotel and proceed towards the hill station Munnar. On reaching, check in at the resort, have a small refreshment and set out to traverse the beauty of Munnar — the convergence of three types of mountain streams 1600m above sea level, famous for its tea plantations, nook towns, corkscrew towpath and small waterfalls. In the evening, visit Blossom Park, Tea Gardens and enjoy a nature-friendly elephant ride. Overnight stay at Munnar.",
        activities: [
          { title: "Tea plantations & scenic drive" },
          { title: "Blossom Park & Tea Gardens" },
          { title: "Elephant ride" },
        ],
      },
      {
        day: 3,
        title: "Munnar — Full Day Sightseeing",
        description:
          "In the morning after breakfast, get set for fabulous scenery — the Rose Garden, the beauty of Mattupetty Dam and Kundala Dam, the Elephant Arrival Point, lakes, and Eravikulam National Park. Enjoy a wonderful shopping experience at the Spice Garden in the evening with a mist atmosphere. Late night stay at resort.",
        activities: [
          { title: "Rose Garden" },
          { title: "Mattupetty Dam & Kundala Dam" },
          { title: "Eravikulam National Park" },
          { title: "Spice Garden shopping" },
        ],
      },
      {
        day: 4,
        title: "Munnar to Thekkady — Transfer & Sightseeing",
        description:
          "Early in the morning after breakfast, move towards the tropical evergreen forest at Thekkady. On the way enjoy the beauty of dense forest Periyar Wildlife Sanctuary, one of the world's most fascinating natural wildlife reserves. Take a cruise on the lake followed by a jungle walk. Thereafter visit the spice plantations, bird watching and shopping. Optional activities including elephant safari, Kalarippayattu (martial arts) and Kathakali available. Late night stay at hotel in Thekkady.",
        activities: [
          { title: "Periyar Lake cruise" },
          { title: "Jungle walk" },
          { title: "Spice plantation visit" },
        ],
      },
      {
        day: 5,
        title: "Thekkady to Alleppey — Transfer & Houseboat Overnight Stay",
        description:
          "In the morning after breakfast, move on to the next destination known for its immense natural beauty — Alleppey. On arrival, check into the Houseboat/Hotel by afternoon. Feel the adorable greenery of paddy fields, villages with nostalgic small churches and experience the day-to-day life of village people. Discover exotic land blushed by the Arabian Sea. Overnight stay at Houseboat/Hotel. Includes a day cruise on the Alleppey backwaters.",
        activities: [
          { title: "Backwater houseboat cruise" },
          { title: "Village life & paddy fields" },
        ],
      },
      {
        day: 6,
        title: "Alleppey to Kovalam — Via Jatayu Earth's Center",
        description:
          "After breakfast, check out from your hotel in Alleppey and begin your scenic drive towards Kovalam. En route, visit the famous Jatayu Earth's Center, home to the world's largest bird sculpture dedicated to the legendary character Jatayu from the epic Ramayana. Enjoy the massive rock-top sculpture and learn about the mythological story behind it. Continue your journey to Kovalam, check in to your hotel and relax. Spend the evening at Kovalam Beach, famous for its crescent-shaped shoreline, golden sands and serene Arabian Sea views. Overnight stay in Kovalam.",
        activities: [
          { title: "Jatayu Earth's Center" },
          { title: "Kovalam Beach sunset" },
        ],
      },
      {
        day: 7,
        title: "Kovalam — Kovalam Sightseeing",
        description:
          "Morning after breakfast, proceed to Kovalam Lighthouse Beach, Hawa Beach and Ashoka Beach — evening is the best time to visit and enjoy the sunset. It's an internationally famous beach offering snorkelling, catamaran rides, sunset viewing, cycling and more. Overnight stay at Beach resort.",
        activities: [
          { title: "Lighthouse Beach, Hawa Beach, Ashoka Beach" },
          { title: "Sunset viewing" },
        ],
      },
      {
        day: 8,
        title: "Kovalam to Kanyakumari — Transfer & Sightseeing",
        description:
          "After breakfast, check out from the hotel and proceed towards Kanyakumari, also known as Cape Comorin — the unique confluence of the Arabian Sea, the Indian Ocean, and the Bay of Bengal. En route, visit the historic Padmanabhapuram Palace, showcasing traditional Kerala architecture. By afternoon, arrive in Kanyakumari and check into your hotel. Later, take a boat ride to the iconic Vivekananda Rock Memorial, continue to the Gandhi Memorial, and admire the Thiruvalluvar Statue. In the evening, witness the spectacular sunset at Kanyakumari. Overnight stay at the hotel.",
        activities: [
          { title: "Padmanabhapuram Palace" },
          { title: "Vivekananda Rock Memorial" },
          { title: "Gandhi Memorial & Thiruvalluvar Statue" },
        ],
      },
      {
        day: 9,
        title: "Kanyakumari to Trivandrum — Transfer & Departure",
        description:
          "Morning after breakfast, check out from the resort and proceed to Trivandrum Airport/Railway Station according to your departure time for your onward journey.",
        activities: [{ title: "Transfer to Trivandrum Airport" }],
      },
    ],
    stays: [
      { name: "Hotel in Kochi", location: "Kochi", checkIn: "", checkOut: "", nights: 1, roomType: "Standard Room", notes: "16 Pax + 2 Adults with Extra Bed/Mattress + 6 Children with Extra Bed/Mattress" },
      { name: "Resort in Munnar", location: "Munnar", nights: 2, roomType: "Deluxe Room (With Balcony)", notes: "16 Pax + 2 Adults with Extra Bed/Mattress + 6 Children with Extra Bed/Mattress" },
      { name: "Hotel in Thekkady", location: "Thekkady", nights: 1, roomType: "Deluxe Non-AC", notes: "16 Pax + 2 Adults with Extra Bed/Mattress + 6 Children with Extra Bed/Mattress" },
      { name: "Hotel in Alleppey", location: "Alleppey", nights: 1, roomType: "Deluxe Room", notes: "16 Pax + 2 Adults with Extra Bed/Mattress + 6 Children with Extra Bed/Mattress" },
      { name: "Beach Resort in Kovalam", location: "Kovalam", nights: 2, roomType: "Sea Shell (Partial Sea View)", notes: "16 Pax + 2 Adults with Extra Bed/Mattress + 6 Children with Extra Bed/Mattress" },
      { name: "Hotel in Kanyakumari", location: "Kanyakumari", nights: 1, roomType: "AC Room, Double Occupancy", notes: "16 Pax + 2 Adults with Extra Bed/Mattress + 6 Children with Extra Bed/Mattress" },
    ],
    pricing: {
      items: [{ label: "Standard Package (18 Adults, 6 Children)", amount: 334075 }],
      total: 334075,
      notes: "Deluxe (₹3,77,775) and Premium (₹5,02,297) package options also available with upgraded hotels — ask your consultant. All prices including GST.",
    },
    inclusions: [
      "Accommodations as per mentioned above on Double sharing Basis",
      "Daily Breakfast at Hotel",
      "26 Seater Tempo Traveller A/C Vehicle for entire Sightseeing and Transfer as per the Itinerary",
      "Pick up from Cochin and Drop at Trivandrum",
      "3 Bedroom Deluxe Houseboat for Day Cruise with Lunch and Tea & Snacks",
      "24/7 Customer support",
      "All Taxes",
    ],
    exclusions: [
      "Any Airfare, Bus fare, Train fare other than Mentioned Above",
      "All Entrance fees Extra",
      "All personal expenses such as drinks, telephone, and laundry bills etc.",
      "Any Tips and porter charges",
      "Any boating charges (motor boat / pedal boat)",
      "Any additional expenses incurred due to any flight delay or cancellation, weather conditions, political closures, technical faults etc.",
      "Any other service/s not specified above",
    ],
  },
  {
    id: "jammu-kashmir",
    label: "Jammu & Kashmir",
    description: "4 Nights / 5 Days — Srinagar, Gulmarg, Pahalgam",
    destination: "Jammu and Kashmir, India",
    title: "Jammu & Kashmir — 4 Nights / 5 Days",
    days: [
      {
        day: 1,
        title: "Arrival in Srinagar & Dal Lake Enchantment",
        description:
          "Arrive at Srinagar International Airport and transfer to your pre-booked houseboat on the serene Dal Lake. Settle in and then embark on a peaceful evening ride, gliding through the tranquil waters of Dal Lake. Witness the vibrant floating markets, where vendors sell fresh produce and handicrafts from their boats. Enjoy the picturesque views of the surrounding mountains as the day unfolds. The evening is yours to relax and soak in the unique atmosphere of your houseboat.",
        activities: [{ title: "Shikara ride on Dal Lake" }, { title: "Floating markets" }],
      },
      {
        day: 2,
        title: "Srinagar's Mughal Gardens & Old City Charm",
        description:
          "Begin your day by exploring the magnificent Mughal Gardens of Srinagar. Visit the terraced Shalimar Bagh, the enchanting Nishat Bagh, and the serene Chashme Shahi, each offering unique perspectives on Mughal-era landscaping. Continue to the Hazratbal Shrine, and explore the local markets of the old city. Wander through its narrow lanes, discover ancient mosques like the Hazratbal Shrine, and experience the local culture. You'll have opportunities to browse for traditional Kashmiri handicrafts such as pashmina shawls and intricate wood carvings.",
        activities: [
          { title: "Shalimar Bagh, Nishat Bagh, Chashme Shahi" },
          { title: "Old city market walk" },
        ],
      },
      {
        day: 3,
        title: "Gulmarg: Meadow of Flowers & Gondola Ride",
        description:
          "Embark on a scenic drive to Gulmarg, renowned as the 'Meadow of Flowers'. Upon arrival, experience the thrill of the Gulmarg Gondola, one of the highest cable cars in the world, offering unique architectural activities like horse riding or simply taking in the majestic mountain views. The crisp mountain air and stunning landscapes will provide an unforgettable experience.",
        activities: [{ title: "Gulmarg Gondola cable car" }, { title: "Horse riding" }],
      },
      {
        day: 4,
        title: "Pahalgam: Valley of Shepherds & Lidder River",
        description:
          "Travel to Pahalgam, a picturesque valley situated at the confluence of the Lidder River and streams. Explore the breathtaking landscapes, from lush green meadows to dense pine forests. Enjoy a leisurely walk along the Lidder River, listening to the soothing sound of the water and admiring the serene surroundings.",
        activities: [{ title: "Lidder River walk" }, { title: "Betaab Valley & Aru Valley" }],
      },
      {
        day: 5,
        title: "Srinagar Exploration & Departure",
        description:
          "Enjoy a final breakfast in Srinagar, perhaps with one last glimpse of Dal Lake. Depending on your flight schedule, you might have time for some last-minute exploration or a visit to the Pari Mahal (The Palace of Fairies) for its terraced gardens and historical significance. Afterwards, you will be transferred to Srinagar International Airport for your onward journey, carrying with you cherished memories of Kashmir's unparalleled beauty.",
        activities: [{ title: "Pari Mahal (optional)" }, { title: "Transfer to Srinagar Airport" }],
      },
    ],
    stays: [
      { name: "Houseboat on Dal Lake", location: "Srinagar", nights: 2, roomType: "Deluxe Houseboat Room" },
      { name: "Hotel in Gulmarg / Pahalgam", location: "Gulmarg & Pahalgam", nights: 2, roomType: "Standard Room" },
    ],
    pricing: {
      items: [
        { label: "Land Package (per adult)", amount: 8000 },
        { label: "Airfare (per adult)", amount: 6500 },
      ],
      total: 14500,
      notes: "Per adult, with bed, breakfast plan. Cost per child and without-bed rates available on request.",
    },
    inclusions: [
      "Break down each planning task (research, booking, packing) into smaller, manageable steps with specific deadlines",
      "Use a calendar or planner to schedule these tasks",
      "Visualizing each outcome can motivate you to push through the planning phase",
      "I confirm that I have read and accept the terms and conditions and privacy policy",
    ],
    exclusions: [
      "Any international or domestic flights not listed in the itinerary",
      "Lunch and dinner (except for welcome and farewell dinners)",
      "Visa fees and processing for countries requiring entry visas",
      "Tips for tour guides, drivers, and hotel staff",
    ],
  },
  {
    id: "thailand",
    label: "Thailand",
    description: "7 Nights / 8 Days — Bangkok, Ayutthaya, Chiang Mai",
    destination: "Thailand",
    title: "Thailand — 7 Nights / 8 Days",
    days: [
      {
        day: 1,
        title: "Arrival in Bangkok & River Exploration",
        description:
          "Arrive at Suvarnabhumi Airport (BKK), Bangkok. Transfer to your hotel and check in. Embark on a local boat tour along the Chao Phraya River, visiting iconic temples like Wat Arun (Temple of Dawn) and Wat Pho (Reclining Buddha). Enjoy a delicious dinner at a riverside restaurant, experiencing the vibrant atmosphere.",
        activities: [{ title: "Chao Phraya River boat tour" }, { title: "Wat Arun & Wat Pho" }],
      },
      {
        day: 2,
        title: "Bangkok's Temples & Markets",
        description:
          "Visit the Grand Palace and the Emerald Buddha Temple, two of Bangkok's most significant landmarks. Explore the bustling Chatuchak Weekend Market (if open) or the vibrant street market at Asiatique The Riverfront. Enjoy local unique souvenirs and street food. In the evening, relax to a night market bazaar for a traditional Thai massage.",
        activities: [{ title: "Grand Palace & Emerald Buddha Temple" }, { title: "Asiatique The Riverfront" }],
      },
      {
        day: 3,
        title: "Ayutthaya Historical Park",
        description:
          "Take a day trip to Ayutthaya, the former capital of Siam. Explore the magnificent ancient temples and palaces, a UNESCO World Heritage site. Hire a bicycle to explore the park efficiently. Enjoy a local lunch in Ayutthaya before returning to Bangkok in the late afternoon.",
        activities: [{ title: "Ayutthaya Historical Park (UNESCO site)" }],
      },
      {
        day: 4,
        title: "Flight to Chiang Mai & Old City Charm",
        description:
          "Fly from Bangkok to Chiang Mai. Check into your hotel and begin exploring the charming Old City. Visit Wat Chedi Luang and Wat Phra Singh, and wander through the narrow streets, admiring traditional Lanna architecture. Enjoy a local restaurant in the evening, trying Khao Soi, a northern Thai specialty.",
        activities: [{ title: "Wat Chedi Luang & Wat Phra Singh" }, { title: "Khao Soi dinner" }],
      },
      {
        day: 5,
        title: "Elephant Sanctuary & Doi Suthep",
        description:
          "Visit an ethical elephant sanctuary, learning about interacting responsibly with these gentle giants, feeding and bathing them. In the afternoon, visit Doi Suthep-Pui National Park, home to the stunning Wat Phra That Doi Suthep temple, offering panoramic views of Chiang Mai.",
        activities: [{ title: "Ethical elephant sanctuary" }, { title: "Wat Phra That Doi Suthep" }],
      },
      {
        day: 6,
        title: "Chiang Mai Cooking Class & Night Bazaar",
        description:
          "Participate in a hands-on Thai cooking class, learning to prepare some of the country's most popular dishes. Enjoy feeding and bathing them. In the evening, explore the Chiang Mai Night Bazaar, a vibrant market filled with handicrafts, clothing and street food. Enjoy a final dinner exploring the dishes in Chiang Mai.",
        activities: [{ title: "Thai cooking class" }, { title: "Chiang Mai Night Bazaar" }],
      },
      {
        day: 7,
        title: "Departure from Chiang Mai",
        description:
          "Enjoy a leisurely breakfast. Depending on your flight schedule, you might have time for some last-minute shopping or exploring a local cafe. Transfer to Chiang Mai International Airport (CNX) for your departure flight.",
        activities: [{ title: "Transfer to Chiang Mai International Airport" }],
      },
      {
        day: 8,
        title: "Travel Day",
        description: "Travel day — arrive home.",
        activities: [],
      },
    ],
    stays: [
      { name: "Hotel in Bangkok", location: "Bangkok", nights: 3, roomType: "Standard Room", notes: "Breakfast Plan" },
      { name: "Hotel in Chiang Mai", location: "Chiang Mai", nights: 4, roomType: "Standard Room", notes: "Breakfast Plan" },
    ],
    pricing: {
      items: [
        { label: "Land Package (per adult)", amount: 60000 },
        { label: "Airfare (per adult)", amount: 14500 },
      ],
      total: 74500,
      notes: "Per adult, with bed. Cost per child and without-bed rates available on request.",
    },
    inclusions: [
      "Break down each planning task (research, booking, packing) into smaller, manageable steps with specific deadlines",
      "Use a calendar or planner to schedule these tasks",
      "Visualizing each outcome can motivate you to push through the planning phase",
      "I confirm that I have read and accept the terms and conditions and privacy policy",
    ],
    exclusions: [
      "Any international or domestic flights not listed in the itinerary",
      "Lunch and dinner (except for welcome and farewell dinners)",
      "Visa fees and processing for countries requiring entry visas",
      "Tips for tour guides, drivers, and hotel staff",
    ],
  },
];
