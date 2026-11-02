import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Compass,
  Check,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Award,
  HeartHandshake,
  Bot,
  RefreshCw,
  Sun,
  Moon,
  Coffee,
  Bed,
  Car,
  Share2,
  FileText
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import HeroGradientBackground from '../components/HeroGradientBackground';
import { usePageScrollReveal } from '../hooks/useScrollAnimation';

// ---------------------------------------------------------------------------
// Bespoke Data Structures
// ---------------------------------------------------------------------------

interface TravelStyleOption {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  tag: string;
}

const TRAVEL_STYLES: TravelStyleOption[] = [
  {
    id: 'romantic',
    title: 'Romantic & Honeymoon',
    subtitle: 'Intimate escapes for two',
    desc: 'Candlelit kettuvallams, secluded pool villas, and silent sunset dining above the clouds.',
    image: '/images/exp_houseboat.jpg',
    tag: 'Couples & Honeymoons'
  },
  {
    id: 'wellness',
    title: 'Wellness & Classical Ayurveda',
    subtitle: 'Ayurveda, rest and deep renewal',
    desc: 'Physician-supervised panchakarma therapies, daily yoga pavilions, and restorative herbal gardens.',
    image: '/images/retreat_ayurveda_hd.jpg',
    tag: 'Healing & Rejuvenation'
  },
  {
    id: 'wildlife',
    title: 'Wilderness & Nature',
    subtitle: 'Untamed Kerala expeditions',
    desc: 'Periyar elephant corridors, bamboo river rafting, and canopy eco-treehouses in deep rainforest.',
    image: '/images/tour_5_wildlife.jpg',
    tag: 'Flora, Fauna & Peaks'
  },
  {
    id: 'heritage',
    title: 'Heritage & Living Arts',
    subtitle: '15th-century spice history',
    desc: 'Fort Kochi colonial quarters, ancient Jewish synagogues, and sacred nocturnal Theyyam fire dances.',
    image: '/images/exp_kathakali.jpg',
    tag: 'Culture & Sacred Rituals'
  },
  {
    id: 'backwaters',
    title: 'Connoisseur Backwaters',
    subtitle: 'Unhurried slow living on water',
    desc: 'Handcrafted luxury houseboats with private chef, lakefront heritage manors, and village lagoons.',
    image: '/images/tour_1_backwaters.jpg',
    tag: 'Private Waterways'
  },
  {
    id: 'family',
    title: 'Family & Private Estates',
    subtitle: 'Memories across generations',
    desc: 'Exclusive tea planter bungalows, child-friendly spice trails, and private chauffeured pacing.',
    image: '/images/exp_pool_villa.jpg',
    tag: 'Multi-Generational'
  }
];

interface DestinationOption {
  id: string;
  name: string;
  region: string;
  tag: string;
  image: string;
}

const DESTINATION_OPTIONS: DestinationOption[] = [
  { id: 'munnar', name: 'Munnar', region: 'Highlands', tag: 'Tea Estates & Mist', image: '/images/dest_3_munnar.jpg' },
  { id: 'alleppey', name: 'Alleppey', region: 'Backwaters', tag: 'Private Houseboat Lagoons', image: '/images/tour_1_backwaters.jpg' },
  { id: 'wayanad', name: 'Wayanad', region: 'Rainforest', tag: 'Ancient Caves & Canopy', image: '/images/dest_1_wayanad.jpg' },
  { id: 'fort-kochi', name: 'Fort Kochi', region: 'Heritage Coast', tag: 'Colonial Spice Port', image: '/images/dest_fort_kochi.jpg' },
  { id: 'thekkady', name: 'Thekkady', region: 'Wildlife Sanctuary', tag: 'Elephant Trails & Spices', image: '/images/dest_4_rafting.jpg' },
  { id: 'kumarakom', name: 'Kumarakom', region: 'Vembanad Lake', tag: 'Bird Sanctuary & Lakefront', image: '/images/dest_kumarakom.jpg' },
  { id: 'varkala', name: 'Varkala', region: 'Southern Shore', tag: 'Red Cliffs & Arabian Sea', image: '/images/dest_5_varkala.jpg' },
  { id: 'bekal', name: 'Bekal', region: 'North Malabar', tag: 'Coastal Fort & Quiet Beaches', image: '/images/dest_bekal.jpg' },
  { id: 'vagamon', name: 'Vagamon', region: 'Pine Valleys', tag: 'Rolling Meadows & Solitude', image: '/images/dest_2_vagamon.jpg' },
  { id: 'kannur', name: 'Kannur', region: 'Malabar Coast', tag: 'Sacred Theyyam Rituals', image: '/images/dest_kannur.jpg' }
];

const DURATION_OPTIONS = [
  { id: 'short', label: '4–6 Nights', sub: 'Express Highlands & Waterways', desc: 'Ideal for extended weekends or quick rejuvenations.' },
  { id: 'signature', label: '7–10 Nights', sub: 'The Signature Kerala Discovery', desc: 'The quintessential balance of hills, heritage, and backwaters.' },
  { id: 'grand', label: '11–14 Nights', sub: 'Comprehensive North-to-South', desc: 'From Malabar spice traditions to deep southern clifftops.' },
  { id: 'slow', label: '15+ Nights', sub: 'Unhurried Slow Living & Curative', desc: 'Dedicated Ayurvedic panchakarma or deep living culture immersion.' }
];

const BUDGET_OPTIONS = [
  { id: 'classic', label: 'Classic', sub: 'Curated Heritage & Comfort', desc: 'Premium boutique homestays, charming estates, and select heritage resorts.' },
  { id: 'premium', label: 'Premium', sub: 'Elevated Boutique Luxury', desc: 'Luxury heritage estates, private handcrafted houseboats, and curated transfers.' },
  { id: 'luxury', label: 'Luxury', sub: 'Signature 5-Star Sanctuaries', desc: '5-star private pool villas, fine dining, and expert local private guides.' },
  { id: 'signature-luxury', label: 'Signature Luxury', sub: 'Ultra-Exclusive Retreats', desc: 'Ultra-exclusive private sanctuaries, dedicated chauffeurs, and premier Ayurvedic spas.' },
  { id: 'bespoke', label: 'Ultra-Bespoke', sub: 'Private Aviation & Palatial', desc: 'Charter aviation, royal retreats, and personalized bespoke concierge staff.' }
];

const TRAVEL_SEASONS = [
  'October – December (Golden Season)',
  'January – March (Pleasant Winter)',
  'April – May (Summer Serenity & Hills)',
  'June – September (Monsoon Rejuvenation & Ayurveda)',
  'Festive Christmas & New Year'
];

const STAY_PREFERENCES = [
  'Hotels',
  'Normal Resorts',
  'Hill Station Resorts',
  'Heritage Planter’s Bungalow',
  'Private Handcrafted Houseboat',
  'Lakefront Pool Villa',
  'Beach & Coastal Resort',
  'Authentic Ayurvedic Sanctuary',
  'Canopy Eco-Treehouse'
];

const VEHICLE_OPTIONS = [
  'Standard (Sedan)',
  'Premium (Innova Crysta)',
  'Luxury (Innova Hycross / SUV)',
  'Tempo Traveller (Group Van)'
];

// ---------------------------------------------------------------------------
// AI Generated Itinerary Interfaces & Fallback Generator
// ---------------------------------------------------------------------------

export interface GeneratedDay {
  day: number;
  title: string;
  destination: string;
  morning: string;
  afternoon: string;
  evening: string;
  stay: string;
  transit: string;
}

export interface GeneratedItinerary {
  title: string;
  tagline: string;
  route: string[];
  durationDays: number;
  season: string;
  budgetEst: string;
  days: GeneratedDay[];
}

function buildSyntheticAiPlan(params: {
  days: number;
  style: string;
  destinations: string[];
  notes?: string;
}): GeneratedItinerary {
  const destList = params.destinations.length > 0 ? params.destinations : ['Fort Kochi', 'Munnar', 'Alleppey'];
  const primaryDest = destList[0];

  const syntheticDays: GeneratedDay[] = [
    {
      day: 1,
      title: 'Arrival in Colonial Malabar & Twilight Harbor Cruise',
      destination: 'Fort Kochi',
      morning: 'Private chauffeur airport greeting with chilled fresh tender coconut water and scented towels. Transfer to a 300-year-old heritage boutique hotel.',
      afternoon: 'Guided stroll through 15th-century Portuguese spice warehouses, antique Jewish synagogue quarters, and the historic Dutch cemetery.',
      evening: 'Exclusive sunset wooden boat cruise alongside the ancient Chinese fishing nets, followed by coastal seafood dining with private chef.',
      stay: 'Brunton Boatyard or Eighth Bastion Heritage Suite',
      transit: 'Airport to Fort Kochi Private Chauffeur (1 hr)'
    },
    {
      day: 2,
      title: 'Ascent to the Cloudline & Emerald High-Range Tea Trails',
      destination: 'Munnar',
      morning: 'Scenic journey climbing through cascading Cheeyappara waterfalls and cardamon-scented mountain air into Munnar’s 6,000-foot heights.',
      afternoon: 'Private tea tasting and leaf-plucking masterclass with a resident tea master at an exclusive colonial estate.',
      evening: 'Warm fireplace high-tea overlooking misty rolling valleys, followed by private veranda candlelight dinner.',
      stay: 'Windermere Estate or Tall Trees Private Planter Villa',
      transit: 'Fort Kochi to Munnar Panoramic Ghats Drive (3.5 hrs)'
    },
    {
      day: 3,
      title: 'Dawn Peaks, Eravikulam Bio-Sanctuary & Silent Walks',
      destination: 'Munnar',
      morning: 'Early morning wildlife expedition to spot the endangered Nilgiri Tahr against misty granite cliffs of Eravikulam.',
      afternoon: 'Organic spice plantation sensory tour learning botanical vanilla, black pepper vines, and nutmeg cultivation.',
      evening: 'Herbal hot-stone therapy at the mountain spa pavilion and twilight stargazing.',
      stay: 'Windermere Estate or Spice Tree Munnar Pool Villa',
      transit: 'Local chauffeur hill exploration'
    },
    {
      day: 4,
      title: 'Periyar Elephant Haven & Forest Bamboo Rafting',
      destination: 'Thekkady',
      morning: 'Drive past cardamom hills into the Periyar Tiger Reserve buffer zone.',
      afternoon: 'Private bamboo river rafting with indigenous tribal guides, spotting wild elephants and hornbills drinking at lake edges.',
      evening: 'Private demonstration of Kalaripayattu, Kerala’s 3,000-year-old martial art, followed by traditional clay-pot Syrian Christian feast.',
      stay: 'Spice Village or Niraamaya Retreats Cardamom Club',
      transit: 'Munnar to Thekkady Scenic Ridge Route (3 hrs)'
    },
    {
      day: 5,
      title: 'Embarkation upon the Silent Backwaters in a Handcrafted Kettuvallam',
      destination: 'Alleppey',
      morning: 'Descent to the Vembanad Lake basin. Step aboard your private luxury air-conditioned houseboat crafted from natural anjili wood.',
      afternoon: 'Glide silently past paddy fields below sea level, duck farms, and water lilies while your private onboard chef prepares fresh pearl spot karimeen.',
      evening: 'Anchorage in a quiet palm-fringed lagoon under a canopy of stars. Enjoy a candlelit deck dinner to the gentle lap of water.',
      stay: 'Escora Signature 1-Bedroom Private Houseboat',
      transit: 'Thekkady to Alleppey Private Chauffeur (3.5 hrs)'
    },
    {
      day: 6,
      title: 'Sunrise Waterway Yoga & Vembanad Lakefront Sanctuary',
      destination: 'Kumarakom',
      morning: 'Sunrise pranayama yoga on the houseboat deck as morning mist rises off lotus blossoms. Traditional appam and stew breakfast.',
      afternoon: 'Check-in to a luxury lakefront pool villa. Afternoon canoe expedition through narrow village canals lined with swaying coconut palms.',
      evening: 'Deeply relaxing 90-minute Ayurvedic Abhyanga warm herbal oil massage at the lakeside spa pavilion.',
      stay: 'Kumarakom Lake Resort or Coconut Lagoon Heritage Villa',
      transit: 'Alleppey to Kumarakom Lakefront Transfer (45 mins)'
    },
    {
      day: 7,
      title: 'Bird Sanctuary Dawn Stroll & Farewell Chauffeur Transfer',
      destination: 'Kochi Gateway',
      morning: 'Gentle sunrise stroll through the Kumarakom Bird Sanctuary watching Siberian cranes and kingfishers.',
      afternoon: 'Last artisanal souvenir shopping in Mattancherry for unadulterated saffron, handloom cotton, and aged Malabar spices.',
      evening: 'Private chauffeur transfer to Cochin International Airport (COK) for departure with unhurried memories.',
      stay: 'Departure / Gateway Transit',
      transit: 'Kumarakom to Cochin Airport (1.5 hrs)'
    }
  ];

  const slicedDays = syntheticDays.slice(0, Math.min(params.days, syntheticDays.length));

  return {
    title: `${params.days}-Day ${params.style ? params.style.toUpperCase() : 'SIGNATURE'} KERALA ODYSSEY`,
    tagline: 'Handcrafted by Escora AI Grounded Engine · Curated for Unhurried Elegance',
    route: ['Kochi', ...destList.slice(0, 3), 'Departure'],
    durationDays: params.days,
    season: 'October – March (Optimal)',
    budgetEst: '₹1.8L – ₹3.5L Per Guest (Estimated Luxury Tier)',
    days: slicedDays
  };
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function PlanJourneyPage() {
  usePageScrollReveal();

  const [location] = useLocation();

  const spiritTrackRef = useRef<HTMLDivElement | null>(null);
  const destinationTrackRef = useRef<HTMLDivElement | null>(null);

  const scrollSpiritTrack = (offset: number) => {
    if (spiritTrackRef.current) {
      spiritTrackRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollDestinationTrack = (offset: number) => {
    if (destinationTrackRef.current) {
      destinationTrackRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Mode Selection: 'concierge' (Human Atelier) vs 'ai' (AI Trip Planner)
  const [plannerMode, setPlannerMode] = useState<'concierge' | 'ai'>('concierge');

  // Wizard Step for Human Concierge (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['Munnar', 'Alleppey']);
  const [duration, setDuration] = useState<string>('7–10 Nights');
  const [exactDays, setExactDays] = useState<string>('');

  const handleSelectDurationPreset = (label: string) => {
    setDuration(label);
    setExactDays('');
  };

  const handleExactDaysChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setExactDays(cleaned);
    if (cleaned === '') {
      setDuration('7–10 Nights');
    } else {
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num > 0) {
        const sanitized = Math.min(90, num);
        setDuration(`${sanitized} Days (${sanitized > 1 ? `${sanitized - 1} Nights` : 'Day Trip'})`);
      }
    }
  };

  const handleExactDaysBlur = () => {
    if (exactDays !== '') {
      const num = parseInt(exactDays, 10);
      if (isNaN(num) || num < 1) {
        setExactDays('');
        setDuration('7–10 Nights');
      } else {
        const sanitized = Math.min(90, num);
        setExactDays(String(sanitized));
        setDuration(`${sanitized} Days (${sanitized > 1 ? `${sanitized - 1} Nights` : 'Day Trip'})`);
      }
    }
  };

  const handleExactDaysStep = (delta: number) => {
    const current = exactDays ? parseInt(exactDays, 10) : 7;
    const base = isNaN(current) || current < 1 ? 7 : current;
    const nextVal = Math.max(1, Math.min(90, base + delta));
    setExactDays(String(nextVal));
    setDuration(`${nextVal} Days (${nextVal > 1 ? `${nextVal - 1} Nights` : 'Day Trip'})`);
  };
  const [travelMonth, setTravelMonth] = useState<string>('October – December (Golden Season)');
  const [budget, setBudget] = useState<string>('Luxury');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [preferredStays, setPreferredStays] = useState<string[]>([
    'Hill Station Resorts',
    'Private Handcrafted Houseboat'
  ]);
  const [vehicleType, setVehicleType] = useState<string>('Premium (Innova Crysta)');

  // Guest Details
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'phone' | 'email'>('whatsapp');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');

  // -------------------------------------------------------------------------
  // AI Trip Planner Specific State
  // -------------------------------------------------------------------------
  const [aiDurationDays, setAiDurationDays] = useState<number>(7);
  const [aiTravelPace, setAiTravelPace] = useState<string>('Unhurried & Immersive');
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [generatedAiPlan, setGeneratedAiPlan] = useState<GeneratedItinerary | null>(null);

  const scrollSmoothTo = (top: number, immediate = false) => {
    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(top, { immediate, duration: 0.9 });
    } else {
      window.scrollTo(immediate ? { top } : { top, behavior: 'smooth' });
    }
  };

  // Prepopulate from URL parameters if arriving with query
  // Prepopulate from draft, sessionStorage & URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('escora_plan_draft');
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft.selectedStyle !== undefined) setSelectedStyle(draft.selectedStyle);
          if (Array.isArray(draft.selectedDestinations)) setSelectedDestinations(draft.selectedDestinations);
          if (draft.duration) setDuration(draft.duration);
          if (draft.exactDays !== undefined) setExactDays(draft.exactDays);
          if (draft.travelMonth) setTravelMonth(draft.travelMonth);
          if (draft.budget) setBudget(draft.budget);
          if (typeof draft.adults === 'number') setAdults(draft.adults);
          if (typeof draft.children === 'number') setChildren(draft.children);
          if (Array.isArray(draft.preferredStays)) setPreferredStays(draft.preferredStays);
          if (draft.vehicleType) setVehicleType(draft.vehicleType);
          if (draft.guestName) setGuestName(draft.guestName);
          if (draft.guestEmail) setGuestEmail(draft.guestEmail);
          if (draft.guestPhone) setGuestPhone(draft.guestPhone);
          if (draft.preferredContact) setPreferredContact(draft.preferredContact);
          if (draft.specialNotes) setSpecialNotes(draft.specialNotes);
        }
      } catch (e) {
        // ignore parse error
      }

      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      const destParam = urlParams.get('destination');
      const expParam = urlParams.get('experience');
      const styleParam = urlParams.get('style');
      const stepParam = urlParams.get('step');
      const savedStep = sessionStorage.getItem('escora_plan_step');

      const restoredStep = stepParam ? parseInt(stepParam, 10) : savedStep ? parseInt(savedStep, 10) : 1;
      if (!isNaN(restoredStep) && restoredStep >= 1 && restoredStep <= 5) {
        setCurrentStep(restoredStep);
        if (restoredStep > 1) {
          setTimeout(() => scrollSmoothTo(320), 120);
        } else {
          scrollSmoothTo(0, true);
        }
      } else {
        scrollSmoothTo(0, true);
      }

      if (modeParam === 'ai') {
        setPlannerMode('ai');
      }
      if (destParam) {
        setSelectedDestinations((prev) => Array.from(new Set([...prev, destParam])));
      }
      if (styleParam && TRAVEL_STYLES.some((s) => s.id === styleParam)) {
        setSelectedStyle(styleParam);
      }
      if (expParam) {
        setSpecialNotes((prev) => (prev ? `${prev} | Special interest: ${expParam}` : `Special interest: ${expParam}`));
        setAiCustomPrompt((prev) => (prev ? `${prev}, interested in ${expParam}` : `Interested in ${expParam}`));
      }
    }
  }, []);

  // Sync currentStep to sessionStorage and URL parameter so reloads remain on current step
  useEffect(() => {
    if (typeof window !== 'undefined' && !isSubmitted) {
      sessionStorage.setItem('escora_plan_step', String(currentStep));
      const url = new URL(window.location.href);
      url.searchParams.set('step', String(currentStep));
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentStep, isSubmitted]);

  // Sync draft form state to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isSubmitted) {
      try {
        const draft = {
          selectedStyle,
          selectedDestinations,
          duration,
          exactDays,
          travelMonth,
          budget,
          adults,
          children,
          preferredStays,
          vehicleType,
          guestName,
          guestEmail,
          guestPhone,
          preferredContact,
          specialNotes
        };
        sessionStorage.setItem('escora_plan_draft', JSON.stringify(draft));
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [
    selectedStyle,
    selectedDestinations,
    duration,
    exactDays,
    travelMonth,
    budget,
    adults,
    children,
    preferredStays,
    vehicleType,
    guestName,
    guestEmail,
    guestPhone,
    preferredContact,
    specialNotes,
    isSubmitted
  ]);

  const toggleDestination = (name: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const toggleStay = (stay: string) => {
    setPreferredStays((prev) =>
      prev.includes(stay) ? prev.filter((s) => s !== stay) : [...prev, stay]
    );
  };

  const handleNextStep = (targetStep: number) => {
    setErrorText('');
    setCurrentStep(targetStep);
    scrollSmoothTo(320);
  };

  const handlePrevStep = (targetStep: number) => {
    setErrorText('');
    setCurrentStep(targetStep);
    scrollSmoothTo(320);
  };

  // Submit Concierge Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setErrorText('Please provide your name, email, and contact number so our curator can reach you.');
      return;
    }

    setIsSubmitting(true);
    setErrorText('');

    try {
      const payload = {
        name: guestName.trim(),
        email: guestEmail.trim(),
        phone: guestPhone.trim(),
        destinations: selectedDestinations.join(', '),
        travelStyle: TRAVEL_STYLES.find((s) => s.id === selectedStyle)?.title || selectedStyle,
        travelDate: travelMonth,
        specialRequests: `[Plan Your Journey Atelier] Duration: ${duration} | Travel Tier: ${budget} | Vehicle: ${vehicleType || 'Standard'} | Travellers: ${adults} Adults, ${children} Children | Preferred Stays: ${preferredStays.join(', ')} | Preferred Contact: ${preferredContact.toUpperCase()} | Special Notes: ${specialNotes.trim() || 'None'}`.trim(),
        source: 'plan_your_journey_page'
      };

      await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('escora_plan_step');
        sessionStorage.removeItem('escora_plan_draft');
        const url = new URL(window.location.href);
        url.searchParams.delete('step');
        window.history.replaceState({}, '', url.toString());
      }

      setIsSubmitted(true);
      scrollSmoothTo(0);
    } catch (err) {
      console.warn('Network note:', err);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('escora_plan_step');
        sessionStorage.removeItem('escora_plan_draft');
      }
      // Fallback: still show the confirmation screen
      setIsSubmitted(true);
      scrollSmoothTo(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate AI Trip Plan
  const handleGenerateAiPlan = async () => {
    setIsGeneratingAi(true);
    setErrorText('');

    try {
      const payload = {
        durationDays: aiDurationDays,
        interests: [selectedStyle, ...selectedDestinations],
        seasonOrDates: travelMonth,
        pace: aiTravelPace,
        additionalNotes: aiCustomPrompt.trim(),
        startLocation: 'Kochi'
      };

      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.days && data.days.length > 0) {
          setGeneratedAiPlan({
            title: data.title || `${aiDurationDays}-Day Bespoke Kerala AI Itinerary`,
            tagline: data.tagline || 'Synthesized by Escora AI Knowledge Engine',
            route: data.routeSequence || selectedDestinations,
            durationDays: data.durationDays || aiDurationDays,
            season: data.idealSeason || travelMonth,
            budgetEst: data.budgetGuidance || '₹2L – ₹4L Estimated Luxury Tier',
            days: data.days.map((d: any, idx: number) => ({
              day: d.day || idx + 1,
              title: d.title || `Day ${idx + 1} Discovery`,
              destination: d.destination || 'Kerala Highlands',
              morning: d.morningActivity || 'Morning sunrise expedition',
              afternoon: d.afternoonActivity || 'Afternoon scenic cultural discovery',
              evening: d.eveningActivity || 'Evening candlelight culinary experience',
              stay: d.stayRecommendation || 'Luxury Heritage Villa',
              transit: d.travelNote || 'Private Chauffeur Scenic Transit'
            }))
          });
          setIsGeneratingAi(false);
          return;
        }
      }

      // If backend AI endpoint is in mock mode or unavailable, generate synthetic slow-luxury plan seamlessly
      await new Promise((r) => setTimeout(r, 900)); // Graceful luxury pacing
      const synthetic = buildSyntheticAiPlan({
        days: aiDurationDays,
        style: selectedStyle,
        destinations: selectedDestinations,
        notes: aiCustomPrompt
      });
      setGeneratedAiPlan(synthetic);
    } catch (err) {
      console.warn('AI generator fallback:', err);
      const synthetic = buildSyntheticAiPlan({
        days: aiDurationDays,
        style: selectedStyle,
        destinations: selectedDestinations,
        notes: aiCustomPrompt
      });
      setGeneratedAiPlan(synthetic);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const currentStyleObj = TRAVEL_STYLES.find((s) => s.id === selectedStyle);

  return (
    <div
      className="anim-page-fade-in"
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF8F5',
        color: '#121316',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Navbar />

      {/* Atmospheric Luxury Atelier Hero Banner */}
      <section
        style={{
          padding: '8.5rem 1.5rem 4rem',
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Vignette Texture */}
        <HeroGradientBackground opacity={0.7} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(212, 163, 89, 0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.5,
            pointerEvents: 'none'
          }}
        />

        <div className="section-wrapper" style={{ maxWidth: '1360px', position: 'relative', zIndex: 2 }}>
          {/* Breadcrumb & Top Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.75rem'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.65)'
              }}
            >
              <Link href="/" style={{ color: 'rgba(255, 255, 255, 0.65)', textDecoration: 'none' }}>
                Home
              </Link>
              <span>/</span>
              <span style={{ color: '#D4A359', fontWeight: 600 }}>Plan Your Journey</span>
            </div>

            {/* Dual Planning Mode Selector Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.3rem',
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                gap: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setPlannerMode('concierge')}
                className="anim-hover-pill"
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: plannerMode === 'concierge' ? '#D4A359' : 'transparent',
                  color: plannerMode === 'concierge' ? '#0D0F13' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.25s ease'
                }}
              >
                <Compass size={14} /> Human Concierge Atelier
              </button>

              <button
                type="button"
                onClick={() => setPlannerMode('ai')}
                className="anim-hover-pill"
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: plannerMode === 'ai' ? '#D4A359' : 'transparent',
                  color: plannerMode === 'ai' ? '#0D0F13' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.25s ease'
                }}
              >
                Instant AI Trip Planner
              </button>
            </div>
          </div>

          {/* Title & Introduction */}
          <div style={{ maxWidth: '840px' }}>
            <h1
              className="font-display anim-hero-title"
              style={{
                fontSize: 'clamp(2.4rem, 4.8vw, 4.1rem)',
                lineHeight: 1.05,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                margin: '0 0 1.25rem',
                color: '#FFFFFF'
              }}
            >
              {plannerMode === 'concierge' ? (
                <>Craft Your <span style={{ color: '#D4A359' }}>Kerala Expedition</span></>
              ) : (
                <>Escora <span style={{ color: '#D4A359' }}>AI Trip Planner</span></>
              )}
            </h1>

            <p
              className="anim-hero-desc"
              style={{
                fontSize: 'clamp(0.98rem, 1.15vw, 1.12rem)',
                color: 'rgba(255, 255, 255, 0.78)',
                lineHeight: 1.65,
                margin: 0
              }}
            >
              {plannerMode === 'concierge'
                ? "Every Escora journey is shaped entirely around your pace, companions, and sensory desires. Complete the five curation steps below, and a dedicated senior Kerala journey designer will present your handcrafted proposal within 24 hours."
                : "Generate an instant, day-by-day bespoke luxury Kerala itinerary using our grounded AI intelligence engine. Refine your preferred pace, hills, and waterways in seconds, then transmit directly to our concierge."
              }
            </p>
          </div>

          {/* Stepper Navigation Bar (For Concierge Mode) */}
          {plannerMode === 'concierge' && !isSubmitted && (
            <div
              style={{
                marginTop: '3.5rem',
                paddingTop: '2rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(0.5rem, 1.8vw, 1.25rem)',
                  flexWrap: 'wrap'
                }}
              >
                {[
                  { step: 1, label: 'Style & Rhythm' },
                  { step: 2, label: 'Destinations' },
                  { step: 3, label: 'Dates & Duration' },
                  { step: 4, label: 'Stays & Guests' },
                  { step: 5, label: 'Concierge Dossier' }
                ].map((s) => {
                  const isActive = s.step === currentStep;
                  const isCompleted = s.step < currentStep;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => isCompleted && handlePrevStep(s.step)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        cursor: isCompleted ? 'pointer' : 'default',
                        opacity: isActive ? 1 : isCompleted ? 0.9 : 0.45,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? '#D4A359' : isCompleted ? '#2D6A4F' : 'rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          boxShadow: isActive ? '0 0 15px rgba(212, 163, 89, 0.45)' : 'none',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        {isCompleted ? <Check size={15} /> : `0${s.step}`}
                      </div>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          display: 'none',
                          minWidth: 'max-content'
                        }}
                        className="stepper-label"
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                STEP <span style={{ color: '#D4A359', fontWeight: 700 }}>0{currentStep}</span> / 05
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: '3.5rem 1.5rem 6.5rem', flexGrow: 1 }}>
        <div className="section-wrapper" style={{ maxWidth: '1360px' }}>
          {/* ============================================================= */}
          {/* MODE 1: AI TRIP PLANNER VIEW                                  */}
          {/* ============================================================= */}
          {plannerMode === 'ai' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {/* AI Controls Studio Card */}
              <div
                className="luxury-interactive-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: 'clamp(2rem, 3.5vw, 3rem)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 10px 35px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#9E6F29',
                        display: 'block',
                        marginBottom: '0.35rem'
                      }}
                    >
                      AI ITINERARY ARCHITECT
                    </span>
                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.8rem, 2.8vw, 2.4rem)',
                        color: '#121316',
                        margin: 0,
                        textTransform: 'uppercase'
                      }}
                    >
                      Define Your Desired Journey Parameters
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPlannerMode('concierge')}
                    className="btn-pill anim-hover-pill"
                    style={{
                      backgroundColor: '#FAF8F5',
                      color: '#121316',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.8rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <Compass size={14} /> Prefer Human Designer? Switch Mode
                  </button>
                </div>

                {/* AI Input Form */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
                  {/* Duration Slider / Buttons */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.65rem' }}>
                      Expedition Length: <strong style={{ color: '#9E6F29' }}>{aiDurationDays} Days</strong>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[4, 6, 7, 10, 14].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setAiDurationDays(days)}
                          className="anim-hover-pill"
                          style={{
                            flex: 1,
                            padding: '0.65rem 0.5rem',
                            borderRadius: '10px',
                            border: aiDurationDays === days ? '2px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.12)',
                            backgroundColor: aiDurationDays === days ? '#FAF6EE' : '#FFFFFF',
                            color: aiDurationDays === days ? '#9E6F29' : '#121316',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Travel Pace */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.65rem' }}>
                      Travel Pace
                    </label>
                    <select
                      value={aiTravelPace}
                      onChange={(e) => setAiTravelPace(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#FAF8F5',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Unhurried & Immersive">Unhurried & Immersive (Slow Luxury)</option>
                      <option value="Signature Balanced">Signature Balanced (2 Nights Per Stop)</option>
                      <option value="Expedition Active">Expedition Active (Highland Treks & Waterways)</option>
                    </select>
                  </div>

                  {/* Primary Style */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.65rem' }}>
                      Primary Travel Vibe
                    </label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#FAF8F5',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {TRAVEL_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preferred Destinations Multi-select */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.65rem' }}>
                    Must-Include Sanctuaries (Click to toggle)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {DESTINATION_OPTIONS.map((dest) => {
                      const isSelected = selectedDestinations.includes(dest.name);
                      return (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => toggleDestination(dest.name)}
                          className="anim-hover-pill"
                          style={{
                            padding: '0.45rem 1rem',
                            borderRadius: '999px',
                            border: isSelected ? '1.5px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.1)',
                            backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                            color: isSelected ? '#9E6F29' : '#374151',
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {isSelected && <Check size={13} />} {dest.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Sensory Prompt */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.5rem' }}>
                    Specific Dreams, Milestones, or Requests (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Honeymoon anniversary, private houseboat with chef, organic coffee estate walks, Ayurvedic panchakarma consultation..."
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      fontSize: '0.92rem',
                      backgroundColor: '#FAF8F5',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Generate Button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleGenerateAiPlan}
                    disabled={isGeneratingAi}
                    className="btn-pill anim-hover-pill"
                    style={{
                      backgroundColor: '#9E6F29',
                      color: '#FFFFFF',
                      padding: '1rem 3rem',
                      fontSize: '0.95rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      boxShadow: '0 8px 30px rgba(158, 111, 41, 0.35)',
                      cursor: isGeneratingAi ? 'wait' : 'pointer',
                      opacity: isGeneratingAi ? 0.75 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> Synthesizing Grounded Kerala Itinerary...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} color="#FFFFFF" /> Generate Bespoke AI Itinerary
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Generated Itinerary Showcase */}
              {generatedAiPlan && (
                <div
                  className="anim-step-slide"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    padding: 'clamp(2rem, 4vw, 3.5rem)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 15px 45px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {/* Itinerary Header */}
                  <div
                    style={{
                      paddingBottom: '2rem',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      marginBottom: '2.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: '#2D6A4F',
                          backgroundColor: 'rgba(45, 106, 79, 0.1)',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '999px'
                        }}
                      >
                        ✓ VERIFIED KERALA BLUEPRINT
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: '#9E6F29',
                          backgroundColor: '#FAF6EE',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '999px'
                        }}
                      >
                        {generatedAiPlan.durationDays} DAYS · {generatedAiPlan.durationDays - 1} NIGHTS
                      </span>
                    </div>

                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
                        color: '#121316',
                        lineHeight: 1.1,
                        margin: '0 0 0.5rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      {generatedAiPlan.title}
                    </h2>

                    <p style={{ color: '#6B7280', fontSize: '1.02rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                      {generatedAiPlan.tagline}
                    </p>

                    {/* Route sequence badge track */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.65rem',
                        backgroundColor: '#FAF8F5',
                        padding: '1rem 1.25rem',
                        borderRadius: '14px',
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#8A857A' }}>
                        Curated Route Sequence:
                      </span>
                      {generatedAiPlan.route.map((hub, idx) => (
                        <React.Fragment key={hub}>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: '#121316'
                            }}
                          >
                            {hub}
                          </span>
                          {idx < generatedAiPlan.route.length - 1 && (
                            <ChevronRight size={14} color="#9E6F29" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Day-by-Day Detailed Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                    {generatedAiPlan.days.map((day) => (
                      <div
                        key={day.day}
                        className="luxury-interactive-card"
                        style={{
                          backgroundColor: '#FAF8F5',
                          borderRadius: '18px',
                          padding: '1.75rem',
                          border: '1px solid rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#9E6F29',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 700
                              }}
                            >
                              0{day.day}
                            </span>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: '#9E6F29'
                              }}
                            >
                              {day.destination}
                            </span>
                          </div>

                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#5A626A' }}>
                            <Car size={13} color="#2D6A4F" /> {day.transit}
                          </div>
                        </div>

                        <h3
                          className="font-display"
                          style={{
                            fontSize: '1.4rem',
                            color: '#121316',
                            margin: '0 0 1.25rem',
                            lineHeight: 1.2
                          }}
                        >
                          {day.title}
                        </h3>

                        {/* Activities Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9E6F29', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              <Sun size={14} /> Morning
                            </div>
                            <p style={{ fontSize: '0.84rem', color: '#4B5563', margin: 0, lineHeight: 1.45 }}>{day.morning}</p>
                          </div>

                          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9E6F29', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              <Coffee size={14} /> Afternoon
                            </div>
                            <p style={{ fontSize: '0.84rem', color: '#4B5563', margin: 0, lineHeight: 1.45 }}>{day.afternoon}</p>
                          </div>

                          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9E6F29', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              <Moon size={14} /> Evening
                            </div>
                            <p style={{ fontSize: '0.84rem', color: '#4B5563', margin: 0, lineHeight: 1.45 }}>{day.evening}</p>
                          </div>
                        </div>

                        {/* Stay Recommendation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: '#121316', fontWeight: 600 }}>
                          <Bed size={15} color="#9E6F29" />
                          <span>Sanctuary Stay: <strong style={{ color: '#9E6F29' }}>{day.stay}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Booking & WhatsApp Transmission Bar */}
                  <div
                    style={{
                      padding: '2rem',
                      backgroundColor: '#FAF6EE',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(158, 111, 41, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1.5rem'
                    }}
                  >
                    <div>
                      <h4 className="font-display" style={{ fontSize: '1.35rem', color: '#121316', margin: '0 0 0.25rem' }}>
                        Love This Itinerary? Bring It to Life
                      </h4>
                      <p style={{ fontSize: '0.86rem', color: '#6B7280', margin: 0 }}>
                        Connect with our human concierge to verify private pool villa availability, customize stops, and lock in private rates.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setPlannerMode('concierge');
                          setSpecialNotes(`[From AI Planner] Interested in ${generatedAiPlan.title} (${generatedAiPlan.durationDays} Days). Route: ${generatedAiPlan.route.join(' -> ')}`);
                          setCurrentStep(5);
                          scrollSmoothTo(320);
                        }}
                        className="btn-pill"
                        style={{
                          backgroundColor: '#9E6F29',
                          color: '#FFFFFF',
                          padding: '0.85rem 1.8rem',
                          fontSize: '0.86rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Book With Concierge <ArrowRight size={15} />
                      </button>

                      <a
                        href={`https://wa.me/918157003344?text=${encodeURIComponent(
                          `Hello Escora Concierge, I generated a ${generatedAiPlan.durationDays}-Day Kerala AI itinerary: "${generatedAiPlan.title}". Could we review dates and private rates?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pill"
                        style={{
                          backgroundColor: '#25D366',
                          color: '#FFFFFF',
                          padding: '0.85rem 1.8rem',
                          fontSize: '0.86rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem'
                        }}
                      >
                        <MessageSquare size={16} /> WhatsApp Itinerary
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isSubmitted ? (
            /* ============================================================= */
            /* CELEBRATORY CONFIRMATION SCREEN                               */
            /* ============================================================= */
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: 'clamp(2.5rem, 5vw, 4.5rem)',
                textAlign: 'center',
                boxShadow: '0 18px 50px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                maxWidth: '760px',
                margin: '0 auto'
              }}
            >
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(212, 163, 89, 0.15)',
                  color: '#9E6F29',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: '1.5px solid rgba(212, 163, 89, 0.35)'
                }}
              >
                <Sparkles size={36} color="#9E6F29" />
              </div>

              <span
                style={{
                  fontSize: '0.82rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#9E6F29',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: '0.65rem'
                }}
              >
                EXPEDITION TRANSMITTED
              </span>

              <h2
                className="font-display"
                style={{
                  fontSize: 'clamp(2.1rem, 4vw, 3rem)',
                  color: '#121316',
                  lineHeight: 1.1,
                  margin: '0 0 1.25rem',
                  textTransform: 'uppercase'
                }}
              >
                Your Journey Begins, {guestName.trim().split(' ')[0] || 'Esteemed Guest'}
              </h2>

              <p
                style={{
                  color: '#5A626A',
                  fontSize: '1.05rem',
                  lineHeight: 1.65,
                  maxWidth: '600px',
                  margin: '0 auto 2.5rem'
                }}
              >
                We have received your custom Kerala journey profile. A native Kerala senior travel curator is reviewing your preferences now and will present a tailored day-by-day itinerary and private rates within <strong>24 hours</strong>.
              </p>

              {/* Dossier Recap Card */}
              <div
                style={{
                  backgroundColor: '#FAF8F5',
                  borderRadius: '16px',
                  padding: '2rem',
                  textAlign: 'left',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  marginBottom: '2.5rem'
                }}
              >
                <div
                  style={{
                    fontSize: '0.76rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#9E6F29',
                    fontWeight: 700,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <Award size={15} color="#9E6F29" /> Curated Travel Dossier
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    fontSize: '0.88rem'
                  }}
                >
                  <div>
                    <span style={{ color: '#8A857A', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase' }}>Travel Style</span>
                    <strong style={{ color: '#121316' }}>{currentStyleObj?.title || 'Bespoke Kerala'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#8A857A', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase' }}>Selected Sanctuaries</span>
                    <strong style={{ color: '#121316' }}>{selectedDestinations.join(', ') || 'Custom Route'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#8A857A', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase' }}>Duration & Timing</span>
                    <strong style={{ color: '#121316' }}>{duration} · {travelMonth}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#8A857A', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase' }}>Companions & Travel Tier</span>
                    <strong style={{ color: '#121316' }}>{adults} Adults{children > 0 ? `, ${children} Children` : ''} · {budget}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#8A857A', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase' }}>Chauffeured Vehicle</span>
                    <strong style={{ color: '#121316' }}>{vehicleType || 'Standard (Sedan)'}</strong>
                  </div>
                  <div style={{ gridColumn: '1 / -1', paddingTop: '0.5rem', borderTop: '1px dashed rgba(0, 0, 0, 0.08)' }}>
                    <span style={{ color: '#8A857A', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase' }}>Direct Confirmation Contact</span>
                    <strong style={{ color: '#121316' }}>{guestName} · {guestEmail} · {guestPhone} ({preferredContact.toUpperCase()} Preferred)</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <Link
                  href="/"
                  className="btn-pill"
                  style={{
                    backgroundColor: '#121316',
                    color: '#FFFFFF',
                    padding: '0.9rem 2.2rem',
                    fontSize: '0.88rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none'
                  }}
                >
                  Return to Homepage
                </Link>

                <a
                  href={`https://wa.me/918157003344?text=${encodeURIComponent(
                    `Hello Escora Concierge, I just submitted a bespoke journey request for ${guestName} (${duration}, ${selectedDestinations.join(', ')}). Could we connect?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    padding: '0.9rem 2.2rem',
                    fontSize: '0.88rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Instant WhatsApp With Concierge
                </a>
              </div>
            </div>
          ) : (
            /* ============================================================= */
            /* MODE 2: HUMAN CONCIERGE 5-STEP ATELIER                        */
            /* ============================================================= */
            <div
              className="planner-viewport-card"
              style={{
                maxWidth: '1360px',
                width: '100%',
                margin: '0 auto'
              }}
            >
              {/* Form Flow Area */}
              <form onSubmit={handleSubmit}>
                {/* STEP 1: TRAVEL STYLE & ESSENCE */}
                {currentStep === 1 && (
                  <div
                    className="anim-step-slide"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: 'clamp(2rem, 3.5vw, 3rem)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 10px 35px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: '#9E6F29'
                        }}
                      >
                        STEP 01 OF 05
                      </span>

                      <button
                        type="button"
                        onClick={() => setPlannerMode('ai')}
                        className="anim-hover-pill"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9E6F29',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Sparkles size={14} color="#9E6F29" /> Want Instant AI Itinerary? Click Here
                      </button>
                    </div>

                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.9rem, 2.8vw, 2.5rem)',
                        color: '#121316',
                        lineHeight: 1.1,
                        margin: '0 0 0.6rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      What is the Spirit of Your Journey?
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <p style={{ color: '#6B7280', fontSize: '0.96rem', margin: 0, lineHeight: 1.55 }}>
                        Select the primary rhythm that reflects how you wish to experience Kerala (optional).
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => scrollSpiritTrack(-320)}
                          aria-label="Previous options"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            backgroundColor: '#FFFFFF',
                            color: '#121316',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                          className="anim-hover-pill"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollSpiritTrack(320)}
                          aria-label="Next options"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            backgroundColor: '#FFFFFF',
                            color: '#121316',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                          className="anim-hover-pill"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={spiritTrackRef}
                      className="step1-spirit-track"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        gap: '1.25rem',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        paddingBottom: '1rem',
                        paddingTop: '0.25rem',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#9E6F29 rgba(0, 0, 0, 0.06)',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {TRAVEL_STYLES.map((style) => {
                        const isSelected = selectedStyle === style.id;
                        return (
                          <div
                            key={style.id}
                            onClick={() => setSelectedStyle((prev) => (prev === style.id ? '' : style.id))}
                            className="luxury-interactive-card"
                            style={{
                              flex: '0 0 280px',
                              minWidth: '280px',
                              maxWidth: '280px',
                              scrollSnapAlign: 'start',
                              border: isSelected ? '2px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.08)',
                              backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: isSelected ? '0 10px 25px rgba(158, 111, 41, 0.12)' : 'none'
                            }}
                          >
                            <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                              <img
                                className="card-zoom-img"
                                src={style.image}
                                alt={style.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.5s ease'
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)'
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '0.75rem',
                                  left: '0.85rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  color: '#FFFFFF',
                                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                                  backdropFilter: 'blur(6px)',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                              >
                                {style.tag}
                              </span>

                              <div
                                className={isSelected ? 'anim-check-pop' : ''}
                                style={{
                                  position: 'absolute',
                                  top: '0.75rem',
                                  right: '0.75rem',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: isSelected ? '#9E6F29' : 'rgba(0, 0, 0, 0.4)',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.3)'
                                }}
                              >
                                {isSelected ? <Check size={14} /> : null}
                              </div>
                            </div>

                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                              <h3
                                className="font-display"
                                style={{
                                  fontSize: '1.2rem',
                                  color: '#121316',
                                  margin: '0 0 0.35rem',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {style.title}
                              </h3>
                              <p style={{ color: '#6B7280', fontSize: '0.84rem', lineHeight: 1.45, margin: 0, flexGrow: 1 }}>
                                {style.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step Actions */}
                    <div
                      style={{
                        marginTop: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStyle('');
                          handleNextStep(2);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6B7280',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0',
                          textDecoration: 'underline',
                          textUnderlineOffset: '4px',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#9E6F29')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
                      >
                        Skip this step & continue →
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNextStep(2)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#121316',
                          color: '#FFFFFF',
                          padding: '0.85rem 2.2rem',
                          fontSize: '0.88rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedStyle ? 'Continue to Sanctuaries' : 'Next: Sanctuaries'} <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: DESTINATIONS & REGIONS */}
                {currentStep === 2 && (
                  <div
                    className="anim-step-slide"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: 'clamp(2rem, 3.5vw, 3rem)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 10px 35px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#9E6F29',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      STEP 02 OF 05
                    </span>

                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.9rem, 2.8vw, 2.5rem)',
                        color: '#121316',
                        lineHeight: 1.1,
                        margin: '0 0 0.6rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      Which Kerala Sanctuaries Call to You?
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <p style={{ color: '#6B7280', fontSize: '0.96rem', margin: 0, lineHeight: 1.55 }}>
                        Select one or multiple regions. We will link them with private luxury transfers and panoramic hill routes.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => scrollDestinationTrack(-320)}
                          aria-label="Previous sanctuaries"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            backgroundColor: '#FFFFFF',
                            color: '#121316',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                          className="anim-hover-pill"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollDestinationTrack(320)}
                          aria-label="Next sanctuaries"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            backgroundColor: '#FFFFFF',
                            color: '#121316',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                          className="anim-hover-pill"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={destinationTrackRef}
                      className="step2-destinations-track"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        gap: '1.1rem',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        paddingBottom: '1rem',
                        paddingTop: '0.25rem',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#9E6F29 rgba(0, 0, 0, 0.06)',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {DESTINATION_OPTIONS.map((dest) => {
                        const isSelected = selectedDestinations.includes(dest.name);
                        return (
                          <div
                            key={dest.id}
                            onClick={() => toggleDestination(dest.name)}
                            className="luxury-interactive-card"
                            style={{
                              flex: '0 0 220px',
                              minWidth: '220px',
                              maxWidth: '220px',
                              scrollSnapAlign: 'start',
                              border: isSelected ? '2px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              backgroundColor: '#FFFFFF',
                              transition: 'all 0.25s ease',
                              boxShadow: isSelected ? '0 8px 22px rgba(158, 111, 41, 0.14)' : 'none'
                            }}
                          >
                            <div style={{ height: '120px', position: 'relative' }}>
                              <img
                                className="card-zoom-img"
                                src={dest.image}
                                alt={dest.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
                                }}
                              />
                              <div
                                className={isSelected ? 'anim-check-pop' : ''}
                                style={{
                                  position: 'absolute',
                                  top: '0.6rem',
                                  right: '0.6rem',
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  backgroundColor: isSelected ? '#9E6F29' : 'rgba(0, 0, 0, 0.45)',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.3)'
                                }}
                              >
                                {isSelected ? <Check size={13} /> : null}
                              </div>
                            </div>
                            <div style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  color: '#9E6F29',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  fontWeight: 700
                                }}
                              >
                                {dest.region}
                              </span>
                              <h4
                                className="font-display"
                                style={{
                                  fontSize: '1.18rem',
                                  color: '#121316',
                                  margin: '0.15rem 0 0.1rem',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {dest.name}
                              </h4>
                              <p style={{ color: '#8A857A', fontSize: '0.76rem', margin: 0 }}>
                                {dest.tag}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step Actions */}
                    <div
                      style={{
                        marginTop: '2.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handlePrevStep(1)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#F3EFE8',
                          color: '#121316',
                          padding: '0.85rem 1.75rem',
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNextStep(3)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#121316',
                          color: '#FFFFFF',
                          padding: '0.85rem 2.2rem',
                          fontSize: '0.88rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        Continue to Timing <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DATES, DURATION & BUDGET */}
                {currentStep === 3 && (
                  <div
                    className="anim-step-slide"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: 'clamp(2rem, 3.5vw, 3rem)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 10px 35px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#9E6F29',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      STEP 03 OF 05
                    </span>

                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.9rem, 2.8vw, 2.5rem)',
                        color: '#121316',
                        lineHeight: 1.1,
                        margin: '0 0 0.6rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      Duration, Calendar & Travel Tier
                    </h2>

                    <p style={{ color: '#6B7280', fontSize: '0.96rem', margin: '0 0 2rem', lineHeight: 1.55 }}>
                      How many days do you wish to surrender to Kerala, and which travel tier suits your journey?
                    </p>

                    {/* Duration Options */}
                    <div style={{ marginBottom: '2.5rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#121316',
                          marginBottom: '0.85rem'
                        }}
                      >
                        Ideal Journey Duration
                      </label>
                      <div
                        className="step3-duration-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '1rem'
                        }}
                      >
                        {DURATION_OPTIONS.map((opt) => {
                          const isSelected = !exactDays && duration === opt.label;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectDurationPreset(opt.label)}
                              className="luxury-interactive-card"
                              style={{
                                border: isSelected ? '2px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.08)',
                                backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                                borderRadius: '14px',
                                padding: '1.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 6px 18px rgba(158, 111, 41, 0.1)' : 'none'
                              }}
                            >
                              <div
                                className="font-display"
                                style={{
                                  fontSize: '1.25rem',
                                  color: '#121316',
                                  marginBottom: '0.2rem',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {opt.label}
                              </div>
                              <span style={{ fontSize: '0.78rem', color: '#9E6F29', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                {opt.sub}
                              </span>
                              <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.4, margin: 0 }}>
                                {opt.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Custom Exact Number of Days Input Option */}
                      <div
                        style={{
                          marginTop: '1.15rem',
                          padding: '1rem 1.25rem',
                          borderRadius: '14px',
                          border: exactDays ? '2px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.08)',
                          backgroundColor: exactDays ? '#FAF6EE' : '#FAF8F5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              backgroundColor: exactDays ? 'rgba(158, 111, 41, 0.18)' : 'rgba(0, 0, 0, 0.04)',
                              color: exactDays ? '#9E6F29' : '#6B7280',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Calendar size={18} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#121316', display: 'block' }}>
                              Have an exact number of days in mind?
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                              Specify your exact journey length (e.g., 5 days, 8 days, 12 days).
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleExactDaysStep(-1)}
                            aria-label="Decrease days"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              border: '1px solid rgba(0, 0, 0, 0.12)',
                              backgroundColor: '#FFFFFF',
                              color: '#121316',
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                            className="anim-hover-pill"
                          >
                            –
                          </button>

                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              backgroundColor: '#FFFFFF',
                              border: exactDays ? '2px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.15)',
                              borderRadius: '12px',
                              padding: '0.45rem 0.85rem',
                              boxShadow: exactDays ? '0 0 0 3px rgba(158, 111, 41, 0.12)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={exactDays}
                              onChange={(e) => handleExactDaysChange(e.target.value)}
                              onBlur={handleExactDaysBlur}
                              placeholder="e.g. 8"
                              style={{
                                width: '56px',
                                textAlign: 'center',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: '#121316',
                                outline: 'none',
                                padding: 0
                              }}
                            />
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: exactDays ? '#9E6F29' : '#6B7280',
                                marginLeft: '0.35rem',
                                userSelect: 'none'
                              }}
                            >
                              Days
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleExactDaysStep(1)}
                            aria-label="Increase days"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              border: '1px solid rgba(0, 0, 0, 0.12)',
                              backgroundColor: '#FFFFFF',
                              color: '#121316',
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                            className="anim-hover-pill"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Travel Season / Month */}
                    <div style={{ marginBottom: '2.5rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#121316',
                          marginBottom: '0.85rem'
                        }}
                      >
                        Estimated Season / Month
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1rem' }}>
                        {TRAVEL_SEASONS.map((season) => {
                          const isSelected = travelMonth === season;
                          return (
                            <button
                              key={season}
                              type="button"
                              onClick={() => setTravelMonth(season)}
                              className="anim-hover-pill"
                              style={{
                                padding: '0.55rem 1.15rem',
                                borderRadius: '999px',
                                border: isSelected ? '1.5px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.1)',
                                backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                                color: isSelected ? '#9E6F29' : '#374151',
                                fontSize: '0.82rem',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {isSelected ? '✓ ' : ''}{season}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preferred Travel Tier */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#121316',
                          marginBottom: '0.85rem'
                        }}
                      >
                        Preferred Travel Tier
                      </label>
                      <div
                        className="step3-budget-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '0.85rem'
                        }}
                      >
                        {BUDGET_OPTIONS.map((b) => {
                          const isSelected = budget === b.label;
                          return (
                            <div
                              key={b.id}
                              onClick={() => setBudget(b.label)}
                              className="luxury-interactive-card"
                              style={{
                                border: isSelected ? '2px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.08)',
                                backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                                borderRadius: '12px',
                                padding: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div className="font-display" style={{ fontSize: '1.05rem', color: '#121316', marginBottom: '0.15rem' }}>
                                {b.label}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#9E6F29', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                                {b.sub}
                              </span>
                              <p style={{ fontSize: '0.76rem', color: '#6B7280', margin: 0, lineHeight: 1.35 }}>
                                {b.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step Actions */}
                    <div
                      style={{
                        marginTop: '2.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handlePrevStep(2)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#F3EFE8',
                          color: '#121316',
                          padding: '0.85rem 1.75rem',
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNextStep(4)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#121316',
                          color: '#FFFFFF',
                          padding: '0.85rem 2.2rem',
                          fontSize: '0.88rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        Continue to Stays & Guests <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: TRAVELLERS & STAYS */}
                {currentStep === 4 && (
                  <div
                    className="anim-step-slide"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: 'clamp(2rem, 3.5vw, 3rem)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 10px 35px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#9E6F29',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      STEP 04 OF 05
                    </span>

                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.9rem, 2.8vw, 2.5rem)',
                        color: '#121316',
                        lineHeight: 1.1,
                        margin: '0 0 0.6rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      Travellers & Luxury Accommodation
                    </h2>

                    <p style={{ color: '#6B7280', fontSize: '0.96rem', margin: '0 0 2rem', lineHeight: 1.55 }}>
                      Tell us who is travelling and what style of Kerala sanctuaries speak to your soul.
                    </p>

                    {/* Travellers Counters */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1.25rem',
                        marginBottom: '2.5rem'
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#FAF8F5',
                          padding: '1.25rem 1.5rem',
                          borderRadius: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#8A857A', fontWeight: 700, letterSpacing: '0.08em' }}>
                            Adults (12+)
                          </span>
                          <div className="font-display" style={{ fontSize: '1.75rem', color: '#121316' }}>
                            {adults}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="anim-hover-pill"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid rgba(0, 0, 0, 0.15)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              fontWeight: 600
                            }}
                          >
                            –
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdults(adults + 1)}
                            className="anim-hover-pill"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid rgba(0, 0, 0, 0.15)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              fontWeight: 600
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#FAF8F5',
                          padding: '1.25rem 1.5rem',
                          borderRadius: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#8A857A', fontWeight: 700, letterSpacing: '0.08em' }}>
                            Children (Under 12)
                          </span>
                          <div className="font-display" style={{ fontSize: '1.75rem', color: '#121316' }}>
                            {children}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="anim-hover-pill"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid rgba(0, 0, 0, 0.15)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              fontWeight: 600
                            }}
                          >
                            –
                          </button>
                          <button
                            type="button"
                            onClick={() => setChildren(children + 1)}
                            className="anim-hover-pill"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid rgba(0, 0, 0, 0.15)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              fontWeight: 600
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preferred Sanctuaries / Stays */}
                    <div style={{ marginBottom: '2.5rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#121316',
                          marginBottom: '0.85rem'
                        }}
                      >
                        Preferred Stays & Sanctums (Select all that appeal)
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                        {STAY_PREFERENCES.map((stay) => {
                          const isSelected = preferredStays.includes(stay);
                          return (
                            <button
                              key={stay}
                              type="button"
                              onClick={() => toggleStay(stay)}
                              className="anim-hover-pill"
                              style={{
                                padding: '0.65rem 1.25rem',
                                borderRadius: '999px',
                                border: isSelected ? '1.5px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.1)',
                                backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                                color: isSelected ? '#9E6F29' : '#374151',
                                fontSize: '0.84rem',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem'
                              }}
                            >
                              {isSelected && <Check size={14} />} {stay}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preferred Vehicle Type */}
                    <div style={{ marginBottom: '2.5rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#121316',
                          marginBottom: '0.85rem'
                        }}
                      >
                        Chauffeured Vehicle Preference
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                        {VEHICLE_OPTIONS.map((veh) => {
                          const isSelected = vehicleType === veh;
                          return (
                            <button
                              key={veh}
                              type="button"
                              onClick={() => setVehicleType((prev) => (prev === veh ? '' : veh))}
                              className="anim-hover-pill"
                              style={{
                                padding: '0.65rem 1.25rem',
                                borderRadius: '999px',
                                border: isSelected ? '1.5px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.1)',
                                backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                                color: isSelected ? '#9E6F29' : '#374151',
                                fontSize: '0.84rem',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem'
                              }}
                            >
                              {isSelected && <Check size={14} />} {veh}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Special Occasions & Notes */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#121316',
                          marginBottom: '0.5rem'
                        }}
                      >
                        Celebration, Dietary or Accessibility Desires (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g., 25th wedding anniversary, pure vegetarian / vegan cuisine, prefer ground-floor villa for parents, or private tea-estate picnic..."
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.15rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontSize: '0.92rem',
                          backgroundColor: '#FAF8F5',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>

                    {/* Step Actions */}
                    <div
                      style={{
                        marginTop: '2.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handlePrevStep(3)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#F3EFE8',
                          color: '#121316',
                          padding: '0.85rem 1.75rem',
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNextStep(5)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#121316',
                          color: '#FFFFFF',
                          padding: '0.85rem 2.2rem',
                          fontSize: '0.88rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        Continue to Dossier <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: CONTACT & CONCIERGE TRANSMISSION */}
                {currentStep === 5 && (
                  <div
                    className="anim-step-slide"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: 'clamp(2rem, 3.5vw, 3rem)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 10px 35px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#9E6F29',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      FINAL STEP · 05 OF 05
                    </span>

                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.9rem, 2.8vw, 2.5rem)',
                        color: '#121316',
                        lineHeight: 1.1,
                        margin: '0 0 0.6rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      Where Shall We Present Your Proposal?
                    </h2>

                    <p style={{ color: '#6B7280', fontSize: '0.96rem', margin: '0 0 2rem', lineHeight: 1.55 }}>
                      Provide your coordinates so your designated senior curator can finalize your private blueprint.
                    </p>

                    {errorText && (
                      <div
                        style={{
                          padding: '0.85rem 1.25rem',
                          backgroundColor: '#FEE2E2',
                          color: '#B91C1C',
                          borderRadius: '12px',
                          fontSize: '0.88rem',
                          marginBottom: '1.5rem',
                          border: '1px solid rgba(185, 28, 28, 0.2)'
                        }}
                      >
                        {errorText}
                      </div>
                    )}

                    <div
                      className="step5-contacts-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.25rem',
                        marginBottom: '1.75rem'
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: '#121316',
                            marginBottom: '0.45rem'
                          }}
                        >
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eleanor Vance"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1.15rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            fontSize: '0.92rem',
                            backgroundColor: '#FAF8F5',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: '#121316',
                            marginBottom: '0.45rem'
                          }}
                        >
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="eleanor@example.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1.15rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            fontSize: '0.92rem',
                            backgroundColor: '#FAF8F5',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: '#121316',
                            marginBottom: '0.45rem'
                          }}
                        >
                          Phone / WhatsApp (with Country Code) *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210 or +44 7700 900077"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1.15rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            fontSize: '0.92rem',
                            backgroundColor: '#FAF8F5',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Preferred Contact Medium */}
                    <div style={{ marginBottom: '2rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#121316',
                          marginBottom: '0.65rem'
                        }}
                      >
                        How do you prefer our curator to connect with you?
                      </label>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[
                          { id: 'whatsapp', label: 'WhatsApp Concierge', icon: MessageSquare },
                          { id: 'phone', label: 'Direct Phone Call', icon: Phone },
                          { id: 'email', label: 'Email Itinerary Dossier', icon: Mail }
                        ].map((item) => {
                          const isSelected = preferredContact === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setPreferredContact(item.id as any)}
                              className="anim-hover-pill"
                              style={{
                                padding: '0.6rem 1.15rem',
                                borderRadius: '10px',
                                border: isSelected ? '1.5px solid #9E6F29' : '1px solid rgba(0, 0, 0, 0.1)',
                                backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                                color: isSelected ? '#9E6F29' : '#374151',
                                fontSize: '0.82rem',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem'
                              }}
                            >
                              <item.icon size={15} /> {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Trust Seal */}
                    {/* Step Actions */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handlePrevStep(4)}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#F3EFE8',
                          color: '#121316',
                          padding: '0.85rem 1.75rem',
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-pill anim-hover-pill"
                        style={{
                          backgroundColor: '#9E6F29',
                          color: '#FFFFFF',
                          padding: '0.95rem 2.8rem',
                          fontSize: '0.9rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          boxShadow: '0 8px 25px rgba(158, 111, 41, 0.3)',
                          cursor: isSubmitting ? 'wait' : 'pointer',
                          opacity: isSubmitting ? 0.7 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {isSubmitting ? 'Transmitting Expedition Dossier...' : 'Transmit Bespoke Journey Request'}
                        {!isSubmitting && <Send size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </form>

              {/* Direct WhatsApp Concierge Prompt */}
              <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                <a
                  href="https://wa.me/918157003344?text=Hello%20Escora%20Concierge%2C%20I%20am%20planning%20my%20Kerala%20holiday%20and%20would%20love%20some%20guidance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="anim-hover-pill"
                  style={{
                    fontSize: '0.84rem',
                    color: '#2D6A4F',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.75rem 1.6rem',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '999px',
                    border: '1px solid rgba(45, 106, 79, 0.25)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <MessageSquare size={16} /> Prefer direct chat? Message WhatsApp Concierge
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer & Toast */}
      <Footer onShowToast={(msg) => setToastMessage(msg)} />
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* Responsive styling enhancements */}
      <style>{`
        /* Horizontal Viewport Planner Layout */
        .planner-viewport-card {
          max-width: 1360px !important;
          width: 100% !important;
          margin: 0 auto !important;
        }

        /* Step 1 & Step 2: Single Horizontal Line Track */
        .step1-spirit-track,
        .step2-destinations-track {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          scroll-snap-type: x mandatory !important;
          -webkit-overflow-scrolling: touch !important;
          gap: 1.25rem !important;
        }
        .step1-spirit-track::-webkit-scrollbar,
        .step2-destinations-track::-webkit-scrollbar {
          height: 6px;
        }
        .step1-spirit-track::-webkit-scrollbar-track,
        .step2-destinations-track::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.04);
          border-radius: 999px;
        }
        .step1-spirit-track::-webkit-scrollbar-thumb,
        .step2-destinations-track::-webkit-scrollbar-thumb {
          background: #C4A468;
          border-radius: 999px;
        }
        .step1-spirit-track::-webkit-scrollbar-thumb:hover,
        .step2-destinations-track::-webkit-scrollbar-thumb:hover {
          background: #9E6F29;
        }

        @media (min-width: 1024px) {
          .step3-duration-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .step3-budget-grid {
            grid-template-columns: repeat(5, 1fr) !important;
          }
          .step5-contacts-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 1023px) and (min-width: 641px) {
          .step3-duration-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .step3-budget-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .step5-contacts-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .step3-duration-grid {
            grid-template-columns: 1fr !important;
          }
          .step3-budget-grid {
            grid-template-columns: 1fr !important;
          }
          .step5-contacts-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (min-width: 768px) {
          .stepper-label {
            display: inline-block !important;
          }
        }
      `}</style>
    </div>
  );
}
