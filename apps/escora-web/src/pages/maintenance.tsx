import { useEffect } from "react";
import escoraLogoLight from "@assets/escora/escora-logo-light.png";

export default function MaintenancePage() {
  useEffect(() => {
    document.title = "Escora Holidays — Under Maintenance";

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute("content", "noindex, nofollow");
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1410] text-[#FAF8F3] flex flex-col items-center justify-between p-6 sm:p-10 font-sans selection:bg-[#C89B3C] selection:text-[#0A1410]">
      <div />

      <main className="max-w-md w-full text-center flex flex-col items-center my-auto">
        {/* Brand Logo */}
        <img
          src={escoraLogoLight}
          alt="Escora Holidays"
          className="h-10 sm:h-12 w-auto mb-8 opacity-95"
        />

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#FAF8F3] mb-3">
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-sm sm:text-base text-[#FAF8F3]/70 font-light leading-relaxed mb-8">
          We are currently undergoing scheduled maintenance.
          <br className="hidden sm:inline" />
          {" "}Our website will be back online shortly.
        </p>

        {/* Admin Portal Access */}
        <a
          href="/admin"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#183D2E] hover:bg-[#1E4D3A] border border-[#C89B3C]/40 text-xs font-medium text-[#FAF8F3] transition-all hover:border-[#C89B3C] cursor-pointer mb-6"
        >
          <span>Admin Portal</span>
          <span className="text-[#C89B3C]">&rarr;</span>
        </a>

        {/* Contact info */}
        <p className="text-xs text-[#FAF8F3]/50">
          For urgent inquiries:{" "}
          <a
            href="mailto:hello@escoraholidays.com"
            className="text-[#C89B3C] hover:underline"
          >
            hello@escoraholidays.com
          </a>
        </p>
      </main>

      <footer className="text-xs text-[#FAF8F3]/40 text-center">
        &copy; {new Date().getFullYear()} Escora Holidays. All rights reserved.
      </footer>
    </div>
  );
}
