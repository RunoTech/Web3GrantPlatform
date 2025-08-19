import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import LanguageSelector from "@/components/LanguageSelector";
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
  Award
} from "lucide-react";

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
                {siteTitle}
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/campaigns" className="text-muted-foreground hover:text-cyber-cyan font-medium transition-colors uppercase tracking-wide">
                {t('campaigns')}
              </Link>
              <Link href="/donations" className="text-muted-foreground hover:text-cyber-cyan font-medium transition-colors uppercase tracking-wide">
                {t('donations')}
              </Link>
              <Link href="/funds" className="text-muted-foreground hover:text-cyber-cyan font-medium transition-colors uppercase tracking-wide">
                {t('funds')}
              </Link>
              {isConnected && (
                <Link href="/profile" className="text-muted-foreground hover:text-cyber-cyan font-medium transition-colors uppercase tracking-wide">
                  {t('profile')}
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-3">
              <LanguageSelector />
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
            <div className="w-32 h-32 gradient-primary rounded-lg flex items-center justify-center mx-auto neon-border">
              <Heart className="w-16 h-16 text-background" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-wider uppercase">
                <span className="neon-text">
                  {heroTitle}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                {heroSubtitle}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
              <Button 
                asChild
                size="lg"
                className="cyber-cyan-bg px-8 py-4 font-bold uppercase tracking-wide btn-cyber"
                data-testid="button-create-campaign"
              >
                <Link href="/create-campaign">
                  <Target className="w-5 h-5 mr-2" />
                  {getSetting('hero_button_text', 'KAMPANYA OLUŞTUR')}
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                className="btn-cyber px-8 py-4"
                data-testid="button-explore-campaigns"
              >
                <Link href="/campaigns">
                  <Search className="w-5 h-5 mr-2" />
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
            <div className="cyber-card p-8 text-center">
              <div className="w-20 h-20 cyber-cyan-bg rounded-lg flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-background" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wide">{getSetting('feature1_title', 'ŞEFFAFLİK')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {getSetting('feature1_desc', 'Tüm bağışlar blockchain üzerinde kayıtlı')}
              </p>
            </div>

            <div className="cyber-card p-8 text-center">
              <div className="w-20 h-20 cyber-green-bg rounded-lg flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-10 h-10 text-background" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wide">{getSetting('feature2_title', 'KOMİSYONSUZ')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {getSetting('feature2_desc', 'Bağışların %100ü kampanya sahibine ulaşır')}
              </p>
            </div>

            <div className="cyber-card p-8 text-center">
              <div className="w-20 h-20 cyber-purple-bg rounded-lg flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wide">{getSetting('feature3_title', 'GÜVENLİK')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {getSetting('feature3_desc', 'Smart contract güvencesi ile korumalı')}
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center neon-border relative">
                <Gift className="w-6 h-6 text-background" />
                <div className="absolute -top-1 -right-1 w-4 h-4 cyber-yellow-bg rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-background">!</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold neon-text uppercase tracking-wide">
                  {t('daily.title')}
                </h2>
              </div>
            </div>
            
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              {t('daily.description')}
            </p>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Participation Card */}
            <div className="lg:col-span-2 cyber-card p-6 relative">
              <div className="absolute top-0 right-0 w-16 h-16 cyber-cyan-bg opacity-10 rounded-full blur-xl"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-wide flex items-center space-x-2">
                    <div className="w-6 h-6 cyber-green-bg rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-background">1</span>
                    </div>
                    <span>{t('daily.participation_process')}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="cyber-card p-3 border border-cyber-cyan/30">
                      <div className="w-6 h-6 cyber-cyan-bg rounded mb-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-background">1</span>
                      </div>
                      <span className="text-cyber-cyan font-medium uppercase tracking-wide">{t('daily.step1')}</span>
                    </div>
                    <div className="cyber-card p-3 border border-cyber-purple/30">
                      <div className="w-6 h-6 cyber-purple-bg rounded mb-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">2</span>
                      </div>
                      <span className="text-cyber-purple font-medium uppercase tracking-wide">{t('daily.step2')}</span>
                    </div>
                    <div className="cyber-card p-3 border border-cyber-green/30">
                      <div className="w-6 h-6 cyber-green-bg rounded mb-2 flex items-center justify-center">
                        <span className="text-xs font-bold text-background">3</span>
                      </div>
                      <span className="text-cyber-green font-medium uppercase tracking-wide">{t('daily.step3')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="text-center">
                  {isConnected ? (
                    <Button 
                      onClick={handleDailyReward}
                      size="default"
                      className="cyber-cyan-bg px-8 py-3 font-bold uppercase tracking-wide btn-cyber relative overflow-hidden group"
                      data-testid="button-daily-reward"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <DollarSign className="w-5 h-5 mr-2" />
                      {t('daily.participate_today')}
                    </Button>
                  ) : (
                    <div className="cyber-card px-6 py-3 neon-border relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10 rounded-lg"></div>
                      <span className="text-cyber-cyan font-medium uppercase tracking-wide relative z-10">
                        {t('daily.connect_wallet')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Winners Leaderboard */}
            <div className="cyber-card p-4 relative">
              <div className="absolute top-0 left-0 w-12 h-12 cyber-yellow-bg opacity-10 rounded-full blur-lg"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="w-5 h-5 text-cyber-yellow" />
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
                    {t('daily.yesterday_winners')}
                  </h3>
                </div>
                
                <div className="space-y-2" data-testid="winners-list">
                  {(lastWinners as any[]).length > 0 ? (
                    (lastWinners as any[]).slice(0, 5).map((winner: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-surface-3 rounded border border-cyber-green/20 hover:border-cyber-green/40 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 cyber-green-bg rounded-full flex items-center justify-center text-xs font-bold text-background">
                            #{index + 1}
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {winner.wallet.slice(0, 6)}...{winner.wallet.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-bold text-cyber-green">USDT</span>
                          <div className="w-1.5 h-1.5 cyber-green-bg rounded-full"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 bg-surface-3 rounded flex items-center justify-center mx-auto">
                        <Award className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-foreground font-semibold uppercase tracking-wide text-sm">
                          {t('daily.no_winners')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('daily.be_first')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics Footer */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 cyber-card border border-cyber-cyan/30">
              <div className="text-xl font-bold text-cyber-cyan mb-1">∞</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t('stats.total_rewards')}</div>
            </div>
            <div className="text-center p-4 cyber-card border border-cyber-purple/30">
              <div className="text-xl font-bold text-cyber-purple mb-1">24</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t('stats.hours_active')}</div>
            </div>
            <div className="text-center p-4 cyber-card border border-cyber-green/30">
              <div className="text-xl font-bold text-cyber-green mb-1">100%</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t('stats.secure')}</div>
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
                  <Heart className="w-6 h-6 text-background" />
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
