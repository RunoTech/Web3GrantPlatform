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
import VirtualPosPage from "@/pages/virtual-pos";
import AdminLoginPage from "@/pages/admin/login";
import AdminDashboardPage from "@/pages/admin/index";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminDailyRewardsPage from "@/pages/admin/daily-rewards";
import AdminDatabasePage from "@/pages/admin/database";

// Static Pages
import {
  AboutPage,
  MissionPage,
  TechnologyPage,
  CareersPage,
  PressPage,
  NewsPage,
  HelpPage,
  FaqPage,
  ContactPage,
  DocsPage,
  ApiDocsPage,
  SecurityPage,
  TermsPage,
  PrivacyPage,
  CookiesPage,
  CompliancePage,
  AmlPage,
  RiskPage
} from "@/pages/static-pages";

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
      <Route path="/profile" component={ProfilePage} />
      <Route path="/campaign/:id" component={CampaignDetailPage} />
      <Route path="/create-campaign" component={CreateCampaignPage} />
      
      {/* Static Pages */}
      {/* Company */}
      <Route path="/about" component={AboutPage} />
      <Route path="/mission" component={MissionPage} />
      <Route path="/technology" component={TechnologyPage} />
      <Route path="/careers" component={CareersPage} />
      <Route path="/press" component={PressPage} />
      <Route path="/news" component={NewsPage} />
      
      {/* Support */}
      <Route path="/help" component={HelpPage} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/api-docs" component={ApiDocsPage} />
      <Route path="/security" component={SecurityPage} />
      
      {/* Legal */}
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/aml" component={AmlPage} />
      <Route path="/risk" component={RiskPage} />
      
      {/* Admin Routes */}
      <Route path="/youhonor/login" component={AdminLoginPage} />
      <Route path="/youhonor" component={AdminDashboardPage} />
      <Route path="/youhonor/settings" component={AdminSettingsPage} />
      <Route path="/youhonor/daily-rewards" component={AdminDailyRewardsPage} />
      <Route path="/youhonor/database" component={AdminDatabasePage} />
      
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
