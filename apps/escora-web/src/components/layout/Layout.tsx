import { useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NavbarV3 from "./NavbarV3";
import FooterV3 from "./FooterV3";
import WhatsAppFab from "./WhatsAppFab";
import MobileBottomNav from "./MobileBottomNav";
import CustomCursor from "@/components/ui/CustomCursor";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useIsV3 } from "@/lib/v3";
import "@/pages/home.css";
import "@/pages/home-v2.css";
import "@/pages/theme-v3.css";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

/* Many live pages link with plain <a href="/plan"> rather than <Link>, which
   would drop a V3 visitor back onto the live site. While in V3, intercept
   those clicks and route them through the nested router instead. */
function useKeepLinksInV3(enabled: boolean) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!enabled) return;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/v3") || href.startsWith("/api") || href.startsWith("/admin")) return;

      e.preventDefault();
      const [path, hash] = href.split("#");
      navigate(path || "/");
      if (hash) {
        setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 120);
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [enabled, navigate]);
}

export default function Layout({ children, hideFooter = false }: LayoutProps) {
  const v3 = useIsV3();
  useScrollReveal();
  useKeepLinksInV3(v3);

  return (
    <div className="min-h-[100dvh] flex flex-col w-full selection:bg-gold selection:text-bg">
      <CustomCursor />
      {v3 ? <NavbarV3 /> : <Navbar />}
      <main className="flex-1 w-full app-main">{children}</main>
      {!hideFooter && (v3 ? <FooterV3 /> : <Footer />)}
      <WhatsAppFab />
      <MobileBottomNav />
    </div>
  );
}
