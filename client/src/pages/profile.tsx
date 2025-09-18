import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import Header from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Award,
  Target,
  Users,
  ArrowLeft,
  BarChart3,
  Trophy,
  Star,
  Clock,
  Gift,
  Settings,
  Activity,
  Coins,
  ArrowUp,
  ArrowDown,
  Eye,
  DollarSign,
  Share2
} from "lucide-react";
import type { Campaign } from "@shared/schema";
import UserDashboardAnalytics from "@/components/analytics/UserDashboardAnalytics";
import DonationHistoryTable from "@/components/analytics/DonationHistoryTable";

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // URL parameter'dan tab'ı al
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-8 max-w-lg mx-auto p-8">
            <div className="w-32 h-32 bg-binance-yellow rounded-2xl flex items-center justify-center mx-auto shadow-binance">
              <Wallet className="w-16 h-16 icon-on-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">{t('profile.access_title')}</h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {t('profile.connect_wallet_message')}
              </p>
            </div>
            <WalletConnectButton />
            <Button variant="outline" asChild className="mt-6 btn-secondary hover:border-primary">
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

  const userCampaigns = (campaigns as Campaign[]).filter((c: Campaign) => c.ownerWallet === address);
  const totalDonationsReceived = userCampaigns.reduce((sum: number, c: Campaign) => sum + parseFloat(c.totalDonations || '0'), 0);
  const totalSupporters = userCampaigns.reduce((sum: number, c: Campaign) => sum + (c.donationCount || 0), 0);
  const activeCampaigns = userCampaigns.filter((c: Campaign) => c.active).length;
  const dailyParticipationCount = Array.isArray(dailyEntries) ? dailyEntries.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="profile" />
      
      <div className="container-main section-spacing">
        {/* Modern Dashboard Header with Wallet Info */}
        <div className="mb-8">
          {/* Main Header Section */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-binance-yellow/10 rounded-2xl p-6 border border-primary/20 shadow-binance mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* User Profile & Wallet Info */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-3 border-primary shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-binance-yellow text-primary-foreground text-xl font-bold">
                      {address?.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{t('profile.welcome_back')}</h1>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200">
                      <Wallet className="w-3 h-3 mr-1" />
                      {t('profile.connected')}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-foreground">
                        {address?.slice(0, 8)}...{address?.slice(-6)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-primary" 
                        data-testid="button-copy-address"
                        onClick={() => {
                          if (address) {
                            navigator.clipboard.writeText(address);
                            toast({
                              title: t('profile.address_copied'),
                              description: t('profile.address_copied_desc')
                            });
                          }
                        }}
                        title={t('profile.copy_address')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {t('profile.last_activity_now')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="btn-binance btn-lg shadow-lg hover:transform hover:-translate-y-1 transition-all" data-testid="button-create-campaign">
                  <Link href="/create-campaign">
                    <Target className="w-5 h-5 mr-2" />
                    {t('profile.create_campaign')}
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="btn-secondary hover:border-primary hover:shadow-md" data-testid="button-affiliate">
                    <Link href="/affiliate">
                      <Share2 className="w-4 h-4 mr-2" />
                      {t('profile.affiliate')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="btn-secondary hover:border-primary hover:shadow-md" data-testid="button-daily-rewards">
                    <Link href="/daily-rewards">
                      <Gift className="w-4 h-4 mr-2" />
                      {t('profile.rewards')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Breadcrumb */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors" data-testid="link-home">
                {t('common.home')}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{t('profile.dashboard')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
        {/* Enhanced Interactive Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="card-standard cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50" 
            onClick={() => setActiveTab('campaigns')}
            data-testid="stat-card-campaigns"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.total_campaigns')}</p>
                  <p className="text-3xl font-bold text-foreground">{userCampaigns.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-binance-yellow to-yellow-400 shadow-binance rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 icon-on-primary" />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('profile.active')}: {activeCampaigns}</span>
                  <span>{activeCampaigns > 0 ? Math.round((activeCampaigns / userCampaigns.length) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${userCampaigns.length > 0 ? (activeCampaigns / userCampaigns.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">{t('profile.view_campaigns')}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activeCampaigns}/{userCampaigns.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-standard cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50" 
            onClick={() => setActiveTab('analytics')}
            data-testid="stat-card-raised"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.total_raised')}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-foreground">{totalDonationsReceived.toFixed(2)}</p>
                    <span className="text-lg font-semibold text-muted-foreground">USDT</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 shadow-binance rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Average per supporter */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{t('profile.avg_donation')}</span>
                  <span className="font-medium text-foreground">
                    {totalSupporters > 0 ? (totalDonationsReceived / totalSupporters).toFixed(2) : '0.00'} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm font-medium">{t('profile.view_analytics')}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    📈 {t('profile.growing')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-standard cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50" 
            onClick={() => setActiveTab('donations')}
            data-testid="stat-card-supporters"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.total_supporters')}</p>
                  <p className="text-3xl font-bold text-foreground">{totalSupporters}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-binance rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Supporter engagement metrics */}
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                    <div className="font-semibold text-foreground">{totalSupporters}</div>
                    <div className="text-muted-foreground">{t('profile.unique_donors')}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                    <div className="font-semibold text-foreground">{userCampaigns.length}</div>
                    <div className="text-muted-foreground">{t('profile.campaigns')}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-blue-500 font-medium">{t('profile.view_donations')}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  🤝 {t('profile.community')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-standard cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50" 
            onClick={() => setActiveTab('rewards')}
            data-testid="stat-card-rewards"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.daily_rewards')}</p>
                  <p className="text-3xl font-bold text-foreground">{dailyParticipationCount}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 shadow-binance rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Reward participation status */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{t('profile.participation_streak')}</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {dailyParticipationCount > 0 ? `${dailyParticipationCount} ${t('profile.days')}` : t('profile.no_streak')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-2 rounded-full ${
                        i < Math.min(dailyParticipationCount, 7) 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-500 font-medium">{t('profile.view_rewards')}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  🎯 {dailyParticipationCount > 0 ? t('profile.active') : t('profile.join_today')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Enhanced Mobile-First Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Tab Navigation - Horizontal Scroll */}
          <div className="block md:hidden mb-6">
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
              {[
                { id: 'overview', icon: BarChart3, label: t('profile.overview'), desc: t('profile.overview_desc'), color: 'from-blue-500 to-indigo-600' },
                { id: 'analytics', icon: Activity, label: t('profile.analytics'), desc: t('profile.analytics_desc'), color: 'from-purple-500 to-violet-600' },
                { id: 'donations', icon: DollarSign, label: t('profile.donations'), desc: t('profile.donations_desc'), color: 'from-green-500 to-emerald-600' },
                { id: 'campaigns', icon: Target, label: t('profile.campaigns'), desc: t('profile.campaigns_desc'), color: 'from-orange-500 to-red-600' },
                { id: 'rewards', icon: Trophy, label: t('profile.rewards'), desc: t('profile.rewards_desc'), color: 'from-yellow-500 to-orange-500' },
                { id: 'settings', icon: Settings, label: t('profile.settings'), desc: t('profile.settings_desc'), color: 'from-slate-500 to-gray-600' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-shrink-0 relative p-4 rounded-xl transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-br ' + tab.color + ' text-white shadow-lg transform -translate-y-1' 
                        : 'bg-white dark:bg-slate-800 border border-border hover:border-primary/50 hover:shadow-md'
                      }
                    `}
                    data-testid={`mobile-tab-${tab.id}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gradient-to-br ' + tab.color}`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-foreground'}`}>
                          {tab.label}
                        </div>
                        <div className={`text-xs truncate max-w-32 ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {tab.desc}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Tab Navigation - Enhanced Grid */}
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 p-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-border rounded-xl shadow-sm">
              {[
                { id: 'overview', icon: BarChart3, label: t('profile.overview'), desc: t('profile.overview_desc'), color: 'blue' },
                { id: 'analytics', icon: Activity, label: t('profile.analytics'), desc: t('profile.analytics_desc'), color: 'purple' },
                { id: 'donations', icon: DollarSign, label: t('profile.donations'), desc: t('profile.donations_desc'), color: 'green' },
                { id: 'campaigns', icon: Target, label: t('profile.campaigns'), desc: t('profile.campaigns_desc'), color: 'orange' },
                { id: 'rewards', icon: Trophy, label: t('profile.rewards'), desc: t('profile.rewards_desc'), color: 'yellow' },
                { id: 'settings', icon: Settings, label: t('profile.settings'), desc: t('profile.settings_desc'), color: 'slate' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className={`
                      flex-col p-4 h-auto space-y-2 transition-all duration-300 rounded-lg
                      data-[state=active]:bg-gradient-to-br data-[state=active]:shadow-lg
                      data-[state=active]:transform data-[state=active]:-translate-y-0.5
                      hover:shadow-md hover:scale-105
                      ${isActive ? (
                        tab.color === 'blue' ? 'data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600' :
                        tab.color === 'purple' ? 'data-[state=active]:from-purple-500 data-[state=active]:to-violet-600' :
                        tab.color === 'green' ? 'data-[state=active]:from-green-500 data-[state=active]:to-emerald-600' :
                        tab.color === 'orange' ? 'data-[state=active]:from-orange-500 data-[state=active]:to-red-600' :
                        tab.color === 'yellow' ? 'data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500' :
                        'data-[state=active]:from-slate-500 data-[state=active]:to-gray-600'
                      ) : ''}
                      data-[state=active]:text-white
                    `}
                    data-testid={`desktop-tab-${tab.id}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-gradient-to-br ' + (
                            tab.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                            tab.color === 'purple' ? 'from-purple-500 to-violet-600' :
                            tab.color === 'green' ? 'from-green-500 to-emerald-600' :
                            tab.color === 'orange' ? 'from-orange-500 to-red-600' :
                            tab.color === 'yellow' ? 'from-yellow-500 to-orange-500' :
                            'from-slate-500 to-gray-600'
                          )
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                    </div>
                    <div className="text-center space-y-1">
                      <div className="font-semibold text-sm">{tab.label}</div>
                      <div className={`text-xs hidden lg:block ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {tab.desc}
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <UserDashboardAnalytics />
          </TabsContent>
          
          <TabsContent value="donations" className="space-y-6 mt-6">
            <DonationHistoryTable />
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userCampaigns.slice(0, 3).map((campaign: Campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 surface-secondary border border-border rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{campaign.title}</p>
                          <p className="text-sm text-muted-foreground">{campaign.totalDonations || '0'} USDT raised</p>
                        </div>
                        <Badge variant="outline">{campaign.active ? 'Active' : 'Draft'}</Badge>
                      </div>
                    ))}
                    {userCampaigns.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No campaigns yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-foreground">
                        {userCampaigns.length > 0 ? Math.round((activeCampaigns / userCampaigns.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Donation</span>
                      <span className="font-medium text-foreground">
                        {totalSupporters > 0 ? (totalDonationsReceived / totalSupporters).toFixed(2) : '0'} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Daily Entries</span>
                      <span className="font-medium text-foreground">{dailyParticipationCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6 mt-6">
            {userCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <Card className="card-standard">
                <CardContent className="py-12 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first campaign to start raising funds for your cause.
                  </p>
                  <Button asChild className="btn-binance btn-md hover:transform hover:-translate-y-0.5">
                    <Link href="/create-campaign">
                      <Target className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6 mt-6">
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-primary" />
                  Daily Reward Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-binance-yellow rounded-full flex items-center justify-center mx-auto mb-4 shadow-binance">
                    <Calendar className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{dailyParticipationCount}</h3>
                  <p className="text-muted-foreground mb-4">Total participations</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="surface-secondary border border-border p-4 rounded-lg">
                      <p className="text-xl font-bold text-foreground">{dailyParticipationCount}</p>
                      <p className="text-sm text-muted-foreground">Days Participated</p>
                    </div>
                    <div className="surface-secondary border border-border p-4 rounded-lg">
                      <p className="text-xl font-bold text-foreground">{dailyParticipationCount}</p>
                      <p className="text-sm text-muted-foreground">Entries Made</p>
                    </div>
                  </div>
                  <Button asChild className="mt-6 btn-binance btn-md hover:transform hover:-translate-y-0.5">
                    <Link href="/daily-rewards">
                      <Trophy className="w-4 h-4 mr-2" />
                      Join Today's Reward
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 surface-secondary border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Wallet Address</h4>
                    <p className="text-sm text-muted-foreground">{address}</p>
                  </div>
                  <Badge variant="outline">Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 surface-secondary border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Account Status</h4>
                    <p className="text-sm text-muted-foreground">Verified and active</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Verified</Badge>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="outline" asChild className="w-full btn-secondary">
                    <Link href="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}