import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Package, ShoppingBag, BookOpen, CheckCircle, Clock, IndianRupee, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  href,
  color = "text-primary",
}: {
  title: string;
  value: number | undefined;
  sub?: string;
  icon: React.ElementType;
  href: string;
  color?: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, "-")}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
        </CardHeader>
        <CardContent>
          {value === undefined ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-3xl font-serif text-foreground">{value}</div>
          )}
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 30000 },
  });
  const { toast } = useToast();
  const lastOrderCount = useRef<number | null>(null);
  const lastEnquiryCount = useRef<number | null>(null);

  useEffect(() => {
    if (!stats) return;
    const prevOrders = lastOrderCount.current;
    const prevEnquiries = lastEnquiryCount.current;
    if (prevOrders !== null && stats.totalOrders > prevOrders) {
      toast({ title: `New booking enquiry received!`, description: `You have ${stats.totalOrders - prevOrders} new enquiry.` });
    }
    if (prevEnquiries !== null && (stats.newContactEnquiries ?? 0) > prevEnquiries) {
      toast({ title: "New contact message", description: "Someone sent a message via the Contact page." });
    }
    lastOrderCount.current = stats.totalOrders;
    lastEnquiryCount.current = stats.newContactEnquiries ?? 0;
  }, [stats?.totalOrders, stats?.newContactEnquiries]);

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of Escora's travel operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Destinations"
          value={isLoading ? undefined : stats?.totalDestinations}
          sub={`${stats?.publishedDestinations ?? "—"} published`}
          icon={MapPin}
          href="/destinations"
          color="text-green-600"
        />
        <StatCard
          title="Journeys"
          value={isLoading ? undefined : stats?.totalPackages}
          sub={`${stats?.publishedPackages ?? "—"} published`}
          icon={Package}
          href="/packages"
          color="text-primary"
        />
        <StatCard
          title="Enquiries"
          value={isLoading ? undefined : stats?.totalOrders}
          sub={`${stats?.enquiries ?? "—"} open · ${stats?.confirmed ?? "—"} confirmed`}
          icon={ShoppingBag}
          href="/orders"
          color="text-amber-600"
        />
        <StatCard
          title="Journal Posts"
          value={isLoading ? undefined : stats?.totalJournalPosts}
          sub={`${stats?.publishedJournalPosts ?? "—"} published`}
          icon={BookOpen}
          href="/journal"
          color="text-blue-600"
        />
      </div>

      {/* Revenue & Status Row */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card data-testid="stat-enquiries-open">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Enquiries</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 opacity-70" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-serif text-amber-600">{stats?.enquiries ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-confirmed">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 opacity-70" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-serif text-green-600">{stats?.confirmed ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Guests confirmed</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-revenue">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary opacity-70" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-3xl font-serif text-foreground">
                ₹{((stats?.totalRevenue ?? 0) / 100000).toFixed(1)}L
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across all bookings</p>
          </CardContent>
        </Card>

        <Link href="/enquiries">
          <Card data-testid="stat-contact-inbox" className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contact Inbox</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-serif text-blue-600">{stats?.newContactEnquiries ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Unread messages</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {[
            { href: "/packages", label: "Add Journey", desc: "Create a new package" },
            { href: "/destinations", label: "Add Destination", desc: "Register a new location" },
            { href: "/journal", label: "Write Article", desc: "Publish to the journal" },
            { href: "/orders", label: "View Enquiries", desc: "Respond to guests" },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href}>
              <div className="p-3 rounded-md border border-border hover:bg-accent/50 transition-colors cursor-pointer" data-testid={`quick-action-${label.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
