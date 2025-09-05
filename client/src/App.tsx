import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/index";
import CampaignsPage from "@/pages/campaigns";
import CampaignDetailPage from "@/pages/campaign/[id]";
import CreateCampaignPage from "@/pages/create-campaign";
import ProfilePage from "@/pages/profile";
import DonationsPage from "@/pages/donations";
import FundsPage from "@/pages/funds";
import DailyRewardsPage from "@/pages/daily-rewards";
import PaymentPage from "@/pages/payment";
import AffiliatePage from "@/pages/affiliate";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminDailyRewardsPage from "@/pages/admin/daily-rewards";
import AdminDatabasePage from "@/pages/admin/database";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/campaigns" component={CampaignsPage} />
      <Route path="/donations" component={DonationsPage} />
      <Route path="/funds" component={FundsPage} />
      <Route path="/daily-rewards" component={DailyRewardsPage} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/affiliate" component={AffiliatePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/campaign/:id" component={CampaignDetailPage} />
      <Route path="/create-campaign" component={CreateCampaignPage} />
      <Route path="/admin/settings" component={AdminSettingsPage} />
      <Route path="/admin/daily-rewards" component={AdminDailyRewardsPage} />
      <Route path="/admin/database" component={AdminDatabasePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
