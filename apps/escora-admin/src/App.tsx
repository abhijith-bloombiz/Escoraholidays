import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import DestinationsPage from "@/pages/DestinationsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import TestimonialsPage from "@/pages/TestimonialsPage";
import PackagesPage from "@/pages/PackagesPage";
import ItinerariesPage from "@/pages/ItinerariesPage";
import ItineraryDetailPage from "@/pages/ItineraryDetailPage";
import ItineraryCreatePage from "@/pages/ItineraryCreatePage";
import ItineraryBuilderPage from "@/pages/ItineraryBuilderPage";
import InvoicesPage from "@/pages/InvoicesPage";
import InvoiceBuilderPage from "@/pages/InvoiceBuilderPage";
import OrdersPage from "@/pages/OrdersPage";
import JournalPage from "@/pages/JournalPage";
import MediaPage from "@/pages/MediaPage";
import EnquiriesPage from "@/pages/EnquiriesPage";
import CampaignsPage from "@/pages/CampaignsPage";
import WhatsAppPage from "@/pages/WhatsAppPage";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import ItineraryPdfPreviewPage from "@/pages/ItineraryPdfPreviewPage";
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
          fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: "24px",
          fontWeight: 400,
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
        <Route path="/categories" component={CategoriesPage} />
        <Route path="/packages" component={PackagesPage} />
        <Route path="/itineraries/create" component={ItineraryCreatePage} />
        <Route path="/itinerary/create" component={ItineraryBuilderPage} />
        <Route path="/itineraries/new" component={ItineraryBuilderPage} />
        <Route path="/itinerary/new" component={ItineraryBuilderPage} />
        <Route path="/itineraries/:id/edit" component={ItineraryBuilderPage} />
        <Route path="/itinerary/:id/edit" component={ItineraryBuilderPage} />
        <Route path="/itineraries/:id" component={ItineraryDetailPage} />
        <Route path="/itinerary/:id" component={ItineraryDetailPage} />
        <Route path="/itineraries" component={ItinerariesPage} />
        <Route path="/invoices/new" component={InvoiceBuilderPage} />
        <Route path="/invoices/:id/edit" component={InvoiceBuilderPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/journal" component={JournalPage} />
        <Route path="/testimonials" component={TestimonialsPage} />
        <Route path="/media" component={MediaPage} />
        <Route path="/enquiries" component={EnquiriesPage} />
        <Route path="/campaigns" component={CampaignsPage} />
        <Route path="/whatsapp" component={WhatsAppPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/preview-itinerary" component={ItineraryPdfPreviewPage} />
      <Route>
        <AuthProvider>
          <ProtectedRouter />
        </AuthProvider>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
