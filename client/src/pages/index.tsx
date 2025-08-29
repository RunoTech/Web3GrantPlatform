import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/useSettings";
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
  Award,
  Trophy,
  Clock,
  Sun,
  Sunset,
  Moon,
  Star,
  Gem,
  Coins,
  Wallet,
  User,
  BarChart3,
  Settings
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const { isConnected, address } = useWallet();
  const { t } = useLanguage();
  const { 
    heroTitle, 
    heroSubtitle, 
    getSetting,
    siteTitle
  } = useSettings();

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
      // Success feedback could be added here if needed
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
              <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center neon-border relative group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/40 to-cyber-yellow/40 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <Heart className="w-10 h-10 icon-on-primary relative z-10 drop-shadow-2xl" />
              </div>
              <h1 className="text-xl font-bold neon-text uppercase tracking-wide">
                {siteTitle}
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/campaigns" className="text-foreground hover:text-cyber-cyan font-bold transition-colors uppercase tracking-wide hover:text-shadow-cyan">
                {t('campaigns')}
              </Link>
              <Link href="/donations" className="text-foreground hover:text-cyber-green font-bold transition-colors uppercase tracking-wide hover:text-shadow-green">
                {t('donations')}
              </Link>
              <Link href="/funds" className="text-foreground hover:text-cyber-purple font-bold transition-colors uppercase tracking-wide hover:text-shadow-purple">
                {t('funds')}
              </Link>
              <Link href="/daily-rewards" className="text-foreground hover:text-cyber-yellow font-bold transition-colors uppercase tracking-wide hover:text-shadow-yellow">
                Daily Rewards
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <LanguageSelector />
              {isConnected && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="transition-colors hover:text-cyber-yellow text-foreground"
                    >
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Dashboard Overview
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=campaigns" className="flex items-center w-full">
                        <Target className="w-4 h-4 mr-2" />
                        My Campaigns
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=rewards" className="flex items-center w-full">
                        <Trophy className="w-4 h-4 mr-2" />
                        Daily Rewards
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=settings" className="flex items-center w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <WalletConnectButton />
            </div>
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
            <div className="w-40 h-40 gradient-primary rounded-3xl flex items-center justify-center mx-auto neon-border shadow-2xl">
              <Heart className="w-20 h-20 text-black drop-shadow-2xl" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-wider uppercase">
                <span className="neon-text">
                  {t('hero.title')}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
              <Button 
                asChild
                size="lg"
                className="cyber-cyan-bg px-8 py-4 font-bold uppercase tracking-wide btn-cyber shadow-2xl hover:scale-105 transition-transform duration-300"
                data-testid="button-create-campaign"
              >
                <Link href="/create-campaign">
                  <Target className="w-6 h-6 mr-2 text-black" />
                  {t('hero.create_campaign')}
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                className="btn-cyber px-8 py-4 shadow-2xl hover:scale-105 transition-transform duration-300"
                data-testid="button-explore-campaigns"
              >
                <Link href="/campaigns">
                  <Search className="w-6 h-6 mr-2 text-black" />
                  {t('hero.explore_campaigns')}
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
            <h2 className="text-3xl md:text-5xl font-bold text-foreground uppercase tracking-wider">
              {t('features.why_title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="cyber-card p-8 text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-24 h-24 cyber-cyan-bg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl neon-border">
                <Shield className="w-12 h-12 text-black drop-shadow-2xl" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wide">{t('features.blockchain_security')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('features.blockchain_desc')}
              </p>
            </div>

            <div className="cyber-card p-8 text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-24 h-24 cyber-green-bg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl neon-border">
                <DollarSign className="w-12 h-12 text-black drop-shadow-2xl" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wide">{t('features.commission_free')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('features.commission_desc')}
              </p>
            </div>

            <div className="cyber-card p-8 text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-24 h-24 cyber-purple-bg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl neon-border">
                <Zap className="w-12 h-12 text-black drop-shadow-2xl" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wide">{t('features.fast_easy')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('features.fast_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Tether Reward Section */}
      <section id="odul-sistemi" className="py-16 bg-gradient-to-b from-surface-2 to-surface relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 cyber-cyan-bg opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 cyber-purple-bg opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 cyber-green-bg opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-4 mb-6">
              <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center neon-border relative shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-cyber-yellow/20 rounded-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Trophy className="w-12 h-12 text-black relative z-10 drop-shadow-2xl" />
                <div className="absolute -top-3 -right-3 w-8 h-8 cyber-yellow-bg rounded-full flex items-center justify-center shadow-xl neon-border">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold neon-text uppercase tracking-wide mb-2">
                  {t('daily.title')}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-cyber-cyan via-cyber-yellow to-cyber-green mx-auto"></div>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Her gün ücretsiz katılın, şansınızı deneyin ve büyük ödüller kazanın! Sadece cüzdan bağlayın ve günde bir kez katılım hakkınızı kullanın.
            </p>
            
            {/* Daily Prize Pool */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyber-yellow/10 to-cyber-green/10 px-6 py-3 rounded-full border border-cyber-yellow/20">
                <DollarSign className="w-5 h-5 text-cyber-yellow" />
                <span className="text-lg font-bold text-cyber-yellow">1500 USDT</span>
                <span className="text-sm text-muted-foreground">günlük toplam ödül</span>
              </div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10 px-4 py-2 rounded-full border border-cyber-cyan/20">
                <Clock className="w-4 h-4 text-cyber-cyan" />
                <span className="text-sm font-bold text-cyber-cyan">3 ÇEKILIŞ</span>
                <span className="text-xs text-muted-foreground">günde</span>
              </div>
            </div>
          </div>
          
          {/* Daily Draw Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Morning Draw */}
            <div className="cyber-card p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-cyber-yellow/20 to-cyber-green/20 rounded-full blur-2xl"></div>
              <div className="absolute top-4 right-4 w-10 h-6 cyber-yellow-bg rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-black">SABAH</span>
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="w-28 h-28 cyber-yellow-bg rounded-3xl flex items-center justify-center mx-auto shadow-2xl neon-border relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Sun className="w-14 h-14 text-black relative z-10 drop-shadow-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyber-yellow mb-1">09:00 ÇEKİLİŞİ</h3>
                  <p className="text-3xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 kazanan • Sabah çekilişi</p>
                </div>
              </div>
            </div>

            {/* Afternoon Draw */}
            <div className="cyber-card p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-cyber-cyan/20 to-cyber-purple/20 rounded-full blur-2xl"></div>
              <div className="absolute top-4 right-4 w-12 h-6 cyber-cyan-bg rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-black">ÖĞLE</span>
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="w-28 h-28 cyber-cyan-bg rounded-3xl flex items-center justify-center mx-auto shadow-2xl neon-border relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Sunset className="w-14 h-14 text-black relative z-10 drop-shadow-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyber-cyan mb-1">15:00 ÇEKİLİŞİ</h3>
                  <p className="text-3xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 kazanan • Öğle çekilişi</p>
                </div>
              </div>
            </div>

            {/* Evening Draw */}
            <div className="cyber-card p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-cyber-green/20 to-cyber-purple/20 rounded-full blur-2xl"></div>
              <div className="absolute top-4 right-4 w-12 h-6 cyber-green-bg rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-black">AKŞAM</span>
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="w-28 h-28 cyber-green-bg rounded-3xl flex items-center justify-center mx-auto shadow-2xl neon-border relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Moon className="w-14 h-14 text-black relative z-10 drop-shadow-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyber-green mb-1">21:00 ÇEKİLİŞİ</h3>
                  <p className="text-3xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 kazanan • Akşam çekilişi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Participation Card */}
            <div className="cyber-card p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyber-cyan/10 to-cyber-purple/10 rounded-full blur-2xl"></div>
              
              <div className="space-y-8 relative z-10">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 cyber-cyan-bg rounded-3xl flex items-center justify-center mx-auto shadow-2xl neon-border relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <Zap className="w-12 h-12 text-black relative z-10 drop-shadow-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground uppercase tracking-wide">
                    KATILIM SÜRECİ
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-4 p-4 cyber-card border border-cyber-cyan/30 relative group hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 cyber-cyan-bg rounded-2xl flex items-center justify-center flex-shrink-0 neon-border relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <Wallet className="w-8 h-8 text-black relative z-10 drop-shadow-lg" />
                    </div>
                    <div>
                      <h4 className="font-bold text-cyber-cyan uppercase tracking-wide">Cüzdan Bağla</h4>
                      <p className="text-sm text-muted-foreground">MetaMask veya Trust Wallet ile bağlan</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 cyber-card border border-cyber-purple/30 relative group hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 cyber-purple-bg rounded-2xl flex items-center justify-center flex-shrink-0 neon-border relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-500 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <Clock className="w-8 h-8 text-white relative z-10 drop-shadow-lg" />
                    </div>
                    <div>
                      <h4 className="font-bold text-cyber-purple uppercase tracking-wide">Günlük Katılım</h4>
                      <p className="text-sm text-muted-foreground">Günde bir kez ücretsiz katıl</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 cyber-card border border-cyber-green/30 relative group hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 cyber-green-bg rounded-2xl flex items-center justify-center flex-shrink-0 neon-border relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <Gift className="w-8 h-8 text-black relative z-10 drop-shadow-lg" />
                    </div>
                    <div>
                      <h4 className="font-bold text-cyber-green uppercase tracking-wide">Ödül Kazan</h4>
                      <p className="text-sm text-muted-foreground">Şansını dene ve USDT kazan</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="text-center pt-4">
                  {isConnected ? (
                    <Button 
                      onClick={handleDailyReward}
                      size="lg"
                      className="bg-gradient-to-r from-cyber-cyan to-cyber-green hover:from-cyber-cyan/80 hover:to-cyber-green/80 text-black px-12 py-4 font-bold uppercase tracking-wide rounded-2xl relative overflow-hidden group shadow-2xl"
                      data-testid="button-daily-reward"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <DollarSign className="w-6 h-6" />
                        <span>BUGÜN KATIL</span>
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </Button>
                  ) : (
                    <div className="cyber-card px-8 py-4 neon-border relative rounded-2xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10 rounded-2xl"></div>
                      <span className="text-cyber-cyan font-bold uppercase tracking-wide relative z-10 text-lg">
                        ÖNCE CÜZDAN BAĞLAYIN
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Winners Leaderboard */}
            <div className="cyber-card p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyber-yellow/10 to-cyber-green/10 rounded-full blur-2xl"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 cyber-yellow-bg rounded-3xl flex items-center justify-center mx-auto shadow-2xl neon-border relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <Trophy className="w-12 h-12 text-black relative z-10 drop-shadow-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground uppercase tracking-wide">
                    DÜN'ÜN KAZANANLARI
                  </h3>
                </div>
                
                <div className="space-y-3" data-testid="winners-list">
                  {(lastWinners as any[]).length > 0 ? (
                    (lastWinners as any[]).slice(0, 7).map((winner: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                        index === 0 ? 'bg-gradient-to-r from-cyber-yellow/10 to-cyber-green/10 border-cyber-yellow/40' :
                        index === 1 ? 'bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10 border-cyber-cyan/40' :
                        index === 2 ? 'bg-gradient-to-r from-cyber-green/10 to-cyber-purple/10 border-cyber-green/40' :
                        'bg-surface-3 border-border'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'cyber-yellow-bg text-black' :
                            index === 1 ? 'cyber-cyan-bg text-black' :
                            index === 2 ? 'cyber-green-bg text-black' :
                            'bg-surface text-foreground'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <span className="font-mono text-sm text-foreground font-medium">
                              {winner.wallet.slice(0, 8)}...{winner.wallet.slice(-6)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {index === 0 ? '200 USDT' : index === 1 ? '100 USDT' : '50 USDT'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {index === 0 ? <Trophy className="w-7 h-7 text-cyber-yellow drop-shadow-lg" /> :
                           index === 1 ? <Award className="w-7 h-7 text-cyber-cyan drop-shadow-lg" /> :
                           index === 2 ? <Gift className="w-7 h-7 text-cyber-green drop-shadow-lg" /> :
                           <Star className="w-6 h-6 text-muted-foreground" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-20 h-20 bg-surface-3 rounded-3xl flex items-center justify-center mx-auto neon-border relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <Trophy className="w-10 h-10 text-muted-foreground relative z-10" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-foreground font-bold uppercase tracking-wide text-lg">
                          HENÜz KAZANAN YOK
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
          
          {/* Enhanced Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 cyber-card border border-cyber-yellow/30 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-yellow/5 to-cyber-green/5"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 cyber-yellow-bg rounded-3xl flex items-center justify-center mx-auto mb-3 neon-border relative group shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Coins className="w-12 h-12 text-black relative z-10 drop-shadow-2xl" />
                </div>
                <div className="text-2xl font-bold text-cyber-yellow mb-1">1500</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">GÜNLÜK TOPLAM</div>
              </div>
            </div>
            
            <div className="text-center p-6 cyber-card border border-cyber-cyan/30 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/5 to-cyber-purple/5"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 cyber-cyan-bg rounded-3xl flex items-center justify-center mx-auto mb-3 neon-border relative group shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Star className="w-12 h-12 text-black relative z-10 drop-shadow-2xl" />
                </div>
                <div className="text-2xl font-bold text-cyber-cyan mb-1">21</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">TOPLAM KAZANAN</div>
              </div>
            </div>
            
            <div className="text-center p-6 cyber-card border border-cyber-green/30 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-green/5 to-cyber-purple/5"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 cyber-green-bg rounded-3xl flex items-center justify-center mx-auto mb-3 neon-border relative group shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Clock className="w-12 h-12 text-black relative z-10 drop-shadow-2xl" />
                </div>
                <div className="text-2xl font-bold text-cyber-green mb-1">3</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">ÇEKİLİŞ SAYISI</div>
              </div>
            </div>
            
            <div className="text-center p-6 cyber-card border border-cyber-purple/30 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/5 to-cyber-yellow/5"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 cyber-purple-bg rounded-3xl flex items-center justify-center mx-auto mb-3 neon-border relative group shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <Gem className="w-12 h-12 text-black drop-shadow-2xl relative z-10" />
                </div>
                <div className="text-2xl font-bold text-cyber-purple mb-1">100%</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">GÜVENLİ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground uppercase tracking-wider">
              <span className="neon-text">{t('popular.title')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('popular.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" data-testid="popular-campaigns-grid">
            {(popularCampaigns as any[]).length > 0 ? (
              (popularCampaigns as any[]).map((campaign: any) => (
                <div key={campaign.id} className="relative">
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center neon-border">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <CampaignCard campaign={campaign} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-32 h-32 cyber-cyan-bg rounded-3xl flex items-center justify-center mx-auto mb-6 neon-border shadow-2xl">
                  <Target className="w-16 h-16 text-black drop-shadow-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 uppercase tracking-wide">{t('popular.no_campaigns')}</h3>
                <p className="text-muted-foreground mb-8">{t('popular.create_first')}</p>
                <Button asChild className="btn-cyber">
                  <Link href="/funds">
                    <Plus className="w-5 h-5 mr-2" />
                    {t('hero.create_campaign')}
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
                {t('popular.view_all')}
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
                  <Heart className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-foreground neon-text uppercase tracking-wide">{t('duxxan')}</h3>
              </div>
              <p className="text-muted-foreground">
                {t('footer.description')}
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.platform')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/campaigns" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">{t('campaigns')}</Link></li>
                <li><Link href="/funds" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">{t('hero.create_campaign')}</Link></li>
                <li><a href="#odul-sistemi" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">{t('daily.title')}</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.support')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">{t('footer.how_it_works')}</a></li>
                <li><a href="#" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">{t('footer.security')}</a></li>
                <li><a href="#" className="hover:text-cyber-cyan transition-colors uppercase tracking-wide">{t('footer.faq')}</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.connection')}</h4>
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
            <p>&copy; 2025 {t('duxxan')}. {t('footer.rights')}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
