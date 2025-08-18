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
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 cyber-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center neon-border">
                <Heart className="w-6 h-6 text-background" />
              </div>
              <h1 className="text-xl font-bold neon-text uppercase tracking-wide">
                DUXXAN
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-cyber-cyan font-semibold uppercase tracking-wide">
                ANA SAYFA
              </Link>
              <Link href="/donations" className="text-muted-foreground hover:text-cyber-cyan font-medium transition-colors uppercase tracking-wide">
                BAĞIŞLAR
              </Link>
              <Link href="/funds" className="text-muted-foreground hover:text-cyber-cyan font-medium transition-colors uppercase tracking-wide">
                FONLAR
              </Link>
              {isConnected && (
                <Link href="/profile" className="text-muted-foreground hover:text-cyber-cyan font-medium transition-colors uppercase tracking-wide">
                  PROFİL
                </Link>
              )}
            </nav>

            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-surface">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 cyber-cyan-bg rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 cyber-purple-bg rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 cyber-green-bg rounded-full blur-3xl opacity-20"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="w-32 h-32 gradient-primary rounded-lg flex items-center justify-center mx-auto neon-border">
              <Heart className="w-16 h-16 text-background" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-bold text-foreground leading-tight tracking-wider">
                WEB3'TE 
                <span className="neon-text block mt-4">
                  GELECEĞİ
                </span>
                <span className="text-4xl md:text-5xl block mt-4 text-muted-foreground">
                  BİRLİKTE İNŞA EDELİM
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Ethereum ve BSC ağlarında güvenli, şeffaf ve komisyonsuz bağış platformu. 
                Projelerinizi destekleyin, toplumsal değişime katkıda bulunun.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
              <Button 
                asChild
                size="lg"
                className="cyber-cyan-bg px-12 py-6 text-lg font-bold uppercase tracking-wider btn-cyber"
                data-testid="button-create-campaign"
              >
                <Link href="/funds">
                  <Target className="w-6 h-6 mr-3" />
                  KAMPANYA OLUŞTUR
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                className="btn-cyber px-12 py-6 text-lg"
                data-testid="button-explore-campaigns"
              >
                <Link href="/donations">
                  <Search className="w-6 h-6 mr-3" />
                  BAĞIŞLARI KEŞFET
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground uppercase tracking-wider">
              NEDEN <span className="neon-text">DUXXAN</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Futuristik blockchain teknolojisi ile güvenli ve şeffaf bağış deneyimi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="cyber-card p-8 text-center">
              <div className="w-20 h-20 cyber-cyan-bg rounded-lg flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-background" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 uppercase tracking-wide">BLOCKCHAİN GÜVENLİĞİ</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ethereum ve BSC ağlarında çalışan akıllı kontratlar ile %100 güvenli işlemler
              </p>
            </div>

            <div className="cyber-card p-8 text-center">
              <div className="w-20 h-20 cyber-green-bg rounded-lg flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-10 h-10 text-background" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 uppercase tracking-wide">KOMİSYONSUZ</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bağışlarınız doğrudan kampanya sahiplerine ulaşır, hiçbir komisyon kesilmez
              </p>
            </div>

            <div className="cyber-card p-8 text-center">
              <div className="w-20 h-20 cyber-purple-bg rounded-lg flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 uppercase tracking-wide">HIZLI VE KOLAY</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cüzdanınızı bağlayın ve dakikalar içinde kampanya oluşturun veya bağış yapın
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Tether Reward Section */}
      <section id="odul-sistemi" className="py-24 bg-gradient-to-b from-surface-2 to-surface relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 cyber-cyan-bg opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 cyber-purple-bg opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 cyber-green-bg opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 gradient-primary rounded-lg flex items-center justify-center neon-border relative">
                <Gift className="w-10 h-10 text-background" />
                <div className="absolute -top-2 -right-2 w-6 h-6 cyber-yellow-bg rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-background">!</span>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl md:text-7xl font-bold neon-text uppercase tracking-wider">
                  GÜNLÜK
                </h2>
                <div className="text-3xl md:text-4xl font-bold text-cyber-yellow uppercase tracking-wider">
                  TETHER ÖDÜLÜ
                </div>
              </div>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Her gün katılım gösterin ve <span className="text-cyber-green font-semibold">USDT ödülü</span> kazanma şansı yakalayın. 
              Futuristik topluluğa <span className="text-cyber-cyan font-semibold">günlük ödüller</span> dağıtılıyor!
            </p>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Participation Card */}
            <div className="lg:col-span-2 cyber-card p-8 relative">
              <div className="absolute top-0 right-0 w-24 h-24 cyber-cyan-bg opacity-10 rounded-full blur-xl"></div>
              
              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-foreground uppercase tracking-wide flex items-center space-x-3">
                    <div className="w-8 h-8 cyber-green-bg rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-background">1</span>
                    </div>
                    <span>KATILIM SÜRECİ</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="cyber-card p-4 border border-cyber-cyan/30">
                      <div className="w-8 h-8 cyber-cyan-bg rounded mb-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-background">1</span>
                      </div>
                      <span className="text-cyber-cyan font-medium uppercase tracking-wide">Cüzdan Bağla</span>
                    </div>
                    <div className="cyber-card p-4 border border-cyber-purple/30">
                      <div className="w-8 h-8 cyber-purple-bg rounded mb-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">2</span>
                      </div>
                      <span className="text-cyber-purple font-medium uppercase tracking-wide">Butona Tıkla</span>
                    </div>
                    <div className="cyber-card p-4 border border-cyber-green/30">
                      <div className="w-8 h-8 cyber-green-bg rounded mb-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-background">3</span>
                      </div>
                      <span className="text-cyber-green font-medium uppercase tracking-wide">Ödül Kazan</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="text-center">
                  {isConnected ? (
                    <Button 
                      onClick={handleDailyReward}
                      size="lg"
                      className="cyber-cyan-bg px-12 py-6 text-xl font-bold uppercase tracking-wider btn-cyber relative overflow-hidden group"
                      data-testid="button-daily-reward"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <DollarSign className="w-8 h-8 mr-4" />
                      BUGÜN KATIL
                    </Button>
                  ) : (
                    <div className="cyber-card px-8 py-6 neon-border relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10 rounded-lg"></div>
                      <span className="text-cyber-cyan font-bold text-lg uppercase tracking-wide relative z-10">
                        Günlük ödüle katılmak için cüzdan bağlayın
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Winners Leaderboard */}
            <div className="cyber-card p-6 relative">
              <div className="absolute top-0 left-0 w-20 h-20 cyber-yellow-bg opacity-10 rounded-full blur-xl"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <Award className="w-6 h-6 text-cyber-yellow" />
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-wide">
                    DÜNKÜ KAZANANLAR
                  </h3>
                </div>
                
                <div className="space-y-3" data-testid="winners-list">
                  {(lastWinners as any[]).length > 0 ? (
                    (lastWinners as any[]).slice(0, 5).map((winner: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-3 px-4 bg-surface-3 rounded-lg border border-cyber-green/20 hover:border-cyber-green/40 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 cyber-green-bg rounded-full flex items-center justify-center text-xs font-bold text-background">
                            #{index + 1}
                          </div>
                          <span className="font-mono text-sm text-muted-foreground">
                            {winner.wallet.slice(0, 6)}...{winner.wallet.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-cyber-green">USDT</span>
                          <div className="w-2 h-2 cyber-green-bg rounded-full"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-surface-3 rounded-lg flex items-center justify-center mx-auto">
                        <Award className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-foreground font-semibold uppercase tracking-wide">
                          HENÜZ KAZANAN YOK
                        </div>
                        <div className="text-sm text-muted-foreground">
                          İlk katılan sen ol!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics Footer */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 cyber-card border border-cyber-cyan/30">
              <div className="text-3xl font-bold text-cyber-cyan mb-2">∞</div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground">Toplam Ödül</div>
            </div>
            <div className="text-center p-6 cyber-card border border-cyber-purple/30">
              <div className="text-3xl font-bold text-cyber-purple mb-2">24</div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground">Saat Aktif</div>
            </div>
            <div className="text-center p-6 cyber-card border border-cyber-green/30">
              <div className="text-3xl font-bold text-cyber-green mb-2">100%</div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground">Güvenli</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground uppercase tracking-wider">
              POPÜLER <span className="neon-text">KAMPANYALAR</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Futuristik etkisi yüksek, güvenilir projeleri keşfedin ve destekleyin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" data-testid="popular-campaigns-grid">
            {(popularCampaigns as any[]).length > 0 ? (
              (popularCampaigns as any[]).map((campaign: any) => (
                <div key={campaign.id} className="relative">
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center neon-border">
                      <Sparkles className="w-4 h-4 text-background" />
                    </div>
                  </div>
                  <CampaignCard campaign={campaign} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 cyber-cyan-bg rounded-lg flex items-center justify-center mx-auto mb-6 neon-border">
                  <Target className="w-12 h-12 text-background" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2 uppercase tracking-wide">HENÜZ POPÜLER KAMPANYA YOK</h3>
                <p className="text-muted-foreground mb-8">İlk kampanyayı oluşturun ve fark yaratın</p>
                <Button asChild className="btn-cyber">
                  <Link href="/funds">
                    <Plus className="w-5 h-5 mr-2" />
                    KAMPANYA OLUŞTUR
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="text-center">
            <Button 
              asChild
              className="btn-cyber px-8 py-3"
              data-testid="button-view-all-campaigns"
            >
              <Link href="/campaigns">
                TÜM KAMPANYALARI GÖRÜNTÜLE
                <Search className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-surface-2 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center neon-border">
                  <Heart className="w-6 h-6 text-background" />
                </div>
                <h3 className="text-xl font-bold text-foreground neon-text uppercase tracking-wide">DUXXAN</h3>
              </div>
              <p className="text-muted-foreground">
                Futuristik blockchain teknolojisi ile güvenli ve şeffaf bağış platformu
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">PLATFORM</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/campaigns" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">KAMPANYALAR</Link></li>
                <li><Link href="/funds" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">KAMPANYA OLUŞTUR</Link></li>
                <li><a href="#odul-sistemi" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">GÜNLÜK ÖDÜL</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">DESTEK</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">NASIL ÇALIŞIR</a></li>
                <li><a href="#" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">GÜVENLİK</a></li>
                <li><a href="#" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">SSS</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">BAĞLANTI</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 cyber-card rounded-lg flex items-center justify-center hover:neon-border transition-colors">
                  <span className="text-sm text-cyber-cyan">TW</span>
                </a>
                <a href="#" className="w-10 h-10 cyber-card rounded-lg flex items-center justify-center hover:neon-border transition-colors">
                  <span className="text-sm text-cyber-cyan">DC</span>
                </a>
                <a href="#" className="w-10 h-10 cyber-card rounded-lg flex items-center justify-center hover:neon-border transition-colors">
                  <span className="text-sm text-cyber-cyan">TG</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 DUXXAN. TÜM HAKLARI SAKLIDIR.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
