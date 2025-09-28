import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  Building,
  Shield,
  XCircle,
  AlertCircle,
  Filter
} from "lucide-react";
import type { DailyWinner, Campaign } from "@shared/schema";
import CampaignCard from "@/components/CampaignCard";

interface FundCampaignWithVerification extends Campaign {
  verificationStatus?: 'pending' | 'reviewing' | 'approved' | 'rejected' | null;
  verificationId?: number | null;
  verifiedAt?: string | null;
  verifiedBy?: number | null;
}

// Verification badge helper function
const getVerificationBadge = (status?: string | null) => {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-green-600 text-white border-0 shadow-binance font-semibold" data-testid="badge-verified">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    case 'pending':
    case 'reviewing':
      return (
        <Badge className="bg-amber-600 text-white border-0 shadow-binance font-semibold" data-testid="badge-pending">
          <Clock className="w-3 h-3 mr-1" />
          Pending KYB
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-red-600 text-white border-0 shadow-binance font-semibold" data-testid="badge-rejected">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-600 text-white border-0 shadow-binance font-semibold" data-testid="badge-unverified">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unverified
        </Badge>
      );
  }
};

// Empty state content helper
const getEmptyStateContent = (filter: string, totalCampaigns: number) => {
  if (totalCampaigns === 0) {
    return (
      <>
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
      </>
    );
  }

  const emptyMessages = {
    verified: {
      icon: CheckCircle,
      title: "No Verified FUND Campaigns",
      description: "No companies have completed KYB verification yet."
    },
    pending: {
      icon: Clock,
      title: "No Pending Verifications",
      description: "All FUND campaigns have been processed."
    },
    rejected: {
      icon: XCircle,
      title: "No Rejected Campaigns",
      description: "No FUND campaigns have been rejected."
    },
    unverified: {
      icon: AlertCircle,
      title: "No Unverified Campaigns",
      description: "All companies have started the verification process."
    }
  };

  const config = emptyMessages[filter as keyof typeof emptyMessages];
  if (!config) return null;

  const IconComponent = config.icon;
  
  return (
    <>
      <IconComponent className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">{config.title}</h3>
      <p className="text-muted-foreground mb-6">{config.description}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        <Filter className="w-4 h-4 mr-2" />
        Reset Filters
      </Button>
    </>
  );
};

export default function FundsPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Fetch FUND campaigns with verification status
  const { data: fundCampaigns = [], isLoading: fundsLoading } = useQuery<FundCampaignWithVerification[]>({
    queryKey: ["/api/get-fund-campaigns"]
  });

  // Filter campaigns based on verification status
  const filteredCampaigns = fundCampaigns.filter(campaign => {
    switch (selectedFilter) {
      case 'verified':
        return campaign.verificationStatus === 'approved';
      case 'pending':
        return campaign.verificationStatus === 'pending' || campaign.verificationStatus === 'reviewing';
      case 'rejected':
        return campaign.verificationStatus === 'rejected';
      case 'unverified':
        return !campaign.verificationStatus;
      default:
        return true; // all
    }
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

        {/* Verification Filter Tabs */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Active FUND Campaigns
            </h2>
            
            {/* Filter Tabs */}
            <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full max-w-2xl mx-auto">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all" data-testid="filter-all">
                  <Filter className="w-4 h-4 mr-2" />
                  All
                </TabsTrigger>
                <TabsTrigger value="verified" data-testid="filter-verified">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="filter-pending">
                  <Clock className="w-4 h-4 mr-2" />
                  Pending
                </TabsTrigger>
                <TabsTrigger value="rejected" data-testid="filter-rejected">
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="unverified" data-testid="filter-unverified">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Unverified
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="relative" data-testid={`fund-campaign-${campaign.id}`}>
                  <CampaignCard campaign={campaign} />
                  
                  {/* Verification Status Badge */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {getVerificationBadge(campaign.verificationStatus)}
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
                  
                  {/* Company Name Badge (if available) */}
                  {campaign.companyName && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <Badge variant="outline" className="bg-white/90 dark:bg-black/90 border-gray-200 dark:border-gray-700">
                        <Building className="w-3 h-3 mr-1" />
                        {campaign.companyName}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card className="card-standard p-12 text-center">
              {getEmptyStateContent(selectedFilter, fundCampaigns.length)}
            </Card>
          )}
        </div>

      </div>
      <Footer />
    </div>
  );
}