import { useState } from "react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-8 max-w-md mx-auto p-8">
            <div className="w-32 h-32 gradient-primary rounded-3xl flex items-center justify-center mx-auto animate-float">
              <Wallet className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-slate-800">{t('profile.access_title')}</h1>
              <p className="text-lg text-slate-600">
                {t('profile.connect_wallet_message')}
              </p>
            </div>
            <WalletConnectButton />
            <Button variant="ghost" asChild className="mt-6">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
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
              <Link href="/" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/donations" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Bağışlar
              </Link>
              <Link href="/funds" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Fonlar
              </Link>
            </nav>

            <WalletConnectButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.back_to_home')}
          </Link>
        </Button>

        {/* Profile Header */}
        <div className="card-modern p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-blue-200 animate-glow">
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  {address?.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 gradient-accent rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('profile.my_profile')}</h1>
                <p className="text-slate-600 font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg inline-block">
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 modern-blue rounded-xl">
                  <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{userCampaigns.length}</p>
                  <p className="text-sm text-slate-600">{t('profile.campaigns')}</p>
                </div>
                <div className="text-center p-4 modern-green rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{totalDonationsReceived}</p>
                  <p className="text-sm text-slate-600">{t('profile.eth_raised')}</p>
                </div>
                <div className="text-center p-4 modern-purple rounded-xl">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{totalSupporters}</p>
                  <p className="text-sm text-slate-600">{t('profile.supporters')}</p>
                </div>
                <div className="text-center p-4 modern-orange rounded-xl">
                  <Gift className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{dailyEntries.length}</p>
                  <p className="text-sm text-slate-600">{t('profile.daily_participation')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 glass-card p-1">
            <TabsTrigger value="overview" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              {t('profile.overview')}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              {t('profile.my_campaigns')}
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              {t('profile.daily_rewards')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-modern">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>{t('profile.campaign_performance')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('profile.most_successful')}</span>
                    <Badge className="modern-green text-green-800">
                      {userCampaigns.length > 0 ? 
                        userCampaigns.reduce((a, b) => (a.totalDonations || 0) > (b.totalDonations || 0) ? a : b).title.slice(0, 15) + '...' : 
                        t('profile.none_yet')
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('profile.average_donation')}</span>
                    <span className="font-semibold">
                      {totalSupporters > 0 ? (totalDonationsReceived / totalSupporters).toFixed(3) : '0'} ETH
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>{t('profile.activity')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('profile.this_month_participation')}</span>
                    <Badge className="modern-purple text-purple-800">
                      {dailyEntries.filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth()).length} {t('profile.days')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('profile.last_campaign')}</span>
                    <span className="text-sm text-slate-500">
                      {userCampaigns.length > 0 ? 
                        new Date(userCampaigns[userCampaigns.length - 1].createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US') : 
                        t('profile.none_yet')
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <span>{t('profile.achievements')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {userCampaigns.length >= 1 && (
                      <Badge className="w-full justify-start modern-green text-green-800">
                        🎯 {t('profile.first_campaign')}
                      </Badge>
                    )}
                    {totalSupporters >= 10 && (
                      <Badge className="w-full justify-start modern-blue text-blue-800">
                        👥 {t('profile.ten_supporters')}
                      </Badge>
                    )}
                    {dailyEntries.length >= 7 && (
                      <Badge className="w-full justify-start modern-purple text-purple-800">
                        ⭐ {t('profile.weekly_participation')}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">{t('profile.my_campaigns')}</h2>
              <Button asChild className="gradient-primary text-white btn-modern">
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
              <div className="text-center py-16">
                <div className="w-24 h-24 modern-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                  {t('profile.no_campaigns_yet')}
                </h3>
                <p className="text-slate-600 mb-8">
                  {t('profile.create_first_campaign')}
                </p>
                <Button asChild className="gradient-primary text-white btn-modern">
                  <Link href="/funds">
                    {t('profile.create_campaign')}
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Daily Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="card-modern p-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 gradient-accent rounded-3xl flex items-center justify-center mx-auto animate-glow">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('profile.daily_reward_participation')}</h2>
                  <p className="text-lg text-slate-600">
                    {t('profile.total_participation_days', { days: dailyEntries.length })}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center p-6 modern-green rounded-xl">
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-slate-800">{dailyEntries.length}</p>
                    <p className="text-sm text-slate-600">{t('profile.total_participation')}</p>
                  </div>
                  <div className="text-center p-6 modern-orange rounded-xl">
                    <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-slate-800">
                      {dailyEntries.filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth()).length}
                    </p>
                    <p className="text-sm text-slate-600">{t('profile.this_month')}</p>
                  </div>
                  <div className="text-center p-6 modern-purple rounded-xl">
                    <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-slate-800">0</p>
                    <p className="text-sm text-slate-600">{t('profile.earned_rewards')}</p>
                  </div>
                </div>
                
                <Button asChild className="gradient-primary text-white btn-modern">
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