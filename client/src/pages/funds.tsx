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
import type { DailyWinner } from "@shared/schema";

export default function FundsPage() {
  const { t } = useLanguage();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isJoining, setIsJoining] = useState(false);

  const { data: lastWinners = [], isLoading: winnersLoading } = useQuery<DailyWinner[]>({
    queryKey: ["/api/get-last-winners"],
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
        title: "Başarılı!",
        description: "Günlük ödül çekilişine katıldınız!",
      });
      setHasJoinedToday(true);
      queryClient.invalidateQueries({ queryKey: ["/api/today-stats"] });
    },
    onError: (error: any) => {
      const errorMsg = error.message || "Çekilişe katılım başarısız";
      if (errorMsg.includes("Already entered")) {
        setHasJoinedToday(true);
        toast({
          title: "Bilgi",
          description: "Bugün zaten çekilişe katıldınız!",
        });
      } else {
        toast({
          title: "Hata",
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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-3xl p-12 mb-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <DollarSign className="w-16 h-16 text-blue-500" />
              <h1 className="text-5xl font-bold text-black dark:text-white">
                Funds
              </h1>
            </div>
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-4xl mx-auto">
              Corporate Fundraising Platform - Unlimited funding campaigns for companies
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-4 px-8"
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
              className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold text-lg py-4 px-8"
            >
              <Link href="/campaigns">
                <Trophy className="w-6 h-6 mr-2" />
                View All Campaigns
              </Link>
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-800">
              <Building className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Companies Only</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">FUND campaigns can only be created by registered companies</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-green-200 dark:border-green-800">
              <Clock className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">Unlimited</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">FUND campaigns have no end date and remain permanently active</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-purple-200 dark:border-purple-800">
              <Heart className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">Zero Commission</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">All funds go directly to the company wallet</p>
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
              Recent Corporate Fundings
            </h2>
            <p className="text-muted-foreground">
              Latest successful corporate fundraising campaigns
            </p>
          </div>

          {winnersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="cyber-card p-6 animate-pulse">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-muted rounded-full mx-auto"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : lastWinners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lastWinners.map((winner, index) => (
                <Card key={winner.id} className="cyber-card p-6 hover:scale-105 transition-all duration-300">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'gradient-primary'
                      }`}>
                        {index < 3 ? (
                          <Trophy className="w-8 h-8 text-white dark:text-white" />
                        ) : (
                          <Award className="w-8 h-8 text-white dark:text-white" />
                        )}
                      </div>
                      {index < 3 && (
                        <Badge className={`absolute -top-2 -right-2 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}>
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <DollarSign className="w-5 h-5 text-cyber-yellow" />
                        <span className="text-2xl font-bold text-foreground">
                          {parseFloat(winner.amount).toFixed(0)} USDT
                        </span>
                      </div>
                      
                      <div 
                        className="bg-surface-2 rounded-lg p-3 cursor-pointer hover:bg-surface transition-colors group"
                        onClick={() => copyToClipboard(winner.wallet)}
                        data-testid={`winner-wallet-${winner.id}`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <WalletIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground">
                            {winner.wallet.slice(0, 6)}...{winner.wallet.slice(-4)}
                          </span>
                          <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(winner.date)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="cyber-card p-12 text-center">
              <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Corporate Campaigns Yet</h3>
              <p className="text-muted-foreground">
                Be the first company to create a FUND campaign on our platform!
              </p>
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