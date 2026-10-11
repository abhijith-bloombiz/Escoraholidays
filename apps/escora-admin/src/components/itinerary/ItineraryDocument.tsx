import {
  parseDays,
  parseStays,
  parsePricing,
  parseStringList,
  formatMoney,
  type ItineraryDay,
  type ItineraryStay,
  type ItineraryPricing,
} from "@/lib/itinerary";

export interface ItineraryDocumentData {
  title: string;
  customerName: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImageUrl?: string | null;
  summary?: string | null;
  days: string | ItineraryDay[];
  stays: string | ItineraryStay[];
  inclusions?: string | string[] | null;
  exclusions?: string | string[] | null;
  pricing: string | ItineraryPricing;
  currency: string;
}

function formatDate(iso?: string | null) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function ItineraryDocument({ data, id }: { data: ItineraryDocumentData; id?: string }) {
  const days = typeof data.days === "string" ? parseDays(data.days) : data.days;
  const stays = typeof data.stays === "string" ? parseStays(data.stays) : data.stays;
  const pricing = typeof data.pricing === "string" ? parsePricing(data.pricing) : data.pricing;
  const inclusions = Array.isArray(data.inclusions) ? data.inclusions : parseStringList(data.inclusions);
  const exclusions = Array.isArray(data.exclusions) ? data.exclusions : parseStringList(data.exclusions);

  const dateRange = [formatDate(data.startDate), formatDate(data.endDate)].filter(Boolean).join(" — ");

  return (
    <div id={id} className="bg-white text-neutral-900 max-w-[820px] mx-auto">
      {data.coverImageUrl && (
        <div className="relative h-64 w-full overflow-hidden">
          <img src={data.coverImageUrl} alt={data.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-8 md:p-12 space-y-10">
        <header className="space-y-2 border-b pb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-amber-700">Escora Holidays</p>
          <h1 className="text-3xl font-serif">{data.title}</h1>
          <p className="text-sm text-neutral-500">Prepared for {data.customerName}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600 pt-1">
            {data.destination && <span>{data.destination}</span>}
            {dateRange && <span>{dateRange}</span>}
          </div>
        </header>

        {data.summary && <p className="text-neutral-700 leading-relaxed">{data.summary}</p>}

        {days.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl font-serif border-b pb-2">Day-by-Day Plan</h2>
            <div className="space-y-8 border-l-2 border-amber-200 ml-2">
              {days.map((day, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-amber-500" />
                  <p className="text-xs font-mono uppercase tracking-widest text-amber-700">
                    Day {day.day ?? i + 1}
                    {day.date ? ` · ${formatDate(day.date)}` : ""}
                  </p>
                  <h3 className="text-lg font-medium mt-1">{day.title}</h3>
                  {day.imageUrl && (
                    <img src={day.imageUrl} alt={day.title} className="w-full max-w-md h-40 object-cover rounded-md mt-2" />
                  )}
                  {day.description && <p className="text-sm text-neutral-600 mt-1">{day.description}</p>}
                  {day.activities?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {day.activities.map((act, j) => (
                        <li key={j} className="text-sm text-neutral-700 flex gap-2">
                          <span className="text-neutral-400 font-mono text-xs w-14 flex-shrink-0">
                            {act.time || "•"}
                          </span>
                          <span>
                            <span className="font-medium">{act.title}</span>
                            {act.description && <span className="text-neutral-500"> — {act.description}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {stays.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-serif border-b pb-2">Stays</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stays.map((stay, i) => (
                <div key={i} className="border rounded-md p-4 space-y-1">
                  <p className="font-medium">{stay.name}</p>
                  {stay.location && <p className="text-xs text-neutral-500">{stay.location}</p>}
                  <div className="text-sm text-neutral-600 flex flex-wrap gap-x-4 pt-1">
                    {stay.checkIn && <span>Check-in: {formatDate(stay.checkIn)}</span>}
                    {stay.checkOut && <span>Check-out: {formatDate(stay.checkOut)}</span>}
                    {stay.nights ? <span>{stay.nights} nights</span> : null}
                  </div>
                  {stay.roomType && <p className="text-sm text-neutral-600">{stay.roomType}</p>}
                  {stay.notes && <p className="text-xs text-neutral-500">{stay.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {(inclusions.length > 0 || exclusions.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {inclusions.length > 0 && (
              <div>
                <h3 className="text-lg font-serif border-b pb-2 mb-3">Inclusions</h3>
                <ul className="space-y-1.5 text-sm text-neutral-700">
                  {inclusions.map((inc, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-600">✓</span> {inc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {exclusions.length > 0 && (
              <div>
                <h3 className="text-lg font-serif border-b pb-2 mb-3">Exclusions</h3>
                <ul className="space-y-1.5 text-sm text-neutral-700">
                  {exclusions.map((exc, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-neutral-400">✕</span> {exc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {pricing.items.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-serif border-b pb-2">Pricing</h2>
            <table className="w-full text-sm">
              <tbody>
                {pricing.items.map((item, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-700">{item.label}</td>
                    <td className="py-2 text-right text-neutral-700">{formatMoney(item.amount, data.currency)}</td>
                  </tr>
                ))}
                {!!pricing.discount && (
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-500">Discount</td>
                    <td className="py-2 text-right text-neutral-500">-{formatMoney(pricing.discount, data.currency)}</td>
                  </tr>
                )}
                {!!pricing.taxes && (
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-500">Taxes &amp; Fees</td>
                    <td className="py-2 text-right text-neutral-500">{formatMoney(pricing.taxes, data.currency)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-3 font-semibold">Total</td>
                  <td className="py-3 text-right font-semibold text-lg">{formatMoney(pricing.total, data.currency)}</td>
                </tr>
              </tbody>
            </table>
            {pricing.notes && <p className="text-xs text-neutral-500">{pricing.notes}</p>}
          </section>
        )}

        <footer className="pt-8 border-t text-center text-xs text-neutral-400 font-mono uppercase tracking-widest">
          Escora Holidays · A bespoke journey, curated for you
        </footer>
      </div>
    </div>
  );
}
