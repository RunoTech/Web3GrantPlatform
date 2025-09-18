import { useState, useEffect, useMemo } from "react";
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
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Share2,
  Plus,
  Search,
  LayoutGrid,
  Edit3,
  Pause,
  Play,
  MoreHorizontal,
  Trash2,
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  Lock,
  Mail,
  Smartphone,
  Monitor,
  Check,
  X
} from "lucide-react";
import type { Campaign } from "@shared/schema";
import UserDashboardAnalytics from "@/components/analytics/UserDashboardAnalytics";
import DonationHistoryTable from "@/components/analytics/DonationHistoryTable";

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Campaign Management State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Settings Integration
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  
  // Settings Form Schema
  const settingsSchema = z.object({
    // Notification Preferences
    emailCampaignUpdates: z.boolean(),
    emailNewDonations: z.boolean(), 
    emailDailyRewards: z.boolean(),
    pushInstantDonations: z.boolean(),
    pushGoalMilestones: z.boolean(),
    pushSecurityAlerts: z.boolean(),
    inAppActivityFeed: z.boolean(),
    inAppPopupNotifications: z.boolean(),
    inAppSoundNotifications: z.boolean(),
    // Privacy Settings
    profileVisibility: z.enum(["public", "private"]),
    analyticsData: z.boolean(),
    marketingCommunications: z.boolean(),
    thirdPartySharing: z.boolean(),
    // Theme & Language
    themePreference: z.enum(["light", "dark", "system"]),
    languagePreference: z.enum(["en", "tr", "es", "fr", "de", "ja"])
  });
  
  type SettingsFormData = z.infer<typeof settingsSchema>;
  
  // Load settings from localStorage with defaults
  const getStoredSettings = (): SettingsFormData => {
    const stored = localStorage.getItem('userSettings');
    const defaults: SettingsFormData = {
      emailCampaignUpdates: true,
      emailNewDonations: true,
      emailDailyRewards: false,
      pushInstantDonations: true,
      pushGoalMilestones: true,
      pushSecurityAlerts: true,
      inAppActivityFeed: true,
      inAppPopupNotifications: false,
      inAppSoundNotifications: false,
      profileVisibility: "public",
      analyticsData: true,
      marketingCommunications: false,
      thirdPartySharing: false,
      themePreference: theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'system',
      languagePreference: language as any
    };
    
    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  };
  
  // Settings Form
  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: getStoredSettings()
  });
  
  // Watch theme and language changes to apply immediately
  const watchedTheme = settingsForm.watch('themePreference');
  const watchedLanguage = settingsForm.watch('languagePreference');
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

  // Campaign Management Logic
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = userCampaigns;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(campaign => 
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => {
        const progress = campaign.targetAmount ? (parseFloat(campaign.totalDonations || '0') / parseFloat(campaign.targetAmount)) * 100 : 0;
        if (statusFilter === 'active') return campaign.active;
        if (statusFilter === 'draft') return !campaign.active;
        if (statusFilter === 'completed') return progress >= 100;
        return true;
      });
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'recent') return b.id - a.id;
      if (sortBy === 'amount') return parseFloat(b.totalDonations || '0') - parseFloat(a.totalDonations || '0');
      if (sortBy === 'progress') {
        const aProgress = a.targetAmount ? (parseFloat(a.totalDonations || '0') / parseFloat(a.targetAmount)) * 100 : 0;
        const bProgress = b.targetAmount ? (parseFloat(b.totalDonations || '0') / parseFloat(b.targetAmount)) * 100 : 0;
        return bProgress - aProgress;
      }
      if (sortBy === 'supporters') return (b.donationCount || 0) - (a.donationCount || 0);
      return 0;
    });
  }, [userCampaigns, searchTerm, statusFilter, sortBy]);

  // Campaign Management Actions
  const handleToggleSelection = (campaignId: number) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCampaigns(filteredAndSortedCampaigns.map(c => c.id));
  };

  const handleClearSelection = () => {
    setSelectedCampaigns([]);
  };

  const handleBulkActivate = () => {
    toast({
      title: t('profile.bulk_activate_success'),
      description: `${selectedCampaigns.length} campaigns activated`
    });
    setSelectedCampaigns([]);
  };

  const handleBulkPause = () => {
    toast({
      title: t('profile.bulk_pause_success'), 
      description: `${selectedCampaigns.length} campaigns paused`
    });
    setSelectedCampaigns([]);
  };

  const handleBulkDelete = () => {
    toast({
      title: t('profile.bulk_delete_success'),
      description: `${selectedCampaigns.length} campaigns deleted`
    });
    setSelectedCampaigns([]);
  };

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedCampaigns.length > 0);
  }, [selectedCampaigns]);
  
  // Apply theme changes immediately
  useEffect(() => {
    if (watchedTheme === 'light' && theme !== 'light') {
      // Apply light theme
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else if (watchedTheme === 'dark' && theme !== 'dark') {
      // Apply dark theme
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (watchedTheme === 'system') {
      // Apply system theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(systemTheme);
      localStorage.setItem('theme', systemTheme);
    }
  }, [watchedTheme, theme]);
  
  // Apply language changes immediately
  useEffect(() => {
    if (watchedLanguage && watchedLanguage !== language) {
      setLanguage(watchedLanguage as any);
    }
  }, [watchedLanguage, language, setLanguage]);
  
  // Settings Actions
  const handleSaveSettings = (data: SettingsFormData) => {
    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(data));
      
      // Apply theme if changed
      if (data.themePreference !== theme) {
        if (data.themePreference === 'light' || data.themePreference === 'dark') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(data.themePreference);
          localStorage.setItem('theme', data.themePreference);
        } else {
          // System theme
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(systemTheme);
          localStorage.setItem('theme', systemTheme);
        }
      }
      
      // Apply language if changed
      if (data.languagePreference !== language) {
        setLanguage(data.languagePreference as any);
      }
      
      toast({
        title: t('profile.settings_saved'),
        description: t('profile.settings_saved_desc'),
      });
    } catch (error) {
      toast({
        title: t('profile.settings_error'),
        description: t('profile.settings_error_desc'),
        variant: 'destructive'
      });
    }
  };
  
  const handleResetSettings = () => {
    const defaults = {
      emailCampaignUpdates: true,
      emailNewDonations: true,
      emailDailyRewards: false,
      pushInstantDonations: true,
      pushGoalMilestones: true,
      pushSecurityAlerts: true,
      inAppActivityFeed: true,
      inAppPopupNotifications: false,
      inAppSoundNotifications: false,
      profileVisibility: "public" as const,
      analyticsData: true,
      marketingCommunications: false,
      thirdPartySharing: false,
      themePreference: "system" as const,
      languagePreference: "en" as const
    };
    
    settingsForm.reset(defaults);
    localStorage.removeItem('userSettings');
    
    // Apply system theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(systemTheme);
    localStorage.setItem('theme', systemTheme);
    
    // Apply English language
    setLanguage('en');
    
    toast({
      title: t('profile.settings_reset'),
      description: t('profile.settings_reset_desc')
    });
  };

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
            {/* Quick Action Shortcuts */}
            <Card className="bg-gradient-to-r from-primary/5 to-binance-yellow/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  {t('profile.quick_actions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary hover:shadow-md transition-all" data-testid="quick-action-create">
                    <Link href="/create-campaign">
                      <Target className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">{t('profile.create_campaign')}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary hover:shadow-md transition-all" data-testid="quick-action-rewards">
                    <Link href="/daily-rewards">
                      <Gift className="w-6 h-6 text-yellow-600" />
                      <span className="text-sm font-medium">{t('profile.daily_rewards')}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary hover:shadow-md transition-all" data-testid="quick-action-affiliate">
                    <Link href="/affiliate">
                      <Share2 className="w-6 h-6 text-blue-600" />
                      <span className="text-sm font-medium">{t('profile.affiliate')}</span>
                    </Link>
                  </Button>
                  <Button onClick={() => setActiveTab('analytics')} variant="outline" className="h-20 flex-col gap-2 hover:border-primary hover:shadow-md transition-all" data-testid="quick-action-analytics">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                    <span className="text-sm font-medium">{t('profile.view_analytics')}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Metrics with Visual Progress */}
              <Card className="lg:col-span-2 card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                      {t('profile.performance_metrics')}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      📈 {t('profile.trending')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Success Rate with Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{t('profile.success_rate')}</span>
                      <span className="text-2xl font-bold text-foreground">
                        {userCampaigns.length > 0 ? Math.round((activeCampaigns / userCampaigns.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${userCampaigns.length > 0 ? (activeCampaigns / userCampaigns.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{activeCampaigns} {t('profile.active_campaigns')}</span>
                      <span>{userCampaigns.length} {t('profile.total_campaigns')}</span>
                    </div>
                  </div>
                  
                  {/* Average Donation with Comparison */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{t('profile.avg_donation')}</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-foreground">
                          {totalSupporters > 0 ? (totalDonationsReceived / totalSupporters).toFixed(2) : '0.00'}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">USDT</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-lg font-bold text-foreground">{totalSupporters}</div>
                        <div className="text-xs text-muted-foreground">{t('profile.supporters')}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-lg font-bold text-foreground">{totalDonationsReceived.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{t('profile.total_raised')}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-lg font-bold text-foreground">{userCampaigns.length}</div>
                        <div className="text-xs text-muted-foreground">{t('profile.campaigns')}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Daily Reward Streak */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{t('profile.reward_streak')}</span>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-xl font-bold text-foreground">{dailyParticipationCount}</span>
                        <span className="text-sm text-muted-foreground">{t('profile.days')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(30)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-6 rounded-full ${
                            i < Math.min(dailyParticipationCount, 30) 
                              ? 'bg-gradient-to-t from-yellow-400 to-orange-500' 
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {dailyParticipationCount > 0 
                        ? `🔥 ${t('profile.streak_active')} - ${t('profile.keep_going')}!`
                        : `💫 ${t('profile.start_streak')} - ${t('profile.join_today')}!`
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Goal Tracking */}
              <Card className="card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    {t('profile.goals')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Campaign Goal */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('profile.campaign_goal')}</span>
                      <span className="font-medium">{userCampaigns.length}/5</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min((userCampaigns.length / 5) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Fundraising Goal */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('profile.fundraising_goal')}</span>
                      <span className="font-medium">{totalDonationsReceived.toFixed(0)}/1000 USDT</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                        style={{ width: `${Math.min((totalDonationsReceived / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Supporter Goal */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('profile.supporter_goal')}</span>
                      <span className="font-medium">{totalSupporters}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full"
                        style={{ width: `${Math.min((totalSupporters / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Achievement Badge */}
                  <div className="pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {userCampaigns.length >= 5 ? '🏆' : 
                         userCampaigns.length >= 3 ? '🥈' :
                         userCampaigns.length >= 1 ? '🥉' : '🌟'
                        }
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {userCampaigns.length >= 5 ? t('profile.champion') : 
                         userCampaigns.length >= 3 ? t('profile.achiever') :
                         userCampaigns.length >= 1 ? t('profile.starter') : t('profile.beginner')
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Enhanced Recent Activity Timeline */}
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-primary" />
                    {t('profile.recent_activity')}
                  </div>
                  <Button onClick={() => setActiveTab('campaigns')} variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid="view-all-campaigns">
                    {t('profile.view_all')} →
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {userCampaigns.slice(0, 4).map((campaign: Campaign, index: number) => {
                      const progress = campaign.targetAmount ? (parseFloat(campaign.totalDonations || '0') / parseFloat(campaign.targetAmount)) * 100 : 0;
                      return (
                        <div key={campaign.id} className="relative">
                          {index < userCampaigns.slice(0, 4).length - 1 && (
                            <div className="absolute left-6 top-12 w-px h-8 bg-border" />
                          )}
                          <div className="flex items-start space-x-4 p-4 surface-secondary border border-border rounded-xl hover:shadow-md transition-all">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              campaign.active 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-br from-slate-400 to-slate-500'
                            }`}>
                              <Target className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-foreground truncate">{campaign.title}</h4>
                                <Badge variant={campaign.active ? 'default' : 'secondary'} className="ml-2">
                                  {campaign.active ? t('profile.active') : t('profile.draft')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {campaign.description || t('profile.no_description')}
                              </p>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="font-medium text-foreground">{campaign.totalDonations || '0'} USDT</div>
                                  <div className="text-muted-foreground">{t('profile.raised')}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{campaign.donationCount || 0}</div>
                                  <div className="text-muted-foreground">{t('profile.supporters')}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{progress.toFixed(0)}%</div>
                                  <div className="text-muted-foreground">{t('profile.progress')}</div>
                                </div>
                              </div>
                              {campaign.targetAmount && (
                                <div className="mt-3">
                                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        campaign.active 
                                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                          : 'bg-gradient-to-r from-slate-400 to-slate-500'
                                      }`}
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t('profile.no_campaigns')}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {t('profile.create_first_campaign')}
                    </p>
                    <Button asChild className="btn-binance btn-lg hover:transform hover:-translate-y-1 transition-all" data-testid="create-first-campaign">
                      <Link href="/create-campaign">
                        <Target className="w-5 h-5 mr-2" />
                        {t('profile.create_campaign')}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6 mt-6">
            {userCampaigns.length > 0 ? (
              <div className="space-y-6">
                {/* Campaign Management Header */}
                <Card className="bg-gradient-to-r from-primary/5 to-blue-500/10 border-primary/20">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center">
                          <Target className="w-5 h-5 mr-2 text-primary" />
                          {t('profile.campaign_management')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {userCampaigns.length} {t('profile.total_campaigns')} • {activeCampaigns} {t('profile.active')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" data-testid="create-new-campaign">
                          <Link href="/create-campaign">
                            <Plus className="w-4 h-4 mr-1" />
                            {t('profile.new_campaign')}
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="px-3" data-testid="toggle-view">
                          <LayoutGrid className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('profile.search_campaigns')}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                            data-testid="search-campaigns"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary" 
                          data-testid="filter-status"
                        >
                          <option value="all">{t('profile.all_status')}</option>
                          <option value="active">{t('profile.active')}</option>
                          <option value="draft">{t('profile.draft')}</option>
                          <option value="completed">{t('profile.completed')}</option>
                        </select>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary" 
                          data-testid="sort-campaigns"
                        >
                          <option value="recent">{t('profile.sort_recent')}</option>
                          <option value="amount">{t('profile.sort_amount')}</option>
                          <option value="progress">{t('profile.sort_progress')}</option>
                          <option value="supporters">{t('profile.sort_supporters')}</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Campaign Management Grid */}
                <div className="grid grid-cols-1 gap-6">
                  {filteredAndSortedCampaigns.map((campaign: Campaign, index: number) => {
                    const progress = campaign.targetAmount ? (parseFloat(campaign.totalDonations || '0') / parseFloat(campaign.targetAmount)) * 100 : 0;
                    const isCompleted = progress >= 100;
                    const statusColor = campaign.active ? 'green' : isCompleted ? 'blue' : 'gray';
                    
                    return (
                      <Card key={campaign.id} className={`card-standard hover:shadow-lg transition-all duration-300 ${
                        campaign.active ? 'border-green-200 dark:border-green-800' : 
                        isCompleted ? 'border-blue-200 dark:border-blue-800' : ''
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Bulk Selection Checkbox */}
                            <div className="pt-2">
                              <input
                                type="checkbox"
                                checked={selectedCampaigns.includes(campaign.id)}
                                onChange={() => handleToggleSelection(campaign.id)}
                                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                                data-testid={`select-campaign-${campaign.id}`}
                              />
                            </div>
                            
                            <div className="flex flex-col lg:flex-row gap-6 flex-1">
                            {/* Campaign Image/Icon */}
                            <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              campaign.active 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                                : isCompleted 
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                  : 'bg-gradient-to-br from-slate-400 to-slate-500'
                            }`}>
                              <Target className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                            </div>
                            
                            {/* Campaign Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-foreground truncate">{campaign.title}</h3>
                                    <Badge 
                                      variant={campaign.active ? 'default' : isCompleted ? 'secondary' : 'outline'}
                                      className={`${
                                        campaign.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                        isCompleted ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                      }`}
                                    >
                                      {campaign.active ? '🟢 ' + t('profile.active') : 
                                       isCompleted ? '🔵 ' + t('profile.completed') : 
                                       '⚪ ' + t('profile.draft')}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground mb-3 line-clamp-2">
                                    {campaign.description || t('profile.no_description')}
                                  </p>
                                  
                                  {/* Campaign Metrics Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                      <div className="text-lg font-bold text-foreground">{campaign.totalDonations || '0'}</div>
                                      <div className="text-xs text-muted-foreground">{t('profile.usdt_raised')}</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                      <div className="text-lg font-bold text-foreground">{campaign.targetAmount || 'N/A'}</div>
                                      <div className="text-xs text-muted-foreground">{t('profile.target_amount')}</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                      <div className="text-lg font-bold text-foreground">{campaign.donationCount || 0}</div>
                                      <div className="text-xs text-muted-foreground">{t('profile.supporters')}</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                      <div className="text-lg font-bold text-foreground">{progress.toFixed(0)}%</div>
                                      <div className="text-xs text-muted-foreground">{t('profile.progress')}</div>
                                    </div>
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  {campaign.targetAmount && (
                                    <div className="mb-4">
                                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                        <span>{t('profile.progress')}</span>
                                        <span>{progress.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                        <div 
                                          className={`h-3 rounded-full transition-all duration-500 ${
                                            campaign.active 
                                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                              : isCompleted 
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                : 'bg-gradient-to-r from-slate-400 to-slate-500'
                                          }`}
                                          style={{ width: `${Math.min(progress, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none" data-testid={`edit-campaign-${campaign.id}`}>
                                  <Edit3 className="w-4 h-4 mr-1" />
                                  {t('profile.edit')}
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none" data-testid={`view-campaign-${campaign.id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  {t('profile.view')}
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none" data-testid={`share-campaign-${campaign.id}`}>
                                  <Share2 className="w-4 h-4 mr-1" />
                                  {t('profile.share')}
                                </Button>
                                <Button 
                                  variant={campaign.active ? "destructive" : "secondary"} 
                                  size="sm" 
                                  className="flex-1 sm:flex-none" 
                                  data-testid={`toggle-status-${campaign.id}`}
                                >
                                  {campaign.active ? (
                                    <>
                                      <Pause className="w-4 h-4 mr-1" />
                                      {t('profile.pause')}
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-1" />
                                      {t('profile.activate')}
                                    </>
                                  )}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid={`more-options-${campaign.id}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Bulk Actions Bar - Shows when campaigns are selected */}
                {showBulkActions && (
                <Card className="card-standard border-primary/20 bg-primary/5" data-testid="bulk-actions">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-foreground">{selectedCampaigns.length} {t('profile.campaigns_selected')}</span>
                        <Button onClick={handleSelectAll} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="bulk-select-all">
                          {t('profile.select_all')}
                        </Button>
                        <Button onClick={handleClearSelection} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="bulk-clear-selection">
                          {t('profile.clear_selection')}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={handleBulkActivate} variant="outline" size="sm" data-testid="bulk-activate">
                          <Play className="w-4 h-4 mr-1" />
                          {t('profile.activate_selected')}
                        </Button>
                        <Button onClick={handleBulkPause} variant="outline" size="sm" data-testid="bulk-pause">
                          <Pause className="w-4 h-4 mr-1" />
                          {t('profile.pause_selected')}
                        </Button>
                        <Button onClick={handleBulkDelete} variant="destructive" size="sm" data-testid="bulk-delete">
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t('profile.delete_selected')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}
              </div>
            ) : (
              <Card className="card-standard">
                <CardContent className="py-16 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-binance-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{t('profile.no_campaigns_title')}</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                    {t('profile.no_campaigns_description')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="btn-binance btn-lg hover:transform hover:-translate-y-1 transition-all" data-testid="create-first-campaign">
                      <Link href="/create-campaign">
                        <Target className="w-5 h-5 mr-2" />
                        {t('profile.create_first_campaign')}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="btn-lg" data-testid="browse-campaigns">
                      <Link href="/donations">
                        <Eye className="w-5 h-5 mr-2" />
                        {t('profile.browse_campaigns')}
                      </Link>
                    </Button>
                  </div>
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
            <div className="space-y-6">
              {/* Account Information */}
              <Card className="card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary" />
                    {t('profile.account_information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 surface-secondary border border-border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{t('profile.wallet_address')}</h4>
                          <p className="text-sm text-muted-foreground font-mono">{address?.slice(0, 16)}...{address?.slice(-8)}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <Wallet className="w-3 h-3 mr-1" />
                          {t('profile.connected')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 surface-secondary border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">{t('profile.account_status')}</h4>
                          <p className="text-sm text-muted-foreground">{t('profile.verified_and_active')}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <Shield className="w-3 h-3 mr-1" />
                          {t('profile.verified')}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 surface-secondary border border-border rounded-lg">
                        <h4 className="font-medium text-foreground mb-3">{t('profile.account_stats')}</h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-foreground">{userCampaigns.length}</div>
                            <div className="text-xs text-muted-foreground">{t('profile.campaigns')}</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-foreground">{totalSupporters}</div>
                            <div className="text-xs text-muted-foreground">{t('profile.supporters')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Notification Preferences */}
              <Card className="card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-primary" />
                    {t('profile.notification_preferences')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('profile.notification_description')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Email Notifications */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-foreground">{t('profile.email_notifications')}</h4>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.campaign_updates')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.campaign_updates_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('emailCampaignUpdates')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="email-campaign-updates" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.new_donations')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.new_donations_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('emailNewDonations')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="email-donations" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.daily_rewards')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.daily_rewards_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('emailDailyRewards')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="email-rewards" />
                        </label>
                      </div>
                    </div>
                    
                    {/* Push Notifications */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-foreground">{t('profile.push_notifications')}</h4>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.instant_donations')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.instant_donations_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('pushInstantDonations')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="push-donations" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.goal_milestones')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.goal_milestones_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('pushGoalMilestones')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="push-milestones" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.security_alerts')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.security_alerts_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('pushSecurityAlerts')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="push-security" />
                        </label>
                      </div>
                    </div>
                    
                    {/* In-App Notifications */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Monitor className="w-5 h-5 text-purple-600" />
                        <h4 className="font-medium text-foreground">{t('profile.in_app_notifications')}</h4>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.activity_feed')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.activity_feed_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('inAppActivityFeed')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="inapp-activity" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.popup_notifications')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.popup_notifications_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('inAppPopupNotifications')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="inapp-popups" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.sound_notifications')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.sound_notifications_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('inAppSoundNotifications')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="inapp-sounds" />
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Privacy & Security Settings */}
              <Card className="card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-primary" />
                    {t('profile.privacy_security')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('profile.privacy_security_description')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        {t('profile.profile_visibility')}
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <div>
                            <span className="font-medium text-foreground">{t('profile.public_profile')}</span>
                            <p className="text-sm text-muted-foreground">{t('profile.public_profile_desc')}</p>
                          </div>
                          <input type="radio" {...settingsForm.register('profileVisibility')} value="public" className="w-4 h-4 text-primary" data-testid="visibility-public" />
                        </label>
                        <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <div>
                            <span className="font-medium text-foreground">{t('profile.private_profile')}</span>
                            <p className="text-sm text-muted-foreground">{t('profile.private_profile_desc')}</p>
                          </div>
                          <input type="radio" {...settingsForm.register('profileVisibility')} value="private" className="w-4 h-4 text-primary" data-testid="visibility-private" />
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-600" />
                        {t('profile.data_sharing')}
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.analytics_data')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.analytics_data_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('analyticsData')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="data-analytics" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.marketing_communications')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.marketing_communications_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('marketingCommunications')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="data-marketing" />
                        </label>
                        <label className="flex items-center justify-between p-3 surface-secondary rounded-lg cursor-pointer">
                          <div>
                            <span className="text-sm font-medium text-foreground">{t('profile.third_party_sharing')}</span>
                            <p className="text-xs text-muted-foreground">{t('profile.third_party_sharing_desc')}</p>
                          </div>
                          <input type="checkbox" {...settingsForm.register('thirdPartySharing')} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary" data-testid="data-third-party" />
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Theme & Language Preferences */}
              <Card className="card-standard">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Monitor className="w-5 h-5 mr-2 text-primary" />
                    {t('profile.appearance_language')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('profile.appearance_language_description')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-500" />
                        {t('profile.theme_preference')}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="flex flex-col items-center p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors group">
                          <Sun className="w-6 h-6 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium text-foreground">{t('profile.light_theme')}</span>
                          <input type="radio" {...settingsForm.register('themePreference')} value="light" className="mt-2 w-4 h-4 text-primary" data-testid="theme-light" />
                        </label>
                        <label className="flex flex-col items-center p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors group">
                          <Moon className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium text-foreground">{t('profile.dark_theme')}</span>
                          <input type="radio" {...settingsForm.register('themePreference')} value="dark" className="mt-2 w-4 h-4 text-primary" data-testid="theme-dark" />
                        </label>
                        <label className="flex flex-col items-center p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors group">
                          <Monitor className="w-6 h-6 text-slate-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium text-foreground">{t('profile.system_theme')}</span>
                          <input type="radio" {...settingsForm.register('themePreference')} value="system" className="mt-2 w-4 h-4 text-primary" data-testid="theme-system" />
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Globe className="w-4 h-4 text-green-500" />
                        {t('profile.language_preference')}
                      </h4>
                      <div className="space-y-3">
                        <select {...settingsForm.register('languagePreference')} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" data-testid="language-select">
                          <option value="en">🇺🇸 English</option>
                          <option value="tr">🇹🇷 Türkçe</option>
                          <option value="es">🇪🇸 Español</option>
                          <option value="fr">🇫🇷 Français</option>
                          <option value="de">🇩🇪 Deutsch</option>
                          <option value="ja">🇯🇵 日本語</option>
                        </select>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">{t('profile.language_note_title')}</h5>
                              <p className="text-sm text-blue-700 dark:text-blue-300">{t('profile.language_note_desc')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <Card className="card-standard">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={settingsForm.handleSubmit(handleSaveSettings)} className="btn-binance btn-lg flex-1 hover:transform hover:-translate-y-0.5 transition-all" data-testid="save-settings">
                      <Check className="w-5 h-5 mr-2" />
                      {t('profile.save_settings')}
                    </Button>
                    <Button onClick={handleResetSettings} variant="outline" className="btn-lg flex-1" data-testid="reset-settings">
                      <X className="w-5 h-5 mr-2" />
                      {t('profile.reset_to_defaults')}
                    </Button>
                    <Button variant="outline" asChild className="btn-lg">
                      <Link href="/" data-testid="back-home">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {t('profile.back_to_home')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}