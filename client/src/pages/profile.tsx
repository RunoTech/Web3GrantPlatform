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
  Gift
} from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { t } = useLanguage();

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
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Wallet className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('profile.access_title')}</h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {t('profile.connect_wallet_message')}
              </p>
            </div>
            <WalletConnectButton />
            <Button variant="outline" asChild className="mt-6">
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
  const activeCampaigns = userCampaigns.filter((c: Campaign) => c.status || c.isActive).length;
  const dailyParticipationCount = Array.isArray(dailyEntries) ? dailyEntries.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild size="sm">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back_to_home')}
                </Link>
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t('profile.my_profile')}</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-yellow-400">
                <AvatarFallback className="bg-yellow-400 text-white text-xl font-bold">
                  {address?.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </h2>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Connected
                  </Badge>
                  <Badge variant="outline">
                    {userCampaigns.length} {t('profile.campaigns')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Button asChild className="bg-yellow-400 hover:bg-yellow-500 text-black">
                <Link href="/funds">
                  <Target className="w-4 h-4 mr-2" />
                  {t('profile.new_campaign')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('profile.campaigns')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {userCampaigns.length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('profile.eth_raised')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {totalDonationsReceived.toFixed(4)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('profile.supporters')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {totalSupporters}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('profile.daily_participation')}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dailyParticipationCount}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-1">
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('profile.overview')}
              </TabsTrigger>
              <TabsTrigger 
                value="campaigns"
                className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
              >
                <Target className="w-4 h-4 mr-2" />
                {t('profile.my_campaigns')}
              </TabsTrigger>
              <TabsTrigger 
                value="rewards"
                className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
              >
                <Gift className="w-4 h-4 mr-2" />
                {t('profile.daily_rewards')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />
                    {t('profile.campaign_performance')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {t('profile.most_successful')}
                    </span>
                    <span className="font-semibold">
                      {userCampaigns.length > 0 
                        ? userCampaigns.reduce((max: Campaign, c: Campaign) => parseFloat(c.totalDonations || '0') > parseFloat(max.totalDonations || '0') ? c : max, userCampaigns[0]).title
                        : t('profile.none_yet')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {t('profile.average_donation')}
                    </span>
                    <span className="font-semibold">
                      {totalSupporters > 0 ? (totalDonationsReceived / totalSupporters).toFixed(4) : '0'} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Active Campaigns
                    </span>
                    <Badge variant="outline">{activeCampaigns}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                    {t('profile.activity')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {t('profile.this_month_participation')}
                    </span>
                    <span className="font-semibold">{dailyParticipationCount} {t('profile.days')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {t('profile.last_campaign')}
                    </span>
                    <span className="font-semibold">
                      {userCampaigns.length > 0 
                        ? userCampaigns[userCampaigns.length - 1].createdAt 
                          ? new Date(userCampaigns[userCampaigns.length - 1].createdAt).toLocaleDateString()
                          : t('profile.none_yet')
                        : t('profile.none_yet')
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  {t('profile.achievements')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg border-2 ${userCampaigns.length > 0 
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' 
                    : 'border-gray-200 dark:border-slate-700'
                  }`}>
                    <Award className={`w-8 h-8 mb-2 ${userCampaigns.length > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <h4 className="font-semibold text-sm">{t('profile.first_campaign')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {userCampaigns.length > 0 ? '✓ Completed' : 'Pending'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${totalSupporters >= 10
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' 
                    : 'border-gray-200 dark:border-slate-700'
                  }`}>
                    <Users className={`w-8 h-8 mb-2 ${totalSupporters >= 10 ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <h4 className="font-semibold text-sm">{t('profile.ten_supporters')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {totalSupporters}/10 supporters
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${dailyParticipationCount >= 7
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' 
                    : 'border-gray-200 dark:border-slate-700'
                  }`}>
                    <Calendar className={`w-8 h-8 mb-2 ${dailyParticipationCount >= 7 ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <h4 className="font-semibold text-sm">{t('profile.weekly_participation')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {dailyParticipationCount}/7 days
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-slate-700">
                    <Star className="w-8 h-8 mb-2 text-gray-400" />
                    <h4 className="font-semibold text-sm">Top Creator</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            {userCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {t('profile.no_campaigns_yet')}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    {t('profile.create_first_campaign')}
                  </p>
                  <Button asChild className="bg-yellow-400 hover:bg-yellow-500 text-black">
                    <Link href="/funds">
                      <Target className="w-4 h-4 mr-2" />
                      {t('profile.create_campaign')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-yellow-400" />
                  {t('profile.daily_reward_participation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {dailyParticipationCount}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Toplam {dailyParticipationCount} gün katılım gösterdiniz
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{t('profile.total_participation')}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{dailyParticipationCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{t('profile.this_month')}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{dailyParticipationCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}