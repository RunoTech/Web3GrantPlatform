import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import { useWallet } from "@/hooks/useWallet";
import { api } from "@/utils/api";
import { 
  Heart, 
  Plus, 
  Search, 
  Shield, 
  Zap, 
  DollarSign,
  Target,
  Users,
  Gift,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";

export default function HomePage() {
  const { isConnected, address } = useWallet();

  const { data: popularCampaigns = [] } = useQuery({
    queryKey: ["/api/get-popular-campaigns"],
  });

  const { data: lastWinners = [] } = useQuery({
    queryKey: ["/api/get-last-winners"],
  });

  const handleDailyReward = async () => {
    if (!address) return;
    
    try {
      await api.post("/api/join-daily-reward", { wallet: address });
    } catch (error: any) {
      console.error("Daily reward error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Web3Bağış
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-blue-600 font-semibold">
                Ana Sayfa
              </Link>
              <Link href="/donations" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Bağışlar
              </Link>
              <Link href="/funds" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Fonlar
              </Link>
              {isConnected && (
                <Link href="/profile" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                  Profil
                </Link>
              )}
            </nav>

            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 modern-blue rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 modern-purple rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 modern-green rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto animate-glow">
              <Heart className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-800 leading-tight">
              Web3'te 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Geleceği
              </span>
              <br />Birlikte İnşa Edelim
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Ethereum ve BSC ağlarında güvenli, şeffaf ve komisyonsuz bağış platformu. 
              Projelerinizi destekleyin, toplumsal değişime katkıda bulunun.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Button 
                asChild
                size="lg"
                className="gradient-primary text-white px-12 py-6 text-lg btn-modern"
                data-testid="button-create-campaign"
              >
                <Link href="/funds">
                  <Target className="w-6 h-6 mr-3" />
                  Kampanya Oluştur
                </Link>
              </Button>
              <Button 
                variant="outline"
                asChild
                size="lg"
                className="border-2 border-slate-300 text-slate-700 px-12 py-6 text-lg btn-modern bg-white/80 backdrop-blur-sm"
                data-testid="button-explore-campaigns"
              >
                <Link href="/donations">
                  <Search className="w-6 h-6 mr-3" />
                  Bağışları Keşfet
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">
              Neden <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Web3Bağış?</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Modern blockchain teknolojisi ile güvenli ve şeffaf bağış deneyimi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-modern p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Blockchain Güvenliği</h3>
              <p className="text-slate-600 leading-relaxed">
                Ethereum ve BSC ağlarında çalışan akıllı kontratlar ile %100 güvenli işlemler
              </p>
            </div>

            <div className="card-modern p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 gradient-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Komisyonsuz</h3>
              <p className="text-slate-600 leading-relaxed">
                Bağışlarınız doğrudan kampanya sahiplerine ulaşır, hiçbir komisyon kesilmez
              </p>
            </div>

            <div className="card-modern p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Hızlı ve Kolay</h3>
              <p className="text-slate-600 leading-relaxed">
                Cüzdanınızı bağlayın ve dakikalar içinde kampanya oluşturun veya bağış yapın
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Tether Reward Section */}
      <section id="odul-sistemi" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-modern p-12 gradient-accent text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="text-center space-y-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    Günlük Tether Ödülü
                  </h2>
                </div>
                
                <p className="text-lg text-white/80 leading-relaxed">
                  Her gün katılım gösterin ve USDT ödülü kazanma şansı yakalayın. 
                  Topluluk üyelerine günlük ödüller dağıtılıyor!
                </p>
                
                <div className="space-y-6">
                  {isConnected ? (
                    <Button 
                      onClick={handleDailyReward}
                      size="lg"
                      className="bg-white text-orange-600 hover:bg-orange-50 btn-modern px-8 py-4"
                      data-testid="button-daily-reward"
                    >
                      <DollarSign className="w-6 h-6 mr-3" />
                      Bugün Katıl
                    </Button>
                  ) : (
                    <div className="modern-green border border-green-200 px-6 py-4 rounded-xl">
                      <span className="text-green-800 font-medium">Günlük ödüle katılmak için cüzdan bağlayın</span>
                    </div>
                  )}
                  
                  {/* Daily Winners List */}
                  <div className="card-modern p-6 max-w-md mx-auto">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span>Dünkü Kazananlar</span>
                    </h3>
                    <div className="space-y-3" data-testid="winners-list">
                      {(lastWinners as any[]).length > 0 ? (
                        (lastWinners as any[]).slice(0, 5).map((winner: any, index: number) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 modern-blue rounded-xl">
                            <span className="font-mono text-sm text-slate-600">
                              {winner.wallet.slice(0, 6)}...{winner.wallet.slice(-4)}
                            </span>
                            <span className="text-sm font-medium text-green-600">USDT</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-500">
                          Henüz kazanan yok
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">
              🌟 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Popüler</span> Kampanyalar
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Toplumsal etkisi yüksek, güvenilir projeleri keşfedin ve destekleyin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" data-testid="popular-campaigns-grid">
            {(popularCampaigns as any[]).length > 0 ? (
              (popularCampaigns as any[]).map((campaign: any) => (
                <div key={campaign.id} className="relative">
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="w-8 h-8 gradient-accent rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <CampaignCard campaign={campaign} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 modern-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-2">Henüz popüler kampanya yok</h3>
                <p className="text-slate-600 mb-8">İlk kampanyayı oluşturun ve fark yaratın</p>
                <Button asChild className="gradient-primary text-white btn-modern">
                  <Link href="/funds">
                    <Plus className="w-5 h-5 mr-2" />
                    Kampanya Oluştur
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="text-center">
            <Button 
              asChild
              variant="outline"
              className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              data-testid="button-view-all-campaigns"
            >
              <Link href="/campaigns">
                Tüm Kampanyaları Görüntüle
                <Search className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Neden Web3Bağış?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Blockchain teknolojisi ile güvenli, şeffaf ve komisyonsuz bağış deneyimi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-pastel-blue rounded-3xl flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Güvenli ve Şeffaf</h3>
              <p className="text-slate-600">
                Tüm işlemler blockchain üzerinde kayıtlı ve herkes tarafından doğrulanabilir
              </p>
            </div>
            
            <div className="text-center space-y-4 p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-pastel-green rounded-3xl flex items-center justify-center mx-auto">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Komisyon Yok</h3>
              <p className="text-slate-600">
                Bağışlarınız doğrudan kampanya sahibine gider, hiçbir komisyon alınmaz
              </p>
            </div>
            
            <div className="text-center space-y-4 p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-pastel-purple rounded-3xl flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Hızlı İşlem</h3>
              <p className="text-slate-600">
                Ethereum ve BSC ağları üzerinde hızlı ve güvenilir işlem deneyimi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Web3Bağış</h3>
              </div>
              <p className="text-slate-400">
                Blockchain teknolojisi ile güvenli ve şeffaf bağış platformu
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/campaigns" className="hover:text-white transition-colors">Kampanyalar</Link></li>
                <li><Link href="/create-campaign" className="hover:text-white transition-colors">Kampanya Oluştur</Link></li>
                <li><a href="#odul-sistemi" className="hover:text-white transition-colors">Günlük Ödül</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Destek</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Nasıl Çalışır</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Güvenlik</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SSS</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Bağlantı</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center hover:bg-slate-600 transition-colors">
                  <span className="text-sm">TW</span>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center hover:bg-slate-600 transition-colors">
                  <span className="text-sm">DC</span>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center hover:bg-slate-600 transition-colors">
                  <span className="text-sm">TG</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Web3Bağış. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
