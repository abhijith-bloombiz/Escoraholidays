import { useEffect, useState } from "react";
import { useListDestinations, useCreateOrder } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import { Link } from "wouter";
import { useSeo } from "@/hooks/useSeo";

type TravelStyle = "Honeymoon" | "Family" | "Solo" | "Wellness" | "Bespoke Group";

const TRAVEL_STYLES: { label: TravelStyle; desc: string; icon: string }[] = [
  { label: "Honeymoon", desc: "Intimate escapes for two", icon: "♡" },
  { label: "Family", desc: "Memories across generations", icon: "◈" },
  { label: "Solo", desc: "Your pace, your way", icon: "◎" },
  { label: "Wellness", desc: "Ayurveda, rest and renewal", icon: "✦" },
  { label: "Bespoke Group", desc: "Curated for private groups", icon: "◇" },
];

const BUDGET_OPTIONS = [
  "Under ₹1 Lakh",
  "₹1L – ₹2L",
  "₹2L – ₹5L",
  "₹5L – ₹10L",
  "Above ₹10L",
];

interface FormData {
  travelStyle: TravelStyle | "";
  destinations: string[];
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  budgetRange: string;
  preferences: string;
  name: string;
  email: string;
  phone: string;
}

const EMPTY: FormData = {
  travelStyle: "",
  destinations: [],
  arrivalDate: "",
  departureDate: "",
  adults: 2,
  children: 0,
  budgetRange: "",
  preferences: "",
  name: "",
  email: "",
  phone: "",
};

const TOTAL_STEPS = 5;

export default function PlanPage() {
  useSeo({
    title: "Plan Your Private Kerala Holiday — Custom Itinerary Builder",
    description: "Start planning your bespoke Kerala holiday with Escora. Tell us your travel dates, group size, and interests — honeymoon, Ayurveda retreat, family trip, or luxury getaway — and we'll craft your perfect itinerary.",
    url: "https://www.escoraholidays.com/plan",
  });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { data: destinations } = useListDestinations({ published: true });
  const createOrder = useCreateOrder();

  useEffect(() => {
    const preselected = new URLSearchParams(window.location.search).get("destination");
    if (preselected) {
      setForm((f) => (f.destinations.includes(preselected) ? f : { ...f, destinations: [...f.destinations, preselected] }));
    }
  }, []);

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  function toggleDestination(name: string) {
    setForm((f) => ({
      ...f,
      destinations: f.destinations.includes(name)
        ? f.destinations.filter((d) => d !== name)
        : [...f.destinations, name],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill in all contact details.");
      return;
    }

    // Collect browser-side tracking metadata
    const searchParams = new URLSearchParams(window.location.search);
    const trackingData = {
      referrerUrl: document.referrer || undefined,
      landingPage: window.location.href,
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
      browserLanguage: navigator.language || undefined,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    };

    createOrder.mutate(
      {
        data: {
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          travelStyle: form.travelStyle || undefined,
          destinations: form.destinations.length ? form.destinations.join(", ") : undefined,
          travelDate: form.arrivalDate || undefined,
          departureDate: form.departureDate || undefined,
          guestCount: (form.adults + form.children) || undefined,
          budgetRange: form.budgetRange || undefined,
          specialRequests: form.preferences || undefined,
          ...trackingData,
        },
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setError("Something went wrong. Please try again."),
      }
    );
  }

  if (submitted) return <SuccessScreen name={form.name} />;

  return (
    <Layout>
      <div style={{ minHeight: "100vh", background: "var(--bg)", paddingTop: 100 }}>

        {/* Progress bar */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 300, background: "var(--hair-soft, rgba(232,220,196,0.1))" }}>
          <div style={{ height: "100%", background: "var(--gold)", width: `${(step / TOTAL_STEPS) * 100}%`, transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)" }} />
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 120px" }}>

          {/* Step label */}
          <p style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 16 }}>
            Step {step} of {TOTAL_STEPS}
          </p>

          {/* Step 1 — Travel Style */}
          {step === 1 && (
            <div>
              <h1 style={{ fontFamily: "var(--f-serif)", fontSize: "clamp(2rem,5vw,3rem)", color: "var(--ink)", fontWeight: 300, lineHeight: 1.15, marginBottom: 12 }}>
                How would you like to travel?
              </h1>
              <p style={{ fontFamily: "var(--f-body)", color: "var(--ink-soft)", marginBottom: 40, fontSize: 15 }}>
                This helps us shape the tone and pace of your journey.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))", gap: 12, marginBottom: 48 }}>
                {TRAVEL_STYLES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setForm((f) => ({ ...f, travelStyle: s.label }))}
                    style={{
                      textAlign: "left",
                      padding: "20px 20px",
                      border: `1px solid ${form.travelStyle === s.label ? "var(--gold)" : "var(--hair, rgba(232,220,196,0.15))"}`,
                      borderRadius: 4,
                      background: form.travelStyle === s.label ? "var(--tint, rgba(200,163,97,0.08))" : "transparent",
                      cursor: "pointer",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 10, color: "var(--gold)" }}>{s.icon}</div>
                    <div style={{ fontFamily: "var(--f-serif)", fontSize: 17, color: "var(--ink)", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--ink-soft)" }}>{s.desc}</div>
                  </button>
                ))}
              </div>
              <StepActions onNext={next} nextDisabled={!form.travelStyle} showBack={false} />
            </div>
          )}

          {/* Step 2 — Destinations */}
          {step === 2 && (
            <div>
              <h1 style={{ fontFamily: "var(--f-serif)", fontSize: "clamp(2rem,5vw,3rem)", color: "var(--ink)", fontWeight: 300, lineHeight: 1.15, marginBottom: 12 }}>
                Where do you want to go?
              </h1>
              <p style={{ fontFamily: "var(--f-body)", color: "var(--ink-soft)", marginBottom: 40, fontSize: 15 }}>
                Select one or more — we'll weave them into a seamless journey.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 48 }}>
                {destinations && destinations.length > 0
                  ? destinations.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => toggleDestination(d.name)}
                      style={{
                        padding: "10px 20px",
                        border: `1px solid ${form.destinations.includes(d.name) ? "var(--gold)" : "var(--hair, rgba(232,220,196,0.2))"}`,
                        borderRadius: 999,
                        background: form.destinations.includes(d.name) ? "var(--tint, rgba(200,163,97,0.12))" : "transparent",
                        fontFamily: "var(--f-body)",
                        fontSize: 13,
                        color: form.destinations.includes(d.name) ? "var(--gold)" : "var(--ink-soft)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {d.name}
                    </button>
                  ))
                  : ["Alleppey", "Munnar", "Fort Kochi", "Thekkady", "Kovalam", "Wayanad", "Varkala", "Kumarakom"].map((name) => (
                    <button
                      key={name}
                      onClick={() => toggleDestination(name)}
                      style={{
                        padding: "10px 20px",
                        border: `1px solid ${form.destinations.includes(name) ? "var(--gold)" : "var(--hair, rgba(232,220,196,0.2))"}`,
                        borderRadius: 999,
                        background: form.destinations.includes(name) ? "var(--tint, rgba(200,163,97,0.12))" : "transparent",
                        fontFamily: "var(--f-body)",
                        fontSize: 13,
                        color: form.destinations.includes(name) ? "var(--gold)" : "var(--ink-soft)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {name}
                    </button>
                  ))
                }
              </div>
              {form.destinations.length > 0 && (
                <p style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.12em", color: "var(--gold)", marginBottom: 32 }}>
                  {form.destinations.length} selected — {form.destinations.join(" · ")}
                </p>
              )}
              <StepActions onNext={next} onBack={back} nextLabel="Continue" />
            </div>
          )}

          {/* Step 3 — Trip Details */}
          {step === 3 && (
            <div>
              <h1 style={{ fontFamily: "var(--f-serif)", fontSize: "clamp(2rem,5vw,3rem)", color: "var(--ink)", fontWeight: 300, lineHeight: 1.15, marginBottom: 12 }}>
                Tell us about your trip.
              </h1>
              <p style={{ fontFamily: "var(--f-body)", color: "var(--ink-soft)", marginBottom: 40, fontSize: 15 }}>
                Approximate dates and group size help us plan the right experiences.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 20, marginBottom: 24 }}>
                <Field label="Arrival date">
                  <input
                    type="date"
                    value={form.arrivalDate}
                    onChange={(e) => setForm((f) => ({ ...f, arrivalDate: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Departure date">
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 20, marginBottom: 32 }}>
                <Field label="Adults">
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <CounterBtn onClick={() => setForm((f) => ({ ...f, adults: Math.max(1, f.adults - 1) }))}>−</CounterBtn>
                    <span style={{ fontFamily: "var(--f-serif)", fontSize: 24, color: "var(--ink)", minWidth: 32, textAlign: "center" }}>{form.adults}</span>
                    <CounterBtn onClick={() => setForm((f) => ({ ...f, adults: f.adults + 1 }))}>+</CounterBtn>
                  </div>
                </Field>
                <Field label="Children">
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <CounterBtn onClick={() => setForm((f) => ({ ...f, children: Math.max(0, f.children - 1) }))}>−</CounterBtn>
                    <span style={{ fontFamily: "var(--f-serif)", fontSize: 24, color: "var(--ink)", minWidth: 32, textAlign: "center" }}>{form.children}</span>
                    <CounterBtn onClick={() => setForm((f) => ({ ...f, children: f.children + 1 }))}>+</CounterBtn>
                  </div>
                </Field>
              </div>

              <Field label="Approximate budget per person">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                  {BUDGET_OPTIONS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setForm((f) => ({ ...f, budgetRange: b }))}
                      style={{
                        padding: "9px 18px",
                        border: `1px solid ${form.budgetRange === b ? "var(--gold)" : "var(--hair, rgba(232,220,196,0.2))"}`,
                        borderRadius: 999,
                        background: form.budgetRange === b ? "var(--tint, rgba(200,163,97,0.12))" : "transparent",
                        fontFamily: "var(--f-mono)",
                        fontSize: 12,
                        letterSpacing: "0.05em",
                        color: form.budgetRange === b ? "var(--gold)" : "var(--ink-soft)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </Field>

              <div style={{ marginTop: 40 }}>
                <StepActions onNext={next} onBack={back} />
              </div>
            </div>
          )}

          {/* Step 4 — Preferences */}
          {step === 4 && (
            <div>
              <h1 style={{ fontFamily: "var(--f-serif)", fontSize: "clamp(2rem,5vw,3rem)", color: "var(--ink)", fontWeight: 300, lineHeight: 1.15, marginBottom: 12 }}>
                Anything we should know?
              </h1>
              <p style={{ fontFamily: "var(--f-body)", color: "var(--ink-soft)", marginBottom: 40, fontSize: 15 }}>
                Special occasions, dietary requirements, accommodation preferences, pace of travel — tell us everything.
              </p>
              <textarea
                value={form.preferences}
                onChange={(e) => setForm((f) => ({ ...f, preferences: e.target.value }))}
                placeholder="E.g. celebrating our anniversary, prefer heritage stays, vegetarian, leisurely pace with no early mornings…"
                rows={7}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  width: "100%",
                  fontFamily: "var(--f-body)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              />
              <div style={{ marginTop: 40 }}>
                <StepActions onNext={next} onBack={back} nextLabel="Almost there" />
              </div>
            </div>
          )}

          {/* Step 5 — Contact */}
          {step === 5 && (
            <form onSubmit={handleSubmit}>
              <h1 style={{ fontFamily: "var(--f-serif)", fontSize: "clamp(2rem,5vw,3rem)", color: "var(--ink)", fontWeight: 300, lineHeight: 1.15, marginBottom: 12 }}>
                How can we reach you?
              </h1>
              <p style={{ fontFamily: "var(--f-body)", color: "var(--ink-soft)", marginBottom: 40, fontSize: 15 }}>
                A journey designer will be in touch within 24 hours.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
                <Field label="Full name *">
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Email *">
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Phone *">
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Summary card */}
              <div style={{ border: "1px solid var(--hair, rgba(232,220,196,0.15))", borderRadius: 4, padding: "20px 24px", marginBottom: 32, background: "var(--tint, rgba(232,220,196,0.03))" }}>
                <p style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 14 }}>Your itinerary summary</p>
                <SummaryRow label="Travel style" value={form.travelStyle || "—"} />
                <SummaryRow label="Destinations" value={form.destinations.length ? form.destinations.join(", ") : "—"} />
                <SummaryRow label="Dates" value={form.arrivalDate && form.departureDate ? `${form.arrivalDate} → ${form.departureDate}` : form.arrivalDate || "—"} />
                <SummaryRow label="Travellers" value={`${form.adults} adult${form.adults !== 1 ? "s" : ""}${form.children ? `, ${form.children} child${form.children !== 1 ? "ren" : ""}` : ""}`} />
                <SummaryRow label="Budget" value={form.budgetRange || "—"} />
              </div>

              {error && (
                <p style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "#e05252", marginBottom: 16 }}>{error}</p>
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button type="button" onClick={back} style={backBtnStyle}>← Back</button>
                <button
                  type="submit"
                  disabled={createOrder.isPending}
                  style={{
                    background: "var(--gold)",
                    color: "var(--bg)",
                    border: "none",
                    padding: "14px 36px",
                    borderRadius: 999,
                    fontFamily: "var(--f-body)",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    cursor: createOrder.isPending ? "not-allowed" : "pointer",
                    opacity: createOrder.isPending ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {createOrder.isPending ? "Sending…" : "Send Enquiry"}
                </button>
              </div>

              <p style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--ink-mute)", marginTop: 16 }}>
                We'll never share your details. By submitting you agree to our{" "}
                <Link href="/privacy-policy" style={{ color: "var(--gold)", textDecoration: "none" }}>privacy policy</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <Layout>
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 520 }}>
          <div style={{ fontFamily: "var(--f-serif)", fontSize: 48, color: "var(--gold)", marginBottom: 24 }}>✦</div>
          <h1 style={{ fontFamily: "var(--f-serif)", fontSize: "clamp(2rem,5vw,2.8rem)", color: "var(--ink)", fontWeight: 300, lineHeight: 1.2, marginBottom: 16 }}>
            Your journey begins, {name.split(" ")[0]}.
          </h1>
          <p style={{ fontFamily: "var(--f-body)", color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            We've received your itinerary. A journey designer will be in touch within 24 hours to start crafting your experience.
          </p>
          <Link
            href="/"
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--gold)",
              textDecoration: "none",
              borderBottom: "1px solid var(--hair, rgba(200,163,97,0.4))",
              paddingBottom: 2,
            }}
          >
            Return home
          </Link>
        </div>
      </div>
    </Layout>
  );
}

function StepActions({
  onNext, onBack, nextDisabled = false, nextLabel = "Continue", showBack = true,
}: {
  onNext: () => void; onBack?: () => void; nextDisabled?: boolean; nextLabel?: string; showBack?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {showBack && onBack && (
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          background: nextDisabled ? "var(--tint-strong, rgba(200,163,97,0.3))" : "var(--gold)",
          color: "var(--bg)",
          border: "none",
          padding: "14px 36px",
          borderRadius: 999,
          fontFamily: "var(--f-body)",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "0.02em",
          cursor: nextDisabled ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function CounterBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36, height: 36,
        border: "1px solid var(--hair, rgba(232,220,196,0.2))",
        borderRadius: "50%",
        background: "transparent",
        color: "var(--ink-soft)",
        fontFamily: "var(--f-body)",
        fontSize: 18,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color 0.2s, color 0.2s",
      }}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--hair-soft, rgba(232,220,196,0.08))" }}>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)" }}>{label}</span>
      <span style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--ink-soft)", maxWidth: "60%", textAlign: "right" }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "1px solid var(--hair, rgba(232,220,196,0.2))",
  borderRadius: 4,
  padding: "12px 16px",
  fontFamily: "var(--f-body)",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
};

const backBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--hair, rgba(232,220,196,0.2))",
  color: "var(--ink-soft)",
  padding: "14px 24px",
  borderRadius: 999,
  fontFamily: "var(--f-body)",
  fontSize: 14,
  cursor: "pointer",
  transition: "border-color 0.2s, color 0.2s",
};
