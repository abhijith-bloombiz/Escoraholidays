import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import DestinationsPage from "@/pages/DestinationsPage";
import PackagesPage from "@/pages/PackagesPage";
import ItinerariesPage from "@/pages/ItinerariesPage";
import ItineraryBuilderPage from "@/pages/ItineraryBuilderPage";
import OrdersPage from "@/pages/OrdersPage";
import JournalPage from "@/pages/JournalPage";
import MediaPage from "@/pages/MediaPage";
import EnquiriesPage from "@/pages/EnquiriesPage";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function ProtectedRouter() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1a12",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "24px",
          fontWeight: 300,
          color: "#cbab6e",
          letterSpacing: "0.1em",
        }}>
          Escora
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/destinations" component={DestinationsPage} />
        <Route path="/packages" component={PackagesPage} />
        <Route path="/itineraries/new" component={ItineraryBuilderPage} />
        <Route path="/itineraries/:id/edit" component={ItineraryBuilderPage} />
        <Route path="/itineraries" component={ItinerariesPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/journal" component={JournalPage} />
        <Route path="/media" component={MediaPage} />
        <Route path="/enquiries" component={EnquiriesPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <ProtectedRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
