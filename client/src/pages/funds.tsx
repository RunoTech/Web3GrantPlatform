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
    <div className="min-h-screen bg-white 
      <Header currentPage="funds" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Home
          </Link>
        </Button>

        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <DollarSign className="w-8 h-8 icon-accent" />
            <h1 className="text-3xl font-bold text-foreground">FUNDS</h1>
          </div>
          
          {/* Essential Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              className="btn-binance font-semibold px-6 py-3 w-full sm:w-auto"
            >
              <Link href="/create-campaign?type=fund">
                <Building className="w-4 h-4 mr-2 icon-on-primary" />
                Create FUND Campaign
              </Link>
            </Button>
            
            <Button 
              asChild
              variant="outline"
              className="btn-secondary font-semibold px-6 py-3 w-full sm:w-auto"
            >
              <Link href="/campaigns">
                <Trophy className="w-4 h-4 mr-2 icon-primary" />
                View All Campaigns
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Winners Section */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Active FUND Campaigns
            </h2>
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
              <h3 className="text-xl font-semibold text-foreground mb-2">No FUND Campaigns Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create a FUND campaign!
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

      </div>
    </div>
  );
}