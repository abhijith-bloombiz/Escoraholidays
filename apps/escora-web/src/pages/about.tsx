import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Compass,
  Sparkles,
  ShieldCheck,
  Heart,
  Users,
  Award,
  Clock,
  ArrowRight,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnquiryModal from '../components/EnquiryModal';
import Toast from '../components/Toast';
import HeroGradientBackground from '../components/HeroGradientBackground';
import { useScrollReveal, usePageScrollReveal } from '../hooks/useScrollAnimation';

export default function AboutPage() {
  usePageScrollReveal();

  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [philosophyRef, philosophyVisible] = useScrollReveal<HTMLElement>({ threshold: 0.12, reEnter: true });
  const [founderRef, founderVisible] = useScrollReveal<HTMLElement>({ threshold: 0.12, reEnter: true });
  const [pillarsRef, pillarsVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, reEnter: true });
  const [milestonesRef, milestonesVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15, reEnter: true });
  const [ctaRef, ctaVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15, reEnter: true });

  return (
    <div className="anim-page-fade-in" style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', color: '#121316', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '11rem 2rem 6rem',
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        <HeroGradientBackground />

        <div className="section-wrapper" style={{ maxWidth: '940px', position: 'relative', zIndex: 2 }}>
          <div
            className="anim-hero-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.4rem 1.1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#D4A359',
              fontWeight: 600,
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Compass size={14} color="#D4A359" /> The Escora Story &amp; Standard
          </div>

          <h1
            className="font-display anim-hero-title"
            style={{
              fontSize: 'clamp(2.8rem, 6.5vw, 5rem)',
              letterSpacing: '0.04em',
              lineHeight: 1.05,
              marginBottom: '1.5rem',
              color: '#FFFFFF'
            }}
          >
            ROOTED IN KERALA. <br />
            <span style={{ color: '#D4A359' }}>BUILT FOR THE WORLD.</span>
          </h1>

          <p
            className="anim-hero-desc"
            style={{
              fontSize: 'clamp(1.05rem, 1.35vw, 1.25rem)',
              color: 'rgba(255, 255, 255, 0.78)',
              lineHeight: 1.7,
              maxWidth: '740px',
              margin: '0 auto 2.5rem'
            }}
          >
            We are not a mass-market tour operator. We are private journey designers, born of this land,
            dedicated to crafting unhurried encounters with Kerala’s finest landscapes, heritage, and healers.
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section ref={philosophyRef} style={{ padding: '6rem 0', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        <div className="section-wrapper">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '4.5rem',
              alignItems: 'center'
            }}
          >
            <div className="reveal-fade-left">
              <p className="reveal-fade-up" style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                OUR REASON FOR BEING
              </p>
              <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.8rem', color: '#121316', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                WHERE EVERY JOURNEY FEELS LIKE HOME
              </h2>
              <div className="reveal-fade-up stagger-2" style={{ fontSize: '1.02rem', color: '#4B5563', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p>
                  Kerala is often hailed as "God’s Own Country", yet so much of its magic remains hidden beneath cookie-cutter travel packages.
                  Mass tourism rushes travellers through crowded spots, missing the true quiet majesty of our land.
                </p>
                <p>
                  Escora was founded on a simple, uncompromising conviction: that discerning international travellers deserve
                  an authentic, deeply private encounter with Kerala. One where you wake up in 140-year-old colonial planter bungalows,
                  drift on silent Kettuvallams with private chefs, and experience healing guided by master Ayurvedic physicians.
                </p>
                <p>
                  We don’t sell pre-packaged bus tours. Every itinerary is composed by native Keralites who know every curve of the Western Ghats,
                  every backwater inlet, and every temple grove.
                </p>
              </div>
            </div>

            <div
              className="reveal-fade-right luxury-interactive-card"
              style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)', height: '480px' }}
            >
              <img
                src="/images/dest_3_munnar.jpg"
                alt="Munnar Tea Hills Kerala"
                className="card-zoom-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Founder & CEO Story */}
      <section ref={founderRef} style={{ padding: 'clamp(3.5rem, 6vw, 4.75rem) 0', backgroundColor: '#F8F6F1', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <div className="section-wrapper">
          <div className="about-founder-card luxury-interactive-card reveal-card">
            {/* Founder Image */}
            <div className="about-founder-image-col reveal-scale-up">
              <img
                src="/images/midhilaj-founder.jpg"
                alt="Midhilaj — Founder & CEO, Escora Holidays"
                className="card-zoom-img"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 12%',
                  display: 'block'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(13, 15, 19, 0.85) 0%, rgba(13, 15, 19, 0.2) 35%, transparent 60%)'
                }}
              />
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 2 }}>
                <span style={{ color: '#D4A359', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  FOUNDER &amp; CEO
                </span>
                <h3 className="font-display" style={{ color: '#FFFFFF', fontSize: '1.75rem', marginTop: '0.15rem', letterSpacing: '0.03em' }}>
                  MIDHILAJ
                </h3>
              </div>
            </div>

            {/* Founder Bio */}
            <div style={{ padding: 'clamp(1.75rem, 3vw, 2.75rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ color: '#B48235', fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                THE VISIONARY BEHIND ESCORA
              </p>
              <h3 className="font-display" style={{ fontSize: 'clamp(1.5rem, 2vw, 1.95rem)', color: '#121316', marginBottom: '1rem', lineHeight: 1.15 }}>
                GLOBAL STANDARDS. LOCAL SOUL.
              </h3>
              <p style={{ color: '#4B5563', fontSize: '0.94rem', lineHeight: 1.75, marginBottom: '0.9rem' }}>
                Born and raised in Kerala, Midhilaj built his career across three continents before returning home.
                He spent three years in Saudi Arabia and three in Dubai in luxury travel and tourism — mastering what discerning
                guests from the Gulf and worldwide expect in discreet service and comfort.
              </p>
              <p style={{ color: '#4B5563', fontSize: '0.94rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                He then earned his MBA in the United Kingdom and spent six years in London, deepening that understanding from within
                the world’s most demanding luxury travel market. He returned home to Kerala with one conviction: that the state’s finest
                experiences were being undersold, and that the people who deserved them most were never finding them. Escora is his answer.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1.25rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>
                    HEADQUARTERS
                  </span>
                  <span style={{ fontWeight: 600, color: '#1F2937' }}>Kozhikode, Kerala</span>
                </div>
                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>
                    EDUCATION
                  </span>
                  <span style={{ fontWeight: 600, color: '#1F2937' }}>MBA, United Kingdom</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Trust Pillars */}
      <section ref={pillarsRef} style={{ padding: '6rem 0', backgroundColor: '#0D0F13', color: '#FFFFFF' }}>
        <div className="section-wrapper">
          <div className="reveal-fade-up" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4rem' }}>
            <p style={{ color: '#D4A359', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
              THE ESCORA STANDARD
            </p>
            <h2 className="font-display" style={{ fontSize: '2.8rem', color: '#FFFFFF', lineHeight: 1.1 }}>
              OUR FOUR PILLARS OF LUXURY TRUST
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '1rem', marginTop: '0.5rem' }}>
              Every journey we compose is held to these non-negotiable benchmarks of hospitality excellence.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}
          >
            {[
              {
                num: '01',
                title: 'Handpicked Sanctuaries',
                desc: 'Zero commercial chain hotels. We personally vet private pool villas, 100-year-old planter estates, and private wooden houseboats for absolute seclusion and character.'
              },
              {
                num: '02',
                title: 'Private Executive Logistics',
                desc: 'Your dedicated, English-speaking professional chauffeur stays with you from airport arrival to departure. Clean executive SUVs, daily chilled refreshments, and relaxed timings.'
              },
              {
                num: '03',
                title: 'Keralite Concierge Desk',
                desc: 'You are never handed off to a call centre. A senior personal travel designer is on call 24/7 on WhatsApp, adjusting reservations, arranging private permits, and ensuring smooth days.'
              },
              {
                num: '04',
                title: 'Slow, Unhurried Pacing',
                desc: 'We never pack 5 tourist traps into a day. We design spacious itineraries where you have time for dawn yoga, lakeside afternoon reading, and starlit lagoon dinners.'
              }
            ].map((pillar, idx) => (
              <div
                key={pillar.num}
                className={`luxury-interactive-card reveal-card stagger-${idx + 1}`}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '2.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'default'
                }}
              >
                <div>
                  <span className="font-display" style={{ fontSize: '2.5rem', color: '#D4A359', display: 'block', lineHeight: 1, marginBottom: '1rem', transition: 'transform 0.3s ease' }}>
                    {pillar.num}
                  </span>
                  <h3 className="font-display" style={{ fontSize: '1.6rem', color: '#FFFFFF', marginBottom: '0.75rem' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers / Milestones */}
      <section ref={milestonesRef} style={{ padding: '5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <div className="section-wrapper">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2.5rem',
              textAlign: 'center'
            }}
          >
            {[
              { number: '10+', label: 'Years in Kerala' },
              { number: '2,400+', label: 'Bespoke Journeys Designed' },
              { number: '14', label: 'Districts of Kerala Covered' },
              { number: '98%', label: 'Returning & Recommended Guests' }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`luxury-stat-card reveal-card stagger-${idx + 1}`}
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(248, 246, 241, 0.5)',
                  border: '1px solid rgba(0, 0, 0, 0.04)'
                }}
              >
                <div className="font-display" style={{ fontSize: '3.6rem', color: '#B48235', lineHeight: 1, marginBottom: '0.5rem' }}>
                  {item.number}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section ref={ctaRef} style={{ padding: '6rem 2rem', backgroundColor: '#F8F6F1', textAlign: 'center', overflow: 'hidden' }}>
        <div className="section-wrapper" style={{ maxWidth: '780px' }}>
          <Sparkles size={28} color="#B48235" className="reveal-pop" style={{ margin: '0 auto 1.25rem' }} />
          <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', color: '#121316', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            READY TO BEGIN YOUR KERALA STORY?
          </h2>
          <p className="reveal-fade-up stagger-2" style={{ color: '#4B5563', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Tell us where you want to go and how you want to feel. We will take care of every single detail.
          </p>
          <div className="reveal-scale-up stagger-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/plan" className="btn-pill btn-gold anim-hover-pill" style={{ padding: '0.9rem 2.4rem', fontSize: '0.95rem' }}>
              Plan a Journey
            </Link>
            <button
              onClick={() => setEnquiryOpen(true)}
              className="btn-pill btn-black anim-hover-pill"
              style={{ padding: '0.9rem 2.4rem', fontSize: '0.95rem' }}
            >
              Consult with a Travel Designer
            </button>
          </div>
        </div>
      </section>

      <Footer onShowToast={(msg) => setToastMessage(msg)} onOpenEnquiry={() => setEnquiryOpen(true)} />

      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        initialData={{ destination: 'About Escora Journey' }}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
