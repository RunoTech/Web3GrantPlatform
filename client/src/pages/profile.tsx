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

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { t } = useLanguage();
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
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Wallet className="w-16 h-16 text-black" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">{t('profile.access_title')}</h1>
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
  const activeCampaigns = userCampaigns.filter((c: Campaign) => c.active).length;
  const dailyParticipationCount = Array.isArray(dailyEntries) ? dailyEntries.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="profile" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Manage your campaigns, track rewards, and view analytics</p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/create-campaign">
                  <Target className="w-4 h-4 mr-2" />
                  Create Campaign
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/10">
                <Link href="/affiliate">
                  <Share2 className="w-4 h-4 mr-2" />
                  Affiliate Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="cyber-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                  <p className="text-3xl font-bold text-foreground">{userCampaigns.length}</p>
                </div>
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">Active: {activeCampaigns}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                  <p className="text-3xl font-bold text-foreground">{totalDonationsReceived.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-muted-foreground">USDT</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Supporters</p>
                  <p className="text-3xl font-bold text-foreground">{totalSupporters}</p>
                </div>
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Eye className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-blue-500 font-medium">Unique donors</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Daily Rewards</p>
                  <p className="text-3xl font-bold text-foreground">{dailyParticipationCount}</p>
                </div>
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-yellow-500 font-medium">Participations</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info Card */}
        <Card className="cyber-card mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {address?.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Connected
                    </Badge>
                    <Badge variant="outline">
                      Verified Wallet
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-surface-2">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center"
            >
              <Target className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userCampaigns.slice(0, 3).map((campaign: Campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
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

              <Card className="cyber-card">
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
              <Card className="cyber-card">
                <CardContent className="py-12 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first campaign to start raising funds for your cause.
                  </p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
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
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-primary" />
                  Daily Reward Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{dailyParticipationCount}</h3>
                  <p className="text-muted-foreground mb-4">Total participations</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-surface p-4 rounded-lg">
                      <p className="text-xl font-bold text-foreground">{dailyParticipationCount}</p>
                      <p className="text-sm text-muted-foreground">Days Participated</p>
                    </div>
                    <div className="bg-surface p-4 rounded-lg">
                      <p className="text-xl font-bold text-foreground">{dailyParticipationCount}</p>
                      <p className="text-sm text-muted-foreground">Entries Made</p>
                    </div>
                  </div>
                  <Button asChild className="mt-6 bg-primary hover:bg-primary/90">
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
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Wallet Address</h4>
                    <p className="text-sm text-muted-foreground">{address}</p>
                  </div>
                  <Badge variant="outline">Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Account Status</h4>
                    <p className="text-sm text-muted-foreground">Verified and active</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Verified</Badge>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="outline" asChild className="w-full">
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