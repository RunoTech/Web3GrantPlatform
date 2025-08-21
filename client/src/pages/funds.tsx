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
  CheckCircle
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

  const { data: todayStats } = useQuery<{ participants: number; date: string }>({
    queryKey: ["/api/today-stats"],
  });

  const joinDailyReward = useMutation({
    mutationFn: () => api.post("/api/join-daily-reward", { wallet: address }),
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Günlük ödül çekilişine katıldınız!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/today-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Çekilişe katılım başarısız",
        variant: "destructive",
      });
    },
  });

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
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="funds" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Ana Sayfa
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="text-center space-y-8 mb-12">
          <div className="w-32 h-32 gradient-primary rounded-3xl flex items-center justify-center mx-auto neon-border shadow-2xl">
            <Trophy className="w-16 h-16 text-background drop-shadow-2xl" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold neon-text uppercase tracking-wider">
              Günlük Ödüller
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Her gün 3 kez ücretsiz çekiliş! 100 USDT kazanma şansı yakalayın.
            </p>
          </div>

          {/* Join Daily Reward Button */}
          {isConnected ? (
            <div className="space-y-4">
              <Button 
                onClick={() => joinDailyReward.mutate()}
                disabled={joinDailyReward.isPending}
                className="gradient-primary hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-bold uppercase tracking-wide neon-border shadow-lg"
                data-testid="button-join-daily-reward"
              >
                {joinDailyReward.isPending ? (
                  <>
                    <Clock className="w-6 h-6 mr-2 animate-spin" />
                    Katılıyor...
                  </>
                ) : (
                  <>
                    <Gift className="w-6 h-6 mr-2" />
                    Günlük Çekilişe Katıl
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Ücretsiz! Sadece cüzdan bağlayın ve katılın.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <WalletConnectButton />
              <p className="text-sm text-muted-foreground">
                Günlük çekilişe katılmak için cüzdanınızı bağlayın
              </p>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="cyber-card p-6 text-center">
            <DollarSign className="w-12 h-12 text-cyber-yellow mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">100 USDT</h3>
            <p className="text-muted-foreground">Günlük Ödül</p>
          </Card>
          
          <Card className="cyber-card p-6 text-center">
            <Clock className="w-12 h-12 text-cyber-cyan mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">3 Kez</h3>
            <p className="text-muted-foreground">Günlük Çekiliş</p>
          </Card>
          
          <Card className="cyber-card p-6 text-center">
            <Users className="w-12 h-12 text-cyber-green mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">{todayStats?.participants || 0}</h3>
            <p className="text-muted-foreground">Bugünkü Katılımcı</p>
          </Card>
        </div>

        {/* Recent Winners Section */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground uppercase tracking-wide">
              Son Kazananlar
            </h2>
            <p className="text-muted-foreground">
              Günlük ödül çekilişlerinde kazanan wallet adresleri
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
                          <Trophy className="w-8 h-8 text-white" />
                        ) : (
                          <Award className="w-8 h-8 text-white" />
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
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Henüz Kazanan Yok</h3>
              <p className="text-muted-foreground">
                Günlük çekilişlere katılın ve ilk kazanan siz olun!
              </p>
            </Card>
          )}
        </div>

        {/* How It Works Section */}
        <div className="space-y-8 mt-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground uppercase tracking-wide">
              Nasıl Çalışır?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="cyber-card p-6 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-8 h-8 text-background" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">1. Cüzdan Bağlayın</h3>
              <p className="text-muted-foreground">
                MetaMask veya başka bir Web3 cüzdanı ile bağlanın
              </p>
            </Card>

            <Card className="cyber-card p-6 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-background" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">2. Çekilişe Katılın</h3>
              <p className="text-muted-foreground">
                Günde 3 kez yapılan ücretsiz çekilişlere katılın
              </p>
            </Card>

            <Card className="cyber-card p-6 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-background" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">3. Ödül Kazanın</h3>
              <p className="text-muted-foreground">
                100 USDT ödülü doğrudan cüzdanınıza gönderilir
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}