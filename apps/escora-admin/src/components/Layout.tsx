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
  ChevronRight,
  LogOut,
  NotebookText,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import escoraWordmarkPath from "@assets/escora/escora-wordmark.png";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/destinations", label: "Destinations", icon: MapPin },
  { href: "/packages", label: "Journeys", icon: Package },
  { href: "/itineraries", label: "Itineraries", icon: NotebookText },
  { href: "/orders", label: "Bookings", icon: ShoppingBag },
  { href: "/enquiries", label: "Inbox", icon: MessageSquare },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/media", label: "Media", icon: Image },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, username } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
          <img src={escoraWordmarkPath} alt="Escora" className="h-7 brightness-200 opacity-90" />
          <span className="ml-2 text-xs font-mono text-sidebar-foreground/50 tracking-widest uppercase mt-0.5">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="h-3 w-3 ml-auto text-sidebar-primary/60" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          {username && (
            <p className="text-xs text-sidebar-foreground/50 font-mono truncate">{username}</p>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-50">
            <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
              <img src={escoraWordmarkPath} alt="Escora" className="h-7 brightness-200 opacity-90" />
              <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? location === "/" : location.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center h-14 px-4 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="mr-3 text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <img src={escoraWordmarkPath} alt="Escora" className="h-6 opacity-90" />
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
