import Layout from "@/components/layout/Layout";
import { useGetPackage, getGetPackageQueryKey, useCreateEnquiry, type Package } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSeo } from "@/hooks/useSeo";
import { Check, Minus, Plus, ArrowRight, Loader2 } from "lucide-react";

const MOCK_PACKAGES: Partial<Package>[] = [
  { id: 1, name: "The Malabar Escape", durationNights: 5, route: "Kochi · Munnar · Alleppey", category: "Honeymoon", priceFrom: 150000, heroImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80", shortDesc: "A five-night journey through Kerala's most iconic backwaters, spice gardens and heritage hotels.", description: "Weave through the lush heartland of Kerala on a private itinerary designed for two. Begin in the colonial lanes of Fort Kochi, ascend to the misty tea estates of Munnar, and finish aboard a traditional ketuvallam houseboat drifting the Alleppey backwaters.", published: true, featured: true, slug: "malabar-escape", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: "Cardamom Hills Retreat", durationNights: 4, route: "Munnar · Thekkady", category: "Wellness", priceFrom: 120000, heroImageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=2000&q=80", shortDesc: "Four nights among Kerala's cardamom and tea estates — yoga, ayurveda, forest walks.", description: "Retreat into the cool highlands where cardamom perfumes the air. Spend your days with guided spice-estate walks, sunrise yoga on dew-wet lawns, and unhurried ayurvedic treatments before evenings around a fire.", published: true, featured: true, slug: "cardamom-hills", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: "Spice Coast Odyssey", durationNights: 7, route: "Kochi · Marari · Kumarakom", category: "Culture", priceFrom: 220000, heroImageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=2000&q=80", shortDesc: "Seven nights tracing the ancient spice trade across Kerala's coast and lagoons.", description: "Follow the footsteps of traders who once sailed for Kerala's black gold. Visit working spice markets in Kochi, unwind on Marari's unspoiled beach, and drift the Kumarakom bird sanctuary by private boat.", published: true, featured: false, slug: "spice-coast", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: "Wayanad Wilds", durationNights: 3, route: "Calicut · Wayanad", category: "Adventure", priceFrom: 90000, heroImageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=2000&q=80", shortDesc: "Three nights deep in Wayanad's tribal heartland — jungle treks, waterfalls, tribal heritage.", description: "Escape to India's most biodiverse forests. Stay in a sustainably built forest lodge, trek to hidden waterfalls with a local guide, and join a tribal-heritage walk that few travellers ever experience.", published: true, featured: true, slug: "wayanad-wilds", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const formSchema = z.object({
  guestName: z.string().min(2, "Please enter your name"),
  guestEmail: z.string().email("Please enter a valid email address"),
  guestPhone: z.string().min(10, "Please enter a valid phone number (min 10 digits)"),
  travelDate: z.string().optional(),
  guestCount: z.coerce.number().min(1, "At least 1 guest").optional(),
  specialRequests: z.string().optional()
});

export default function JourneyDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  
  const rawId = id ? decodeURIComponent(id) : "";
  const isNumeric = /^\d+$/.test(rawId);
  const lookupId = isNumeric ? Number(rawId) : rawId;

  const { data: apiPkg, isLoading, isError } = useGetPackage(lookupId as any, {
    query: { enabled: !!lookupId, queryKey: getGetPackageQueryKey(lookupId as any), retry: 1 }
  });
  const pkg = apiPkg ?? (isError ? MOCK_PACKAGES.find(p => (isNumeric && p.id === Number(rawId)) || p.slug === rawId) : undefined);

  useSeo({
    title: pkg ? `${pkg.name} — ${pkg.durationNights}-Night Kerala Journey` : "Journey Detail",
    description: pkg?.shortDesc ?? "A private, bespoke Kerala journey crafted by Escora — curated for discerning travellers.",
    image: pkg?.heroImageUrl ?? undefined,
    url: pkg ? `https://www.escoraholidays.com/journeys/${pkg.slug || pkg.id || rawId}` : "https://www.escoraholidays.com/journeys",
    jsonLd: pkg ? {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: pkg.name,
      description: pkg.shortDesc,
      image: pkg.heroImageUrl,
      url: `https://www.escoraholidays.com/journeys/${pkg.slug || pkg.id || rawId}`,
      provider: { "@type": "TravelAgency", name: "Escora", url: "https://www.escoraholidays.com" },
      touristType: pkg.category,
    } : undefined,
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const createOrder = useCreateOrder();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { guestName: "", guestEmail: "", guestPhone: "", travelDate: "", guestCount: 2, specialRequests: "" }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const bookingPackageId = pkg?.id ?? (isNumeric ? Number(rawId) : undefined);
    createEnquiry.mutate({ 
      data: { 
        name: data.guestName,
        email: data.guestEmail,
        phone: data.guestPhone,
        packageId: bookingPackageId, 
        packageName: pkg?.name,
        destinations: pkg?.route || pkg?.name,
        travelDate: data.travelDate || undefined,
        guestCount: data.guestCount,
        specialRequests: data.specialRequests || undefined,
        travelStyle: pkg?.category || "Curated Journey",
      } as any
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
        toast({ title: "Booking Enquiry Sent", description: "Our concierge will contact you shortly to confirm details." });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not send enquiry.", variant: "destructive" });
      }
    });
  };

  // Safe JSON parsing
  const safeParse = (str: string | null | undefined) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="w-12 h-12 border-t border-gold animate-spin rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!pkg) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6">
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase">Not Found</p>
          <h1 className="font-serif text-4xl text-ink">Journey not found</h1>
          <p className="text-ink-mute max-w-md">This journey may have been moved, unpublished, or is no longer available.</p>
          <Link href="/journeys" className="font-mono text-xs text-gold uppercase tracking-widest hover:underline">
            ← Back to All Journeys
          </Link>
        </div>
      </Layout>
    );
  }

  const itinerary = safeParse(pkg.itinerary);
  const inclusions = safeParse(pkg.inclusions);
  const exclusions = safeParse(pkg.exclusions);
  const accommodations = safeParse(pkg.accommodations);
  const gallery = safeParse(pkg.galleryImages);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[80dvh] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0 ken-burns">
          <img 
            src={pkg.heroImageUrl || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80"} 
            alt={pkg.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 md:px-12 pb-24 reveal-up">
          <div className="max-w-4xl">
            <span className="font-mono text-gold text-xs tracking-[0.3em] uppercase mb-4 block bg-bg/50 backdrop-blur inline-block px-4 py-2">
              {pkg.category}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl text-ink leading-[1.1] mb-6 sm:mb-8">
              {pkg.name}
            </h1>
            
            <div className="flex flex-wrap gap-4 sm:gap-8 items-center font-mono text-xs uppercase tracking-widest text-ink-soft bg-bg-2/80 backdrop-blur px-4 py-4 sm:px-8 sm:py-6 border border-line border-l-gold border-l-4">
              <div className="flex flex-col gap-1">
                <span className="text-ink-mute text-[10px]">Duration</span>
                <span className="text-ink">{pkg.durationNights} Nights</span>
              </div>
              <div className="w-[1px] h-8 bg-line hidden sm:block" />
              <div className="flex flex-col gap-1">
                <span className="text-ink-mute text-[10px]">Route</span>
                <span className="text-ink">{pkg.route}</span>
              </div>
              {pkg.season && (
                <>
                  <div className="w-[1px] h-8 bg-line hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <span className="text-ink-mute text-[10px]">Best Season</span>
                    <span className="text-ink">{pkg.season}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-16 relative">
          
          {/* Left Col - Info */}
          <div className="w-full lg:w-2/3 space-y-24">
            
            {/* Overview */}
            <div className="reveal-up">
              <h2 className="font-serif text-3xl text-ink mb-6">The Experience</h2>
              <div className="font-sans text-ink-soft leading-relaxed space-y-4 font-light text-lg">
                {pkg.description?.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                )) || <p>Immerse yourself in the breathtaking beauty of Kerala with this carefully curated journey.</p>}
              </div>
            </div>

            {/* Itinerary */}
            {itinerary.length > 0 && (
              <div className="reveal-up">
                <h2 className="font-serif text-3xl text-ink mb-12">Journey Unfolds</h2>
                <div className="space-y-12 border-l border-line ml-3">
                  {itinerary.map((day: any, i: number) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute top-0 -left-[5px] w-[9px] h-[9px] bg-bg border-2 border-gold rounded-full" />
                      <span className="font-mono text-gold text-xs uppercase tracking-widest block mb-2">Day {day.day || i + 1}</span>
                      <h3 className="font-serif text-2xl text-ink mb-4">{day.title}</h3>
                      <p className="font-sans text-ink-soft leading-relaxed">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accommodations */}
            {accommodations.length > 0 && (
              <div className="reveal-up">
                <h2 className="font-serif text-3xl text-ink mb-8">Where You'll Rest</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {accommodations.map((acc: any, i: number) => (
                    <div key={i} className="bg-bg-2 p-8 border border-line">
                      <h3 className="font-serif text-xl text-ink mb-2">{acc.name}</h3>
                      <span className="font-mono text-gold text-[10px] uppercase tracking-widest block mb-4">{acc.location}</span>
                      <p className="font-sans text-ink-soft text-sm leading-relaxed">{acc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details (Inclusions/Exclusions) */}
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 reveal-up">
                {inclusions.length > 0 && (
                  <div>
                    <h3 className="font-serif text-2xl text-ink mb-6">Inclusions</h3>
                    <ul className="space-y-3 font-sans text-ink-soft text-sm">
                      {inclusions.map((inc: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-gold">✦</span> {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div>
                    <h3 className="font-serif text-2xl text-ink mb-6">Exclusions</h3>
                    <ul className="space-y-3 font-sans text-ink-soft text-sm">
                      {exclusions.map((exc: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-ink-mute">✧</span> {exc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Col - Sticky Form */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-28 bg-white border border-[#CCD7D2] rounded-2xl p-6 sm:p-7 shadow-[0_16px_40px_-16px_rgba(26,63,44,0.10)] reveal-up">
              {/* Header Badge & Starting Price */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#CCD7D2]/60">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#183628] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#183628]" />
                  <span>Reserve Journey</span>
                </div>
                {pkg?.priceFrom ? (
                  <div className="text-right">
                    <span className="block text-[9.5px] font-mono uppercase tracking-wider text-[#788A63]">Starting from</span>
                    <span className="font-serif text-lg font-semibold text-[#183628]">₹{pkg.priceFrom.toLocaleString("en-IN")}</span>
                  </div>
                ) : null}
              </div>

              <h3 className="font-serif text-2xl sm:text-[28px] text-[#183628] mb-1.5 font-medium leading-tight">
                Reserve Your Journey
              </h3>
              <p className="font-sans text-[#56664C] text-xs sm:text-sm mb-6 leading-relaxed">
                Our concierge will contact you to finalize bespoke dates, luxury stays, and private arrangements.
              </p>

              {isSubmitted ? (
                <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 rounded-full bg-[#183628]/10 border border-[#183628]/30 flex items-center justify-center mx-auto text-[#183628]">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl text-[#183628] font-medium">Enquiry Received</h4>
                    <p className="text-xs text-[#56664C] leading-relaxed max-w-xs mx-auto mt-2">
                      Thank you, <strong className="text-[#183628]">{form.getValues("guestName")}</strong>. Our journey concierge is reviewing your request for <strong className="text-[#183628]">{pkg?.name}</strong> and will contact you within 24 hours.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        form.reset();
                      }}
                      className="text-xs font-mono text-[#183628] uppercase tracking-wider underline underline-offset-4 hover:opacity-75 cursor-pointer"
                    >
                      Make another enquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold">
                      Full Name *
                    </label>
                    <input 
                      {...form.register("guestName")}
                      type="text"
                      placeholder="e.g. Eleanor Vance"
                      className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#183628] placeholder:text-[#8FA196] focus:bg-white focus:outline-none transition-all ${
                        form.formState.errors.guestName
                          ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-[#CCD7D2] focus:border-[#183628] focus:ring-1 focus:ring-[#183628]"
                      }`}
                    />
                    {form.formState.errors.guestName && (
                      <p className="text-[11px] text-red-600 font-sans mt-0.5">
                        {form.formState.errors.guestName.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold">
                      Email Address *
                    </label>
                    <input 
                      {...form.register("guestEmail")}
                      type="email"
                      placeholder="eleanor@example.com"
                      className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#183628] placeholder:text-[#8FA196] focus:bg-white focus:outline-none transition-all ${
                        form.formState.errors.guestEmail
                          ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-[#CCD7D2] focus:border-[#183628] focus:ring-1 focus:ring-[#183628]"
                      }`}
                    />
                    {form.formState.errors.guestEmail && (
                      <p className="text-[11px] text-red-600 font-sans mt-0.5">
                        {form.formState.errors.guestEmail.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold">
                      Phone Number *
                    </label>
                    <input 
                      {...form.register("guestPhone")}
                      type="tel"
                      placeholder="+91 98765 43210"
                      className={`w-full bg-[#FAF8F5] border rounded-xl px-3.5 py-2.5 text-sm text-[#183628] placeholder:text-[#8FA196] focus:bg-white focus:outline-none transition-all ${
                        form.formState.errors.guestPhone
                          ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-[#CCD7D2] focus:border-[#183628] focus:ring-1 focus:ring-[#183628]"
                      }`}
                    />
                    {form.formState.errors.guestPhone && (
                      <p className="text-[11px] text-red-600 font-sans mt-0.5">
                        {form.formState.errors.guestPhone.message}
                      </p>
                    )}
                  </div>

                  {/* Travel Date & Guests in 2 Cols */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold">
                        Travel Date
                      </label>
                      <input 
                        {...form.register("travelDate")}
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full bg-[#FAF8F5] border border-[#CCD7D2] rounded-xl px-3 py-2 text-sm text-[#183628] focus:bg-white focus:border-[#183628] focus:ring-1 focus:ring-[#183628] focus:outline-none transition-all cursor-pointer h-[42px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold">
                        Guests
                      </label>
                      <div className="flex items-center h-[42px] bg-[#FAF8F5] border border-[#CCD7D2] rounded-xl px-2">
                        <button
                          type="button"
                          onClick={() => form.setValue("guestCount", Math.max(1, (form.watch("guestCount") || 2) - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-[#DCE6E0] flex items-center justify-center text-[#183628] hover:bg-[#EFF4F0] active:scale-95 transition-all cursor-pointer shadow-2xs"
                          aria-label="Decrease guests"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center font-serif text-base font-semibold text-[#183628] select-none">
                          {form.watch("guestCount") || 2}
                        </span>
                        <button
                          type="button"
                          onClick={() => form.setValue("guestCount", Math.min(20, (form.watch("guestCount") || 2) + 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-[#DCE6E0] flex items-center justify-center text-[#183628] hover:bg-[#EFF4F0] active:scale-95 transition-all cursor-pointer shadow-2xs"
                          aria-label="Increase guests"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Special Requests */}
                  <div className="space-y-1.5 pt-0.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold">
                      Special Requests
                    </label>
                    <textarea 
                      {...form.register("specialRequests")}
                      rows={3}
                      placeholder="Celebrations, dietary preferences, pace of travel…"
                      className="w-full bg-[#FAF8F5] border border-[#CCD7D2] rounded-xl p-3 text-sm text-[#183628] placeholder:text-[#8FA196] focus:bg-white focus:border-[#183628] focus:ring-1 focus:ring-[#183628] focus:outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={createOrder.isPending}
                    className="w-full bg-[#1A3F2C] hover:bg-[#255239] text-white rounded-full py-3.5 px-6 font-mono uppercase tracking-widest text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow active:scale-[0.99] disabled:opacity-50 mt-3 cursor-pointer"
                  >
                    {createOrder.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Request…</span>
                      </>
                    ) : (
                      <>
                        <span>Request to Book</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  {/* Trust footer & WhatsApp */}
                  <div className="pt-3 border-t border-[#CCD7D2]/60 space-y-1.5 text-center">
                    <p className="text-[11px] text-[#56664C] leading-snug">
                      No upfront payment required · 100% tailor-made
                    </p>
                    <a
                      href={`https://wa.me/918157003344?text=${encodeURIComponent(`Hi Escora, I would like to reserve "${pkg?.name || 'this journey'}".`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1A3F2C] hover:text-[#3F5630] font-mono tracking-wide underline underline-offset-4 transition-colors"
                    >
                      Prefer to chat? Connect on WhatsApp →
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-24 bg-bg-3 border-t border-line">
          <div className="container mx-auto px-6 md:px-12">
            <h2 className="font-serif text-3xl text-ink mb-12 text-center reveal-up">Visual Glimpses</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((img: string, i: number) => (
                <div key={i} className="aspect-square overflow-hidden reveal-up" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </Layout>
  );
}
