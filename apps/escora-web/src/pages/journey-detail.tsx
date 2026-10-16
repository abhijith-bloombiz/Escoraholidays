import Layout from "@/components/layout/Layout";
import { useGetPackage, getGetPackageQueryKey, useCreateOrder, type Package } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSeo } from "@/hooks/useSeo";

const MOCK_PACKAGES: Partial<Package>[] = [
  { id: 1, name: "The Malabar Escape", durationNights: 5, route: "Kochi · Munnar · Alleppey", category: "Honeymoon", priceFrom: 150000, heroImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80", shortDesc: "A five-night journey through Kerala's most iconic backwaters, spice gardens and heritage hotels.", description: "Weave through the lush heartland of Kerala on a private itinerary designed for two. Begin in the colonial lanes of Fort Kochi, ascend to the misty tea estates of Munnar, and finish aboard a traditional ketuvallam houseboat drifting the Alleppey backwaters.", published: true, featured: true, slug: "malabar-escape", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: "Cardamom Hills Retreat", durationNights: 4, route: "Munnar · Thekkady", category: "Wellness", priceFrom: 120000, heroImageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=2000&q=80", shortDesc: "Four nights among Kerala's cardamom and tea estates — yoga, ayurveda, forest walks.", description: "Retreat into the cool highlands where cardamom perfumes the air. Spend your days with guided spice-estate walks, sunrise yoga on dew-wet lawns, and unhurried ayurvedic treatments before evenings around a fire.", published: true, featured: true, slug: "cardamom-hills", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: "Spice Coast Odyssey", durationNights: 7, route: "Kochi · Marari · Kumarakom", category: "Culture", priceFrom: 220000, heroImageUrl: "https://images.unsplash.com/photo-1556470478-98bd74cfc940?auto=format&fit=crop&w=2000&q=80", shortDesc: "Seven nights tracing the ancient spice trade across Kerala's coast and lagoons.", description: "Follow the footsteps of traders who once sailed for Kerala's black gold. Visit working spice markets in Kochi, unwind on Marari's unspoiled beach, and drift the Kumarakom bird sanctuary by private boat.", published: true, featured: false, slug: "spice-coast", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: "Wayanad Wilds", durationNights: 3, route: "Calicut · Wayanad", category: "Adventure", priceFrom: 90000, heroImageUrl: "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=2000&q=80", shortDesc: "Three nights deep in Wayanad's tribal heartland — jungle treks, waterfalls, tribal heritage.", description: "Escape to India's most biodiverse forests. Stay in a sustainably built forest lodge, trek to hidden waterfalls with a local guide, and join a tribal-heritage walk that few travellers ever experience.", published: true, featured: true, slug: "wayanad-wilds", itinerary: null, inclusions: null, exclusions: null, accommodations: null, galleryImages: null, season: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const formSchema = z.object({
  guestName: z.string().min(2, "Name is required"),
  guestEmail: z.string().email("Invalid email"),
  guestPhone: z.string().min(10, "Phone is required"),
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

  const createOrder = useCreateOrder();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { guestName: "", guestEmail: "", guestPhone: "", travelDate: "", guestCount: 2, specialRequests: "" }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const bookingPackageId = pkg?.id ?? (isNumeric ? Number(rawId) : undefined);
    createOrder.mutate({ 
      data: { 
        ...data, 
        packageId: bookingPackageId, 
        packageName: pkg?.name 
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Booking Enquiry Sent", description: "Our concierge will contact you shortly to confirm details." });
        form.reset();
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
            <h1 className="font-serif text-5xl md:text-7xl text-ink leading-[1.1] mb-8">
              {pkg.name}
            </h1>
            
            <div className="flex flex-wrap gap-8 items-center font-mono text-xs uppercase tracking-widest text-ink-soft bg-bg-2/80 backdrop-blur px-8 py-6 border border-line border-l-gold border-l-4">
              <div className="flex flex-col gap-1">
                <span className="text-ink-mute text-[10px]">Duration</span>
                <span className="text-ink">{pkg.durationNights} Nights</span>
              </div>
              <div className="w-[1px] h-8 bg-line" />
              <div className="flex flex-col gap-1">
                <span className="text-ink-mute text-[10px]">Route</span>
                <span className="text-ink">{pkg.route}</span>
              </div>
              {pkg.season && (
                <>
                  <div className="w-[1px] h-8 bg-line" />
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
            <div className="sticky top-32 bg-bg-2 border border-line p-8 md:p-10 reveal-up">
              <h3 className="font-serif text-3xl text-ink mb-2">Reserve Your Journey</h3>
              <p className="font-sans text-ink-soft text-sm mb-8">Our concierge will contact you to finalize dates and details.</p>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Name</label>
                  <input 
                    {...form.register("guestName")}
                    className="w-full bg-transparent border-b border-line focus:border-gold py-2 text-ink font-sans outline-none transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Email</label>
                  <input 
                    {...form.register("guestEmail")}
                    type="email"
                    className="w-full bg-transparent border-b border-line focus:border-gold py-2 text-ink font-sans outline-none transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Phone</label>
                  <input 
                    {...form.register("guestPhone")}
                    className="w-full bg-transparent border-b border-line focus:border-gold py-2 text-ink font-sans outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Travel Date</label>
                    <input 
                      {...form.register("travelDate")}
                      type="date"
                      className="w-full bg-transparent border-b border-line focus:border-gold py-2 text-ink font-sans outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Guests</label>
                    <input 
                      {...form.register("guestCount")}
                      type="number"
                      min="1"
                      className="w-full bg-transparent border-b border-line focus:border-gold py-2 text-ink font-sans outline-none transition-colors"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Special Requests</label>
                  <textarea 
                    {...form.register("specialRequests")}
                    className="w-full bg-transparent border-b border-line focus:border-gold py-2 text-ink font-sans outline-none transition-colors resize-none h-20"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={createOrder.isPending}
                  className="w-full bg-gold text-bg font-mono uppercase tracking-widest text-xs py-4 hover:bg-gold-bright transition-colors disabled:opacity-50 mt-4"
                >
                  {createOrder.isPending ? "Sending..." : "Request to Book"}
                </button>
              </form>
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
