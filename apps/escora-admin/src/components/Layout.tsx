import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingBag,
  BookOpen,
  Image,
  MessageSquare,
  Menu,
  X,
  LogOut,
  NotebookText,
  Mail,
  ReceiptText,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import escoraWordmarkPath from "@assets/escora/escora-logo-dark.png";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/destinations", label: "Destinations", icon: MapPin },
  { href: "/packages", label: "Journeys", icon: Package },
  { href: "/itineraries", label: "Itineraries", icon: NotebookText },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/orders", label: "Bookings", icon: ShoppingBag },
  { href: "/enquiries", label: "Inbox", icon: MessageSquare },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/media", label: "Media", icon: Image },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0 select-none">
        {/* Brand Area */}
        <div className="pt-6 pb-4 px-6">
          <img src={escoraWordmarkPath} alt="Escora" className="h-7 opacity-90" />
          <div className="text-[10px] font-sans font-medium text-[#687D75] tracking-widest uppercase mt-1">
            Admin
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-[#183D2E] text-[#FAF8F3] shadow-xs"
                    : "text-[#172923]/80 hover:text-[#172923] hover:bg-[#E8E6DC]"
                )}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[#FAF8F3]" : "text-[#172923]/70")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sign Out */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#172923]/80 hover:text-[#172923] hover:bg-[#E8E6DC] transition-colors cursor-pointer"
            data-testid="nav-sign-out"
          >
            <LogOut className="h-4 w-4 flex-shrink-0 text-[#687D75]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-50 shadow-xl">
            <div className="flex items-center justify-between pt-6 pb-4 px-6">
              <div>
                <img src={escoraWordmarkPath} alt="Escora" className="h-7 opacity-90" />
                <div className="text-[10px] font-sans font-medium text-[#687D75] tracking-widest uppercase mt-1">
                  Admin
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-[#687D75] hover:text-[#172923] p-1 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? location === "/" : location.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      active
                        ? "bg-[#183D2E] text-[#FAF8F3]"
                        : "text-[#172923]/80 hover:text-[#172923] hover:bg-[#E8E6DC]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[#FAF8F3]" : "text-[#172923]/70")} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 mt-auto">
              <button
                onClick={() => logout()}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#172923]/80 hover:text-[#172923] hover:bg-[#E8E6DC] transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 flex-shrink-0 text-[#687D75]" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-[#FAF8F3] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-[#172923]/70 hover:text-[#172923] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <img src={escoraWordmarkPath} alt="Escora" className="h-6 opacity-90" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
