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
import DailyRewardsPage from "@/pages/daily-rewards";
import PaymentPage from "@/pages/payment";
import VirtualPosPage from "@/pages/virtual-pos";
import AffiliatePage from "@/pages/affiliate";
import AdminLoginPage from "@/pages/admin/login";
import AdminDashboardPage from "@/pages/admin/index";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminDailyRewardsPage from "@/pages/admin/daily-rewards";
import AdminDatabasePage from "@/pages/admin/database";
import AdminAffiliatesPage from "@/pages/admin/affiliates";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/campaigns" component={CampaignsPage} />
      <Route path="/donations" component={DonationsPage} />
      <Route path="/funds" component={FundsPage} />
      <Route path="/daily-rewards" component={DailyRewardsPage} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/virtual-pos" component={VirtualPosPage} />
      <Route path="/affiliate" component={AffiliatePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/campaign/:id" component={CampaignDetailPage} />
      <Route path="/create-campaign" component={CreateCampaignPage} />
      
      {/* Admin Routes */}
      <Route path="/youhonor/login" component={AdminLoginPage} />
      <Route path="/youhonor" component={AdminDashboardPage} />
      <Route path="/youhonor/settings" component={AdminSettingsPage} />
      <Route path="/youhonor/daily-rewards" component={AdminDailyRewardsPage} />
      <Route path="/youhonor/database" component={AdminDatabasePage} />
      <Route path="/youhonor/affiliates" component={AdminAffiliatesPage} />
      
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
