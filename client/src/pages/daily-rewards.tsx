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
  Coins
} from "lucide-react";
import type { DailyWinner } from "@shared/schema";

export default function DailyRewardsPage() {
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
      <Header currentPage="daily-rewards" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Ana Sayfa
          </Link>
        </Button>

        {/* Daily Rewards Header Section */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-3xl p-12 mb-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Gift className="w-16 h-16 text-yellow-500" />
              <h1 className="text-5xl font-bold text-black dark:text-white">
                Daily Rewards
              </h1>
            </div>
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-4xl mx-auto">
              Ücretsiz günlük ödüller için katıl! Her gün 100 USDT kazanma şansın var.
            </p>
          </div>

          {/* Daily Reward Participation Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 p-8 max-w-2xl mx-auto">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto">
                <Coins className="w-12 h-12 text-black" />
              </div>
              
              <h2 className="text-3xl font-bold text-black dark:text-white">
                Günlük Çekilişe Katıl
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Her gün ücretsiz olarak çekilişe katılabilirsin. Kazanan günde 100 USDT alır!
              </p>

              {/* Today's Stats */}
              <div className="flex items-center justify-center space-x-8 text-lg bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Bugünkü Katılım: <span className="font-bold text-blue-600 dark:text-blue-400">{stats?.participants || 0}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Tarih: <span className="font-bold text-green-600 dark:text-green-400">{new Date().toLocaleDateString('tr-TR')}</span>
                  </span>
                </div>
              </div>

              {/* Wallet Connection and Join Button */}
              {!isConnected ? (
                <div className="space-y-4">
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                    Çekilişe katılmak için cüzdanını bağla
                  </p>
                  <WalletConnectButton />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Cüzdan bağlı: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  <Button 
                    onClick={joinDailyReward}
                    disabled={joinRewardMutation.isPending || hasJoinedToday}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-4 px-8"
                  >
                    {joinRewardMutation.isPending ? (
                      "Katılım işleniyor..."
                    ) : hasJoinedToday ? (
                      "Bugün zaten katıldın ✓"
                    ) : (
                      "🎁 Ücretsiz Çekilişe Katıl"
                    )}
                  </Button>
                  
                  {hasJoinedToday && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sonuçlar gün sonunda açıklanacak. İyi şanslar!
                    </p>
                  )}
                </div>
              )}

              {/* Reward Rules */}
              <div className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-black dark:text-white mb-2">📋 Çekiliş Kuralları:</h3>
                <ul className="space-y-1">
                  <li>• Her gün sadece 1 kez katılabilirsin</li>
                  <li>• Katılım tamamen ücretsiz</li>
                  <li>• Günlük ödül: 100 USDT</li>
                  <li>• Kazanan her gün rastgele seçilir</li>
                  <li>• Sonuçlar gün sonunda açıklanır</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Winners Section Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h2 className="text-3xl font-bold text-black dark:text-white">
              Son Kazananlar
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Geçmiş günlerin şanslı kazananları
          </p>
        </div>

        {/* Recent Winners Section */}
        <div className="space-y-8">
          {winnersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : lastWinners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lastWinners.map((winner, index) => (
                <Card key={winner.id} className="p-6 hover:scale-105 transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}>
                        {index < 3 ? (
                          <Trophy className="w-8 h-8 text-white dark:text-white" />
                        ) : (
                          <Star className="w-8 h-8 text-white dark:text-white" />
                        )}
                      </div>
                      <Badge 
                        className={`absolute -top-2 -right-2 text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          {winner.wallet.slice(0, 6)}...{winner.wallet.slice(-4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(winner.wallet)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-bold text-green-600 dark:text-green-400">
                            100 USDT
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(winner.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Henüz kazanan yok
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-8">
                İlk katılan sen ol ve şansını dene!
              </p>
              {!isConnected && <WalletConnectButton />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}