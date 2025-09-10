import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
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
  const { t } = useLanguage();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isJoining, setIsJoining] = useState(false);

  // Fetch FUND campaigns
  const { data: fundCampaigns = [], isLoading: fundsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/get-campaigns"],
    select: (data) => data.filter(campaign => campaign.campaignType === 'FUND')
  });

  const { data: stats } = useQuery<{ participants: number; date: string }>({
    queryKey: ["/api/today-stats"],
  });

  // Check if user has joined today
  const [hasJoinedToday, setHasJoinedToday] = useState(false);

  const joinRewardMutation = useMutation({
    mutationFn: () => api.post("/api/join-daily-reward", { wallet: address }),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You have joined the daily reward draw!",
      });
      setHasJoinedToday(true);
      queryClient.invalidateQueries({ queryKey: ["/api/today-stats"] });
    },
    onError: (error: any) => {
      const errorMsg = error.message || "Failed to join the draw";
      if (errorMsg.includes("Already entered")) {
        setHasJoinedToday(true);
        toast({
          title: "Info",
          description: "You have already joined the draw today!",
        });
      } else {
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    },
  });

  const joinDailyReward = () => {
    joinRewardMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı!",
      description: "Cüzdan adresi panoya kopyalandı",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

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
        <div className="bg-gradient-to-br from-background to-surface rounded-3xl p-12 mb-12 border border-border">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <DollarSign className="w-16 h-16 text-primary" />
              <h1 className="text-5xl font-bold text-foreground">
                Funds
              </h1>
            </div>
            <p className="text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto">
              Corporate Fundraising Platform - Unlimited funding campaigns for companies
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="gradient-primary hover:opacity-90 text-primary-foreground font-bold text-lg py-4 px-8"
            >
              <Link href="/create-campaign?type=fund">
                <Building className="w-6 h-6 mr-2" />
                Create Corporate FUND Campaign
              </Link>
            </Button>
            
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 font-bold text-lg py-4 px-8"
            >
              <Link href="/campaigns">
                <Trophy className="w-6 h-6 mr-2" />
                View All Campaigns
              </Link>
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="cyber-card p-6 text-center">
              <Building className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Companies Only</h3>
              <p className="text-sm text-muted-foreground">FUND campaigns can only be created by registered companies</p>
            </div>
            
            <div className="cyber-card p-6 text-center">
              <Clock className="w-12 h-12 text-cyber-green mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Unlimited</h3>
              <p className="text-sm text-muted-foreground">FUND campaigns have no end date and remain permanently active</p>
            </div>
            
            <div className="cyber-card p-6 text-center">
              <Heart className="w-12 h-12 text-cyber-cyan mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Zero Commission</h3>
              <p className="text-sm text-muted-foreground">All funds go directly to the company wallet</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="cyber-card p-6 text-center">
            <DollarSign className="w-12 h-12 text-cyber-yellow mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">50 USDT</h3>
            <p className="text-muted-foreground">Activation Fee</p>
          </Card>
          
          <Card className="cyber-card p-6 text-center">
            <Clock className="w-12 h-12 text-cyber-cyan mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">∞</h3>
            <p className="text-muted-foreground">Campaign Duration</p>
          </Card>
          
          <Card className="cyber-card p-6 text-center">
            <Building className="w-12 h-12 text-cyber-green mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Companies</h3>
            <p className="text-muted-foreground">Corporate Only</p>
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
                <Card key={i} className="cyber-card p-6 animate-pulse">
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
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
                      <Building className="w-3 h-3 mr-1" />
                      COMPANY FUND
                    </Badge>
                  </div>
                  {/* Target Amount Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-lg">
                      Target: {parseFloat(campaign.targetAmount || '0').toLocaleString()} USDT
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="cyber-card p-12 text-center">
              <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Corporate FUND Campaigns Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first company to create a FUND campaign on our platform!
              </p>
              <Button asChild className="gradient-primary">
                <Link href="/create-campaign?type=fund">
                  <Building className="w-4 h-4 mr-2" />
                  Create Company FUND
                </Link>
              </Button>
            </Card>
          )}
        </div>

        {/* How It Works Section */}
        <div className="space-y-8 mt-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground uppercase tracking-wide">
              How It Works for Companies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="cyber-card p-6 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 icon-on-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">1. Company Registration</h3>
              <p className="text-muted-foreground">
                Provide company details, wallet address and pay 50 USDT activation fee
              </p>
            </Card>

            <Card className="cyber-card p-6 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 icon-on-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">2. Create FUND Campaign</h3>
              <p className="text-muted-foreground">
                Launch unlimited duration fundraising campaigns for your business
              </p>
            </Card>

            <Card className="cyber-card p-6 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 icon-on-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">3. Receive Direct Funds</h3>
              <p className="text-muted-foreground">
                All investments go directly to your company wallet with zero commission
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}