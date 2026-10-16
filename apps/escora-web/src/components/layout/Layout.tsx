import { useEffect } from "react";
import NavbarV3 from "./NavbarV3";
import FooterV3 from "./FooterV3";
import WhatsAppFab from "./WhatsAppFab";
import MobileBottomNav from "./MobileBottomNav";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import "@/pages/home-v2.css";
import "@/pages/theme-v3.css";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export default function Layout({ children, hideFooter = false }: LayoutProps) {
  useScrollReveal();

  useEffect(() => {
    document.documentElement.classList.add("theme-v3");
    document.documentElement.classList.remove("has-focus-cursor");
    document.body.style.cursor = "";
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col w-full selection:bg-gold selection:text-bg">
      <NavbarV3 />
      <main className="flex-1 w-full app-main">{children}</main>
      {!hideFooter && <FooterV3 />}
      <WhatsAppFab />
      <MobileBottomNav />
    </div>
  );
}
