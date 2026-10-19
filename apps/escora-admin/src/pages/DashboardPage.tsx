import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Package,
  ShoppingBag,
  BookOpen,
  CheckCircle2,
  Clock,
  IndianRupee,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Mail,
} from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Format currency using clean Indian numbering conventions without awkward values like "₹0.0L".
 * Examples: ₹0, ₹20,000, ₹4.50 Lakhs, ₹1.25 Cr.
 */
export function formatIndianCurrency(amount?: number | null): { formatted: string; full: string } {
  if (amount === undefined || amount === null || Number.isNaN(amount) || amount === 0) {
    return { formatted: "₹0", full: "₹0" };
  }
  const abs = Math.abs(amount);
  const full = `₹${abs.toLocaleString("en-IN")}`;
  if (abs < 100000) {
    return { formatted: `₹${abs.toLocaleString("en-IN")}`, full };
  }
  if (abs < 10000000) {
    const inLakhs = abs / 100000;
    const formatted = `₹${inLakhs.toFixed(inLakhs >= 10 ? 1 : 2)} Lakh${inLakhs === 1 ? "" : "s"}`;
    return { formatted, full };
  }
  const inCrores = abs / 10000000;
  return { formatted: `₹${inCrores.toFixed(2)} Cr`, full };
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  href,
  badgeBg,
  iconColor,
  testId,
  tooltip,
}: {
  title: string;
  value: string | number | undefined;
  sub?: string;
  icon: React.ElementType;
  href?: string;
  badgeBg: string;
  iconColor: string;
  testId: string;
  tooltip?: string;
}) {
  const cardContent = (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E5E3D8] shadow-xs p-5 transition-all duration-200 flex flex-col justify-between h-full min-h-[135px]",
        href ? "hover:border-[#D5D2C4] hover:shadow-sm cursor-pointer group" : ""
      )}
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#687D75] select-none">{title}</span>
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform",
            badgeBg,
            href ? "group-hover:scale-105" : ""
          )}
        >
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>

      <div className="my-2">
        {value === undefined ? (
          <Skeleton className="h-9 w-20 my-1 bg-[#F2F1E7]" />
        ) : (
          <div
            className="text-3xl font-serif font-semibold text-[#172923] tracking-tight tabular-nums"
            title={tooltip}
          >
            {value}
          </div>
        )}
      </div>

      {sub && <p className="text-xs font-sans text-[#687D75] select-none">{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default function DashboardPage() {
  const { data: stats, isLoading, isFetching, refetch } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 30000 },
  });
  const { toast } = useToast();
  const lastOrderCount = useRef<number | null>(null);
  const lastEnquiryCount = useRef<number | null>(null);
  const [currentDate] = useState(() =>
    new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date())
  );

  useEffect(() => {
    if (!stats) return;
    const prevOrders = lastOrderCount.current;
    const prevEnquiries = lastEnquiryCount.current;
    if (prevOrders !== null && stats.totalOrders > prevOrders) {
      toast({
        title: "New booking enquiry received!",
        description: `You have ${stats.totalOrders - prevOrders} new enquiry.`,
      });
    }
    if (prevEnquiries !== null && (stats.newContactEnquiries ?? 0) > prevEnquiries) {
      toast({
        title: "New contact message",
        description: "Someone sent a message via the Contact page.",
      });
    }
    lastOrderCount.current = stats.totalOrders;
    lastEnquiryCount.current = stats.newContactEnquiries ?? 0;
  }, [stats?.totalOrders, stats?.newContactEnquiries, toast]);

  const revenueDisplay = formatIndianCurrency(stats?.totalRevenue);

  return (
    <div data-testid="dashboard-page" className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Editorial Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#172923] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#687D75] mt-1 font-sans">
            {currentDate} · Overview of Escora's travel operations
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F5F4EC] border border-[#E5E3D8] text-xs font-medium text-[#172923] transition-colors disabled:opacity-50 shadow-xs cursor-pointer self-start sm:self-auto"
          title="Refresh dashboard data"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 text-[#687D75]",
              isFetching && "animate-spin text-[#183D2E]"
            )}
          />
          <span>{isFetching ? "Updating..." : "Refresh"}</span>
        </button>
      </div>

      {/* Row 1: Catalog & Publishing Overview Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Destinations"
          value={isLoading ? undefined : stats?.totalDestinations}
          sub={`${stats?.publishedDestinations ?? "—"} published`}
          icon={MapPin}
          badgeBg="bg-[#E8F3EE]"
          iconColor="text-[#183D2E]"
          href="/destinations"
          testId="stat-card-destinations"
        />
        <StatCard
          title="Journeys"
          value={isLoading ? undefined : stats?.totalPackages}
          sub={`${stats?.publishedPackages ?? "—"} published`}
          icon={Package}
          badgeBg="bg-[#FDF4E7]"
          iconColor="text-[#B57529]"
          href="/packages"
          testId="stat-card-journeys"
        />
        <StatCard
          title="Enquiries"
          value={isLoading ? undefined : stats?.totalOrders}
          sub={`${stats?.enquiries ?? "—"} open · ${stats?.confirmed ?? "—"} confirmed`}
          icon={Mail}
          badgeBg="bg-[#FEF0EA]"
          iconColor="text-[#D96534]"
          href="/orders"
          testId="stat-card-enquiries"
        />
        <StatCard
          title="Journal Posts"
          value={isLoading ? undefined : stats?.totalJournalPosts}
          sub={`${stats?.publishedJournalPosts ?? "—"} published`}
          icon={BookOpen}
          badgeBg="bg-[#EDF4FD]"
          iconColor="text-[#2B6CB0]"
          href="/journal"
          testId="stat-card-journal-posts"
        />
      </div>

      {/* Row 2: Operational Status & Revenue Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Enquiries"
          value={isLoading ? undefined : (stats?.enquiries ?? 0)}
          sub="Awaiting response"
          icon={Clock}
          badgeBg="bg-[#FDF4E7]"
          iconColor="text-[#B57529]"
          href="/orders"
          testId="stat-enquiries-open"
        />
        <StatCard
          title="Confirmed Bookings"
          value={isLoading ? undefined : (stats?.confirmed ?? 0)}
          sub="Guests confirmed"
          icon={CheckCircle2}
          badgeBg="bg-[#E8F3EE]"
          iconColor="text-[#183D2E]"
          href="/orders"
          testId="stat-confirmed"
        />
        <StatCard
          title="Total Revenue"
          value={isLoading ? undefined : revenueDisplay.formatted}
          sub="Collected from paid invoices"
          icon={IndianRupee}
          badgeBg="bg-[#E8F3EE]"
          iconColor="text-[#183D2E]"
          testId="stat-revenue"
          tooltip={`Exact collected revenue: ${revenueDisplay.full}`}
        />
        <StatCard
          title="Contact Inbox"
          value={isLoading ? undefined : (stats?.newContactEnquiries ?? 0)}
          sub="Unread messages"
          icon={MessageSquare}
          badgeBg="bg-[#EDF4FD]"
          iconColor="text-[#2B6CB0]"
          href="/enquiries"
          testId="stat-contact-inbox"
        />
      </div>

      {/* Row 3: Quick Actions (Compact Horizontal Layout on Desktop) */}
      <div className="bg-white rounded-xl border border-[#E5E3D8] shadow-xs p-6">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[#172923]">
            Quick Actions
          </h2>
          <p className="text-xs sm:text-sm text-[#687D75] mt-0.5 font-sans">
            Shortcuts for common tasks
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {[
            {
              href: "/packages",
              label: "Add Journey",
              desc: "Create a new package",
              icon: Package,
              badgeBg: "bg-[#FDF4E7]",
              iconColor: "text-[#B57529]",
              testId: "quick-action-add-journey",
            },
            {
              href: "/destinations",
              label: "Add Destination",
              desc: "Register a new location",
              icon: MapPin,
              badgeBg: "bg-[#E8F3EE]",
              iconColor: "text-[#183D2E]",
              testId: "quick-action-add-destination",
            },
            {
              href: "/journal",
              label: "Write Article",
              desc: "Publish to the journal",
              icon: BookOpen,
              badgeBg: "bg-[#EDF4FD]",
              iconColor: "text-[#2B6CB0]",
              testId: "quick-action-write-article",
            },
            {
              href: "/orders",
              label: "View Enquiries",
              desc: "Respond to guests",
              icon: ShoppingBag,
              badgeBg: "bg-[#E8F3EE]",
              iconColor: "text-[#183D2E]",
              testId: "quick-action-view-enquiries",
            },
          ].map(({ href, label, desc, icon: Icon, badgeBg, iconColor, testId }) => (
            <Link key={href} href={href} className="block">
              <div
                data-testid={testId}
                className="p-3.5 rounded-lg border border-[#EAE8DF] bg-white hover:bg-[#FAF8F3] hover:border-[#D5D2C4] transition-all duration-200 cursor-pointer group flex items-center justify-between h-full"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                      badgeBg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", iconColor)} />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium text-[#172923] group-hover:text-[#183D2E] transition-colors truncate">
                      {label}
                    </div>
                    <div className="text-xs text-[#687D75] mt-0.5 truncate">{desc}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#687D75]/70 group-hover:text-[#183D2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
