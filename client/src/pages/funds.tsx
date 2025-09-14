import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { 
  Heart, 
  ArrowLeft, 
  Trophy,
  Gift,
  DollarSign,
  Users,
  Wallet as WalletIcon,
  Calendar,
  Award,
  Star,
  Clock,
  Copy,
  CheckCircle,
  Coins,
  Building
} from "lucide-react";
import type { DailyWinner, Campaign } from "@shared/schema";
import CampaignCard from "@/components/CampaignCard";

export default function FundsPage() {

  // Fetch FUND campaigns
  const { data: fundCampaigns = [], isLoading: fundsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/get-campaigns"],
    select: (data) => data.filter(campaign => campaign.campaignType === 'FUND')
  });


  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header currentPage="funds" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Home
          </Link>
        </Button>

        {/* Funds Header Section */}
        <div className="card-standard section-spacing-lg mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3">
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 icon-accent" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                FUNDS
              </h1>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4 max-w-2xl mx-auto px-4">
              Corporate Fundraising Platform - Unlimited funding campaigns for companies
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Button 
              asChild
              className="btn-binance hover:transform hover:-translate-y-0.5 font-semibold px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto text-sm sm:text-base"
            >
              <Link href="/create-campaign?type=fund">
                <Building className="w-4 h-4 mr-2 icon-on-primary" />
                Create FUND Campaign
              </Link>
            </Button>
            
            <Button 
              asChild
              variant="outline"
              className="btn-secondary hover:transform hover:-translate-y-0.5 font-semibold px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto text-sm sm:text-base"
            >
              <Link href="/campaigns">
                <Trophy className="w-4 h-4 mr-2 icon-primary" />
                View All Campaigns
              </Link>
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="card-standard p-3 sm:p-4 text-center">
              <Building className="w-6 h-6 sm:w-8 sm:h-8 icon-accent mx-auto mb-1 sm:mb-2" />
              <h3 className="text-xs sm:text-sm font-bold text-foreground mb-1">Companies Only</h3>
              <p className="text-xs text-muted-foreground">Only registered companies</p>
            </div>
            
            <div className="card-standard p-4 text-center">
              <Clock className="w-8 h-8 text-success mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground mb-1">Unlimited</h3>
              <p className="text-xs text-muted-foreground">No end date</p>
            </div>
            
            <div className="card-standard p-4 text-center">
              <Heart className="w-8 h-8 icon-accent mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground mb-1">Zero Commission</h3>
              <p className="text-xs text-muted-foreground">Direct to wallet</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="card-standard p-3 text-center">
            <DollarSign className="w-6 h-6 text-success mx-auto mb-1" />
            <h3 className="text-lg font-bold text-foreground">50 USDT</h3>
            <p className="text-xs text-muted-foreground">Activation Fee</p>
          </Card>
          
          <Card className="card-standard p-3 text-center">
            <Clock className="w-6 h-6 icon-accent mx-auto mb-1" />
            <h3 className="text-lg font-bold text-foreground">∞</h3>
            <p className="text-xs text-muted-foreground">Duration</p>
          </Card>
          
          <Card className="card-standard p-3 text-center">
            <Building className="w-6 h-6 text-success mx-auto mb-1" />
            <h3 className="text-lg font-bold text-foreground">Companies</h3>
            <p className="text-xs text-muted-foreground">Corporate Only</p>
          </Card>
        </div>

        {/* Recent Winners Section */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground uppercase tracking-wide">
              Active Corporate FUND Campaigns
            </h2>
            <p className="text-muted-foreground">
              Unlimited duration corporate fundraising campaigns
            </p>
          </div>

          {fundsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="card-standard p-6 animate-pulse">
                  <div className="space-y-4">
                    <div className="w-full h-48 bg-muted rounded-xl"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : fundCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundCampaigns.map((campaign) => (
                <div key={campaign.id} className="relative">
                  <CampaignCard campaign={campaign} />
                  {/* Company Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-primary text-primary-foreground border-0 shadow-binance font-semibold">
                      <Building className="w-3 h-3 mr-1 icon-on-primary" />
                      COMPANY FUND
                    </Badge>
                  </div>
                  {/* Target Amount Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-success text-white border-0 shadow-binance font-semibold">
                      Target: {parseFloat(campaign.targetAmount || '0').toLocaleString()} USDT
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="card-standard p-12 text-center">
              <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Corporate FUND Campaigns Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first company to create a FUND campaign on our platform!
              </p>
              <Button asChild className="btn-binance">
                <Link href="/create-campaign?type=fund">
                  <Building className="w-4 h-4 mr-2 icon-on-primary" />
                  Create Company FUND
                </Link>
              </Button>
            </Card>
          )}
        </div>

        {/* How It Works Section */}
        <div className="space-y-6 mt-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-standard p-4 text-center">
              <div className="w-10 h-10 btn-binance rounded-full flex items-center justify-center mx-auto mb-2">
                <Building className="w-5 h-5 icon-on-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">1. Register</h3>
              <p className="text-xs text-muted-foreground">
                Provide company details and pay 50 USDT activation fee
              </p>
            </Card>

            <Card className="card-standard p-4 text-center">
              <div className="w-10 h-10 btn-binance rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-5 h-5 icon-on-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">2. Create FUND</h3>
              <p className="text-xs text-muted-foreground">
                Launch unlimited duration fundraising campaign
              </p>
            </Card>

            <Card className="card-standard p-4 text-center">
              <div className="w-10 h-10 btn-binance rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 icon-on-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">3. Receive Funds</h3>
              <p className="text-xs text-muted-foreground">
                All investments go directly to your wallet
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}