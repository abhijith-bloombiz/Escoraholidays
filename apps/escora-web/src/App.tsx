import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyEscora from './components/WhyEscora';
import CuratedDispatch from './components/CuratedDispatch';
import KeralaHealing from './components/KeralaHealing';
import Testimonials from './components/Testimonials';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import EnquiryModal, { type EnquiryInitialData } from './components/EnquiryModal';
import ItineraryModal from './components/ItineraryModal';
import Toast from './components/Toast';
import type { TravelCategoryItem } from './data/escoraData';
import ItineraryShare from './pages/itinerary-share';
import DestinationsPage from './pages/destinations';
import DestinationDetailPage from './pages/destination-detail';
import ExperiencesPage from './pages/experiences';
import ExperienceDetailPage from './pages/experience-detail';
import PlanJourneyPage from './pages/plan';
import AboutPage from './pages/about';
import ContactPage from './pages/contact';
import AiChatBot from './components/AiChatBot';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

export function LandingPage() {
  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);
  const [enquiryInitialData, setEnquiryInitialData] = useState<EnquiryInitialData>({});
  const [selectedJourney, setSelectedJourney] = useState<TravelCategoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Pause background Lenis inertia when any modal is active
  useEffect(() => {
    const lenis = (window as any).lenis;
    if (enquiryOpen || Boolean(selectedJourney)) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
  }, [enquiryOpen, selectedJourney]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const openEnquiryWithData = (data: EnquiryInitialData = {}) => {
    setEnquiryInitialData(data);
    setEnquiryOpen(true);
  };

  const handleBookTour = (tour: TravelCategoryItem) => {
    openEnquiryWithData({
      destination: tour.dest,
      experience: tour.title,
      duration: tour.days
    });
  };

  return (
    <div className="escora-app" style={{ minHeight: '100vh', backgroundColor: '#F8F6F1' }}>
      {/* Fixed / Floating Top Navbar */}
      <Navbar onOpenEnquiry={() => openEnquiryWithData()} />

      <main>
        {/* Section 1 & 2 — Cinematic Hero, Destination Sanctuaries & Fullscreen Expansion */}
        <Hero
          onOpenEnquiry={(data?: Record<string, any>) => openEnquiryWithData(data)}
          onSelectFilter={(data?: Record<string, any>) => openEnquiryWithData(data)}
        />

        {/* Section 2 — Why ESCORA (The Luxury Promise & 4 Trust Pillars) */}
        <WhyEscora onOpenEnquiry={(data) => openEnquiryWithData(data)} />

        {/* Section 3 — The Art of Kerala Healing (Classical Ayurveda, Yoga & Wellness Heritage) */}
        <KeralaHealing
          onOpenEnquiry={() => openEnquiryWithData()}
        />

        {/* Section 7 — How It Works (6-Step Bespoke Concierge Planning Process) */}
        <HowItWorks
          onOpenEnquiry={(data) => openEnquiryWithData(data)}
        />

        {/* Section 8 — Traveller Testimonials (What Our Travelers Say - Social Proof after How It Works) */}
        <Testimonials />

        {/* Section 9 — Curated Kerala Travel Inspiration & Dispatch (Seasonal Stories & Newsletter) */}
        <CuratedDispatch
          onShowToast={showToast}
        />

        {/* Section 10 — Contact & Consultation (On-Page Concierge Desk & Bespoke Travel Form) */}
        <ContactSection
          onShowToast={showToast}
          onOpenEnquiry={(data) => openEnquiryWithData(data)}
        />
      </main>

      {/* Section 11 — Large Dark Photographic Footer */}
      <Footer
        onShowToast={showToast}
        onOpenEnquiry={() => openEnquiryWithData()}
      />

      {/* Interactive Modals */}
      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        initialData={enquiryInitialData}
        onShowToast={showToast}
      />

      <ItineraryModal
        isOpen={Boolean(selectedJourney)}
        onClose={() => setSelectedJourney(null)}
        journey={selectedJourney}
        onBookThisTour={handleBookTour}
      />

      {/* Feedback Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true });
      requestAnimationFrame(() => {
        lenis.resize();
      });
      setTimeout(() => {
        lenis.resize();
      }, 150);
    }
  }, [location]);

  return null;
}

export default function App() {
  // Global Lenis Smooth Scrolling Engine across all pages
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Silky exponential ease-out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
      infinite: false,
    });

    (window as any).lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Buttery smooth glide for in-page anchor links (e.g., #destinations, #experiences)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target ? target.closest('a[href^="#"]') : null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.length > 1) {
        const targetEl = document.querySelector<HTMLElement>(href);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, { offset: -65, duration: 1.35 });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>
        <ScrollToTop />
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/destinations" component={DestinationsPage} />
          <Route path="/destinations/:slug">
            {(params) => <DestinationDetailPage slug={params.slug} key={params.slug} />}
          </Route>
          <Route path="/experiences" component={ExperiencesPage} />
          <Route path="/experiences/:slug">
            {(params) => <ExperienceDetailPage slug={params.slug} key={params.slug} />}
          </Route>
          <Route path="/plan" component={PlanJourneyPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/itinerary/:token">
            {(params) => <ItineraryShare mode="itinerary" key={params.token} />}
          </Route>
          <Route path="/package/:token">
            {(params) => <ItineraryShare mode="package" key={params.token} />}
          </Route>
          <Route component={LandingPage} />
        </Switch>

        {/* Floating AI Chat Bot Button on the Right Bottom Corner */}
        <AiChatBot />
      </WouterRouter>
    </QueryClientProvider>
  );
}
