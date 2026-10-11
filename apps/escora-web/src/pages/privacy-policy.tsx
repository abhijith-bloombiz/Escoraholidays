import Layout from "@/components/layout/Layout";
import { Link } from "wouter";
import { useSeo } from "@/hooks/useSeo";

export default function PrivacyPolicy() {
  useSeo({
    title: "Privacy Policy",
    description: "Escora's privacy policy — how we collect, use, and protect your personal information when you plan a private Kerala journey with us.",
    url: "https://www.escoraholidays.com/privacy-policy",
  });

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="relative pt-40 pb-20 bg-bg overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 60% 40%, #cbab6e 0%, transparent 60%)" }} />
        <div className="container mx-auto px-6 md:px-16 max-w-4xl">
          <p className="font-mono text-gold text-xs tracking-[0.3em] uppercase mb-6">Legal</p>
          <h1 className="font-serif text-5xl md:text-7xl text-ink font-light leading-[1.1] mb-6">
            Privacy &amp; <em className="italic text-gold">Policy</em>
          </h1>
          <p className="font-sans text-ink-mute text-base leading-relaxed max-w-xl">
            Last updated: 15 June 2026. This policy explains how Escora collects, uses, and protects
            the personal information you share with us when you plan a journey through Kerala.
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="container mx-auto px-6 md:px-16 max-w-4xl">
        <hr style={{ borderColor: "var(--line)", margin: "0 0 60px" }} />
      </div>

      {/* ── Body ── */}
      <article className="container mx-auto px-6 md:px-16 max-w-4xl pb-32 font-sans text-ink-mute leading-[1.8] space-y-14">

        {/* 1 */}
        <Section title="1. Who We Are">
          <p>
            Escora ("we", "us", "our") is a privately held destination management studio registered in Kochi,
            Kerala, India. We design and operate private journeys, wellness retreats, and curated travel
            experiences for individual and group travellers visiting Kerala.
          </p>
          <p>
            Our registered address is 1st Floor, Landmark Maple Business Tower, Kozhikode, Kerala 673014, India. You can reach our data team at{" "}
            <a href="mailto:hello@escoraholidays.com" className="text-gold hover:underline">hello@escoraholidays.com</a>.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Information We Collect">
          <p>We collect information in the following ways:</p>
          <SubList items={[
            "<strong>Enquiry &amp; booking forms</strong> — name, email address, phone number, travel dates, number of guests, budget range, and any special requests you choose to share.",
            "<strong>WhatsApp &amp; email correspondence</strong> — messages you send us through WhatsApp Business or email.",
            "<strong>Website usage data</strong> — pages visited, time on site, referral source, browser type, and approximate location (country / city level) collected via privacy-respecting analytics.",
            "<strong>Cookies &amp; local storage</strong> — session identifiers and preference data stored in your browser (see Section 7).",
            "<strong>Payment data</strong> — we do not store card numbers. Payments are processed by PCI-DSS compliant third-party gateways; we only retain transaction references and amounts.",
          ]} />
          <p>
            We do not knowingly collect information from persons under 18 years of age. If you believe a minor
            has submitted data to us, please contact us immediately.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. How We Use Your Information">
          <p>We use the data you provide to:</p>
          <SubList items={[
            "Respond to your travel enquiries and design personalised itineraries.",
            "Confirm reservations and communicate booking details.",
            "Process payments and issue invoices.",
            "Send pre-departure information, welcome letters, and post-trip follow-ups.",
            "Improve our website and services through aggregate analytics.",
            "Comply with legal obligations, including tax and record-keeping requirements under Indian law.",
          ]} />
          <p>
            We will only send marketing communications (newsletters, seasonal offers) if you have opted in
            explicitly. You may unsubscribe at any time by clicking the link in any marketing email or by
            writing to us.
          </p>
        </Section>

        {/* 4 */}
        <Section title="4. Sharing Your Information">
          <p>
            Escora does not sell, rent, or trade personal data. We share information only to the extent
            necessary to deliver your journey:
          </p>
          <SubList items={[
            "<strong>Accommodation partners</strong> — hotels, home-stays, and houseboats receive your name, arrival date, and any dietary or accessibility requirements.",
            "<strong>Activity providers</strong> — guides, Ayurveda centres, and experience operators receive names and contact details for the relevant activity.",
            "<strong>Transport vendors</strong> — drivers and vehicle operators receive pick-up details and passenger names.",
            "<strong>Payment processors</strong> — Razorpay or equivalent, solely to complete your transaction.",
            "<strong>Regulatory authorities</strong> — when required by Indian law, court order, or government request.",
          ]} />
          <p>
            All third-party partners who receive personal data are contractually required to keep it
            confidential and use it only for the purpose for which it was shared.
          </p>
        </Section>

        {/* 5 */}
        <Section title="5. International Transfers">
          <p>
            If you are visiting from outside India, your data is processed on servers located in India. By
            submitting an enquiry, you consent to this transfer. We apply appropriate safeguards consistent
            with the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable international
            standards.
          </p>
        </Section>

        {/* 6 */}
        <Section title="6. Data Retention">
          <p>
            We retain personal data for as long as necessary to fulfil the purpose for which it was collected
            and to meet our legal obligations:
          </p>
          <SubList items={[
            "<strong>Active guests</strong> — for the duration of your relationship with us.",
            "<strong>Booking records</strong> — seven years from the date of travel, as required by Indian tax law.",
            "<strong>Enquiries that did not convert</strong> — up to two years, after which data is anonymised or deleted.",
            "<strong>Analytics data</strong> — aggregated and anonymised; not subject to retention limits.",
          ]} />
        </Section>

        {/* 7 */}
        <Section title="7. Cookies">
          <p>
            Our website uses the following types of cookies:
          </p>
          <SubList items={[
            "<strong>Essential cookies</strong> — required for the site to function (session management, security tokens). Cannot be disabled.",
            "<strong>Analytics cookies</strong> — help us understand how visitors use the site. We use privacy-first analytics that do not track individuals across other websites.",
            "<strong>Preference cookies</strong> — remember settings such as your selected filter on the Journeys page.",
          ]} />
          <p>
            You can control non-essential cookies through your browser settings. Disabling analytics cookies
            will not affect your ability to use the site.
          </p>
        </Section>

        {/* 8 */}
        <Section title="8. Your Rights">
          <p>
            Under the DPDP Act, 2023 and applicable data protection principles, you have the right to:
          </p>
          <SubList items={[
            "<strong>Access</strong> — request a copy of the personal data we hold about you.",
            "<strong>Correction</strong> — ask us to correct inaccurate or incomplete data.",
            "<strong>Erasure</strong> — request deletion of your personal data, subject to legal retention obligations.",
            "<strong>Withdrawal of consent</strong> — withdraw consent for marketing communications at any time.",
            "<strong>Grievance redressal</strong> — raise a complaint with our designated Grievance Officer (see Section 10).",
          ]} />
          <p>
            To exercise any of these rights, write to{" "}
            <a href="mailto:hello@escoraholidays.com" className="text-gold hover:underline">hello@escoraholidays.com</a>.
            We will respond within 30 days.
          </p>
        </Section>

        {/* 9 */}
        <Section title="9. Security">
          <p>
            We implement industry-standard technical and organisational measures to protect your personal data
            from unauthorised access, disclosure, or loss. These include encrypted data transmission (TLS),
            access controls, and regular security reviews.
          </p>
          <p>
            No method of transmission over the internet is completely secure. If you believe your data has
            been compromised, please notify us immediately at{" "}
            <a href="mailto:hello@escoraholidays.com" className="text-gold hover:underline">hello@escoraholidays.com</a>.
          </p>
        </Section>

        {/* 10 */}
        <Section title="10. Grievance Officer">
          <p>
            In accordance with the Information Technology Act, 2000 and applicable rules, the name and
            contact details of our Grievance Officer are:
          </p>
          <div style={{
            border: "1px solid var(--line)",
            padding: "28px 32px",
            marginTop: "16px",
            fontFamily: "var(--f-mono)",
            fontSize: "13px",
            lineHeight: "2",
            letterSpacing: "0.05em",
            color: "var(--ink)",
          }}>
            <div><span style={{ color: "var(--gold)" }}>Name</span> · Midhilaj</div>
            <div><span style={{ color: "var(--gold)" }}>Role</span> · CEO, Escora</div>
            <div><span style={{ color: "var(--gold)" }}>Email</span> · <a href="mailto:hello@escoraholidays.com" className="hover:underline">hello@escoraholidays.com</a></div>
            <div><span style={{ color: "var(--gold)" }}>Phone</span> · +91 8157 003 344</div>
            <div><span style={{ color: "var(--gold)" }}>Address</span> · 1st Floor, Landmark Maple Business Tower, Kozhikode, Kerala 673014, India</div>
            <div><span style={{ color: "var(--gold)" }}>Hours</span> · Monday – Saturday, 09:00 – 18:00 IST</div>
          </div>
        </Section>

        {/* 11 */}
        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or
            applicable law. We will post the updated policy on this page with a revised "last updated"
            date. For material changes, we will notify you by email if we hold your contact details.
          </p>
          <p>
            Your continued use of the website or our services after any changes constitutes your acceptance
            of the revised policy.
          </p>
        </Section>

        {/* Back link */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
          <Link href="/" className="font-mono text-gold text-xs tracking-[0.25em] uppercase hover:opacity-70 transition-opacity">
            ← Back to Home
          </Link>
        </div>

      </article>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontFamily: "var(--f-serif)",
        fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
        fontWeight: 300,
        color: "var(--ink)",
        letterSpacing: "-0.01em",
        lineHeight: 1.2,
        marginBottom: "20px",
      }}>
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function SubList({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: "0", listStyle: "none", margin: "8px 0" }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: "flex",
          gap: "16px",
          padding: "10px 0",
          borderBottom: "1px solid var(--line)",
          fontSize: "0.9375rem",
          lineHeight: "1.7",
        }}>
          <span style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px", fontSize: "10px" }}>◆</span>
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  );
}
