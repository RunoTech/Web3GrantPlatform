import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import ShareButton from "@/components/ShareButton";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import Header from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/useSettings";
import { generateAffiliateShareLink } from "@/utils/share";
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
  Settings,
  Share2
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
      <Header currentPage="home" />

      {/* Referral Banner */}
      {showReferralBanner && referralCode && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert className="border-border bg-transparent py-4">
              <Users className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                🎉 You were referred by a DUXXAN user! Connect your wallet and get started to activate affiliate benefits.{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary hover:text-primary/80"
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
      <section className="relative section-spacing-lg overflow-hidden surface-primary">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-muted/10 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 sm:space-y-8 lg:space-y-12">
            <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-binance">
              <Heart className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 icon-on-primary" />
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-wider uppercase bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {t('hero.title')}
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
                {t('hero.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 justify-center items-center pt-6 sm:pt-8 px-4">
              <Button 
                asChild
                size="lg"
                className="btn-primary w-full sm:w-auto font-semibold"
                data-testid="button-create-campaign"
              >
                <Link href="/create-campaign">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                  {t('hero.create_campaign')}
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                className="btn-primary w-full sm:w-auto font-semibold"
                data-testid="button-explore-campaigns"
              >
                <Link href="/campaigns">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                  {t('hero.explore_campaigns')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing-lg surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 sm:space-y-6 lg:space-y-8 mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground uppercase tracking-wider">
              {t('features.why_title')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="card-standard p-6 lg:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-binance">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 icon-on-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-4 uppercase tracking-wide">{t('features.blockchain_security')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('features.blockchain_desc')}
              </p>
            </div>

            <div className="card-standard p-6 lg:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-success rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-binance">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-4 uppercase tracking-wide">{t('features.commission_free')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('features.commission_desc')}
              </p>
            </div>

            <div className="card-standard p-6 lg:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-binance">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wide">{t('features.fast_easy')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('features.fast_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 NEW: Affiliate Promotion Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10 border-y border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
                💰 EARN WITH AFFILIATE PROGRAM
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Refer friends to DUXXAN and earn rewards for every successful campaign creation and donation. Join our affiliate network today!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">Get your unique referral code and share with friends</p>
              </div>
              
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Track Performance</h3>
                <p className="text-sm text-muted-foreground">Monitor referrals and earnings in real-time dashboard</p>
              </div>
              
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">Get passive income from successful referrals and campaigns</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ShareButton 
                shareData={generateAffiliateShareLink()}
                variant="default"
                size="lg"
                className="bg-primary hover:bg-primary/90 px-8 py-4 font-bold text-primary-foreground shadow-binance"
              />
              <Button asChild variant="outline" size="lg" className="px-8 py-4">
                <Link href="/affiliate">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Affiliate Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Tether Reward Section */}
      <section id="odul-sistemi" className="section-spacing-lg surface-primary relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-muted/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-4 mb-6">
              <div className="w-24 h-24 bg-primary rounded-xl flex items-center justify-center relative shadow-binance">
                <Trophy className="w-12 h-12 text-primary-foreground" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-binance">
                  <Sparkles className="w-3 h-3 text-accent-foreground" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wide mb-2">
                  {t('daily.title')}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto"></div>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join daily for free, try your luck and win big rewards! Just connect your wallet and use your participation right once a day.
            </p>
            
            {/* Daily Prize Pool */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-success/10 px-6 py-3 rounded-full border border-primary/20">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold text-primary">1500 USDT</span>
                <span className="text-sm text-muted-foreground">daily total prize</span>
              </div>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-accent/10 to-muted/10 px-4 py-2 rounded-full border border-accent/20">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-accent">3 DRAWS</span>
                <span className="text-xs text-muted-foreground">daily</span>
              </div>
            </div>
          </div>
          
          {/* Daily Draw Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Morning Draw */}
            <div className="card-standard p-6 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-success/10 rounded-full blur-2xl"></div>
              <div className="absolute top-4 right-4 w-12 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">MORNING</span>
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="w-28 h-28 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-binance relative">
                  <Sun className="w-14 h-14 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">09:00 DRAW</h3>
                  <p className="text-3xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Morning draw</p>
                </div>
              </div>
            </div>

            {/* Afternoon Draw */}
            <div className="card-standard p-6 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-full blur-2xl"></div>
              <div className="absolute top-4 right-4 w-12 h-6 bg-accent rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-accent-foreground">NOON</span>
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="w-28 h-28 bg-accent rounded-xl flex items-center justify-center mx-auto shadow-binance relative">
                  <Sunset className="w-14 h-14 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-accent mb-1">15:00 DRAW</h3>
                  <p className="text-3xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Afternoon draw</p>
                </div>
              </div>
            </div>

            {/* Evening Draw */}
            <div className="card-standard p-6 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-success/10 to-secondary/10 rounded-full blur-2xl"></div>
              <div className="absolute top-4 right-4 w-12 h-6 bg-success rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">EVENING</span>
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="w-28 h-28 bg-success rounded-xl flex items-center justify-center mx-auto shadow-binance relative">
                  <Moon className="w-14 h-14 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-success mb-1">21:00 DRAW</h3>
                  <p className="text-3xl font-bold text-foreground">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Evening draw</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Participation Card */}
            <div className="card-standard p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-8 relative z-10">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-binance">
                    <Zap className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground uppercase tracking-wide">
                    PARTICIPATION PROCESS
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 border border-border rounded-lg">
                    <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary uppercase tracking-wide">Connect Wallet</h4>
                      <p className="text-sm text-muted-foreground">Connect with MetaMask or Trust Wallet</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 border border-border rounded-lg">
                    <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-accent uppercase tracking-wide">Daily Participation</h4>
                      <p className="text-sm text-muted-foreground">Join once a day for free</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 border border-border rounded-lg">
                    <div className="w-16 h-16 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-success uppercase tracking-wide">Win Rewards</h4>
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
                      className="btn-primary px-12 py-4 font-bold uppercase tracking-wide"
                      data-testid="button-daily-reward"
                    >
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-6 h-6" />
                        <span>JOIN TODAY</span>
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </Button>
                  ) : (
                    <div className="bg-muted/50 border border-border px-8 py-4 rounded-lg">
                      <span className="text-primary font-bold uppercase tracking-wide text-lg">
                        CONNECT WALLET FIRST
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Winners Leaderboard */}
            <div className="card-standard p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-success/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-binance">
                    <Trophy className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground uppercase tracking-wide">
                    YESTERDAY'S WINNERS
                  </h3>
                </div>
                
                <div className="space-y-3" data-testid="winners-list">
                  {(lastWinners as any[]).length > 0 ? (
                    (lastWinners as any[]).slice(0, 7).map((winner: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        index === 0 ? 'bg-gradient-to-r from-primary/10 to-success/10 border-primary/40' :
                        index === 1 ? 'bg-gradient-to-r from-accent/10 to-secondary/10 border-accent/40' :
                        index === 2 ? 'bg-gradient-to-r from-success/10 to-secondary/10 border-success/40' :
                        'bg-muted/50 border-border'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-primary text-primary-foreground' :
                            index === 1 ? 'bg-accent text-accent-foreground' :
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
                          {index === 0 ? <Trophy className="w-7 h-7 text-primary" /> :
                           index === 1 ? <Award className="w-7 h-7 text-accent" /> :
                           index === 2 ? <Gift className="w-7 h-7 text-success" /> :
                           <Star className="w-6 h-6 text-muted-foreground" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center mx-auto border border-border relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <Trophy className="w-10 h-10 text-muted-foreground relative z-10" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-foreground font-bold uppercase tracking-wide text-lg">
                          NO WINNERS YET
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
          
          {/* Enhanced Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 card-standard">
              <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3 shadow-binance">
                <Coins className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">1500</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">DAILY TOTAL</div>
            </div>
            
            <div className="text-center p-6 card-standard">
              <div className="w-20 h-20 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3 shadow-binance">
                <Star className="w-12 h-12 text-accent-foreground" />
              </div>
              <div className="text-2xl font-bold text-accent mb-1">21</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">TOTAL WINNERS</div>
            </div>
            
            <div className="text-center p-6 card-standard">
              <div className="w-20 h-20 bg-success rounded-xl flex items-center justify-center mx-auto mb-3 shadow-binance">
                <Clock className="w-12 h-12 text-white" />
              </div>
              <div className="text-2xl font-bold text-success mb-1">3</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">DRAW COUNT</div>
            </div>
            
            <div className="text-center p-6 card-standard">
              <div className="w-20 h-20 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3 shadow-binance">
                <Gem className="w-12 h-12 text-secondary-foreground" />
              </div>
              <div className="text-2xl font-bold text-secondary-foreground mb-1">100%</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">SECURE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns Section */}
      <section className="section-spacing-lg surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground uppercase tracking-wider">
              {t('popular.title')}
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
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center border border-border">
                      <Sparkles className="w-4 h-4 text-accent-foreground" />
                    </div>
                  </div>
                  <CampaignCard campaign={campaign} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-32 h-32 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6 shadow-binance">
                  <Target className="w-16 h-16 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 uppercase tracking-wide">{t('popular.no_campaigns')}</h3>
                <p className="text-muted-foreground mb-8">{t('popular.create_first')}</p>
                <Button asChild className="btn-primary">
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
              className="btn-secondary px-8 py-3"
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
      <footer className="surface-secondary border-t border-border section-spacing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center border border-border">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground uppercase tracking-wide">{t('duxxan')}</h3>
              </div>
              <p className="text-muted-foreground">
                {t('footer.description')}
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.platform')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/campaigns" className="hover:text-primary transition-colors uppercase tracking-wide">{t('campaigns')}</Link></li>
                <li><Link href="/funds" className="hover:text-primary transition-colors uppercase tracking-wide">{t('hero.create_campaign')}</Link></li>
                <li><a href="#odul-sistemi" className="hover:text-primary transition-colors uppercase tracking-wide">{t('daily.title')}</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.support')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors uppercase tracking-wide">{t('footer.how_it_works')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors uppercase tracking-wide">{t('footer.security')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors uppercase tracking-wide">{t('footer.faq')}</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.connection')}</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:border-primary border border-border transition-colors">
                  <span className="text-sm text-primary">TW</span>
                </a>
                <a href="#" className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:border-primary border border-border transition-colors">
                  <span className="text-sm text-primary">DC</span>
                </a>
                <a href="#" className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:border-primary border border-border transition-colors">
                  <span className="text-sm text-primary">TG</span>
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
