import { useState } from "react";
import { useParams } from "wouter";
import { useGetItineraryByShareToken, getGetItineraryByShareTokenQueryKey } from "@workspace/api-client-react";
import { useSeo } from "@/hooks/useSeo";
import { printElementById } from "@/lib/printElement";
import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  parseTripIncludes,
  parseTransportation,
  formatMoney,
  formatDate,
} from "@/lib/itinerary";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItineraryPrintDocument from "@/components/ItineraryPrintDocument";
import HeroGradientBackground from "@/components/HeroGradientBackground";
import escoraWordmarkPath from "@assets/escora/escora-wordmark.png";
import { usePageScrollReveal } from "@/hooks/useScrollAnimation";

function Layout({ children, hideFooter = false }: { children: React.ReactNode; hideFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-[#F8F6F1]">
      <Navbar onOpenEnquiry={() => {}} />
      <main className="flex-1 w-full">{children}</main>
      {!hideFooter && <Footer onOpenEnquiry={() => {}} onShowToast={() => {}} />}
    </div>
  );
}

const PRINT_TARGET_ID = "itinerary-print-target";

export type ItineraryShareMode = "package" | "itinerary";

export default function ItineraryShare({ mode = "itinerary" }: { mode?: ItineraryShareMode }) {
  usePageScrollReveal();

  const { token } = useParams();
  const [openDays, setOpenDays] = useState<string[]>(["day-0"]);
  const [preparingDownload, setPreparingDownload] = useState(false);
  const isPackage = mode === "package";

  const { data: itinerary, isLoading, isError } = useGetItineraryByShareToken(token ?? "", {
    query: { enabled: !!token, queryKey: getGetItineraryByShareTokenQueryKey(token ?? ""), retry: 1 },
  });

  useSeo({
    title: itinerary ? `${itinerary.title} — Escora ${isPackage ? "Package" : "Itinerary"}` : "Your Itinerary",
    description: itinerary?.summary ?? "A bespoke travel itinerary curated by Escora Holidays.",
  });

  async function handleDownload() {
    // The letterhead background image may not be decoded yet on a cold
    // cache — printElementById() waits for it before calling window.print(),
    // so the button shows a brief "Preparing…" state instead of appearing
    // to do nothing (or printing before the letterhead has painted).
    setPreparingDownload(true);
    try {
      await printElementById(PRINT_TARGET_ID);
    } finally {
      setPreparingDownload(false);
    }
  }

  if (isLoading) {
    return (
      <Layout hideFooter>
        <div className="min-h-[100dvh] flex items-center justify-center bg-bg cursor-auto">
          <div className="w-12 h-12 border-t border-gold animate-spin rounded-full" />
        </div>
      </Layout>
    );
  }

  if (isError || !itinerary) {
    return (
      <Layout hideFooter>
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-bg gap-4 px-6 text-center cursor-auto">
          <img src={escoraWordmarkPath} alt="Escora" className="h-8 opacity-90" />
          <p className="font-serif text-2xl text-ink">This itinerary link is invalid or has expired.</p>
          <p className="text-ink-soft text-sm">Please check the link or contact your Escora travel consultant.</p>
        </div>
      </Layout>
    );
  }

  const days = parseDays(itinerary.days);
  const stays = parseStays(itinerary.stays);
  const pricing = parsePricing(itinerary.pricing);
  const inclusions = parseStringList(itinerary.inclusions);
  const exclusions = parseStringList(itinerary.exclusions);
  const tripIncludes = parseTripIncludes(itinerary.tripIncludes);
  const weAlsoProvide = (tripIncludes?.weAlsoProvide || []).filter(Boolean);
  const dateRange = [formatDate(itinerary.startDate), formatDate(itinerary.endDate)].filter(Boolean).join(" — ");
  const tripNights = (() => {
    if (!itinerary.startDate || !itinerary.endDate) return undefined;
    const start = new Date(itinerary.startDate);
    const end = new Date(itinerary.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
    const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return nights > 0 ? nights : undefined;
  })();

  return (
    <Layout>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap");
        .itinerary-share-page .font-serif { font-family: 'Fonarto', 'Melodrama', 'Playfair Display', Georgia, serif; }
      `}</style>
      <div className="bg-bg cursor-auto itinerary-share-page anim-page-fade-in">
      {/* Hidden A4 dossier used only for Download PDF — the visible page below is the web view. */}
      <div id={PRINT_TARGET_ID} className="hidden print:block" style={{ display: "none" }}>
        <ItineraryPrintDocument
          data={{
            title: itinerary.title,
            customerName: itinerary.customerName,
            destination: itinerary.destination,
            startDate: itinerary.startDate,
            endDate: itinerary.endDate,
            coverImageUrl: itinerary.coverImageUrl,
            summary: itinerary.summary,
            days,
            stays,
            inclusions,
            exclusions,
            pricing,
            currency: itinerary.currency,
            shareToken: itinerary.shareToken,
            mode,
            referenceNumber: itinerary.referenceNumber,
            curatorName: itinerary.curatorName,
            curatorPhone: itinerary.curatorPhone,
            emergencyContacts: itinerary.emergencyContacts,
            createdDate: itinerary.createdAt ? String(itinerary.createdAt) : undefined,
            adults: itinerary.adults,
            children: itinerary.children,
            infants: itinerary.infants,
            tripIncludes: parseTripIncludes(itinerary.tripIncludes),
            weAlsoProvide: parseTripIncludes(itinerary.tripIncludes).weAlsoProvide,
            agencyPhone: parseTripIncludes(itinerary.tripIncludes).agencyContact?.phone,
            agencyEmail: parseTripIncludes(itinerary.tripIncludes).agencyContact?.email,
            agencyInstagram: parseTripIncludes(itinerary.tripIncludes).agencyContact?.instagram,
            agencyFacebook: parseTripIncludes(itinerary.tripIncludes).agencyContact?.facebook,
            agencyWebsite: parseTripIncludes(itinerary.tripIncludes).agencyContact?.website,
            transportation: parseTransportation(itinerary.transportation),
            hotelTerms: parseStringList(itinerary.hotelTerms),
            paymentTerms: parseStringList(itinerary.paymentTerms),
            importantInfo: parseStringList(itinerary.importantInfo),
          }}
        />
      </div>

      <div className="bg-bg">
        {itinerary.coverImageUrl && !/unsplash\.com\/photos\//i.test(itinerary.coverImageUrl) ? (
          <div className="relative h-72 md:h-96 w-full overflow-hidden luxury-interactive-card">
            <img
              src={itinerary.coverImageUrl}
              alt={itinerary.title}
              className="w-full h-full object-cover card-zoom-img"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement)?.style.setProperty("display", "none");
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
            <HeroGradientBackground hasImage opacity={0.5} />
          </div>
        ) : (
          <div className="relative h-48 md:h-64 w-full overflow-hidden bg-[#0D0F13]">
            <HeroGradientBackground opacity={0.8} />
          </div>
        )}

        <div
          className="itinerary-body mx-auto max-w-4xl space-y-16"
          style={{
            paddingLeft: "var(--gutter)",
            paddingRight: "var(--gutter)",
            paddingTop: itinerary.coverImageUrl ? "clamp(32px, 4vw, 48px)" : "var(--page-top-pad, clamp(100px, 11vw, 136px))",
            paddingBottom: "var(--section-y, clamp(54px, 6.5vw, 88px))",
          }}
        >
          <section>
            <div className="flex flex-wrap items-start justify-between gap-6 mb-4">
              <p className="font-mono text-gold text-xs tracking-[0.3em] uppercase anim-hero-badge">Prepared for {itinerary.customerName}</p>
              <button
                onClick={handleDownload}
                disabled={preparingDownload}
                className="print:hidden font-mono text-xs uppercase tracking-widest border border-gold text-gold px-5 py-2.5 hover:bg-gold hover:text-bg transition-colors flex-shrink-0 disabled:opacity-50 anim-hover-pill"
              >
                {preparingDownload ? "Preparing…" : "Download PDF"}
              </button>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl text-ink leading-[1.1] mb-6 font-semibold anim-hero-title">{itinerary.title}</h1>
            <div className="bg-bg-2 border border-gold/30 p-5 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest text-ink-soft luxury-stat-card">
              {itinerary.destination && (
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {itinerary.destination}
                </span>
              )}
              {dateRange && <span>{dateRange}</span>}
              {tripNights !== undefined && (
                <span className="text-ink-mute">{tripNights} {tripNights === 1 ? "night" : "nights"}</span>
              )}
            </div>
            {itinerary.summary && <p className="font-sans text-ink-soft leading-relaxed text-lg mt-8 anim-hero-desc">{itinerary.summary}</p>}
          </section>

          {days.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-11 border-b border-line pb-5">
                <h2 className="font-serif text-3xl text-ink font-semibold">Journey Unfolds</h2>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                  {days.length} {days.length === 1 ? "day" : "days"}
                </span>
              </div>
              <Accordion
                type="multiple"
                value={openDays}
                onValueChange={setOpenDays}
                className="flex flex-col gap-5 print:block"
              >
                {days.map((day, i) => (
                  <AccordionItem
                    key={i}
                    value={`day-${i}`}
                    className={`bg-bg-2 border border-gold/30 border-b-gold/30 p-5 sm:p-6 md:p-7 print:break-inside-avoid luxury-interactive-card reveal-card stagger-${(i % 5) + 1}`}
                  >
                    <AccordionTrigger className="py-0 hover:no-underline items-start [&>svg]:mt-2 [&>svg]:text-gold [&>svg]:w-[18px] [&>svg]:h-[18px] print:[&>svg]:hidden print:cursor-default">
                      <div className="text-left">
                        <span className="font-mono text-gold text-xs uppercase tracking-widest block mb-2.5">
                          Day {day.day || i + 1}{day.date ? ` · ${formatDate(day.date)}` : ""}
                        </span>
                        <h3 className="font-serif text-2xl text-gold-bright font-semibold">{day.title}</h3>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent forceMount className="pb-0 pt-4">
                      {(() => {
                        const dayImgs = (day.imageUrls && day.imageUrls.length > 0
                          ? day.imageUrls
                          : day.imageUrl
                          ? [day.imageUrl]
                          : []).filter(Boolean);
                        if (dayImgs.length === 0) return null;
                        if (dayImgs.length === 1) {
                          return <img src={dayImgs[0]} alt={day.title} className="w-full h-56 object-cover rounded-md mb-4 shadow-2xs card-zoom-img" />;
                        }
                        return (
                          <div className={`grid ${dayImgs.length === 2 ? "grid-cols-2" : "grid-cols-3"} gap-2 h-44 sm:h-52 mb-4 rounded-md overflow-hidden`}>
                            {dayImgs.slice(0, 3).map((img, i) => (
                              <img key={i} src={img} alt={`${day.title} ${i + 1}`} className="w-full h-full object-cover rounded-sm shadow-2xs card-zoom-img" />
                            ))}
                          </div>
                        );
                      })()}
                      {day.activities && day.activities.length > 0 && (
                        <div className="space-y-2.5">
                          {day.activities.map((act, j) => (
                            <div key={j} className="font-sans text-sm flex gap-3.5 items-baseline">
                              <span className="text-gold font-mono text-xs w-12 flex-shrink-0">
                                {act.time || "•"}
                              </span>
                              <p className="text-ink-soft leading-snug m-0">
                                <span className="text-ink font-semibold">{act.title}</span>
                                {act.description && <span className="text-ink-soft"> — {act.description}</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {stays.length > 0 && (
            <section>
              <h2 className="font-serif text-3xl text-ink mb-11 border-b border-line pb-5 font-semibold reveal-fade-up">Where You'll Rest</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stays.map((stay, i) => (
                  <div key={i} className={`bg-bg-2 border border-gold/30 p-5 sm:p-7 break-inside-avoid luxury-interactive-card reveal-card stagger-${(i % 3) + 1}`}>
                    {stay.location && <span className="font-mono text-gold text-[10px] uppercase tracking-widest block mb-2.5">{stay.location}</span>}
                    <h3 className="font-serif text-xl text-ink mb-1.5 font-semibold">{stay.name}</h3>
                    {stay.roomType && <p className="font-sans text-ink-soft text-sm">{stay.roomType}</p>}
                    {stay.notes && <p className="font-sans text-ink-mute text-xs mt-2">{stay.notes}</p>}
                    {(stay.checkIn || stay.checkOut || stay.nights) && (
                      <div className="flex flex-wrap gap-4 sm:gap-8 mt-5 pt-5 border-t border-line/60">
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-mute block mb-1.5">Check-in</span>
                          <span className="font-serif text-[17px] text-ink">{formatDate(stay.checkIn) ?? "—"}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-mute block mb-1.5">
                            Check-out{stay.nights ? ` · ${stay.nights}n` : ""}
                          </span>
                          <span className="font-serif text-[17px] text-ink">{formatDate(stay.checkOut) ?? "—"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inclusions.length > 0 && (
                <div className="bg-bg-2 border border-gold/30 p-5 sm:p-7 luxury-interactive-card reveal-card stagger-1">
                  <h3 className="font-serif text-2xl text-ink mb-6 font-semibold">Inclusions</h3>
                  <div className="space-y-3.5">
                    {inclusions.map((inc, i) => (
                      <div key={i} className="flex gap-3 items-baseline">
                        <span className="text-gold text-xs flex-shrink-0">✦</span>
                        <span className="font-sans text-ink-soft text-sm leading-relaxed">{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {exclusions.length > 0 && (
                <div className="bg-bg-2 border border-line p-5 sm:p-7 luxury-interactive-card reveal-card stagger-2">
                  <h3 className="font-serif text-2xl text-ink mb-6 font-semibold">Exclusions</h3>
                  <div className="space-y-3.5">
                    {exclusions.map((exc, i) => (
                      <div key={i} className="flex gap-3 items-baseline">
                        <span className="text-ink-mute text-xs flex-shrink-0">✧</span>
                        <span className="font-sans text-ink-soft text-sm leading-relaxed">{exc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {weAlsoProvide.length > 0 && (
            <section className="bg-bg-2 border border-gold/30 p-5 sm:p-7 luxury-interactive-card reveal-card stagger-3">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-2xl text-ink font-semibold">We Also Provide</h3>
                <span className="font-mono text-[10px] text-gold uppercase tracking-wider border border-gold/40 px-2 py-0.5 rounded">
                  Optional · On Request
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {weAlsoProvide.map((service, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded border border-line bg-bg/50">
                    <span className="text-gold text-xs">✦</span>
                    <span className="font-sans text-sm text-ink-soft font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!isPackage && pricing.items.length > 0 && (() => {
            const hasTaxes = Boolean(pricing.showTaxes || (typeof pricing.taxes === "number" && pricing.taxes > 0));
            const subtotal = pricing.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const taxAmount = Number(pricing.taxes) || 0;
            const isTaxInclusive = Boolean(pricing.taxInclusive);
            const total = pricing.total > 0 ? pricing.total : hasTaxes && !isTaxInclusive ? subtotal + taxAmount : subtotal;

            return (
              <>
                <section>
                  <h2 className="font-serif text-3xl text-ink mb-8 border-b border-line pb-5 font-semibold">Pricing</h2>
                  <div className="bg-bg-2 border border-gold/30 break-inside-avoid luxury-interactive-card">
                    <div className="divide-y divide-line/60 px-4 sm:px-7">
                      {pricing.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-4">
                          <span className="font-sans text-sm text-ink-soft">{item.label}</span>
                          <span className="font-sans text-sm text-ink-soft">{formatMoney(item.amount, itinerary.currency)}</span>
                        </div>
                      ))}
                      {hasTaxes && !isTaxInclusive && taxAmount > 0 && (
                        <div className="flex items-center justify-between py-4">
                          <span className="font-sans text-sm text-ink-soft">{pricing.taxLabel || "GST & Taxes"}</span>
                          <span className="font-sans text-sm text-ink-soft">+{formatMoney(taxAmount, itinerary.currency)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-5 px-4 sm:px-7 border-t border-gold/40 bg-bg-3/40">
                      <div>
                        <span className="font-serif text-xl text-gold-bright font-semibold">Total</span>
                        {hasTaxes && isTaxInclusive && taxAmount > 0 && (
                          <span className="block text-[11px] text-ink-mute font-sans mt-0.5">
                            (Includes {pricing.taxLabel || "GST"}: {formatMoney(taxAmount, itinerary.currency)})
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xl text-gold-bright font-bold">{formatMoney(total, itinerary.currency)}</span>
                    </div>
                  </div>
                  {pricing.notes && <p className="text-xs text-ink-mute mt-3.5">{pricing.notes}</p>}
                </section>

                <section className="print:hidden bg-bg-2 border border-gold/30 p-5 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 luxury-interactive-card">
                  <div>
                    <p className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-2">Reserve This Journey</p>
                    <p className="font-sans text-ink-soft text-sm max-w-md">
                      Secure your dates with a deposit, or settle the full amount now. Your Escora specialist will confirm payment details and send a receipt.
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
                    <div className="text-left md:text-right">
                      <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Amount Due</span>
                      <span className="font-mono text-2xl text-gold-bright font-bold">{formatMoney(total, itinerary.currency)}</span>
                    </div>
                    <a
                      href={`https://wa.me/918157003344?text=${encodeURIComponent(`Hi Escora, I'd like to proceed with payment for "${itinerary.title}" (Ref: ${itinerary.shareToken.slice(0, 8).toUpperCase()}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-gold text-bg font-mono text-xs uppercase tracking-widest px-6 py-3 hover:bg-gold-bright transition-colors anim-hover-pill"
                    >
                      Proceed to Payment
                    </a>
                  </div>
                </section>
              </>
            );
          })()}

          <footer className="pt-12 border-t border-line text-center font-mono text-xs uppercase tracking-widest text-ink-mute">
            Escora Holidays · A bespoke journey, curated for you
          </footer>
        </div>
      </div>
      </div>
    </Layout>
  );
}
