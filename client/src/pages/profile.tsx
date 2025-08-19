import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  User, 
  Heart, 
  TrendingUp, 
  Award, 
  Calendar,
  Wallet,
  DollarSign,
  Target,
  Users,
  ArrowLeft,
  Crown,
  Gift
} from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  // Force dark mode for this page
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#000000';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/get-campaigns"],
    enabled: isConnected,
  });

  const { data: dailyEntries = [] } = useQuery({
    queryKey: ["/api/get-daily-entries", address],
    enabled: isConnected && !!address,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-10 max-w-lg mx-auto p-8">
            <div className="w-40 h-40 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto p-1 relative">
              <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                <Wallet className="w-20 h-20 text-cyan-400" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl animate-pulse opacity-20"></div>
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white font-mono uppercase tracking-wider">{t('profile.access_title')}</h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                {t('profile.connect_wallet_message')}
              </p>
            </div>
            <WalletConnectButton />
            <Button variant="ghost" asChild className="mt-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 font-mono uppercase tracking-wider">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back_to_home')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const userCampaigns = campaigns.filter((c: Campaign) => c.ownerWallet === address);
  const totalDonationsReceived = userCampaigns.reduce((sum: number, c: Campaign) => sum + (c.totalDonations || 0), 0);
  const totalSupporters = userCampaigns.reduce((sum: number, c: Campaign) => sum + (c.donationCount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      {/* Modern Cyber Header */}
      <header style={{ 
        borderBottom: '1px solid rgba(6, 182, 212, 0.2)', 
        backgroundColor: 'rgba(0, 0, 0, 0.9)', 
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center" style={{ height: '80px' }}>
            <Link href="/" style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #22d3ee, #a855f7)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0.1em',
              fontFamily: 'monospace'
            }}>
              DUXXAN
            </Link>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2" style={{ color: '#22d3ee' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#4ade80',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                <span style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>SYSTEM ACTIVE</span>
              </div>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home" style={{
          color: '#22d3ee',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.back_to_home')}
          </Link>
        </Button>

        {/* Modern Profile Header */}
        <div style={{
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '32px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              <div style={{
                width: '112px',
                height: '112px',
                background: 'linear-gradient(to bottom right, #06b6d4, #9333ea)',
                borderRadius: '12px',
                padding: '4px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000000',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(to right, #22d3ee, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    {address?.slice(2, 4).toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                right: '-8px',
                width: '32px',
                height: '32px',
                background: 'linear-gradient(to right, #facc15, #f97316)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Crown className="w-4 h-4" style={{ color: '#000000' }} />
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 style={{
                  fontSize: '2.25rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  marginBottom: '8px',
                  letterSpacing: '0.025em',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}>{t('profile.my_profile')}</h1>
                <div className="flex items-center space-x-3">
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '8px 16px',
                    borderRadius: '8px'
                  }}>
                    <span style={{
                      color: '#22d3ee',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {address?.slice(0, 12)}...{address?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1" style={{ color: '#4ade80' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#4ade80',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase'
                    }}>VERIFIED</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-6 bg-gray-800/50 border border-cyan-500/20 rounded-lg hover:border-cyan-400/50 transition-all">
                  <Target className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white mb-1">{userCampaigns.length}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">{t('profile.campaigns')}</p>
                </div>
                <div className="text-center p-6 bg-gray-800/50 border border-green-500/20 rounded-lg hover:border-green-400/50 transition-all">
                  <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white mb-1">{totalDonationsReceived.toFixed(3)}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">{t('profile.eth_raised')}</p>
                </div>
                <div className="text-center p-6 bg-gray-800/50 border border-purple-500/20 rounded-lg hover:border-purple-400/50 transition-all">
                  <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white mb-1">{totalSupporters}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">{t('profile.supporters')}</p>
                </div>
                <div className="text-center p-6 bg-gray-800/50 border border-orange-500/20 rounded-lg hover:border-orange-400/50 transition-all">
                  <Gift className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white mb-1">{dailyEntries.length}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">{t('profile.daily_participation')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Cyber Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-cyan-500/20 rounded-xl p-2">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 font-mono uppercase tracking-wider hover:text-cyan-400 transition-all"
            >
              {t('profile.overview')}
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 font-mono uppercase tracking-wider hover:text-cyan-400 transition-all"
            >
              {t('profile.my_campaigns')}
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 font-mono uppercase tracking-wider hover:text-cyan-400 transition-all"
            >
              {t('profile.daily_rewards')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Cyber Style */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-400/50 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span className="font-mono uppercase tracking-wider">{t('profile.campaign_performance')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.most_successful')}</span>
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-mono">
                      {userCampaigns.length > 0 ? 
                        userCampaigns.reduce((a, b) => (a.totalDonations || 0) > (b.totalDonations || 0) ? a : b).title.slice(0, 12) + '...' : 
                        t('profile.none_yet')
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.average_donation')}</span>
                    <span className="font-mono text-white font-bold">
                      {totalSupporters > 0 ? (totalDonationsReceived / totalSupporters).toFixed(3) : '0.000'} ETH
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/50 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="font-mono uppercase tracking-wider">{t('profile.activity')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.this_month_participation')}</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">
                      {dailyEntries.filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth()).length} {t('profile.days')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.last_campaign')}</span>
                    <span className="text-white font-mono text-sm">
                      {userCampaigns.length > 0 ? 
                        new Date(userCampaigns[userCampaigns.length - 1].createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US') : 
                        t('profile.none_yet')
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border border-yellow-500/20 backdrop-blur-sm hover:border-yellow-400/50 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="font-mono uppercase tracking-wider">{t('profile.achievements')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    {userCampaigns.length >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-green-400 font-mono text-sm uppercase tracking-wider">{t('profile.first_campaign')}</span>
                      </div>
                    )}
                    {totalSupporters >= 10 && (
                      <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">{t('profile.ten_supporters')}</span>
                      </div>
                    )}
                    {dailyEntries.length >= 7 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-purple-400 font-mono text-sm uppercase tracking-wider">{t('profile.weekly_participation')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Campaigns Tab - Cyber Style */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-wider">{t('profile.my_campaigns')}</h2>
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 border border-cyan-500/30">
                <Link href="/funds">
                  <Target className="w-4 h-4 mr-2" />
                  {t('profile.new_campaign')}
                </Link>
              </Button>
            </div>
            
            {userCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 p-1">
                  <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                    <Target className="w-16 h-16 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 font-mono uppercase tracking-wider">
                  {t('profile.no_campaigns_yet')}
                </h3>
                <p className="text-gray-400 mb-10 max-w-md mx-auto">
                  {t('profile.create_first_campaign')}
                </p>
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 px-8 py-3">
                  <Link href="/funds">
                    {t('profile.create_campaign')}
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Daily Rewards Tab - Cyber Style */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-10 backdrop-blur-sm">
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto p-1 relative">
                  <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                    <Gift className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl animate-pulse opacity-20"></div>
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-white mb-4 font-mono uppercase tracking-wider">{t('profile.daily_reward_participation')}</h2>
                  <p className="text-xl text-gray-400">
                    {t('profile.total_participation_days').replace('{{days}}', dailyEntries.length.toString())}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="text-center p-8 bg-gray-800/50 border border-green-500/20 rounded-xl hover:border-green-400/50 transition-all">
                    <Calendar className="w-10 h-10 text-green-400 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-white mb-2">{dailyEntries.length}</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-mono">{t('profile.total_participation')}</p>
                  </div>
                  <div className="text-center p-8 bg-gray-800/50 border border-orange-500/20 rounded-xl hover:border-orange-400/50 transition-all">
                    <TrendingUp className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-white mb-2">
                      {dailyEntries.filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth()).length}
                    </p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-mono">{t('profile.this_month')}</p>
                  </div>
                  <div className="text-center p-8 bg-gray-800/50 border border-purple-500/20 rounded-xl hover:border-purple-400/50 transition-all">
                    <Award className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-white mb-2">0.00</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-mono">{t('profile.earned_rewards')}</p>
                  </div>
                </div>
                
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 px-8 py-4 text-lg mt-8">
                  <Link href="/#odul-sistemi">
                    {t('profile.join_today')}
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}