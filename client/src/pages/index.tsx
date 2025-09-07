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
      <section className="relative py-32 bg-background overflow-hidden">
        {/* Dynamic background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container-clean relative z-10">
          <div className="text-center space-y-16">
            <div className="relative inline-block">
              <div className="w-32 h-32 gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                <Heart className="w-16 h-16 text-black" />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur animate-pulse opacity-50"></div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="relative">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-tight">
                  {t('hero.title')}
                </h1>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg blur opacity-20 animate-pulse"></div>
              </div>
              
              <p className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto font-medium">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {t('hero.subtitle')}
                </span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-12">
              <Button 
                asChild
                size="lg"
                className="btn-clean px-12 py-6 text-xl font-bold"
                data-testid="button-create-campaign"
              >
                <Link href="/create-campaign">
                  <Target className="w-7 h-7 mr-3" />
                  {t('hero.create_campaign')}
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                className="btn-secondary px-12 py-6 text-xl font-bold"
                data-testid="button-explore-campaigns"
              >
                <Link href="/campaigns">
                  <Search className="w-7 h-7 mr-3" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="card p-10 text-center simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500"></div>
              <div className="w-20 h-20 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6">{t('features.blockchain_security')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('features.blockchain_desc')}
              </p>
            </div>

            <div className="card p-10 text-center simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <div className="w-20 h-20 gradient-success rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6">{t('features.commission_free')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('features.commission_desc')}
              </p>
            </div>

            <div className="card p-10 text-center simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Zap className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6">{t('features.fast_easy')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
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
          <div className="text-center mb-20">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Trophy className="w-12 h-12 text-black" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur animate-pulse opacity-40"></div>
            </div>
            
            <div className="relative inline-block mb-8">
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                {t('daily.title')}
              </h2>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur opacity-20 animate-pulse"></div>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium mb-10">
              Join daily for free, try your luck and win big rewards! Just connect your wallet and use your participation right once a day.
            </p>
            
            {/* Daily Prize Pool */}
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <div className="flex items-center space-x-4 gradient-success px-8 py-4 rounded-2xl shadow-xl">
                <DollarSign className="w-6 h-6 text-white" />
                <span className="text-2xl font-bold text-white">1500 USDT</span>
                <span className="text-sm text-white/80">daily total prize</span>
              </div>
              <div className="flex items-center space-x-4 gradient-secondary px-6 py-3 rounded-2xl shadow-xl">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-lg font-bold text-white">3 DRAWS</span>
                <span className="text-sm text-white/80">daily</span>
              </div>
            </div>
          </div>
          
          {/* Daily Draw Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Morning Draw */}
            <div className="card p-10 text-center simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <div className="inline-flex items-center justify-center px-6 py-3 gradient-primary rounded-full mb-8 shadow-lg">
                <span className="text-sm font-bold text-black">MORNING</span>
              </div>
              
              <div className="space-y-6">
                <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                  <Sun className="w-12 h-12 text-black" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur animate-pulse opacity-50"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">09:00 DRAW</h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Morning draw</p>
                </div>
              </div>
            </div>

            {/* Afternoon Draw */}
            <div className="card p-10 text-center simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 to-cyan-500"></div>
              <div className="inline-flex items-center justify-center px-6 py-3 gradient-secondary rounded-full mb-8 shadow-lg">
                <span className="text-sm font-bold text-white">AFTERNOON</span>
              </div>
              
              <div className="space-y-6">
                <div className="w-24 h-24 gradient-secondary rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                  <Sunset className="w-12 h-12 text-white" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-3xl blur animate-pulse opacity-50"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">15:00 DRAW</h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Afternoon draw</p>
                </div>
              </div>
            </div>

            {/* Evening Draw */}
            <div className="card p-10 text-center simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <div className="inline-flex items-center justify-center px-6 py-3 gradient-success rounded-full mb-8 shadow-lg">
                <span className="text-sm font-bold text-white">EVENING</span>
              </div>
              
              <div className="space-y-6">
                <div className="w-24 h-24 gradient-success rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                  <Moon className="w-12 h-12 text-white" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur animate-pulse opacity-50"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">21:00 DRAW</h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">500 USDT</p>
                  <p className="text-sm text-muted-foreground">7 winners • Evening draw</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Participate & Winners */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* How to Participate */}
            <div className="card p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"></div>
              <div className="space-y-10">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 gradient-accent rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                    <Zap className="w-10 h-10 text-white" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl blur animate-pulse opacity-50"></div>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    How to Participate
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-6 p-6 gradient-secondary rounded-2xl shadow-lg simple-hover">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Connect Wallet</h4>
                      <p className="text-white/80">Connect with MetaMask or Trust Wallet</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 p-6 gradient-primary rounded-2xl shadow-lg simple-hover">
                    <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-lg">Daily Participation</h4>
                      <p className="text-black/70">Join once a day for free</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 p-6 gradient-success rounded-2xl shadow-lg simple-hover">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Win Rewards</h4>
                      <p className="text-white/80">Try your luck and win USDT</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="text-center pt-6">
                  {isConnected ? (
                    <Button 
                      onClick={handleDailyReward}
                      size="lg"
                      className="btn-clean w-full py-6 text-xl font-bold"
                      data-testid="button-daily-reward"
                    >
                      <DollarSign className="w-6 h-6 mr-3" />
                      Join Today
                      <Sparkles className="w-6 h-6 ml-3" />
                    </Button>
                  ) : (
                    <div className="text-center py-6 gradient-accent rounded-2xl">
                      <span className="text-white font-bold text-lg">
                        Connect wallet to participate
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recent Winners */}
            <div className="card p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                    <Trophy className="w-10 h-10 text-black" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur animate-pulse opacity-50"></div>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Recent Winners
                  </h3>
                </div>
                
                <div className="space-y-4" data-testid="winners-list">
                  {(lastWinners as any[]).length > 0 ? (
                    (lastWinners as any[]).slice(0, 7).map((winner: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-6 rounded-2xl simple-hover shadow-lg ${
                        index === 0 ? 'gradient-primary' :
                        index === 1 ? 'gradient-secondary' :
                        index === 2 ? 'gradient-success' :
                        'bg-muted/30 border border-border'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg ${
                            index === 0 ? 'bg-black/20 text-black' :
                            index === 1 ? 'bg-white/20 text-white' :
                            index === 2 ? 'bg-white/20 text-white' :
                            'bg-muted text-foreground'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <span className={`font-mono text-lg font-medium ${
                              index <= 2 ? (index === 0 ? 'text-black' : 'text-white') : 'text-foreground'
                            }`}>
                              {winner.wallet.slice(0, 8)}...{winner.wallet.slice(-6)}
                            </span>
                            <div className={`text-sm ${
                              index <= 2 ? (index === 0 ? 'text-black/70' : 'text-white/80') : 'text-muted-foreground'
                            }`}>
                              {index === 0 ? '200 USDT' : index === 1 ? '100 USDT' : '50 USDT'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {index === 0 ? <Trophy className="w-6 h-6 text-black" /> :
                           index === 1 ? <Award className="w-6 h-6 text-white" /> :
                           index === 2 ? <Gift className="w-6 h-6 text-white" /> :
                           <Star className="w-5 h-5 text-muted-foreground" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 space-y-6">
                      <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                        <Trophy className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div className="space-y-3">
                        <div className="text-foreground font-bold text-xl">
                          No Winners Yet
                        </div>
                        <div className="text-muted-foreground text-lg">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-8 card simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Coins className="w-8 h-8 text-black" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">1500</div>
              <div className="text-sm text-muted-foreground font-semibold">Daily Total</div>
            </div>
            
            <div className="text-center p-8 card simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500"></div>
              <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">21</div>
              <div className="text-sm text-muted-foreground font-semibold">Total Winners</div>
            </div>
            
            <div className="text-center p-8 card simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <div className="w-16 h-16 gradient-success rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">3</div>
              <div className="text-sm text-muted-foreground font-semibold">Daily Draws</div>
            </div>
            
            <div className="text-center p-8 card simple-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
              <div className="w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Gem className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-sm text-muted-foreground font-semibold">Secure</div>
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
