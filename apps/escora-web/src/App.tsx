import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ScrollToTop from "@/components/ScrollToTop";
import SmoothScroll from "@/components/SmoothScroll";
import CinematicSplashScreen from "@/components/CinematicSplashScreen";

import Home from "@/pages/home";
import DestinationDetail from "@/pages/destination-detail";
import Journeys from "@/pages/journeys";
import JourneyDetail from "@/pages/journey-detail";
import Journal from "@/pages/journal";
import JournalDetail from "@/pages/journal-detail";
import PrivacyPolicy from "@/pages/privacy-policy";
import Plan from "@/pages/plan";
import TripPlanner from "@/pages/trip-planner";
import JourneySelect from "@/pages/journey-select";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import CategoryDetail from "@/pages/category-detail";
import ItineraryShare from "@/pages/itinerary-share";
import DestinationsV3 from "@/pages/destinations-v3";
import AiTravelAssistant from "@/components/ai/AiTravelAssistant";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/destinations" component={DestinationsV3} />
      <Route path="/destinations/:name" component={DestinationDetail} />
      <Route path="/journeys" component={Journeys} />
      <Route path="/journeys/:id" component={JourneyDetail} />
      <Route path="/journal" component={Journal} />
      <Route path="/journal/:id" component={JournalDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/plan-a-journey">{() => <Redirect to="/plan" replace />}</Route>
      <Route path="/choose-journey">{() => <Redirect to="/plan" replace />}</Route>
      <Route path="/choose-your-journey">{() => <Redirect to="/plan" replace />}</Route>
      <Route path="/plan" component={Plan} />
      <Route path="/trip-planner" component={TripPlanner} />
      <Route path="/ai-planner" component={TripPlanner} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/collections/:category" component={CategoryDetail} />
      <Route path="/itinerary/:token">
        {(params) => <ItineraryShare mode="itinerary" key={params.token} />}
      </Route>
      <Route path="/package/:token">
        {(params) => <ItineraryShare mode="package" key={params.token} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CinematicSplashScreen />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <SmoothScroll>
            <ScrollToTop />
            <Router />
          </SmoothScroll>
          <AiTravelAssistant />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
