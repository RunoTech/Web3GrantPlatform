import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/useSettings";
import { api } from "@/utils/api";
import { useState, useEffect } from "react";
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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showReferralBanner, setShowReferralBanner] = useState(false);

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setShowReferralBanner(true);
      // Store in localStorage for account creation
      localStorage.setItem('referralCode', refCode);
    }
  }, []);

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

      {/* Referral Banner */}
      {showReferralBanner && referralCode && (
        <div className="bg-gradient-to-r from-cyber-cyan/10 to-cyber-yellow/10 border-b border-cyber-cyan/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert className="border-cyber-cyan/30 bg-transparent py-4">
              <Users className="h-4 w-4 text-cyber-cyan" />
              <AlertDescription className="text-foreground">
                🎉 You were referred by a DUXXAN user! Connect your wallet and get started to activate affiliate benefits.{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-cyber-cyan hover:text-cyber-yellow"
                  onClick={() => setShowReferralBanner(false)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-24 bg-background">
        <div className="container-clean">
          <div className="text-center space-y-12">
            <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Heart className="w-12 h-12 text-primary-foreground" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                {t('hero.title')}
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-readable">
                {t('hero.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                asChild
                size="lg"
                className="btn-clean"
                data-testid="button-create-campaign"
              >
                <Link href="/create-campaign">
                  <Target className="w-5 h-5 mr-2" />
                  {t('hero.create_campaign')}
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="btn-clean-secondary"
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
      <section className="section-clean bg-muted/30">
        <div className="container-clean">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('features.why_title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-readable">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 text-center simple-hover">
              <div className="w-16 h-16 bg-info rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('features.blockchain_security')}</h3>
              <p className="text-muted-foreground text-readable">
                {t('features.blockchain_desc')}
              </p>
            </div>

            <div className="card p-8 text-center simple-hover">
              <div className="w-16 h-16 bg-success rounded-xl flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('features.commission_free')}</h3>
              <p className="text-muted-foreground text-readable">
                {t('features.commission_desc')}
              </p>
            </div>

            <div className="card p-8 text-center simple-hover">
              <div className="w-16 h-16 bg-warning rounded-xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('features.fast_easy')}</h3>
              <p className="text-muted-foreground text-readable">
                {t('features.fast_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Rewards Section */}
      <section id="odul-sistemi" className="section-clean bg-background">
        <div className="container-clean">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-warning rounded-xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('daily.title')}
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-readable">
              Join daily for free, try your luck and win big rewards! Just connect your wallet and use your participation right once a day.
            </p>
            
            {/* Daily Prize Pool */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="inline-flex items-center space-x-3 bg-success-light px-6 py-3 rounded-xl border border-border">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="text-lg font-semibold text-foreground">1500 USDT</span>
                <span className="text-sm text-muted-foreground">daily total prize</span>
              </div>
              <div className="inline-flex items-center space-x-3 bg-info-light px-4 py-2 rounded-xl border border-border">
                <Clock className="w-4 h-4 text-info" />
                <span className="text-sm font-semibold text-foreground">3 DRAWS</span>
                <span className="text-xs text-muted-foreground">daily</span>
              </div>
            </div>
          </div>
          
          {/* Daily Draw Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Morning Draw */}
            <div className="card p-6 text-center simple-hover">
              <div className="inline-flex items-center justify-center px-3 py-1 bg-warning-light rounded-full mb-4">
                <span className="text-xs font-semibold text-warning">MORNING</span>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-warning rounded-xl flex items-center justify-center mx-auto">
                  <Sun className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">09:00 DRAW</h3>
                  <p className="text-2xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Morning draw</p>
                </div>
              </div>
            </div>

            {/* Afternoon Draw */}
            <div className="card p-6 text-center simple-hover">
              <div className="inline-flex items-center justify-center px-3 py-1 bg-info-light rounded-full mb-4">
                <span className="text-xs font-semibold text-info">AFTERNOON</span>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-info rounded-xl flex items-center justify-center mx-auto">
                  <Sunset className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">15:00 DRAW</h3>
                  <p className="text-2xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Afternoon draw</p>
                </div>
              </div>
            </div>

            {/* Evening Draw */}
            <div className="card p-6 text-center simple-hover">
              <div className="inline-flex items-center justify-center px-3 py-1 bg-success-light rounded-full mb-4">
                <span className="text-xs font-semibold text-success">EVENING</span>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-success rounded-xl flex items-center justify-center mx-auto">
                  <Moon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">21:00 DRAW</h3>
                  <p className="text-2xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Evening draw</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Participate & Winners */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* How to Participate */}
            <div className="card p-8">
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto">
                    <Zap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    How to Participate
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 surface-muted rounded-xl">
                    <div className="w-12 h-12 bg-info rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Connect Wallet</h4>
                      <p className="text-sm text-muted-foreground">Connect with MetaMask or Trust Wallet</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 surface-muted rounded-xl">
                    <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Daily Participation</h4>
                      <p className="text-sm text-muted-foreground">Join once a day for free</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 surface-muted rounded-xl">
                    <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Win Rewards</h4>
                      <p className="text-sm text-muted-foreground">Try your luck and win USDT</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="text-center pt-4">
                  {isConnected ? (
                    <Button 
                      onClick={handleDailyReward}
                      size="lg"
                      className="btn-clean w-full"
                      data-testid="button-daily-reward"
                    >
                      <DollarSign className="w-5 h-5 mr-2" />
                      Join Today
                      <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                  ) : (
                    <div className="text-center py-4 bg-muted/50 rounded-lg border border-border">
                      <span className="text-muted-foreground font-medium">
                        Connect wallet to participate
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recent Winners */}
            <div className="card p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-warning rounded-xl flex items-center justify-center mx-auto">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Recent Winners
                  </h3>
                </div>
                
                <div className="space-y-3" data-testid="winners-list">
                  {(lastWinners as any[]).length > 0 ? (
                    (lastWinners as any[]).slice(0, 7).map((winner: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-lg border simple-hover ${
                        index === 0 ? 'bg-warning-light border-warning/20' :
                        index === 1 ? 'bg-info-light border-info/20' :
                        index === 2 ? 'bg-success-light border-success/20' :
                        'bg-muted/30 border-border'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index === 0 ? 'bg-warning text-white' :
                            index === 1 ? 'bg-info text-white' :
                            index === 2 ? 'bg-success text-white' :
                            'bg-muted text-foreground'
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
                          {index === 0 ? <Trophy className="w-5 h-5 text-warning" /> :
                           index === 1 ? <Award className="w-5 h-5 text-info" /> :
                           index === 2 ? <Gift className="w-5 h-5 text-success" /> :
                           <Star className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto">
                        <Trophy className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-foreground font-semibold">
                          No Winners Yet
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Be the first to join!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 card simple-hover">
              <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">1500</div>
              <div className="text-sm text-muted-foreground">Daily Total</div>
            </div>
            
            <div className="text-center p-6 card simple-hover">
              <div className="w-12 h-12 bg-info rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">21</div>
              <div className="text-sm text-muted-foreground">Total Winners</div>
            </div>
            
            <div className="text-center p-6 card simple-hover">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">3</div>
              <div className="text-sm text-muted-foreground">Daily Draws</div>
            </div>
            
            <div className="text-center p-6 card simple-hover">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('popular.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('popular.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" data-testid="popular-campaigns-grid">
            {(popularCampaigns as any[]).length > 0 ? (
              (popularCampaigns as any[]).map((campaign: any) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('popular.no_campaigns')}</h3>
                <p className="text-muted-foreground mb-8">{t('popular.create_first')}</p>
                <Button asChild className="btn-clean">
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
              className="btn-clean"
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
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t('duxxan')}</h3>
              </div>
              <p className="text-muted-foreground">
                {t('footer.description')}
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">{t('footer.platform')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/campaigns" className="hover:text-primary transition-colors">{t('campaigns')}</Link></li>
                <li><Link href="/funds" className="hover:text-primary transition-colors">{t('hero.create_campaign')}</Link></li>
                <li><a href="#odul-sistemi" className="hover:text-primary transition-colors">{t('daily.title')}</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">{t('footer.support')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer.how_it_works')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer.security')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer.faq')}</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">{t('footer.connection')}</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <span className="text-sm font-medium">TW</span>
                </a>
                <a href="#" className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <span className="text-sm font-medium">DC</span>
                </a>
                <a href="#" className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <span className="text-sm font-medium">TG</span>
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
