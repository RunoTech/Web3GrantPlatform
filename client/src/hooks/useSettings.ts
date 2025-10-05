import { useQuery } from "@tanstack/react-query";

// Hook for getting all settings as a map
export function useSettings() {
  const { data: settings = {}, isLoading, error } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/platform-settings"],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Helper function to get a setting value with fallback
  const getSetting = (key: string, fallback: string = '') => {
    return settings[key] || fallback;
  };

  // Helper function to get number setting
  const getNumberSetting = (key: string, fallback: number = 0) => {
    const value = settings[key];
    return value ? parseFloat(value) : fallback;
  };

  // Helper function to get boolean setting
  const getBooleanSetting = (key: string, fallback: boolean = false) => {
    const value = settings[key];
    return value ? value.toLowerCase() === 'true' : fallback;
  };

  return {
    settings,
    isLoading,
    error,
    getSetting,
    getNumberSetting,
    getBooleanSetting,
    
    // Common settings shortcuts
    siteTitle: getSetting('site_title', 'DUXXAN'),
    siteDescription: getSetting('site_description', 'Web3 Donation Platform'),
    heroTitle: getSetting('hero_title', 'WEB3 DONASYON PLATFORMU'),
    heroSubtitle: getSetting('hero_subtitle', 'Şeffaf, güvenli ve komisyonsuz bağış sistemi'),
    
    // Pricing settings
    activationFeeEthereum: getNumberSetting('activation_fee_ethereum', 50),
    minDonationAmount: getNumberSetting('min_donation_amount', 1),
    maxCampaignGoal: getNumberSetting('max_campaign_goal', 1000000),
    campaignFeeDonate: getNumberSetting('campaign_fee_donate', 0),
    campaignFeeFund: getNumberSetting('campaign_fee_fund', 100),
    
    // Contact info
    contactEmail: getSetting('contact_email', 'info@duxxan.com'),
    supportEmail: getSetting('support_email', 'support@duxxan.com'),
    
    // Social links
    twitterUrl: getSetting('social_twitter', ''),
    telegramUrl: getSetting('social_telegram', ''),
    discordUrl: getSetting('social_discord', ''),
    
    // Daily Rewards Settings
    dailyRewardAmount: getNumberSetting('daily_reward_amount', 0),
    dailyTotalPrize: getNumberSetting('daily_total_prize', 0),
    drawsPerDay: getNumberSetting('draws_per_day', 0),
    winnersPerDraw: getNumberSetting('winners_per_draw', 0),
    totalDailyWinners: getNumberSetting('total_daily_winners', 0),
    morningDrawTime: getSetting('morning_draw_time', ''),
    afternoonDrawTime: getSetting('afternoon_draw_time', ''),
    eveningDrawTime: getSetting('evening_draw_time', ''),
    morningDrawPrize: getNumberSetting('morning_draw_prize', 0),
    afternoonDrawPrize: getNumberSetting('afternoon_draw_prize', 0),
    eveningDrawPrize: getNumberSetting('evening_draw_prize', 0),
    
    // Campaign Terms & Agreements
    donateCampaignTerms: getSetting('donate_campaign_terms', ''),
    fundCampaignTerms: getSetting('fund_campaign_terms', ''),
  };
}

// Hook specifically for admin settings management
export function useAdminSettings() {
  return useQuery({
    queryKey: ["/api/youhonor/settings-categorized"],
    staleTime: 1000 * 60, // Cache for 1 minute in admin
  });
}