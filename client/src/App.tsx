import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/index";
import CampaignsPage from "@/pages/campaigns";
import CampaignDetailPage from "@/pages/campaign/[id]";
import CreateCampaignPage from "@/pages/create-campaign";
import ProfilePage from "@/pages/profile";
import DonationsPage from "@/pages/donations";
import FundsPage from "@/pages/funds";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/campaigns" component={CampaignsPage} />
      <Route path="/donations" component={DonationsPage} />
      <Route path="/funds" component={FundsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/campaign/:id" component={CampaignDetailPage} />
      <Route path="/create-campaign" component={CreateCampaignPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
