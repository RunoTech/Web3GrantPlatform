import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Users
} from "lucide-react";
import { format } from "date-fns";

interface DashboardAnalytics {
  donationStats: {
    overview: {
      totalDonated: string;
      donationCount: number;
      avgDonation: string;
      firstDonation: string;
      lastDonation: string;
    };
    byType: Array<{
      campaignType: string;
      count: number;
      total: string;
    }>;
    byNetwork: Array<{
      network: string;
      count: number;
      total: string;
    }>;
  };
  campaignAnalytics: {
    overview: {
      totalCampaigns: number;
      totalRaised: string;
      totalDonors: number;
      avgCampaignAmount: string;
      successRate: number;
    };
    campaigns: Array<any>;
    monthlyTrends: Array<{
      month: string;
      campaignsCreated: number;
      totalRaised: string;
      avgPerCampaign: string;
    }>;
  };
  timeAnalytics: {
    summary: {
      totalDonations: number;
      totalDonated: string;
      totalCampaigns: number;
      totalRewardDays: number;
    };
  };
  recentDonations: Array<{
    id: number;
    amount: string;
    campaignTitle: string;
    campaignType: string;
    createdAt: string;
    txHash: string;
    network: string;
  }>;
}

export default function UserDashboardAnalytics() {
  const { address, isConnected } = useWallet();
  
  const { data: analytics, isLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard", address],
    enabled: isConnected && !!address,
  });

  if (!isConnected || !address) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">Connect your wallet to view your analytics dashboard</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Analytics</h3>
          <p className="text-muted-foreground">There was an error loading your analytics data</p>
        </CardContent>
      </Card>
    );
  }

  const { donationStats, campaignAnalytics, timeAnalytics, recentDonations } = analytics;

  return (
    <div className="space-y-6" data-testid="user-dashboard-analytics">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Donated */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Donated</p>
                <p className="text-2xl font-bold">{parseFloat(donationStats.overview.totalDonated).toFixed(2)} USDT</p>
                <p className="text-xs text-muted-foreground">{donationStats.overview.donationCount} donations</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Created */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campaigns</p>
                <p className="text-2xl font-bold">{campaignAnalytics.overview.totalCampaigns}</p>
                <p className="text-xs text-muted-foreground">
                  {parseFloat(campaignAnalytics.overview.totalRaised).toFixed(2)} USDT raised
                </p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{campaignAnalytics.overview.successRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Campaign completion</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Donors */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Supporters</p>
                <p className="text-2xl font-bold">{campaignAnalytics.overview.totalDonors}</p>
                <p className="text-xs text-muted-foreground">Unique donors</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Donations by Campaign Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donationStats.byType.map((type) => (
                <div key={type.campaignType} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={type.campaignType === 'DONATE' ? 'default' : 'secondary'}>
                      {type.campaignType}
                    </Badge>
                    <span className="text-sm">{type.count} donations</span>
                  </div>
                  <span className="font-medium">{parseFloat(type.total).toFixed(2)} USDT</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Donations by Network */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Donations by Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donationStats.byNetwork.map((network) => (
                <div key={network.network} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{network.network.toUpperCase()}</Badge>
                    <span className="text-sm">{network.count} transactions</span>
                  </div>
                  <span className="font-medium">{parseFloat(network.total).toFixed(2)} USDT</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentDonations.length > 0 ? (
            <div className="space-y-4">
              {recentDonations.slice(0, 5).map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium">{donation.campaignTitle}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {donation.campaignType}
                      </Badge>
                      <span>{format(new Date(donation.createdAt), 'MMM dd, yyyy')}</span>
                      <span>•</span>
                      <span>{donation.network.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {parseFloat(donation.amount).toFixed(2)} USDT
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {donation.txHash.slice(0, 8)}...{donation.txHash.slice(-6)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No donations yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monthly Campaign Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignAnalytics.monthlyTrends.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-3 rounded border">
                <div>
                  <p className="font-medium">{month.month}</p>
                  <p className="text-sm text-muted-foreground">{month.campaignsCreated} campaigns</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{parseFloat(month.totalRaised).toFixed(2)} USDT</p>
                  <p className="text-sm text-muted-foreground">
                    Avg: {parseFloat(month.avgPerCampaign).toFixed(2)} USDT
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}